# backend/routers/auth.py

import time
from typing import Optional, Callable

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from auth_schemas import Token, UserCreate, UserLogin, UserRead, RefreshRequest, RefreshResponse
from auth_security import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)
from services.service import Service
from repos.repo import Repo

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

repo = Repo()
service = Service(repo)


def get_current_user(role: Optional[str] = None) -> Callable:
    """
    Returns a FastAPI dependency that extracts and validates the JWT,
    and optionally enforces role-based access.

    Usage:
        Depends(get_current_user(role="admin"))
    """

    async def _dependency(token: str = Depends(oauth2_scheme)) -> dict:
        payload = decode_access_token(token)
        if not payload or "user_id" not in payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )

        user = await service.get_user_by_id(payload["user_id"])
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )

        # Dynamic HOD role override
        if user["role"] == "faculty":
            faculty = await repo.get_faculty_by_user_id(user["id"])
            if faculty:
                dept_as_hod = await repo.get_department_by_hod(faculty.id)
                if dept_as_hod:
                    user["role"] = "hod"

        if role and user["role"] != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {role}",
            )

        return user

    return _dependency


@router.post("/register", response_model=UserRead)
async def register_user(user_in: UserCreate):
    existing = await service.get_user_by_email(user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    valid_roles = ("student", "faculty", "hod", "admin")
    if user_in.role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {valid_roles}",
        )

    user_id = "usr_" + str(int(time.time() * 1000))
    pw_hash = hash_password(user_in.password)

    user = await service.insert_user(
        user_id=user_id,
        name=user_in.name,
        email=user_in.email,
        password_hash=pw_hash,
        role=user_in.role,
    )

    return UserRead(id=user["id"], email=user["email"], name=user["name"], role=user["role"])


from auth_schemas import StudentRegister

@router.post("/register-student")
async def register_student_self(req: StudentRegister):
    # STEP 1: Find student by USN
    student = await repo.get_student_by_usn(req.usn)
    if not student:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid USN. Cannot register."
        )

    # STEP 2: Check if already linked
    if student.user_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student already registered"
        )
    
    # Check if user email already used
    existing_user = await service.get_user_by_email(req.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # STEP 3: Create user
    user_id = "usr_" + str(int(time.time() * 1000))
    pw_hash = hash_password(req.password)
    
    # We strictly set role to student and name to USN for tracing
    user = await service.insert_user(
        user_id=user_id,
        name=req.usn,
        email=req.email,
        password_hash=pw_hash,
        role="student",
    )
    
    # STEP 4: Link student
    linked = await repo.link_user_to_student(req.usn, user_id)
    if not linked:
        # Failsafe rollback theoretically needed, skipping for simple implementation
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to link student account."
        )

    # STEP 5: Return Login Response natively
    token_data = {"user_id": user["id"], "role": user["role"]}
    return Token(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        role=user["role"],
        username=user["name"],
    )


from auth_schemas import FacultyRegister

@router.post("/register-faculty")
async def register_faculty_self(req: FacultyRegister):
    # STEP 1: Find faculty
    faculty = await repo.get_faculty_by_code(req.faculty_code)
    if not faculty:
        return {"status": "error", "message": "Invalid faculty code"}

    # STEP 2: Check if already linked
    if faculty.user_id is not None:
        return {"status": "error", "message": "Faculty already registered"}

    # Check email
    existing_user = await service.get_user_by_email(req.email)
    if existing_user:
        return {"status": "error", "message": "Email already registered"}

    # STEP 3: Create user
    user_id = "usr_" + str(int(time.time() * 1000))
    pw_hash = hash_password(req.password)
    
    user = await service.insert_user(
        user_id=user_id,
        name=faculty.name,
        email=req.email,
        password_hash=pw_hash,
        role="faculty",
    )
    
    # STEP 4: Link faculty
    linked = await repo.link_user_to_faculty(req.faculty_code, user_id)
    if not linked:
        return {"status": "error", "message": "Failed to link faculty account"}

    # STEP 5: RETURN LOGIN RESPONSE
    token_data = {"user_id": user["id"], "role": user["role"]}
    return {
        "access_token": create_access_token(token_data),
        "refresh_token": create_refresh_token(token_data),
        "role": user["role"],
        "username": user["name"]
    }


@router.post("/login", response_model=Token)
async def login(user_in: UserLogin):
    user = await service.get_user_by_email(user_in.email)
    if not user or not verify_password(user_in.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # Dynamic HOD role override on login
    if user["role"] == "faculty":
        faculty = await repo.get_faculty_by_user_id(user["id"])
        if faculty:
            dept_as_hod = await repo.get_department_by_hod(faculty.id)
            if dept_as_hod:
                user["role"] = "hod"

    token_data = {"user_id": user["id"], "role": user["role"]}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user["role"],
        username=user["name"],
    )


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(req: RefreshRequest):
    payload = decode_refresh_token(req.refresh_token)
    if not payload or "user_id" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user = await service.get_user_by_id(payload["user_id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    # Dynamic HOD role override on refresh
    if user["role"] == "faculty":
        faculty = await repo.get_faculty_by_user_id(user["id"])
        if faculty:
            dept_as_hod = await repo.get_department_by_hod(faculty.id)
            if dept_as_hod:
                user["role"] = "hod"

    new_access_token = create_access_token({"user_id": user["id"], "role": user["role"]})
    return RefreshResponse(access_token=new_access_token)


@router.get("/me", response_model=UserRead)
async def get_me(current_user: dict = Depends(get_current_user())):
    return UserRead(
        id=current_user["id"],
        email=current_user["email"],
        name=current_user["name"],
        role=current_user["role"],
    )
