import os
import inspect
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from routers.auth import get_current_user
from agent.prompt_loader import get_prompt_by_role
from agent.tools import (
    add_student,
    fetch_student_data,
    list_all_students,
    create_faculty,
    list_all_faculty,
    add_subject,
    list_all_subjects,
    update_attendance,
    get_student_attendance,
    update_marks,
    get_student_marks,
    calculate_sgpa_cgpa,
    get_student_result,
    list_all_results,
    get_student_analytics,
    get_faculty_analytics,
    get_hod_analytics,
    get_admin_analytics,
    predict_student_risk,
    get_student_alerts,
    get_faculty_alerts,
    get_hod_alerts,
    get_admin_alerts,
    get_subject_ia_marks,
    get_student_ia_marks,
    get_ia_admin_analytics
)
from services.service import Service
from repos.repo import Repo
import uuid

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    student_id: str = None
    session_id: str = None

# ── Helper tool functions ───────────────────────────────────────────────────────

def extract_faculty_from_pdf(file: str = "default.pdf") -> list:
    """Mock PDF extraction returning 5 sample faculties."""
    return [
        {"name": "Priyanka", "department": "AI & ML"},
        {"name": "Rahul",    "department": "CSE"},
        {"name": "Sneha",    "department": "ECE"},
        {"name": "Arun",     "department": "MECH"},
        {"name": "Kavya",    "department": "CIVIL"}
    ]

async def create_department(name: str) -> dict:
    repo = Repo(); service = Service(repo)
    from models.data_models import Department
    try:
        await repo.insert_department(Department(id=name, name=name))
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

async def assign_hod(faculty_id: str, department_id: str) -> dict:
    repo = Repo(); service = Service(repo)
    try:
        success = await repo.assign_hod_to_department(faculty_id, department_id)
        return {"success": success}
    except Exception as e:
        return {"success": False, "error": str(e)}

async def assign_subject(faculty_id: str, subject_id: str) -> dict:
    repo = Repo(); service = Service(repo)
    try:
        success = await service.assign_faculty_to_subject(faculty_id, subject_id)
        return {"success": True, "id": success}
    except Exception as e:
        return {"success": False, "error": str(e)}

async def view_department(department_id: str) -> dict:
    repo = Repo(); service = Service(repo)
    dept = await service.get_department(department_id)
    return dept.model_dump() if dept else {"error": "not found"}

async def view_subjects(department_id: str = None) -> list:
    repo = Repo(); service = Service(repo)
    subs = await service.list_subjects()
    return [s.model_dump() for s in subs]

async def mark_attendance(student_id: str, subject_id: str, attendance_percentage: float) -> dict:
    return await update_attendance(student_id, subject_id, attendance_percentage)

async def view_attendance(student_id: str) -> dict:
    return await get_student_attendance(student_id)

async def create_subject(name: str, department: str, semester: int) -> dict:
    return await add_subject(name, department, semester)

async def get_student_weekly_plan(student_id: str) -> dict:
    """Gets the student's AI weekly plan and progress."""
    from db import PostgresDB
    import json
    try:
        async with PostgresDB.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT plan_json FROM student_plans WHERE student_id = $1", student_id)
            if not row:
                return {"message": "No active study plan found. Please upload a resume first."}
            plan_data = json.loads(row["plan_json"])
            progress_rows = await conn.fetch(
                "SELECT day, task, completed FROM student_progress WHERE student_id = $1", student_id
            )
            progress_map = {}
            for r in progress_rows:
                if r["day"] not in progress_map:
                    progress_map[r["day"]] = {}
                progress_map[r["day"]][r["task"]] = r["completed"]
            for dp in plan_data.get("week_plan", []):
                dp["progress"] = progress_map.get(dp["day"], {})
            return plan_data
    except Exception as e:
        return {"error": str(e)}

# ── Role → allowed tools map ────────────────────────────────────────────────────

ALLOWED_TOOLS = {
    "admin": [
        extract_faculty_from_pdf, create_faculty, create_department,
        assign_hod, get_admin_analytics, get_admin_alerts, get_ia_admin_analytics
    ],
    "faculty": [
        mark_attendance, view_subjects,
        get_faculty_analytics, get_faculty_alerts, get_subject_ia_marks
    ],
    "hod": [
        create_subject, assign_subject, view_department,
        get_hod_analytics, get_hod_alerts,
        get_faculty_analytics, get_faculty_alerts, get_subject_ia_marks
    ],
    "student": [
        view_attendance, view_subjects,
        get_student_analytics, predict_student_risk,
        get_student_alerts, get_student_ia_marks, get_student_weekly_plan
    ]
}

# ── /agent/chat endpoint ────────────────────────────────────────────────────────

@router.post("/chat")
async def agent_chat(req: ChatRequest):
    """
    AI chat endpoint — powered by Groq (llama-3.3-70b).
    Loads the role prompt and answers the student's message conversationally.
    """
    role = "student"
    tools = ALLOWED_TOOLS.get(role, [])

    # Security: block tool-trick attempts
    if "extract_faculty" in req.message.lower() and role != "admin":
        return {"status": "error", "message": "Tool access denied"}

    prompt = get_prompt_by_role(role)

    # Admin PDF shortcut (unchanged)
    if "pdf" in req.message.lower() and role == "admin":
        import time
        pdf_data = extract_faculty_from_pdf("faculty.pdf")
        created_count = 0
        repo = Repo(); service = Service(repo)
        from models.data_models import Faculty
        for entry in pdf_data:
            fid = f"fac_{int(time.time()*1000)}_{uuid.uuid4().hex[:4]}"
            f = Faculty(
                id=fid,
                faculty_code=f"FAC-{entry['name'].upper()[:3]}",
                name=entry['name'],
                department=entry['department'],
                department_id=entry['department']
            )
            try:
                await service.register_faculty(f)
                created_count += 1
            except:
                pass
        return {"status": "success", "action": "bulk_faculty_create", "created": created_count}

    # ── Groq-powered response ──────────────────────────────────────────────────
    from ai_helper import generate_text_async

    groq_prompt = (
        f"{prompt}\n\n"
        f"User message: {req.message}\n\n"
        "Answer helpfully and concisely as the AI learning assistant. "
        "If the student asks about their attendance, marks, or results, "
        "let them know you can help and guide them to use the correct section of the app."
    )

    try:
        response_text, provider = await generate_text_async(groq_prompt)
        print(f"[agent_chat] Served by {provider}")
        return {"status": "success", "response": response_text, "agent_flow": []}
    except RuntimeError as e:
        return {
            "status": "error",
            "message": (
                "⚠️ AI service is unavailable. "
                "Ensure GROQ_API_KEY is set in backend/.env — "
                "get a free key at https://console.groq.com/keys"
            )
        }
