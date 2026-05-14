import json
import os
import io
from PyPDF2 import PdfReader
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from pydantic import BaseModel
import google.generativeai as genai
from db import PostgresDB
from routers.auth import get_current_user
from typing import Optional, List

router = APIRouter(prefix="/api/student", tags=["Student Planner"])

# Setup Gemini Direct API — reuse the same key as the rest of the system
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY", ""))

class PlanRequest(BaseModel):
    student_id: str
    resume_text: str

class ProgressUpdateRequest(BaseModel):
    student_id: str
    day: str
    task: str
    completed: bool

class AiAssistantRequest(BaseModel):
    student_id: str
    message: str

@router.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF allowed")
    try:
        content = await file.read()
        reader = PdfReader(io.BytesIO(content))
        text = ""
        for page in reader.pages:
            text += (page.extract_text() or "") + "\n"
        return {"resume_text": text.strip(), "status": "processed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF reading error: {str(e)}")


from duckduckgo_search import DDGS

def scrape_resources(query: str, max_results: int = 3) -> list:
    """Search DuckDuckGo using duckduckgo_search API for learning resources."""
    try:
        search_query = query + " tutorial learn"
        results = []
        with DDGS() as ddgs:
            # text search returns a generator of dicts: {'title': ..., 'href': ..., 'body': ...}
            for idx, r in enumerate(ddgs.text(search_query)):
                if idx >= max_results:
                    break
                results.append({
                    "title": r.get('title', ''), 
                    "url": r.get('href', '')
                })
        return results
    except Exception as e:
        print(f"Scrape error for '{query}': {e}")
        return []


@router.post("/generate-plan")
async def generate_plan(req: PlanRequest):
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = f"""
        Analyze this student's resume and generate a structured 7-day learning plan.
        Include:
        - daily goals
        - skills to improve
        - difficulty level
        - estimated time per day
        - a short search_query per day (used to find online resources)

        Resume: {req.resume_text}

        Return STRICT JSON format EXACTLY like this (NO Markdown wrappers, just JSON):
        {{
          "week_plan": [
            {{
              "day": "Day 1",
              "goal": "...",
              "tasks": ["...", "..."],
              "time_estimate": "2 hours",
              "search_query": "python data structures beginner"
            }}
          ]
        }}
        """
        response = model.generate_content(prompt)
        text_resp = response.text.strip()

        # Clean JSON if wrapped in markdown
        if text_resp.startswith("```json"):
            text_resp = text_resp[7:]
        if text_resp.startswith("```"):
            text_resp = text_resp[3:]
        if text_resp.endswith("```"):
            text_resp = text_resp[:-3]
        text_resp = text_resp.strip()

        plan_data = json.loads(text_resp)

        # Scrape real resource links for each day using the search_query
        for day_plan in plan_data.get("week_plan", []):
            query = day_plan.get("search_query") or day_plan.get("goal", "")
            resources = scrape_resources(query)
            day_plan["resources"] = resources

        async with PostgresDB.pool.acquire() as conn:
            existing = await conn.fetchval("SELECT id FROM student_plans WHERE student_id = $1", req.student_id)
            if existing:
                await conn.execute("UPDATE student_plans SET plan_json = $1 WHERE student_id = $2", json.dumps(plan_data), req.student_id)
                await conn.execute("DELETE FROM student_progress WHERE student_id = $1", req.student_id)
            else:
                await conn.execute("INSERT INTO student_plans (student_id, plan_json) VALUES ($1, $2)", req.student_id, json.dumps(plan_data))

            for daily_plan in plan_data.get("week_plan", []):
                day = daily_plan.get("day")
                for task in daily_plan.get("tasks", []):
                    await conn.execute(
                        "INSERT INTO student_progress (student_id, day, task, completed) VALUES ($1, $2, $3, False)",
                        req.student_id, day, task
                    )

        return {"status": "success", "plan": plan_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/plan/{student_id}")
async def get_plan(student_id: str):
    try:
        async with PostgresDB.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT plan_json FROM student_plans WHERE student_id = $1", student_id)
            if not row:
                return {"plan": None}
            plan_data = json.loads(row["plan_json"])
            
            # Fetch progress
            progress_rows = await conn.fetch(
                "SELECT day, task, completed FROM student_progress WHERE student_id = $1", student_id
            )
            
            # Integrate progress into the response
            progress_map = {}
            for r in progress_rows:
                if r["day"] not in progress_map:
                    progress_map[r["day"]] = {}
                progress_map[r["day"]][r["task"]] = r["completed"]
                
            for dp in plan_data.get("week_plan", []):
                dp["progress"] = progress_map.get(dp["day"], {})
                
            return {"plan": plan_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/update-progress")
async def update_progress(req: ProgressUpdateRequest):
    try:
        async with PostgresDB.pool.acquire() as conn:
            await conn.execute(
                "UPDATE student_progress SET completed = $1 WHERE student_id = $2 AND day = $3 AND task = $4",
                req.completed, req.student_id, req.day, req.task
            )
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/notifications/{student_id}")
async def get_notifications(student_id: str):
    try:
        async with PostgresDB.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT id, message, read_status, created_at as timestamp FROM notifications WHERE receiver_id = $1 ORDER BY created_at DESC",
                student_id
            )
            return {"notifications": [dict(r) for r in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/notifications/read/{notification_id}")
async def mark_notification_read(notification_id: int):
    try:
        async with PostgresDB.pool.acquire() as conn:
            await conn.execute("UPDATE notifications SET read_status = True WHERE id = $1", str(notification_id))
            return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai-assistant")
async def ai_assistant(req: AiAssistantRequest):
    """Single Gemini pipeline — sends current plan + progress as context for contextual answers."""
    try:
        # Fetch current plan and progress
        plan_context = "No active plan."
        async with PostgresDB.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT plan_json FROM student_plans WHERE student_id = $1", req.student_id)
            if row:
                plan_data = json.loads(row["plan_json"])
                progress_rows = await conn.fetch(
                    "SELECT day, task, completed FROM student_progress WHERE student_id = $1", req.student_id
                )
                progress_map = {}
                for r in progress_rows:
                    if r["day"] not in progress_map:
                        progress_map[r["day"]] = {}
                    progress_map[r["day"]][r["task"]] = r["completed"]
                for dp in plan_data.get("week_plan", []):
                    dp["progress"] = progress_map.get(dp["day"], {})
                plan_context = json.dumps(plan_data, indent=2)

        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = f"""You are a helpful AI study assistant for a student.
Here is their current weekly study plan and progress:

{plan_context}

The student asks: "{req.message}"

Give a helpful, concise, and encouraging response. If they ask what to do today, look at incomplete tasks and guide them. If they ask for motivation, be supportive. Always reference their actual plan data."""

        response = model.generate_content(prompt)
        return {"status": "success", "response": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

