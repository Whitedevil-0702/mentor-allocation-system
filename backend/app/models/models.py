from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..core.database import Base

class Mentor(Base):
    __tablename__ = "mentors"

    mentor_id = Column(String, primary_key=True, index=True)
    mentor_name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    department = Column(String, nullable=False)
    designation = Column(String, nullable=True)
    max = Column(Integer, default=10)

    # Relationships
    allocations = relationship("Allocation", back_populates="mentor", cascade="all, delete-orphan")
    meetings = relationship("Meeting", back_populates="mentor", cascade="all, delete-orphan")

class Student(Base):
    __tablename__ = "students"

    student_id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    department = Column(String, nullable=False)
    year = Column(String, nullable=True)
    division = Column(String, nullable=True)
    semester = Column(String, nullable=True)

    # Relationships
    allocation = relationship("Allocation", back_populates="student", uselist=False, cascade="all, delete-orphan")
    score_data = relationship("ScoreData", back_populates="student", uselist=False, cascade="all, delete-orphan")
    meetings = relationship("Meeting", back_populates="student", cascade="all, delete-orphan")

class Allocation(Base):
    __tablename__ = "allocations"

    student_id = Column(String, ForeignKey("students.student_id", ondelete="CASCADE"), primary_key=True)
    mentor_id = Column(String, ForeignKey("mentors.mentor_id", ondelete="CASCADE"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student = relationship("Student", back_populates="allocation")
    mentor = relationship("Mentor", back_populates="allocations")

class ScoreData(Base):
    __tablename__ = "score_data"

    student_id = Column(String, ForeignKey("students.student_id", ondelete="CASCADE"), primary_key=True)
    attendance = Column(Float, default=0.0)
    academic = Column(Float, default=0.0)
    engagement = Column(Float, default=0.0)
    placement = Column(Float, default=0.0)
    updated_at = Column(String, nullable=True)

    # Relationships
    student = relationship("Student", back_populates="score_data")

class Meeting(Base):
    __tablename__ = "meetings"

    meeting_id = Column(String, primary_key=True, index=True)
    mentor_id = Column(String, ForeignKey("mentors.mentor_id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String, ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False)
    date = Column(String, nullable=False)
    time = Column(String, nullable=True)
    agenda = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    status = Column(String, default="scheduled") # scheduled, completed, cancelled
    created_at = Column(String, nullable=True)
    updated_at = Column(String, nullable=True)

    # Relationships
    mentor = relationship("Mentor", back_populates="meetings")
    student = relationship("Student", back_populates="meetings")
