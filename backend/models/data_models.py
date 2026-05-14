from typing import Optional
from pydantic import BaseModel, ConfigDict


class User(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: Optional[str] = None
    name: str
    email: str
    password: Optional[str] = None
    password_hash: Optional[str] = None
    role: str  # student, faculty, hod, admin


class Department(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    hod_faculty_id: Optional[str] = None

class Student(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: Optional[str] = None
    user_id: Optional[str] = None
    usn: str
    department: str
    department_id: Optional[str] = None
    semester: int


class Faculty(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: Optional[str] = None
    faculty_code: str
    name: str
    user_id: Optional[str] = None
    department: Optional[str] = None
    department_id: str


class Subject(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: Optional[str] = None
    subject_name: str
    subject_code: str
    department_id: Optional[str] = None
    semester: Optional[int] = None



class FacultySubject(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: Optional[str] = None
    faculty_id: str
    subject_id: str


class Attendance(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: Optional[str] = None
    student_id: str
    subject_id: str
    attendance_percentage: float

class AttendanceSession(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: Optional[str] = None
    subject_id: str
    faculty_id: str
    session_number: int
    total_sessions: int
    date: str

class AttendanceRecord(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: Optional[str] = None
    session_id: str
    student_id: str
    status: str


class Marks(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: Optional[str] = None
    student_id: str
    subject_id: str
    internal_marks: float
    external_marks: float


class Result(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: Optional[str] = None
    student_id: str
    sgpa: float
    cgpa: float


class IAMarks(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: Optional[str] = None
    student_id: str
    subject_id: str
    faculty_id: str
    marks_obtained: int
    max_marks: int = 40
    created_at: Optional[str] = None
