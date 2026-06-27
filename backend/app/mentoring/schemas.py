from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum


class MeetingStatus(str, Enum):
    scheduled = "scheduled"
    completed = "completed"
    cancelled = "cancelled"

# --- MENTORS ---
class MentorBase(BaseModel):
    mentor_name: str
    email: Optional[str] = None
    department: str
    designation: Optional[str] = None
    max: int = 10

class MentorCreate(MentorBase):
    mentor_id: str

class MentorResponse(MentorBase):
    mentor_id: str

    class Config:
        from_attributes = True

# --- ALLOCATIONS ---
class AllocationResponse(BaseModel):
    student_id: str
    student_name: str
    department: str
    mentor_id: str
    mentor_name: str

class AllocationStats(BaseModel):
    totalStudents: int
    totalMentors: int
    allocated: int
    pending: int
    byDepartment: dict

# --- MEETINGS ---
class MeetingBase(BaseModel):
    mentor_id: str
    student_id: str
    date: datetime
    time: Optional[str] = None
    agenda: Optional[str] = None
    notes: Optional[str] = None
    status: MeetingStatus = MeetingStatus.scheduled

class MeetingCreate(MeetingBase):
    pass

class MeetingUpdate(BaseModel):
    date: Optional[datetime] = None
    time: Optional[str] = None
    agenda: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[MeetingStatus] = None

class MeetingResponse(MeetingBase):
    meeting_id: str
    student_name: str
    mentor_name: str
    department: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
