import pytest
import concurrent.futures
from sqlalchemy.orm import sessionmaker
from backend.app.models.models import Mentor, Student, Allocation
from backend.app.mentoring.allocation import run_auto_allocation
from tests.conftest import engine, TestingSessionLocal

def test_concurrent_allocation_enforces_capacity(db_session):
    # Setup: 1 Mentor with capacity 1, and 2 students in the same department
    mentor = Mentor(mentor_id="MC1", mentor_name="Concurrent Mentor", email="mc1@example.com", department="CSE", max=1)
    student1 = Student(student_id="SC1", name="Student 1", email="sc1@example.com", department="CSE")
    student2 = Student(student_id="SC2", name="Student 2", email="sc2@example.com", department="CSE")
    
    db_session.add_all([mentor, student1, student2])
    db_session.commit()
    
    # We will run run_auto_allocation concurrently in two separate threads with separate DB sessions.
    def run_allocation_in_thread():
        # Create a new session for this thread
        thread_session = TestingSessionLocal()
        try:
            res = run_auto_allocation(thread_session)
            thread_session.commit()
            return res
        except Exception as e:
            thread_session.rollback()
            return {"success": False, "error": str(e)}
        finally:
            thread_session.close()

    # Execute both threads concurrently
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        futures = [executor.submit(run_allocation_in_thread) for _ in range(2)]
        results = [f.result() for f in futures]
        
    # Verify the database state
    # Since the mentor capacity is 1, only 1 student should be allocated.
    allocations = db_session.query(Allocation).all()
    assert len(allocations) == 1, f"Expected exactly 1 allocation due to capacity constraint, but got {len(allocations)}"
    
    # One of the allocations must have succeeded
    success_count = sum(1 for r in results if r.get("success") is True)
    # The allocated attribute should match the number of allocations
    allocated_count = sum(r.get("allocated", 0) for r in results if r.get("success") is True)
    assert allocated_count == 1, f"Expected 1 allocated mentee in results, got {allocated_count}"
