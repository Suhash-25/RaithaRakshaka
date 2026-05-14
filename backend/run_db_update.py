import asyncio
import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

async def update_db():
    conn = await asyncpg.connect(
        user=os.getenv("PG_USER", "postgres"),
        password=os.getenv("PG_PASSWORD", "1234567890"),
        database=os.getenv("PG_DB", "avinya"),
        host=os.getenv("PG_HOST", "localhost"),
        port=int(os.getenv("PG_PORT", 5432))
    )
    
    # Create departments table
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS departments (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL
        )
    """)
    
    # Add department_id to students if not exists
    try:
        await conn.execute("ALTER TABLE students ADD COLUMN department_id TEXT")
    except asyncpg.exceptions.DuplicateColumnError:
        print("students.department_id already exists")
        
    # Add department_id to faculty if not exists
    try:
        await conn.execute("ALTER TABLE faculty ADD COLUMN department_id TEXT")
    except asyncpg.exceptions.DuplicateColumnError:
        print("faculty.department_id already exists")
        
    print("Database schema successfully extended!")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(update_db())
