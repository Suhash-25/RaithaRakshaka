from fastapi import APIRouter, status, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from models.data_models import Faculty, Subject, Attendance, Marks
from services.service import Service
from repos.repo import Repo
from routers.auth import get_current_user

router = APIRouter()
repo = Repo()
service = Service(repo)


# -------------------- HOD: Assign Faculty / Subjects -------------------- #

@router.post("/faculty", status_code=status.HTTP_201_CREATED, response_model=Faculty)
async def register_faculty(
    faculty: Faculty,
    current_user: dict = Depends(get_current_user(role="hod")),
):
    """Register a new faculty member (HOD only)."""
    return await service.register_faculty(faculty)


@router.get("/faculty", response_model=List[Faculty])
async def list_faculty(
    department: Optional[str] = None,
    current_user: dict = Depends(get_current_user()),
):
    """List all faculty, optionally filtered by department."""
    return await service.list_faculty(department)


@router.get("/faculty/{faculty_id}", response_model=Faculty)
async def get_faculty(
    faculty_id: str,
    current_user: dict = Depends(get_current_user()),
):
    """Get faculty by ID."""
    f = await service.get_faculty(faculty_id)
    if not f:
        raise HTTPException(status_code=404, detail="Faculty not found")
    return f


@router.delete("/faculty")
async def delete_faculty_by_email(
    email: str,
    current_user: dict = Depends(get_current_user(role="admin")),
):
    """
    Admin-only: safely delete a faculty member and all their data by email.
    Blocked if they are currently assigned as a department HOD.
    """
    return await service.delete_faculty_by_email(email)


# -------------------- SUBJECTS -------------------- #

@router.post("/subjects", status_code=status.HTTP_201_CREATED, response_model=Subject)
async def manage_create_subject(
    subject: Subject,
    current_user: dict = Depends(get_current_user(role="hod")),
):
    """Create a new subject (HOD only)."""
    # Force subject's department to be the HOD's department
    faculty = await service.get_faculty_by_user_id(current_user["id"])
    if not faculty:
        raise HTTPException(status_code=403, detail="HOD faculty record not found")
    
    subject.department_id = faculty.department_id
    return await service.create_subject(subject)

@router.put("/subjects/{subject_id}", response_model=Subject)
async def manage_edit_subject(
    subject_id: str,
    subject: Subject,
    current_user: dict = Depends(get_current_user(role="hod")),
):
    """Edit a subject (HOD only)."""
    faculty = await service.get_faculty_by_user_id(current_user["id"])
    if not faculty:
        raise HTTPException(status_code=403, detail="HOD faculty record not found")
        
    existing = await service.get_subject(subject_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Subject not found")
    if existing.department_id != faculty.department_id:
        raise HTTPException(status_code=403, detail="Cannot edit subject from another department")
        
    subject.department_id = existing.department_id
    await service.update_subject(subject_id, subject)
    return await service.get_subject(subject_id)

@router.delete("/subjects/{subject_id}")
async def manage_delete_subject(
    subject_id: str,
    current_user: dict = Depends(get_current_user(role="hod")),
):
    """Delete a subject (HOD only)."""
    faculty = await service.get_faculty_by_user_id(current_user["id"])
    if not faculty:
        raise HTTPException(status_code=403, detail="HOD faculty record not found")
        
    existing = await service.get_subject(subject_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Subject not found")
    if existing.department_id != faculty.department_id:
        raise HTTPException(status_code=403, detail="Cannot delete subject from another department")
        
    await service.delete_subject(subject_id)
    return {"message": "Subject deleted successfully"}


@router.get("/subjects", response_model=List[Subject])
async def manage_list_subjects(
    department_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user()),
):
    """List all subjects, optionally filtered by department."""
    return await service.list_subjects(department_id)


class AssignSubjectPayload(BaseModel):
    faculty_id: str
    subject_id: str

@router.post("/assign-subject", status_code=status.HTTP_200_OK)
async def manage_assign_subject(
    payload: AssignSubjectPayload,
    current_user: dict = Depends(get_current_user(role="hod")),
):
    """Assign faculty to a subject (HOD only)."""
    # Verify HOD's department matches subject's department (optional but good idea)
    faculty = await service.get_faculty_by_user_id(current_user["id"])
    if not faculty:
        raise HTTPException(status_code=403, detail="HOD faculty record not found")
        
    s = await service.get_subject(payload.subject_id)
    if not s:
         raise HTTPException(status_code=404, detail="Subject not found")
    if s.department_id != faculty.department_id:
         raise HTTPException(status_code=403, detail="Cannot assign subject outside your department")

    fs_id = await service.assign_faculty_to_subject(payload.faculty_id, payload.subject_id)
    return {"message": "Faculty assigned to subject successfully", "id": fs_id}


# -------------------- FACULTY: Update Marks -------------------- #

@router.post("/marks", status_code=status.HTTP_201_CREATED, response_model=Marks)
async def add_marks(
    marks: Marks,
    current_user: dict = Depends(get_current_user(role="faculty")),
):
    """Add marks record (faculty only)."""
    return await service.add_marks(marks)


@router.put("/marks")
async def update_marks(
    marks: Marks,
    current_user: dict = Depends(get_current_user(role="faculty")),
):
    """Update marks record (faculty only)."""
    success = await service.update_marks(marks)
    if not success:
        raise HTTPException(status_code=404, detail="Marks record not found or not updated")
    return {"message": "Marks updated successfully"}


# -------------------- HOD: Reports -------------------- #

@router.get("/reports/department-students")
async def department_student_report(
    department: str,
    current_user: dict = Depends(get_current_user(role="hod")),
):
    """Get student count and list for a department (HOD only)."""
    students = await service.list_students(department)
    return {
        "department": department,
        "total_students": len(students),
        "students": [s.model_dump() for s in students],
    }


@router.get("/reports/department-faculty")
async def department_faculty_report(
    department: str,
    current_user: dict = Depends(get_current_user(role="hod")),
):
    """Get faculty count and list for a department (HOD only)."""
    faculty_list = await service.list_faculty(department)
    return {
        "department": department,
        "total_faculty": len(faculty_list),
        "faculty": [f.model_dump() for f in faculty_list],
    }