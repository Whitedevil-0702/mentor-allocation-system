from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime
from ..core.database import get_db
from ..models.models import Student, ScoreData
from .schemas import ScoreResponse, ScoreImportRequest, RiskSummary, DeptRiskResponse
from .engine import compute_score, get_risk_summary, get_department_risk

router = APIRouter(prefix="/scores", tags=["scores"])

@router.get("/", response_model=List[ScoreResponse])
def get_all_scores(db: Session = Depends(get_db)):
    try:
        students = db.query(Student).all()
        student_map = {s.student_id: s for s in students}
        
        score_data_list = db.query(ScoreData).all()
        
        scores = []
        for sd in score_data_list:
            student = student_map.get(sd.student_id)
            if not student:
                continue
            
            metrics = {
                "attendance": sd.attendance,
                "academic": sd.academic,
                "engagement": sd.engagement,
                "placement": sd.placement
            }
            computed = compute_score(metrics)
            
            scores.append({
                "student_id": sd.student_id,
                "student_name": student.name,
                "department": student.department or "",
                "year": student.year or "",
                "score": computed["score"],
                "breakdown": computed["breakdown"],
                "riskBand": computed["riskBand"]
            })
            
        return scores
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/risk-summary", response_model=RiskSummary)
def get_overall_risk_summary(db: Session = Depends(get_db)):
    try:
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/department-risk", response_model=List[DeptRiskResponse])
def get_dept_risk_heatmap(db: Session = Depends(get_db)):
    try:
        students = db.query(Student).all()
        score_data_list = db.query(ScoreData).all()
        
        scores = []
        for sd in score_data_list:
            metrics = {
                "attendance": sd.attendance,
                "academic": sd.academic,
                "engagement": sd.engagement,
                "placement": sd.placement
            }
            comp = compute_score(metrics)
            comp["student_id"] = sd.student_id
            scores.append(comp)
            
        return get_department_risk(scores, students)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{student_id}", response_model=ScoreResponse)
def get_student_score(student_id: str, db: Session = Depends(get_db)):
    sd = db.query(ScoreData).filter(ScoreData.student_id == student_id).first()
    if not sd:
        raise HTTPException(status_code=404, detail="Score data not found for this student")
    
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")
        
    metrics = {
        "attendance": sd.attendance,
        "academic": sd.academic,
        "engagement": sd.engagement,
        "placement": sd.placement
    }
    computed = compute_score(metrics)
    
    return {
        "student_id": sd.student_id,
        "student_name": student.name,
        "department": student.department or "",
        "year": student.year or "",
        "score": computed["score"],
        "breakdown": computed["breakdown"],
        "riskBand": computed["riskBand"]
    }

@router.post("/import", status_code=status.HTTP_201_CREATED)
def import_score_data(payload: ScoreImportRequest, db: Session = Depends(get_db)):
    try:
        updated_count = 0
        inserted_count = 0
        
        # Fast query all existing score data
        existing_ids = {sd.student_id for sd in db.query(ScoreData.student_id).all()}
        
        for sd_data in payload.data:
            if sd_data.student_id in existing_ids:
                db_sd = db.query(ScoreData).filter(ScoreData.student_id == sd_data.student_id).first()
                if db_sd:
                    db_sd.attendance = sd_data.attendance
                    db_sd.academic = sd_data.academic
                    db_sd.engagement = sd_data.engagement
                    db_sd.placement = sd_data.placement
                    db_sd.updated_at = datetime.utcnow().isoformat()
                    updated_count += 1
            else:
                db_sd = ScoreData(
                    student_id=sd_data.student_id,
                    attendance=sd_data.attendance,
                    academic=sd_data.academic,
                    engagement=sd_data.engagement,
                    placement=sd_data.placement,
                    updated_at=datetime.utcnow().isoformat()
                )
                db.add(db_sd)
                inserted_count += 1
                
        db.commit()
        return {
            "success": True,
            "updated": updated_count,
            "inserted": inserted_count,
            "total": updated_count + inserted_count
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/")
def clear_all_score_data(db: Session = Depends(get_db)):
    try:
        db.query(ScoreData).delete()
        db.commit()
        return {"success": True, "message": "All score data cleared successfully."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
