from typing import Optional, List, Any
from pydantic import BaseModel
from datetime import datetime

class YouTubeResourceBase(BaseModel):
    subject_id: Optional[str] = None
    url: str

class YouTubeAnalyzeRequest(BaseModel):
    url: str
    subject_id: Optional[str] = None
    custom_notes: Optional[str] = None

class YouTubeResourceRead(BaseModel):
    id: str
    user_id: str
    subject_id: Optional[str] = None
    url: str
    video_id: str
    title: str
    thumbnail_url: Optional[str] = None
    duration_seconds: int
    transcript: Optional[str] = None
    summary: Optional[str] = None
    key_concepts: List[Any] = []
    timestamps: List[Any] = []
    is_watched: str = "false"
    created_at: datetime
    subject_name: Optional[str] = None

    class Config:
        from_attributes = True
