from typing import List, Optional
from fastapi import HTTPException
from models.data_models import Student, Faculty, Subject, Attendance, Marks, Result, Department
from repos.repo import Repo

class Service:
    def __init__(self, repo: Repo):
        self.repo = repo

    # -------------------- DEPARTMENTS -------------------- #

    async def create_department(self, d: Department) -> Department:
        if isinstance(d, dict):
            d = Department(**d)
        return await self.repo.insert_department(d)

    async def get_department(self, dept_id: str) -> Optional[Department]:
        dept = await self.repo.get_department(dept_id)
        if not dept:
            raise HTTPException(status_code=404, detail="Department not found")
        return dept

    async def list_departments(self) -> List[Department]:
        return await self.repo.list_departments()

    # -------------------- STUDENTS -------------------- #

    async def register_student(self, s: Student) -> Student:
        if isinstance(s, dict):
            s = Student(**s)
        return await self.repo.insert_student(s)

    async def get_student(self, student_id: str) -> Optional[Student]:
        return await self.repo.get_student(student_id)

    async def get_student_by_user_id(self, user_id: str) -> Optional[Student]:
        return await self.repo.get_student_by_user_id(user_id)

    async def list_students(self, department: Optional[str] = None) -> List[Student]:
        return await self.repo.list_students(department)

    async def delete_student(self, student_id: str) -> dict:
        deleted = await self.repo.delete_student(student_id)
        if deleted == 0:
            raise HTTPException(status_code=404, detail="Student not found")
        return {"message": f"Student {student_id} deleted"}

    # -------------------- FACULTY -------------------- #

    async def register_faculty(self, f: Faculty) -> Faculty:
        if isinstance(f, dict):
            f = Faculty(**f)
        return await self.repo.insert_faculty(f)

    async def update_faculty_department(self, faculty_id: str, department_id: str) -> Faculty:
        success = await self.repo.update_faculty_department(faculty_id, department_id)
        if not success:
            raise HTTPException(status_code=404, detail="Faculty not found")
        return await self.repo.get_faculty(faculty_id)

    async def get_faculty(self, faculty_id: str) -> Optional[Faculty]:
        return await self.repo.get_faculty(faculty_id)

    async def get_faculty_by_user_id(self, user_id: str) -> Optional[Faculty]:
        return await self.repo.get_faculty_by_user_id(user_id)

    async def list_faculty(self, department_id: Optional[str] = None) -> List[Faculty]:
        return await self.repo.list_faculty(department_id)

    async def delete_faculty_by_email(self, email: str) -> dict:
        # Step 1: Find the user by email
        user = await self.repo.get_user_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="Faculty not found")
        if user.get("role") not in ("faculty", "hod"):
            raise HTTPException(status_code=400, detail="User is not a faculty member")

        # Step 2: Find faculty record
        faculty = await self.repo.get_faculty_by_user_id(user["id"])
        if not faculty:
            raise HTTPException(status_code=404, detail="Faculty record missing")

        # Step 3: Block if currently a HOD
        dept = await self.repo.get_dept_by_hod_faculty_id(faculty.id)
        if dept:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete HOD. Remove HOD assignment from '{dept['name']}' first."
            )

        # Step 4 + 5 + 6: Cascade delete (atomic)
        await self.repo.delete_faculty_safe(faculty.id, user["id"])
        return {"status": "success", "message": "Faculty deleted successfully"}

    # -------------------- SUBJECTS -------------------- #

    async def create_subject(self, s: Subject) -> Subject:
        if isinstance(s, dict):
            s = Subject(**s)
        existing = await self.repo.get_subject_by_code(s.subject_code)
        if existing:
            raise HTTPException(status_code=400, detail="Subject code already exists")
        return await self.repo.insert_subject(s)

    async def get_subject(self, subject_id: str) -> Optional[Subject]:
        return await self.repo.get_subject(subject_id)

    async def get_subject_by_code(self, subject_code: str) -> Optional[Subject]:
        return await self.repo.get_subject_by_code(subject_code)

    async def list_subjects(self, department_id: Optional[str] = None) -> List[Subject]:
        return await self.repo.list_subjects(department_id)

    async def assign_faculty_to_subject(self, faculty_id: str, subject_id: str) -> str:
        # Check faculty
        f = await self.repo.get_faculty(faculty_id)
        if not f:
            raise HTTPException(status_code=404, detail="Faculty not found")
        # Check subject
        s = await self.repo.get_subject(subject_id)
        if not s:
            raise HTTPException(status_code=404, detail="Subject not found")
        
        # Check department consistency
        if f.department_id != s.department_id:
            raise HTTPException(status_code=400, detail="Cross-department assignment is blocked")
            
        return await self.repo.insert_faculty_subject(faculty_id, subject_id)

    async def get_faculty_subjects(self, faculty_id: str) -> List[Subject]:
        return await self.repo.get_faculty_subjects(faculty_id)

    async def update_subject(self, subject_id: str, s: Subject) -> bool:
        if isinstance(s, dict):
            s = Subject(**s)
        success = await self.repo.update_subject(subject_id, s.subject_name, s.subject_code, s.semester)
        if not success:
            raise HTTPException(status_code=404, detail="Subject not found")
        return True

    async def delete_subject(self, subject_id: str) -> bool:
        success = await self.repo.delete_subject(subject_id)
        if not success:
            raise HTTPException(status_code=404, detail="Subject not found")
        return True

    # -------------------- ATTENDANCE (SESSION BASED) -------------------- #

    async def create_attendance_session(self, subject_id: str, faculty_id: str, date: str, total_classes: Optional[int] = None) -> str:
        s = await self.repo.get_subject(subject_id)
        if not s:
            raise HTTPException(status_code=404, detail="Subject not found")
            
        count = await self.repo.count_attendance_sessions(subject_id)
        session_number = count + 1
        
        if session_number == 1 and not total_classes:
            raise HTTPException(status_code=400, detail="total_classes is required for the first session")
            
        if session_number > 1:
            sessions = await self.repo.get_attendance_sessions(subject_id)
            if sessions:
                total_classes = sessions[0].get("total_classes") or 40
        else:
            total_classes = total_classes or 40
            
        return await self.repo.insert_attendance_session(
            subject_id, faculty_id, session_number, total_classes=total_classes, date=date
        )

    async def get_attendance_sessions(self, subject_id: str) -> List[dict]:
        return await self.repo.get_attendance_sessions(subject_id)

    async def mark_attendance(self, session_id: str, absent_student_ids: List[str]):
        session = await self.repo.get_attendance_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        subject = await self.repo.get_subject(session["subject_id"])
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")
        if not subject.semester:
            raise HTTPException(status_code=400, detail="Subject has no semester set")
            
        target_students = await self.repo.list_students_by_dept_id(subject.department_id, subject.semester)
        
        student_ids = [st.id for st in target_students]
        statuses = ["absent" if st.id in absent_student_ids else "present" for st in target_students]
                
        if not student_ids:
            return  # no students to mark
            
        await self.repo.insert_attendance_records(session_id, student_ids, statuses)

    async def update_marked_attendance(self, session_id: str, absent_student_ids: List[str]):
        session = await self.repo.get_attendance_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
            
        subject = await self.repo.get_subject(session["subject_id"])
        if not subject or not subject.semester:
            raise HTTPException(status_code=400, detail="Subject/semester not found")
        
        target_students = await self.repo.list_students_by_dept_id(subject.department_id, subject.semester)
        
        student_ids = [st.id for st in target_students]
        statuses = ["absent" if st.id in absent_student_ids else "present" for st in target_students]
                
        if not student_ids:
            return
            
        await self.repo.update_attendance_records(session_id, student_ids, statuses)

    async def get_students_for_session(self, session_id: str) -> List[dict]:
        """Return students with names suitable for an attendance marking UI."""
        session = await self.repo.get_attendance_session(session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        subject = await self.repo.get_subject(session["subject_id"])
        if not subject or not subject.semester:
            return []
        return await self.repo.get_students_with_names_for_session(subject.department_id, subject.semester)

    async def get_attendance_records(self, session_id: str) -> List[dict]:
        return await self.repo.get_attendance_records(session_id)
        
    async def get_student_session_attendance(self, student_id: str) -> List[dict]:
        detail = await self.repo.get_student_full_detail(student_id)
        if not detail:
            return []
        records = detail.get("subjects", [])
        for r in records:
            r["percentage"] = r.get("attendance_percentage", 0)
        return records

    # --- HOD: department-level student visibility ---

    async def get_hod_students_grouped(self, hod_user_id: str) -> dict:
        """Return all students in HOD's department, grouped by semester."""
        faculty = await self.repo.get_faculty_by_user_id(hod_user_id)
        if not faculty:
            raise HTTPException(status_code=403, detail="HOD faculty record not found")
        dept = await self.repo.get_department_by_hod(faculty.id)
        if not dept:
            raise HTTPException(status_code=403, detail="No department assigned to this HOD")

        students = await self.repo.get_all_students_with_names_by_dept(dept.id)

        # Group by semester
        sem_map: dict = {}
        for s in students:
            sem = s.get("semester") or 0
            if sem not in sem_map:
                sem_map[sem] = []
            sem_map[sem].append({
                "student_id": s["id"],
                "usn": s["usn"],
                "name": s.get("name") or s["usn"],
            })

        semesters = [{"semester": k, "students": v} for k, v in sorted(sem_map.items())]
        return {"department_id": dept.id, "department": dept.name, "semesters": semesters}

    async def get_hod_student_detail(self, student_id: str, hod_user_id: str) -> dict:
        """Full student detail — but only if student is in HOD's department."""
        faculty = await self.repo.get_faculty_by_user_id(hod_user_id)
        if not faculty:
            raise HTTPException(status_code=403, detail="HOD faculty record not found")
        dept = await self.repo.get_department_by_hod(faculty.id)

        detail = await self.repo.get_student_full_detail(student_id)
        if not detail:
            raise HTTPException(status_code=404, detail="Student not found")

        # RBAC guard: student must be in HOD's dept
        if dept and detail.get("department_id") != dept.id:
            raise HTTPException(status_code=403, detail="Student is not in your department")

        return detail

    # --- Student: semester-filtered subjects + session attendance ---

    async def get_student_subjects(self, student_user_id: str) -> List[dict]:
        """Return subjects matching the student's dept + semester."""
        student = await self.repo.get_student_by_user_id(student_user_id)
        if not student:
            return []
        if not student.department_id or not student.semester:
            return []
        return await self.repo.get_subjects_by_dept_and_semester(student.department_id, student.semester)

    async def get_student_subject_session_attendance(self, student_user_id: str, subject_id: str) -> dict:
        """Per-session attendance for a specific subject for the logged-in student."""
        student = await self.repo.get_student_by_user_id(student_user_id)
        if not student:
            raise HTTPException(status_code=404, detail="Student record not found")

        subject = await self.repo.get_subject(subject_id)
        if not subject:
            raise HTTPException(status_code=404, detail="Subject not found")

        # Guard: subject must match student's dept + semester
        if subject.department_id != student.department_id:
            raise HTTPException(status_code=403, detail="Subject not in your department")

        sessions = await self.repo.get_student_subject_sessions(student.id, subject_id)
        
        attended = sum(1 for s in sessions if s["status"] == "present")
        total_sessions = max(sessions[0]["total_classes"] if sessions and "total_classes" in sessions[0] else 40, len(sessions))

        return {
            "subject_id": subject_id,
            "subject": subject.subject_name,
            "subject_code": subject.subject_code,
            "total_sessions": total_sessions,
            "attended": attended,
            "sessions": [
                {
                    "session_number": s["session_number"],
                    "date": str(s["date"]),
                    "status": s["status"],
                }
                for s in sessions
            ],
        }

    # -------------------- STUDENT QUERIES -------------------- #

    async def insert_student_query(self, student_id: str, subject_id: str, message: str) -> str:
        return await self.repo.insert_student_query(student_id, subject_id, message)

    # -------------------- MARKS -------------------- #

    async def add_marks(self, m: Marks) -> Marks:
        if isinstance(m, dict):
            m = Marks(**m)
        return await self.repo.insert_marks(m)

    async def update_marks(self, m: Marks) -> bool:
        if isinstance(m, dict):
            m = Marks(**m)
        return await self.repo.update_marks(m)

    async def get_marks(self, student_id: str, subject_id: Optional[str] = None) -> List[Marks]:
        return await self.repo.get_marks(student_id, subject_id)

    # -------------------- RESULTS -------------------- #

    async def add_result(self, r: Result) -> Result:
        if isinstance(r, dict):
            r = Result(**r)
        return await self.repo.insert_result(r)

    async def update_result(self, r: Result) -> bool:
        if isinstance(r, dict):
            r = Result(**r)
        return await self.repo.update_result(r)

    async def get_result(self, student_id: str) -> Optional[Result]:
        return await self.repo.get_result(student_id)

    async def list_results(self) -> List[Result]:
        return await self.repo.list_results()

    # -------------------- USERS (auth) -------------------- #

    async def get_user_by_email(self, email: str) -> Optional[dict]:
        return await self.repo.get_user_by_email(email)

    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        return await self.repo.get_user_by_id(user_id)

    async def insert_user(self, user_id: str, name: str, email: str, password_hash: str, role: str) -> dict:
        return await self.repo.insert_user(user_id, name, email, password_hash, role)

    # -------------------- IA MARKS -------------------- #

    async def upload_ia_marks(self, faculty_id: str, subject_id: str,
                               marks_list: list, max_marks: int = 40):
        """Batch upsert IA marks for a subject."""
        import time
        results = []
        for entry in marks_list:
            mark_id = "ia_" + str(int(time.time() * 10000))
            await self.repo.upsert_ia_mark(
                mark_id=mark_id,
                student_id=entry["student_id"],
                subject_id=subject_id,
                faculty_id=faculty_id,
                marks_obtained=entry["marks_obtained"],
                max_marks=max_marks,
            )
            results.append({"student_id": entry["student_id"], "status": "saved"})
        return results

    async def get_ia_marks_for_subject(self, subject_id: str) -> list:
        return await self.repo.get_ia_marks_by_subject(subject_id)

    async def get_ia_marks_for_student(self, student_id: str) -> list:
        return await self.repo.get_ia_marks_by_student(student_id)

    async def get_ia_analytics_subject(self, subject_id: str) -> dict:
        return await self.repo.get_ia_analytics_by_subject(subject_id)

    async def get_ia_admin_analytics(self) -> dict:
        return await self.repo.get_ia_admin_analytics()

    async def is_faculty_assigned_to_subject(self, faculty_id: str, subject_id: str) -> bool:
        return await self.repo.check_faculty_assigned_to_subject(faculty_id, subject_id)

    # -------------------- ANALYTICS -------------------- #

    async def get_analytics_student(self, student_id: str) -> dict:
        return await self.repo.get_analytics_student(student_id)

    async def get_analytics_faculty(self, faculty_id: str) -> dict:
        return await self.repo.get_analytics_faculty(faculty_id)

    async def get_analytics_hod(self, dept_id: str) -> dict:
        return await self.repo.get_analytics_hod(dept_id)

    async def get_analytics_admin(self) -> dict:
        return await self.repo.get_analytics_admin()

    # -------------------- ALERTS -------------------- #

    async def get_alerts_student(self, student_id: str):
        return await self.repo.get_attendance_alerts_student(student_id)

    async def get_alerts_faculty(self, faculty_id: str):
        return await self.repo.get_attendance_alerts_faculty(faculty_id)

    async def get_alerts_hod(self, dept_id: str):
        return await self.repo.get_attendance_alerts_hod(dept_id)

    async def get_alerts_admin(self):
        return await self.repo.get_attendance_alerts_admin()

    # -------------------- NOTIFICATIONS -------------------- #

    async def insert_notification(self, sender_id: str, receiver_id: str, message: str, notif_type: str = "query") -> str:
        return await self.repo.insert_notification(sender_id, receiver_id, message, notif_type)

    async def get_notifications(self, receiver_id: str):
        return await self.repo.get_notifications(receiver_id)

    async def get_faculty_for_subject(self, subject_id: str):
        return await self.repo.get_faculty_for_subject(subject_id)

    # -------------------- REPORTS -------------------- #

    async def get_all_students_report(self):
        return await self.repo.get_all_students_report()

    async def get_all_faculty_report(self):
        return await self.repo.get_all_faculty_report()

    # -------------------- PREDICTION -------------------- #

    async def predict_student_risk(self, student_id: str) -> dict:
        data = await self.repo.get_student_prediction_data(student_id)
        att      = data["avg_attendance"]
        marks    = data["avg_marks_pct"]
        cgpa     = data["cgpa"]
        sessions = data["sessions_attended"]

        # Heuristic weighted score (higher = better)
        score = (att * 0.4) + (marks * 0.35) + (min(cgpa / 10 * 100, 100) * 0.15) + (min(sessions / 20 * 100, 100) * 0.10)

        if score < 45 or att < 60:
            risk = "high"
            recommendation = "Immediate intervention required. Attendance is critically low. Attend all remaining classes."
        elif score < 65 or att < 75:
            risk = "medium"
            recommendation = "Performance needs improvement. Focus on attendance and internal assessments."
        else:
            risk = "low"
            recommendation = "Keep up the good work. Maintain attendance above 85% and prepare for externals."

        predicted_score = round(score, 1)
        return {
            "risk": risk,
            "predicted_score": predicted_score,
            "recommendation": recommendation,
            "details": {
                "avg_attendance": att,
                "avg_marks_pct": marks,
                "cgpa": cgpa,
                "sessions_attended": sessions,
            }
        }
