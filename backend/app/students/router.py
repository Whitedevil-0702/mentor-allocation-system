from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..core.database import get_db
from ..core.auth import get_current_user, require_roles
from ..models.models import Student, Allocation, ScoreData, Meeting
from .schemas import StudentResponse, StudentImportRequest

router = APIRouter(prefix="/api/v1/students", tags=["students"], dependencies=[Depends(get_current_user)])

@router.get("/", response_model=List[StudentResponse], dependencies=[Depends(require_roles("mentor", "admin"))])
def get_all_students(db: Session = Depends(get_db)):
    return db.query(Student).all()

@router.post("/import", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_roles("admin"))])
def import_students(payload: StudentImportRequest, db: Session = Depends(get_db)):
    try:
        imported_count = 0
        updated_count = 0
        
        # Fast query all existing students
        existing_ids = {s.student_id for s in db.query(Student.student_id).all()}

        for s_data in payload.students:
            if s_data.student_id in existing_ids:
                # Update existing student
                db_student = db.query(Student).filter(Student.student_id == s_data.student_id).first()
                if db_student:
                    db_student.name = s_data.name
                    db_student.email = s_data.email
                    db_student.department = s_data.department
                    db_student.year = s_data.year
                    db_student.division = s_data.division
                    db_student.semester = s_data.semester
                    updated_count += 1
            else:
                # Insert new student
                db_student = Student(**s_data.dict())
                db.add(db_student)
                imported_count += 1
        
        db.commit()
        return {
            "success": True,
            "imported": imported_count,
            "updated": updated_count,
            "total": imported_count + updated_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/", dependencies=[Depends(require_roles("admin"))])
def clear_all_students(db: Session = Depends(get_db)):
    try:
        # Cascade will delete Allocations, ScoreData, and Meetings tied to students
        db.query(Student).delete()
        db.commit()
        return {"success": True, "message": "All student records cleared successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
