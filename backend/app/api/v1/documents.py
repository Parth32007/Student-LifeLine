import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db, AsyncSessionLocal
from app.core.security import get_current_user, AuthenticatedUser
from app.models.document import Document
from app.models.subject import Subject
from app.schemas.document import DocumentRead, RAGQueryRequest, RAGCitation
from app.services.rag_service import rag_service

router = APIRouter()

async def process_document_background(document_id: str, file_bytes: bytes, file_type: str):
    """Background task so file uploads do not block the API."""
    async with AsyncSessionLocal() as session:
        try:
            await rag_service.process_and_index_document(
                db=session,
                document_id=document_id,
                file_bytes=file_bytes,
                file_type=file_type
            )
        except Exception as e:
            doc = await session.get(Document, document_id)
            if doc:
                doc.status = "failed"
                await session.commit()

@router.get("/", response_model=List[DocumentRead])
async def list_documents(
    subject_id: Optional[str] = None,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Document).where(Document.user_id == user.id)
    if subject_id:
        stmt = stmt.where(Document.subject_id == subject_id)
    stmt = stmt.order_by(Document.created_at.desc())
    res = await db.execute(stmt)
    docs = res.scalars().all()

    # Attach subject names
    subj_ids = {d.subject_id for d in docs if d.subject_id}
    subj_map = {}
    if subj_ids:
        s_stmt = select(Subject).where(Subject.id.in_(list(subj_ids)))
        s_res = await db.execute(s_stmt)
        subj_map = {s.id: s.name for s in s_res.scalars().all()}

    results = []
    for d in docs:
        read_obj = DocumentRead.model_validate(d)
        if d.subject_id and d.subject_id in subj_map:
            read_obj.subject_name = subj_map[d.subject_id]
        results.append(read_obj)
    return results

@router.post("/upload", response_model=DocumentRead, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    subject_id: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    contents = await file.read()
    file_size = len(contents)
    file_name = title or file.filename or "Uploaded Document"
    file_ext = os.path.splitext(file.filename or "")[1].lower().replace(".", "")

    doc = Document(
        user_id=user.id,
        subject_id=subject_id,
        title=file_name,
        file_type=file_ext or "pdf",
        file_size_bytes=file_size,
        status="processing"
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    # Dispatch indexing and embedding in background
    background_tasks.add_task(
        process_document_background,
        document_id=doc.id,
        file_bytes=contents,
        file_type=doc.file_type
    )

    return DocumentRead.model_validate(doc)

@router.get("/{document_id}", response_model=DocumentRead)
async def get_document(
    document_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    doc = await db.get(Document, document_id)
    if not doc or doc.user_id != user.id:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentRead.model_validate(doc)

@router.post("/search", response_model=List[RAGCitation])
async def search_vault_content(
    payload: RAGQueryRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Semantic content search across Knowledge Vault."""
    return await rag_service.search_relevant_chunks(
        db=db,
        user_id=user.id,
        query=payload.query,
        subject_id=payload.subject_id,
        top_k=payload.top_k or 4
    )

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    doc = await db.get(Document, document_id)
    if not doc or doc.user_id != user.id:
        raise HTTPException(status_code=404, detail="Document not found")

    await db.delete(doc)
    await db.commit()
    return None
