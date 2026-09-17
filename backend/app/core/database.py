from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings
import logging

logger = logging.getLogger("lifeos.database")

# Check if PostgreSQL URL is provided and valid, otherwise fallback to local async sqlite
database_url = settings.DATABASE_URL
if not database_url or "your-project" in database_url or "your-db-password" in database_url:
    database_url = "sqlite+aiosqlite:///./lifeos_dev.db"
    logger.info("Using local development database: sqlite+aiosqlite:///./lifeos_dev.db")
elif database_url.startswith("postgresql://"):
    # Ensure async driver is used with SQLAlchemy async engine
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(
    database_url,
    echo=False,
    future=True,
    pool_pre_ping=True if "postgresql" in database_url else False,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
