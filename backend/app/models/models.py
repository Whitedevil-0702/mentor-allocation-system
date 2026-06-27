import enum

from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Enum, func, text
from sqlalchemy.orm import relationship
from ..core.database import Base


class RiskBand(str, enum.Enum):
    Green = "Green"
    Amber = "Amber"
    Coral = "Coral"


class MeetingStatus(str, enum.Enum):
    scheduled = "scheduled"
    completed = "completed"
    cancelled = "cancelled"


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
    assigned_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    # Relationships
    student = relationship("Student", back_populates="allocation")
    mentor = relationship("Mentor", back_populates="allocations")

class ScoreData(Base):
    __tablename__ = "score_data"

    student_id = Column(String, ForeignKey("students.student_id", ondelete="CASCADE"), primary_key=True)
    attendance = Column(Float, nullable=False, default=0.0, server_default=text("0"))
    academic = Column(Float, nullable=False, default=0.0, server_default=text("0"))
    engagement = Column(Float, nullable=False, default=0.0, server_default=text("0"))
    placement = Column(Float, nullable=False, default=0.0, server_default=text("0"))
    score = Column(Float, nullable=False, default=0.0, server_default=text("0"))
    risk_band = Column(Enum(RiskBand, name="risk_band"), nullable=False, default=RiskBand.Coral, server_default=text("'Coral'"))
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    student = relationship("Student", back_populates="score_data")

class Meeting(Base):
    __tablename__ = "meetings"

    meeting_id = Column(String, primary_key=True, index=True)
    mentor_id = Column(String, ForeignKey("mentors.mentor_id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String, ForeignKey("students.student_id", ondelete="CASCADE"), nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    time = Column(String, nullable=True)
    agenda = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    status = Column(Enum(MeetingStatus, name="meeting_status"), nullable=False, default=MeetingStatus.scheduled, server_default=text("'scheduled'"))
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    # Relationships
    mentor = relationship("Mentor", back_populates="meetings")
    student = relationship("Student", back_populates="meetings")
