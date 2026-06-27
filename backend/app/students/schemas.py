from pydantic import BaseModel
from typing import List, Optional

class StudentBase(BaseModel):
    student_id: str
    name: str
    email: Optional[str] = None
    department: str
    year: Optional[str] = None
    division: Optional[str] = None
    semester: Optional[str] = None

class StudentCreate(StudentBase):
    pass

class StudentResponse(StudentBase):
    class Config:
        from_attributes = True

class StudentImportRequest(BaseModel):
    students: List[StudentCreate]
