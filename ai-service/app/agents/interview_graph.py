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

# Track Gemini availability
_gemini_available = bool(settings.GEMINI_API_KEY)
try:
    import google.generativeai as genai
    if settings.GEMINI_API_KEY:
        genai.configure(api_key=settings.GEMINI_API_KEY)
except Exception as e:
    _gemini_available = False
    logger.warning(f"Failed to configure google.generativeai: {e}")

# ========================================================
# 1. VOCABULARIES & CONVERSATIONAL NATURAL STYLES
# ========================================================

QUESTION_ANGLES = [
    "DEFINITION", "FUNDAMENTALS", "IMPLEMENTATION", "PROJECT_EXPERIENCE",
    "WHY", "HOW", "TRADEOFF", "COMPARISON", "DEBUGGING", "FAILURE",
    "OPTIMIZATION", "PERFORMANCE", "MEMORY", "CONCURRENCY", "SECURITY",
    "TESTING", "SCALABILITY", "ARCHITECTURE", "DESIGN", "EDGE_CASE",
    "REAL_WORLD", "PRODUCTION_INCIDENT", "SCENARIO", "DECISION",
    "CONSTRAINT", "PRESSURE", "PUZZLE", "BEHAVIORAL", "REFLECTION",
    "LEADERSHIP", "COUNTERFACTUAL"
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
    "No worries at all, that's completely fine. Let's move on.",
    "No problem, let's look at another area of your background.",
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
    classification: str # STRONG, PARTIAL, WEAK, NO_ANSWER, I_DONT_KNOW, INTERESTING_DETAIL
    concepts_mentioned: List[str]
    technologies_mentioned: List[str]
    interesting_details: List[str]
    word_count: int
    confidence_level: str

class InterviewPlan(TypedDict):
    action: str # GO_DEEPER, CLARIFY, CHALLENGE, EXPLORE_NEW_DETAIL, SWITCH_TOPIC, END_INTERVIEW
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
    retrieved_chunks: List[Dict[str, Any]]
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
        r"\b(can you|could you|please|tell me about|tell me|tell|walk me through|what is|what are|what do you|explain what|explain how|explain why|explain|describe how|describe what|how do you|how would you|how does|what happens when|means|mean|in your own words|in your own|own words|own|words|give me an example of|give an example|in your project|imagine|suppose|regarding|looking at|walk me|know about|know|good morning|hello|hi|welcome)\b",
        r"\b(a|an|the|is|are|was|were|in|on|at|to|for|of|with|by|from|about|when|where|why|which|how|what|your|my|our|you|me|us|did|do|does|have|has|had|will|would|could|should|can|tell|word|words|own)\b"
    ]
    for pat in filler_patterns:
        lower = re.sub(pat, " ", lower)
    raw_words = [w for w in re.findall(r"[a-z0-9]+", lower) if len(w) >= 3]
    stemmed = []
    for w in raw_words:
        if w.endswith("ing") and len(w) > 5:
            w = w[:-3]
        elif w.endswith("ed") and len(w) > 4:
            w = w[:-2]
        elif w.endswith("es") and len(w) > 4:
            w = w[:-2]
        elif w.endswith("s") and len(w) > 3 and not w.endswith("ss"):
            w = w[:-1]
        if w.endswith("e") and len(w) > 4:
            w = w[:-1]
        if len(w) > 4 and w[-1] == w[-2] and w[-1] in "bdfgmnprt":
            w = w[:-1]
        stemmed.append(w)
    sorted_keywords = sorted(list(set(stemmed)))
    return "_".join(sorted_keywords) if sorted_keywords else hashlib.md5(text.lower().encode("utf-8")).hexdigest()

def extract_claims_from_context(resume_context: Dict[str, Any]) -> List[StructuredClaim]:
    """Generates verifiable candidate claims from resume data."""
    claims: List[StructuredClaim] = []
    projects = resume_context.get("projects", [])
    raw_skills = resume_context.get("skills", [])
    if isinstance(raw_skills, dict):
        skills = []
        for val in raw_skills.values():
            if isinstance(val, list):
                skills.extend(val)
            elif isinstance(val, str):
                skills.append(val)
    elif isinstance(raw_skills, list):
        skills = raw_skills
    else:
        skills = []

    for p in projects:
        if isinstance(p, dict):
            p_name = p.get("title") or p.get("name") or "Project"
            p_desc = p.get("description", "")
            p_techs = p.get("technologies", [])
            p_resps = p.get("responsibilities", [])
            p_text = f"{p_name} {p_desc} {' '.join(p_techs)} {' '.join(p_resps)}".lower()

            if any(k in p_text for k in ["spring", "spring boot", "rest", "backend"]):
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
                    "claim": f"Implemented distributed Redis caching to accelerate endpoint latency in {p_name}",
                    "technology": "Redis",
                    "concept": "CACHING_STRATEGY",
                    "project": p_name,
                    "claim_type": "optimization",
                    "strength": "latency"
                })
            if any(k in p_text for k in ["docker", "kubernetes", "container"]):
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

def plan_interview_direction(resume_context, round_number=1, current_round="TECHNICAL", role="Developer", history=None, difficulty="MEDIUM", session_seed=0):
    claims = extract_claims_from_context(resume_context)
    return {
        "topic": claims[0]["technology"] if claims else "Architecture",
        "angle": "IMPLEMENTATION",
        "style": "PROJECT_SPECIFIC",
        "difficulty": difficulty,
        "selected_claim": claims[0] if claims else None
    }

def generate_session_strategy(resume_context, session_id):
    claims = extract_claims_from_context(resume_context)
    return {
        "focus_areas": [c["technology"] for c in claims[:4]],
        "strategy": "DEEP_TECHNICAL"
    }

# ========================================================
# 4. NODE 1: ANALYZE CANDIDATE ANSWER
# ========================================================

def analyze_candidate_answer_node(state: ConversationalInterviewState) -> Dict[str, Any]:
    """
    Examines candidate's spoken response.
    Extracts mentioned concepts, technologies, interesting unprompted details, and classifies depth:
    STRONG / PARTIAL / WEAK / NO_ANSWER / I_DONT_KNOW / INTERESTING_DETAIL.
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

    # 1. Check for "I don't know" or no-answer timeouts
    if any(phrase in lower_ans for phrase in [
        "i don't know", "i do not know", "not sure", "no idea", "don't know",
        "i haven't worked with", "not familiar", "[no_answer", "timeout"
    ]) or word_count <= 4:
        analysis: AnswerAnalysis = {
            "classification": "I_DONT_KNOW" if "don't know" in lower_ans or "not sure" in lower_ans else "NO_ANSWER",
            "concepts_mentioned": [],
            "technologies_mentioned": [],
            "interesting_details": [],
            "word_count": word_count,
            "confidence_level": "LOW"
        }
        return {"answer_analysis": analysis}

    # 2. Extract technical entities
    tech_patterns = {
        "Spring Boot": [r"\bspring boot\b", r"\bspring\b", r"\bspring security\b", r"\bioc\b", r"\bdependency injection\b"],
        "React": [r"\breact\b", r"\bhook\b", r"\buseeffect\b", r"\busestate\b", r"\bredirection\b", r"\bvirtual dom\b"],
        "Java": [r"\bjava\b", r"\bjvm\b", r"\bconcurrency\b", r"\bthread\b", r"\bgarbage collect\b"],
        "MySQL": [r"\bmysql\b", r"\bsql\b", r"\bpostgres\b", r"\bquery\b", r"\bindex\b", r"\bacid\b", r"\btransaction\b"],
        "Redis": [r"\bredis\b", r"\bcache\b", r"\beviction\b", r"\bttl\b"],
        "ChromaDB": [r"\bchroma\b", r"\bchromadb\b", r"\bvector\b", r"\bembedding\b", r"\brag\b", r"\blangchain\b"],
        "TensorFlow": [r"\btensorflow\b", r"\bcnn\b", r"\bopencv\b", r"\bcomputer vision\b", r"\bdefect\b", r"\bneural\b", r"\bvision\b"],
        "Docker": [r"\bdocker\b", r"\bcontainer\b", r"\bkubernetes\b"],
        "REST API": [r"\brest\b", r"\bendpoint\b", r"\bjwt\b", r"\btoken\b", r"\bhttp\b"]
    }

    found_techs = []
    found_concepts = []
    for tech_name, pats in tech_patterns.items():
        for pat in pats:
            if re.search(pat, lower_ans):
                if tech_name not in found_techs:
                    found_techs.append(tech_name)
                match_concept = pat.replace(r"\b", "").replace(r"\b", "")
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

    # 4. Classify response
    if interesting_details and word_count >= 12:
        classification = "INTERESTING_DETAIL"
    elif (word_count >= 25 and (len(found_techs) >= 1 or len(found_concepts) >= 2)) or (word_count >= 20 and len(found_techs) >= 2):
        classification = "STRONG"
    elif word_count >= 12 or len(found_techs) >= 1:
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
# 5. NODE 2: RETRIEVE RESUME CONTEXT FROM CHROMADB
# ========================================================

def retrieve_resume_context_node(state: ConversationalInterviewState) -> Dict[str, Any]:
    """
    Queries ChromaDB with candidate isolation filter using candidate's answer + topic focus.
    """
    candidate_id = state.get("candidate_id", "candidate-default")
    resume_context = state.get("resume_context") or {}
    last_answer = state.get("last_candidate_answer") or ""
    analysis = state.get("answer_analysis") or {}

    # Ensure candidate resume is indexed in ChromaDB
    try:
        chunk_and_index_resume(
            candidate_id=candidate_id,
            resume_id="current_active_resume",
            resume_data=resume_context
        )
    except Exception as e:
        logger.warning(f"Chroma indexing note: {e}")

    # Build targeted query from candidate answer & concepts
    mentioned_tech = " ".join(analysis.get("technologies_mentioned", []))
    query_text = f"{last_answer} {mentioned_tech}".strip() or "candidate resume projects technical architecture"

    retrieved = retrieve_relevant_resume_knowledge(
        candidate_id=candidate_id,
        resume_id=None,
        query_text=query_text,
        n_results=4
    )

    return {"retrieved_chunks": retrieved}

# ========================================================
# 6. NODE 3: DECIDE NEXT INTERVIEW ACTION (PLANNER)
# ========================================================

def decide_next_interview_action_node(state: ConversationalInterviewState) -> Dict[str, Any]:
    """
    Decision engine:
    Evaluates answer analysis + retrieved ChromaDB context + current depth.
    Selects action (GO_DEEPER, CLARIFY, CHALLENGE, EXPLORE_NEW_DETAIL, SWITCH_TOPIC, END_INTERVIEW).
    """
    round_number = state.get("round_number", 1)
    round_type = state.get("round_type", "TECHNICAL")
    difficulty = state.get("difficulty", "MEDIUM")
    candidate_id = state.get("candidate_id", "candidate-default")
    session_id = state.get("session_id", "session-default")
    remaining_seconds = state.get("remaining_seconds", 2700)
    resume_context = state.get("resume_context") or {}
    analysis = state.get("answer_analysis") or {"classification": "OPENER"}
    retrieved = state.get("retrieved_chunks") or []
    history = state.get("conversation_history") or []
    prev_interactions = state.get("previous_interactions") or []
    all_interactions = history + prev_interactions
    historical_questions = state.get("historical_questions") or []

    claims = extract_claims_from_context(resume_context)
    skills = resume_context.get("skills") or ["Java", "Spring Boot", "MySQL", "React", "REST APIs"]


    current_topic = state.get("current_topic")
    if not current_topic and history:
        current_topic = history[-1].get("topic")
    if not current_topic and analysis.get("technologies_mentioned"):
        current_topic = analysis.get("technologies_mentioned")[0]
    current_depth = state.get("current_depth", 0)
    topics_discussed = list(state.get("topics_discussed") or [])

    # Check for session wrap-up
    if round_number >= 8 or remaining_seconds <= 120:
        plan: InterviewPlan = {
            "action": "END_INTERVIEW",
            "topic": "CLOSING",
            "subtopic": "Summary & Reflection",
            "skill": "Closing",
            "project": None,
            "claim": None,
            "angle": "REFLECTION",
            "style": "DIRECT",
            "difficulty": "EASY",
            "reason": "Session time limit or round threshold reached.",
            "expected_concepts": ["Reflection", "Career aspirations"],
            "is_follow_up": False,
            "transition_speech": "Thank you so much for walking through your projects and technical architecture today.",
            "semantic_fingerprint": "interview_closing_wrapup"
        }
        return {"plan": plan, "current_depth": current_depth, "current_topic": "CLOSING", "topics_discussed": topics_discussed}

    # First turn: Natural Opener
    if round_number == 1 and not (state.get("last_candidate_answer") or "").strip():
        plan: InterviewPlan = {
            "action": "ASK_QUESTION",
            "topic": "INTRODUCTION",
            "subtopic": "Engineering Background & Projects",
            "skill": "Career Overview",
            "project": None,
            "claim": None,
            "angle": "PROJECT_EXPERIENCE",
            "style": "DIRECT",
            "difficulty": "EASY",
            "reason": "Natural opening turn to establish conversational baseline.",
            "expected_concepts": ["Introduction", "Recent projects", "Technical stack"],
            "is_follow_up": False,
            "transition_speech": "",
            "semantic_fingerprint": "introduction|career_overview|project_experience"
        }
        return {"plan": plan, "current_depth": 0, "current_topic": "INTRODUCTION", "topics_discussed": ["INTRODUCTION"]}


    # Candidate said "I don't know" or timed out -> Graceful SWITCH_TOPIC
    cls = analysis.get("classification")
    if cls in ["I_DONT_KNOW", "NO_ANSWER"]:
        transition_msg = random.choice(NO_ANSWER_PHRASES)
        # Select next untested claim/technology
        untested = [c for c in claims if c["concept"] not in topics_discussed and c["technology"] not in topics_discussed]
        chosen_claim = untested[0] if untested else (random.choice(claims) if claims else None)

        topic = chosen_claim["concept"] if chosen_claim else "SYSTEM_DESIGN"
        skill = chosen_claim["technology"] if chosen_claim else "Architecture"
        project = chosen_claim.get("project") if chosen_claim else None

        plan: InterviewPlan = {
            "action": "SWITCH_TOPIC",
            "topic": topic,
            "subtopic": f"{skill} Foundations",
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
            "semantic_fingerprint": f"{topic.lower()}|{skill.lower()}|implementation"
        }
        topics_discussed.append(topic)
        return {"plan": plan, "current_depth": 1, "current_topic": topic, "topics_discussed": topics_discussed}

    # Candidate mentioned an unprompted interesting detail -> EXPLORE_NEW_DETAIL
    if cls == "INTERESTING_DETAIL":
        detail = analysis.get("interesting_details", ["system optimization"])[0]
        skill = analysis.get("technologies_mentioned", ["Architecture"])[0]
        target_topic = current_topic or skill
        plan: InterviewPlan = {
            "action": "EXPLORE_NEW_DETAIL",
            "topic": f"{skill.upper()}_{detail.upper().replace(' ', '_')}",
            "subtopic": detail.title(),
            "skill": skill,
            "project": None,
            "claim": None,
            "angle": "DEBUGGING" if "issue" in detail or "bottleneck" in detail else "OPTIMIZATION",
            "style": "FOLLOW_UP",
            "difficulty": "HARD" if difficulty == "HARD" else "MEDIUM",
            "reason": f"Candidate highlighted an unprompted real-world engineering challenge ({detail}). Investigating diagnosis and resolution.",
            "expected_concepts": [skill, detail, "Root cause analysis", "Resolution trade-offs"],
            "is_follow_up": True,
            "transition_speech": f"That's interesting that you encountered a {detail}.",
            "semantic_fingerprint": f"{skill.lower()}|{detail.lower()}|investigation"
        }
        return {"plan": plan, "current_depth": current_depth + 1, "current_topic": target_topic, "topics_discussed": topics_discussed}

    # Candidate gave a STRONG answer -> GO_DEEPER if topic depth < 3
    if cls == "STRONG" and current_depth < 3:
        target_topic = current_topic or (analysis.get("technologies_mentioned") and analysis.get("technologies_mentioned")[0]) or "Architecture"
        skill = (analysis.get("technologies_mentioned") and analysis.get("technologies_mentioned")[0]) or str(target_topic)
        angle = random.choice(["CONCURRENCY", "FAILURE", "PRODUCTION_INCIDENT", "SCALABILITY", "TRADEOFF", "SECURITY"])
        style = random.choice(["SCENARIO", "PRODUCTION_INCIDENT", "WHAT_IF", "CHALLENGE"])
        plan: InterviewPlan = {
            "action": "GO_DEEPER",
            "topic": str(target_topic),
            "subtopic": f"{skill} Advanced Architecture & Edge Cases",
            "skill": skill,
            "project": None,
            "claim": None,
            "angle": angle,
            "style": style,
            "difficulty": "HARD" if difficulty == "HARD" else "MEDIUM",
            "reason": f"Candidate provided a strong answer. Probing deeper into practical resilience, concurrency, or scale via {angle}.",
            "expected_concepts": [skill, f"{angle.lower()} analysis", "Production edge cases"],
            "is_follow_up": True,
            "transition_speech": random.choice(ACKNOWLEDGEMENT_PHRASES),
            "semantic_fingerprint": f"{str(target_topic).lower()}|{skill.lower()}|{angle.lower()}"
        }
        return {"plan": plan, "current_depth": current_depth + 1, "current_topic": str(target_topic), "topics_discussed": topics_discussed}

    # Candidate gave a PARTIAL or WEAK answer -> CLARIFY
    if cls in ["PARTIAL", "WEAK"] and current_depth < 3:
        target_topic = current_topic or (analysis.get("technologies_mentioned") and analysis.get("technologies_mentioned")[0]) or "Implementation"
        skill = (analysis.get("technologies_mentioned") and analysis.get("technologies_mentioned")[0]) or str(target_topic)
        plan: InterviewPlan = {
            "action": "CLARIFY",
            "topic": str(target_topic),
            "subtopic": f"{skill} Specific Implementation Mechanics",
            "skill": skill,
            "project": None,
            "claim": None,
            "angle": "IMPLEMENTATION",
            "style": "FOLLOW_UP",
            "difficulty": "MEDIUM",
            "reason": "Candidate provided a vague or partial answer. Probing for specific implementation mechanism.",
            "expected_concepts": [skill, "Implementation details"],
            "is_follow_up": True,
            "transition_speech": random.choice(ACKNOWLEDGEMENT_PHRASES),
            "semantic_fingerprint": f"{str(target_topic).lower()}|{skill.lower()}|clarify"
        }
        return {"plan": plan, "current_depth": current_depth + 1, "current_topic": str(target_topic), "topics_discussed": topics_discussed}

    # Topic exhausted (depth >= 3), WEAK answer, or new exploration -> SWITCH_TOPIC
    transition_msg = random.choice(TRANSITION_PHRASES)

    # Filter out claims already discussed in this session OR heavily asked in historical sessions
    past_text = " ".join(historical_questions).lower()
    untested_this_session = [c for c in claims if c["concept"] not in topics_discussed and c["technology"] not in topics_discussed]
    untested_all_time = [c for c in untested_this_session if c["technology"].lower() not in past_text]

    chosen_claim = None
    if untested_all_time:
        chosen_claim = untested_all_time[0]
    elif untested_this_session:
        chosen_claim = untested_this_session[0]
    else:
        chosen_claim = random.choice(claims) if claims else None

    topic = chosen_claim["concept"] if chosen_claim else "SYSTEM_DESIGN"
    skill = chosen_claim["technology"] if chosen_claim else "Architecture"
    project = chosen_claim.get("project") if chosen_claim else None

    # Rotate angle across attempts
    seed_hash = int(hashlib.md5(f"{session_id}_{round_number}_{skill}".encode("utf-8")).hexdigest(), 16)
    available_angles = ["PROJECT_EXPERIENCE", "ARCHITECTURE", "SCALABILITY", "TRADEOFF", "CONCURRENCY", "OPTIMIZATION", "SECURITY"]
    angle = available_angles[seed_hash % len(available_angles)]

    plan: InterviewPlan = {
        "action": "SWITCH_TOPIC",
        "topic": topic,
        "subtopic": f"{skill} {angle.capitalize()}",
        "skill": skill,
        "project": project,
        "claim": chosen_claim["claim"] if chosen_claim else None,
        "angle": angle,
        "style": "PROJECT_SPECIFIC" if project else "SCENARIO",
        "difficulty": difficulty,
        "reason": f"Exploring candidate experience with {skill} via {angle} angle.",
        "expected_concepts": [skill, "Architecture"],
        "is_follow_up": False,
        "transition_speech": transition_msg,
        "semantic_fingerprint": f"{topic.lower()}|{skill.lower()}|{angle.lower()}"
    }
    topics_discussed.append(topic)
    return {"plan": plan, "current_depth": 1, "current_topic": topic, "topics_discussed": topics_discussed}

# ========================================================
# 7. NODE 4: GENERATE NATURAL INTERVIEW QUESTION (WRITER)
# ========================================================

def generate_natural_interview_question_node(state: ConversationalInterviewState) -> Dict[str, Any]:
    """
    Writer Node:
    Separates WHAT to ask (Plan) from HOW to ask it (Natural Spoken Conversational Turn).
    Produces fluent spoken dialogue grounded in candidate's resume knowledge and conversation history.
    """
    plan = state.get("plan") or {}
    candidate_name = state.get("candidate_name") or "Candidate"
    role = state.get("role", "Full Stack Software Engineer")
    resume_context = state.get("resume_context") or {}
    retrieved = state.get("retrieved_chunks") or []
    history = state.get("conversation_history") or []
    prev_interactions = state.get("previous_interactions") or []
    all_interactions = history + prev_interactions
    historical_questions = state.get("historical_questions") or []
    session_id = state.get("session_id", "sess")
    round_number = state.get("round_number", 1)

    topic = plan.get("topic", "TECHNICAL")
    subtopic = plan.get("subtopic", topic)
    skill = plan.get("skill", "Architecture")
    project = plan.get("project")
    claim = plan.get("claim")
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

    p_name = project or "your recent project"

    # Context string from ChromaDB retrieval
    retrieved_text = "\n".join([f"- {r['document']}" for r in retrieved[:3]]) if retrieved else f"- Proficient in {skill}"

    # 1. LLM Generation attempt if Gemini is active
    global _gemini_available
    if _gemini_available and settings.GEMINI_API_KEY:
        try:
            prompt = f"""You are a top-tier Senior Engineering Interviewer conducting an interactive spoken interview for '{role}'.
Candidate: {candidate_name}

Interviewer Decision: {action}
Topic: {topic} | Subtopic: {subtopic} | Skill: {skill}
Project: {p_name}
Target Angle: {angle} | Conversational Style: {style}
Transition / Acknowledgment to start with: "{transition_speech}"

Resume Knowledge from ChromaDB:
{retrieved_text}

Task:
Produce ONE conversational spoken response.
If transition speech is provided, start with it or a natural equivalent, then ask ONE insightful, practical question.
The question must sound like a real human engineer in an interview, referencing the candidate's actual projects ({p_name}) or technologies ({skill}).
Avoid sounding like an exam questionnaire. Do NOT say 'Question 1' or 'According to your resume'.

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
                        "question_category": topic,
                        "question_source": f"Resume AI Interviewer -> {angle} ({style})",
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

    # 2. High-Quality Natural Conversational Fallback
    if topic == "INTRODUCTION":
        openers = [
            (f"Good morning, {candidate_name}. How are you doing today? To get us started, could you introduce yourself and walk me through what you've been working on recently?",
             "Could you introduce yourself and walk me through what you've been working on recently?"),
            (f"Welcome, {candidate_name}! Looking at your resume for {role}, which of your recent projects gave you the most hands-on engineering experience?",
             "Which of your recent projects gave you the most hands-on engineering experience?"),
            (f"Hi {candidate_name}, glad to speak with you today. To kick off our discussion for {role}, what is the most technically interesting backend or full-stack feature you have built?",
             "What is the most technically interesting backend or full-stack feature you have built?"),
            (f"Hello {candidate_name}! Looking across your background, what engineering challenge in your recent work gave you the deepest learning curve?",
             "What engineering challenge in your recent work gave you the deepest learning curve?"),
            (f"Great to connect with you, {candidate_name}. Walk me through the architecture of the project you are most proud of on your resume.",
             "Walk me through the architecture of the project you are most proud of on your resume.")
        ]
        chosen_speech, chosen_q = openers[0]
        for speech, q in openers:
            if normalize_fingerprint(q) not in seen_fingerprints:
                chosen_speech, chosen_q = speech, q
                break

        return {
            "generated_turn": {
                "action": "ASK_QUESTION",
                "acknowledgement": "",
                "question_text": chosen_q,
                "full_speech_text": chosen_speech,
                "question_category": "INTRODUCTION",
                "question_source": "Adaptive AI Interviewer -> Natural Opener",
                "topic": "Candidate Introduction",
                "subtopic": "Engineering Background",
                "skill": "Career Overview",
                "project": None,
                "angle": "PROJECT_EXPERIENCE",
                "question_type": "DIRECT",
                "semantic_fingerprint": normalize_fingerprint(chosen_q),
                "hints": ["Clear engineering overview", "Core technical proficiencies", "Key project milestones"],
                "ideal_key_points": ["Communication clarity", "Technical scope", "Project impact"],
                "difficulty": "EASY",
                "is_completed": False
            }
        }

    # High-variety Domain Question Templates across Angles & Styles
    q_templates = []
    if action == "EXPLORE_NEW_DETAIL":
        q_templates = [
            f"Interesting. What was the root cause of that issue, and how did you diagnose and resolve it in {p_name}?",
            f"What specific diagnostic tools, application metrics, or log traces did you rely on to pinpoint that behavior in {p_name}?",
            f"How did you prevent that failure scenario from reoccurring in subsequent production deployments of {p_name}?",
            f"What architectural safeguards or circuit breakers did you implement after resolving that bottleneck in {p_name}?"
        ]
    elif angle == "CONCURRENCY":
        q_templates = [
            f"In your work with {skill} on {p_name}, suppose concurrent user requests cause thread contention or connection pool exhaustion under peak traffic. How did you design the concurrency and synchronization model?",
            f"If multiple concurrent workers in {p_name} execute transactional updates against {skill}, how do you guarantee data consistency without deadlocks?"
        ]
    elif angle == "MEMORY":
        q_templates = [
            f"How does the internal execution and memory model in {skill} handle high-frequency allocations under load in {p_name}?",
            f"How would you profile and diagnose heap memory leaks in your {skill} services on {p_name}?"
        ]
    elif angle == "DEBUGGING":
        q_templates = [
            f"Suppose an endpoint in {p_name} handling {skill} intermittently returns HTTP 500 errors during traffic spikes. Walk me step-by-step through how you isolate whether the root cause is in application threads, database locks, or external network latency.",
            f"How do you trace and debug asynchronous event failures in {skill} across distributed components in {p_name}?"
        ]
    elif angle == "FAILURE":
        q_templates = [
            f"Imagine a production incident where {skill} transactions in {p_name} deadlock under peak write traffic. What specific diagnostic tools, thread dumps, or metrics would you check first?",
            f"How does {p_name} recover gracefully if downstream {skill} services crash or become unreachable?"
        ]
    elif angle == "PRODUCTION_INCIDENT":
        q_templates = [
            f"If data mutations in {skill} are intermittently dropped silently without exceptions in {p_name}, how would you trace the execution pipeline?",
            f"You have 60 seconds during a live outage in {p_name}: What are your immediate first 3 operational triage steps for {skill}?"
        ]
    elif angle == "SCALABILITY":
        q_templates = [
            f"Suppose traffic to {p_name} increases by 100x. What is the very first bottleneck you would expect in your {skill} layer, and how would you re-architect it?",
            f"How would you horizontally scale the {skill} services in {p_name} across multiple regions or nodes?"
        ]
    elif angle == "OPTIMIZATION":
        q_templates = [
            f"What specific indexing, caching, or batching strategies did you implement to optimize throughput in your {skill} components in {p_name}?",
            f"How did you measure endpoint latency and memory overhead when profiling {skill} performance on {p_name}?"
        ]
    elif angle == "TRADEOFF":
        q_templates = [
            f"In your implementation of {skill} on {p_name}, what were the main architectural trade-offs you navigated compared to alternative solutions?",
            f"If you were tasked with replacing {skill} in {p_name} tomorrow, what would you choose and what trade-offs would emerge?"
        ]
    elif angle == "COMPARISON":
        q_templates = [
            f"Why did you choose {skill} over competing alternatives for {p_name}, and what constraints did you have to engineer around?",
            f"How does {skill} compare against other industry standards for the requirements of {p_name}?"
        ]
    elif angle == "SECURITY":
        q_templates = [
            f"If I conducted a security code review on your {skill} layer in {p_name}, how do you prevent injection, unauthorized elevation, and token tampering?",
            f"What measures did you put in place to ensure sensitive configuration and credential data in {skill} on {p_name} are never exposed?"
        ]
    elif angle == "DESIGN_REVIEW":
        q_templates = [
            f"How did you enforce stateless authentication and payload validation across {skill} service boundaries in {p_name}?",
            f"How do your {skill} API contracts in {p_name} handle schema evolution and backward compatibility?"
        ]
    elif angle == "ARCHITECTURE":
        q_templates = [
            f"Looking at your experience with {skill} in {p_name}, how did you structure your components to ensure modularity, maintainability, and clean error handling?",
            f"Walk me through the lifecycle of a typical request flowing through your {skill} services in {p_name}."
        ]
    else:
        q_templates = [
            f"I noticed you worked on {p_name} with {skill}. What part of the {skill} architecture did you personally design and implement?",
            f"What was the most challenging technical feature you implemented using {skill} in {p_name}?",
            f"In {p_name}, how did your {skill} components communicate with database and external API layers?"
        ]


    chosen_q = None
    for q_cand in q_templates:
        fp = normalize_fingerprint(q_cand)
        if fp not in seen_fingerprints:
            chosen_q = q_cand
            break

    if not chosen_q:
        # Generate a unique variant incorporating round number and angle
        chosen_q = f"In {p_name}, when designing the {skill} module for {angle.lower()} resilience, what technical decisions did you make?"

    fp_final = normalize_fingerprint(chosen_q)
    full_speech = f"{transition_speech} {chosen_q}".strip() if transition_speech else chosen_q


    return {
        "generated_turn": {
            "action": action,
            "acknowledgement": transition_speech,
            "question_text": chosen_q,
            "full_speech_text": full_speech,
            "question_category": topic,
            "question_source": f"Resume AI Interviewer -> {angle} ({style})",
            "topic": f"{skill} {angle.capitalize()}",
            "subtopic": subtopic,
            "skill": skill,
            "project": project,
            "angle": angle,
            "question_type": style,
            "semantic_fingerprint": fp_final,
            "hints": [f"Explain {skill} implementation", f"Address {angle.lower()} trade-offs and edge cases"],
            "ideal_key_points": [skill, f"{angle} best practices", "Production reasoning"],
            "difficulty": difficulty,
            "is_completed": action == "END_INTERVIEW"
        }
    }

# ========================================================
# 8. LANGGRAPH WORKFLOW ASSEMBLY
# ========================================================

def create_resume_conversational_interview_graph():
    workflow = StateGraph(ConversationalInterviewState)

    workflow.add_node("analyze_answer", analyze_candidate_answer_node)
    workflow.add_node("retrieve_resume_context", retrieve_resume_context_node)
    workflow.add_node("decide_action", decide_next_interview_action_node)
    workflow.add_node("generate_question", generate_natural_interview_question_node)

    workflow.add_edge(START, "analyze_answer")
    workflow.add_edge("analyze_answer", "retrieve_resume_context")
    workflow.add_edge("retrieve_resume_context", "decide_action")
    workflow.add_edge("decide_action", "generate_question")
    workflow.add_edge("generate_question", END)

    return workflow.compile()

conversational_interview_graph = create_resume_conversational_interview_graph()

# ========================================================
# 9. EVALUATION & PUBLIC ENTRYPOINTS
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
        "retrieved_chunks": [],
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

    return GenerateQuestionResponse(
        action=turn.get("action", "ASK_QUESTION"),
        acknowledgement=turn.get("acknowledgement", ""),
        question_text=turn.get("question_text", "Could you walk me through your engineering background?"),
        full_speech_text=turn.get("full_speech_text", "Could you walk me through your engineering background?"),
        question_category=turn.get("question_category", "TECHNICAL"),
        question_source=turn.get("question_source", "Resume AI Interviewer"),
        topic=turn.get("topic", "Technical Architecture"),
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
        is_completed=turn.get("is_completed", False)
    )
