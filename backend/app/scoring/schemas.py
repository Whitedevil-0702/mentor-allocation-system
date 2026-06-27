from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from enum import Enum


class RiskBand(str, Enum):
    Green = "Green"
    Amber = "Amber"
    Coral = "Coral"

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
    riskBand: RiskBand

class ScoreImportRequest(BaseModel):
    data: List[ScoreDataCreate]

class RiskSummary(BaseModel):
    Green: int
    Amber: int
    Coral: int
    total: int

class DeptRiskResponse(BaseModel):
    department: str
    avgScore: float
    Green: int
    Amber: int
    Coral: int
    total: int
