from typing import Optional, List
from pydantic import BaseModel
from datetime import date, datetime

class CodingProblemBase(BaseModel):
    title: str
    platform: Optional[str] = "LeetCode"
    url: Optional[str] = None
    topic: str # Arrays, Trees, Graphs, DP, etc.
    difficulty: Optional[str] = "medium"
    language: Optional[str] = "Python"
    status: Optional[str] = "solved"
    attempts_count: Optional[int] = 1
    notes: Optional[str] = None
    solution_code: Optional[str] = None
    solved_at: Optional[date] = None

class CodingProblemCreate(CodingProblemBase):
    pass

class CodingProblemUpdate(BaseModel):
    title: Optional[str] = None
    platform: Optional[str] = None
    url: Optional[str] = None
    topic: Optional[str] = None
    difficulty: Optional[str] = None
    language: Optional[str] = None
    status: Optional[str] = None
    attempts_count: Optional[int] = None
    notes: Optional[str] = None
    solution_code: Optional[str] = None

class CodingProblemRead(CodingProblemBase):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class CodeAssistRequest(BaseModel):
    code: str
    language: Optional[str] = "Python"
    query_type: Optional[str] = "explain" # "explain", "find_bug", "optimize_complexity", "give_hint", "generate_test_cases"
    user_question: Optional[str] = None

class CodeAssistResponse(BaseModel):
    analysis: str
    hints: List[str] = []
    complexity_analysis: Optional[str] = None
    suggestions: List[str] = []
