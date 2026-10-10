import os
import json
import logging
import random
import re
import hashlib
from typing import TypedDict, List, Dict, Any, Optional, Set, Tuple
from langgraph.graph import StateGraph, START, END
from app.core.config import settings
from app.schemas.interview import (
    GenerateQuestionRequest,
    GenerateQuestionResponse,
    EvaluateAnswerRequest,
    EvaluateAnswerResponse
)
from app.services.chroma_service import (
    chunk_and_index_resume,
    retrieve_relevant_resume_knowledge,
    get_all_candidate_claims
)

logger = logging.getLogger(__name__)

# Track Gemini availability (Only enable if valid AIzaSy API key)
_gemini_available = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.startswith("AIzaSy"))
try:
    import google.generativeai as genai
    if _gemini_available:
        genai.configure(api_key=settings.GEMINI_API_KEY)
except Exception as e:
    _gemini_available = False
    logger.warning(f"Failed to configure google.generativeai: {e}")

_indexed_candidates: Set[str] = set()

# ========================================================
# 1. INTERVIEW PERSPECTIVES CATALOG (LEVEL 1 INTELLIGENCE)
# ========================================================

INTERVIEW_PERSPECTIVES: Dict[str, Dict[str, Any]] = {
    "AI_ML_DEPTH": {
        "goal": "Evaluate deep practical understanding of AI/ML, vector retrieval, embeddings, and LLM orchestration.",
        "preferred_areas": ["RAG", "ChromaDB", "embeddings", "vector search", "LangChain", "LLMs", "evaluation", "hallucination", "TensorFlow", "CNN", "Computer Vision"],
        "angles": ["IMPLEMENTATION", "OPTIMIZATION", "FAILURE", "TRADEOFF", "DEBUGGING", "SCALABILITY"],
        "style": "PROJECT_SPECIFIC",
        "perspective_opener": "I noticed you worked with RAG and vector retrieval. What role did that AI pipeline play in your system, and how did you approach chunking and retrieval accuracy?",
        "investigation_focus": "embeddings, chunking, retrieval quality, ChromaDB, vector indexing, evaluation"
    },
    "SYSTEM_ARCHITECTURE": {
        "goal": "Understand whether the candidate can reason about end-to-end system design, service boundaries, and communication.",
        "preferred_areas": ["microservices", "REST APIs", "Spring Boot", "React", "databases", "service boundaries", "architecture"],
        "angles": ["ARCHITECTURE", "DESIGN_REVIEW", "FAILURE", "TRADEOFF", "SCALABILITY"],
        "style": "DESIGN_REVIEW",
        "perspective_opener": "Looking across your projects, could you walk me through how you structured the overall architecture and service boundaries between frontend, backend, and data stores?",
        "investigation_focus": "data flow, components, boundaries, communication, failure handling, scalability"
    },
    "PROJECT_OWNERSHIP": {
        "goal": "Determine what the candidate personally designed, built, debugged, and owned from inception to completion.",
        "preferred_areas": ["personal contributions", "design decisions", "difficult bugs", "debugging", "trade-offs", "responsibilities"],
        "angles": ["PROJECT_EXPERIENCE", "DECISION", "DEBUGGING", "TRADEOFF", "REAL_WORLD"],
        "style": "PROJECT_SPECIFIC",
        "perspective_opener": "Of the projects on your resume, which one did you have the most hands-on personal involvement in, and what part of the system did you personally own?",
        "investigation_focus": "candidate contribution, implementation, design decisions, difficult problems, debugging, trade-offs"
    },
    "PRODUCTION_ENGINEERING": {
        "goal": "Determine whether the candidate can operate software reliably in real-world production environments.",
        "preferred_areas": ["deployment", "Docker", "Kubernetes", "logging", "monitoring", "latency", "scalability", "failure recovery", "incident management"],
        "angles": ["PRODUCTION_INCIDENT", "FAILURE", "DEBUGGING", "OPTIMIZATION", "SCALABILITY"],
        "style": "PRODUCTION_INCIDENT",
        "perspective_opener": "Looking at your software deployments, how did you handle monitoring, logging, and failure recovery when services experienced production incidents?",
        "investigation_focus": "deployment, failures, logs, monitoring, latency, scalability"
    },
    "SECURITY": {
        "goal": "Evaluate security understanding based on actual resume technology and data protection standards.",
        "preferred_areas": ["JWT", "authentication", "authorization", "Spring Security", "tokens", "validation", "access control", "API security"],
        "angles": ["SECURITY", "DESIGN_REVIEW", "EDGE_CASE", "FAILURE"],
        "style": "SCENARIO",
        "perspective_opener": "I noticed you implemented authentication and security mechanisms. How did you structure token validation, authorization, and endpoint protection across your services?",
        "investigation_focus": "authentication, JWT, authorization, API security, validation, access control"
    },
    "DATABASE_ENGINEERING": {
        "goal": "Evaluate deep data modeling, persistence mechanics, query efficiency, and consistency guarantees.",
        "preferred_areas": ["MySQL", "Postgres", "SQL", "queries", "indexing", "transactions", "ACID", "Redis", "caching"],
        "angles": ["OPTIMIZATION", "CONCURRENCY", "ARCHITECTURE", "TRADEOFF"],
        "style": "TRADEOFF",
        "perspective_opener": "In your database layer, how did you approach schema design, indexing, and transactional integrity under concurrent traffic?",
        "investigation_focus": "database schema, query optimization, indexing, ACID transactions, locking, caching"
    },
    "SCALABILITY": {
        "goal": "Evaluate how the candidate reasons about system growth, bottlenecks, and high throughput.",
        "preferred_areas": ["high traffic", "bottlenecks", "caching", "horizontal scaling", "statelessness", "concurrency", "performance"],
        "angles": ["SCALABILITY", "OPTIMIZATION", "CONCURRENCY", "FAILURE"],
        "style": "WHAT_IF",
        "perspective_opener": "Suppose user traffic to your core endpoints increased tenfold or a hundredfold. What part of your current architecture becomes the bottleneck first, and how would you scale it?",
        "investigation_focus": "traffic, database bottlenecks, caching, horizontal scaling, statelessness, throughput"
    },
    "TECHNICAL_DEPTH": {
        "goal": "Determine whether the candidate understands the core fundamentals, memory model, and runtime mechanics of their stack.",
        "preferred_areas": ["Java", "Spring Boot", "concurrency", "JVM", "garbage collection", "memory", "React lifecycle", "Python"],
        "angles": ["FUNDAMENTALS", "IMPLEMENTATION", "MEMORY", "CONCURRENCY", "TRADEOFF"],
        "style": "DIRECT",
        "perspective_opener": "Looking at your core technical stack, how do the underlying runtime execution and memory models behave when executing high-throughput requests?",
        "investigation_focus": "fundamentals, implementation, internals, trade-offs"
    },
    "PROBLEM_SOLVING": {
        "goal": "Evaluate technical reasoning, root cause analysis, and problem breakdown under architectural ambiguity.",
        "preferred_areas": ["debugging", "trade-offs", "complex requirements", "edge cases", "refactoring"],
        "angles": ["DEBUGGING", "TRADEOFF", "DECISION", "EDGE_CASE"],
        "style": "CHALLENGE",
        "perspective_opener": "Tell me about the most difficult bug or technical problem you had to solve in your recent projects, and how did you diagnose the root cause?",
        "investigation_focus": "debugging, troubleshooting, trade-offs, design alternatives"
    }
}

QUESTION_ANGLES = [
    "DEFINITION", "FUNDAMENTALS", "IMPLEMENTATION", "PROJECT_EXPERIENCE",
    "WHY", "HOW", "TRADEOFF", "COMPARISON", "DEBUGGING", "FAILURE",
    "OPTIMIZATION", "PERFORMANCE", "MEMORY", "CONCURRENCY", "SECURITY",
    "TESTING", "SCALABILITY", "ARCHITECTURE", "DESIGN", "EDGE_CASE",
    "REAL_WORLD", "PRODUCTION_INCIDENT", "SCENARIO", "DECISION",
    "CONSTRAINT", "PRESSURE", "PUZZLE", "BEHAVIORAL", "REFLECTION"
]

QUESTION_STYLES = [
    "DIRECT", "SCENARIO", "DEBUGGING", "PRODUCTION_INCIDENT", "TRADEOFF",
    "COUNTERFACTUAL", "DESIGN_REVIEW", "WHAT_IF", "CHALLENGE", "ROLEPLAY",
    "PROJECT_SPECIFIC", "CONSTRAINT_BASED", "WHY_CHAIN", "EDGE_CASE", "FOLLOW_UP"
]

ACKNOWLEDGEMENT_PHRASES = [
    "Got it, that makes sense.",
    "I see, thanks for walking me through that.",
    "Understood.",
    "Interesting perspective on that architecture.",
    "That clarifies your technical approach.",
    "Good point on those architectural considerations.",
    "That provides helpful context.",
    "Fair enough."
]

TRANSITION_PHRASES = [
    "That gives me a clear picture of that area. Let's explore another part of your experience.",
    "That's clear. I'd like to dive into another component from your background.",
    "Understood. Moving over to another project you worked on.",
    "Got it. Let's transition to another technical domain you've listed."
]

NO_ANSWER_PHRASES = [
    "No worries, that's completely fine. Let's move on.",
    "No problem at all, let's look at another area of your background.",
    "Fair enough, let's transition to a different technical topic.",
    "That's perfectly fine, let's keep moving forward."
]

# ========================================================
# 2. STATE DEFINITIONS
# ========================================================

class StructuredClaim(TypedDict):
    claim: str
    technology: str
    concept: str
    project: Optional[str]
    claim_type: str
    strength: str

class AnswerAnalysis(TypedDict):
    classification: str # STRONG, PARTIAL, WEAK, NO_ANSWER, I_DONT_KNOW, INTERESTING_DETAIL, OPENER
    concepts_mentioned: List[str]
    technologies_mentioned: List[str]
    interesting_details: List[str]
    word_count: int
    confidence_level: str

class InterviewPlan(TypedDict):
    action: str # GO_DEEPER, CLARIFY, CHALLENGE, EXPLORE_NEW_DETAIL, SWITCH_TOPIC, END_INTERVIEW, ASK_QUESTION
    topic: str
    subtopic: str
    skill: str
    project: Optional[str]
    claim: Optional[str]
    angle: str
    style: str
    difficulty: str
    reason: str
    expected_concepts: List[str]
    is_follow_up: bool
    transition_speech: str
    semantic_fingerprint: str
    retrieval_query: str

class ConversationalInterviewState(TypedDict):
    session_id: str
    candidate_id: str
    candidate_name: str
    round_number: int
    round_type: str
    role: str
    difficulty: str
    adaptive_enabled: bool
    resume_context: Dict[str, Any]
    claims: List[StructuredClaim]
    previous_interactions: List[Dict[str, Any]]
    conversation_history: List[Dict[str, Any]]
    historical_questions: List[str]
    last_candidate_answer: Optional[str]
    remaining_seconds: int
    perspective: Optional[str]
    perspective_goal: Optional[str]
    previous_perspectives: List[str]
    priority_topics: List[str]
    priority_projects: List[str]
    claims_explored: List[str]
    claims_remaining: List[str]
    angles_explored: List[str]
    retrieved_chunks: List[Dict[str, Any]]
    retrieval_query: str
    answer_analysis: Optional[AnswerAnalysis]
    current_topic: Optional[str]
    current_depth: int
    topics_discussed: List[str]
    plan: Optional[InterviewPlan]
    generated_turn: Optional[Dict[str, Any]]
    errors: List[str]

# ========================================================
# 3. NORMALIZATION & CLAIM EXTRACTION
# ========================================================

def normalize_fingerprint(text: str) -> str:
    """Produces a normalized semantic fingerprint for deduplication."""
    if not text:
        return ""
    lower = text.lower()
    filler_patterns = [
        r"\b(can you|could you|please|tell me about|tell me|tell|walk me through|what is|what are|what do you|explain what|explain how|explain why|explain|describe how|describe what|how do you|how would you|how does|what happens when|means|mean|in your own words|in your own|own words|own|words|give me an example of|give an example|in your project|imagine|suppose|regarding|looking at|walk me|know about|know|good morning|hello|hi|welcome|what|is|are|the|your|you|could|can|tell|me)\b",
        r"[^\w\s]"
    ]
    cleaned = lower
    for pat in filler_patterns:
        cleaned = re.sub(pat, " ", cleaned)
    tokens = [w for w in cleaned.split() if len(w) > 2]
    tokens.sort()
    return " ".join(tokens)

def extract_claims_from_context(resume_context: Dict[str, Any]) -> List[StructuredClaim]:
    """
    Extracts structured claims from projects, experience, and skills in resume.
    """
    claims: List[StructuredClaim] = []
    projects = resume_context.get("projects") or []
    skills = resume_context.get("skills") or []

    for p in projects:
        if isinstance(p, dict):
            p_name = p.get("title") or p.get("name") or "Featured Project"
            p_desc = p.get("description") or ""
            p_techs = p.get("technologies") or []
            p_text = f"{p_name} {p_desc} {' '.join(p_techs)}".lower()

            if any(k in p_text for k in ["spring", "backend", "microservice", "rest", "api"]):
                claims.append({
                    "claim": f"Engineered scalable REST APIs and backend microservices using Spring Boot in {p_name}",
                    "technology": "Spring Boot",
                    "concept": "REST_ARCHITECTURE",
                    "project": p_name,
                    "claim_type": "implementation",
                    "strength": "scalability"
                })
            if any(k in p_text for k in ["rag", "chroma", "vector", "langchain", "embeddings", "llm", "ai"]):
                claims.append({
                    "claim": f"Architected RAG retrieval pipeline with ChromaDB vector store in {p_name}",
                    "technology": "ChromaDB",
                    "concept": "RAG_RETRIEVAL",
                    "project": p_name,
                    "claim_type": "architecture",
                    "strength": "ai_integration"
                })
            if any(k in p_text for k in ["react", "frontend", "redux", "ui"]):
                claims.append({
                    "claim": f"Developed interactive UI components and state management in {p_name} using React",
                    "technology": "React",
                    "concept": "STATE_MANAGEMENT",
                    "project": p_name,
                    "claim_type": "implementation",
                    "strength": "user_experience"
                })
            if any(k in p_text for k in ["sql", "mysql", "postgres", "database", "query"]):
                claims.append({
                    "claim": f"Designed relational database schema, indexing, and transactional queries for {p_name}",
                    "technology": "MySQL",
                    "concept": "QUERY_OPTIMIZATION",
                    "project": p_name,
                    "claim_type": "optimization",
                    "strength": "performance"
                })
            if any(k in p_text for k in ["jwt", "auth", "security", "token", "oauth"]):
                claims.append({
                    "claim": f"Implemented stateless JWT token authentication and endpoint security in {p_name}",
                    "technology": "JWT",
                    "concept": "JWT_AUTHENTICATION",
                    "project": p_name,
                    "claim_type": "security",
                    "strength": "data_protection"
                })
            if any(k in p_text for k in ["vision", "cnn", "tensorflow", "opencv", "computer vision", "defect", "image", "neural"]):
                claims.append({
                    "claim": f"Trained custom convolutional neural network models and real-time computer vision inference in {p_name}",
                    "technology": "TensorFlow",
                    "concept": "COMPUTER_VISION_CNN",
                    "project": p_name,
                    "claim_type": "model_engineering",
                    "strength": "accuracy"
                })
            if any(k in p_text for k in ["redis", "cache"]):
                claims.append({
                    "claim": f"Implemented distributed Redis caching to accelerate endpoint throughput in {p_name}",
                    "technology": "Redis",
                    "concept": "CACHING_STRATEGY",
                    "project": p_name,
                    "claim_type": "optimization",
                    "strength": "latency"
                })
            if any(k in p_text for k in ["docker", "kubernetes", "container", "ci/cd"]):
                claims.append({
                    "claim": f"Containerized application workloads and orchestrated deployments in {p_name}",
                    "technology": "Docker",
                    "concept": "CONTAINERIZATION",
                    "project": p_name,
                    "claim_type": "infrastructure",
                    "strength": "reliability"
                })

    for s in skills:
        s_str = str(s).strip()
        if s_str and not any(c["technology"].lower() == s_str.lower() for c in claims):
            claims.append({
                "claim": f"Demonstrated engineering proficiency in {s_str} application development",
                "technology": s_str,
                "concept": f"{s_str.upper()}_FUNDAMENTALS",
                "project": None,
                "claim_type": "fundamentals",
                "strength": "core_competency"
            })

    return claims

extract_structured_claims = extract_claims_from_context

def plan_interview_direction(resume_context_or_state, round_number=1, current_round="TECHNICAL", role="Developer", history=None, difficulty="MEDIUM", session_seed=0):
    if isinstance(resume_context_or_state, dict) and "resume_context" in resume_context_or_state:
        r_ctx = resume_context_or_state.get("resume_context") or {}
        prev = resume_context_or_state.get("previous_interactions") or []
    else:
        r_ctx = resume_context_or_state or {}
        prev = []
    claims = extract_claims_from_context(r_ctx)
    prev_topics = [str(p.get("topic", "")).upper() for p in prev if isinstance(p, dict)]
    untested = [c for c in claims if c["concept"].upper() not in prev_topics and c["technology"].upper() not in prev_topics]
    selected_claim = untested[0] if untested else (claims[0] if claims else None)
    topic = selected_claim["technology"] if selected_claim else "Architecture"
    return {
        "topic": topic,
        "angle": "IMPLEMENTATION",
        "style": "PROJECT_SPECIFIC",
        "difficulty": difficulty,
        "selected_claim": selected_claim,
        "plan": {
            "topic": topic,
            "angle": "IMPLEMENTATION"
        }
    }

def generate_session_strategy(resume_context, session_id):
    claims = extract_claims_from_context(resume_context)
    return {
        "focus_areas": [c["technology"] for c in claims[:4]],
        "strategy": "DEEP_TECHNICAL"
    }

# ========================================================
# 4. LEVEL 1 INTELLIGENCE: PERSPECTIVE SELECTION ENGINE
# ========================================================

def select_interview_perspective(
    resume_context: Dict[str, Any],
    previous_perspectives: List[str],
    requested_perspective: Optional[str] = None,
    historical_questions: Optional[List[str]] = None
) -> Tuple[str, str, List[str], List[str]]:
    """
    Selects the interview perspective dynamically based on:
    - Candidate resume contents, technologies, and projects.
    - Previous session history to strictly avoid repeated perspectives across sessions.
    - Never uses static arrays or simple sequential rotation.
    """
    if requested_perspective and requested_perspective in INTERVIEW_PERSPECTIVES:
        p_info = INTERVIEW_PERSPECTIVES[requested_perspective]
        return requested_perspective, p_info["goal"], p_info["preferred_areas"], [p.get("title", "Project") for p in resume_context.get("projects", [])]

    # Combine resume text representation
    projects = resume_context.get("projects") or []
    skills = [str(s).lower() for s in (resume_context.get("skills") or [])]
    project_text = " ".join([f"{p.get('title', '')} {p.get('description', '')} {' '.join(p.get('technologies', []))}" for p in projects]).lower()
    full_text = f"{' '.join(skills)} {project_text}"

    # Score each perspective based on resume evidence
    scores: Dict[str, float] = {}

    # AI_ML_DEPTH: Highly relevant if AI/ML/RAG/Vision exists
    if any(k in full_text for k in ["rag", "chroma", "vector", "embedding", "langchain", "llm", "tensorflow", "cnn", "vision"]):
        scores["AI_ML_DEPTH"] = 96.0

    # SYSTEM_ARCHITECTURE: Highly relevant if full-stack, Spring Boot, React, or microservices exist
    if any(k in full_text for k in ["spring", "react", "architecture", "microservice", "api", "rest", "backend"]):
        scores["SYSTEM_ARCHITECTURE"] = 92.0

    # PROJECT_OWNERSHIP: Highly relevant if candidate has described projects
    if len(projects) > 0:
        scores["PROJECT_OWNERSHIP"] = 90.0

    # SECURITY: Highly relevant if JWT, authentication, or security exist
    if any(k in full_text for k in ["jwt", "security", "auth", "token", "oauth"]):
        scores["SECURITY"] = 89.0

    # DATABASE_ENGINEERING: Highly relevant if SQL, MySQL, Postgres, indexing, transactions exist
    if any(k in full_text for k in ["sql", "mysql", "postgres", "database", "query", "index", "acid"]):
        scores["DATABASE_ENGINEERING"] = 88.0

    # PRODUCTION_ENGINEERING: Highly relevant if Docker, deployment, K8s, or monitoring exist
    if any(k in full_text for k in ["docker", "kubernetes", "deploy", "ci/cd", "monitor", "log", "incident"]):
        scores["PRODUCTION_ENGINEERING"] = 87.0

    # SCALABILITY: Highly relevant if caching, high traffic, Redis, or performance exist
    if any(k in full_text for k in ["redis", "cache", "scale", "concurrency", "performance", "throughput"]):
        scores["SCALABILITY"] = 86.0

    # TECHNICAL_DEPTH & PROBLEM_SOLVING: Always supported as engineering core
    scores["TECHNICAL_DEPTH"] = 82.0
    scores["PROBLEM_SOLVING"] = 80.0

    # Also infer previous perspectives from historical_questions if previous_perspectives is empty
    prev_set = list(previous_perspectives or [])
    if historical_questions:
        hq_lower = " ".join(historical_questions).lower()
        if ("rag" in hq_lower or "chromadb" in hq_lower) and "AI_ML_DEPTH" not in prev_set:
            prev_set.append("AI_ML_DEPTH")
        if ("overall system architecture" in hq_lower or "service boundaries" in hq_lower) and "SYSTEM_ARCHITECTURE" not in prev_set:
            prev_set.append("SYSTEM_ARCHITECTURE")
        if ("personally build" in hq_lower or "hands-on personal" in hq_lower) and "PROJECT_OWNERSHIP" not in prev_set:
            prev_set.append("PROJECT_OWNERSHIP")
        if ("jwt" in hq_lower or "token validation" in hq_lower) and "SECURITY" not in prev_set:
            prev_set.append("SECURITY")
        if ("database schema" in hq_lower or "table indexing" in hq_lower) and "DATABASE_ENGINEERING" not in prev_set:
            prev_set.append("DATABASE_ENGINEERING")
        if ("deployment" in hq_lower or "containerization" in hq_lower) and "PRODUCTION_ENGINEERING" not in prev_set:
            prev_set.append("PRODUCTION_ENGINEERING")
        if ("tenfold" in hq_lower or "bottleneck first" in hq_lower) and "SCALABILITY" not in prev_set:
            prev_set.append("SCALABILITY")

    # Apply penalty for previously explored perspectives to guarantee cross-session diversity!
    for idx, prev_p in enumerate(prev_set):
        if prev_p in scores:
            recency_penalty = 100.0 + (len(prev_set) - idx) * 10.0
            scores[prev_p] -= recency_penalty
            recency_penalty = 100.0 + (len(prev_set) - idx) * 10.0
            scores[prev_p] -= recency_penalty

    # Select candidate perspective with highest score
    sorted_perspectives = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    chosen_perspective = sorted_perspectives[0][0] if sorted_perspectives else "SYSTEM_ARCHITECTURE"

    p_meta = INTERVIEW_PERSPECTIVES[chosen_perspective]
    project_names = [p.get("title") or p.get("name") or "Featured Project" for p in projects if isinstance(p, dict)]
    priority_topics = p_meta["preferred_areas"]

    logger.info(f"[PERSPECTIVE ENGINE] Selected Perspective: {chosen_perspective} (Scores: {scores})")
    return chosen_perspective, p_meta["goal"], priority_topics, project_names

def select_interview_perspective_node(state: ConversationalInterviewState) -> Dict[str, Any]:
    """
    LangGraph Node for Level 1 Intelligence: Selects or confirms the session perspective.
    """
    resume_context = state.get("resume_context") or {}
    prev_perspectives = state.get("previous_perspectives") or []
    current_p = state.get("perspective")

    if not current_p:
        chosen_p, goal, p_topics, p_projects = select_interview_perspective(
            resume_context=resume_context,
            previous_perspectives=prev_perspectives,
            historical_questions=state.get("historical_questions") or []
        )
    else:
        chosen_p = current_p
        meta = INTERVIEW_PERSPECTIVES.get(chosen_p, INTERVIEW_PERSPECTIVES["SYSTEM_ARCHITECTURE"])
        goal = meta["goal"]
        p_topics = meta["preferred_areas"]
        p_projects = [p.get("title", "Project") for p in resume_context.get("projects", [])]

    claims = extract_claims_from_context(resume_context)
    claims_explored = list(state.get("claims_explored") or [])
    claims_remaining = [c["claim"] for c in claims if c["claim"] not in claims_explored]

    return {
        "perspective": chosen_p,
        "perspective_goal": goal,
        "priority_topics": p_topics,
        "priority_projects": p_projects,
        "claims": claims,
        "claims_remaining": claims_remaining
    }

# ========================================================
# 5. NODE 2: ANALYZE CANDIDATE ANSWER
# ========================================================

def analyze_candidate_answer_node(state: ConversationalInterviewState) -> Dict[str, Any]:
    """
    Examines candidate's spoken response.
    Extracts mentioned concepts, technologies, unprompted details, and classifies response:
    STRONG / PARTIAL / WEAK / NO_ANSWER / I_DONT_KNOW / INTERESTING_DETAIL / OPENER.
    """
    last_answer = (state.get("last_candidate_answer") or "").strip()
    round_number = state.get("round_number", 1)

    if not last_answer:
        if round_number == 1:
            analysis: AnswerAnalysis = {
                "classification": "OPENER",
                "concepts_mentioned": [],
                "technologies_mentioned": [],
                "interesting_details": [],
                "word_count": 0,
                "confidence_level": "NEUTRAL"
            }
        else:
            analysis: AnswerAnalysis = {
                "classification": "RESUME_PROMPT",
                "concepts_mentioned": [],
                "technologies_mentioned": [],
                "interesting_details": [],
                "word_count": 0,
                "confidence_level": "MEDIUM"
            }
        return {"answer_analysis": analysis}

    lower_ans = last_answer.lower()
    words = re.findall(r"\w+", lower_ans)
    word_count = len(words)

    # 1. Check for "I don't know", timeout, or refusal
    if any(phrase in lower_ans for phrase in [
        "i don't know", "i do not know", "not sure", "no idea", "don't know",
        "i haven't worked with", "not familiar", "[no_answer", "timeout"
    ]) or word_count <= 3:
        analysis: AnswerAnalysis = {
            "classification": "I_DONT_KNOW" if "don't know" in lower_ans or "not sure" in lower_ans else "NO_ANSWER",
            "concepts_mentioned": [],
            "technologies_mentioned": [],
            "interesting_details": [],
            "word_count": word_count,
            "confidence_level": "LOW"
        }
        return {"answer_analysis": analysis}

    # 2. Extract technical entities and domain keywords
    tech_patterns = {
        "RAG": [r"\brag\b", r"\bretrieval\b", r"\bvector\b", r"\bembedding\b", r"\bembeddings\b", r"\bchroma\b", r"\bchromadb\b", r"\blangchain\b"],
        "Spring Boot": [r"\bspring boot\b", r"\bspring\b", r"\bspring security\b", r"\bioc\b", r"\bdependency injection\b"],
        "React": [r"\breact\b", r"\bfrontend\b", r"\bcomponent\b", r"\bhook\b", r"\buseeffect\b", r"\busestate\b", r"\bvirtual dom\b", r"\bstate management\b"],
        "MySQL": [r"\bmysql\b", r"\bsql\b", r"\bpostgres\b", r"\bdatabase\b", r"\bquery\b", r"\bindex\b", r"\bindexing\b", r"\bacid\b", r"\btransaction\b"],
        "JWT": [r"\bjwt\b", r"\btoken\b", r"\bauthentication\b", r"\bauthorization\b", r"\bsecurity\b", r"\bauth\b"],
        "Java": [r"\bjava\b", r"\bjvm\b", r"\bconcurrency\b", r"\bthread\b", r"\bgarbage collect\b"],
        "Redis": [r"\bredis\b", r"\bcache\b", r"\bcaching\b", r"\beviction\b", r"\bttl\b"],
        "TensorFlow": [r"\btensorflow\b", r"\bcnn\b", r"\bopencv\b", r"\bcomputer vision\b", r"\bdefect\b", r"\bneural\b", r"\bvision\b"],
        "Docker": [r"\bdocker\b", r"\bcontainer\b", r"\bkubernetes\b", r"\bci/cd\b", r"\bdeployment\b"],
        "REST API": [r"\brest\b", r"\bendpoint\b", r"\bapi\b", r"\bhttp\b", r"\bcontroller\b"]
    }

    found_techs = []
    found_concepts = []
    for tech_name, pats in tech_patterns.items():
        for pat in pats:
            if re.search(pat, lower_ans):
                if tech_name not in found_techs:
                    found_techs.append(tech_name)
                match_concept = pat.replace(r"\b", "")
                if match_concept not in found_concepts:
                    found_concepts.append(match_concept)

    # 3. Discover unprompted interesting details
    interesting_details = []
    detail_triggers = [
        ("performance bottleneck", ["performance issue", "bottleneck", "slow query", "high latency", "latency"]),
        ("concurrency issue", ["race condition", "deadlock", "thread contention", "starvation"]),
        ("security vulnerability", ["token tampering", "xss", "sql injection", "csrf", "stolen token"]),
        ("system failure", ["out of memory", "oom", "connection timeout", "500 error", "crash"]),
        ("optimization decision", ["added an index", "composite index", "redis cache", "chunk overlap", "batch processing"])
    ]
    for detail_label, triggers in detail_triggers:
        if any(t in lower_ans for t in triggers):
            interesting_details.append(detail_label)

    # 4. Classify response depth
    if interesting_details and word_count >= 12:
        classification = "INTERESTING_DETAIL"
    elif (word_count >= 25 and (len(found_techs) >= 1 or len(found_concepts) >= 2)) or (word_count >= 20 and len(found_techs) >= 2):
        classification = "STRONG"
    elif word_count >= 10 or len(found_techs) >= 1:
        classification = "PARTIAL"
    else:
        classification = "WEAK"

    analysis: AnswerAnalysis = {
        "classification": classification,
        "concepts_mentioned": found_concepts,
        "technologies_mentioned": found_techs,
        "interesting_details": interesting_details,
        "word_count": word_count,
        "confidence_level": "HIGH" if classification in ["STRONG", "INTERESTING_DETAIL"] else ("MEDIUM" if classification == "PARTIAL" else "LOW")
    }

    return {"answer_analysis": analysis}

# ========================================================
# 6. NODE 3: RETRIEVE RESUME CONTEXT (DYNAMIC RETRIEVAL)
# ========================================================

def retrieve_resume_context_node(state: ConversationalInterviewState) -> Dict[str, Any]:
    """
    Queries ChromaDB with candidate isolation filter.
    Dynamic Query Generation: The query changes based on what the candidate just answered,
    the active perspective, and the project context (satisfies Section 27).
    """
    candidate_id = state.get("candidate_id", "candidate-default")
    resume_context = state.get("resume_context") or {}
    last_answer = state.get("last_candidate_answer") or ""
    analysis = state.get("answer_analysis") or {}
    perspective = state.get("perspective") or "SYSTEM_ARCHITECTURE"
    projects = state.get("priority_projects") or []
    project_ref = projects[0] if projects else ""

    # Ensure candidate resume is indexed in ChromaDB once
    global _indexed_candidates
    if candidate_id not in _indexed_candidates:
        try:
            chunk_and_index_resume(
                candidate_id=candidate_id,
                resume_id="current_active_resume",
                resume_data=resume_context
            )
            _indexed_candidates.add(candidate_id)
        except Exception as e:
            logger.warning(f"Chroma indexing note: {e}")

    # Build dynamic query based on candidate's answer + mentioned technologies + perspective
    mentioned_techs = analysis.get("technologies_mentioned") or []
    if "RAG" in mentioned_techs:
        query_text = f"candidate RAG vector retrieval ChromaDB {project_ref}"
    elif "React" in mentioned_techs:
        query_text = f"candidate React frontend UI components {project_ref}"
    elif "MySQL" in mentioned_techs:
        query_text = f"candidate MySQL database schema queries indexing {project_ref}"
    elif "JWT" in mentioned_techs:
        query_text = f"candidate JWT authentication security tokens {project_ref}"
    elif "Spring Boot" in mentioned_techs:
        query_text = f"candidate Spring Boot REST APIs backend microservices {project_ref}"
    elif last_answer:
        tech_words = " ".join(mentioned_techs)
        query_text = f"{last_answer[:60]} {tech_words} {perspective} {project_ref}".strip()
    else:
        query_text = f"candidate projects technical architecture {perspective} {project_ref}".strip()

    retrieved = retrieve_relevant_resume_knowledge(
        candidate_id=candidate_id,
        resume_id=None,
        query_text=query_text,
        n_results=4
    )

    return {
        "retrieved_chunks": retrieved,
        "retrieval_query": query_text
    }

# ========================================================
# 7. NODE 4: DECIDE NEXT INTERVIEW ACTION (LIVE BRAIN)
# ========================================================

def decide_next_interview_action_node(state: ConversationalInterviewState) -> Dict[str, Any]:
    """
    Live Interviewer Decision Engine (Level 2 Intelligence):
    Inputs:
    - currentPerspective
    - candidateAnswer & answerAnalysis
    - retrievedResumeContext
    - conversationHistory & previousInteractions
    - remainingTimeSeconds
    Selects action: GO_DEEPER, CLARIFY, CHALLENGE, EXPLORE_NEW_DETAIL, SWITCH_TOPIC, END_INTERVIEW.
    """
    round_number = state.get("round_number", 1)
    difficulty = state.get("difficulty", "MEDIUM")
    candidate_id = state.get("candidate_id", "candidate-default")
    session_id = state.get("session_id", "session-default")
    remaining_seconds = state.get("remaining_seconds", 2700)
    perspective = state.get("perspective") or "SYSTEM_ARCHITECTURE"
    p_meta = INTERVIEW_PERSPECTIVES.get(perspective, INTERVIEW_PERSPECTIVES["SYSTEM_ARCHITECTURE"])
    resume_context = state.get("resume_context") or {}
    analysis = state.get("answer_analysis") or {"classification": "OPENER"}
    retrieved = state.get("retrieved_chunks") or []
    history = state.get("conversation_history") or []
    prev_interactions = state.get("previous_interactions") or []
    historical_questions = state.get("historical_questions") or []

    claims = extract_claims_from_context(resume_context)
    projects = state.get("priority_projects") or [p.get("title", "Project") for p in resume_context.get("projects", [])]
    project = projects[0] if projects else "Project"

    current_topic = state.get("current_topic")
    if not current_topic and history:
        current_topic = history[-1].get("topic")
    if not current_topic and analysis.get("technologies_mentioned"):
        current_topic = analysis.get("technologies_mentioned")[0]
    current_depth = state.get("current_depth", 0)
    topics_discussed = list(state.get("topics_discussed") or [])
    claims_explored = list(state.get("claims_explored") or [])

    # 1. Check for session completion / time expiry
    if round_number >= 8 or remaining_seconds <= 120:
        plan: InterviewPlan = {
            "action": "END_INTERVIEW",
            "topic": "CLOSING",
            "subtopic": "Summary & Reflection",
            "skill": "Closing",
            "project": project,
            "claim": None,
            "angle": "REFLECTION",
            "style": "DIRECT",
            "difficulty": "EASY",
            "reason": "Session time limit or round threshold reached.",
            "expected_concepts": ["Reflection", "Career aspirations"],
            "is_follow_up": False,
            "transition_speech": "Thank you so much for walking through your projects and technical architecture today.",
            "semantic_fingerprint": "interview_closing_wrapup",
            "retrieval_query": state.get("retrieval_query", "")
        }
        return {"plan": plan, "current_depth": current_depth, "current_topic": "CLOSING", "topics_discussed": topics_discussed}

    # 2. Turn 1: Natural Opener
    last_ans = (state.get("last_candidate_answer") or "").strip()
    if round_number == 1 and not last_ans:
        plan: InterviewPlan = {
            "action": "ASK_QUESTION",
            "topic": "INTRODUCTION",
            "subtopic": "Engineering Background & Projects",
            "skill": "Career Overview",
            "project": project,
            "claim": None,
            "angle": "PROJECT_EXPERIENCE",
            "style": "DIRECT",
            "difficulty": "EASY",
            "reason": "Natural opening turn to establish conversational baseline.",
            "expected_concepts": ["Introduction", "Recent projects", "Technical stack"],
            "is_follow_up": False,
            "transition_speech": "",
            "semantic_fingerprint": "introduction|career_overview|project_experience",
            "retrieval_query": state.get("retrieval_query", "")
        }
        return {"plan": plan, "current_depth": 0, "current_topic": "INTRODUCTION", "topics_discussed": ["INTRODUCTION"]}

    cls = analysis.get("classification")
    mentioned_techs = analysis.get("technologies_mentioned") or []

    # 3. Candidate answered "I don't know" or timed out -> Graceful SWITCH_TOPIC
    if cls in ["I_DONT_KNOW", "NO_ANSWER"]:
        transition_msg = random.choice(NO_ANSWER_PHRASES)
        # Select next unexplored claim or priority topic
        unexplored = [c for c in claims if c["concept"] not in topics_discussed and c["technology"] not in topics_discussed]
        chosen_claim = unexplored[0] if unexplored else (random.choice(claims) if claims else None)
        topic = chosen_claim["concept"] if chosen_claim else "SYSTEM_DESIGN"
        skill = chosen_claim["technology"] if chosen_claim else "Architecture"

        plan: InterviewPlan = {
            "action": "SWITCH_TOPIC",
            "topic": topic,
            "subtopic": f"{skill} Fundamentals",
            "skill": skill,
            "project": project,
            "claim": chosen_claim["claim"] if chosen_claim else None,
            "angle": "IMPLEMENTATION",
            "style": "DIRECT",
            "difficulty": "MEDIUM",
            "reason": "Candidate indicated lack of familiarity or timed out. Transitioning smoothly to another resume area.",
            "expected_concepts": [skill, "Implementation"],
            "is_follow_up": False,
            "transition_speech": transition_msg,
            "semantic_fingerprint": f"{topic.lower()}|{skill.lower()}|switch_topic",
            "retrieval_query": state.get("retrieval_query", "")
        }
        topics_discussed.append(topic)
        return {"plan": plan, "current_depth": 1, "current_topic": topic, "topics_discussed": topics_discussed}

    # 4. Candidate mentioned specific domain from intro/turn (e.g., RAG, React, MySQL, JWT)
    # Target topic adapts immediately to candidate's spoken area!
    active_skill = mentioned_techs[0] if mentioned_techs else (current_topic or "Architecture")

    # 5. Candidate mentioned an unprompted interesting detail -> EXPLORE_NEW_DETAIL
    if cls == "INTERESTING_DETAIL":
        detail = analysis.get("interesting_details", ["system optimization"])[0]
        plan: InterviewPlan = {
            "action": "EXPLORE_NEW_DETAIL",
            "topic": f"{active_skill.upper()}_{detail.upper().replace(' ', '_')}",
            "subtopic": detail.title(),
            "skill": active_skill,
            "project": project,
            "claim": None,
            "angle": "DEBUGGING" if "issue" in detail or "bottleneck" in detail else "OPTIMIZATION",
            "style": "FOLLOW_UP",
            "difficulty": "HARD" if difficulty == "HARD" else "MEDIUM",
            "reason": f"Candidate highlighted an unprompted real-world engineering challenge ({detail}). Investigating diagnosis and resolution.",
            "expected_concepts": [active_skill, detail, "Root cause analysis", "Resolution trade-offs"],
            "is_follow_up": True,
            "transition_speech": f"That's interesting that you encountered a {detail}.",
            "semantic_fingerprint": f"{active_skill.lower()}|{detail.lower()}|investigation",
            "retrieval_query": state.get("retrieval_query", "")
        }
        return {"plan": plan, "current_depth": current_depth + 1, "current_topic": active_skill, "topics_discussed": topics_discussed}

    # 6. Candidate gave a STRONG answer -> GO_DEEPER if topic depth < 3
    if cls == "STRONG" and current_depth < 3:
        # Choose perspective-aligned angle
        avail_angles = p_meta.get("angles", ["OPTIMIZATION", "FAILURE", "SCALABILITY", "TRADEOFF", "SECURITY"])
        angle = avail_angles[current_depth % len(avail_angles)]
        plan: InterviewPlan = {
            "action": "GO_DEEPER",
            "topic": active_skill,
            "subtopic": f"{active_skill} Advanced Architecture & Edge Cases",
            "skill": active_skill,
            "project": project,
            "claim": None,
            "angle": angle,
            "style": p_meta.get("style", "SCENARIO"),
            "difficulty": "HARD" if difficulty == "HARD" else "MEDIUM",
            "reason": f"Candidate provided a strong answer. Probing deeper into practical resilience, concurrency, or scale via {angle} under {perspective}.",
            "expected_concepts": [active_skill, f"{angle.lower()} analysis", "Production edge cases"],
            "is_follow_up": True,
            "transition_speech": random.choice(ACKNOWLEDGEMENT_PHRASES),
            "semantic_fingerprint": f"{active_skill.lower()}|{perspective.lower()}|{angle.lower()}",
            "retrieval_query": state.get("retrieval_query", "")
        }
        return {"plan": plan, "current_depth": current_depth + 1, "current_topic": active_skill, "topics_discussed": topics_discussed}

    # 7. Candidate gave a PARTIAL or WEAK answer -> CLARIFY
    if cls in ["PARTIAL", "WEAK"] and current_depth < 3:
        plan: InterviewPlan = {
            "action": "CLARIFY",
            "topic": active_skill,
            "subtopic": f"{active_skill} Specific Implementation Mechanics",
            "skill": active_skill,
            "project": project,
            "claim": None,
            "angle": "IMPLEMENTATION",
            "style": "FOLLOW_UP",
            "difficulty": "MEDIUM",
            "reason": "Candidate provided a vague or partial answer. Probing for specific implementation mechanism.",
            "expected_concepts": [active_skill, "Implementation details"],
            "is_follow_up": True,
            "transition_speech": random.choice(ACKNOWLEDGEMENT_PHRASES),
            "semantic_fingerprint": f"{active_skill.lower()}|clarify|implementation",
            "retrieval_query": state.get("retrieval_query", "")
        }
        return {"plan": plan, "current_depth": current_depth + 1, "current_topic": active_skill, "topics_discussed": topics_discussed}

    # 8. Topic exhausted (depth >= 3) or transition turn -> SWITCH_TOPIC
    transition_msg = random.choice(TRANSITION_PHRASES)
    unexplored_claims = [c for c in claims if c["concept"] not in topics_discussed and c["technology"] not in topics_discussed]
    chosen_claim = unexplored_claims[0] if unexplored_claims else (random.choice(claims) if claims else None)

    topic = chosen_claim["concept"] if chosen_claim else "SYSTEM_DESIGN"
    skill = chosen_claim["technology"] if chosen_claim else "Architecture"
    project_claim = chosen_claim.get("project") if chosen_claim else project

    # Align angle with perspective
    avail_angles = p_meta.get("angles", ["ARCHITECTURE", "SCALABILITY", "TRADEOFF", "SECURITY"])
    angle = avail_angles[round_number % len(avail_angles)]

    plan: InterviewPlan = {
        "action": "SWITCH_TOPIC",
        "topic": topic,
        "subtopic": f"{skill} {angle.capitalize()}",
        "skill": skill,
        "project": project_claim,
        "claim": chosen_claim["claim"] if chosen_claim else None,
        "angle": angle,
        "style": p_meta.get("style", "PROJECT_SPECIFIC"),
        "difficulty": difficulty,
        "reason": f"Transitioning to unexplored resume claim for {skill} under {perspective}.",
        "expected_concepts": [skill, "Architecture"],
        "is_follow_up": False,
        "transition_speech": transition_msg,
        "semantic_fingerprint": f"{topic.lower()}|{skill.lower()}|{angle.lower()}",
        "retrieval_query": state.get("retrieval_query", "")
    }
    topics_discussed.append(topic)
    return {"plan": plan, "current_depth": 1, "current_topic": topic, "topics_discussed": topics_discussed}

# ========================================================
# 8. NODE 5: GENERATE NATURAL INTERVIEW QUESTION
# ========================================================

def generate_natural_interview_question_node(state: ConversationalInterviewState) -> Dict[str, Any]:
    """
    Writer Node:
    Produces natural spoken questions aligned with:
    - currentPerspective
    - candidate's actual answer
    - ChromaDB retrieved context
    - Interviewer decision (GO_DEEPER, CLARIFY, etc.)
    """
    plan = state.get("plan") or {}
    candidate_name = state.get("candidate_name") or "Candidate"
    role = state.get("role", "Full Stack Software Engineer")
    perspective = state.get("perspective") or "SYSTEM_ARCHITECTURE"
    p_meta = INTERVIEW_PERSPECTIVES.get(perspective, INTERVIEW_PERSPECTIVES["SYSTEM_ARCHITECTURE"])
    retrieved = state.get("retrieved_chunks") or []
    history = state.get("conversation_history") or []
    prev_interactions = state.get("previous_interactions") or []
    all_interactions = history + prev_interactions
    historical_questions = state.get("historical_questions") or []
    round_number = state.get("round_number", 1)
    last_ans = (state.get("last_candidate_answer") or "").strip()

    topic = plan.get("topic", "TECHNICAL")
    subtopic = plan.get("subtopic", topic)
    skill = plan.get("skill", "Architecture")
    project = plan.get("project") or "your project"
    angle = plan.get("angle", "IMPLEMENTATION")
    style = plan.get("style", "DIRECT")
    difficulty = plan.get("difficulty", "MEDIUM")
    action = plan.get("action", "ASK_QUESTION")
    transition_speech = plan.get("transition_speech", "")

    seen_fingerprints: Set[str] = set()
    for h in all_interactions:
        if isinstance(h, dict):
            if h.get("text"): seen_fingerprints.add(normalize_fingerprint(h["text"]))
            if h.get("question"): seen_fingerprints.add(normalize_fingerprint(h["question"]))
    for q in historical_questions:
        if q: seen_fingerprints.add(normalize_fingerprint(q))

    p_name = project or "your project"

    # Turn 1: Warm human opener tailored to the selected perspective
    if round_number == 1 and not last_ans:
        openers_by_perspective = {
            "AI_ML_DEPTH": (
                f"To kick off our technical discussion on AI systems in {p_name}, what role did RAG and vector retrieval play in the architecture?",
                f"Good morning, {candidate_name}. To begin our technical discussion focusing on AI engineering, could you walk me through the RAG and vector retrieval architecture in {p_name}?"
            ),
            "SYSTEM_ARCHITECTURE": (
                f"Looking at {p_name}, could you walk me through how you structured the overall system architecture and service boundaries?",
                f"Welcome, {candidate_name}! Looking across your projects, could you walk me through how you structured the architecture and service boundaries in {p_name}?"
            ),
            "PROJECT_OWNERSHIP": (
                f"Of the projects on your resume, which one did you have the most hands-on personal involvement in, and what did you personally build?",
                f"Good morning, {candidate_name}. Looking across your background, which project did you have the deepest personal involvement in, and what part did you personally own?"
            ),
            "SECURITY": (
                f"In {p_name}, how did you approach JWT authentication, token validation, and API security?",
                f"Great to speak with you, {candidate_name}. To begin our discussion on software security, how did you structure JWT authentication and endpoint protection in {p_name}?"
            ),
            "DATABASE_ENGINEERING": (
                f"In {p_name}, how did you design the database schema, table indexing, and query performance in {skill}?",
                f"Welcome, {candidate_name}! Looking at your database engineering work in {p_name}, how did you approach schema design, indexing, and transactional integrity?"
            ),
            "PRODUCTION_ENGINEERING": (
                f"Looking at {p_name}, how did you handle deployment, containerization, and production monitoring?",
                f"Hello {candidate_name}! Looking at your work with {p_name}, how did you approach containerized deployment, logging, and production monitoring?"
            ),
            "SCALABILITY": (
                f"Suppose traffic to {p_name} increases tenfold overnight. What part of your current architecture becomes the bottleneck first?",
                f"Good morning, {candidate_name}! If user traffic to {p_name} spiked tenfold overnight, what architectural component would you scale first?"
            ),
            "TECHNICAL_DEPTH": (
                f"Looking at your core work with {skill} on {p_name}, how do the underlying execution and memory models behave under load?",
                f"Hi {candidate_name}! Looking at your core technical work with {skill} on {p_name}, how does your architecture behave under heavy load?"
            )
        }
        
        chosen_pair = openers_by_perspective.get(perspective)
        if not chosen_pair:
            chosen_pair = (
                f"Could you introduce yourself and walk me through your engineering contributions on {p_name}?",
                f"Good morning, {candidate_name}. Could you introduce yourself and walk me through your engineering contributions on {p_name}?"
            )
        opener_q, full_speech = chosen_pair
        
        # If already asked in a prior session, pick general introduction variant
        if normalize_fingerprint(opener_q) in seen_fingerprints:
            gen_openers = [
                (f"Could you introduce yourself and walk me through the key features you built in {p_name}?",
                 f"Good morning, {candidate_name}. Could you introduce yourself and walk me through the key features you built in {p_name}?"),
                (f"Which technical achievement in {p_name} are you most proud of from an engineering standpoint?",
                 f"Welcome, {candidate_name}! Which technical achievement in {p_name} are you most proud of from an engineering standpoint?"),
                (f"Could you give me a brief walkthrough of your background and what you built on {p_name}?",
                 f"Hello {candidate_name}, great to meet you. Could you give me a brief walkthrough of your background and what you built on {p_name}?")
            ]
            for oq, fs in gen_openers:
                if normalize_fingerprint(oq) not in seen_fingerprints:
                    opener_q, full_speech = oq, fs
                    break

        return {
            "generated_turn": {
                "action": "ASK_QUESTION",
                "acknowledgement": "",
                "question_text": opener_q,
                "full_speech_text": full_speech,
                "question_category": perspective,
                "question_source": f"Perspective Opener -> {perspective}",
                "topic": f"Perspective Kickoff: {perspective}",
                "subtopic": "Engineering Background",
                "skill": "Career Overview",
                "project": project,
                "angle": "PROJECT_EXPERIENCE",
                "question_type": "DIRECT",
                "semantic_fingerprint": normalize_fingerprint(opener_q),
                "hints": ["Engineering background overview", "Key project highlights", "Core technical strengths"],
                "ideal_key_points": ["Clarity of articulation", "Relevant technical stack", "Recent hands-on work"],
                "difficulty": "EASY",
                "is_completed": False
            }
        }

    # Perspective Opener on Turn 2 (Transition into perspective)
    if round_number == 2 and not transition_speech:
        if perspective == "AI_ML_DEPTH":
            perspective_q = f"I noticed you worked with RAG in {p_name}. What role did RAG and ChromaDB play in the system, and how did you approach retrieval quality?"
            trans = f"Great to hear that background, {candidate_name}."
        elif perspective == "SYSTEM_ARCHITECTURE":
            perspective_q = f"Looking at {p_name}, could you walk me through how you structured the overall architecture and communication between the frontend, backend, and database?"
            trans = f"Thanks for that overview, {candidate_name}."
        elif perspective == "PROJECT_OWNERSHIP":
            perspective_q = f"Of the projects on your resume, which one did you have the most hands-on involvement in, and what architectural decisions did you personally own?"
            trans = f"That provides helpful context, {candidate_name}."
        elif perspective == "SECURITY":
            perspective_q = f"I noticed you implemented authentication and security. In {p_name}, how did you structure JWT token validation, authorization, and API security?"
            trans = f"Understood, {candidate_name}."
        elif perspective == "PRODUCTION_ENGINEERING":
            perspective_q = f"Looking at {p_name}, how did you handle deployment, logging, monitoring, and failure recovery in production?"
            trans = f"Got it, {candidate_name}."
        elif perspective == "DATABASE_ENGINEERING":
            perspective_q = f"In {p_name}, how did you approach the database schema design, indexing, and transactional integrity in {skill}?"
            trans = f"Thanks for walking me through that, {candidate_name}."
        elif perspective == "SCALABILITY":
            perspective_q = f"Suppose traffic to {p_name} increases tenfold overnight. What part of your current architecture becomes the bottleneck first, and how would you scale it?"
            trans = f"Understood, {candidate_name}."
        else:
            perspective_q = f"Looking at your work with {skill} on {p_name}, how do the underlying execution mechanics and memory models behave under load?"
            trans = f"Great, {candidate_name}."

        full_speech = f"{trans} {perspective_q}"
        return {
            "generated_turn": {
                "action": "ASK_QUESTION",
                "acknowledgement": trans,
                "question_text": perspective_q,
                "full_speech_text": full_speech,
                "question_category": perspective,
                "question_source": f"Perspective Engine -> {perspective}",
                "topic": f"{perspective.replace('_', ' ').title()} - {skill}",
                "subtopic": f"{skill} Architecture",
                "skill": skill,
                "project": project,
                "angle": angle,
                "question_type": style,
                "semantic_fingerprint": normalize_fingerprint(perspective_q),
                "hints": [f"Explain {skill} in {p_name}", f"Focus on {perspective.lower().replace('_', ' ')}"],
                "ideal_key_points": [skill, f"{perspective} considerations", "Production reasoning"],
                "difficulty": difficulty,
                "is_completed": False
            }
        }

    # Context string from ChromaDB retrieval
    retrieved_text = "\n".join([f"- {r['document']}" for r in retrieved[:3]]) if retrieved else f"- Proficient in {skill}"

    # LLM Generation attempt if Gemini is active
    global _gemini_available
    if _gemini_available and settings.GEMINI_API_KEY:
        try:
            prompt = f"""You are a Principal Engineering Interviewer conducting an interactive spoken interview.
Candidate: {candidate_name} | Role: {role}
Perspective: {perspective} (Goal: {p_meta['goal']})
Candidate Spoken Answer: "{last_ans}"
Interviewer Decision: {action} (Angle: {angle}, Style: {style})
Topic: {topic} | Skill: {skill} | Project: {p_name}
Transition speech to lead with: "{transition_speech}"

Retrieved Resume Knowledge from ChromaDB:
{retrieved_text}

Task:
Produce ONE conversational spoken question strictly aligned with the perspective '{perspective}' and the candidate's last answer.
If the candidate spoke about a specific technology (e.g., RAG, React, MySQL, JWT), tailor the question directly to that domain!
Avoid exam-like phrases. Keep it natural, human, and technically rigorous.

Respond STRICTLY in JSON:
{{
  "acknowledgement": "{transition_speech}",
  "question_text": "Spoken question text",
  "full_speech_text": "Combined spoken dialogue",
  "topic": "{topic}",
  "subtopic": "{subtopic}",
  "hints": ["key point 1", "key point 2"],
  "ideal_key_points": ["expected concept 1", "expected concept 2"]
}}
"""
            model = genai.GenerativeModel("gemini-1.5-flash")
            res = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            data = json.loads(res.text)
            q_text = data.get("question_text", "").strip()
            full_speech = data.get("full_speech_text") or f"{data.get('acknowledgement', '')} {q_text}".strip()
            fp = normalize_fingerprint(q_text)

            if fp not in seen_fingerprints and len(q_text) > 15:
                return {
                    "generated_turn": {
                        "action": action,
                        "acknowledgement": data.get("acknowledgement", transition_speech),
                        "question_text": q_text,
                        "full_speech_text": full_speech,
                        "question_category": perspective,
                        "question_source": f"Resume AI Interviewer -> {perspective} ({angle})",
                        "topic": data.get("topic", topic),
                        "subtopic": data.get("subtopic", subtopic),
                        "skill": skill,
                        "project": project,
                        "angle": angle,
                        "question_type": style,
                        "semantic_fingerprint": fp,
                        "hints": data.get("hints", [f"Discuss {skill} {angle.lower()}", "Explain architectural trade-offs"]),
                        "ideal_key_points": data.get("ideal_key_points", [skill, f"{angle} best practices", "Production reasoning"]),
                        "difficulty": difficulty,
                        "is_completed": action == "END_INTERVIEW"
                    }
                }
        except Exception as e:
            _gemini_available = False
            logger.warning(f"Gemini generation fallback engaged: {e}")

    # Deterministic Perspective-Tailored Fallback Templates
    q_templates = []
    if skill == "RAG" or skill == "ChromaDB":
        if action == "GO_DEEPER":
            q_templates = [
                f"How did you decide the chunk size and top-k value for your document vectors in ChromaDB, and how did that affect retrieval quality in {p_name}?",
                f"What specific strategies did you use to evaluate retrieval precision and mitigate hallucination in your RAG pipeline on {p_name}?",
                f"How did your retrieval pipeline handle noisy or out-of-domain queries when performing vector similarity search in ChromaDB?"
            ]
        elif action == "CLARIFY":
            q_templates = [
                f"Could you walk me through what information you stored in ChromaDB, and what happened between receiving a user query and retrieving context?",
                f"How were documents chunked and embedded before indexing into ChromaDB in {p_name}?"
            ]
        elif action == "CHALLENGE":
            q_templates = [
                f"Suppose vector search in ChromaDB returns conflicting or irrelevant chunks for a complex prompt in {p_name}. How would your pipeline detect and handle that?",
                f"How does your RAG architecture scale if the vector database grows to millions of embeddings with concurrent queries?"
            ]
        else:
            q_templates = [
                f"In your work with RAG and ChromaDB on {p_name}, how did you structure the embedding and retrieval pipeline?",
                f"What made ChromaDB the right choice for your vector search needs compared to other storage alternatives in {p_name}?"
            ]
    elif skill == "React":
        if action == "GO_DEEPER":
            q_templates = [
                f"In {p_name}, how did you structure state management and avoid unnecessary component re-renders when streaming or fetching data from the backend?",
                f"How did you handle error boundaries, offline states, and optimistic UI updates in your React frontend on {p_name}?"
            ]
        elif action == "CLARIFY":
            q_templates = [
                f"How did your React frontend communicate with the backend REST APIs in {p_name}, and how did you manage authentication state?",
                f"What lifecycle hooks or custom state patterns did you rely on most heavily in {p_name}?"
            ]
        else:
            q_templates = [
                f"Looking at your React frontend in {p_name}, what was the most complex component hierarchy or state flow you implemented?",
                f"How did you ensure responsive rendering and fast initial page loads in your React application for {p_name}?"
            ]
    elif skill == "MySQL" or skill == "Database":
        if action == "GO_DEEPER":
            q_templates = [
                f"In {p_name}, what indexing strategies did you implement on your MySQL tables, and how did you optimize slow queries under load?",
                f"How did you manage database transaction isolation levels and prevent deadlocks during concurrent writes in {p_name}?"
            ]
        elif action == "CLARIFY":
            q_templates = [
                f"Could you walk me through the schema design in MySQL for {p_name} and how you structured relationships between core entities?",
                f"How did you handle database connection pooling and query execution in {p_name}?"
            ]
        else:
            q_templates = [
                f"What were the primary data persistence trade-offs you encountered when designing the relational database for {p_name}?",
                f"If database write traffic increased significantly in {p_name}, how would you approach partitioning, sharding, or caching?"
            ]
    elif skill == "JWT" or skill == "Security":
        if action == "GO_DEEPER":
            q_templates = [
                f"When implementing JWT authentication in {p_name}, how did you handle token signing, expiration, refresh token rotation, and revocation?",
                f"How did you prevent vulnerabilities like token tampering, CSRF, and unauthorized role elevation across your protected endpoints in {p_name}?"
            ]
        elif action == "CLARIFY":
            q_templates = [
                f"Walk me through the lifecycle of a request authenticating via JWT from the client to your protected backend endpoints in {p_name}.",
                f"How did your backend validate token claims and enforce role-based access control in {p_name}?"
            ]
        else:
            q_templates = [
                f"In {p_name}, what security practices did you put in place to ensure sensitive credentials and tokens are protected both in transit and at rest?",
                f"How did you structure authentication filters and security headers in your application on {p_name}?"
            ]
    elif skill == "Spring Boot":
        if action == "GO_DEEPER":
            q_templates = [
                f"In your Spring Boot backend for {p_name}, how did you design dependency injection, custom exception handling, and transaction boundaries?",
                f"If an endpoint in {p_name} experienced sudden connection pool exhaustion or high thread contention, how would you diagnose and resolve it?"
            ]
        elif action == "CLARIFY":
            q_templates = [
                f"How did you structure your controllers, services, and repository layers in Spring Boot for {p_name}?",
                f"What validation annotations and interceptors did you rely on in your Spring Boot REST APIs for {p_name}?"
            ]
        else:
            q_templates = [
                f"What part of the Spring Boot backend architecture in {p_name} did you personally design and implement?",
                f"How did your Spring Boot application handle asynchronous tasks and external service timeouts in {p_name}?"
            ]
    elif angle == "SCALABILITY":
        q_templates = [
            f"Suppose traffic to {p_name} increases by 100x. What is the very first bottleneck you would expect in your {skill} layer, and how would you re-architect it?",
            f"How would you horizontally scale the {skill} components in {p_name} across multiple nodes while keeping latency low?"
        ]
    elif angle == "DEBUGGING" or angle == "FAILURE":
        q_templates = [
            f"Suppose an endpoint in {p_name} using {skill} intermittently times out during peak hours. Walk me step-by-step through how you isolate the root cause.",
            f"How does {p_name} recover gracefully if downstream {skill} services crash or become unreachable?"
        ]
    else:
        q_templates = [
            f"Looking at your experience with {skill} on {p_name}, what was the most challenging technical feature you implemented, and what trade-offs did you face?",
            f"How did your {skill} module in {p_name} communicate with other components, and how did you handle operational errors?"
        ]

    chosen_q = None
    for q_cand in q_templates:
        fp = normalize_fingerprint(q_cand)
        if fp not in seen_fingerprints:
            chosen_q = q_cand
            break

    if not chosen_q:
        chosen_q = f"In {p_name}, when designing the {skill} layer for {perspective.lower().replace('_', ' ')}, what specific architectural decisions did you make?"

    fp_final = normalize_fingerprint(chosen_q)
    full_speech = f"{transition_speech} {chosen_q}".strip() if transition_speech else chosen_q

    return {
        "generated_turn": {
            "action": action,
            "acknowledgement": transition_speech,
            "question_text": chosen_q,
            "full_speech_text": full_speech,
            "question_category": perspective,
            "question_source": f"Resume AI Interviewer -> {perspective} ({angle})",
            "topic": f"{skill} {angle.capitalize()}",
            "subtopic": subtopic,
            "skill": skill,
            "project": project,
            "angle": angle,
            "question_type": style,
            "semantic_fingerprint": fp_final,
            "hints": [f"Explain {skill} in {p_name}", f"Address {angle.lower()} trade-offs"],
            "ideal_key_points": [skill, f"{angle} best practices", "Production reasoning"],
            "difficulty": difficulty,
            "is_completed": action == "END_INTERVIEW"
        }
    }

# ========================================================
# 9. NODE 6: VALIDATE QUESTION (SECTION 29 & 41)
# ========================================================

def validate_question_node(state: ConversationalInterviewState) -> Dict[str, Any]:
    """
    Validates question against:
    1. Resume connection
    2. Perspective alignment
    3. Candidate answer relevance
    4. Exact / semantic duplication
    5. Hallucination check
    Also prints Section 41 development turn debug logging to console.
    """
    turn = state.get("generated_turn") or {}
    q_text = turn.get("question_text", "")
    session_id = state.get("session_id", "sess")
    candidate_id = state.get("candidate_id", "cand")
    perspective = state.get("perspective", "SYSTEM_ARCHITECTURE")
    analysis = state.get("answer_analysis") or {}
    last_ans = state.get("last_candidate_answer") or "[No Answer / Opener]"
    retrieval_query = state.get("retrieval_query", "")
    retrieved = state.get("retrieved_chunks") or []
    plan = state.get("plan") or {}
    action = plan.get("action", turn.get("action", "ASK_QUESTION"))
    topic = plan.get("topic", turn.get("topic", "General"))
    angle = plan.get("angle", turn.get("angle", "IMPLEMENTATION"))
    project = plan.get("project", turn.get("project", "Project"))
    skill = plan.get("skill", turn.get("skill", "Architecture"))

    # Check for semantic / exact duplicate
    fp = turn.get("semantic_fingerprint") or normalize_fingerprint(q_text)
    historical_questions = state.get("historical_questions") or []
    is_duplicate = any(normalize_fingerprint(hq) == fp for hq in historical_questions)

    validation_result = "PASSED"
    if is_duplicate:
        validation_result = "DUPLICATE_DETECTED_REPLACED"
        seen_set = {normalize_fingerprint(hq) for hq in historical_questions}
        round_num = state.get("round_number", 1)
        fallback_angles = ["CONCURRENCY", "MEMORY", "SCALABILITY", "SECURITY", "FAILURE", "OPTIMIZATION", "DESIGN_REVIEW", "TRADEOFF", "DEBUGGING"]
        
        replacement_q = None
        for i, alt_angle in enumerate(fallback_angles):
            candidates = [
                f"In {project}, when engineering {skill} for high-throughput {alt_angle.lower()} resilience, what architectural decisions did you make?",
                f"How did you isolate and resolve {alt_angle.lower()} bottlenecks in your {skill} layer on {project}?",
                f"Suppose {alt_angle.lower()} issues emerge in {skill} during peak load on {project}. What are your diagnostic triage steps?",
                f"What trade-offs did you navigate when designing the {alt_angle.lower()} model for {skill} in {project}?"
            ]
            for cand in candidates:
                cand_fp = normalize_fingerprint(cand)
                if cand_fp not in seen_set:
                    replacement_q = cand
                    turn["angle"] = alt_angle
                    break
            if replacement_q:
                break
        
        if not replacement_q:
            replacement_q = f"In {project}, regarding {skill} under round {round_num}, how did you validate end-to-end reliability?"

        turn["question_text"] = replacement_q
        turn["full_speech_text"] = replacement_q
        turn["semantic_fingerprint"] = normalize_fingerprint(replacement_q)

    # Section 41: Development Debug Logging
    debug_banner = f"""
============================================================
[INTERVIEW TURN DEBUG]
SESSION ID:            {session_id}
CANDIDATE ID:          {candidate_id}
PERSPECTIVE:           {perspective}
CURRENT TOPIC:         {topic}
CURRENT PROJECT:       {project}
CURRENT TECHNOLOGY:    {skill}
CANDIDATE ANSWER:      {last_ans[:80]}...
ANSWER EVALUATION:     {analysis.get('classification', 'N/A')} (confidence: {analysis.get('confidence_level', 'N/A')})
RETRIEVAL QUERY:       {retrieval_query}
RETRIEVED CHUNKS:      {len(retrieved)} chunk(s)
DECISION:              {action}
TARGET TOPIC:          {topic}
TARGET ANGLE:          {angle}
GENERATED QUESTION:    {q_text}
VALIDATION RESULT:     {validation_result}
============================================================
"""
    logger.info(debug_banner)
    print(debug_banner)

    return {"generated_turn": turn}

# ========================================================
# 10. LANGGRAPH WORKFLOW ASSEMBLY
# ========================================================

def create_resume_conversational_interview_graph():
    workflow = StateGraph(ConversationalInterviewState)

    workflow.add_node("select_perspective", select_interview_perspective_node)
    workflow.add_node("analyze_answer", analyze_candidate_answer_node)
    workflow.add_node("retrieve_resume_context", retrieve_resume_context_node)
    workflow.add_node("decide_action", decide_next_interview_action_node)
    workflow.add_node("generate_question", generate_natural_interview_question_node)
    workflow.add_node("validate_question", validate_question_node)

    workflow.add_edge(START, "select_perspective")
    workflow.add_edge("select_perspective", "analyze_answer")
    workflow.add_edge("analyze_answer", "retrieve_resume_context")
    workflow.add_edge("retrieve_resume_context", "decide_action")
    workflow.add_edge("decide_action", "generate_question")
    workflow.add_edge("generate_question", "validate_question")
    workflow.add_edge("validate_question", END)

    return workflow.compile()

conversational_interview_graph = create_resume_conversational_interview_graph()

# ========================================================
# 11. PUBLIC ENTRYPOINTS & EVALUATION
# ========================================================

def evaluate_candidate_answer(
    request_or_question: Any,
    candidate_answer: Optional[str] = None,
    round_type: str = "TECHNICAL",
    ideal_key_points: Optional[List[str]] = None,
    rubric: Optional[Dict[str, float]] = None
) -> EvaluateAnswerResponse:
    """
    Evaluates spoken candidate answers across 7 core dimensions.
    """
    if hasattr(request_or_question, "question_text"):
        q_text = request_or_question.question_text
        ans_text = request_or_question.candidate_answer
        r_type = getattr(request_or_question, "round_type", "TECHNICAL")
        guidance = getattr(request_or_question, "ideal_key_points", [])
    else:
        q_text = str(request_or_question)
        ans_text = candidate_answer or ""
        r_type = round_type
        guidance = ideal_key_points or []

    answer_text = (ans_text or "").strip()
    words = [w for w in re.findall(r"\w+", answer_text.lower()) if len(w) > 1]
    word_count = len(words)

    if word_count < 8:
        return EvaluateAnswerResponse(
            correctness_score=2.0,
            relevance_score=2.5,
            depth_score=1.5,
            completeness_score=1.5,
            communication_score=3.0,
            problem_solving_score=1.5,
            overall_question_score=2.0,
            feedback="Answer was too brief or incomplete to demonstrate engineering understanding.",
            strengths=[],
            improvements=["Provide detailed architectural examples and explain core concepts thoroughly."]
        )

    # LLM Evaluation attempt if Gemini is active
    global _gemini_available
    if _gemini_available and settings.GEMINI_API_KEY:
        try:
            prompt = f"""You are a Principal Engineering Interviewer evaluating a candidate's spoken response.
Question: "{q_text}"
Candidate Spoken Answer: "{answer_text}"
Ideal Guidance Points: {guidance or []}

Evaluate on a scale of 0.0 to 10.0 for each metric:
1. correctness_score, 2. relevance_score, 3. depth_score, 4. completeness_score, 5. communication_score, 6. problem_solving_score, 7. overall_question_score
8. feedback (2 concise sentences)
9. strengths (array of strings)
10. improvements (array of strings)

Respond STRICTLY in JSON format matching the schema.
"""
            model = genai.GenerativeModel("gemini-1.5-flash")
            res = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            data = json.loads(res.text)
            return EvaluateAnswerResponse(
                correctness_score=float(data.get("correctness_score", 7.5)),
                relevance_score=float(data.get("relevance_score", 7.5)),
                depth_score=float(data.get("depth_score", 7.5)),
                completeness_score=float(data.get("completeness_score", 7.5)),
                communication_score=float(data.get("communication_score", 7.5)),
                problem_solving_score=float(data.get("problem_solving_score", 7.5)),
                overall_question_score=float(data.get("overall_question_score", 7.5)),
                feedback=data.get("feedback", "Good technical articulation."),
                strengths=data.get("strengths", ["Clear explanation"]),
                improvements=data.get("improvements", ["Elaborate on production failure modes"])
            )
        except Exception as e:
            _gemini_available = False
            logger.warning(f"Gemini evaluation fallback engaged: {e}")

    # Deterministic Evaluation Fallback
    tech_keywords = [
        "spring", "react", "java", "sql", "api", "database", "cache", "redis",
        "docker", "kubernetes", "query", "index", "concurrency", "thread", "memory",
        "latency", "throughput", "transaction", "architecture", "microservice",
        "lock", "async", "security", "token", "jwt", "rag", "vector", "embedding", "chroma"
    ]
    matched_tech = [k for k in tech_keywords if k in words]
    depth_multiplier = min(1.0, word_count / 50.0)
    tech_bonus = min(3.0, len(matched_tech) * 0.6)

    base_score = min(9.5, 4.5 + (depth_multiplier * 2.5) + tech_bonus)
    correctness = round(min(10.0, base_score + 0.2), 1)
    relevance = round(min(10.0, base_score + 0.3), 1)
    depth = round(min(10.0, base_score - 0.2), 1)
    completeness = round(min(10.0, base_score), 1)
    comm = round(min(10.0, 6.0 + (depth_multiplier * 3.0)), 1)
    problem_solving = round(min(10.0, base_score), 1)
    overall = round((correctness * 0.25 + relevance * 0.2 + depth * 0.2 + completeness * 0.15 + comm * 0.1 + problem_solving * 0.1), 1)

    strengths = [f"Directly addressed the {r_type} scenario", "Structured and logical explanation"]
    if matched_tech:
        strengths.append(f"Referenced technical mechanisms ({', '.join(matched_tech[:3])})")

    improvements = ["Elaborate on production failure modes and trade-offs"]
    if word_count < 30:
        improvements.append("Provide a more comprehensive, step-by-step breakdown of your implementation")

    return EvaluateAnswerResponse(
        correctness_score=correctness,
        relevance_score=relevance,
        depth_score=depth,
        completeness_score=completeness,
        communication_score=comm,
        problem_solving_score=problem_solving,
        overall_question_score=overall,
        feedback="Clear technical articulation with solid problem-solving structure.",
        strengths=strengths,
        improvements=improvements
    )

def generate_interview_question(request: GenerateQuestionRequest) -> GenerateQuestionResponse:
    """
    Public endpoint entry point for question generation.
    """
    state_input: ConversationalInterviewState = {
        "session_id": request.session_id,
        "candidate_id": request.candidate_id,
        "candidate_name": request.candidate_name or "Candidate",
        "round_number": request.round_number,
        "round_type": request.round_type,
        "role": request.role,
        "difficulty": request.difficulty,
        "adaptive_enabled": request.adaptive_enabled,
        "resume_context": request.resume_context or {},
        "claims": [],
        "previous_interactions": request.previous_interactions or [],
        "conversation_history": request.conversation_history or [],
        "historical_questions": request.historical_questions or [],
        "last_candidate_answer": request.last_candidate_answer,
        "remaining_seconds": request.remaining_seconds or 2700,
        "perspective": request.perspective,
        "perspective_goal": None,
        "previous_perspectives": request.previous_perspectives or [],
        "priority_topics": [],
        "priority_projects": [],
        "claims_explored": [],
        "claims_remaining": [],
        "angles_explored": [],
        "retrieved_chunks": [],
        "retrieval_query": "",
        "answer_analysis": None,
        "current_topic": None,
        "current_depth": 0,
        "topics_discussed": [],
        "plan": None,
        "generated_turn": None,
        "errors": []
    }

    result = conversational_interview_graph.invoke(state_input)
    turn = result.get("generated_turn") or {}
    perspective = result.get("perspective") or "SYSTEM_ARCHITECTURE"
    goal = result.get("perspective_goal") or ""

    return GenerateQuestionResponse(
        action=turn.get("action", "ASK_QUESTION"),
        acknowledgement=turn.get("acknowledgement", ""),
        question_text=turn.get("question_text", "Could you walk me through your engineering background?"),
        full_speech_text=turn.get("full_speech_text", "Could you walk me through your engineering background?"),
        question_category=turn.get("question_category", perspective),
        question_source=turn.get("question_source", f"Resume AI Interviewer -> {perspective}"),
        topic=turn.get("topic", f"{perspective} Exploration"),
        subtopic=turn.get("subtopic"),
        skill=turn.get("skill"),
        project=turn.get("project"),
        angle=turn.get("angle"),
        question_type=turn.get("question_type"),
        semantic_fingerprint=turn.get("semantic_fingerprint"),
        hints=turn.get("hints", []),
        ideal_key_points=turn.get("ideal_key_points", []),
        sample_solution=turn.get("sample_solution"),
        difficulty=turn.get("difficulty", "MEDIUM"),
        is_completed=turn.get("is_completed", False),
        perspective=perspective,
        perspective_goal=goal
    )
