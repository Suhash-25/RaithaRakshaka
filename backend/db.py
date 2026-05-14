import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()


class PostgresDB:
    pool: asyncpg.Pool | None = None

    @classmethod
    async def connect(cls):
        if cls.pool is not None:
            return

        cls.pool = await asyncpg.create_pool(
            user=os.getenv("PG_USER", "postgres"),
            password=os.getenv("PG_PASSWORD", "1234567890"),
            database=os.getenv("PG_DB", "avinya"),
            host=os.getenv("PG_HOST", "localhost"),
            port=int(os.getenv("PG_PORT", 5432)),
            min_size=1,
            max_size=5
        )
