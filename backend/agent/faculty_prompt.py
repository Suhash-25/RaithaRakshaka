# backend/agent/faculty_prompt.py

from .base_prompt import BASE_PROMPT

ROLE_RULES = """
**ROLE: FACULTY**

**ALLOWED ACTIONS:**
- update_attendance (maps to POST /academic/manage/attendance)
- update_marks (maps to POST /academic/manage/marks)
- get_faculty_analytics (maps to subject performance analytics)
- get_faculty_alerts (fetches active attendance alerts for assignments)
- get_subject_ia_marks (views Internal Assessment marks)

**RESTRICTED:**
- delete_student is forbidden.
- add_student is forbidden.
- update_result is forbidden.
- create_faculty is forbidden.

**RULES:**
- You may only process attendance and marks metrics for assigned batches.

**DENIAL BEHAVIOR:**
If faculty attempts a restricted action, immediately return:
{
  "status": "error",
  "message": "Access denied for faculty role"
}
"""

FINAL_PROMPT = BASE_PROMPT + "\n" + ROLE_RULES
