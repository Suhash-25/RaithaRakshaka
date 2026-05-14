# backend/routers/intelligence.py
# Intelligence layer: analytics, alerts, notifications, reports, AI prediction

import io
import time
from typing import Optional

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from repos.repo import Repo
from services.service import Service
from routers.auth import get_current_user

router = APIRouter()
repo   = Repo()
service = Service(repo)


# ============================================================
# HELPER — resolve student/faculty ID from authenticated user
# ============================================================

async def _resolve_student_id(user: dict) -> str:
    student = await repo.get_student_by_user_id(user["id"])
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")
    return student.id

async def _resolve_faculty(user: dict):
    faculty = await repo.get_faculty_by_user_id(user["id"])
    if not faculty:
        raise HTTPException(status_code=403, detail="Faculty record not found")
    return faculty

async def _resolve_hod_dept(user: dict) -> str:
    faculty = await repo.get_faculty_by_user_id(user["id"])
    if not faculty:
        raise HTTPException(status_code=403, detail="HOD faculty record not found")
    dept = await repo.get_department_by_hod(faculty.id)
    if not dept:
        raise HTTPException(status_code=403, detail="No department assigned to this HOD")
    return dept.id


# ============================================================
# ANALYTICS
# ============================================================

@router.get("/analytics/student")
async def analytics_student(
    current_user: dict = Depends(get_current_user(role="student")),
):
    """Student: attendance analytics per subject."""
    student_id = await _resolve_student_id(current_user)
    return await service.get_analytics_student(student_id)


@router.get("/analytics/faculty")
async def analytics_faculty(
    current_user: dict = Depends(get_current_user()),
):
    """Faculty/HOD: per-subject avg attendance and low-performer count."""
    if current_user["role"] not in ("faculty", "hod"):
        raise HTTPException(status_code=403, detail="Access denied")
    faculty = await _resolve_faculty(current_user)
    return await service.get_analytics_faculty(faculty.id)


@router.get("/analytics/hod")
async def analytics_hod(
    current_user: dict = Depends(get_current_user(role="hod")),
):
    """HOD: department-wide attendance analytics."""
    dept_id = await _resolve_hod_dept(current_user)
    return await service.get_analytics_hod(dept_id)


@router.get("/analytics/admin")
async def analytics_admin(
    current_user: dict = Depends(get_current_user(role="admin")),
):
    """Admin: system-wide stats."""
    return await service.get_analytics_admin()


# ============================================================
# ALERTS  (role-routed, single endpoint)
# ============================================================

@router.get("/alerts")
async def get_alerts(
    current_user: dict = Depends(get_current_user()),
):
    """
    Role-based alert endpoint.
    - student  → own low-attendance subjects
    - faculty  → students below threshold in assigned subjects
    - hod      → students below threshold across entire department
    - admin    → system-wide coverage
    """
    role = current_user["role"]

    if role == "student":
        student_id = await _resolve_student_id(current_user)
        return await service.get_alerts_student(student_id)

    if role in ("faculty", "hod"):
        faculty = await _resolve_faculty(current_user)
        if role == "hod":
            dept_id = await _resolve_hod_dept(current_user)
            return await service.get_alerts_hod(dept_id)
        return await service.get_alerts_faculty(faculty.id)

    if role == "admin":
        return await service.get_alerts_admin()

    return []


# ============================================================
# NOTIFICATIONS
# ============================================================

@router.get("/notifications")
async def get_notifications(
    current_user: dict = Depends(get_current_user()),
):
    """Fetch all notifications addressed to the current user."""
    return await service.get_notifications(current_user["id"])


# ============================================================
# REPORTS  (CSV + Excel) — admin only
# ============================================================

def _df_to_csv_response(df: pd.DataFrame, filename: str) -> StreamingResponse:
    buf = io.StringIO()
    df.to_csv(buf, index=False)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


def _df_to_excel_response(df: pd.DataFrame, filename: str) -> StreamingResponse:
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Report")
    buf.seek(0)
    return StreamingResponse(
        iter([buf.read()]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/reports/students")
async def report_students_csv(
    current_user: dict = Depends(get_current_user(role="admin")),
):
    """Admin: download student report as CSV."""
    rows = await service.get_all_students_report()
    df = pd.DataFrame(rows, columns=["id", "usn", "name", "department", "department_id", "semester", "avg_attendance"])
    df.rename(columns={"avg_attendance": "avg_attendance_%"}, inplace=True)
    return _df_to_csv_response(df, "students_report.csv")


@router.get("/reports/students/excel")
async def report_students_excel(
    current_user: dict = Depends(get_current_user(role="admin")),
):
    """Admin: download student report as Excel."""
    rows = await service.get_all_students_report()
    df = pd.DataFrame(rows, columns=["id", "usn", "name", "department", "department_id", "semester", "avg_attendance"])
    df.rename(columns={"avg_attendance": "avg_attendance_%"}, inplace=True)
    return _df_to_excel_response(df, "students_report.xlsx")


@router.get("/reports/faculty")
async def report_faculty_csv(
    current_user: dict = Depends(get_current_user(role="admin")),
):
    """Admin: download faculty report as CSV."""
    rows = await service.get_all_faculty_report()
    df = pd.DataFrame(rows, columns=["id", "faculty_code", "name", "department", "department_id", "email"])
    return _df_to_csv_response(df, "faculty_report.csv")


@router.get("/reports/faculty/excel")
async def report_faculty_excel(
    current_user: dict = Depends(get_current_user(role="admin")),
):
    """Admin: download faculty report as Excel."""
    rows = await service.get_all_faculty_report()
    df = pd.DataFrame(rows, columns=["id", "faculty_code", "name", "department", "department_id", "email"])
    return _df_to_excel_response(df, "faculty_report.xlsx")


# ============================================================
# AI PREDICTION
# ============================================================

@router.get("/predict/student/{student_id}")
async def predict_student(
    student_id: str,
    current_user: dict = Depends(get_current_user()),
):
    """
    Heuristic risk prediction for a student.
    - student  → can only view own prediction
    - faculty/hod/admin → can view any student
    """
    role = current_user["role"]

    if role == "student":
        # Ensure student can only see their own prediction
        own_student = await repo.get_student_by_user_id(current_user["id"])
        if not own_student or own_student.id != student_id:
            raise HTTPException(status_code=403, detail="Access denied")

    # Verify student exists
    student = await repo.get_student(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    return await service.predict_student_risk(student_id)
