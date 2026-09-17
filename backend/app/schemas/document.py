from typing import Optional, List, Any
from pydantic import BaseModel
from datetime import datetime

class DocumentChunkRead(BaseModel):
    id: str
    chunk_index: int
    page_number: Optional[int] = None
    content: str
    token_count: Optional[int] = 0

    class Config:
        from_attributes = True

class DocumentRead(BaseModel):
    id: str
    user_id: str
    subject_id: Optional[str] = None
    title: str
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    file_size_bytes: Optional[int] = 0
    status: str
    summary: Optional[str] = None
    key_points: Optional[List[str]] = []
    formulas_definitions: Optional[List[Any]] = []
    created_at: datetime
    subject_name: Optional[str] = None

    class Config:
        from_attributes = True

class RAGCitation(BaseModel):
    document_title: str
    document_id: str
    page_number: Optional[int] = None
    snippet: str
    similarity_score: Optional[float] = None

class RAGQueryRequest(BaseModel):
    query: str
    subject_id: Optional[str] = None
    top_k: Optional[int] = 4
