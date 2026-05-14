# backend/auth_schemas.py

from typing import Optional
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "student"  # student, faculty, hod, admin


class StudentRegister(BaseModel):
    usn: str
    email: EmailStr
    password: str


class FacultyRegister(BaseModel):
    faculty_code: str
    email: EmailStr
    password: str


class UserRead(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    refresh_token: str
    role: str
    username: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class RefreshResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
