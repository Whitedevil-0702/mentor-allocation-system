import heapq
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from ..models.models import Student, Mentor, Allocation

def run_auto_allocation(db: Session) -> Dict[str, Any]:
    # 1. Fetch all students, mentors, and existing allocations
    students = db.query(Student).all()
    mentors = db.query(Mentor).all()
    existing_allocations = db.query(Allocation).all()
    
    allocated_student_ids = {a.student_id for a in existing_allocations}
    
    # Map mentors by ID and calculate their current allocations
    mentor_alloc_counts = {m.mentor_id: 0 for m in mentors}
    for a in existing_allocations:
        if a.mentor_id in mentor_alloc_counts:
            mentor_alloc_counts[a.mentor_id] += 1
            
    # Group unallocated students by department
    students_by_dept = {}
    for s in students:
        if s.student_id in allocated_student_ids:
            continue
        dept = s.department
        if dept not in students_by_dept:
            students_by_dept[dept] = []
        students_by_dept[dept].append(s)
        
    # Group mentors by department
    mentors_by_dept = {}
    for m in mentors:
        dept = m.department
        if dept not in mentors_by_dept:
            mentors_by_dept[dept] = []
        mentors_by_dept[dept].append(m)
        
    new_allocations = []
    
    # 2. Allocate department by department
    for dept, dept_students in students_by_dept.items():
        dept_mentors = mentors_by_dept.get(dept, [])
        if not dept_mentors:
            continue
            
        # Build min heap: (current_allocated_count, unique_counter, mentor_obj)
        # We add unique_counter to avoid comparing Mentor objects in case of count ties
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
                break # All mentors in department are full
                
            current_count, idx, m = heapq.heappop(heap)
            
            # Create new allocation
            new_alloc = Allocation(student_id=s.student_id, mentor_id=m.mentor_id)
            new_allocations.append(new_alloc)
            
            # Update counts
            mentor_alloc_counts[m.mentor_id] += 1
            new_count = mentor_alloc_counts[m.mentor_id]
            
            # Push back if still under max capacity
            if new_count < m.max:
                heapq.heappush(heap, (new_count, idx, m))
                
    if new_allocations:
        db.add_all(new_allocations)
        db.commit()
        
    return {
        "success": True,
        "allocated": len(new_allocations),
        "total_new": len(new_allocations)
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
