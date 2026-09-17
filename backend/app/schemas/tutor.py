from typing import Optional, List, Any
from pydantic import BaseModel, model_validator
from datetime import datetime

class MessageCreate(BaseModel):
    conversation_id: Optional[str] = None
    subject_id: Optional[str] = None
    content: Optional[str] = None
    message: Optional[str] = None
    mode: Optional[str] = "general" # general, notes_rag, explain, exam_prep, coding, quiz_me

    @model_validator(mode="before")
    @classmethod
    def reconcile_content(cls, data: Any):
        if isinstance(data, dict):
            if not data.get("content") and data.get("message"):
                data["content"] = data["message"]
        return data

class MessageRead(BaseModel):
    id: str
    conversation_id: str
    user_id: str
    role: str
    content: str
    citations: List[Any] = []
    created_at: datetime

    class Config:
        from_attributes = True

class ConversationRead(BaseModel):
    id: str
    user_id: str
    subject_id: Optional[str] = None
    title: str
    mode: str
    created_at: datetime
    updated_at: datetime
    subject_name: Optional[str] = None
    messages: List[MessageRead] = []

    class Config:
        from_attributes = True
