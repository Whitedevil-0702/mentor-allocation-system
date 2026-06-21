import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Database path (SQLite file inside backend directory)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(os.path.dirname(BASE_DIR), "database.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# Connect args needed for SQLite concurrency
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# DB Dependency injection to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
