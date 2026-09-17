import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, BigInteger, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    file_url = Column(String, nullable=True)
    file_type = Column(String, nullable=True)
    file_size_bytes = Column(BigInteger, default=0)
    status = Column(String, default="uploading") # uploading, processing, ready, failed
    summary = Column(String, nullable=True)
    key_points = Column(JSON, default=list)
    formulas_definitions = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id = Column(String, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    page_number = Column(Integer, nullable=True)
    content = Column(String, nullable=False)
    token_count = Column(Integer, default=0)
    embedding = Column(JSON, nullable=True) # Stored as list of floats (768 dimensions)

    document = relationship("Document", back_populates="chunks")

class YouTubeResource(Base):
    __tablename__ = "youtube_resources"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    url = Column(String, nullable=False)
    video_id = Column(String, nullable=False)
    title = Column(String, nullable=False)
    thumbnail_url = Column(String, nullable=True)
    duration_seconds = Column(Integer, default=0)
    transcript = Column(String, nullable=True)
    summary = Column(String, nullable=True)
    key_concepts = Column(JSON, default=list)
    timestamps = Column(JSON, default=list)
    is_watched = Column(String, default="false")
    created_at = Column(DateTime, default=datetime.utcnow)
