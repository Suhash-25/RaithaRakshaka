from google.adk.agents import LlmAgent
from .prompt import *
from .tools import *
from constants import AGENT_NAME, AGENT_DESCRIPTION, AGENT_MODEL

root_agent = LlmAgent(
    name=AGENT_NAME,
    model=AGENT_MODEL,
    description=AGENT_DESCRIPTION,
    instruction=ROOT_AGENT_PROMPT,
    tools=[
        # Student management
        add_student,
        fetch_student_data,
        list_all_students,
        # Faculty management
        create_faculty,
        list_all_faculty,
        # Subject management
        add_subject,
        list_all_subjects,
        # Attendance
        update_attendance,
        get_student_attendance,
        # Marks
        update_marks,
        get_student_marks,
        # Results / SGPA-CGPA
        calculate_sgpa_cgpa,
        get_student_result,
        list_all_results,
    ]
)