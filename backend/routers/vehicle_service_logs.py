from fastapi import APIRouter, status, Depends, HTTPException, UploadFile, File, Form
from typing import List, Optional
from pydantic import BaseModel
import json
import base64
from datetime import datetime

from models.data_models import Student, Faculty, Subject, Attendance, Marks, Result, Department
from services.service import Service
from repos.repo import Repo
from routers.auth import get_current_user

router = APIRouter()
repo = Repo()
service = Service(repo)

class AssignHODPayload(BaseModel):
    faculty_code: str



# ==========================================
# AGENT INTEGRATION Endpoint
# ==========================================
class AgentQuery(BaseModel):
    query: str

@router.post("/ask-agent")
async def ask_agent(
    payload: AgentQuery,
    current_user: dict = Depends(get_current_user()),
):
    """
    Run the deterministic agent based on the logged-in user's role prompt.
    """
    role = current_user.get("role")
    
    from agent.prompt_loader import get_prompt_by_role
    prompt = get_prompt_by_role(role)
    
    from google.adk.agents import LlmAgent
    from constants import AGENT_NAME, AGENT_MODEL, AGENT_DESCRIPTION
    from agent.tools import (
        add_student, fetch_student_data, list_all_students, create_faculty,
        list_all_faculty, add_subject, list_all_subjects, update_attendance,
        get_student_attendance, update_marks, get_student_marks,
        calculate_sgpa_cgpa, get_student_result, list_all_results
    )
    
    user_agent = LlmAgent(
        name=f"{AGENT_NAME}_{role}",
        model=AGENT_MODEL,
        description=AGENT_DESCRIPTION,
        instruction=prompt,
        tools=[
            add_student, fetch_student_data, list_all_students, create_faculty,
            list_all_faculty, add_subject, list_all_subjects, update_attendance,
            get_student_attendance, update_marks, get_student_marks,
            calculate_sgpa_cgpa, get_student_result, list_all_results
        ]
    )
    
    response = await user_agent.arun(payload.query)
    
    try:
        clean_json = response.strip().strip("```json").strip("```").strip()
        data = json.loads(clean_json)
        return data
    except Exception:
        return {"status": "error", "message": "Agent failed to return structured JSON", "raw": response}


@router.post("/ask-agent-with-file")
async def ask_agent_with_file(
    query: str = Form(...),
    file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user()),
):
    """
    Agent endpoint that accepts an optional file attachment (image, PDF, Excel, CSV).
    The file content is extracted and injected into the agent prompt alongside the user query.
    Images are sent natively to Gemini for vision analysis.
    """
    role = current_user.get("role")

    from agent.prompt_loader import get_prompt_by_role
    prompt = get_prompt_by_role(role)

    from google.adk.agents import LlmAgent
    from constants import AGENT_NAME, AGENT_MODEL, AGENT_DESCRIPTION
    from agent.tools import (
        add_student, fetch_student_data, list_all_students, create_faculty,
        list_all_faculty, add_subject, list_all_subjects, update_attendance,
        get_student_attendance, update_marks, get_student_marks,
        calculate_sgpa_cgpa, get_student_result, list_all_results
    )

    # --- Process file if provided ---
    file_context = ""
    image_parts = []  # For Gemini multimodal vision

    if file:
        try:
            from routers.file_upload import (
                process_excel_file, process_csv_file,
                process_pdf_file, process_image_file
            )

            contents = await file.read()
            fname = file.filename or "uploaded_file"
            ctype = file.content_type or ""

            if ctype in ['application/vnd.ms-excel',
                         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] \
                    or fname.endswith(('.xlsx', '.xls')):
                result = await process_excel_file(contents, fname)
                file_context = f"\n\n--- ATTACHED FILE DATA ---\n{result['content']}\n--- END FILE DATA ---\n"

            elif ctype == 'text/csv' or fname.endswith('.csv'):
                result = await process_csv_file(contents, fname)
                file_context = f"\n\n--- ATTACHED FILE DATA ---\n{result['content']}\n--- END FILE DATA ---\n"

            elif ctype == 'application/pdf' or fname.endswith('.pdf'):
                result = await process_pdf_file(contents, fname)
                file_context = f"\n\n--- ATTACHED PDF CONTENT ---\n{result['content']}\n--- END PDF CONTENT ---\n"

            elif ctype.startswith('image/') or fname.lower().endswith(
                    ('.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp')):
                import base64
                b64 = base64.b64encode(contents).decode('utf-8')
                mime = ctype or 'image/png'
                # Build Gemini-compatible inline_data part
                image_parts.append({
                    "inline_data": {
                        "mime_type": mime,
                        "data": b64
                    }
                })
                file_context = f"\n\n[User has attached an image: {fname}. Analyze the image and respond to their query.]\n"
            else:
                file_context = f"\n\n[User attached a file ({fname}) of unsupported type ({ctype}). Inform them only Excel, CSV, PDF, and image files are supported.]\n"
        except Exception as e:
            file_context = f"\n\n[File processing failed: {str(e)}. Inform the user.]\n"

    # --- Build agent query ---
    full_query = query + file_context

    user_agent = LlmAgent(
        name=f"{AGENT_NAME}_{role}",
        model=AGENT_MODEL,
        description=AGENT_DESCRIPTION,
        instruction=prompt,
        tools=[
            add_student, fetch_student_data, list_all_students, create_faculty,
            list_all_faculty, add_subject, list_all_subjects, update_attendance,
            get_student_attendance, update_marks, get_student_marks,
            calculate_sgpa_cgpa, get_student_result, list_all_results
        ]
    )

    # If image parts exist, try to pass them via Gemini's multimodal content format
    if image_parts:
        try:
            # Build multimodal content: [image_part, text_part]
            from google.genai import types as genai_types
            content_parts = []
            for img_part in image_parts:
                content_parts.append(genai_types.Part.from_bytes(
                    data=base64.b64decode(img_part["inline_data"]["data"]),
                    mime_type=img_part["inline_data"]["mime_type"]
                ))
            content_parts.append(genai_types.Part.from_text(text=full_query))

            response = await user_agent.arun(content_parts)
        except Exception:
            # Fallback: send as text-only with image description
            response = await user_agent.arun(full_query)
    else:
        response = await user_agent.arun(full_query)

    try:
        clean_json = response.strip().strip("```json").strip("```").strip()
        data = json.loads(clean_json)
        return data
    except Exception:
        return {"status": "success", "response": response}


# ==========================================
# ADMIN ENDPOINTS
# ==========================================

@router.post("/departments", status_code=status.HTTP_201_CREATED, response_model=Department)
async def create_department(
    dept: Department,
    current_user: dict = Depends(get_current_user(role="admin")),
):
    """Create a new department."""
    return await service.create_department(dept)

class FacultyDeptAssign(BaseModel):
    department_id: str

@router.put("/manage/faculty/{faculty_id}", response_model=Faculty)
async def assign_faculty_department(
    faculty_id: str,
    payload: FacultyDeptAssign,
    current_user: dict = Depends(get_current_user(role="admin")),
):
    """Admin assigning faculty to a department."""
    return await service.update_faculty_department(faculty_id, payload.department_id)

@router.post("/students", status_code=status.HTTP_201_CREATED, response_model=Student)
async def register_student(
    student: Student,
    current_user: dict = Depends(get_current_user(role="admin")),
):
    """Register a new student."""
    return await service.register_student(student)

@router.delete("/students/{student_id}", status_code=status.HTTP_200_OK)
async def delete_student(
    student_id: str,
    current_user: dict = Depends(get_current_user(role="admin")),
):
    """Delete a student."""
    return await service.delete_student(student_id)

@router.post("/results", status_code=status.HTTP_201_CREATED, response_model=Result)
async def enter_result(
    result: Result,
    current_user: dict = Depends(get_current_user(role="admin")),
):
    """Enter student result (admin)."""
    return await service.add_result(result)

@router.put("/results/{student_id}", response_model=Result)
async def update_result(
    student_id: str,
    result: Result,
    current_user: dict = Depends(get_current_user(role="admin")),
):
    """Update student result (admin)."""
    result.student_id = student_id
    success = await service.update_result(result)
    if not success:
        raise HTTPException(status_code=404, detail="Result not found or not updated")
    return result


@router.put("/manage/departments/{department_id}/assign-hod")
async def assign_hod(
    department_id: str,
    payload: AssignHODPayload,
    current_user: dict = Depends(get_current_user(role="admin")),
):
    faculty = await repo.get_faculty_by_code(payload.faculty_code)
    if not faculty:
        return {"status": "error", "message": "Invalid faculty code"}
    
    if faculty.department_id != department_id:
        return {"status": "error", "message": "Faculty does not belong to this department"}
        
    dept = await service.get_department(department_id)
    if dept.hod_faculty_id:
        return {"status": "error", "message": "HOD already assigned for this department"}
        
    existing_assignment = await repo.get_department_by_hod(faculty.id)
    if existing_assignment:
        return {"status": "error", "message": "Faculty already assigned as HOD"}
        
    await repo.assign_hod_to_department(department_id, faculty.id)
    return {"status": "success", "message": "HOD assigned successfully"}

# ==========================================
# HOD ENDPOINTS
# ==========================================
# (HODs can create faculty if missing)
@router.post("/manage/faculty", status_code=status.HTTP_201_CREATED, response_model=Faculty)
async def assign_faculty_route(
    faculty: Faculty,
    current_user: dict = Depends(get_current_user()),
):
    """Assign or register a faculty member (HOD or Admin)."""
    if current_user["role"] not in ["admin", "hod"]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    dept = await service.get_department(faculty.department_id)
    if not dept:
        raise HTTPException(status_code=400, detail="Department does not exist")
    faculty.department = dept.name
    
    existing = await repo.get_faculty_by_code(faculty.faculty_code)
    if existing:
        raise HTTPException(status_code=400, detail="Faculty code already exists")
        
    return await service.register_faculty(faculty)


@router.get("/manage/reports/{dept}")
async def get_department_report(
    dept: str,
    current_user: dict = Depends(get_current_user(role="hod")),
):
    """Get summarized statistics for a department."""
    stds = await service.list_students(dept)
    facs = await service.list_faculty(dept)
    return {
        "department": dept,
        "total_students": len(stds),
        "total_faculty": len(facs)
    }


# ==========================================
# FACULTY ENDPOINTS
# ==========================================

@router.post("/manage/attendance", response_model=Attendance)
async def create_attendance(
    attendance: Attendance,
    current_user: dict = Depends(get_current_user(role="faculty")),
):
    """Faculty creating attendance."""
    return await service.add_attendance(attendance)

@router.put("/manage/attendance", response_model=Attendance)
async def update_attendance(
    attendance: Attendance,
    current_user: dict = Depends(get_current_user(role="faculty")),
):
    """Faculty updating attendance."""
    success = await service.update_attendance(attendance)
    if not success:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    return attendance

@router.post("/manage/marks", response_model=Marks)
async def create_marks(
    marks: Marks,
    current_user: dict = Depends(get_current_user(role="faculty")),
):
    """Faculty creating marks."""
    return await service.add_marks(marks)

@router.put("/manage/marks", response_model=Marks)
async def update_marks(
    marks: Marks,
    current_user: dict = Depends(get_current_user(role="faculty")),
):
    """Faculty updating marks."""
    success = await service.update_marks(marks)
    if not success:
        raise HTTPException(status_code=404, detail="Marks record not found")
    return marks


class SessionCreateRequest(BaseModel):
    subject_id: str
    total_classes: Optional[int] = None

class AttendanceMarkRequest(BaseModel):
    absent_student_ids: List[str]

@router.post("/attendance/session/start")
@router.post("/attendance/session")
async def create_attendance_session(
    req: SessionCreateRequest,
    current_user: dict = Depends(get_current_user())
):
    faculty = await service.get_faculty_by_user_id(current_user["id"])
    if not faculty:
        raise HTTPException(status_code=403, detail="Faculty record not found")
        
    session_date = datetime.now().strftime("%Y-%m-%d")
    session_id = await service.create_attendance_session(
        req.subject_id, faculty.id, session_date, total_classes=req.total_classes
    )
    return {"message": "Session created", "session_id": session_id}

@router.get("/attendance/session/{session_id}/students")
async def get_session_students(
    session_id: str,
    current_user: dict = Depends(get_current_user())
):
    if current_user.get("role") not in ["faculty", "hod"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return await service.get_students_for_session(session_id)

@router.post("/attendance/session/{session_id}/mark")
async def mark_session_attendance(
    session_id: str,
    req: AttendanceMarkRequest,
    current_user: dict = Depends(get_current_user())
):
    await service.mark_attendance(session_id, req.absent_student_ids)
    return {"message": "Attendance marked successfully"}

@router.get("/attendance/subject/{subject_id}/sessions")
async def get_subject_sessions(
    subject_id: str,
    current_user: dict = Depends(get_current_user())
):
    return await service.get_attendance_sessions(subject_id)

@router.put("/attendance/session/{session_id}/update")
async def update_session_attendance(
    session_id: str,
    req: AttendanceMarkRequest,
    current_user: dict = Depends(get_current_user())
):
    session = await repo.get_attendance_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    faculty = await service.get_faculty_by_user_id(current_user["id"])
    if not faculty or session["faculty_id"] != faculty.id:
        raise HTTPException(status_code=403, detail="You can only edit your own sessions")
        
    await service.update_marked_attendance(session_id, req.absent_student_ids)
    return {"message": "Attendance updated successfully"}

@router.get("/attendance/session/{session_id}/records")
async def get_session_records(
    session_id: str,
    current_user: dict = Depends(get_current_user())
):
    if current_user.get("role") not in ["faculty", "hod"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return await service.get_attendance_records(session_id)

# ==========================================
# STUDENT "MY" ENDPOINTS
# ==========================================

@router.get("/me")
async def get_my_profile(
    current_user: dict = Depends(get_current_user()),
):
    """View own profile."""
    role = current_user.get("role")
    
    if role == "student":
        student = await service.get_student_by_user_id(current_user["id"])
        if not student:
            raise HTTPException(status_code=404, detail="Student record not found or not linked.")
        
        dept_name = "Unknown"
        if student.department_id:
            dept_obj = await service.get_department(student.department_id)
            if dept_obj:
                dept_name = dept_obj.name
                
        return {
            "id": student.id,
            "usn": student.usn,
            "department": dept_name,
            "semester": student.semester
        }
    elif role in ["faculty", "hod"]:
        faculty = await service.get_faculty_by_user_id(current_user["id"])
        if not faculty:
            raise HTTPException(status_code=404, detail="Faculty record not found or not linked.")
        
        dept_name = "Unknown"
        if faculty.department_id:
            dept_obj = await service.get_department(faculty.department_id)
            if dept_obj:
                dept_name = dept_obj.name
                
        return {
            "name": faculty.name,
            "faculty_code": faculty.faculty_code,
            "department": dept_name
        }
    else:
        raise HTTPException(status_code=403, detail="Not supported for this role")

@router.get("/my/department")
async def view_my_department(
    current_user: dict = Depends(get_current_user()),
):
    """View own department info (student, faculty, hod)."""
    role = current_user.get("role")
    dept_id = None
    
    if role == "student":
        student = await service.get_student_by_user_id(current_user["id"])
        if student:
            dept_id = student.department_id
    elif role in ["faculty", "hod"]:
        faculty = await service.get_faculty_by_user_id(current_user["id"])
        if faculty:
            dept_id = faculty.department_id

    if not dept_id:
        return {}
    return await service.get_department(dept_id)

@router.get("/my/subjects", response_model=List[Subject])
async def view_my_subjects(
    current_user: dict = Depends(get_current_user()),
):
    """View assigned subjects (faculty/HOD)."""
    role = current_user.get("role")
    if role not in ["faculty", "hod"]:
        raise HTTPException(status_code=403, detail="Only faculty and HOD have assigned subjects")
        
    faculty = await service.get_faculty_by_user_id(current_user["id"])
    if not faculty:
        return []
        
    return await service.get_faculty_subjects(faculty.id)

@router.get("/my/attendance")
async def view_my_attendance(
    current_user: dict = Depends(get_current_user(role="student")),
):
    """View own attendance (student only)."""
    student = await service.get_student_by_user_id(current_user["id"])
    if not student:
        return []
    records = await service.get_student_session_attendance(student.id)
    return records


# ==========================================
# HOD — DEPARTMENT STUDENT VISIBILITY
# ==========================================

@router.get("/hod/students")
async def hod_get_students(
    current_user: dict = Depends(get_current_user(role="hod")),
):
    """HOD: get all students in their department, grouped by semester."""
    return await service.get_hod_students_grouped(current_user["id"])


@router.get("/hod/student/{student_id}")
async def hod_get_student_detail(
    student_id: str,
    current_user: dict = Depends(get_current_user(role="hod")),
):
    """HOD: full student detail (attendance + marks) — dept-locked."""
    return await service.get_hod_student_detail(student_id, current_user["id"])


@router.get("/hod/subject/{subject_id}/sessions")
async def hod_get_subject_sessions(
    subject_id: str,
    current_user: dict = Depends(get_current_user(role="hod")),
):
    """HOD: view all sessions for a subject in their department."""
    return await service.get_attendance_sessions(subject_id)


# ==========================================
# STUDENT — SEMESTER-BASED SUBJECTS + SESSION ATTENDANCE
# ==========================================

@router.get("/my/semester-subjects")
async def view_my_semester_subjects(
    current_user: dict = Depends(get_current_user(role="student")),
):
    """Student: subjects filtered by own department + semester."""
    return await service.get_student_subjects(current_user["id"])


@router.get("/my/subject/{subject_id}/attendance")
async def view_my_subject_attendance(
    subject_id: str,
    current_user: dict = Depends(get_current_user(role="student")),
):
    """Student: per-session attendance for a specific subject."""
    return await service.get_student_subject_session_attendance(current_user["id"], subject_id)

@router.get("/my/subject/{subject_id}/analytics")
async def get_my_subject_analytics(
    subject_id: str,
    current_user: dict = Depends(get_current_user(role="student")),
):
    """Student: analytics for a specific subject."""
    # Rely on existing session method to do the math
    data = await service.get_student_subject_session_attendance(current_user["id"], subject_id)
    # The return from the existing method is: {"subject": name, "total_sessions": count, "attended": count, "sessions": list}
    
    total = data.get("total_sessions", 0)
    attended = data.get("attended", 0)
    missed = total - attended
    pct = round(attended / total * 100, 1) if total > 0 else 0
    absent_dates = [s["date"].isoformat() if hasattr(s["date"], "isoformat") else str(s["date"]) for s in data.get("sessions", []) if s["status"] == "absent"]
    
    return {
        "subject": data.get("subject", "Unknown"),
        "total_classes": total,
        "attended": attended,
        "missed": missed,
        "percentage": pct,
        "absent_dates": absent_dates
    }

class QueryRequest(BaseModel):
    subject_id: str
    message: str

@router.post("/student/query")
async def submit_student_query(
    req: QueryRequest,
    current_user: dict = Depends(get_current_user(role="student")),
):
    """Student: Submit query regarding attendance."""
    student = await service.get_student_by_user_id(current_user["id"])
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    qid = await service.insert_student_query(student.id, req.subject_id, req.message)
    return {"message": "Query submitted", "query_id": qid}


@router.get("/my/marks")
async def view_my_marks(
    current_user: dict = Depends(get_current_user(role="student")),
):
    """View own marks (student only)."""
    student = await service.get_student_by_user_id(current_user["id"])
    if not student:
        return []
    result = await service.get_marks(student.id)
    return result if result else []


@router.get("/my/results")
async def view_my_results(
    current_user: dict = Depends(get_current_user(role="student")),
):
    """View own results (student only)."""
    student = await service.get_student_by_user_id(current_user["id"])
    if not student:
        return {}
    result = await service.get_result(student.id)
    if not result:
        return {}
    return result


# ==========================================
# GENERAL PUBLIC ROUTING FOR AUTHORIZED ROLES
# ==========================================

@router.get("/departments", response_model=List[Department])
async def list_departments(
    current_user: dict = Depends(get_current_user()),
):
    return await service.list_departments()

@router.get("/departments/{department_id}/hod")
async def get_department_hod(
    department_id: str,
    current_user: dict = Depends(get_current_user()),
):
    dept = await service.get_department(department_id)
    if not dept.hod_faculty_id:
        return {}
    faculty = await repo.get_faculty(dept.hod_faculty_id)
    if faculty:
        return {"faculty_code": faculty.faculty_code, "name": faculty.name}
    return {}

@router.get("/departments/{dept_id}", response_model=Department)
async def get_department(
    dept_id: str,
    current_user: dict = Depends(get_current_user()),
):
    return await service.get_department(dept_id)

@router.get("/faculty", response_model=List[Faculty])
async def list_faculty(
    department_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user()),
):
    return await service.list_faculty(department_id)

@router.get("/students", response_model=List[Student])
async def list_students(
    department: Optional[str] = None,
    current_user: dict = Depends(get_current_user()),
):
    return await service.list_students(department)

@router.get("/subjects", response_model=List[Subject])
async def list_subjects(
    department_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user()),
):
    return await service.list_subjects(department_id)

    return await service.list_subjects(department_id)

@router.get("/marks/{student_id}", response_model=List[Marks])
async def get_marks(
    student_id: str,
    subject_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user()),
):
    return await service.get_marks(student_id, subject_id)

@router.get("/results/{student_id}", response_model=Result)
async def get_result(
    student_id: str,
    current_user: dict = Depends(get_current_user()),
):
    result = await service.get_result(student_id)
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")
    return result

@router.get("/results", response_model=List[Result])
async def list_all_results(
    current_user: dict = Depends(get_current_user()),
):
    return await service.list_results()


# ==========================================
# IA MARKS ENDPOINTS
# ==========================================

class IAMarkEntry(BaseModel):
    student_id: str
    marks_obtained: int

class IAMarksUploadPayload(BaseModel):
    subject_id: str
    max_marks: int = 40
    marks: List[IAMarkEntry]


@router.post("/manage/ia-marks")
async def upload_ia_marks(
    payload: IAMarksUploadPayload,
    current_user: dict = Depends(get_current_user(role="faculty")),
):
    """Faculty: Upload IA marks for a subject. Faculty must be assigned to the subject."""
    # Get faculty record
    faculty = await service.get_faculty_by_user_id(current_user["id"])
    if not faculty:
        raise HTTPException(status_code=403, detail="Faculty record not found for current user")

    # Verify faculty is assigned to this subject
    is_assigned = await service.is_faculty_assigned_to_subject(faculty.id, payload.subject_id)
    if not is_assigned:
        raise HTTPException(status_code=403, detail="You are not assigned to this subject")

    # Get subject to verify it exists and get department/semester
    subject = await service.get_subject(payload.subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    # Validate marks
    errors = []
    for entry in payload.marks:
        if entry.marks_obtained < 0 or entry.marks_obtained > payload.max_marks:
            errors.append(f"Student {entry.student_id}: marks must be 0-{payload.max_marks}")

        # Verify student exists and belongs to correct department + semester
        student = await service.get_student(entry.student_id)
        if not student:
            errors.append(f"Student {entry.student_id}: not found")
        elif subject.department_id and student.department_id != subject.department_id:
            errors.append(f"Student {entry.student_id}: department mismatch")
        elif subject.semester and student.semester != subject.semester:
            errors.append(f"Student {entry.student_id}: semester mismatch")

    if errors:
        raise HTTPException(status_code=400, detail={"errors": errors})

    # Upload marks
    marks_data = [{"student_id": e.student_id, "marks_obtained": e.marks_obtained} for e in payload.marks]
    results = await service.upload_ia_marks(faculty.id, payload.subject_id, marks_data, payload.max_marks)

    return {"message": f"IA marks saved for {len(results)} students", "results": results}


@router.get("/manage/ia-marks/{subject_id}")
async def get_subject_ia_marks(
    subject_id: str,
    current_user: dict = Depends(get_current_user(role="faculty")),
):
    """Faculty: View IA marks for a subject they teach."""
    faculty = await service.get_faculty_by_user_id(current_user["id"])
    if not faculty:
        raise HTTPException(status_code=403, detail="Faculty record not found")

    is_assigned = await service.is_faculty_assigned_to_subject(faculty.id, subject_id)
    if not is_assigned:
        raise HTTPException(status_code=403, detail="You are not assigned to this subject")

    marks = await service.get_ia_marks_for_subject(subject_id)
    return [
        {
            "student_id": m["student_id"],
            "student_name": m.get("student_name", "Unknown"),
            "usn": m.get("usn", ""),
            "marks": m["marks_obtained"],
            "max": m["max_marks"],
        }
        for m in marks
    ]


@router.get("/my/ia-marks")
async def view_my_ia_marks(
    current_user: dict = Depends(get_current_user(role="student")),
):
    """Student: View own IA marks with status classification."""
    student = await service.get_student_by_user_id(current_user["id"])
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")

    marks = await service.get_ia_marks_for_student(student.id)

    def get_status(obtained, max_marks):
        if max_marks == 0:
            return "N/A"
        pct = (obtained / max_marks) * 100
        if pct >= 75:
            return "good"
        elif pct >= 50:
            return "average"
        else:
            return "needs improvement"

    return [
        {
            "subject": m["subject_name"],
            "subject_code": m.get("subject_code", ""),
            "marks": m["marks_obtained"],
            "max": m["max_marks"],
            "status": get_status(m["marks_obtained"], m["max_marks"]),
        }
        for m in marks
    ]


@router.get("/hod/ia-analytics/{subject_id}")
async def hod_ia_analytics(
    subject_id: str,
    current_user: dict = Depends(get_current_user(role="hod")),
):
    """HOD: View IA performance analytics for a subject in their department."""
    faculty = await service.get_faculty_by_user_id(current_user["id"])
    if not faculty:
        raise HTTPException(status_code=403, detail="HOD faculty record not found")

    subject = await service.get_subject(subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    if subject.department_id != faculty.department_id:
        raise HTTPException(status_code=403, detail="Subject is not in your department")

    analytics = await service.get_ia_analytics_subject(subject_id)

    return {
        "subject": subject.subject_name,
        "subject_code": subject.subject_code,
        "average_marks": analytics["average_marks"],
        "top_performers": [
            {"name": p.get("student_name", "Unknown"), "usn": p.get("usn", ""), "marks": p["marks_obtained"]}
            for p in analytics["top_performers"]
        ],
        "low_performers": [
            {"name": p.get("student_name", "Unknown"), "usn": p.get("usn", ""), "marks": p["marks_obtained"]}
            for p in analytics["low_performers"]
        ],
    }


@router.get("/admin/ia-analytics")
async def admin_ia_analytics(
    current_user: dict = Depends(get_current_user(role="admin")),
):
    """Admin: System-wide IA analytics — overall average, top/weak subjects."""
    analytics = await service.get_ia_admin_analytics()
    return {
        "overall_avg": analytics["overall_avg"],
        "top_subjects": [
            {"subject": s["subject_name"], "code": s["subject_code"], "avg_marks": round(float(s["avg_marks"]), 1)}
            for s in analytics["top_subjects"]
        ],
        "weak_subjects": [
            {"subject": s["subject_name"], "code": s["subject_code"], "avg_marks": round(float(s["avg_marks"]), 1)}
            for s in analytics["weak_subjects"]
        ],
    }
