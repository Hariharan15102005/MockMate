import pytest
from app.schemas.interview import AnalyzeInterviewSessionRequest, PostInterviewAnalysisResponse
from app.services.session_analysis_service import analyze_completed_interview_session

def test_analyze_completed_interview_session_deterministic():
    request = AnalyzeInterviewSessionRequest(
        session_id="test-session-1234",
        candidate_name="Hariharan K",
        target_role="Full Stack Software Engineer",
        interview_title="AI Resume Comprehensive Mock Interview",
        duration_seconds=1800,
        resume_context={
            "skills": ["Java", "Spring Boot", "React", "PostgreSQL", "Docker"],
            "projects": [
                {
                    "title": "AgentHire AI Interview Platform",
                    "description": "Full-stack AI mock interviewing engine built with Spring Boot and FastAPI."
                }
            ]
        },
        transcript=[
            {
                "questionText": "Can you explain how the Spring IoC container manages beans and dependency injection?",
                "answerText": "The Spring ApplicationContext loads bean definitions, instantiates beans through reflection, and injects dependencies via constructor injection. It manages singletons and applies proxies for cross-cutting concerns like transactions.",
                "score": 8.5,
                "feedback": "Strong answer covering bean lifecycle and IoC container.",
                "roundType": "TECHNICAL"
            },
            {
                "questionText": "In your AgentHire project, what was the data flow and how did you scale database read queries?",
                "answerText": "Client requests route through our Spring Boot API gateway. We used PostgreSQL with read replicas and HikariCP connection pooling to prevent starvation under heavy load.",
                "score": 8.0,
                "feedback": "Good explanation of architecture and database connection tuning.",
                "roundType": "SYSTEM_DESIGN"
            },
            {
                "questionText": "How would you diagnose and resolve a deadlock in a high-concurrency transactional service?",
                "answerText": "[no_answer - response timeout]",
                "score": 1.5,
                "feedback": "No spoken response detected within 10-second window.",
                "roundType": "TECHNICAL"
            }
        ]
    )

    response = analyze_completed_interview_session(request)

    assert isinstance(response, PostInterviewAnalysisResponse)
    assert response.session_id == "test-session-1234"
    assert 0.0 <= response.overall_score <= 100.0

    # Verify 6 category scores
    categories = [c.category for c in response.category_scores]
    expected_categories = [
        "Technical Knowledge",
        "Project Understanding",
        "Problem-Solving Ability",
        "Communication and Clarity",
        "Answer Structure",
        "Practical Implementation Knowledge"
    ]
    for exp in expected_categories:
        assert exp in categories

    # Verify strengths (grounded)
    assert len(response.strengths) >= 1
    for s in response.strengths:
        assert s.skill_or_topic
        assert s.demonstrated_behavior_or_answer
        assert s.why_effective
        assert s.how_to_leverage

    # Verify weaknesses (question, what went wrong, what expected, how to improve, example answer, priority)
    assert len(response.weaknesses) >= 1
    critical_or_high = [w for w in response.weaknesses if w.priority in ["Critical", "High"]]
    assert len(critical_or_high) >= 1
    w = response.weaknesses[0]
    assert w.question
    assert w.candidate_answer_summary
    assert w.what_went_wrong
    assert w.what_expected
    assert w.how_to_improve
    assert w.example_improved_answer
    assert w.priority in ["Critical", "High", "Medium", "Low"]

    # Verify project analysis
    assert len(response.project_analysis) >= 1
    pa = response.project_analysis[0]
    assert pa.project_name
    assert pa.problem_solving_clarity
    assert pa.architecture_and_data_flow

    # Verify skills gap matrix
    assert len(response.skills_gap_matrix) >= 3
    levels = {sk.demonstrated_level for sk in response.skills_gap_matrix}
    assert "Not Assessed" in levels or "Strong" in levels

    # Verify 7-day roadmap
    assert len(response.improvement_roadmap) == 4
    assert response.improvement_roadmap[0].day_range == "Day 1"
    assert response.improvement_roadmap[1].day_range == "Days 2-3"
    assert response.improvement_roadmap[2].day_range == "Days 4-5"
    assert response.improvement_roadmap[3].day_range == "Days 6-7"
    for day in response.improvement_roadmap:
        assert len(day.tasks) >= 1
        for t in day.tasks:
            assert t.topic
            assert t.learning_outcome
            assert t.practical_activity

    # Verify question review
    assert len(response.question_reviews) == 3
    for qr in response.question_reviews:
        assert qr.question_text
        assert qr.suggested_improved_answer
        assert qr.performance_assessment

    # Verify weak topics for practice
    assert len(response.weak_topics_for_practice) >= 1
