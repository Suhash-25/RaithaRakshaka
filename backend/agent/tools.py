import time
from typing import Dict, Optional, List
import httpx
import json
from pathlib import Path

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

LEARN_BASE = "http://localhost:8000"

def _normalise_class_id(class_id: str) -> str:
    raw = str(class_id or "10").strip().lower().replace("class", "").replace("-", "")
    raw = raw.lstrip("0") or "10"
    return raw

def _normalise_subject(subject: str) -> str:
    return str(subject or "mathematics").strip().lower()

def _frontend_data_root() -> Path:
    return Path(__file__).resolve().parents[2] / "frontend" / "src" / "data"

async def fetch_topic_content(class_id: str, subject: str, chapter_id: str, topic_id: str) -> dict:
    """
    Reads from existing static JSON dataset — same source as /learn endpoints.
    Returns: {title, content, questions[]} or empty dict on miss.
    Never hallucinate — return only what exists in data files.
    """
    class_no = _normalise_class_id(class_id)
    subject_key = _normalise_subject(subject)

    direct_path = Path(__file__).resolve().parents[1] / "data" / class_no / subject_key / chapter_id / f"{topic_id}.json"
    try:
        with open(direct_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        pass

    catalog_paths = [
        _frontend_data_root() / "State" / f"class {class_no}" / "knowledge.json",
        _frontend_data_root() / "State" / f"class {class_no}" / "knowledge_enhanced.json",
        _frontend_data_root() / "CBSE" / f"class-{class_no}.json",
    ]
    for path in catalog_paths:
        try:
            with open(path, "r", encoding="utf-8") as f:
                catalog = json.load(f)
        except FileNotFoundError:
            continue

        for subject_entry in catalog.get("subjects", []):
            name = subject_entry.get("subject_name", "").strip().lower()
            if subject_key not in name and name not in subject_key:
                continue
            chapters = []
            for part in subject_entry.get("parts", []):
                chapters.extend(part.get("chapters", []))
            chapters.extend(subject_entry.get("chapters", []))
            for chapter in chapters:
                chapter_no = str(chapter.get("chapter_no") or chapter.get("chapter_number") or "1")
                if chapter_id and chapter_id not in {f"ch{chapter_no}", chapter_no}:
                    continue
                concepts = chapter.get("concepts") or chapter.get("topics") or []
                title = chapter.get("chapter_name") or chapter.get("chapter_title") or f"Chapter {chapter_no}"
                selected = concepts[0] if concepts else title
                if topic_id and topic_id not in {f"ch{chapter_no}-t1", selected}:
                    selected = concepts[0] if concepts else title
                content = "; ".join(concepts) if concepts else title
                return {
                    "title": selected,
                    "content": content,
                    "questions": [f"Explain {item}" for item in concepts[:5]],
                }
    return {}

async def fetch_chapter_list(class_id: str, subject: str) -> list:
    """Returns list of chapters from static JSON index."""
    class_no = _normalise_class_id(class_id)
    subject_key = _normalise_subject(subject)
    try:
        path = Path(__file__).resolve().parents[1] / "data" / class_no / subject_key / "index.json"
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        pass

    path = _frontend_data_root() / "State" / f"class {class_no}" / "knowledge.json"
    try:
        with open(path, "r", encoding="utf-8") as f:
            catalog = json.load(f)
    except FileNotFoundError:
        return []
    chapters = []
    for subject_entry in catalog.get("subjects", []):
        name = subject_entry.get("subject_name", "").strip().lower()
        if subject_key not in name and name not in subject_key:
            continue
        for part in subject_entry.get("parts", []):
            chapters.extend(part.get("chapters", []))
        chapters.extend(subject_entry.get("chapters", []))
    return chapters

def build_progress_record(
    student_id: str,
    anon_id: str,
    class_id: str,
    subject: str,
    topic_id: str,
    question: str,
    answer: str,
    score: int,
    mastery_delta: int,
    misconception: str | None,
    misconception_type: str | None,
    language: str,
) -> dict:
    """
    Builds the exact record shape the ProgressPage IndexedDB expects.
    Frontend saves this — backend just returns it.
    """
    from datetime import datetime
    now = datetime.now()
    created_at = int(now.timestamp() * 1000)
    topic_label = topic_id.replace("-", " ").title()
    subject_label = subject.title()
    return {
        "id": f"{student_id}_{topic_id}_{int(now.timestamp())}",
        "student_id": student_id,
        "anon_id": anon_id,
        "class_id": class_id,
        "subject": subject,
        "subjectId": subject,
        "subjectLabel": subject_label,
        "topic_id": topic_id,
        "topicId": topic_id,
        "topicLabel": topic_label,
        "question": question,
        "answer": answer,
        "score": score,
        "masteryScore": score,
        "mastery_delta": mastery_delta,
        "misconception": misconception,
        "misconception_type": misconception_type,
        "misconceptionType": misconception_type or "Unclassified",
        "language": language,
        "timestamp": now.isoformat(),
        "createdAt": created_at,
        "window": now.strftime("%Y-%m-%d"),
    }
