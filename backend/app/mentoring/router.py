from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime, timezone
from ..core.database import get_db
from ..core.auth import get_current_user, require_roles
from ..models.models import Mentor, Student, Allocation, Meeting, MeetingStatus as MeetingStatusEnum
from .schemas import (
    MentorBase, MentorResponse, MentorCreate,
    AllocationResponse, AllocationStats,
    MeetingResponse, MeetingCreate, MeetingUpdate
)
from .allocation import run_auto_allocation, get_allocation_stats

# --- ROUTER DEFINITIONS ---
mentors_router = APIRouter(prefix="/api/v1/mentors", tags=["mentors"], dependencies=[Depends(get_current_user)])
allocations_router = APIRouter(prefix="/api/v1/allocations", tags=["allocations"], dependencies=[Depends(get_current_user)])
meetings_router = APIRouter(prefix="/api/v1/meetings", tags=["meetings"], dependencies=[Depends(get_current_user)])
dashboard_router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"], dependencies=[Depends(get_current_user)])

# ============================================
# MENTOR CRUD ENDPOINTS
# ============================================

@mentors_router.get("/", response_model=List[MentorResponse], dependencies=[Depends(require_roles("mentor", "admin"))])
def get_all_mentors(db: Session = Depends(get_db)):
    return db.query(Mentor).all()

@mentors_router.post("/", response_model=MentorResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_roles("admin"))])
def create_mentor(payload: MentorCreate, db: Session = Depends(get_db)):
    db_m = db.query(Mentor).filter(Mentor.mentor_id == payload.mentor_id).first()
    if db_m:
        raise HTTPException(status_code=400, detail="Mentor ID already exists")
    new_m = Mentor(**payload.dict())
    db.add(new_m)
    db.commit()
    db.refresh(new_m)
    return new_m

@mentors_router.put("/{mentor_id}", response_model=MentorResponse, dependencies=[Depends(require_roles("admin"))])
def update_mentor(mentor_id: str, payload: MentorBase, db: Session = Depends(get_db)):
    db_m = db.query(Mentor).filter(Mentor.mentor_id == mentor_id).first()
    if not db_m:
        raise HTTPException(status_code=404, detail="Mentor not found")
    db_m.mentor_name = payload.mentor_name
    db_m.email = payload.email
    db_m.department = payload.department
    db_m.designation = payload.designation
    db_m.max = payload.max
    db.commit()
    db.refresh(db_m)
    return db_m

@mentors_router.delete("/{mentor_id}", dependencies=[Depends(require_roles("admin"))])
def delete_mentor(mentor_id: str, db: Session = Depends(get_db)):
    db_m = db.query(Mentor).filter(Mentor.mentor_id == mentor_id).first()
    if not db_m:
        raise HTTPException(status_code=404, detail="Mentor not found")
    db.delete(db_m)
    db.commit()
    return {"success": True, "message": "Mentor deleted successfully."}


# ============================================
# ALLOCATION ENDPOINTS
# ============================================

@allocations_router.get("/", response_model=List[dict], dependencies=[Depends(require_roles("mentor", "admin"))])
def get_raw_allocations(db: Session = Depends(get_db)):
    allocs = db.query(Allocation).all()
    return [{"student_id": a.student_id, "mentor_id": a.mentor_id} for a in allocs]

@allocations_router.post("/run", dependencies=[Depends(require_roles("admin"))])
def run_allocation_engine(db: Session = Depends(get_db)):
    try:
        return run_auto_allocation(db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@allocations_router.get("/details", response_model=List[AllocationResponse], dependencies=[Depends(require_roles("mentor", "admin"))])
def get_detailed_allocations(db: Session = Depends(get_db)):
    allocs = db.query(Allocation).all()
    enriched = []
    for a in allocs:
        student = db.query(Student).filter(Student.student_id == a.student_id).first()
        mentor = db.query(Mentor).filter(Mentor.mentor_id == a.mentor_id).first()
        enriched.append({
            "student_id": a.student_id,
            "student_name": student.name if student else "Unknown",
            "department": student.department if student else "",
            "mentor_id": a.mentor_id,
            "mentor_name": mentor.mentor_name if mentor else "Unknown"
        })
    return enriched

@allocations_router.get("/unallocated", response_model=List[dict], dependencies=[Depends(require_roles("mentor", "admin"))])
def get_unallocated_students(db: Session = Depends(get_db)):
    allocated_ids = db.query(Allocation.student_id).subquery()
    unallocated = db.query(Student).filter(Student.student_id.not_in(allocated_ids)).all()
    return [{"student_id": s.student_id, "name": s.name, "department": s.department} for s in unallocated]

@allocations_router.delete("/", dependencies=[Depends(require_roles("admin"))])
def clear_all_allocations(db: Session = Depends(get_db)):
    try:
        db.query(Allocation).delete()
        db.commit()
        return {"success": True, "message": "All allocations cleared successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# MEETING CRUD ENDPOINTS
# ============================================

@meetings_router.get("/", response_model=List[MeetingResponse], dependencies=[Depends(require_roles("mentor", "admin"))])
def get_all_meetings(db: Session = Depends(get_db)):
    meetings = db.query(Meeting).all()
    students = {s.student_id: s for s in db.query(Student).all()}
    mentors = {m.mentor_id: m for m in db.query(Mentor).all()}

    enriched = []
    for m in meetings:
        stud = students.get(m.student_id)
        ment = mentors.get(m.mentor_id)
        enriched.append({
            "meeting_id": m.meeting_id,
            "mentor_id": m.mentor_id,
            "student_id": m.student_id,
            "date": m.date,
            "time": m.time,
            "agenda": m.agenda,
            "notes": m.notes,
            "status": m.status,
            "student_name": stud.name if stud else "Unknown",
            "mentor_name": ment.mentor_name if ment else "Unknown",
            "department": stud.department if stud else "",
            "created_at": m.created_at,
            "updated_at": m.updated_at
        })
    return enriched

@meetings_router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_roles("mentor", "admin"))])
def schedule_new_meeting(payload: MeetingCreate, db: Session = Depends(get_db)):
    # Generate meeting ID: MTG + pad(total_meetings + 1)
    meetings = db.query(Meeting).all()
    idx = len(meetings) + 1
    meeting_id = f"MTG{str(idx).zfill(3)}"
    
    # Ensure ID uniqueness
    while db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first():
        idx += 1
        meeting_id = f"MTG{str(idx).zfill(3)}"

    new_m = Meeting(
        meeting_id=meeting_id,
        mentor_id=payload.mentor_id,
        student_id=payload.student_id,
        date=payload.date,
        time=payload.time,
        agenda=payload.agenda,
        notes=payload.notes,
        status=payload.status,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )
    db.add(new_m)
    db.commit()
    return {"success": True, "meeting_id": meeting_id}

@meetings_router.put("/{meeting_id}", response_model=dict, dependencies=[Depends(require_roles("mentor", "admin"))])
def update_existing_meeting(meeting_id: str, payload: MeetingUpdate, db: Session = Depends(get_db)):
    db_m = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not db_m:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    for k, v in payload.dict(exclude_unset=True).items():
        setattr(db_m, k, v)
        
    db_m.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"success": True}

@meetings_router.delete("/{meeting_id}", dependencies=[Depends(require_roles("mentor", "admin"))])
def cancel_delete_meeting(meeting_id: str, db: Session = Depends(get_db)):
    db_m = db.query(Meeting).filter(Meeting.meeting_id == meeting_id).first()
    if not db_m:
        raise HTTPException(status_code=404, detail="Meeting not found")
    db.delete(db_m)
    db.commit()
    return {"success": True, "message": "Meeting deleted successfully."}

@meetings_router.get("/mentor/{mentor_id}", response_model=List[MeetingResponse], dependencies=[Depends(require_roles("mentor", "admin"))])
def get_meetings_for_mentor(mentor_id: str, db: Session = Depends(get_db)):
    meetings = db.query(Meeting).filter(Meeting.mentor_id == mentor_id).all()
    students = {s.student_id: s for s in db.query(Student).all()}
    mentors = {m.mentor_id: m for m in db.query(Mentor).all()}

    enriched = []
    for m in meetings:
        stud = students.get(m.student_id)
        ment = mentors.get(m.mentor_id)
        enriched.append({
            "meeting_id": m.meeting_id,
            "mentor_id": m.mentor_id,
            "student_id": m.student_id,
            "date": m.date,
            "time": m.time,
            "agenda": m.agenda,
            "notes": m.notes,
            "status": m.status,
            "student_name": stud.name if stud else "Unknown",
            "mentor_name": ment.mentor_name if ment else "Unknown",
            "department": stud.department if stud else "",
            "created_at": m.created_at,
            "updated_at": m.updated_at
        })
    return enriched

# ============================================
# DASHBOARD ENDPOINTS
# ============================================

@dashboard_router.get("/stats", response_model=AllocationStats, dependencies=[Depends(require_roles("mentor", "admin"))])
def get_dashboard_stats_endpoint(db: Session = Depends(get_db)):
    return get_allocation_stats(db)

@dashboard_router.get("/workload", response_model=List[dict], dependencies=[Depends(require_roles("mentor", "admin"))])
def get_mentor_workload_endpoint(db: Session = Depends(get_db)):
    mentors = db.query(Mentor).all()
    allocations = db.query(Allocation).all()
    students = {s.student_id: s for s in db.query(Student).all()}

    # Group allocations by mentor_id
    mentor_allocs = {}
    for a in allocations:
        if a.mentor_id not in mentor_allocs:
            mentor_allocs[a.mentor_id] = []
        stud = students.get(a.student_id)
        if stud:
            mentor_allocs[a.mentor_id].append({
                "student_id": stud.student_id,
                "name": stud.name,
                "department": stud.department,
                "year": stud.year or "",
                "division": stud.division or "",
                "semester": stud.semester or ""
            })

    result = []
    for m in mentors:
        mentees = mentor_allocs.get(m.mentor_id, [])
        result.append({
            "mentor_id": m.mentor_id,
            "mentor_name": m.mentor_name,
            "department": m.department,
            "current": len(mentees),
            "max": m.max,
            "mentees": mentees
        })
    return result

@dashboard_router.get("/risk-summary", dependencies=[Depends(require_roles("mentor", "admin"))])
def get_dashboard_risk_summary(db: Session = Depends(get_db)):
    from ..scoring.engine import compute_score, get_risk_summary
    from ..models.models import ScoreData
    score_data_list = db.query(ScoreData).all()
    scores = []
    for sd in score_data_list:
        metrics = {
            "attendance": sd.attendance,
            "academic": sd.academic,
            "engagement": sd.engagement,
            "placement": sd.placement
        }
        scores.append(compute_score(metrics))
    return get_risk_summary(scores)

@dashboard_router.get("/upcoming-meetings", dependencies=[Depends(require_roles("mentor", "admin"))])
def get_dashboard_upcoming_meetings(db: Session = Depends(get_db)):
    today = datetime.now(timezone.utc)
    meetings = db.query(Meeting).filter(
        Meeting.status == MeetingStatusEnum.scheduled,
        Meeting.date >= today
    ).all()
    
    # Sort by date, then time
    meetings_sorted = sorted(
        meetings,
        key=lambda m: (m.date or today, m.time or "")
    )[:5]
    
    students = {s.student_id: s for s in db.query(Student).all()}
    mentors = {m.mentor_id: m for m in db.query(Mentor).all()}
    
    result = []
    for m in meetings_sorted:
        stud = students.get(m.student_id)
        ment = mentors.get(m.mentor_id)
        result.append({
            "meeting_id": m.meeting_id,
            "mentor_id": m.mentor_id,
            "student_id": m.student_id,
            "date": m.date,
            "time": m.time,
            "agenda": m.agenda,
            "notes": m.notes,
            "status": m.status,
            "student_name": stud.name if stud else "Unknown",
            "mentor_name": ment.mentor_name if ment else "Unknown"
        })
    return result

