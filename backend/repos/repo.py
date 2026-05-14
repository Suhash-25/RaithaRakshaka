import time
from datetime import date as date_type
from typing import Optional, List

from models.data_models import Student, Faculty, Subject, Attendance, Marks, Result, Department
from db import PostgresDB


def row_to_dict(row):
    return dict(row)

class Repo:

    # -------------------- DEPARTMENTS -------------------- #

    async def insert_department(self, d: Department) -> Department:
        d.id = d.id or "dept_" + str(int(time.time() * 1000))
        q = "INSERT INTO departments (id, name) VALUES ($1, $2)"
        async with PostgresDB.pool.acquire() as conn:
            await conn.execute(q, d.id, d.name)
        return d

    async def get_department(self, dept_id: str) -> Optional[Department]:
        async with PostgresDB.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM departments WHERE id=$1", dept_id)
        return Department(**row_to_dict(row)) if row else None

    async def list_departments(self) -> List[Department]:
        async with PostgresDB.pool.acquire() as conn:
            rows = await conn.fetch("SELECT * FROM departments")
        return [Department(**row_to_dict(r)) for r in rows]

    async def assign_hod_to_department(self, department_id: str, faculty_id: str) -> bool:
        q = "UPDATE departments SET hod_faculty_id=$1 WHERE id=$2"
        async with PostgresDB.pool.acquire() as conn:
            r = await conn.execute(q, faculty_id, department_id)
        return r.endswith("1")

    async def get_department_by_hod(self, faculty_id: str) -> Optional[Department]:
        async with PostgresDB.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM departments WHERE hod_faculty_id=$1", faculty_id)
        return Department(**row_to_dict(row)) if row else None

    # -------------------- STUDENTS -------------------- #

    async def insert_student(self, s: Student) -> Student:
        s.id = s.id or "stu_" + str(int(time.time() * 1000))
        q = """
        INSERT INTO students (id, user_id, usn, department, department_id, semester)
        VALUES ($1, $2, $3, $4, $5, $6)
        """
        async with PostgresDB.pool.acquire() as conn:
            await conn.execute(q, s.id, s.user_id, s.usn, s.department, s.department_id, s.semester)
        return s

    async def get_student(self, student_id: str) -> Optional[Student]:
        async with PostgresDB.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM students WHERE id=$1", student_id)
        return Student(**row_to_dict(row)) if row else None

    async def get_student_by_user_id(self, user_id: str) -> Optional[Student]:
        async with PostgresDB.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM students WHERE user_id=$1", user_id)
        return Student(**row_to_dict(row)) if row else None

    async def list_students(self, department: Optional[str] = None) -> List[Student]:
        async with PostgresDB.pool.acquire() as conn:
            if department:
                rows = await conn.fetch("SELECT * FROM students WHERE department=$1", department)
            else:
                rows = await conn.fetch("SELECT * FROM students")
        return [Student(**row_to_dict(r)) for r in rows]

    async def list_students_by_dept_id(self, department_id: str, semester: Optional[int] = None) -> List[Student]:
        async with PostgresDB.pool.acquire() as conn:
            if semester is not None:
                rows = await conn.fetch(
                    "SELECT * FROM students WHERE department_id=$1 AND semester=$2",
                    department_id, semester
                )
            else:
                rows = await conn.fetch(
                    "SELECT * FROM students WHERE department_id=$1",
                    department_id
                )
        return [Student(**row_to_dict(r)) for r in rows]

    async def get_students_with_names_for_session(self, department_id: str, semester: int) -> List[dict]:
        """Returns students with their name from users table for attendance marking."""
        q = """
        SELECT s.id, s.usn, s.semester, u.name, s.user_id
        FROM students s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.department_id = $1 AND s.semester = $2
        ORDER BY s.usn
        """
        async with PostgresDB.pool.acquire() as conn:
            rows = await conn.fetch(q, department_id, semester)
        return [row_to_dict(r) for r in rows]

    async def delete_student(self, student_id: str) -> int:
        async with PostgresDB.pool.acquire() as conn:
            r = await conn.execute("DELETE FROM students WHERE id=$1", student_id)
        return int(r.split()[-1])

    async def get_student_by_usn(self, usn: str) -> Optional[Student]:
        async with PostgresDB.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM students WHERE usn=$1", usn)
        return Student(**row_to_dict(row)) if row else None

    async def link_user_to_student(self, usn: str, user_id: str) -> bool:
        async with PostgresDB.pool.acquire() as conn:
            r = await conn.execute("UPDATE students SET user_id=$1 WHERE usn=$2", user_id, usn)
        return r.endswith("1")

    # -------------------- FACULTY -------------------- #

    async def insert_faculty(self, f: Faculty) -> Faculty:
        f.id = f.id or "fac_" + str(int(time.time() * 1000))
        q = """
        INSERT INTO faculty (id, user_id, faculty_code, name, department, department_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        """
        async with PostgresDB.pool.acquire() as conn:
            await conn.execute(q, f.id, f.user_id, f.faculty_code, f.name, f.department, f.department_id)
        return f

    async def get_faculty_by_code(self, faculty_code: str) -> Optional[Faculty]:
        async with PostgresDB.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM faculty WHERE faculty_code=$1", faculty_code)
        return Faculty(**row_to_dict(row)) if row else None

    async def link_user_to_faculty(self, faculty_code: str, user_id: str) -> bool:
        async with PostgresDB.pool.acquire() as conn:
            r = await conn.execute("UPDATE faculty SET user_id=$1 WHERE faculty_code=$2", user_id, faculty_code)
        return r.endswith("1")

    async def update_faculty_department(self, faculty_id: str, department_id: str) -> bool:
        q = "UPDATE faculty SET department_id=$1 WHERE id=$2"
        async with PostgresDB.pool.acquire() as conn:
            r = await conn.execute(q, department_id, faculty_id)
        return r.endswith("1")

    async def get_faculty(self, faculty_id: str) -> Optional[Faculty]:
        async with PostgresDB.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM faculty WHERE id=$1", faculty_id)
        return Faculty(**row_to_dict(row)) if row else None

    async def get_faculty_by_user_id(self, user_id: str) -> Optional[Faculty]:
        async with PostgresDB.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM faculty WHERE user_id=$1", user_id)
        return Faculty(**row_to_dict(row)) if row else None

    async def list_faculty(self, department_id: Optional[str] = None) -> List[Faculty]:
        async with PostgresDB.pool.acquire() as conn:
            if department_id:
                rows = await conn.fetch("SELECT * FROM faculty WHERE department_id=$1 OR department=$1", department_id)
            else:
                rows = await conn.fetch("SELECT * FROM faculty")
        return [Faculty(**row_to_dict(r)) for r in rows]

    async def get_user_by_email(self, email: str) -> Optional[dict]:
        async with PostgresDB.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM users WHERE email=$1", email)
        return row_to_dict(row) if row else None

    async def get_dept_by_hod_faculty_id(self, faculty_id: str) -> Optional[dict]:
        async with PostgresDB.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM departments WHERE hod_faculty_id=$1", faculty_id)
        return row_to_dict(row) if row else None

    async def delete_faculty_safe(self, faculty_id: str, user_id: str):
        """Cascade delete all faculty data then remove faculty and user rows."""
        async with PostgresDB.pool.acquire() as conn:
            # 1. Remove subject assignments
            await conn.execute("DELETE FROM faculty_subjects WHERE faculty_id=$1", faculty_id)
            # 2. Remove attendance records for sessions this faculty ran
            await conn.execute(
                "DELETE FROM attendance_records WHERE session_id IN "
                "(SELECT id FROM attendance_sessions WHERE faculty_id=$1)",
                faculty_id
            )
            # 3. Remove attendance sessions
            await conn.execute("DELETE FROM attendance_sessions WHERE faculty_id=$1", faculty_id)
            # 4. Remove faculty row
            await conn.execute("DELETE FROM faculty WHERE id=$1", faculty_id)
            # 5. Remove user row
            await conn.execute("DELETE FROM users WHERE id=$1", user_id)

    # -------------------- SUBJECTS -------------------- #

    async def insert_subject(self, s: Subject) -> Subject:
        s.id = s.id or "sub_" + str(int(time.time() * 1000))
        q = """
        INSERT INTO subjects (id, subject_name, subject_code, department_id, semester)
        VALUES ($1, $2, $3, $4, $5)
        """
        async with PostgresDB.pool.acquire() as conn:
            await conn.execute(q, s.id, s.subject_name, s.subject_code, s.department_id, s.semester)
        return s

    async def get_subject(self, subject_id: str) -> Optional[Subject]:
        async with PostgresDB.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM subjects WHERE id=$1", subject_id)
        return Subject(**row_to_dict(row)) if row else None

    async def get_subject_by_code(self, subject_code: str) -> Optional[Subject]:
        async with PostgresDB.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM subjects WHERE subject_code=$1", subject_code)
        return Subject(**row_to_dict(row)) if row else None

    async def list_subjects(self, department_id: Optional[str] = None) -> List[Subject]:
        async with PostgresDB.pool.acquire() as conn:
            if department_id:
                rows = await conn.fetch("SELECT * FROM subjects WHERE department_id=$1", department_id)
            else:
                rows = await conn.fetch("SELECT * FROM subjects")
        return [Subject(**row_to_dict(r)) for r in rows]

    async def update_subject(self, subject_id: str, subject_name: str, subject_code: str, semester: int) -> bool:
        q = """
        UPDATE subjects SET subject_name=$1, subject_code=$2, semester=$3 WHERE id=$4
        """
        async with PostgresDB.pool.acquire() as conn:
            r = await conn.execute(q, subject_name, subject_code, semester, subject_id)
        return r.endswith("1")

    async def delete_subject(self, subject_id: str) -> bool:
        async with PostgresDB.pool.acquire() as conn:
            # delete assignment mappings first
            await conn.execute("DELETE FROM faculty_subjects WHERE subject_id=$1", subject_id)
            r = await conn.execute("DELETE FROM subjects WHERE id=$1", subject_id)
        return r.endswith("1")

    async def insert_faculty_subject(self, faculty_id: str, subject_id: str) -> str:
        fs_id = "fs_" + str(int(time.time() * 1000))
        q = """
        INSERT INTO faculty_subjects (id, faculty_id, subject_id)
        VALUES ($1, $2, $3)
        """
        async with PostgresDB.pool.acquire() as conn:
            await conn.execute(q, fs_id, faculty_id, subject_id)
        return fs_id

    async def get_faculty_subjects(self, faculty_id: str) -> List[Subject]:
        q = """
        SELECT s.* FROM subjects s
        JOIN faculty_subjects fs ON s.id = fs.subject_id
        WHERE fs.faculty_id = $1
        """
        async with PostgresDB.pool.acquire() as conn:
            rows = await conn.fetch(q, faculty_id)
        return [Subject(**row_to_dict(r)) for r in rows]

    # -------------------- ATTENDANCE (SESSION BASED) -------------------- #

    async def insert_attendance_session(self, subject_id: str, faculty_id: str, session_number: int, total_classes: int, date: str) -> str:
        s_id = "sess_" + str(int(time.time() * 1000))
        # asyncpg needs a real datetime.date object, not a string
        parsed_date = date_type.fromisoformat(date) if isinstance(date, str) else date
        q = """
        INSERT INTO attendance_sessions (id, subject_id, faculty_id, session_number, total_sessions, total_classes, date)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        """
        async with PostgresDB.pool.acquire() as conn:
            await conn.execute(q, s_id, subject_id, faculty_id, session_number, total_classes, total_classes, parsed_date)
        return s_id

    async def get_attendance_sessions(self, subject_id: str) -> List[dict]:
        async with PostgresDB.pool.acquire() as conn:
            rows = await conn.fetch("SELECT * FROM attendance_sessions WHERE subject_id=$1 ORDER BY session_number ASC", subject_id)
        return [row_to_dict(r) for r in rows]

    async def get_attendance_session(self, session_id: str) -> Optional[dict]:
        async with PostgresDB.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM attendance_sessions WHERE id=$1", session_id)
        return row_to_dict(row) if row else None

    async def count_attendance_sessions(self, subject_id: str) -> int:
        async with PostgresDB.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT COUNT(*) FROM attendance_sessions WHERE subject_id=$1", subject_id)
        return row["count"] if row else 0

    async def insert_attendance_records(self, session_id: str, student_ids: List[str], statuses: List[str]):
        async with PostgresDB.pool.acquire() as conn:
            data = [("rec_" + str(int(time.time()*10000) + i), session_id, student_ids[i], statuses[i]) for i in range(len(student_ids))]
            await conn.executemany("""
                INSERT INTO attendance_records (id, session_id, student_id, status)
                VALUES ($1, $2, $3, $4)
            """, data)

    async def update_attendance_records(self, session_id: str, student_ids: List[str], statuses: List[str]):
        async with PostgresDB.pool.acquire() as conn:
            # Delete old records
            await conn.execute("DELETE FROM attendance_records WHERE session_id=$1", session_id)
            # Insert new
            data = [("rec_" + str(int(time.time()*10000) + i), session_id, student_ids[i], statuses[i]) for i in range(len(student_ids))]
            await conn.executemany("""
                INSERT INTO attendance_records (id, session_id, student_id, status)
                VALUES ($1, $2, $3, $4)
            """, data)

    async def get_attendance_records(self, session_id: str) -> List[dict]:
        async with PostgresDB.pool.acquire() as conn:
            rows = await conn.fetch("SELECT * FROM attendance_records WHERE session_id=$1", session_id)
        return [row_to_dict(r) for r in rows]

    async def get_student_attendance_summary(self, student_id: str) -> List[dict]:
        q = """
        SELECT s.id as subject_id, s.subject_name as subject_name,
               COUNT(ar.id) FILTER (WHERE ar.status='present') as attended,
               MAX(sess.total_sessions) as total_sessions
        FROM subjects s
        JOIN attendance_sessions sess ON s.id = sess.subject_id
        JOIN attendance_records ar ON sess.id = ar.session_id
        WHERE ar.student_id = $1
        GROUP BY s.id, s.subject_name
        """
        async with PostgresDB.pool.acquire() as conn:
            rows = await conn.fetch(q, student_id)
        return [row_to_dict(r) for r in rows]

    async def get_all_students_with_names_by_dept(self, department_id: str) -> List[dict]:
        """All students in a department with user name, grouped by semester."""
        q = """
        SELECT s.id, s.usn, s.semester, s.department_id, u.name
        FROM students s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.department_id = $1
        ORDER BY s.semester ASC, s.usn ASC
        """
        async with PostgresDB.pool.acquire() as conn:
            rows = await conn.fetch(q, department_id)
        return [row_to_dict(r) for r in rows]

    async def get_subjects_by_dept_and_semester(self, department_id: str, semester: int) -> List[dict]:
        """Subjects for a given dept+semester (used by student 'My Subjects' and HOD views)."""
        q = """
        SELECT id, subject_name, subject_code, semester
        FROM subjects
        WHERE department_id = $1 AND semester = $2
        ORDER BY subject_name ASC
        """
        async with PostgresDB.pool.acquire() as conn:
            rows = await conn.fetch(q, department_id, semester)
        return [row_to_dict(r) for r in rows]

    async def get_student_subject_sessions(self, student_id: str, subject_id: str) -> List[dict]:
        """Per-session attendance for a student on a specific subject."""
        q = """
        SELECT sess.session_number, sess.date, COALESCE(sess.total_classes, sess.total_sessions, 40) as total_classes, COALESCE(ar.status, 'not_marked') AS status
        FROM attendance_sessions sess
        LEFT JOIN attendance_records ar
            ON ar.session_id = sess.id AND ar.student_id = $1
        WHERE sess.subject_id = $2
        ORDER BY sess.session_number ASC
        """
        async with PostgresDB.pool.acquire() as conn:
            rows = await conn.fetch(q, student_id, subject_id)
        return [row_to_dict(r) for r in rows]

    async def get_student_full_detail(self, student_id: str) -> Optional[dict]:
        """Student with user name, dept info, marks and attendance across all subjects."""
        # Basic info
        basic_q = """
        SELECT s.id, s.usn, s.semester, s.department_id, u.name
        FROM students s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.id = $1
        """
        # Per-subject attendance summary
        att_q = """
        SELECT sub.id AS subject_id, sub.subject_name,
               COUNT(ar.id) FILTER (WHERE ar.status='present') AS attended,
               MAX(COALESCE(sess.total_classes, sess.total_sessions, 40)) AS total_sessions
        FROM subjects sub
        JOIN attendance_sessions sess ON sub.id = sess.subject_id
        LEFT JOIN attendance_records ar ON ar.session_id = sess.id AND ar.student_id = $1
        WHERE sub.department_id = (SELECT department_id FROM students WHERE id=$1)
          AND sub.semester      = (SELECT semester      FROM students WHERE id=$1)
        GROUP BY sub.id, sub.subject_name
        ORDER BY sub.subject_name
        """
        # Marks
        marks_q = """
        SELECT subject_id, internal_marks, external_marks
        FROM marks WHERE student_id = $1
        """
        async with PostgresDB.pool.acquire() as conn:
            basic_row = await conn.fetchrow(basic_q, student_id)
            att_rows  = await conn.fetch(att_q, student_id)
            marks_rows = await conn.fetch(marks_q, student_id)

        if not basic_row:
            return None

        marks_map = {r["subject_id"]: row_to_dict(r) for r in marks_rows}
        subjects = []
        for r in att_rows:
            d = row_to_dict(r)
            total = d["total_sessions"] or 0
            attended = d["attended"] or 0
            pct = round(attended / total * 100, 1) if total > 0 else 0
            m = marks_map.get(d["subject_id"], {})
            subjects.append({
                "subject_id": d["subject_id"],
                "subject_name": d["subject_name"],
                "attendance_percentage": pct,
                "attended": attended,
                "total_sessions": total,
                "marks": {
                    "internal": m.get("internal_marks"),
                    "external": m.get("external_marks"),
                }
            })

        basic = row_to_dict(basic_row)
        return {
            "student_id": basic["id"],
            "usn": basic["usn"],
            "name": basic["name"],
            "semester": basic["semester"],
            "department_id": basic["department_id"],
            "subjects": subjects,
        }

    # -------------------- LEGACY ATTENDANCE -------------------- #

    async def insert_attendance(self, a: Attendance) -> Attendance:
        a.id = a.id or "att_" + str(int(time.time() * 1000))
        q = """
        INSERT INTO attendance (id, student_id, subject_id, attendance_percentage)
        VALUES ($1, $2, $3, $4)
        """
        async with PostgresDB.pool.acquire() as conn:
            await conn.execute(q, a.id, a.student_id, a.subject_id, a.attendance_percentage)
        return a

    async def update_attendance(self, a: Attendance) -> bool:
        q = """
        UPDATE attendance SET attendance_percentage=$1
        WHERE student_id=$2 AND subject_id=$3
        """
        async with PostgresDB.pool.acquire() as conn:
            r = await conn.execute(q, a.attendance_percentage, a.student_id, a.subject_id)
        return r.endswith("1")

    async def get_attendance(self, student_id: str, subject_id: Optional[str] = None) -> List[Attendance]:
        async with PostgresDB.pool.acquire() as conn:
            if subject_id:
                rows = await conn.fetch(
                    "SELECT * FROM attendance WHERE student_id=$1 AND subject_id=$2",
                    student_id, subject_id
                )
            else:
                rows = await conn.fetch(
                    "SELECT * FROM attendance WHERE student_id=$1", student_id
                )
        return [Attendance(**row_to_dict(r)) for r in rows]

    # -------------------- MARKS -------------------- #

    async def insert_marks(self, m: Marks) -> Marks:
        m.id = m.id or "mrk_" + str(int(time.time() * 1000))
        q = """
        INSERT INTO marks (id, student_id, subject_id, internal_marks, external_marks)
        VALUES ($1, $2, $3, $4, $5)
        """
        async with PostgresDB.pool.acquire() as conn:
            await conn.execute(q, m.id, m.student_id, m.subject_id, m.internal_marks, m.external_marks)
        return m

    async def update_marks(self, m: Marks) -> bool:
        q = """
        UPDATE marks SET internal_marks=$1, external_marks=$2
        WHERE student_id=$3 AND subject_id=$4
        """
        async with PostgresDB.pool.acquire() as conn:
            r = await conn.execute(q, m.internal_marks, m.external_marks, m.student_id, m.subject_id)
        return r.endswith("1")

    async def get_marks(self, student_id: str, subject_id: Optional[str] = None) -> List[Marks]:
        async with PostgresDB.pool.acquire() as conn:
            if subject_id:
                rows = await conn.fetch(
                    "SELECT * FROM marks WHERE student_id=$1 AND subject_id=$2",
                    student_id, subject_id
                )
            else:
                rows = await conn.fetch(
                    "SELECT * FROM marks WHERE student_id=$1", student_id
                )
        return [Marks(**row_to_dict(r)) for r in rows]

    # -------------------- RESULTS -------------------- #

    async def insert_result(self, r: Result) -> Result:
        r.id = r.id or "res_" + str(int(time.time() * 1000))
        q = """
        INSERT INTO results (id, student_id, sgpa, cgpa)
        VALUES ($1, $2, $3, $4)
        """
        async with PostgresDB.pool.acquire() as conn:
            await conn.execute(q, r.id, r.student_id, r.sgpa, r.cgpa)
        return r

    async def update_result(self, r: Result) -> bool:
        q = """
        UPDATE results SET sgpa=$1, cgpa=$2
        WHERE student_id=$3
        """
        async with PostgresDB.pool.acquire() as conn:
            status = await conn.execute(q, r.sgpa, r.cgpa, r.student_id)
        return status.endswith("1")

    async def get_result(self, student_id: str) -> Optional[Result]:
        async with PostgresDB.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM results WHERE student_id=$1", student_id)
        return Result(**row_to_dict(row)) if row else None

    async def list_results(self) -> List[Result]:
        async with PostgresDB.pool.acquire() as conn:
            rows = await conn.fetch("SELECT * FROM results")
        return [Result(**row_to_dict(r)) for r in rows]

    # -------------------- USERS (auth via PG) -------------------- #

    async def insert_user(self, user_id: str, name: str, email: str, password_hash: str, role: str) -> dict:
        q = """
        INSERT INTO users (id, name, email, password_hash, role)
        VALUES ($1, $2, $3, $4, $5)
        """
        async with PostgresDB.pool.acquire() as conn:
            await conn.execute(q, user_id, name, email, password_hash, role)
        return {"id": user_id, "name": name, "email": email, "role": role}

    async def get_user_by_email(self, email: str) -> Optional[dict]:
        async with PostgresDB.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM users WHERE email=$1", email)
        return row_to_dict(row) if row else None

    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        async with PostgresDB.pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM users WHERE id=$1", user_id)
        return row_to_dict(row) if row else None

    # -------------------- STUDENT QUERIES -------------------- #

    async def insert_student_query(self, student_id: str, subject_id: str, message: str) -> str:
        q_id = "q_" + str(int(time.time() * 1000))
        q = """
        INSERT INTO student_queries (id, student_id, subject_id, message)
        VALUES ($1, $2, $3, $4)
        """
        async with PostgresDB.pool.acquire() as conn:
            await conn.execute(q, q_id, student_id, subject_id, message)
        return q_id

    # -------------------- IA MARKS -------------------- #

    async def upsert_ia_mark(self, mark_id: str, student_id: str, subject_id: str,
                              faculty_id: str, marks_obtained: int, max_marks: int = 40):
        """Insert or update a single IA mark. Uses ON CONFLICT on (student_id, subject_id)."""
        q = """
        INSERT INTO ia_marks (id, student_id, subject_id, faculty_id, marks_obtained, max_marks, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        ON CONFLICT (student_id, subject_id)
        DO UPDATE SET marks_obtained = $5, faculty_id = $4, max_marks = $6, created_at = CURRENT_TIMESTAMP
        """
        async with PostgresDB.pool.acquire() as conn:
            await conn.execute(q, mark_id, student_id, subject_id, faculty_id, marks_obtained, max_marks)

    async def get_ia_marks_by_subject(self, subject_id: str) -> list:
        """Get all IA marks for a subject with student names."""
        q = """
        SELECT im.*, s.usn, u.name as student_name
        FROM ia_marks im
        JOIN students s ON im.student_id = s.id
        LEFT JOIN users u ON s.user_id = u.id
        WHERE im.subject_id = $1
        ORDER BY im.marks_obtained DESC
        """
        async with PostgresDB.pool.acquire() as conn:
            rows = await conn.fetch(q, subject_id)
        return [row_to_dict(r) for r in rows]

    async def get_ia_marks_by_student(self, student_id: str) -> list:
        """Get all IA marks for a student with subject names."""
        q = """
        SELECT im.*, sub.subject_name, sub.subject_code
        FROM ia_marks im
        JOIN subjects sub ON im.subject_id = sub.id
        WHERE im.student_id = $1
        ORDER BY sub.subject_name
        """
        async with PostgresDB.pool.acquire() as conn:
            rows = await conn.fetch(q, student_id)
        return [row_to_dict(r) for r in rows]

    async def get_ia_analytics_by_subject(self, subject_id: str) -> dict:
        """Get top/low performers and average for a subject."""
        q_avg = "SELECT AVG(marks_obtained) as avg_marks FROM ia_marks WHERE subject_id = $1"
        q_top = """
        SELECT im.marks_obtained, s.usn, u.name as student_name
        FROM ia_marks im JOIN students s ON im.student_id = s.id LEFT JOIN users u ON s.user_id = u.id
        WHERE im.subject_id = $1 ORDER BY im.marks_obtained DESC LIMIT 5
        """
        q_low = """
        SELECT im.marks_obtained, s.usn, u.name as student_name
        FROM ia_marks im JOIN students s ON im.student_id = s.id LEFT JOIN users u ON s.user_id = u.id
        WHERE im.subject_id = $1 ORDER BY im.marks_obtained ASC LIMIT 5
        """
        async with PostgresDB.pool.acquire() as conn:
            avg_row = await conn.fetchrow(q_avg, subject_id)
            top_rows = await conn.fetch(q_top, subject_id)
            low_rows = await conn.fetch(q_low, subject_id)
        return {
            "average_marks": round(float(avg_row["avg_marks"]), 1) if avg_row and avg_row["avg_marks"] else 0,
            "top_performers": [row_to_dict(r) for r in top_rows],
            "low_performers": [row_to_dict(r) for r in low_rows],
        }

    async def get_ia_admin_analytics(self) -> dict:
        """System-wide IA analytics for admin."""
        q = """
        SELECT sub.id as subject_id, sub.subject_name, sub.subject_code,
               AVG(im.marks_obtained) as avg_marks, COUNT(im.id) as total_entries
        FROM ia_marks im
        JOIN subjects sub ON im.subject_id = sub.id
        GROUP BY sub.id, sub.subject_name, sub.subject_code
        ORDER BY avg_marks DESC
        """
        q_overall = "SELECT AVG(marks_obtained) as overall_avg FROM ia_marks"
        async with PostgresDB.pool.acquire() as conn:
            rows = await conn.fetch(q)
            overall = await conn.fetchrow(q_overall)
        subjects = [row_to_dict(r) for r in rows]
        return {
            "overall_avg": round(float(overall["overall_avg"]), 1) if overall and overall["overall_avg"] else 0,
            "top_subjects": [s for s in subjects[:5]],
            "weak_subjects": [s for s in subjects[-5:]] if len(subjects) > 5 else subjects,
        }

    async def check_faculty_assigned_to_subject(self, faculty_id: str, subject_id: str) -> bool:
        """Check if faculty is assigned to the given subject."""
        q = "SELECT id FROM faculty_subjects WHERE faculty_id=$1 AND subject_id=$2"
        async with PostgresDB.pool.acquire() as conn:
            row = await conn.fetchrow(q, faculty_id, subject_id)
        return row is not None

    # -------------------- ANALYTICS -------------------- #

    async def get_analytics_student(self, student_id: str) -> dict:
        """Attendance % per subject computed from session records."""
        q = """
        SELECT
            sub.subject_name,
            COUNT(ar.id) FILTER (WHERE ar.status = 'present') AS attended,
            MAX(COALESCE(sess.total_classes, sess.total_sessions, 40)) AS total
        FROM subjects sub
        JOIN attendance_sessions sess ON sub.id = sess.subject_id
        LEFT JOIN attendance_records ar ON ar.session_id = sess.id AND ar.student_id = $1
        WHERE sub.department_id = (SELECT department_id FROM students WHERE id = $1)
          AND sub.semester     = (SELECT semester      FROM students WHERE id = $1)
        GROUP BY sub.id, sub.subject_name
        """
        async with PostgresDB.pool.acquire() as conn:
            rows = await conn.fetch(q, student_id)
        subjects = []
        total_attended = 0
        total_classes  = 0
        for r in rows:
            t   = r["total"] or 0
            att = r["attended"] or 0
            pct = round(att / t * 100, 1) if t > 0 else 0.0
            subjects.append({"subject": r["subject_name"], "percentage": pct, "attended": att, "total": t})
            total_attended += att
            total_classes  += t
        overall = round(total_attended / total_classes * 100, 1) if total_classes > 0 else 0.0
        return {"overall_percentage": overall, "subjects": subjects}

    async def get_analytics_faculty(self, faculty_id: str) -> dict:
        """Per-subject avg attendance & count of students below 75%."""
        q = """
        SELECT
            sub.subject_name,
            sub.id AS subject_id,
            COUNT(DISTINCT ar.student_id) AS total_students,
            COUNT(ar.id) FILTER (WHERE ar.status = 'present') AS total_present,
            COUNT(ar.id) AS total_records
        FROM faculty_subjects fs
        JOIN subjects sub ON sub.id = fs.subject_id
        JOIN attendance_sessions sess ON sess.subject_id = sub.id
        LEFT JOIN attendance_records ar ON ar.session_id = sess.id
        WHERE fs.faculty_id = $1
        GROUP BY sub.id, sub.subject_name
        """
        # Per-student per-subject attendance for low-performer count
        q2 = """
        SELECT
            sub.subject_name,
            ar.student_id,
            COUNT(ar.id) FILTER (WHERE ar.status = 'present') AS attended,
            MAX(COALESCE(sess.total_classes, sess.total_sessions, 40)) AS total
        FROM faculty_subjects fs
        JOIN subjects sub ON sub.id = fs.subject_id
        JOIN attendance_sessions sess ON sess.subject_id = sub.id
        LEFT JOIN attendance_records ar ON ar.session_id = sess.id
        WHERE fs.faculty_id = $1 AND ar.student_id IS NOT NULL
        GROUP BY sub.subject_name, ar.student_id
        """
        async with PostgresDB.pool.acquire() as conn:
            rows2 = await conn.fetch(q2, faculty_id)

        subj_map: dict = {}
        for r in rows2:
            name = r["subject_name"]
            t    = r["total"] or 0
            att  = r["attended"] or 0
            pct  = att / t * 100 if t > 0 else 0
            if name not in subj_map:
                subj_map[name] = {"avg_sum": 0, "count": 0, "low": 0}
            subj_map[name]["avg_sum"] += pct
            subj_map[name]["count"]   += 1
            if pct < 75:
                subj_map[name]["low"] += 1

        subjects = []
        for name, d in subj_map.items():
            avg = round(d["avg_sum"] / d["count"], 1) if d["count"] > 0 else 0.0
            subjects.append({"subject": name, "avg_attendance": avg, "low_students": d["low"]})
        return {"subjects": subjects}

    async def get_analytics_hod(self, dept_id: str) -> dict:
        """Dept-wide avg attendance, total low-performing students, top subjects by avg."""
        q = """
        SELECT
            sub.subject_name,
            ar.student_id,
            COUNT(ar.id) FILTER (WHERE ar.status = 'present') AS attended,
            MAX(COALESCE(sess.total_classes, sess.total_sessions, 40)) AS total
        FROM subjects sub
        JOIN attendance_sessions sess ON sess.subject_id = sub.id
        LEFT JOIN attendance_records ar ON ar.session_id = sess.id
        WHERE sub.department_id = $1 AND ar.student_id IS NOT NULL
        GROUP BY sub.subject_name, ar.student_id
        """
        async with PostgresDB.pool.acquire() as conn:
            rows = await conn.fetch(q, dept_id)

        subj_map: dict = {}
        total_sum = 0
        total_cnt = 0
        low_set: set = set()
        for r in rows:
            name = r["subject_name"]
            t    = r["total"] or 0
            att  = r["attended"] or 0
            pct  = att / t * 100 if t > 0 else 0
            if name not in subj_map:
                subj_map[name] = {"avg_sum": 0, "count": 0}
            subj_map[name]["avg_sum"] += pct
            subj_map[name]["count"]   += 1
            total_sum += pct
            total_cnt += 1
            if pct < 75:
                low_set.add(r["student_id"])

        dept_avg = round(total_sum / total_cnt, 1) if total_cnt > 0 else 0.0
        top_subjects = sorted(
            [{"subject": n, "avg_attendance": round(d["avg_sum"] / d["count"], 1)}
             for n, d in subj_map.items() if d["count"] > 0],
            key=lambda x: x["avg_attendance"], reverse=True
        )[:5]
        return {
            "department_avg": dept_avg,
            "low_performing_students": len(low_set),
            "top_subjects": top_subjects,
        }

    async def get_analytics_admin(self) -> dict:
        """System-wide: total students, total faculty, overall attendance avg."""
        async with PostgresDB.pool.acquire() as conn:
            total_students = (await conn.fetchrow("SELECT COUNT(*) FROM students"))["count"]
            total_faculty  = (await conn.fetchrow("SELECT COUNT(*) FROM faculty"))["count"]
            row = await conn.fetchrow("""
                SELECT
                    COUNT(ar.id) FILTER (WHERE ar.status = 'present') AS present,
                    COUNT(ar.id) AS total
                FROM attendance_records ar
            """)
        present = row["present"] or 0
        total   = row["total"]   or 0
        overall = round(present / total * 100, 1) if total > 0 else 0.0
        return {
            "total_students": total_students,
            "total_faculty":  total_faculty,
            "overall_attendance": overall,
        }

    # -------------------- ALERTS -------------------- #

    async def get_attendance_alerts_student(self, student_id: str) -> List[dict]:
        q = """
        SELECT
            sub.subject_name,
            COUNT(ar.id) FILTER (WHERE ar.status = 'present') AS attended,
            MAX(COALESCE(sess.total_classes, sess.total_sessions, 40)) AS total
        FROM subjects sub
        JOIN attendance_sessions sess ON sub.id = sess.subject_id
        LEFT JOIN attendance_records ar ON ar.session_id = sess.id AND ar.student_id = $1
        WHERE sub.department_id = (SELECT department_id FROM students WHERE id = $1)
          AND sub.semester     = (SELECT semester      FROM students WHERE id = $1)
        GROUP BY sub.id, sub.subject_name
        """
        async with PostgresDB.pool.acquire() as conn:
            rows = await conn.fetch(q, student_id)
        alerts = []
        for r in rows:
            t   = r["total"] or 0
            att = r["attended"] or 0
            pct = att / t * 100 if t > 0 else 100.0
            if pct < 75:
                alerts.append({"type": "critical", "message": f"Attendance critically low ({pct:.1f}%) in {r['subject_name']}"})
            elif pct < 85:
                alerts.append({"type": "warning", "message": f"Attendance below 85% ({pct:.1f}%) in {r['subject_name']}"})
        return alerts

    async def get_attendance_alerts_faculty(self, faculty_id: str) -> List[dict]:
        q = """
        SELECT
            sub.subject_name,
            ar.student_id,
            u.name AS student_name,
            COUNT(ar.id) FILTER (WHERE ar.status = 'present') AS attended,
            MAX(COALESCE(sess.total_classes, sess.total_sessions, 40)) AS total
        FROM faculty_subjects fs
        JOIN subjects sub ON sub.id = fs.subject_id
        JOIN attendance_sessions sess ON sess.subject_id = sub.id
        LEFT JOIN attendance_records ar ON ar.session_id = sess.id
        LEFT JOIN students st ON st.id = ar.student_id
        LEFT JOIN users u ON u.id = st.user_id
        WHERE fs.faculty_id = $1 AND ar.student_id IS NOT NULL
        GROUP BY sub.subject_name, ar.student_id, u.name
        """
        async with PostgresDB.pool.acquire() as conn:
            rows = await conn.fetch(q, faculty_id)
        alerts = []
        for r in rows:
            t   = r["total"] or 0
            att = r["attended"] or 0
            pct = att / t * 100 if t > 0 else 100.0
            name = r["student_name"] or r["student_id"]
            if pct < 75:
                alerts.append({"type": "critical", "message": f"{name} is critically low ({pct:.1f}%) in {r['subject_name']}"})
            elif pct < 85:
                alerts.append({"type": "warning",  "message": f"{name} is below 85% ({pct:.1f}%) in {r['subject_name']}"})
        return alerts

    async def get_attendance_alerts_hod(self, dept_id: str) -> List[dict]:
        q = """
        SELECT
            sub.subject_name,
            ar.student_id,
            u.name AS student_name,
            COUNT(ar.id) FILTER (WHERE ar.status = 'present') AS attended,
            MAX(COALESCE(sess.total_classes, sess.total_sessions, 40)) AS total
        FROM subjects sub
        JOIN attendance_sessions sess ON sess.subject_id = sub.id
        LEFT JOIN attendance_records ar ON ar.session_id = sess.id
        LEFT JOIN students st ON st.id = ar.student_id
        LEFT JOIN users u ON u.id = st.user_id
        WHERE sub.department_id = $1 AND ar.student_id IS NOT NULL
        GROUP BY sub.subject_name, ar.student_id, u.name
        """
        async with PostgresDB.pool.acquire() as conn:
            rows = await conn.fetch(q, dept_id)
        alerts = []
        for r in rows:
            t   = r["total"] or 0
            att = r["attended"] or 0
            pct = att / t * 100 if t > 0 else 100.0
            name = r["student_name"] or r["student_id"]
            if pct < 75:
                alerts.append({"type": "critical", "message": f"{name} critically low ({pct:.1f}%) in {r['subject_name']}"})
            elif pct < 85:
                alerts.append({"type": "warning",  "message": f"{name} below 85% ({pct:.1f}%) in {r['subject_name']}"})
        return alerts

    async def get_attendance_alerts_admin(self) -> List[dict]:
        q = """
        SELECT
            sub.subject_name,
            ar.student_id,
            u.name AS student_name,
            COUNT(ar.id) FILTER (WHERE ar.status = 'present') AS attended,
            MAX(COALESCE(sess.total_classes, sess.total_sessions, 40)) AS total
        FROM subjects sub
        JOIN attendance_sessions sess ON sess.subject_id = sub.id
        LEFT JOIN attendance_records ar ON ar.session_id = sess.id
        LEFT JOIN students st ON st.id = ar.student_id
        LEFT JOIN users u ON u.id = st.user_id
        WHERE ar.student_id IS NOT NULL
        GROUP BY sub.subject_name, ar.student_id, u.name
        """
        async with PostgresDB.pool.acquire() as conn:
            rows = await conn.fetch(q)
        alerts = []
        for r in rows:
            t   = r["total"] or 0
            att = r["attended"] or 0
            pct = att / t * 100 if t > 0 else 100.0
            name = r["student_name"] or r["student_id"]
            if pct < 75:
                alerts.append({"type": "critical", "message": f"{name} critically low ({pct:.1f}%) in {r['subject_name']}"})
            elif pct < 85:
                alerts.append({"type": "warning",  "message": f"{name} below 85% ({pct:.1f}%) in {r['subject_name']}"})
        return alerts

    # -------------------- NOTIFICATIONS -------------------- #

    async def insert_notification(self, sender_id: str, receiver_id: str, message: str, notif_type: str = "query") -> str:
        n_id = "notif_" + str(int(time.time() * 1000))
        q = """
        INSERT INTO notifications (id, sender_id, receiver_id, message, type)
        VALUES ($1, $2, $3, $4, $5)
        """
        async with PostgresDB.pool.acquire() as conn:
            await conn.execute(q, n_id, sender_id, receiver_id, message, notif_type)
        return n_id

    async def get_notifications(self, receiver_id: str) -> List[dict]:
        q = """
        SELECT id, sender_id, receiver_id, message, type, created_at
        FROM notifications
        WHERE receiver_id = $1
        ORDER BY created_at DESC
        LIMIT 50
        """
        async with PostgresDB.pool.acquire() as conn:
            rows = await conn.fetch(q, receiver_id)
        return [row_to_dict(r) for r in rows]

    async def get_faculty_for_subject(self, subject_id: str) -> Optional[str]:
        """Returns faculty user_id for the faculty assigned to a subject."""
        q = """
        SELECT f.user_id FROM faculty_subjects fs
        JOIN faculty f ON f.id = fs.faculty_id
        WHERE fs.subject_id = $1
        LIMIT 1
        """
        async with PostgresDB.pool.acquire() as conn:
            row = await conn.fetchrow(q, subject_id)
        return row["user_id"] if row else None

    # -------------------- REPORT DATA -------------------- #

    async def get_all_students_report(self) -> List[dict]:
        q = """
        SELECT
            s.id, s.usn, u.name, s.department, s.department_id, s.semester,
            COALESCE(
                (SELECT ROUND(
                    COUNT(ar.id) FILTER (WHERE ar.status = 'present') * 100.0
                    / NULLIF(MAX(COALESCE(sess.total_classes, sess.total_sessions, 40)), 0), 1)
                 FROM attendance_sessions sess
                 LEFT JOIN attendance_records ar ON ar.session_id = sess.id AND ar.student_id = s.id
                 WHERE sess.subject_id IN (
                     SELECT id FROM subjects WHERE department_id = s.department_id AND semester = s.semester
                 )
                ), 0
            ) AS avg_attendance
        FROM students s
        LEFT JOIN users u ON u.id = s.user_id
        ORDER BY s.department, s.semester, s.usn
        """
        async with PostgresDB.pool.acquire() as conn:
            rows = await conn.fetch(q)
        return [row_to_dict(r) for r in rows]

    async def get_all_faculty_report(self) -> List[dict]:
        q = """
        SELECT f.id, f.faculty_code, f.name, f.department, f.department_id, u.email
        FROM faculty f
        LEFT JOIN users u ON u.id = f.user_id
        ORDER BY f.department, f.name
        """
        async with PostgresDB.pool.acquire() as conn:
            rows = await conn.fetch(q)
        return [row_to_dict(r) for r in rows]

    # -------------------- AI PREDICTION (heuristic) -------------------- #

    async def get_student_prediction_data(self, student_id: str) -> dict:
        """Fetch raw data needed for heuristic risk scoring."""
        # Attendance % across subjects
        att_q = """
        SELECT
            COUNT(ar.id) FILTER (WHERE ar.status = 'present') AS attended,
            MAX(COALESCE(sess.total_classes, sess.total_sessions, 40)) AS total
        FROM subjects sub
        JOIN attendance_sessions sess ON sub.id = sess.subject_id
        LEFT JOIN attendance_records ar ON ar.session_id = sess.id AND ar.student_id = $1
        WHERE sub.department_id = (SELECT department_id FROM students WHERE id = $1)
          AND sub.semester     = (SELECT semester      FROM students WHERE id = $1)
        GROUP BY sub.id
        """
        # Marks
        marks_q = "SELECT internal_marks, external_marks FROM marks WHERE student_id = $1"
        # Result
        result_q = "SELECT sgpa, cgpa FROM results WHERE student_id = $1"
        # Session count for consistency
        sess_q = """
        SELECT COUNT(DISTINCT sess.id) AS sessions
        FROM attendance_sessions sess
        JOIN attendance_records ar ON ar.session_id = sess.id
        WHERE ar.student_id = $1
        """
        async with PostgresDB.pool.acquire() as conn:
            att_rows   = await conn.fetch(att_q, student_id)
            marks_rows = await conn.fetch(marks_q, student_id)
            result_row = await conn.fetchrow(result_q, student_id)
            sess_row   = await conn.fetchrow(sess_q, student_id)

        # Attendance average
        atts = []
        for r in att_rows:
            t = r["total"] or 0
            a = r["attended"] or 0
            if t > 0:
                atts.append(a / t * 100)
        avg_att = sum(atts) / len(atts) if atts else 0.0

        # Marks average (internal on 50, external on 100 → normalise to %)
        marks_pcts = []
        for r in marks_rows:
            total_marks = (r["internal_marks"] or 0) + (r["external_marks"] or 0)
            marks_pcts.append(total_marks / 150 * 100)
        avg_marks = sum(marks_pcts) / len(marks_pcts) if marks_pcts else 0.0

        cgpa = float(result_row["cgpa"]) if result_row else 0.0
        sessions = int(sess_row["sessions"]) if sess_row else 0

        return {
            "avg_attendance": round(avg_att, 1),
            "avg_marks_pct":  round(avg_marks, 1),
            "cgpa":           cgpa,
            "sessions_attended": sessions,
        }
