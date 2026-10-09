import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_generate_question():
    payload = {
        "session_id": "test-session-123",
        "candidate_id": "cand-001",
        "round_number": 1,
        "round_type": "TECHNICAL",
        "role": "Java Full Stack Developer",
        "difficulty": "MEDIUM",
        "adaptive_enabled": True,
        "resume_context": {
            "skills": ["Java", "Spring Boot", "MySQL", "React"],
            "projects": [{"name": "LearnSphere", "description": "LMS with Spring Boot and React"}]
        }
    }
    response = client.post("/interview/generate-question", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "question_text" in data
    assert len(data["question_text"]) > 10
    assert "question_category" in data
    assert "question_source" in data

def test_generate_resume_question():
    payload = {
        "session_id": "test-session-123",
        "candidate_id": "cand-001",
        "round_number": 2,
        "round_type": "RESUME",
        "role": "Java Full Stack Developer",
        "difficulty": "MEDIUM",
        "adaptive_enabled": True,
        "resume_context": {
            "skills": ["Java", "Spring Boot", "MySQL", "React"],
            "projects": [{"name": "LearnSphere", "description": "LMS with Spring Boot and React"}]
        }
    }
    response = client.post("/interview/generate-question", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "question_text" in data
    assert "LearnSphere" in data["question_text"] or "resume" in data["question_source"].lower() or "project" in data["question_source"].lower()

def test_evaluate_answer():
    payload = {
        "session_id": "test-session-123",
        "round_type": "TECHNICAL",
        "question_text": "Explain the Spring Bean Lifecycle and @Transactional.",
        "candidate_answer": "In Spring Boot, beans are managed by the ApplicationContext IoC container. They go through instantiation, dependency injection, BeanPostProcessor hooks, and @PostConstruct. @Transactional uses Spring AOP proxies to manage transaction boundaries and roll back on RuntimeExceptions.",
        "ideal_key_points": ["ApplicationContext", "IoC", "AOP Proxy"]
    }
    response = client.post("/interview/evaluate-answer", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["correctness_score"] >= 0.0
    assert data["overall_question_score"] >= 0.0
    assert len(data["feedback"]) > 0
    assert isinstance(data["strengths"], list)
