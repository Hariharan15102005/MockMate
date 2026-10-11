import pytest
from app.agents.interview_graph import (
    classify_candidate_answer,
    enforce_interview_decision,
    select_next_alternative_topic,
    generate_interview_question,
    ConversationalInterviewState,
    _session_interview_state
)
from app.schemas.interview import GenerateQuestionRequest

SAMPLE_RESUME = {
    "projects": [
        {
            "title": "LearnSphere",
            "description": "Educational platform with Spring Boot backend, MySQL relational database, and React UI.",
            "technologies": ["Spring Boot", "MySQL", "React", "JWT"]
        },
        {
            "title": "AI Document Assistant",
            "description": "RAG pipeline querying ChromaDB for vector retrieval and embedding similarity.",
            "technologies": ["RAG", "ChromaDB", "Python"]
        }
    ],
    "skills": ["Spring Boot", "React", "MySQL", "JWT", "RAG", "ChromaDB"]
}

def test_1_explicit_unknown():
    """Test 1: Explicit unknown causes immediate SWITCH_TOPIC away from vector similarity."""
    ans = "I don't know."
    analysis = classify_candidate_answer(ans)
    assert analysis["classification"] == "EXPLICIT_UNKNOWN"
    assert analysis["is_explicit_unknown"] is True

    state: ConversationalInterviewState = {
        "session_id": "test_sess_1",
        "current_topic": "RAG",
        "current_subtopic": "Vector Similarity",
        "clarification_attempted": False,
        "current_depth": 1,
        "skipped_subtopics": [],
        "unknown_topics": [],
        "exhausted_topics": [],
        "topics_discussed": ["RAG"],
        "resume_context": SAMPLE_RESUME
    }
    decision = enforce_interview_decision(state, analysis, proposed_action="GO_DEEPER")
    assert decision["action"] == "SWITCH_TOPIC"
    assert decision["allow_same_topic_follow_up"] is False
    assert decision["reason_code"] == "EXPLICIT_UNKNOWN"

def test_2_informal_unknown():
    """Test 2: Informal unknown phrase like 'Don't know bro' triggers immediate topic switch."""
    ans = "Don't know bro."
    analysis = classify_candidate_answer(ans)
    assert analysis["classification"] == "EXPLICIT_UNKNOWN"
    assert analysis["is_explicit_unknown"] is True

    state = {
        "current_topic": "RAG",
        "current_subtopic": "Vector Similarity",
        "clarification_attempted": False,
        "current_depth": 1
    }
    decision = enforce_interview_decision(state, analysis)
    assert decision["action"] == "SWITCH_TOPIC"
    assert decision["allow_same_topic_follow_up"] is False

def test_3_no_implementation_ownership():
    """Test 3: Candidate did not implement module -> NOT_IMPLEMENTED_BY_CANDIDATE and SWITCH_TOPIC."""
    ans = "I didn't implement that module, another team member handled it."
    analysis = classify_candidate_answer(ans)
    assert analysis["classification"] == "NOT_IMPLEMENTED_BY_CANDIDATE"
    assert analysis["not_implemented"] is True

    state = {
        "current_topic": "MySQL",
        "current_subtopic": "Transactions",
        "clarification_attempted": False,
        "current_depth": 1
    }
    decision = enforce_interview_decision(state, analysis)
    assert decision["action"] == "SWITCH_TOPIC"
    assert decision["allow_same_topic_follow_up"] is False
    assert decision["reason_code"] == "NOT_IMPLEMENTED_BY_CANDIDATE"

def test_4_partial_answer_clarify_once():
    """Test 4: Concise/partial answer gives one focused clarification."""
    ans = "We used JWT."
    analysis = classify_candidate_answer(ans)
    assert analysis["classification"] == "PARTIAL"

    state = {
        "current_topic": "JWT",
        "current_subtopic": "Authentication",
        "clarification_attempted": False,
        "current_depth": 1
    }
    decision = enforce_interview_decision(state, analysis)
    assert decision["action"] == "CLARIFY"
    assert decision["allow_same_topic_follow_up"] is True
    assert decision["clarification_attempted"] is True

def test_5_partial_answer_then_unknown_switches():
    """Test 5: After 1 clarification, uncertain or weak answer immediately switches."""
    ans_1 = "We used JWT."
    analysis_1 = classify_candidate_answer(ans_1)
    state = {
        "current_topic": "JWT",
        "current_subtopic": "Token Validation",
        "clarification_attempted": False,
        "current_depth": 1
    }
    decision_1 = enforce_interview_decision(state, analysis_1)
    assert decision_1["action"] == "CLARIFY"

    # Turn 2: Clarification was attempted, candidate says "I'm not sure."
    ans_2 = "I'm not sure."
    analysis_2 = classify_candidate_answer(ans_2)
    state_turn2 = {
        "current_topic": "JWT",
        "current_subtopic": "Token Validation",
        "clarification_attempted": True,
        "current_depth": 2
    }
    decision_2 = enforce_interview_decision(state_turn2, analysis_2)
    assert decision_2["action"] == "SWITCH_TOPIC"
    assert decision_2["allow_same_topic_follow_up"] is False

def test_6_strong_answer_rewards_depth():
    """Test 6: Strong answer rewards with GO_DEEPER."""
    ans = ("In our backend, incoming requests pass through a JwtAuthenticationFilter where we extract the Bearer token, "
           "validate signature against the secret key using JJWT, verify claims and expiration, and set the SecurityContextHolder.")
    analysis = classify_candidate_answer(ans)
    assert analysis["classification"] == "STRONG"

    state = {
        "current_topic": "JWT",
        "current_subtopic": "Token Validation",
        "clarification_attempted": False,
        "current_depth": 1
    }
    decision = enforce_interview_decision(state, analysis)
    assert decision["action"] == "GO_DEEPER"
    assert decision["allow_same_topic_follow_up"] is True

def test_7_vague_answer_twice_switches():
    """Test 7: Vague answer twice exhausts clarification budget and switches topic."""
    ans_1 = "It just retrieves the right documents."
    analysis_1 = classify_candidate_answer(ans_1)
    assert analysis_1["classification"] in ["WEAK", "VAGUE", "PARTIAL"]

    # First vague answer gets CLARIFY
    state_turn1 = {
        "current_topic": "RAG",
        "current_subtopic": "Retrieval",
        "clarification_attempted": False,
        "current_depth": 1
    }
    decision_1 = enforce_interview_decision(state_turn1, analysis_1)
    assert decision_1["action"] == "CLARIFY"

    # Second vague answer exhausts budget and SWITCHES
    ans_2 = "The AI decides which ones are useful."
    analysis_2 = classify_candidate_answer(ans_2)
    state_turn2 = {
        "current_topic": "RAG",
        "current_subtopic": "Retrieval",
        "clarification_attempted": True,
        "current_depth": 2
    }
    decision_2 = enforce_interview_decision(state_turn2, analysis_2)
    assert decision_2["action"] == "SWITCH_TOPIC"
    assert decision_2["reason_code"] == "CLARIFICATION_BUDGET_EXHAUSTED"

def test_8_different_topic_selected_from_resume():
    """Test 8: Selects an unexplored resume topic (Spring Boot, React, MySQL) when RAG is unknown."""
    state: ConversationalInterviewState = {
        "session_id": "test_sess_8",
        "current_topic": "RAG",
        "current_subtopic": "Vector Similarity",
        "skipped_subtopics": ["Vector Similarity", "RAG"],
        "unknown_topics": ["Vector Similarity", "RAG"],
        "exhausted_topics": [],
        "topics_discussed": ["RAG"],
        "resume_context": SAMPLE_RESUME
    }
    alt = select_next_alternative_topic(state, current_topic="RAG", current_subtopic="Vector Similarity", current_skill="RAG")
    assert alt["action"] == "SWITCH_TOPIC"
    assert alt["skill"] != "RAG"
    assert alt["skill"] in ["Spring Boot", "MySQL", "React", "JWT"]

def test_9_state_persistence_across_api_calls():
    """Test 9: State persists turn-to-turn across distinct API calls with session_id."""
    session_id = "test_persistence_sess_9"
    _session_interview_state.pop(session_id, None)

    # Round 1: Candidate says I don't know to RAG
    req_1 = GenerateQuestionRequest(
        session_id=session_id,
        candidate_id="cand_1",
        round_number=2,
        resume_context=SAMPLE_RESUME,
        last_candidate_answer="I don't know."
    )
    res_1 = generate_interview_question(req_1)
    assert res_1.action == "SWITCH_TOPIC"
    assert "Vector" not in res_1.question_text
    # Check that skipped topic is preserved in session store
    assert session_id in _session_interview_state
    saved_state = _session_interview_state[session_id]
    assert len(saved_state["skipped_subtopics"]) > 0

    # Round 2: Follow-up call in same session remembers skipped subtopic!
    req_2 = GenerateQuestionRequest(
        session_id=session_id,
        candidate_id="cand_1",
        round_number=3,
        resume_context=SAMPLE_RESUME,
        last_candidate_answer="In our system, we structure controllers, services, and repositories with transactional boundaries."
    )
    res_2 = generate_interview_question(req_2)
    # The new topic is explored normally (clarify or go deeper based on depth), and skipped subtopics persisted!
    assert res_2.action in ["CLARIFY", "GO_DEEPER", "ASK_QUESTION"]
    assert len(res_2.skipped_subtopics) > 0

def test_10_llm_contradiction_enforcement():
    """Test 10: Even if an LLM proposed GO_DEEPER for an explicit unknown, code forces SWITCH_TOPIC."""
    ans = "I have no idea."
    analysis = classify_candidate_answer(ans)
    state = {
        "current_topic": "RAG",
        "current_subtopic": "Embeddings",
        "clarification_attempted": False,
        "current_depth": 1
    }
    # LLM proposed GO_DEEPER
    decision = enforce_interview_decision(state, analysis, proposed_action="GO_DEEPER")
    assert decision["action"] == "SWITCH_TOPIC"
    assert decision["allow_same_topic_follow_up"] is False

def test_11_semantic_repetition_rejected():
    """Test 11: Validation rejects question about skipped subtopic if it mentions vector/similarity."""
    from app.agents.interview_graph import validate_question_node

    state: ConversationalInterviewState = {
        "session_id": "test_sess_11",
        "candidate_id": "cand_1",
        "skipped_subtopics": ["Vector Similarity", "RAG"],
        "plan": {
            "action": "SWITCH_TOPIC",
            "topic": "Spring Boot",
            "skill": "Spring Boot",
            "project": "LearnSphere",
            "transition_speech": "Let's move on."
        },
        "generated_turn": {
            "action": "SWITCH_TOPIC",
            "question_text": "How does vector similarity search work in your embeddings?",
            "full_speech_text": "How does vector similarity search work in your embeddings?",
            "semantic_fingerprint": "vector similarity search embeddings"
        }
    }
    res = validate_question_node(state)
    validated_turn = res["generated_turn"]
    # Must be replaced because it contained 'vector' / 'similarity'!
    assert "vector" not in validated_turn["question_text"].lower()
    assert "Spring Boot" in validated_turn["question_text"]

def test_12_genuine_topic_switch():
    """Test 12: A genuine topic switch targets an alternative resume skill (Spring Boot)."""
    state: ConversationalInterviewState = {
        "session_id": "test_sess_12",
        "current_topic": "RAG",
        "current_subtopic": "Vector Retrieval",
        "skipped_subtopics": ["Vector Retrieval", "RAG"],
        "unknown_topics": ["Vector Retrieval", "RAG"],
        "exhausted_topics": [],
        "topics_discussed": ["RAG"],
        "resume_context": SAMPLE_RESUME
    }
    alt = select_next_alternative_topic(state, current_topic="RAG", current_subtopic="Vector Retrieval", current_skill="RAG")
    assert alt["skill"] != "RAG"
    assert alt["skill"] in ["Spring Boot", "MySQL", "React", "JWT"]

def test_13_strong_answer_after_switching():
    """Test 13: Once candidate switches to Spring Boot and answers strongly, system goes deeper."""
    session_id = "test_sess_13"
    _session_interview_state[session_id] = {
        "current_topic": "Spring Boot",
        "current_subtopic": "REST Controllers & Services",
        "current_depth": 1,
        "clarification_attempted": False,
        "follow_up_count": 0,
        "skipped_subtopics": ["RAG"],
        "unknown_topics": ["RAG"],
        "exhausted_topics": [],
        "topics_discussed": ["RAG", "Spring Boot"]
    }
    strong_ans = ("We designed a layered architecture with @RestController handling HTTP endpoints, "
                  "@Service containing core business logic and transaction boundaries with @Transactional, "
                  "and Spring Data JPA repositories with query optimization for database persistence.")
    req = GenerateQuestionRequest(
        session_id=session_id,
        candidate_id="cand_1",
        round_number=3,
        resume_context=SAMPLE_RESUME,
        last_candidate_answer=strong_ans
    )
    res = generate_interview_question(req)
    assert res.action == "GO_DEEPER"
    assert res.skill == "Spring Boot"

def test_14_no_alternative_topic_graceful_end():
    """Test 14: When all resume topics are exhausted or skipped, end the interview gracefully."""
    state: ConversationalInterviewState = {
        "session_id": "test_sess_14",
        "current_topic": "JWT",
        "current_subtopic": "Security",
        "skipped_subtopics": ["rag", "chromadb", "spring boot", "react", "mysql", "jwt", "redis"],
        "unknown_topics": ["rag", "chromadb", "spring boot", "react", "mysql", "jwt", "redis"],
        "exhausted_topics": ["rag", "chromadb", "spring boot", "react", "mysql", "jwt", "redis"],
        "topics_discussed": ["RAG", "ChromaDB", "Spring Boot", "React", "MySQL", "JWT", "Redis"],
        "resume_context": SAMPLE_RESUME
    }
    alt = select_next_alternative_topic(state, current_topic="JWT", current_subtopic="Security", current_skill="JWT")
    assert alt["action"] == "END_INTERVIEW"
    assert alt["topic"] == "CLOSING"

def test_15_nuanced_partial_contrast():
    """Test 15: Nuanced contrastive answer with technical concepts is PARTIAL, not EXPLICIT_UNKNOWN."""
    ans = "I don't know whether we used HNSW or IVF, but I know we stored the embeddings in ChromaDB."
    analysis = classify_candidate_answer(ans)
    assert analysis["classification"] == "PARTIAL"
    assert analysis["is_explicit_unknown"] is False
    assert "ChromaDB" in analysis["technologies_mentioned"]
