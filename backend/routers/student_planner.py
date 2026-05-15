import json
import os
import io
from PyPDF2 import PdfReader
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from pydantic import BaseModel
from db import PostgresDB
from routers.auth import get_current_user
from typing import Optional, List

router = APIRouter(prefix="/api/student", tags=["Student Planner"])

# NOTE: No module-level AI client — we use ai_helper which handles
# Google Gemini → Groq fallback automatically.

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
    """Search DuckDuckGo using ddgs API for learning resources."""
    try:
        search_query = query + " tutorial learn"
        results = []
        with DDGS() as ddgs:
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


class RecommendationRequest(BaseModel):
    student_id: str
    topic_breakdown: list
    overall_accuracy: int
    weak_topics: list
    strong_topics: list

@router.post("/ml-recommendations")
async def get_ml_recommendations(req: RecommendationRequest):
    from ai_helper import generate_text_async

    prompt = f"""
Act as an expert personalized learning recommendation engine.
Analyze the following student's performance data and generate EXACTLY 3 highly specific, actionable study recommendations.

Overall Accuracy: {req.overall_accuracy}%
Strong Topics: {req.strong_topics}
Weak Topics: {req.weak_topics}
Topic Breakdown: {req.topic_breakdown}

For each recommendation, provide:
1. "title": A catchy, action-oriented title.
2. "reason": Why you are recommending this based on their exact data.
3. "action": The specific action they should take.
4. "type": "weakness", "strength", or "explore".

Return STRICT JSON format EXACTLY like this (NO Markdown wrappers, no ```json, just JSON):
{{
  "recommendations": [
    {{
      "title": "Master Newton's Laws",
      "reason": "Your accuracy is only 45% in this topic.",
      "action": "Re-read the chapter and take a practice quiz.",
      "type": "weakness"
    }}
  ]
}}
"""
    try:
        text_resp, provider = await generate_text_async(prompt)
        text_resp = text_resp.strip()
        if text_resp.startswith("```"):
            text_resp = text_resp.strip("`").removeprefix("json").strip()
        data = json.loads(text_resp)
        return {"recommendations": data.get("recommendations", [])}
    except Exception as e:
        print("ML Recommendation error:", e)
        return {"recommendations": []}

@router.post("/generate-plan")
async def generate_plan(req: PlanRequest):
    from ai_helper import generate_text_async

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

    try:
        text_resp, provider = await generate_text_async(prompt)
        print(f"[generate-plan] Served by {provider}")
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=f"AI service unavailable: {str(e)}")

    # Clean JSON if wrapped in markdown
    text_resp = text_resp.strip()
    if text_resp.startswith("```json"):
        text_resp = text_resp[7:]
    if text_resp.startswith("```"):
        text_resp = text_resp[3:]
    if text_resp.endswith("```"):
        text_resp = text_resp[:-3]
    text_resp = text_resp.strip()

    try:
        plan_data = json.loads(text_resp)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"AI returned invalid JSON: {str(e)}")

    try:
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
    """Study assistant — uses current plan + progress as context. Gemini → Groq fallback."""
    from ai_helper import generate_text_async

    try:
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

        prompt = f"""You are a helpful AI study assistant for a student.
Here is their current weekly study plan and progress:

{plan_context}

The student asks: "{req.message}"

Give a helpful, concise, and encouraging response. If they ask what to do today, look at incomplete tasks and guide them. If they ask for motivation, be supportive. Always reference their actual plan data."""

        response_text, provider = await generate_text_async(prompt)
        print(f"[ai-assistant] Served by {provider}")
        return {"status": "success", "response": response_text}

    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=f"AI assistant unavailable: {str(e)}")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))
