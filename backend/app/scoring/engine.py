from typing import Dict, List, Any

WEIGHTS = {
    "attendance": 0.35,
    "academic": 0.35,
    "engagement": 0.15,
    "placement": 0.15
}

def clamp(val: float) -> float:
    return max(0.0, min(100.0, float(val)))

def get_risk_band(score: float) -> str:
    if score >= 70.0:
        return "green"
    if score >= 50.0:
        return "amber"
    return "coral"

def compute_score(metrics: Dict[str, float]) -> Dict[str, Any]:
    attendance = clamp(metrics.get("attendance", 0.0))
    academic = clamp(metrics.get("academic", 0.0))
    engagement = clamp(metrics.get("engagement", 0.0))
    placement = clamp(metrics.get("placement", 0.0))

    score = (
        WEIGHTS["attendance"] * attendance +
        WEIGHTS["academic"] * academic +
        WEIGHTS["engagement"] * engagement +
        WEIGHTS["placement"] * placement
    )
    score = round(score, 2)

    return {
        "score": score,
        "breakdown": {
            "attendance": attendance,
            "academic": academic,
            "engagement": engagement,
            "placement": placement
        },
        "riskBand": get_risk_band(score)
    }

def get_risk_summary(scores_list: List[Dict[str, Any]]) -> Dict[str, int]:
    summary = {"green": 0, "amber": 0, "coral": 0, "total": len(scores_list)}
    for s in scores_list:
        band = s["riskBand"]
        summary[band] = summary.get(band, 0) + 1
    return summary

def get_department_risk(scores_list: List[Dict[str, Any]], students_list: List[Any]) -> List[Dict[str, Any]]:
    # Create student ID map
    student_map = {s.student_id: s for s in students_list}

    dept_map = {}
    for sc in scores_list:
        student = student_map.get(sc["student_id"])
        if not student:
            continue
        dept = student.department or "Unknown"
        if dept not in dept_map:
            dept_map[dept] = {
                "department": dept,
                "green": 0,
                "amber": 0,
                "coral": 0,
                "total": 0,
                "totalScore": 0.0
            }
        
        band = sc["riskBand"]
        dept_map[dept][band] += 1
        dept_map[dept]["total"] += 1
        dept_map[dept]["totalScore"] += sc["score"]

    result = []
    for d in dept_map.values():
        total = d["total"]
        avg_score = round(d["totalScore"] / total, 2) if total > 0 else 0.0
        result.append({
            "department": d["department"],
            "avgScore": avg_score,
            "green": d["green"],
            "amber": d["amber"],
            "coral": d["coral"],
            "total": total
        })

    return result
