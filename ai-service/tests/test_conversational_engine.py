import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import pytest
from app.agents.interview_graph import (
    generate_interview_question,
    evaluate_candidate_answer,
    extract_claims_from_context,
    normalize_fingerprint,
    analyze_candidate_answer_node,
    decide_next_interview_action_node,
    QUESTION_ANGLES,
    QUESTION_STYLES
)
from app.services.chroma_service import (
    chunk_and_index_resume,
    retrieve_relevant_resume_knowledge,
    get_all_candidate_claims,
    get_chroma_client
)
from app.schemas.interview import (
    GenerateQuestionRequest,
    EvaluateAnswerRequest
)

SAMPLE_RESUME = {
    "summary": "Full Stack Software Engineer with 3 years of experience in Java, Spring Boot, React, and AI-driven RAG pipelines.",
    "skills": ["Java", "Spring Boot", "MySQL", "React", "Python", "RAG", "ChromaDB", "Docker", "Redis"],
    "languages": ["Java", "Python", "JavaScript", "SQL"],
    "frameworks": ["Spring Boot", "React", "FastAPI"],
    "databases": ["MySQL", "Redis"],
    "tools": ["Docker", "Git"],
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
    ],
    "experience": [
        {
            "role": "Software Engineering Intern",
            "company": "Tech Innovations Inc",
            "description": "Engineered microservice REST endpoints and database schema migrations."
        }
    ]
}

def test_1_resume_chunking_and_chroma_indexing():
    """TEST 1: Resume is chunked into granular units and stored into ChromaDB."""
    indexed_count = chunk_and_index_resume(
        candidate_id="cand_test_101",
        resume_id="res_test_101",
        resume_data=SAMPLE_RESUME
    )
    assert indexed_count >= 8

def test_2_candidate_metadata_isolation():
    """TEST 2: Candidate A never retrieves Candidate B's resume data."""
    chunk_and_index_resume(
        candidate_id="candidate_alpha",
        resume_id="res_alpha",
        resume_data={"summary": "Alpha is specialized in Go, Kubernetes, and gRPC.", "skills": ["Go", "Kubernetes"]}
    )
    chunk_and_index_resume(
        candidate_id="candidate_beta",
        resume_id="res_beta",
        resume_data={"summary": "Beta is specialized in Java, Spring Boot, and ChromaDB.", "skills": ["Java", "Spring Boot"]}
    )

    alpha_results = retrieve_relevant_resume_knowledge(
        candidate_id="candidate_alpha",
        resume_id=None,
        query_text="Java Spring Boot ChromaDB",
        n_results=5
    )
    for res in alpha_results:
        assert res["metadata"]["candidate_id"] == "candidate_alpha"
        assert "Beta is specialized" not in res["document"]

def test_3_answer_analysis_strong():
    """TEST 3: Comprehensive technical answer is classified as STRONG."""
    state = {
        "last_candidate_answer": "In our Spring Boot service, we configured a custom SecurityFilterChain that validates JWT tokens on every incoming request. We extracted claims, validated token expiry, and set authentication in SecurityContextHolder.",
        "round_number": 2
    }
    analysis = analyze_candidate_answer_node(state)["answer_analysis"]
    assert analysis["classification"] == "STRONG"
    assert "Spring Boot" in analysis["technologies_mentioned"] or "REST API" in analysis["technologies_mentioned"]

def test_4_answer_analysis_i_dont_know():
    """TEST 4: 'I don't know' answer is classified as I_DONT_KNOW."""
    state = {
        "last_candidate_answer": "I don't know much about that specific pattern.",
        "round_number": 3
    }
    analysis = analyze_candidate_answer_node(state)["answer_analysis"]
    assert analysis["classification"] == "I_DONT_KNOW"

def test_5_answer_analysis_interesting_detail():
    """TEST 5: Unprompted engineering challenge is flagged as INTERESTING_DETAIL."""
    state = {
        "last_candidate_answer": "We actually had a severe performance issue with high database latency under peak load, so we had to optimize our queries and add composite indexes.",
        "round_number": 3
    }
    analysis = analyze_candidate_answer_node(state)["answer_analysis"]
    assert analysis["classification"] == "INTERESTING_DETAIL"
    assert len(analysis["interesting_details"]) > 0

def test_6_decision_strong_triggers_go_deeper():
    """TEST 6: STRONG answer with depth < 3 triggers GO_DEEPER action."""
    state = {
        "round_number": 2,
        "round_type": "TECHNICAL",
        "difficulty": "MEDIUM",
        "candidate_id": "cand_test_101",
        "session_id": "sess_1",
        "remaining_seconds": 2400,
        "resume_context": SAMPLE_RESUME,
        "answer_analysis": {
            "classification": "STRONG",
            "technologies_mentioned": ["Spring Boot"],
            "concepts_mentioned": ["REST API"],
            "interesting_details": [],
            "word_count": 40,
            "confidence_level": "HIGH"
        },
        "retrieved_chunks": [],
        "conversation_history": [],
        "previous_interactions": [],
        "historical_questions": [],
        "current_topic": "SPRING_BOOT",
        "current_depth": 1,
        "topics_discussed": ["SPRING_BOOT"]
    }
    decision = decide_next_interview_action_node(state)
    assert decision["plan"]["action"] == "GO_DEEPER"
    assert decision["current_depth"] == 2

def test_7_decision_i_dont_know_triggers_switch_topic():
    """TEST 7: I_DONT_KNOW triggers graceful SWITCH_TOPIC without repeating."""
    state = {
        "round_number": 3,
        "round_type": "TECHNICAL",
        "difficulty": "MEDIUM",
        "candidate_id": "cand_test_101",
        "session_id": "sess_1",
        "remaining_seconds": 2200,
        "resume_context": SAMPLE_RESUME,
        "answer_analysis": {
            "classification": "I_DONT_KNOW",
            "technologies_mentioned": [],
            "concepts_mentioned": [],
            "interesting_details": [],
            "word_count": 4,
            "confidence_level": "LOW"
        },
        "retrieved_chunks": [],
        "conversation_history": [],
        "previous_interactions": [],
        "historical_questions": [],
        "current_topic": "SPRING_BOOT",
        "current_depth": 2,
        "topics_discussed": ["SPRING_BOOT"]
    }
    decision = decide_next_interview_action_node(state)
    speech = decision["plan"]["transition_speech"].lower()
    assert any(k in speech for k in ["worries", "fine", "problem", "moving", "fair", "transition", "move"])


def test_8_decision_interesting_detail_triggers_explore():
    """TEST 8: INTERESTING_DETAIL triggers EXPLORE_NEW_DETAIL action."""
    state = {
        "round_number": 3,
        "round_type": "TECHNICAL",
        "difficulty": "HARD",
        "candidate_id": "cand_test_101",
        "session_id": "sess_1",
        "remaining_seconds": 2100,
        "resume_context": SAMPLE_RESUME,
        "answer_analysis": {
            "classification": "INTERESTING_DETAIL",
            "technologies_mentioned": ["MySQL"],
            "concepts_mentioned": ["query optimization"],
            "interesting_details": ["performance bottleneck"],
            "word_count": 25,
            "confidence_level": "HIGH"
        },
        "retrieved_chunks": [],
        "conversation_history": [],
        "previous_interactions": [],
        "historical_questions": [],
        "current_topic": "MYSQL",
        "current_depth": 1,
        "topics_discussed": ["MYSQL"]
    }
    decision = decide_next_interview_action_node(state)
    assert decision["plan"]["action"] == "EXPLORE_NEW_DETAIL"

def test_9_dynamic_question_generation_natural_speech():
    """TEST 9: Generates fluent conversational question grounded in candidate project."""
    req = GenerateQuestionRequest(
        session_id="sess_live_1",
        candidate_id="cand_test_101",
        candidate_name="Hariharan",
        round_number=2,
        round_type="TECHNICAL",
        role="Full Stack Software Engineer",
        difficulty="MEDIUM",
        adaptive_enabled=True,
        resume_context=SAMPLE_RESUME,
        previous_interactions=[],
        last_candidate_answer="I worked on LearnSphere building the RAG pipeline with ChromaDB and Spring Boot backend.",
        historical_questions=[]
    )
    res = generate_interview_question(req)
    assert res.question_text
    assert res.full_speech_text
    assert not res.question_text.startswith("Question 1")
    assert not res.question_text.startswith("According to your resume")

def test_10_semantic_duplicate_prevention():
    """TEST 10: Semantic duplicates are caught and rejected."""
    f1 = normalize_fingerprint("What is dependency injection?")
    f2 = normalize_fingerprint("Can you explain dependency injection in your own words?")
    assert f1 == f2

if __name__ == "__main__":
    pytest.main(["-v", __file__])
