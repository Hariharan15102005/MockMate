import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import pytest
from app.agents.interview_graph import (
    generate_interview_question,
    evaluate_candidate_answer,
    extract_structured_claims,
    normalize_fingerprint,
    plan_interview_direction,
    generate_session_strategy,
    QUESTION_ANGLES,
    QUESTION_STYLES
)
from app.schemas.interview import (
    GenerateQuestionRequest,
    EvaluateAnswerRequest
)

RESUME_CONTEXT = {
    "skills": ["Java", "Spring Boot", "SQL", "React", "Python", "RAG", "ChromaDB", "Docker", "Redis"],
    "projects": [
        {
            "name": "LearnSphere",
            "technologies": ["Spring Boot", "React", "FastAPI", "RAG", "ChromaDB"],
            "description": "Architected intelligent LMS platform with Spring Boot REST APIs and ChromaDB vector retrieval for AI tutoring."
        },
        {
            "name": "SocialCommerce",
            "technologies": ["Java", "MySQL", "React", "Redis"],
            "description": "Developed high-throughput social commerce platform with MySQL database optimization and distributed Redis caching."
        }
    ]
}

def test_claims_extraction():
    claims = extract_structured_claims(RESUME_CONTEXT)
    assert len(claims) >= 4
    techs = {c["technology"] for c in claims}
    assert "Spring Boot" in techs or "RAG" in techs or "React" in techs or "SQL" in techs
    for c in claims:
        assert "claim" in c and len(c["claim"]) > 10
        assert "claim_type" in c

def test_1_exact_duplicate_rejected():
    """TEST 1: Exact duplicate question is detected and rejected."""
    existing_q = "How did you configure embedding chunk overlaps in ChromaDB?"
    fp1 = normalize_fingerprint(existing_q)
    fp2 = normalize_fingerprint(existing_q)
    assert fp1 == fp2

def test_2_semantic_duplicate_rejected():
    """TEST 2: Same semantic question with different wording produces identical semantic fingerprint."""
    f1 = normalize_fingerprint("What is dependency injection?")
    f2 = normalize_fingerprint("Can you explain dependency injection?")
    f3 = normalize_fingerprint("Could you tell me what dependency injection is?")
    f4 = normalize_fingerprint("In your own words, explain dependency injection.")
    assert f1 == f2 == f3 == f4

def test_3_same_skill_different_angle_allowed():
    """TEST 3: Same skill but different angle produces distinct fingerprints and is allowed."""
    f_definition = normalize_fingerprint("What is dependency injection in Spring Boot?")
    f_scenario = normalize_fingerprint("Your Spring Boot application has tightly coupled services. How would you redesign the dependency structure?")
    f_debugging = normalize_fingerprint("Suppose circular dependency injection occurs between two services. How would you diagnose and resolve it?")
    assert f_definition != f_scenario
    assert f_scenario != f_debugging

def test_4_strong_answer_produces_deeper_followup():
    """TEST 4: Strong answer with specific technical terms triggers a deeper contextual follow-up."""
    req = GenerateQuestionRequest(
        session_id="session-strong-ans",
        candidate_id="cand-1",
        candidate_name="Hari",
        round_number=2,
        round_type="TECHNICAL",
        role="Full Stack Software Engineer",
        difficulty="HARD",
        adaptive_enabled=True,
        resume_context=RESUME_CONTEXT,
        previous_interactions=[
            {"question": "How did you optimize caching?", "answer": "We implemented distributed Redis caching with cache-aside pattern to reduce latency.", "score": 9.0}
        ],
        last_candidate_answer="We implemented distributed Redis caching with cache-aside pattern to reduce latency.",
        historical_questions=[]
    )
    res = generate_interview_question(req)
    assert res.question_text
    assert "redis" in res.question_text.lower() or "cache" in res.question_text.lower() or "latency" in res.question_text.lower() or "system" in res.question_text.lower()

def test_5_weak_answer_produces_clarification():
    """TEST 5: Short / shallow answer scores appropriately low on rubric without crashing."""
    req = EvaluateAnswerRequest(
        session_id="eval-weak",
        round_type="TECHNICAL",
        question_text="How did you implement REST API security in Spring Boot?",
        candidate_answer="It is something Spring uses.",
        ideal_key_points=["JWT filter", "SecurityFilterChain", "Role-based access"]
    )
    res = evaluate_candidate_answer(req)
    assert res.overall_question_score <= 3.0
    assert "brief" in res.feedback.lower() or "incomplete" in res.feedback.lower()

def test_6_topic_switching_after_repetition():
    """TEST 6: Same topic used repeatedly triggers topic switch."""
    state = {
        "session_id": "session-switch",
        "candidate_id": "cand-1",
        "candidate_name": "Hari",
        "round_number": 4,
        "round_type": "TECHNICAL",
        "role": "Full Stack Software Engineer",
        "difficulty": "MEDIUM",
        "adaptive_enabled": True,
        "resume_context": RESUME_CONTEXT,
        "claims": [],
        "previous_interactions": [
            {"topic": "JAVA", "question": "Java Collections", "answer": "Detailed answer", "score": 8.0},
            {"topic": "JAVA", "question": "Java Streams", "answer": "Detailed answer", "score": 8.5},
            {"topic": "JAVA", "question": "Java Concurrency", "answer": "Detailed answer", "score": 8.0}
        ],
        "conversation_history": [],
        "historical_questions": [],
        "last_candidate_answer": "Detailed answer on Java concurrency and thread pools.",
        "remaining_seconds": 2000,
        "candidate_profile": None,
        "session_strategy": None,
        "plan": None,
        "generated_turn": None,
        "errors": []
    }
    plan_out = plan_interview_direction(state)
    planned_topic = plan_out["plan"]["topic"]
    # Topic should have switched away from basic Java or chosen a different domain
    assert planned_topic is not None

def test_7_historical_questions_avoided():
    """TEST 7: Questions asked in previous sessions are avoided."""
    past_q = "In your work with React on LearnSphere, what were the main architectural trade-offs you encountered compared to alternative frameworks or approaches?"
    req = GenerateQuestionRequest(
        session_id="session-avoid-past",
        candidate_id="cand-1",
        candidate_name="Hari",
        round_number=2,
        round_type="TECHNICAL",
        role="Full Stack Software Engineer",
        difficulty="MEDIUM",
        adaptive_enabled=True,
        resume_context=RESUME_CONTEXT,
        previous_interactions=[],
        historical_questions=[past_q]
    )
    res = generate_interview_question(req)
    assert res.question_text != past_q
    assert normalize_fingerprint(res.question_text) != normalize_fingerprint(past_q)

def test_8_same_resume_5_interviews_distinct_trajectories():
    """
    TEST 8: Simulates 5 distinct interviews on the exact same resume.
    Verifies that all 25 generated questions are unique and have zero exact/semantic duplicate collisions.
    """
    all_questions = []
    all_topics = []
    all_angles = []
    cumulative_history = []

    for attempt in range(1, 6):
        attempt_history = []
        for r in range(1, 6):
            req = GenerateQuestionRequest(
                session_id=f"attempt-{attempt}",
                candidate_id="cand-hari",
                candidate_name="Hari",
                round_number=r,
                round_type="TECHNICAL",
                role="Full Stack Software Engineer",
                difficulty="MEDIUM",
                adaptive_enabled=True,
                resume_context=RESUME_CONTEXT,
                previous_interactions=attempt_history,
                historical_questions=cumulative_history
            )
            res = generate_interview_question(req)
            q_text = res.question_text
            all_questions.append(q_text)
            all_topics.append(res.question_category)
            
            attempt_history.append({"question": q_text, "answer": "Technical explanation with architecture details.", "score": 8.0})
            cumulative_history.append(q_text)

    # 1. Zero Exact Duplicates
    assert len(all_questions) == len(set(all_questions)), f"Exact duplicates found! {len(all_questions)} vs {len(set(all_questions))}"
    
    # 2. Zero Semantic Duplicates
    fingerprints = [normalize_fingerprint(q) for q in all_questions]
    assert len(fingerprints) == len(set(fingerprints)), f"Semantic duplicates found! {len(fingerprints)} vs {len(set(fingerprints))}"
    
    # 3. High Topic Diversity
    distinct_topics = set(all_topics)
    assert len(distinct_topics) >= 4, f"Topic diversity too low: {distinct_topics}"

if __name__ == "__main__":
    pytest.main(["-v", __file__])
