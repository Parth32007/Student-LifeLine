import math
import logging
from typing import List, Dict, Any, Optional
import fitz # PyMuPDF
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.document import Document, DocumentChunk
from app.services.gemini_service import gemini_service
from app.schemas.document import RAGCitation

logger = logging.getLogger("lifeos.rag")

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    mag1 = math.sqrt(sum(a * a for a in v1))
    mag2 = math.sqrt(sum(b * b for b in v2))
    if mag1 == 0 or mag2 == 0:
        return 0.0
    return dot / (mag1 * mag2)

class RAGService:

    @staticmethod
    def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> List[Dict[str, Any]]:
        """Extracts text per page from PDF bytes using PyMuPDF."""
        pages_content = []
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            for page_idx in range(len(doc)):
                page = doc[page_idx]
                text = page.get_text("text")
                if text.strip():
                    pages_content.append({
                        "page_number": page_idx + 1,
                        "text": text.strip()
                    })
            doc.close()
        except Exception as e:
            logger.error(f"Error reading PDF with PyMuPDF: {e}")
        return pages_content

    @staticmethod
    def chunk_text(
        text: str,
        page_number: Optional[int] = None,
        chunk_size: int = 800,
        chunk_overlap: int = 150
    ) -> List[Dict[str, Any]]:
        """Splits text into overlapping chunks."""
        chunks = []
        start = 0
        text_len = len(text)

        while start < text_len:
            end = min(start + chunk_size, text_len)
            chunk = text[start:end].strip()
            if chunk:
                chunks.append({
                    "content": chunk,
                    "page_number": page_number,
                    "token_count": len(chunk.split())
                })
            start += (chunk_size - chunk_overlap)
        return chunks

    async def process_and_index_document(
        self,
        db: AsyncSession,
        document_id: str,
        file_bytes: bytes,
        file_type: str
    ) -> bool:
        """Processes uploaded document into indexed chunks with Gemini embeddings."""
        doc = await db.get(Document, document_id)
        if not doc:
            return False

        try:
            doc.status = "processing"
            await db.commit()

            raw_chunks = []
            if file_type == "pdf" or (doc.title and doc.title.lower().endswith(".pdf")):
                pages = self.extract_text_from_pdf_bytes(file_bytes)
                for p in pages:
                    p_chunks = self.chunk_text(p["text"], page_number=p["page_number"])
                    raw_chunks.extend(p_chunks)
            else:
                # Text or markdown
                text = file_bytes.decode("utf-8", errors="ignore")
                raw_chunks = self.chunk_text(text, page_number=1)

            if not raw_chunks:
                doc.status = "ready"
                doc.summary = "Uploaded document contains no extractable text."
                await db.commit()
                return True

            # Limit chunks if document is huge for fast indexing
            chunks_to_process = raw_chunks[:60]

            for idx, c in enumerate(chunks_to_process):
                # Generate embedding
                embedding = await gemini_service.generate_embedding(c["content"])
                chunk_obj = DocumentChunk(
                    document_id=document_id,
                    chunk_index=idx,
                    page_number=c["page_number"],
                    content=c["content"],
                    token_count=c["token_count"],
                    embedding=embedding
                )
                db.add(chunk_obj)

            # Generate AI summary and key points
            combined_sample = " ".join([c["content"] for c in chunks_to_process[:5]])[:3000]
            summary_prompt = (
                f"Analyze the following academic document excerpt:\n\n{combined_sample}\n\n"
                "Return a JSON object with:\n"
                "- 'summary': a 2-3 sentence overview of what this material teaches\n"
                "- 'key_points': list of 4-6 key concepts covered\n"
                "- 'formulas_definitions': list of objects with 'name' and 'description' for any major formulas or definitions"
            )
            ai_data = await gemini_service.generate_json(summary_prompt)
            if ai_data:
                doc.summary = ai_data.get("summary")
                doc.key_points = ai_data.get("key_points", [])
                doc.formulas_definitions = ai_data.get("formulas_definitions", [])

            doc.status = "ready"
            await db.commit()
            return True

        except Exception as e:
            logger.error(f"Error processing document {document_id}: {e}")
            doc.status = "failed"
            await db.commit()
            return False

    async def search_relevant_chunks(
        self,
        db: AsyncSession,
        user_id: str,
        query: str,
        subject_id: Optional[str] = None,
        top_k: int = 4
    ) -> List[RAGCitation]:
        """Performs vector search across user's document chunks."""
        query_embedding = await gemini_service.generate_embedding(query)

        # Get all documents for user (and filter by subject if specified)
        doc_stmt = select(Document).where(Document.user_id == user_id)
        if subject_id:
            doc_stmt = doc_stmt.where(Document.subject_id == subject_id)
        
        doc_res = await db.execute(doc_stmt)
        docs = {d.id: d for d in doc_res.scalars().all()}
        if not docs:
            return []

        # Get chunks
        chunk_stmt = select(DocumentChunk).where(
            DocumentChunk.document_id.in_(list(docs.keys()))
        )
        c_res = await db.execute(chunk_stmt)
        chunks = c_res.scalars().all()

        scored_chunks = []
        for c in chunks:
            if c.embedding:
                score = cosine_similarity(query_embedding, c.embedding)
            else:
                # Fallback keyword overlap score if embedding missing
                overlap = sum(1 for word in query.lower().split() if word in c.content.lower())
                score = overlap / max(len(query.split()), 1) * 0.5
            
            scored_chunks.append((score, c))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        top_matches = scored_chunks[:top_k]

        citations = []
        for score, c in top_matches:
            doc = docs.get(c.document_id)
            doc_title = doc.title if doc else "Uploaded Document"
            citations.append(RAGCitation(
                document_title=doc_title,
                document_id=c.document_id,
                page_number=c.page_number,
                snippet=c.content[:400],
                similarity_score=round(float(score), 3)
            ))
        return citations

rag_service = RAGService()
