import json
from app.agents.interview_graph import (
    generate_interview_question,
    evaluate_candidate_answer,
    extract_candidate_claims,
    normalize_fingerprint,
    QUESTION_BANK
)
from app.schemas.interview import (
    GenerateQuestionRequest,
    EvaluateAnswerRequest
)

def test_interview_intelligence():
    print("=== 1. TESTING RESUME CLAIMS EXTRACTION ===")
    resume_context = {
        "skills": ["Java", "Spring Boot", "SQL", "React", "Python", "FastAPI", "RAG", "ChromaDB", "Docker"],
        "projects": [
            {
                "name": "LearnSphere",
                "technologies": ["Spring Boot", "React", "FastAPI", "RAG", "ChromaDB"],
                "description": "Developed Spring Boot REST APIs and Implemented RAG using ChromaDB for intelligent tutoring."
            }
        ]
    }
    claims = extract_candidate_claims(resume_context)
    print(f"Extracted {len(claims)} claims:")
    for c in claims:
        print(f" - Claim: {c}")
    assert len(claims) > 0, "Should extract claims from resume and projects"

    print("\n=== 2. TESTING FINGERPRINT NORMALIZATION ===")
    f1 = normalize_fingerprint("What is dependency injection in Spring Boot?")
    f2 = normalize_fingerprint("Can you explain dependency injection in Spring Boot?")
    f3 = normalize_fingerprint("Explain what dependency injection means in Spring Boot.")
    print(f"f1: {f1}")
    print(f"f2: {f2}")
    print(f"f3: {f3}")
    assert f1 == f2 == f3, f"Semantic fingerprints should match: {f1} vs {f2} vs {f3}"

    print("\n=== 3. TESTING DIVERSE & UNPREDICTABLE QUESTION GENERATION ACROSS MULTIPLE SESSIONS ===")
    session1_history = []
    session1_questions = []

    # Session 1: 5 Questions
    print("--- Session 1 ---")
    for r in range(1, 6):
        req = GenerateQuestionRequest(
            session_id="test-session-1",
            candidate_id="cand-1",
            candidate_name="Hari",
            round_number=r,
            round_type="TECHNICAL",
            role="Full Stack Software Engineer",
            difficulty="MEDIUM",
            adaptive_enabled=True,
            resume_context=resume_context,
            previous_interactions=session1_history,
            historical_questions=[]
        )
        res = generate_interview_question(req)
        q_text = res.question_text
        cat = res.question_category
        session1_questions.append(q_text)
        session1_history.append({"question": q_text, "answer": "Good detailed technical answer explaining concepts.", "score": 8.5})
        print(f" Q{r} [{cat}]: {q_text}")

    # Session 2: 5 Questions with historical questions from Session 1
    print("\n--- Session 2 (Different sequence, zero duplicates from Session 1) ---")
    session2_history = []
    session2_questions = []
    for r in range(1, 6):
        req = GenerateQuestionRequest(
            session_id="test-session-2",
            candidate_id="cand-1",
            candidate_name="Hari",
            round_number=r,
            round_type="TECHNICAL",
            role="Full Stack Software Engineer",
            difficulty="MEDIUM",
            adaptive_enabled=True,
            resume_context=resume_context,
            previous_interactions=session2_history,
            historical_questions=session1_questions
        )
        res = generate_interview_question(req)
        q_text = res.question_text
        cat = res.question_category
        session2_questions.append(q_text)
        session2_history.append({"question": q_text, "answer": "Explanation of system scalability.", "score": 8.0})
        print(f" Q{r} [{cat}]: {q_text}")

    # Verify zero duplicates across Session 1 and Session 2
    session1_fps = {normalize_fingerprint(q) for q in session1_questions}
    session2_fps = {normalize_fingerprint(q) for q in session2_questions}
    intersection = session1_fps.intersection(session2_fps)
    print(f"\nDuplicate questions between Session 1 & 2: {len(intersection)}")
    assert len(intersection) == 0, f"Found duplicates across sessions: {intersection}"

    print("\n=== 4. TESTING EVIDENCE-BASED 7-CRITERIA ANSWER EVALUATION ===")
    eval_req = EvaluateAnswerRequest(
        session_id="test-session-1",
        round_type="TECHNICAL",
        question_text="Why did you choose ChromaDB for the LearnSphere RAG pipeline, and how does your vector retrieval handle similarity searches?",
        candidate_answer="We chose ChromaDB because of its lightweight embedded architecture and fast HNSW indexing. For retrieval, we embed candidate query chunks using text-embedding models, calculate cosine distance against stored vector embeddings, and return top-k semantic matches with metadata filtering.",
        ideal_key_points=["ChromaDB embedded vector store", "Cosine similarity / HNSW", "Top-k retrieval", "Metadata filtering"]
    )
    eval_res = evaluate_candidate_answer(eval_req)
    print("Evaluation Results:")
    print(f" - Overall Score: {eval_res.overall_question_score}/10")
    print(f" - Correctness: {eval_res.correctness_score}/10")
    print(f" - Technical Depth: {eval_res.depth_score}/10")
    print(f" - Relevance: {eval_res.relevance_score}/10")
    print(f" - Communication: {eval_res.communication_score}/10")
    print(f" - Feedback: {eval_res.feedback}")
    print(f" - Strengths: {eval_res.strengths}")
    print(f" - Improvements: {eval_res.improvements}")
    assert eval_res.overall_question_score >= 7.0, "Detailed strong answer should receive high score with concrete evidence"

    print("\n=== ALL AI INTERVIEW INTELLIGENCE TESTS PASSED! ===")

if __name__ == "__main__":
    test_interview_intelligence()
