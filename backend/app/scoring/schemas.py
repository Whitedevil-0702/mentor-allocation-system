from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class ScoreDataBase(BaseModel):
    attendance: float
    academic: float
    engagement: float
    placement: float

class ScoreDataCreate(ScoreDataBase):
    student_id: str

class ScoreBreakdown(BaseModel):
    attendance: float
    academic: float
    engagement: float
    placement: float

class ScoreResponse(BaseModel):
    student_id: str
    student_name: str
    department: str
    year: str
    score: float
    breakdown: ScoreBreakdown
    riskBand: str

class ScoreImportRequest(BaseModel):
    data: List[ScoreDataCreate]

class RiskSummary(BaseModel):
    green: int
    amber: int
    coral: int
    total: int

class DeptRiskResponse(BaseModel):
    department: str
    avgScore: float
    green: int
    amber: int
    coral: int
    total: int
