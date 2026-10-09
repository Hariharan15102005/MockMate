from fastapi import APIRouter, HTTPException, status
from app.schemas.resume import ResumeAnalysisRequest, ResumeAnalysisResponse
from app.agents.resume_graph import run_resume_analysis
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/ai/resume",
    tags=["Resume AI Analysis"]
)

@router.post(
    "/analyze",
    response_model=ResumeAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze Candidate Resume via LangGraph",
    description="Processes raw extracted resume text, extracts structured education, skills, projects, and calculates role relevance score."
)
async def analyze_resume(request: ResumeAnalysisRequest):
    try:
        logger.info(f"Received resume analysis request for candidate: {request.candidate_id}, resume: {request.resume_id}")
        response = run_resume_analysis(request)
        logger.info(f"Successfully processed resume {request.resume_id} with score {response.role_relevance.score}")
        return response
    except ValueError as ve:
        logger.warning(f"Validation failure during resume analysis: {ve}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Unexpected failure in resume analysis graph: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI Resume Analysis engine failed: {str(e)}"
        )
