import os
import sys
from datetime import datetime, timezone
import platform
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.schemas.health import HealthResponse

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Agentic AI Service for AgentHire: LangGraph State Machine, Resume Parsing & Evaluation Engine",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get(
    "/ai/health",
    response_model=HealthResponse,
    tags=["Health"],
    summary="AI Service Health Check",
    description="Returns operational diagnostic info and health status for the LangGraph AI Service"
)
async def get_health():
    return HealthResponse(
        status="ONLINE",
        service="AgentHire AI Service",
        version=settings.VERSION,
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc),
        details={
            "python_version": sys.version.split()[0],
            "platform": platform.platform(),
            "langgraph_status": "READY",
            "active_agents": [
                "ResumeAgent",
                "InterviewPlannerAgent",
                "InterviewerAgent",
                "TechnicalEvaluator",
                "CodingEvaluator",
                "LearningAgent",
                "BehavioralAgent",
                "ReportAgent"
            ]
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
