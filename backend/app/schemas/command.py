from typing import Optional, Dict, Any
from pydantic import BaseModel

class CommandExecuteRequest(BaseModel):
    command: str

class CommandExecuteResponse(BaseModel):
    intent: str # e.g. "create_task", "generate_plan", "query_weak_topics", "study_recommendation", "general_answer"
    message: str
    action_taken: bool
    data: Optional[Dict[str, Any]] = None
