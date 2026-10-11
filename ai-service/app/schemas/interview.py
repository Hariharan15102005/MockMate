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
    perspective: Optional[str] = None
    previous_perspectives: Optional[List[str]] = []
    priority_topics: Optional[List[str]] = []
    historical_weaknesses: Optional[List[Dict[str, Any]]] = []

class GenerateQuestionResponse(BaseModel):
    action: str = "ASK_QUESTION" # ASK_QUESTION, FOLLOW_UP, CLARIFY, REPEAT, TRANSITION, END_INTERVIEW, GO_DEEPER, CHALLENGE, SWITCH_TOPIC
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
    perspective: Optional[str] = None
    perspective_goal: Optional[str] = None
    allow_same_topic_follow_up: Optional[bool] = None
    clarification_attempted: Optional[bool] = None
    current_topic_state: Optional[str] = None
    reason_code: Optional[str] = None
    skipped_subtopics: Optional[List[str]] = []
    section: Optional[str] = None
    context_type: Optional[str] = None
    section_coverage: Optional[Dict[str, Any]] = None
    project_coverage: Optional[Dict[str, Any]] = None

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

# ========================================================
# POST-INTERVIEW PERFORMANCE ANALYSIS & ROADMAP SCHEMAS
# ========================================================

class CategoryScoreDetail(BaseModel):
    category: str  # "Technical Knowledge", "Project Understanding", "Problem-Solving Ability", "Communication and Clarity", "Answer Structure", "Practical Implementation Knowledge"
    score: float = Field(..., ge=0.0, le=100.0)
    weight: float = Field(..., ge=0.0, le=1.0)
    explanation: str
    evidence: str

class StrengthDetail(BaseModel):
    skill_or_topic: str
    demonstrated_behavior_or_answer: str
    why_effective: str
    how_to_leverage: str

class ImprovementDetail(BaseModel):
    question: str
    candidate_answer_summary: str
    what_went_wrong: str
    what_expected: str
    how_to_improve: str
    example_improved_answer: str
    priority: str = "High"  # "Critical", "High", "Medium", "Low"
    gap_type: str = "conceptual"  # "conceptual", "communication", "practical", "structural"

class ProjectKnowledgeDetail(BaseModel):
    project_name: str
    problem_solving_clarity: str = "Demonstrated"
    architecture_and_data_flow: str = "Addressed"
    tech_stack_selection_reasoning: str = "Reasonable"
    individual_contribution: str = "Explained"
    technical_implementation_depth: str = "Moderate"
    tradeoffs_and_challenges: str = "Outlined"
    specific_gaps_identified: List[str] = []
    status_summary: str = "Good Project Overview"

class SkillGapDetail(BaseModel):
    skill: str
    demonstrated_level: str  # "Strong", "Intermediate", "Weak", "Not Assessed"
    evidence: str
    knowledge_gap: str
    recommended_resource_or_exercise: str
    priority: str = "Medium"  # "Critical", "High", "Medium", "Low"

class RoadmapDayTask(BaseModel):
    id: str
    topic: str
    learning_outcome: str
    practical_activity: str
    completed: bool = False

class RoadmapDayDetail(BaseModel):
    day_range: str  # "Day 1", "Days 2-3", "Days 4-5", "Days 6-7"
    phase_title: str
    focus_summary: str
    tasks: List[RoadmapDayTask] = []

class QuestionReviewDetail(BaseModel):
    question_number: int
    question_text: str
    candidate_answer_summary: str
    score: float = Field(..., ge=0.0, le=10.0)
    performance_assessment: str
    what_was_missing_or_incorrect: str
    suggested_improved_answer: str
    skill_to_revise: str

class AnalyzeInterviewSessionRequest(BaseModel):
    session_id: str
    candidate_name: Optional[str] = "Candidate"
    target_role: Optional[str] = "Full Stack Software Engineer"
    interview_title: Optional[str] = "AI Mock Interview"
    duration_seconds: Optional[int] = 0
    resume_context: Optional[Dict[str, Any]] = None
    transcript: List[Dict[str, Any]] = []
    priority_topics: Optional[List[str]] = []

class PostInterviewAnalysisResponse(BaseModel):
    session_id: str
    overall_score: float = Field(..., ge=0.0, le=100.0)
    performance_summary: str
    category_scores: List[CategoryScoreDetail] = []
    strengths: List[StrengthDetail] = []
    weaknesses: List[ImprovementDetail] = []
    project_analysis: List[ProjectKnowledgeDetail] = []
    skills_gap_matrix: List[SkillGapDetail] = []
    improvement_roadmap: List[RoadmapDayDetail] = []
    question_reviews: List[QuestionReviewDetail] = []
    weak_topics_for_practice: List[str] = []
    recommended_next_focus: str = "Deepen technical edge-cases and distributed failure modes"

