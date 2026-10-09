import requests
import json
from app.agents.interview_graph import normalize_fingerprint

BASE_URL = "http://localhost:8000"

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

def run_5_interviews_novelty_test():
    print("==============================================")
    print("MOCKMATE DYNAMIC QUESTION ENGINE")
    print("5-INTERVIEW NOVELTY & ANGLE DIVERSITY TEST")
    print("==============================================")

    all_questions = []
    all_topics = []
    all_angles = []
    interview_records = {}
    cumulative_questions = []

    for attempt in range(1, 6):
        attempt_name = f"Interview {chr(64 + attempt)}" # Interview A, B, C, D, E
        attempt_history = []
        attempt_questions = []

        print(f"\n--- {attempt_name} ---")
        for r in range(1, 6):
            payload = {
                "session_id": f"session-{attempt_name.lower().replace(' ', '-')}",
                "candidate_id": "cand-hari",
                "candidate_name": "Hari",
                "round_number": r,
                "round_type": "TECHNICAL",
                "role": "Full Stack Software Engineer",
                "difficulty": "MEDIUM",
                "adaptive_enabled": True,
                "resume_context": RESUME_CONTEXT,
                "previous_interactions": attempt_history,
                "historical_questions": cumulative_questions
            }
            res = requests.post(f"{BASE_URL}/interview/generate-question", json=payload).json()
            q_text = res["question_text"]
            cat = res["question_category"]
            source = res["question_source"]
            
            attempt_questions.append(q_text)
            all_questions.append(q_text)
            all_topics.append(cat)
            all_angles.append(source)
            cumulative_questions.append(q_text)

            safe_source = source.replace("\u2192", "->")
            print(f" Round {r} [{cat} | {safe_source}]:\n  \"{q_text}\"")
            
            attempt_history.append({
                "question": q_text,
                "answer": "In our architecture we use Redis caching with Spring Boot REST APIs and optimize MySQL indexing.",
                "score": 8.0
            })

        interview_records[attempt_name] = attempt_questions

    # Compute Duplicate & Diversity Metrics
    total_q = len(all_questions)
    unique_exact_q = len(set(all_questions))
    exact_duplicate_rate = ((total_q - unique_exact_q) / total_q) * 100.0

    semantic_fps = [normalize_fingerprint(q) for q in all_questions]
    unique_semantic_q = len(set(semantic_fps))
    semantic_duplicate_rate = ((total_q - unique_semantic_q) / total_q) * 100.0

    topic_diversity_count = len(set(all_topics))
    angle_diversity_count = len(set(all_angles))

    print("\n==============================================")
    print("MULTI-INTERVIEW NOVELTY TEST RESULTS")
    print("==============================================")
    print(f"Same Resume Used: YES")
    print(f"Total Questions Generated: {total_q}")
    print(f"Unique Questions (Exact): {unique_exact_q}/{total_q}")
    print(f"Exact Duplicate Rate: {exact_duplicate_rate:.1f}%")
    print(f"Unique Semantic Fingerprints: {unique_semantic_q}/{total_q}")
    print(f"Semantic Duplicate Rate: {semantic_duplicate_rate:.1f}%")
    print(f"Distinct Topics Explored: {topic_diversity_count}")
    print(f"Distinct Angles & Styles Utilized: {angle_diversity_count}")
    print("==============================================")

    assert exact_duplicate_rate == 0.0, "Exact duplicate rate must be 0.0%"
    assert semantic_duplicate_rate == 0.0, "Semantic duplicate rate must be 0.0%"
    assert topic_diversity_count >= 4, "Topic diversity must be HIGH"
    assert angle_diversity_count >= 5, "Angle diversity must be HIGH"

if __name__ == "__main__":
    run_5_interviews_novelty_test()
