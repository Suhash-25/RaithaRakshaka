import os
from dotenv import load_dotenv

load_dotenv()

import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from google.adk.cli.fast_api import get_fast_api_app

from services.service import Service
from repos.repo import Repo
from routers import vehicle_service_logs, mechanics, file_upload, voice, agent_chat
from routers.auth import router as auth_router
from routers.intelligence import router as intelligence_router
from routers import student_planner
from contextlib import asynccontextmanager
from db import PostgresDB
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import json
from pydantic import BaseModel
from auth_security import hash_password, password_needs_rehash, verify_password, create_access_token, decode_access_token
from fastapi import Request, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

class StandardResponse(BaseModel):
    success: bool
    message: str
    data: dict = None

from routers.intelligence import router as intelligence_router
from routers import student_planner
from contextlib import asynccontextmanager
from db import PostgresDB
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import json

async def daily_planner_notifications():
    async with PostgresDB.pool.acquire() as conn:
        # Find students who have incomplete tasks for today (mocking today for simplicity)
        # We would ideally match today's day with the plan's day, but for a simplified
        # production-ready model, we just remind everyone who has active plans
        plans = await conn.fetch("SELECT student_id FROM student_plans")
        for p in plans:
            sid = p["student_id"]
            import uuid
            nid = f"notif_{uuid.uuid4().hex}"
            try:
                await conn.execute(
                    "INSERT INTO notifications (id, sender_id, receiver_id, message, type) VALUES ($1, $2, $3, $4, $5)",
                    nid, "system", sid, "Remember to check your AI Student Planner and complete your daily goals!", "planner_reminder"
                )
            except Exception as e:
                print(f"Failed to insert notification: {e}")

scheduler = AsyncIOScheduler()
scheduler.add_job(daily_planner_notifications, 'cron', hour=8, minute=0)


AGENT_DIR = os.path.dirname(os.path.abspath(__file__))

ALLOWED_ORIGINS = [
    "*",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5176",
    "http://localhost:5177",
    "http://127.0.0.1:5177",
]

SERVE_WEB_INTERFACE = True

repo = Repo()
service = Service(repo)

app = get_fast_api_app(
    agents_dir=AGENT_DIR,
    allow_origins=ALLOWED_ORIGINS,
    web=SERVE_WEB_INTERFACE,
)

# Single CORS middleware — overrides ADK's internal CORS to ensure all browsers can reach all endpoints
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok"}

class AuthRegister(BaseModel):
    name: str
    email: str
    password: str
    role: str = "student"
    local_id: str = None
    usn: str = None

class AuthLogin(BaseModel):
    email: str
    password: str

VALID_USER_ROLES = {"student", "faculty", "hod", "admin"}

def normalize_user_role(role: str | None) -> str:
    normalized = (role or "student").strip().lower()
    if normalized not in VALID_USER_ROLES:
        raise HTTPException(status_code=400, detail="Invalid user role")
    return normalized

def auth_success_payload(user: dict, access_token: str) -> dict:
    return {
        "token": access_token,
        "access_token": access_token,
        "student_id": user["id"],
        "role": user["role"],
        "user": {
            "id": user["id"],
            "name": user.get("name"),
            "email": user.get("email"),
            "role": user.get("role"),
        },
    }

@app.post("/auth/register", response_model=StandardResponse)
async def hybrid_register(req: AuthRegister):
    req.email = req.email.strip().lower()
    req.role = normalize_user_role(req.role)
    existing = await service.get_user_by_email(req.email)
    if existing:
        token_data = {"user_id": existing["id"], "role": existing["role"]}
        access_token = create_access_token(token_data)
        return StandardResponse(
            success=True,
            message="Registration successful",
            data=auth_success_payload(existing, access_token),
        )
    
    import time
    user_id = "usr_" + str(int(time.time() * 1000))
    pw_hash = hash_password(req.password)
    
    try:
        user = await service.insert_user(
            user_id=user_id,
            name=req.name,
            email=req.email,
            password_hash=pw_hash,
            role=req.role,
        )
    except Exception as exc:
        if exc.__class__.__name__ != "UniqueViolationError":
            raise
        user = await service.get_user_by_email(req.email)
        if not user:
            raise
    
    token_data = {"user_id": user["id"], "role": user["role"]}
    access_token = create_access_token(token_data)
    
    return StandardResponse(
        success=True,
        message="Registration successful",
        data=auth_success_payload(user, access_token),
    )

@app.post("/auth/login", response_model=StandardResponse)
async def hybrid_login(req: AuthLogin):
    email = req.email.strip().lower()
    user = await service.get_user_by_email(email)
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        return StandardResponse(success=False, message="Unauthorized")

    if password_needs_rehash(user.get("password_hash", "")):
        await service.update_user_password_hash(user["id"], hash_password(req.password))
    
    token_data = {"user_id": user["id"], "role": user["role"]}
    access_token = create_access_token(token_data)
    
    return StandardResponse(
        success=True,
        message="Login successful",
        data=auth_success_payload(user, access_token),
    )

@app.post("/api/auth/register", response_model=StandardResponse)
async def hybrid_register_api(req: AuthRegister):
    return await hybrid_register(req)

@app.post("/api/auth/login", response_model=StandardResponse)
async def hybrid_login_api(req: AuthLogin):
    return await hybrid_login(req)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_access_token(token)
    if not payload or "user_id" not in payload:
        raise HTTPException(status_code=401, detail="Unauthorized")
    user = await service.get_user_by_id(payload["user_id"])
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@app.get("/auth/me", response_model=StandardResponse)
async def hybrid_get_me(current_user: dict = Depends(get_current_user)):
    return StandardResponse(
        success=True,
        message="Success",
        data={
            "student_id": current_user["id"],
            "name": current_user["name"],
            "email": current_user["email"],
            "role": current_user["role"]
        }
    )

@app.get("/api/auth/me", response_model=StandardResponse)
async def hybrid_get_me_api(current_user: dict = Depends(get_current_user)):
    return await hybrid_get_me(current_user)

# Disable the conflicting auth router
# app.include_router(auth_router)


app.include_router(
    vehicle_service_logs.router,
    prefix="/academic",
    tags=["Academic"],
)

app.include_router(
    mechanics.router,
    prefix="/academic/manage",
    tags=["AcademicManagement"],
)

app.include_router(
    file_upload.router,
    prefix="/academic/api/files",
    tags=["files"],
)

app.include_router(
    voice.router,
    prefix="/academic/api/voice",
    tags=["voice"],
)

app.include_router(
    agent_chat.router,
    prefix="/agent",
    tags=["Agent Chat"],
)

app.include_router(
    intelligence_router,
    prefix="/academic",
    tags=["Intelligence"],
)

app.include_router(student_planner.router)

# ── PV (PrernaVasthara) learning routes ────────────────────────────────────
# These serve the PV frontend's /api/* calls (proxied by Vite)
from pv_app.routes import api_router as pv_api_router
app.include_router(
    pv_api_router,
    prefix="/api",
    tags=["PV Learning"],
)

# Health endpoint for PV frontend
@app.get("/api/health")
async def pv_health():
    return {"status": "ok"}


# ── Direct chat (casual / no agent pipeline) ───────────────────────────────
class DirectChatRequest(BaseModel):
    message: str
    student_id: str = None

@app.post("/api/chat/direct")
async def direct_chat(req: DirectChatRequest):
    """Handles casual/conversational messages. Uses Google Gemini with Groq fallback."""
    from ai_helper import generate_text_async
    from utils.catalog_helper import CatalogHelper

    topic_desc = None
    try:
        all_topics = CatalogHelper.get_all_topics()
        for topic in all_topics:
            if topic.lower() in req.message.lower():
                topic_desc = CatalogHelper.get_description(topic)
                if topic_desc:
                    break
    except Exception:
        pass

    kb_context = f"\n\nKnowledge Base Context:\n{topic_desc}" if topic_desc else ""
    prompt = (
        "You are an Expert Tutor and AI Learning Assistant for school students (Classes 1 to 12). "
        "You have deep knowledge in ALL subjects: Mathematics, English, Physics, Chemistry, Biology, History, Geography, etc. "
        "When a student asks you to explain ANY concept, you must provide a highly specific, clear, step-by-step, and engaging answer. "
        "Use simple analogies, real-world examples, and structure your explanation well to ensure the student thoroughly understands. "
        "If it is a greeting, respond warmly and ask what subject they want to learn today. "
        "If knowledge base context is provided, use it to enhance your explanation."
        f"{kb_context}\n\n"
        f"Student: {req.message}"
    )

    try:
        response_text, provider = await generate_text_async(prompt)
        print(f"[chat/direct] Served by {provider}")

        # Aggressive JSON unwrapping if the AI stubbornly outputs JSON
        import json
        text_to_return = response_text
        try:
            clean_text = response_text.strip()
            if clean_text.startswith("```json"): clean_text = clean_text[7:]
            if clean_text.startswith("```"): clean_text = clean_text[3:]
            if clean_text.endswith("```"): clean_text = clean_text[:-3]
            clean_text = clean_text.strip()
            parsed = json.loads(clean_text)
            if isinstance(parsed, dict):
                if "data" in parsed and isinstance(parsed["data"], dict) and "message" in parsed["data"]:
                    text_to_return = parsed["data"]["message"]
                elif "message" in parsed: text_to_return = parsed["message"]
                elif "response" in parsed: text_to_return = parsed["response"]
                elif "teacher_message" in parsed: text_to_return = parsed["teacher_message"]
        except Exception:
            pass

        return {"success": True, "data": {"response": text_to_return, "agent_flow": []}}
    except RuntimeError as e:
        return {
            "success": False,
            "data": {
                "response": (
                    "⚠️ All AI providers are unavailable.\n\n"
                    "**Quick fix:** Get a FREE Groq API key (no billing needed):\n"
                    "1. Go to https://console.groq.com/keys\n"
                    "2. Sign up free → Create API Key\n"
                    "3. Add to backend/.env: GROQ_API_KEY=your_key_here\n"
                    "4. Restart python main.py"
                ),
                "agent_flow": []
            }
        }





IMAGE_DIR = os.path.join(AGENT_DIR, "service_images")
os.makedirs(IMAGE_DIR, exist_ok=True)

app.mount("/service_images", StaticFiles(directory=IMAGE_DIR), name="service_images")

# -------------------- Postgres bootstrap --------------------

@asynccontextmanager
async def lifespan(app):
    try:
        await PostgresDB.connect()
        if not scheduler.running:
            scheduler.start()

        async with PostgresDB.pool.acquire() as conn:
            await conn.execute("""
        CREATE TABLE IF NOT EXISTS departments (
            id TEXT PRIMARY KEY,
            name TEXT
        );
        """)
        
            try:
                await conn.execute("ALTER TABLE departments ADD COLUMN IF NOT EXISTS hod_faculty_id TEXT UNIQUE;")
            except Exception:
                pass

            await conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT UNIQUE,
            password_hash TEXT,
            role TEXT CHECK (role IN ('student','faculty','hod','admin'))
        );
        """)
            await conn.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;")
            await conn.execute("""
        UPDATE users
        SET role = CASE
            WHEN role IS NULL OR TRIM(role) = '' THEN 'student'
            WHEN LOWER(TRIM(role)) IN ('student', 'faculty', 'hod', 'admin') THEN LOWER(TRIM(role))
            ELSE 'student'
        END;
        """)
            await conn.execute("""
        ALTER TABLE users
        ADD CONSTRAINT users_role_check
        CHECK (role IN ('student','faculty','hod','admin'));
        """)

            await conn.execute("""
        CREATE TABLE IF NOT EXISTS students (
            id TEXT PRIMARY KEY,
            user_id TEXT REFERENCES users(id),
            usn TEXT,
            department TEXT,
            semester INTEGER
        );
        """)

            await conn.execute("""
        CREATE TABLE IF NOT EXISTS faculty (
            id TEXT PRIMARY KEY,
            user_id TEXT REFERENCES users(id),
            faculty_code TEXT UNIQUE,
            name TEXT,
            department TEXT,
            department_id TEXT
        );
        """)
        
            try:
                await conn.execute("ALTER TABLE faculty ADD COLUMN IF NOT EXISTS faculty_code TEXT UNIQUE;")
                await conn.execute("ALTER TABLE faculty ADD COLUMN IF NOT EXISTS name TEXT;")
                await conn.execute("ALTER TABLE faculty ADD COLUMN IF NOT EXISTS department_id TEXT;")
            except Exception:
                pass

            await conn.execute("""
        CREATE TABLE IF NOT EXISTS subjects (
            id TEXT PRIMARY KEY,
            subject_name TEXT,
            subject_code TEXT UNIQUE,
            department_id TEXT
        );
        """)

            await conn.execute("""
        CREATE TABLE IF NOT EXISTS faculty_subjects (
            id TEXT PRIMARY KEY,
            faculty_id TEXT REFERENCES faculty(id),
            subject_id TEXT REFERENCES subjects(id)
        );
        """)
        
            await conn.execute("""
        CREATE TABLE IF NOT EXISTS student_queries (
            id TEXT PRIMARY KEY,
            student_id TEXT REFERENCES students(id),
            subject_id TEXT REFERENCES subjects(id),
            message TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
            try:
                await conn.execute("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS subject_name TEXT;")
                await conn.execute("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS subject_code TEXT UNIQUE;")
                await conn.execute("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS department_id TEXT;")
                await conn.execute("ALTER TABLE subjects ADD COLUMN IF NOT EXISTS semester INTEGER;")
            except Exception:
                pass

            await conn.execute("""
        CREATE TABLE IF NOT EXISTS attendance_sessions (
            id TEXT PRIMARY KEY,
            subject_id TEXT REFERENCES subjects(id),
            faculty_id TEXT REFERENCES faculty(id),
            session_number INTEGER,
            total_sessions INTEGER DEFAULT 40,
            total_classes INTEGER,
            date DATE
        );
        """)
        
            try:
                await conn.execute("ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS total_classes INTEGER;")
            except Exception:
                pass

            await conn.execute("""
        CREATE TABLE IF NOT EXISTS attendance_records (
            id TEXT PRIMARY KEY,
            session_id TEXT REFERENCES attendance_sessions(id),
            student_id TEXT REFERENCES students(id),
            status TEXT CHECK (status IN ('present', 'absent'))
        );
        """)

            await conn.execute("""
        CREATE TABLE IF NOT EXISTS attendance (
            id TEXT PRIMARY KEY,
            student_id TEXT REFERENCES students(id),
            subject_id TEXT REFERENCES subjects(id),
            attendance_percentage REAL
        );
        """)

            await conn.execute("""
        CREATE TABLE IF NOT EXISTS marks (
            id TEXT PRIMARY KEY,
            student_id TEXT REFERENCES students(id),
            subject_id TEXT REFERENCES subjects(id),
            internal_marks REAL,
            external_marks REAL
        );
        """)

            await conn.execute("""
        CREATE TABLE IF NOT EXISTS results (
            id TEXT PRIMARY KEY,
            student_id TEXT REFERENCES students(id),
            sgpa REAL,
            cgpa REAL
        );
        """)

            await conn.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id TEXT PRIMARY KEY,
            sender_id TEXT,
            receiver_id TEXT,
            message TEXT,
            type TEXT DEFAULT 'query',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)
        
            try:
                await conn.execute("ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_status BOOLEAN DEFAULT FALSE;")
            except Exception:
                pass

            await conn.execute("""
        CREATE TABLE IF NOT EXISTS ia_marks (
            id TEXT PRIMARY KEY,
            student_id TEXT REFERENCES students(id),
            subject_id TEXT REFERENCES subjects(id),
            faculty_id TEXT REFERENCES faculty(id),
            marks_obtained INTEGER NOT NULL,
            max_marks INTEGER DEFAULT 40,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(student_id, subject_id)
        );
        """)
    except Exception as exc:
        print(f"Postgres bootstrap skipped: {exc}")

    yield

app.router.lifespan_context = lifespan
# ----------------------------------------------------------

@app.post("/auth/anon")
async def create_anon_id(request: Request):
    from utils.hashing import generate_anon_id

    body = await request.json()
    fingerprint = body.get("fingerprint")
    if not isinstance(fingerprint, str):
        raise HTTPException(status_code=422, detail="fingerprint must be a string")
    return {"anon_id": generate_anon_id(fingerprint)}

def _normalize_voice_language(language):
    if not language:
        return "en"
    language = language.lower()
    if language.startswith("hi"):
        return "hi"
    if language.startswith("kn"):
        return "kn"
    return "en"

class VoiceSpeakRequest(BaseModel):
    text: str
    language: str = "en"

@app.post("/voice/transcribe")
async def transcribe_voice(request: Request):
    import httpx
    import subprocess

    try:
        form = await request.form()
        upload = form.get("audio") or form.get("file")
    except Exception:
        upload = None

    if upload and hasattr(upload, "read"):
        audio_bytes = await upload.read()
        filename = getattr(upload, "filename", "") or "voice.webm"
        content_type = getattr(upload, "content_type", None) or "audio/webm"
    else:
        audio_bytes = await request.body()
        filename = "voice.webm"
        content_type = request.headers.get("content-type") or "audio/webm"

    if not audio_bytes:
        raise HTTPException(status_code=422, detail="audio blob is required")

    api_key = os.environ.get("SARVAM_API_KEY", "").strip()
    if not api_key or api_key == "your_key_here":
        raise HTTPException(status_code=500, detail="SARVAM_API_KEY is not configured")

    def convert_to_wav(raw_audio_bytes: bytes) -> bytes:
        result = subprocess.run(
            ["ffmpeg", "-i", "pipe:0", "-ar", "16000", "-ac", "1", "-f", "wav", "pipe:1"],
            input=raw_audio_bytes,
            capture_output=True,
        )
        if result.returncode != 0:
            raise Exception(f"ffmpeg conversion failed: {result.stderr.decode()}")
        return result.stdout

    try:
        wav_bytes = convert_to_wav(audio_bytes)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            sarvam_response = await client.post(
                "https://api.sarvam.ai/speech-to-text",
                headers={"api-subscription-key": api_key},
                data={
                    "model": "saarika:v2.5",
                    "language_code": "unknown",
                },
                files={"file": ("audio.wav", wav_bytes, "audio/wav")},
            )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Sarvam speech-to-text request failed: {exc}") from exc

    if sarvam_response.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"Sarvam speech-to-text failed ({sarvam_response.status_code}): {sarvam_response.text}",
        )

    data = sarvam_response.json()
    transcript = (data.get("transcript") or "").strip()
    language = _normalize_voice_language(data.get("language_code"))

    return {"success": True, "data": {"transcript": transcript, "language": language}}

@app.post("/voice/speak")
async def speak_voice(req: VoiceSpeakRequest):
    from fastapi.responses import Response
    import base64
    import httpx

    if not req.text or not req.text.strip():
        raise HTTPException(status_code=422, detail="text is required")

    api_key = os.environ.get("SARVAM_API_KEY", "").strip()
    if not api_key or api_key == "your_key_here":
        raise HTTPException(status_code=500, detail="SARVAM_API_KEY is not configured")

    language_map = {
        "en": "en-IN",
        "hi": "hi-IN",
        "kn": "kn-IN",
    }
    language = _normalize_voice_language(req.language)

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            sarvam_response = await client.post(
                "https://api.sarvam.ai/text-to-speech",
                headers={
                    "api-subscription-key": api_key,
                    "Content-Type": "application/json",
                },
                json={
                    "text": req.text.strip(),
                    "target_language_code": language_map[language],
                    "model": "bulbul:v3",
                    "speaker": "shubh",
                    "speech_sample_rate": 24000,
                    "output_audio_codec": "wav",
                },
            )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Sarvam text-to-speech request failed: {exc}") from exc

    if sarvam_response.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"Sarvam text-to-speech failed ({sarvam_response.status_code}): {sarvam_response.text}",
        )

    data = sarvam_response.json()
    audio_b64 = (data.get("audios") or [None])[0]
    if not audio_b64:
        raise HTTPException(status_code=500, detail="speech generation failed")

    return Response(content=base64.b64decode(audio_b64), media_type="audio/wav")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
