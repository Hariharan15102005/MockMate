from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class GenerateQuestionRequest(BaseModel):
    session_id: str
    candidate_id: str
    candidate_name: Optional[str] = "Candidate"
    round_number: int = 1
    round_type: str = "TECHNICAL"
    role: str = "Java Full Stack Developer"
    difficulty: str = "MEDIUM"
    adaptive_enabled: bool = True
    resume_context: Optional[Dict[str, Any]] = None
    previous_interactions: Optional[List[Dict[str, Any]]] = []
    conversation_history: Optional[List[Dict[str, Any]]] = []
    last_candidate_answer: Optional[str] = None
    historical_questions: Optional[List[str]] = []
    claims: Optional[List[str]] = []
    remaining_seconds: Optional[int] = 2700

class GenerateQuestionResponse(BaseModel):
    action: str = "ASK_QUESTION" # ASK_QUESTION, FOLLOW_UP, CLARIFY, REPEAT, TRANSITION, END_INTERVIEW
    acknowledgement: Optional[str] = ""
    question_text: str
    full_speech_text: str
    question_category: str
    question_source: str
    topic: Optional[str] = "General"
    hints: List[str] = []
    ideal_key_points: List[str] = []
    sample_solution: Optional[str] = None
    difficulty: str = "MEDIUM"
    is_completed: bool = False
    semantic_fingerprint: Optional[str] = None
    subtopic: Optional[str] = None
    skill: Optional[str] = None
    project: Optional[str] = None
    angle: Optional[str] = None
    question_type: Optional[str] = None

class EvaluateAnswerRequest(BaseModel):
    session_id: str
    round_type: str
    question_text: str
    candidate_answer: str
    ideal_key_points: Optional[List[str]] = []
    rubric: Optional[Dict[str, float]] = None

class EvaluateAnswerResponse(BaseModel):
    correctness_score: float = Field(..., ge=0.0, le=10.0)
    relevance_score: float = Field(..., ge=0.0, le=10.0)
    depth_score: float = Field(..., ge=0.0, le=10.0)
    completeness_score: float = Field(..., ge=0.0, le=10.0)
    communication_score: float = Field(..., ge=0.0, le=10.0)
    problem_solving_score: float = Field(..., ge=0.0, le=10.0)
    overall_question_score: float = Field(..., ge=0.0, le=10.0)
    feedback: str
    strengths: List[str] = []
    improvements: List[str] = []
