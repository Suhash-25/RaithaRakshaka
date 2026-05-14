import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def update_db_planner():
    conn = await asyncpg.connect(
        user=os.getenv("PG_USER", "postgres"),
        password=os.getenv("PG_PASSWORD", "1234567890"),
        database=os.getenv("PG_DB", "avinya"),
        host=os.getenv("PG_HOST", "localhost"),
        port=int(os.getenv("PG_PORT", 5432))
    )
    
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS student_plans (
            id SERIAL PRIMARY KEY,
            student_id TEXT NOT NULL,
            plan_json JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    await conn.execute("""
        CREATE TABLE IF NOT EXISTS student_progress (
            id SERIAL PRIMARY KEY,
            student_id TEXT NOT NULL,
            day TEXT NOT NULL,
            task TEXT NOT NULL,
            completed BOOLEAN DEFAULT FALSE,
            UNIQUE(student_id, day, task)
        )
    """)

    await conn.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            student_id TEXT NOT NULL,
            message TEXT NOT NULL,
            read_status BOOLEAN DEFAULT FALSE,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    print("Planner module tables successfully created!")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(update_db_planner())
