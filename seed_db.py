import openpyxl
import re
import sqlite3
import random
from datetime import datetime
import sys
import os

# Set python path to allow importing backend module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from backend.app.core.database import engine, Base
from backend.app.models.models import Mentor, Student, Allocation, ScoreData, Meeting

# Create tables if they do not exist
print("Creating database tables...")
Base.metadata.create_all(bind=engine)

excel_path = r"C:\Users\ak210\Documents\Mentor Data.xlsx"
db_path = r"c:\Users\ak210\mentor-allocation-system\database.db"

wb = openpyxl.load_workbook(excel_path, data_only=True)
sheet = wb['25-26']
rows = list(sheet.iter_rows(values_only=True))

# 1. Parse Mentors and their serial allocations
mentors = []
mentor_counter = 1

def parse_serial_ranges(text):
    text = text.upper()
    serials = set()
    text = text.replace("TO", "-").replace("AND", ",").replace("&", ",")
    matches = re.findall(r'(\d+)\s*-\s*(\d+)|(\d+)', text)
    for m in matches:
        if m[0] and m[1]:
            start, end = int(m[0]), int(m[1])
            for x in range(start, end + 1):
                serials.add(x)
        elif m[2]:
            serials.add(int(m[2]))
    return serials

for idx, r in enumerate(rows):
    if idx == 0:
        continue # Skip header
    
    mentor_info = r[4]
    if mentor_info:
        info_lines = [l.strip() for l in mentor_info.split('\n') if l.strip()]
        
        mentor_name = "Unknown"
        email = None
        mobile = None
        
        new_mentor_match = re.search(r'NEW MENTOR-\s*([^,\n]+)', mentor_info, re.IGNORECASE)
        if new_mentor_match:
            mentor_name = new_mentor_match.group(1).strip()
        else:
            first_line = info_lines[0]
            first_line_clean = re.split(r',|MAIL ID|OLD MENTOR', first_line, flags=re.IGNORECASE)[0].strip()
            mentor_name = first_line_clean
            
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', mentor_info)
        if email_match:
            email = email_match.group(0).lower()
            
        mobile_match = re.search(r'M:\s*(\d+)|(\d{10})', mentor_info, re.IGNORECASE)
        if mobile_match:
            mobile = mobile_match.group(1) or mobile_match.group(2)
            
        serial_text_match = re.search(r'SERIAL\s+NUM[A-Z]*\s*[-:]\s*([^\n\)]+)', mentor_info, re.IGNORECASE)
        serials_allocated = set()
        if serial_text_match:
            serials_allocated = parse_serial_ranges(serial_text_match.group(1))
        
        if not serials_allocated:
            serials_allocated = parse_serial_ranges(mentor_info)
            
        m_id = f"MTR{str(mentor_counter).zfill(3)}"
        mentor_counter += 1
        
        mentors.append({
            "mentor_id": m_id,
            "mentor_name": mentor_name,
            "email": email or f"{mentor_name.lower().replace(' ', '').replace('.', '')}@mitwpu.edu.in",
            "designation": "Assistant Professor",
            "department": "CSE",
            "max": 20,
            "serials": serials_allocated
        })

# 2. Parse Students and map to Mentors
students = []
allocations = []

for idx, r in enumerate(rows):
    if idx == 0:
        continue
    
    sr_no = r[0]
    prn = r[1]
    name = r[2]
    div_branch = r[3]
    
    if prn and name:
        student_id = str(int(prn)) if isinstance(prn, float) else str(prn)
        student_name = str(name).strip()
        student_name = re.sub(r'\(NEW MENTEE\)', '', student_name, flags=re.IGNORECASE).strip()
        
        year = "FY"
        dept = "CSE"
        division = "1"
        
        if div_branch:
            div_match = re.search(r'(\d+)\s*-\s*(\w+)\s+(\w+)', str(div_branch))
            if div_match:
                division = div_match.group(1)
                year = div_match.group(2)
                dept = div_match.group(3)
                
        assigned_mentor_id = None
        if sr_no:
            sr_num = int(sr_no)
            for m in mentors:
                if sr_num in m["serials"]:
                    assigned_mentor_id = m["mentor_id"]
                    break
        
        students.append({
            "student_id": student_id,
            "name": student_name,
            "email": f"{student_name.lower().replace(' ', '')}@mitwpu.edu.in",
            "department": dept,
            "year": year,
            "division": division,
            "semester": "1"
        })
        
        if assigned_mentor_id:
            allocations.append({
                "student_id": student_id,
                "mentor_id": assigned_mentor_id
            })

# 3. Connect via SQLAlchemy Session
from backend.app.core.database import SessionLocal

db = SessionLocal()

try:
    print("\n--- Clearing existing tables ---")
    db.query(Allocation).delete()
    db.query(ScoreData).delete()
    db.query(Meeting).delete()
    db.query(Student).delete()
    db.query(Mentor).delete()
    db.commit()

    print(f"--- Seeding {len(mentors)} Mentors ---")
    for m in mentors:
        db_m = Mentor(
            mentor_id=m["mentor_id"],
            mentor_name=m["mentor_name"],
            email=m["email"],
            department=m["department"],
            designation=m["designation"],
            max=m["max"]
        )
        db.add(db_m)
    db.commit()

    print(f"--- Seeding {len(students)} Students ---")
    for s in students:
        db_s = Student(
            student_id=s["student_id"],
            name=s["name"],
            email=s["email"],
            department=s["department"],
            year=s["year"],
            division=s["division"],
            semester=s["semester"]
        )
        db.add(db_s)
        
        # Generate realistic success score components
        score_profile = random.choice(["healthy", "healthy", "healthy", "at-risk", "needs-attention"])
        if score_profile == "healthy":
            attendance = random.uniform(75.0, 99.0)
            academic = random.uniform(70.0, 98.0)
            engagement = random.uniform(70.0, 95.0)
            placement = random.uniform(75.0, 95.0)
        elif score_profile == "needs-attention":
            attendance = random.uniform(60.0, 78.0)
            academic = random.uniform(50.0, 75.0)
            engagement = random.uniform(60.0, 80.0)
            placement = random.uniform(50.0, 75.0)
        else: # at-risk
            attendance = random.uniform(35.0, 62.0)
            academic = random.uniform(30.0, 58.0)
            engagement = random.uniform(40.0, 65.0)
            placement = random.uniform(30.0, 60.0)
            
        db_sd = ScoreData(
            student_id=s["student_id"],
            attendance=attendance,
            academic=academic,
            engagement=engagement,
            placement=placement,
            updated_at=datetime.utcnow().isoformat()
        )
        db.add(db_sd)
    db.commit()

    print(f"--- Seeding {len(allocations)} Allocations ---")
    for a in allocations:
        db_a = Allocation(
            student_id=a["student_id"],
            mentor_id=a["mentor_id"],
            assigned_at=datetime.utcnow()
        )
        db.add(db_a)
        
    db.commit()
    print("\n[SUCCESS] Database successfully seeded with 2025-26 Cohort Excel Data!")
    
except Exception as e:
    db.rollback()
    print(f"Error seeding database: {e}")
finally:
    db.close()
