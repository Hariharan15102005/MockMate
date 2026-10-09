import requests
import uuid

AI_URL = "http://localhost:8000"

RESUME_DATA = {
    "summary": "Full Stack Engineer specializing in Java, Spring Boot, React, MySQL, and RAG pipelines with ChromaDB.",
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
    ]
}

def verify_three_interviews_same_resume():
    candidate_id = "cand_hariharan_novelty_check"
    all_questions_across_interviews = []
    historical_qs = []

    print("\n=======================================================")
    print("SIMULATING 3 FULL INTERVIEWS WITH THE SAME RESUME")
    print("=======================================================")

    for interview_num in range(1, 4):
        session_id = f"sess_attempt_{interview_num}_{uuid.uuid4().hex[:6]}"
        session_history = []
        print(f"\n--- INTERVIEW ATTEMPT {interview_num} ---")

        for r_num in range(1, 5):
            last_ans = None
            if r_num == 2:
                last_ans = "I built the backend with Spring Boot and created the RAG pipeline using ChromaDB."
            elif r_num == 3:
                last_ans = "We generated embeddings with cosine similarity distance search across ChromaDB collections."
            elif r_num == 4:
                last_ans = "We had a slow query issue and resolved it using MySQL composite indexes."

            payload = {
                "session_id": session_id,
                "candidate_id": candidate_id,
                "candidate_name": "Hariharan",
                "round_number": r_num,
                "round_type": "TECHNICAL",
                "role": "Full Stack Software Engineer",
                "difficulty": "MEDIUM",
                "adaptive_enabled": True,
                "resume_context": RESUME_DATA,
                "previous_interactions": session_history,
                "last_candidate_answer": last_ans,
                "historical_questions": historical_qs
            }

            res = requests.post(f"{AI_URL}/interview/generate-question", json=payload).json()
            q_text = res.get("question_text", "")
            action = res.get("action", "")
            source = res.get("question_source", "")

            print(f"  [Q{r_num} - {action}]: {q_text[:90]}... (Source: {source})", flush=True)
            
            all_questions_across_interviews.append(q_text)
            historical_qs.append(q_text)
            session_history.append({"question": q_text, "answer": last_ans or "Introductory response", "score": 8.5})

    print(f"\nTotal questions generated across 3 sessions: {len(all_questions_across_interviews)}")
    distinct_questions = set(all_questions_across_interviews)
    print(f"Distinct questions: {len(distinct_questions)}")
    
    assert len(all_questions_across_interviews) == len(distinct_questions), "Duplicate questions detected across interviews!"
    print("\n[SUCCESS] ZERO DUPLICATE QUESTIONS ACROSS ALL 3 INTERVIEWS WITH THE SAME RESUME!")


if __name__ == "__main__":
    verify_three_interviews_same_resume()
