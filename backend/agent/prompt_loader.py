# backend/agent/prompt_loader.py

from .student_prompt import FINAL_PROMPT as student_prompt
from .faculty_prompt import FINAL_PROMPT as faculty_prompt
from .hod_prompt import FINAL_PROMPT as hod_prompt
from .admin_prompt import FINAL_PROMPT as admin_prompt

def get_prompt_by_role(role: str) -> str:
    """
    Returns the deterministic agent prompt mapped to the requested role.
    Role is strictly verified against exactly 4 targets.
    """
    if not role:
        raise ValueError("Role string cannot be empty.")
        
    normalized_role = role.lower().strip()
    
    if normalized_role == "student":
        return student_prompt
    elif normalized_role == "faculty":
        return faculty_prompt
    elif normalized_role == "hod":
        return hod_prompt
    elif normalized_role == "admin":
        return admin_prompt
    else:
        raise ValueError(f"CRITICAL ERROR: Unrecognized role '{role}'. Prompt loader aborted.")
