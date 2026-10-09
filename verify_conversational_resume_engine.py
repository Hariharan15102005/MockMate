import requests
import json
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

def test_conversational_multi_turn_flow():
    print("==================================================")
    print("1. TEST RESUME CHUNKING & CHROMADB RETRIEVAL")
    print("==================================================")
    candidate_id = f"cand_{uuid.uuid4().hex[:8]}"
    session_id = f"sess_{uuid.uuid4().hex[:8]}"
    
    # 1. Round 1: Natural Opener
    req1 = {
        "session_id": session_id,
        "candidate_id": candidate_id,
        "candidate_name": "Hariharan",
        "round_number": 1,
        "round_type": "INTRODUCTION",
        "role": "Full Stack Software Engineer",
        "difficulty": "MEDIUM",
        "adaptive_enabled": True,
        "resume_context": RESUME_DATA,
        "previous_interactions": [],
        "historical_questions": []
    }
    r1 = requests.post(f"{AI_URL}/interview/generate-question", json=req1).json()
    print(f"\n[Turn 1 - Opener]:\nAI Spoken: {r1.get('full_speech_text')}")
    assert "Hariharan" in r1.get('full_speech_text') or "introduce" in r1.get('full_speech_text').lower() or "background" in r1.get('full_speech_text').lower() or "recent" in r1.get('full_speech_text').lower()

    # 2. Candidate answers Turn 1 mentioning LearnSphere and RAG
    ans1 = "Hi! I am Hariharan. I have built full stack applications, and recently I worked on LearnSphere where I built the backend in Spring Boot and implemented the RAG pipeline using ChromaDB for document retrieval."
    
    # 3. Round 2: Technical Question generated from Resume & Candidate Answer
    req2 = {
        "session_id": session_id,
        "candidate_id": candidate_id,
        "candidate_name": "Hariharan",
        "round_number": 2,
        "round_type": "TECHNICAL",
        "role": "Full Stack Software Engineer",
        "difficulty": "MEDIUM",
        "adaptive_enabled": True,
        "resume_context": RESUME_DATA,
        "previous_interactions": [{"question": r1["question_text"], "answer": ans1, "score": 8.5}],
        "last_candidate_answer": ans1,
        "historical_questions": [r1["question_text"]]
    }
    r2 = requests.post(f"{AI_URL}/interview/generate-question", json=req2).json()
    print(f"\n[Turn 2 - Resume Driven Exploration]:\nAI Decision Action: {r2.get('action')}\nAI Spoken: {r2.get('full_speech_text')}")
    assert r2.get("question_text")

    # 4. Turn 3: Candidate gives a STRONG technical answer
    ans2 = "In LearnSphere, when a user asks a question, we convert the query into dense vector embeddings. We then perform cosine similarity search against ChromaDB collections, filtering by course metadata to retrieve relevant chunks and pass them to the LLM."
    req3 = {
        "session_id": session_id,
        "candidate_id": candidate_id,
        "candidate_name": "Hariharan",
        "round_number": 3,
        "round_type": "TECHNICAL",
        "role": "Full Stack Software Engineer",
        "difficulty": "HARD",
        "adaptive_enabled": True,
        "resume_context": RESUME_DATA,
        "previous_interactions": [
            {"question": r1["question_text"], "answer": ans1, "score": 8.5},
            {"question": r2["question_text"], "answer": ans2, "score": 9.0}
        ],
        "last_candidate_answer": ans2,
        "historical_questions": [r1["question_text"], r2["question_text"]]
    }
    r3 = requests.post(f"{AI_URL}/interview/generate-question", json=req3).json()
    print(f"\n[Turn 3 - Deep Dive / Follow-up]:\nAI Decision Action: {r3.get('action')}\nAI Spoken: {r3.get('full_speech_text')}")
    assert r3.get("question_text")

    # 5. Turn 4: Candidate introduces an UNPROMPTED INTERESTING DETAIL
    ans3 = "That approach worked well, but we encountered a severe performance issue with high database query latency when traffic spiked, so we had to optimize our database index structure."
    req4 = {
        "session_id": session_id,
        "candidate_id": candidate_id,
        "candidate_name": "Hariharan",
        "round_number": 4,
        "round_type": "TECHNICAL",
        "role": "Full Stack Software Engineer",
        "difficulty": "HARD",
        "adaptive_enabled": True,
        "resume_context": RESUME_DATA,
        "previous_interactions": [
            {"question": r1["question_text"], "answer": ans1, "score": 8.5},
            {"question": r2["question_text"], "answer": ans2, "score": 9.0},
            {"question": r3["question_text"], "answer": ans3, "score": 9.2}
        ],
        "last_candidate_answer": ans3,
        "historical_questions": [r1["question_text"], r2["question_text"], r3["question_text"]]
    }
    r4 = requests.post(f"{AI_URL}/interview/generate-question", json=req4).json()
    print(f"\n[Turn 4 - Exploring Interesting Detail]:\nAI Decision Action: {r4.get('action')}\nAI Spoken: {r4.get('full_speech_text')}")
    assert "issue" in r4.get("full_speech_text").lower() or "latency" in r4.get("full_speech_text").lower() or "optimize" in r4.get("full_speech_text").lower() or "database" in r4.get("full_speech_text").lower() or "performance" in r4.get("full_speech_text").lower()

    # 6. Turn 5: Candidate responds with "I don't know"
    ans4 = "I don't know the exact internal B-tree rebalancing algorithm used by the storage engine."
    req5 = {
        "session_id": session_id,
        "candidate_id": candidate_id,
        "candidate_name": "Hariharan",
        "round_number": 5,
        "round_type": "TECHNICAL",
        "role": "Full Stack Software Engineer",
        "difficulty": "MEDIUM",
        "adaptive_enabled": True,
        "resume_context": RESUME_DATA,
        "previous_interactions": [
            {"question": r1["question_text"], "answer": ans1, "score": 8.5},
            {"question": r2["question_text"], "answer": ans2, "score": 9.0},
            {"question": r3["question_text"], "answer": ans3, "score": 9.2},
            {"question": r4["question_text"], "answer": ans4, "score": 4.0}
        ],
        "last_candidate_answer": ans4,
        "historical_questions": [r1["question_text"], r2["question_text"], r3["question_text"], r4["question_text"]]
    }
    r5 = requests.post(f"{AI_URL}/interview/generate-question", json=req5).json()
    print(f"\n[Turn 5 - Graceful 'I Don't Know' Transition]:\nAI Decision Action: {r5.get('action')}\nAI Spoken: {r5.get('full_speech_text')}")
    speech5 = r5.get("full_speech_text").lower()
    assert "worries" in speech5 or "fine" in speech5 or "problem" in speech5 or "move" in speech5 or "moving" in speech5 or "another" in speech5

    print("\n==================================================")
    print("CONVERSATIONAL MULTI-TURN VERIFICATION PASSED 100%!")
    print("==================================================")

if __name__ == "__main__":
    test_conversational_multi_turn_flow()
