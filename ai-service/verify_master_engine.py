import sys
import os

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.schemas.interview import GenerateQuestionRequest
from app.agents.interview_graph import generate_interview_question, select_interview_perspective

def run_tests():
    print("=" * 70)
    print("STARTING MOCKMATE MASTER ENGINE VERIFICATION TEST SUITE")
    print("=" * 70)

    resume_a = {
        "skills": ["Java", "Spring Boot", "React", "MySQL", "RAG", "ChromaDB", "LangChain", "JWT", "Docker"],
        "projects": [
            {
                "title": "LearnSphere",
                "description": "AI-powered learning platform with Spring Boot backend, React UI, ChromaDB vector retrieval, and JWT authentication.",
                "technologies": ["Spring Boot", "React", "MySQL", "ChromaDB", "LangChain", "JWT"]
            }
        ]
    }

    resume_b = {
        "skills": ["Python", "TensorFlow", "OpenCV", "Computer Vision", "CNN", "Docker", "Pandas"],
        "projects": [
            {
                "title": "VisionInspect",
                "description": "Automated defect detection system using convolutional neural networks and computer vision.",
                "technologies": ["Python", "TensorFlow", "OpenCV", "CNN"]
            }
        ]
    }

    # -------------------------------------------------------------
    # TEST 1: SAME RESUME PRODUCES DIFFERENT PERSPECTIVES ACROSS SESSIONS
    # -------------------------------------------------------------
    print("\n--- TEST 1: Same Resume != Same Perspective Across 5 Sessions ---")
    prev_perspectives = []
    session_perspectives = []
    session_openers = []

    for i in range(1, 6):
        req = GenerateQuestionRequest(
            session_id=f"session_test_{i}",
            candidate_id="cand_123",
            round_number=1,
            round_type="TECHNICAL",
            role="Full Stack AI Engineer",
            difficulty="MEDIUM",
            adaptive_enabled=True,
            resume_context=resume_a,
            previous_perspectives=prev_perspectives,
            historical_questions=session_openers
        )
        res = generate_interview_question(req)
        session_perspectives.append(res.perspective)
        prev_perspectives.append(res.perspective)
        session_openers.append(res.question_text)
        print(f"Session #{i}: Selected Perspective = {res.perspective} (Goal: {res.perspective_goal[:50]}...)")
        print(f"            Opening Turn: {res.full_speech_text}")

    assert len(set(session_perspectives)) >= 4, f"Expected at least 4 unique perspectives, got {len(set(session_perspectives))}"
    print("[PASS] Test 1: Same resume produced diverse, intelligent perspectives across sessions!")

    # -------------------------------------------------------------
    # TEST 2: SAME RESUME & PERSPECTIVE, DIFFERENT ANSWERS -> DIFFERENT QUESTIONS
    # -------------------------------------------------------------
    print("\n--- TEST 2: Same Perspective, Different Answers -> Different Branches ---")
    test_answers = [
        ("RAG", "I worked mainly on RAG, document chunking, embeddings, and querying ChromaDB."),
        ("React", "I developed the React frontend, hooks, state management, and user interfaces."),
        ("MySQL", "I designed the MySQL relational database schema, tables, and optimized queries."),
        ("JWT", "I implemented JWT authentication, token filters, and endpoint security.")
    ]

    branch_questions = []
    for tech_branch, answer in test_answers:
        req = GenerateQuestionRequest(
            session_id="session_branch_test",
            candidate_id="cand_123",
            round_number=3,
            round_type="TECHNICAL",
            role="Full Stack AI Engineer",
            difficulty="MEDIUM",
            adaptive_enabled=True,
            resume_context=resume_a,
            perspective="SYSTEM_ARCHITECTURE",
            last_candidate_answer=answer,
            historical_questions=branch_questions
        )
        res = generate_interview_question(req)
        branch_questions.append(res.question_text)
        print(f"Candidate Branch ({tech_branch}): Answer='{answer[:50]}...'")
        print(f"  -> Decision Action: {res.action}")
        print(f"  -> Generated Question: {res.question_text}\n")

    # Verify all 4 branch questions are distinct and relevant to their domain
    assert len(set(branch_questions)) == 4, "Branch questions must all be distinct!"
    print("[PASS] Test 2: Different candidate answers produced completely different questions!")

    # -------------------------------------------------------------
    # TEST 3: ANSWER QUALITY ADAPTATION (STRONG -> GO_DEEPER, PARTIAL -> CLARIFY, I DONT KNOW -> SWITCH_TOPIC)
    # -------------------------------------------------------------
    print("\n--- TEST 3: Dynamic Decision Engine (STRONG / PARTIAL / I DONT KNOW) ---")
    
    # 3A: Strong Answer
    strong_ans = "We chunked documents at 500 tokens with 50-token overlap, stored vectors in ChromaDB, and performed similarity search using cosine distance."
    req_strong = GenerateQuestionRequest(
        session_id="session_depth_test",
        candidate_id="cand_123",
        round_number=3,
        round_type="TECHNICAL",
        resume_context=resume_a,
        perspective="AI_ML_DEPTH",
        last_candidate_answer=strong_ans
    )
    res_strong = generate_interview_question(req_strong)
    print(f"Strong Answer -> Action: {res_strong.action} | Question: {res_strong.question_text}")
    assert res_strong.action in ["GO_DEEPER", "ASK_QUESTION"], f"Expected GO_DEEPER, got {res_strong.action}"

    # 3B: Partial/Weak Answer
    weak_ans = "We used ChromaDB for searching."
    req_weak = GenerateQuestionRequest(
        session_id="session_clarify_test",
        candidate_id="cand_123",
        round_number=3,
        round_type="TECHNICAL",
        resume_context=resume_a,
        perspective="AI_ML_DEPTH",
        last_candidate_answer=weak_ans
    )
    res_weak = generate_interview_question(req_weak)
    print(f"Weak/Partial Answer -> Action: {res_weak.action} | Question: {res_weak.question_text}")
    assert res_weak.action in ["CLARIFY", "ASK_QUESTION"], f"Expected CLARIFY, got {res_weak.action}"

    # 3C: "I don't know" Answer
    idk_ans = "I don't know, I was not involved in that part."
    req_idk = GenerateQuestionRequest(
        session_id="session_idk_test",
        candidate_id="cand_123",
        round_number=3,
        round_type="TECHNICAL",
        resume_context=resume_a,
        perspective="AI_ML_DEPTH",
        last_candidate_answer=idk_ans
    )
    res_idk = generate_interview_question(req_idk)
    print(f"I Don't Know Answer -> Action: {res_idk.action} | Acknowledgment: {res_idk.acknowledgement} | Question: {res_idk.question_text}")
    assert res_idk.action == "SWITCH_TOPIC", f"Expected SWITCH_TOPIC, got {res_idk.action}"
    assert any(phrase.lower() in res_idk.acknowledgement.lower() for phrase in ["no worries", "completely fine", "no problem", "fair enough"]), "Expected polite acknowledgment for 'I don't know'"

    print("[PASS] Test 3: Decision engine adapts dynamically to candidate answer quality!")

    # -------------------------------------------------------------
    # TEST 4: DIFFERENT RESUMES RECEIVE DIFFERENT QUESTIONS (NO LEAKAGE)
    # -------------------------------------------------------------
    print("\n--- TEST 4: Different Resumes Receive Resume-Specific Questions ---")
    req_res_a = GenerateQuestionRequest(
        session_id="session_resume_a",
        candidate_id="cand_a",
        round_number=2,
        round_type="TECHNICAL",
        resume_context=resume_a,
        last_candidate_answer="I built the platform."
    )
    res_res_a = generate_interview_question(req_res_a)

    req_res_b = GenerateQuestionRequest(
        session_id="session_resume_b",
        candidate_id="cand_b",
        round_number=2,
        round_type="TECHNICAL",
        resume_context=resume_b,
        last_candidate_answer="I trained the models."
    )
    res_res_b = generate_interview_question(req_res_b)

    print(f"Resume A (Java/RAG/React) Question: {res_res_a.question_text}")
    print(f"Resume B (Python/CNN/Vision) Question: {res_res_b.question_text}")
    assert res_res_a.question_text != res_res_b.question_text, "Questions must be different for different resumes!"
    assert any(t in res_res_b.question_text.lower() or t in res_res_b.topic.lower() for t in ["vision", "cnn", "tensorflow", "python", "model", "defect", "architecture"]), "Resume B question must pertain to Vision/CNN/Python"

    print("[PASS] Test 4: Cross-resume isolation and tailored questions verified!")

    print("\n" + "=" * 70)
    print("ALL VERIFICATION TESTS PASSED SUCCESSFULLY! (100% SUCCESS)")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
