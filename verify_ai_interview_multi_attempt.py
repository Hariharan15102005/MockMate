import requests

BASE_URL = "http://localhost:8000"

def test_multi_attempt_ai_intelligence():
    print("=== MULTI-ATTEMPT AI INTERVIEW INTELLIGENCE TEST ===")
    
    resume_context = {
        "skills": ["Java", "Spring Boot", "SQL", "React", "Python", "RAG", "ChromaDB", "Docker"],
        "projects": [
            {
                "name": "LearnSphere",
                "technologies": ["Spring Boot", "React", "FastAPI", "RAG", "ChromaDB"],
                "description": "Architected intelligent LMS platform with Spring Boot REST APIs and ChromaDB vector retrieval."
            }
        ]
    }

    # Attempt 1
    print("\n--- ATTEMPT 1: 5 Questions ---")
    attempt1_questions = []
    attempt1_history = []
    for r in range(1, 6):
        res = requests.post(f"{BASE_URL}/interview/generate-question", json={
            "session_id": "attempt-1",
            "candidate_id": "candidate-hari",
            "candidate_name": "Hari",
            "round_number": r,
            "round_type": "TECHNICAL",
            "role": "Full Stack Software Engineer",
            "difficulty": "MEDIUM",
            "adaptive_enabled": True,
            "resume_context": resume_context,
            "previous_interactions": attempt1_history,
            "historical_questions": []
        }).json()
        q_text = res["question_text"]
        cat = res["question_category"]
        attempt1_questions.append(q_text)
        attempt1_history.append({"question": q_text, "answer": "I used Spring Boot with JPA and Redis for caching.", "score": 8.0})
        print(f" Round {r} [{cat}]: {q_text}")

    # Attempt 2 (Passes all attempt 1 questions in historical_questions)
    print("\n--- ATTEMPT 2: 5 Questions (Historical Avoidance + Unpredictable Path) ---")
    attempt2_questions = []
    attempt2_history = []
    for r in range(1, 6):
        res = requests.post(f"{BASE_URL}/interview/generate-question", json={
            "session_id": "attempt-2",
            "candidate_id": "candidate-hari",
            "candidate_name": "Hari",
            "round_number": r,
            "round_type": "TECHNICAL",
            "role": "Full Stack Software Engineer",
            "difficulty": "MEDIUM",
            "adaptive_enabled": True,
            "resume_context": resume_context,
            "previous_interactions": attempt2_history,
            "historical_questions": attempt1_questions
        }).json()
        q_text = res["question_text"]
        cat = res["question_category"]
        attempt2_questions.append(q_text)
        attempt2_history.append({"question": q_text, "answer": "Detailed explanation of React Fiber reconciliation.", "score": 8.2})
        print(f" Round {r} [{cat}]: {q_text}")

    # Attempt 3 (Passes attempt 1 + attempt 2 in historical_questions)
    print("\n--- ATTEMPT 3: 5 Questions (Untested Skills + New Challenges) ---")
    attempt3_questions = []
    attempt3_history = []
    for r in range(1, 6):
        res = requests.post(f"{BASE_URL}/interview/generate-question", json={
            "session_id": "attempt-3",
            "candidate_id": "candidate-hari",
            "candidate_name": "Hari",
            "round_number": r,
            "round_type": "TECHNICAL",
            "role": "Full Stack Software Engineer",
            "difficulty": "MEDIUM",
            "adaptive_enabled": True,
            "resume_context": resume_context,
            "previous_interactions": attempt3_history,
            "historical_questions": attempt1_questions + attempt2_questions
        }).json()
        q_text = res["question_text"]
        cat = res["question_category"]
        attempt3_questions.append(q_text)
        attempt3_history.append({"question": q_text, "answer": "Explaining database isolation levels and locks.", "score": 8.5})
        print(f" Round {r} [{cat}]: {q_text}")

    # Deduplication Check
    all_q = attempt1_questions + attempt2_questions + attempt3_questions
    print(f"\nTotal questions generated across 3 attempts: {len(all_q)}")
    unique_q = set(all_q)
    print(f"Unique questions: {len(unique_q)}")
    assert len(all_q) == len(unique_q), f"Found duplicates across attempts! {len(all_q) - len(unique_q)} duplicates."
    print("Zero question repetition verified across all 3 attempts!")

if __name__ == "__main__":
    test_multi_attempt_ai_intelligence()
