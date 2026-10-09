import logging
from fastapi import APIRouter, HTTPException, status
from app.schemas.interview import (
    GenerateQuestionRequest,
    GenerateQuestionResponse,
    EvaluateAnswerRequest,
    EvaluateAnswerResponse
)
from app.agents.interview_graph import (
    generate_interview_question,
    evaluate_candidate_answer
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/interview", tags=["AI Interview Engine"])

@router.post(
    "/generate-question",
    response_model=GenerateQuestionResponse,
    summary="Generate Next Interview Question",
    description="Uses Gemini & LangGraph to generate an adaptive question tailored to the candidate's resume, round type, and prior answers."
)
async def generate_question_endpoint(request: GenerateQuestionRequest):
    try:
        response = generate_interview_question(request)
        return response
    except Exception as e:
        logger.error(f"Error generating question: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate interview question: {str(e)}"
        )

@router.post(
    "/evaluate-answer",
    response_model=EvaluateAnswerResponse,
    summary="Evaluate Candidate Answer",
    description="Uses Gemini & LangGraph to score and evaluate candidate's spoken/submitted answer with detailed feedback."
)
async def evaluate_answer_endpoint(request: EvaluateAnswerRequest):
    try:
        response = evaluate_candidate_answer(request)
        return response
    except Exception as e:
        logger.error(f"Error evaluating answer: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate candidate answer: {str(e)}"
        )
