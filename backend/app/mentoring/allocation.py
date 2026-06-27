import heapq
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from ..models.models import Student, Mentor, Allocation

def run_auto_allocation(db: Session) -> Dict[str, Any]:
    with db.begin():
        # Lock mentor rows so concurrent requests serialize allocation decisions.
        students = db.query(Student).all()
        mentors = db.query(Mentor).with_for_update().all()
        existing_allocations = db.query(Allocation).with_for_update().all()

        allocated_student_ids = {a.student_id for a in existing_allocations}

        mentor_alloc_counts = {m.mentor_id: 0 for m in mentors}
        for a in existing_allocations:
            if a.mentor_id in mentor_alloc_counts:
                mentor_alloc_counts[a.mentor_id] += 1

        students_by_dept = {}
        for s in students:
            if s.student_id in allocated_student_ids:
                continue
            dept = s.department
            students_by_dept.setdefault(dept, []).append(s)

        mentors_by_dept = {}
        for m in mentors:
            mentors_by_dept.setdefault(m.department, []).append(m)

        new_allocations = []

        for dept, dept_students in students_by_dept.items():
            dept_mentors = mentors_by_dept.get(dept, [])
            if not dept_mentors:
                continue

            heap = []
            counter = 0
            for m in dept_mentors:
                current_count = mentor_alloc_counts[m.mentor_id]
                if current_count < m.max:
                    heapq.heappush(heap, (current_count, counter, m))
                    counter += 1

            if not heap:
                continue

            for s in dept_students:
                if not heap:
                    break

                current_count, idx, m = heapq.heappop(heap)
                new_allocations.append(Allocation(student_id=s.student_id, mentor_id=m.mentor_id))
                mentor_alloc_counts[m.mentor_id] += 1
                new_count = mentor_alloc_counts[m.mentor_id]

                if new_count < m.max:
                    heapq.heappush(heap, (new_count, idx, m))

        if new_allocations:
            db.add_all(new_allocations)

        allocated_count = len(new_allocations)

    return {
        "success": True,
        "allocated": allocated_count,
        "total_new": allocated_count
    }

def get_allocation_stats(db: Session) -> Dict[str, Any]:
    students = db.query(Student).all()
    mentors = db.query(Mentor).all()
    allocations = db.query(Allocation).all()
    
    student_map = {s.student_id: s for s in students}
    mentor_map = {m.mentor_id: m for m in mentors}
    allocated_student_ids = {a.student_id for a in allocations}
    
    total_students = len(students)
    total_mentors = len(mentors)
    allocated_count = len(allocations)
    pending_count = total_students - allocated_count
    
    # Calculate stats per department
    dept_stats = {}
    for s in students:
        dept = s.department or "Unknown"
        if dept not in dept_stats:
            dept_stats[dept] = {"students": 0, "mentors": 0, "allocated": 0, "pending": 0}
        dept_stats[dept]["students"] += 1
        if s.student_id in allocated_student_ids:
            dept_stats[dept]["allocated"] += 1
        else:
            dept_stats[dept]["pending"] += 1
            
    for m in mentors:
        dept = m.department or "Unknown"
        if dept not in dept_stats:
            dept_stats[dept] = {"students": 0, "mentors": 0, "allocated": 0, "pending": 0}
        dept_stats[dept]["mentors"] += 1
        
    return {
        "totalStudents": total_students,
        "totalMentors": total_mentors,
        "allocated": allocated_count,
        "pending": pending_count,
        "byDepartment": dept_stats
    }
