import json

from .prompt import INTENT_DETECTION_PROMPT, LANGUAGE_INSTRUCTION, TEACHER_SYSTEM_PROMPT
from .tools import build_progress_record, fetch_topic_content

TEACHER_SESSIONS = {}

def _extract_json(raw: str) -> str:
    text = (raw or "").strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:].strip()
    start = text.find("{")
    end = text.rfind("}")
    return text[start:end + 1] if start != -1 and end != -1 else text

async def detect_intent(message: str, llm_call) -> dict:
    prompt = INTENT_DETECTION_PROMPT.format(message=message)
    try:
        raw = await llm_call(prompt)
        return json.loads(_extract_json(raw))
    except Exception:
        lower = (message or "").lower()
        if any(word in lower for word in ("teach", "learn", "question me", "quiz me", "explain")):
            return {"intent": "teach", "class": None, "subject": None, "language": "en"}
        return {"intent": "chat", "class": None, "subject": None, "language": "en"}

async def run_teacher_pipeline(
    message: str,
    session_id: str,
    student_id: str,
    anon_id: str,
    language: str,
    llm_call,
) -> dict:
    """
    Full teacher agent pipeline.
    Returns agent_flow + response + progress_record for frontend to save.
    """
    agent_flow = []
    session = TEACHER_SESSIONS.get(session_id, {
        "state": "init",
        "class_id": None,
        "subject": None,
        "chapter_id": None,
        "topic_id": None,
        "current_question": None,
        "attempts": 0,
        "total_score": 0,
        "mastery": 0,
    })

    language = language or session.get("language") or "en"
    lang_instruction = LANGUAGE_INSTRUCTION.get(language, LANGUAGE_INSTRUCTION["en"])

    agent_flow.append({"agent": "Topic Resolver Agent", "status": "running", "message": "Identifying topic..."})
    intent = await detect_intent(message, llm_call)
    class_id = session.get("class_id") or intent.get("class") or "10"
    subject = session.get("subject") or intent.get("subject") or "mathematics"
    agent_flow[0]["status"] = "success"
    agent_flow[0]["message"] = f"Topic: Class {class_id} {subject}"

    agent_flow.append({"agent": "Content Fetcher Agent", "status": "running", "message": "Loading topic content..."})
    chapter_id = session.get("chapter_id") or "ch1"
    topic_id = session.get("topic_id") or "ch1-t1"
    topic_data = await fetch_topic_content(class_id, subject, chapter_id, topic_id)
    if not topic_data:
        agent_flow[1]["status"] = "error"
        agent_flow[1]["message"] = "Topic not found in dataset"
        return {
            "agent_flow": agent_flow,
            "response": "I couldn't find that topic. Please try a different chapter.",
            "teacher_active": True,
            "progress_record": None,
        }
    agent_flow[1]["status"] = "success"
    agent_flow[1]["message"] = f"Loaded: {topic_data.get('title', topic_id)}"

    agent_flow.append({"agent": "Teacher Agent", "status": "running", "message": "Generating response..."})
    system = TEACHER_SYSTEM_PROMPT.format(language_instruction=lang_instruction)
    context = f"""
Topic: {topic_data.get('title')}
Content: {topic_data.get('content', '')}
Available Questions: {json.dumps(topic_data.get('questions', []))}
Session State: {json.dumps(session)}
Student Message: {message}
"""
    try:
        raw_response = await llm_call(context, system=system)
        parsed = json.loads(_extract_json(raw_response))
    except Exception:
        questions = topic_data.get("questions", [])
        parsed = {
            "teacher_message": f"Let's learn {topic_data.get('title', topic_id)}. I will ask one question at a time.",
            "question": questions[0] if questions else None,
            "evaluation": None,
            "session_complete": False,
        }
    agent_flow[2]["status"] = "success"
    agent_flow[2]["message"] = "Response ready"

    progress_record = None
    agent_flow.append({"agent": "Progress Recorder Agent", "status": "running", "message": "Saving to dashboard..."})
    evaluation = parsed.get("evaluation")
    if evaluation and session.get("current_question"):
        progress_record = build_progress_record(
            student_id=student_id,
            anon_id=anon_id,
            class_id=class_id,
            subject=subject,
            topic_id=topic_id,
            question=session["current_question"],
            answer=message,
            score=evaluation.get("score", 0),
            mastery_delta=evaluation.get("mastery_delta", 0),
            misconception=evaluation.get("misconception"),
            misconception_type=evaluation.get("misconception_type"),
            language=language,
        )
        session["attempts"] += 1
        session["total_score"] += evaluation.get("score", 0)
        session["mastery"] = session["total_score"] // max(session["attempts"], 1)
    agent_flow[3]["status"] = "success"
    agent_flow[3]["message"] = "Saved" if progress_record else "No answer to record yet"

    session.update({
        "state": "active",
        "class_id": class_id,
        "subject": subject,
        "chapter_id": chapter_id,
        "topic_id": topic_id,
        "current_question": parsed.get("question"),
        "language": language,
    })
    TEACHER_SESSIONS[session_id] = session

    return {
        "agent_flow": agent_flow,
        "response": parsed.get("teacher_message", ""),
        "next_question": parsed.get("question"),
        "teacher_active": not parsed.get("session_complete", False),
        "progress_record": progress_record,
        "session": {"mastery": session["mastery"], "attempts": session["attempts"]},
        "subject": subject,
    }
