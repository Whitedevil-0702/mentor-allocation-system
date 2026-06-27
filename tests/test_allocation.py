from backend.app.mentoring.allocation import run_auto_allocation
from backend.app.models.models import Allocation, Mentor, Student


def test_auto_allocation_respects_capacity_and_department(db_session):
    mentors = [
        Mentor(mentor_id="M1", mentor_name="Mentor 1", email="m1@example.com", department="CSE", max=1),
        Mentor(mentor_id="M2", mentor_name="Mentor 2", email="m2@example.com", department="CSE", max=2),
        Mentor(mentor_id="M3", mentor_name="Mentor 3", email="m3@example.com", department="ECE", max=1),
    ]
    students = [
        Student(student_id="S1", name="Student 1", email="s1@example.com", department="CSE"),
        Student(student_id="S2", name="Student 2", email="s2@example.com", department="CSE"),
        Student(student_id="S3", name="Student 3", email="s3@example.com", department="CSE"),
        Student(student_id="S4", name="Student 4", email="s4@example.com", department="CSE"),
        Student(student_id="S5", name="Student 5", email="s5@example.com", department="ECE"),
    ]

    db_session.add_all(mentors + students)
    db_session.commit()

    result = run_auto_allocation(db_session)
    assert result["success"] is True
    assert result["allocated"] == 4

    allocations = db_session.query(Allocation).all()
    mentor_counts = {}
    student_departments = {student.student_id: student.department for student in db_session.query(Student).all()}
    mentor_departments = {mentor.mentor_id: mentor.department for mentor in db_session.query(Mentor).all()}

    for allocation in allocations:
        mentor_counts[allocation.mentor_id] = mentor_counts.get(allocation.mentor_id, 0) + 1
        assert student_departments[allocation.student_id] == mentor_departments[allocation.mentor_id]

    assert mentor_counts["M1"] == 1
    assert mentor_counts["M2"] == 2
    assert mentor_counts["M3"] == 1
