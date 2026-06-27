from typing import Dict, List, Any

WEIGHTS = {
    "attendance": 0.35,
    "academic": 0.35,
    "engagement": 0.15,
    "placement": 0.15
}

def clamp(val: float) -> float:
    return max(0.0, min(100.0, float(val)))

def calculate_score(attendance: float, academic: float, engagement: float, placement: float) -> float:
    attendance = clamp(attendance)
    academic = clamp(academic)
    engagement = clamp(engagement)
    placement = clamp(placement)
    return round(
        WEIGHTS["attendance"] * attendance +
        WEIGHTS["academic"] * academic +
        WEIGHTS["engagement"] * engagement +
        WEIGHTS["placement"] * placement,
        2
    )

def get_risk_band(score: float) -> str:
    if score >= 70.0:
        return "Green"
    if score >= 50.0:
        return "Amber"
    return "Coral"

def compute_score(metrics: Dict[str, float]) -> Dict[str, Any]:
    attendance = clamp(metrics.get("attendance", 0.0))
    academic = clamp(metrics.get("academic", 0.0))
    engagement = clamp(metrics.get("engagement", 0.0))
    placement = clamp(metrics.get("placement", 0.0))

    score = calculate_score(attendance, academic, engagement, placement)

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
    summary = {"Green": 0, "Amber": 0, "Coral": 0, "total": len(scores_list)}
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
                "Green": 0,
                "Amber": 0,
                "Coral": 0,
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
            "Green": d["Green"],
            "Amber": d["Amber"],
            "Coral": d["Coral"],
            "total": total
        })

    return result
