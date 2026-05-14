import time
from typing import Dict, Optional, List

from models.data_models import Student, Faculty, Subject, Attendance, Marks, Result
from services.service import Service
from repos.repo import Repo

repo = Repo()
service = Service(repo)


# -------------------- STUDENT MANAGEMENT -------------------- #

async def add_student(
    usn: str,
    department: str,
    semester: int,
    user_id: Optional[str] = None,
) -> Dict:
    """Add a new student record to the system."""
    try:
        s = Student(usn=usn, department=department, semester=semester, user_id=user_id)
        res = await service.register_student(s)
        return {"success": True, "data": res.model_dump()}
    except Exception as e:
        return {"success": False, "message": str(e)}


async def fetch_student_data(student_id: str) -> Dict:
    """Fetch complete data for a student — profile, attendance, marks, and results."""
    try:
        student = await service.get_student(student_id)
        if not student:
            return {"success": False, "message": "Student not found"}

        attendance = await service.get_attendance(student_id)
        marks = await service.get_marks(student_id)
        result = await service.get_result(student_id)

        return {
            "success": True,
            "data": {
                "student": student.model_dump(),
                "attendance": [a.model_dump() for a in attendance],
                "marks": [m.model_dump() for m in marks],
                "result": result.model_dump() if result else None,
            }
        }
    except Exception as e:
        return {"success": False, "message": str(e)}


async def list_all_students(department: Optional[str] = None) -> Dict:
    """List all students, optionally filtered by department."""
    students = await service.list_students(department)
    return {"success": True, "data": [s.model_dump() for s in students]}


# -------------------- FACULTY MANAGEMENT -------------------- #

async def create_faculty(
    faculty_code: str,
    name: str,
    department: str,
    user_id: Optional[str] = None,
) -> Dict:
    """Create a new faculty member with a code, name, and department."""
    try:
        f = Faculty(faculty_code=faculty_code, name=name, department=department, department_id=department, user_id=user_id)
        res = await service.register_faculty(f)
        return {"success": True, "data": res.model_dump()}
    except Exception as e:
        return {"success": False, "message": str(e)}


async def list_all_faculty(department: Optional[str] = None) -> Dict:
    """List all faculty members, optionally filtered by department."""
    faculty_list = await service.list_faculty(department)
    return {"success": True, "data": [f.model_dump() for f in faculty_list]}


# -------------------- SUBJECT MANAGEMENT -------------------- #

async def add_subject(
    name: str,
    department: str,
    semester: int,
) -> Dict:
    """Add a new subject."""
    try:
        subject_code = f"{department.upper()}{semester}{name[:3].upper()}"
        s = Subject(subject_name=name, subject_code=subject_code, department_id=department, semester=semester)
        res = await service.create_subject(s)
        return {"success": True, "data": res.model_dump()}
    except Exception as e:
        return {"success": False, "message": str(e)}


async def list_all_subjects(
    department: Optional[str] = None,
    semester: Optional[int] = None,
) -> Dict:
    """List all subjects, optionally filtered by department and semester."""
    subjects = await service.list_subjects(department, semester)
    return {"success": True, "data": [s.model_dump() for s in subjects]}


# -------------------- ATTENDANCE -------------------- #

async def update_attendance(
    student_id: str,
    subject_id: str,
    attendance_percentage: float,
) -> Dict:
    """Update or create attendance for a student in a subject."""
    try:
        existing = await service.get_attendance(student_id, subject_id)
        a = Attendance(
            student_id=student_id,
            subject_id=subject_id,
            attendance_percentage=attendance_percentage,
        )
        if existing:
            success = await service.update_attendance(a)
            return {"success": success, "action": "updated"}
        else:
            res = await service.add_attendance(a)
            return {"success": True, "action": "created", "data": res.model_dump()}
    except Exception as e:
        return {"success": False, "message": str(e)}


async def get_student_attendance(student_id: str) -> Dict:
    """Get all attendance records for a student."""
    records = await service.get_attendance(student_id)
    return {"success": True, "data": [a.model_dump() for a in records]}


# -------------------- MARKS -------------------- #

async def update_marks(
    student_id: str,
    subject_id: str,
    internal_marks: float,
    external_marks: float,
) -> Dict:
    """Update or create marks for a student in a subject."""
    try:
        existing = await service.get_marks(student_id, subject_id)
        m = Marks(
            student_id=student_id,
            subject_id=subject_id,
            internal_marks=internal_marks,
            external_marks=external_marks,
        )
        if existing:
            success = await service.update_marks(m)
            return {"success": success, "action": "updated"}
        else:
            res = await service.add_marks(m)
            return {"success": True, "action": "created", "data": res.model_dump()}
    except Exception as e:
        return {"success": False, "message": str(e)}


async def get_student_marks(student_id: str) -> Dict:
    """Get all marks records for a student."""
    records = await service.get_marks(student_id)
    return {"success": True, "data": [m.model_dump() for m in records]}


# -------------------- RESULTS / SGPA-CGPA -------------------- #

async def calculate_sgpa_cgpa(
    student_id: str,
    sgpa: float,
    cgpa: float,
) -> Dict:
    """Enter or update SGPA/CGPA for a student."""
    try:
        existing = await service.get_result(student_id)
        r = Result(student_id=student_id, sgpa=sgpa, cgpa=cgpa)
        if existing:
            success = await service.update_result(r)
            return {"success": success, "action": "updated"}
        else:
            res = await service.add_result(r)
            return {"success": True, "action": "created", "data": res.model_dump()}
    except Exception as e:
        return {"success": False, "message": str(e)}


async def get_student_result(student_id: str) -> Dict:
    """Get SGPA/CGPA result for a student."""
    result = await service.get_result(student_id)
    if not result:
        return {"success": False, "message": "Result not found"}
    return {"success": True, "data": result.model_dump()}


async def list_all_results() -> Dict:
    """List all student results."""
    results = await service.list_results()
    return {"success": True, "data": [r.model_dump() for r in results]}


# -------------------- ANALYTICS & INTELLIGENCE -------------------- #

async def get_student_analytics(student_id: str) -> Dict:
    """Get performance analytics, risk analysis, and overall status for a student."""
    try:
        data = await service.get_analytics_student(student_id)
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "message": str(e)}

async def get_faculty_analytics(faculty_id: str) -> Dict:
    """Get subject-level performance and attendance analytics for a faculty member."""
    try:
        data = await service.get_analytics_faculty(faculty_id)
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "message": str(e)}

async def get_hod_analytics(dept_id: str) -> Dict:
    """Get department-wide performance and attendance analytics for the HOD."""
    try:
        data = await service.get_analytics_hod(dept_id)
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "message": str(e)}

async def get_admin_analytics() -> Dict:
    """Get system-wide academic performance and attendance analytics for the Admin."""
    try:
        data = await service.get_analytics_admin()
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "message": str(e)}

# -------------------- AI PREDICTION -------------------- #

async def predict_student_risk(student_id: str) -> Dict:
    """Predict the academic risk level (low/medium/high) for a student based on heuristic score."""
    try:
        data = await service.predict_student_risk(student_id)
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "message": str(e)}

# -------------------- ALERTS & NOTIFICATIONS -------------------- #

async def get_student_alerts(student_id: str) -> Dict:
    """Get attendance alerts (critical < 75%) for a student."""
    try:
        data = await service.get_alerts_student(student_id)
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "message": str(e)}

async def get_faculty_alerts(faculty_id: str) -> Dict:
    """Get attendance alerts for students in subjects taught by the faculty."""
    try:
        data = await service.get_alerts_faculty(faculty_id)
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "message": str(e)}

async def get_hod_alerts(dept_id: str) -> Dict:
    """Get aggregate department-wide attendance alerts for the HOD."""
    try:
        data = await service.get_alerts_hod(dept_id)
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "message": str(e)}

async def get_admin_alerts() -> Dict:
    """Get system-wide critical attendance alerts for the Admin."""
    try:
        data = await service.get_alerts_admin()
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "message": str(e)}

# -------------------- IA MARKS -------------------- #

async def get_subject_ia_marks(subject_id: str) -> Dict:
    """Retrieve Internal Assessment marks for all students in a subject."""
    try:
        data = await service.get_ia_marks_for_subject(subject_id)
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "message": str(e)}

async def get_student_ia_marks(student_id: str) -> Dict:
    """Retrieve all Internal Assessment marks for a specific student."""
    try:
        data = await service.get_ia_marks_for_student(student_id)
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "message": str(e)}

async def get_ia_admin_analytics() -> Dict:
    """Retrieve system-wide Internal Assessment analytics."""
    try:
        data = await service.get_ia_admin_analytics()
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "message": str(e)}
