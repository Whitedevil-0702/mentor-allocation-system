from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.database import engine, Base
from .core.config import settings
from .students.router import router as students_router
from .scoring.router import router as scores_router
from .mentoring.router import mentors_router, allocations_router, meetings_router, dashboard_router

# Create DB Tables automatically on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for Mentor Allocation System (MAS)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers with /api prefix
app.include_router(students_router, prefix=settings.API_PREFIX)
app.include_router(scores_router, prefix=settings.API_PREFIX)
app.include_router(mentors_router, prefix=settings.API_PREFIX)
app.include_router(allocations_router, prefix=settings.API_PREFIX)
app.include_router(meetings_router, prefix=settings.API_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_PREFIX)

@app.get("/api/health", tags=["health"])
def health_check():
    return {"status": "ok", "message": "FastAPI server running successfully."}
