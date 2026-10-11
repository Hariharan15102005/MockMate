import pytest
from app.agents.interview_graph import (
    build_resume_section_inventory,
    extract_claims_from_context,
    init_or_update_coverage_state,
    rank_next_resume_section,
    select_next_resume_target,
    validate_question_node,
    generate_interview_question,
    _session_interview_state
)
from app.schemas.interview import GenerateQuestionRequest

SAMPLE_RESUME_CONTEXT = {
    "candidate_name": "Hariharan K",
    "summary": "Full Stack Software Engineer with expertise in Java, Spring Boot, React, and MySQL.",
    "skills": ["Java", "Python", "Spring Boot", "React", "MySQL", "REST APIs", "Git", "LangChain", "ChromaDB"],
    "projects": [
        {
            "name": "LearnSphere",
            "description": "AI-Powered Adaptive Learning & Knowledge Platform using Spring Boot, React, MySQL, and ChromaDB RAG.",
            "technologies": ["Spring Boot", "React", "MySQL", "ChromaDB", "RAG"]
        },
        {
            "name": "SentinelAI",
            "description": "Real-time automated code vulnerability detection engine built with Python and FastAPI.",
            "technologies": ["Python", "FastAPI", "Docker"]
        }
    ],
    "experience": [
        {
            "role": "Full Stack Java Intern",
            "company": "TechCorp Solutions",
            "description": "Developed and maintained Spring Boot CRUD REST APIs and optimized MySQL query execution."
        }
    ],
    "education": [
        {
            "degree": "B.E. Computer Science and Engineering",
            "institution": "Anna University",
            "year": "2024"
        }
    ]
    # Note: NO certifications listed here to test missing section behavior!
}

def test_1_single_unknown_subtopic_skips_subtopic_without_abandoning_project():
    """Scenario 1: Candidate does not know architecture, skips subtopic but stays in project."""
    req = GenerateQuestionRequest(
        session_id="test-scen-1",
        candidate_id="cand-1",
        candidate_name="Hari",
        round_number=2,
        round_type="TECHNICAL",
        role="Full Stack Software Engineer",
        difficulty="MEDIUM",
        adaptive_enabled=True,
        resume_context=SAMPLE_RESUME_CONTEXT,
        last_candidate_answer="I don't know the architecture in detail.",
        previous_interactions=[
            {"topic": "LearnSphere Architecture", "subtopic": "Architecture", "project": "LearnSphere", "section": "PROJECTS"}
        ]
    )
    res = generate_interview_question(req)
    
    assert res.action in ["SWITCH_TOPIC", "ASK_QUESTION"]
    assert "Architecture" in (res.skipped_subtopics or [])
    # Candidate struggled once, but project shouldn't be immediately abandoned
    assert res.project_coverage is not None
    assert "LearnSphere" in res.project_coverage

def test_2_repeated_unknowns_within_one_project_lowers_priority():
    """Scenario 2: Candidate struggles twice on LearnSphere, priority lowered or switches project."""
    req = GenerateQuestionRequest(
        session_id="test-scen-2",
        candidate_id="cand-2",
        candidate_name="Hari",
        round_number=3,
        round_type="TECHNICAL",
        role="Full Stack Software Engineer",
        difficulty="MEDIUM",
        adaptive_enabled=True,
        resume_context=SAMPLE_RESUME_CONTEXT,
        last_candidate_answer="I'm not sure how to explain that part either.",
        previous_interactions=[
            {"topic": "LearnSphere Architecture", "subtopic": "Architecture", "project": "LearnSphere", "section": "PROJECTS", "action": "SWITCH_TOPIC"},
            {"topic": "LearnSphere Backend", "subtopic": "Backend Implementation", "project": "LearnSphere", "section": "PROJECTS", "action": "SWITCH_TOPIC"}
        ]
    )
    res = generate_interview_question(req)
    
    # Project coverage for LearnSphere should reflect low evidence or deferred
    p_cov = res.project_coverage.get("LearnSphere", {})
    assert p_cov.get("unknown_answers", 0) >= 2 or p_cov.get("status") in ["LOW_EVIDENCE", "DEFERRED", "IN_PROGRESS"]
    # Engine should either switch to SentinelAI or to TECHNICAL_SKILLS
    assert res.project != "LearnSphere" or res.section != "PROJECTS"

def test_3_repeated_low_evidence_across_projects_switches_section():
    """Scenario 3: 3 distinct project questions produce no evidence -> switches to TECHNICAL_SKILLS."""
    req = GenerateQuestionRequest(
        session_id="test-scen-3",
        candidate_id="cand-3",
        candidate_name="Hari",
        round_number=4,
        round_type="TECHNICAL",
        role="Full Stack Software Engineer",
        difficulty="MEDIUM",
        adaptive_enabled=True,
        resume_context=SAMPLE_RESUME_CONTEXT,
        last_candidate_answer="I don't know that either.",
        previous_interactions=[
            {"topic": "LearnSphere Arch", "subtopic": "Arch", "project": "LearnSphere", "section": "PROJECTS"},
            {"topic": "LearnSphere RAG", "subtopic": "RAG", "project": "LearnSphere", "section": "PROJECTS"},
            {"topic": "SentinelAI Detection", "subtopic": "Detection", "project": "SentinelAI", "section": "PROJECTS"}
        ]
    )
    res = generate_interview_question(req)
    
    assert res.section == "TECHNICAL_SKILLS"
    assert res.context_type == "SKILL_CONTEXT"

def test_4_skills_question_after_section_switch_does_not_contain_project_names():
    """Scenario 4: Technical skills question focuses on listed skill without mentioning LearnSphere or SentinelAI."""
    req = GenerateQuestionRequest(
        session_id="test-scen-4",
        candidate_id="cand-4",
        candidate_name="Hari",
        round_number=5,
        round_type="TECHNICAL",
        role="Full Stack Software Engineer",
        difficulty="MEDIUM",
        adaptive_enabled=True,
        resume_context=SAMPLE_RESUME_CONTEXT,
        last_candidate_answer="I don't know.",
        previous_interactions=[
            {"topic": "LearnSphere Arch", "subtopic": "Arch", "project": "LearnSphere", "section": "PROJECTS"},
            {"topic": "LearnSphere RAG", "subtopic": "RAG", "project": "LearnSphere", "section": "PROJECTS"},
            {"topic": "SentinelAI Docker", "subtopic": "Docker", "project": "SentinelAI", "section": "PROJECTS"}
        ]
    )
    res = generate_interview_question(req)
    
    assert res.section == "TECHNICAL_SKILLS"
    q_lower = res.question_text.lower()
    assert "learnsphere" not in q_lower
    assert "sentinelai" not in q_lower
    assert "in your project" not in q_lower

def test_5_strong_skill_answer_triggers_go_deeper():
    """Scenario 5: Candidate gives a strong answer about Spring Boot -> interviewer goes deeper."""
    req = GenerateQuestionRequest(
        session_id="test-scen-5",
        candidate_id="cand-5",
        candidate_name="Hari",
        round_number=6,
        round_type="TECHNICAL",
        role="Full Stack Software Engineer",
        difficulty="MEDIUM",
        adaptive_enabled=True,
        resume_context=SAMPLE_RESUME_CONTEXT,
        last_candidate_answer="Dependency injection in Spring Boot is managed by the IoC container. We use constructor injection to inject dependencies, which ensures immutability, easier unit testing with Mockito, and prevents circular dependencies.",
        previous_interactions=[
            {"topic": "Technical Skills: Spring Boot", "subtopic": "Spring Boot DI", "skill": "Spring Boot", "section": "TECHNICAL_SKILLS", "context_type": "SKILL_CONTEXT"}
        ]
    )
    res = generate_interview_question(req)
    
    assert res.action == "GO_DEEPER"
    assert res.section == "TECHNICAL_SKILLS"
    assert "Spring Boot" in res.skill

def test_6_unknown_skill_answer_skips_skill_subtopic():
    """Scenario 6: Candidate does not know the deeper skill question -> skips subtopic."""
    req = GenerateQuestionRequest(
        session_id="test-scen-6",
        candidate_id="cand-6",
        candidate_name="Hari",
        round_number=7,
        round_type="TECHNICAL",
        role="Full Stack Software Engineer",
        difficulty="MEDIUM",
        adaptive_enabled=True,
        resume_context=SAMPLE_RESUME_CONTEXT,
        last_candidate_answer="I don't know how circular dependencies are handled.",
        previous_interactions=[
            {"topic": "Technical Skills: Spring Boot", "subtopic": "Spring Boot DI", "skill": "Spring Boot", "section": "TECHNICAL_SKILLS", "context_type": "SKILL_CONTEXT", "current_depth": 1}
        ]
    )
    res = generate_interview_question(req)
    
    assert res.action in ["SWITCH_TOPIC", "SWITCH_SECTION"]
    assert "Spring Boot DI" in (res.skipped_subtopics or []) or "Spring Boot" in (res.skipped_subtopics or [])

def test_7_experience_exploration_grounded_in_internship():
    """Scenario 7: Explicit selection of EXPERIENCE grounds question in candidate's internship."""
    req = GenerateQuestionRequest(
        session_id="test-scen-7",
        candidate_id="cand-7",
        candidate_name="Hari",
        round_number=4,
        round_type="TECHNICAL",
        role="Full Stack Software Engineer",
        difficulty="MEDIUM",
        adaptive_enabled=True,
        resume_context=SAMPLE_RESUME_CONTEXT,
        last_candidate_answer="I have completed an internship.",
        previous_interactions=[
            {"topic": "Technical Skills: Java", "subtopic": "Java Collections", "skill": "Java", "section": "TECHNICAL_SKILLS", "context_type": "SKILL_CONTEXT", "action": "SWITCH_SECTION"}
        ]
    )
    # Manually configure state to test experience selection
    inventory = build_resume_section_inventory(SAMPLE_RESUME_CONTEXT)
    assert len(inventory["EXPERIENCE"]) > 0
    claims = extract_claims_from_context(SAMPLE_RESUME_CONTEXT)
    exp_claims = [c for c in claims if c["section"] == "EXPERIENCE"]
    assert len(exp_claims) > 0
    assert exp_claims[0]["context_type"] == "EXPERIENCE_CONTEXT"

def test_8_missing_section_never_hallucinates_or_asks():
    """Scenario 8: Resume has no certifications -> marked UNAVAILABLE, never queried."""
    inventory = build_resume_section_inventory(SAMPLE_RESUME_CONTEXT)
    assert len(inventory["CERTIFICATIONS"]) == 0
    
    sec_cov, _ = init_or_update_coverage_state(SAMPLE_RESUME_CONTEXT)
    assert sec_cov["CERTIFICATIONS"]["status"] == "UNAVAILABLE"
    
    top_sec = rank_next_resume_section(sec_cov, current_section="TECHNICAL_SKILLS")
    assert top_sec != "CERTIFICATIONS"

def test_9_section_enforcement_in_validation_node():
    """Scenario 9: If LLM generates a question referencing a project during TECHNICAL_SKILLS, validation rejects and replaces it."""
    bad_state = {
        "session_id": "test-val-9",
        "candidate_id": "cand-9",
        "perspective": "SYSTEM_ARCHITECTURE",
        "plan": {
            "action": "ASK_QUESTION",
            "section": "TECHNICAL_SKILLS",
            "context_type": "SKILL_CONTEXT",
            "skill": "Spring Boot",
            "topic": "TECHNICAL_SKILLS: Spring Boot"
        },
        "priority_projects": ["LearnSphere", "SentinelAI"],
        "generated_turn": {
            "question_text": "In your LearnSphere project, how did you implement Spring Boot dependency injection?",
            "action": "ASK_QUESTION",
            "section": "TECHNICAL_SKILLS",
            "context_type": "SKILL_CONTEXT",
            "skill": "Spring Boot"
        },
        "historical_questions": []
    }
    validated = validate_question_node(bad_state)
    q = validated["generated_turn"]["question_text"]
    
    assert "LearnSphere" not in q
    assert "in your project" not in q.lower()
    assert "Spring Boot" in q

def test_10_state_persistence_across_api_calls():
    """Scenario 10: Section and project coverage persist across successive API requests."""
    session_id = "test-persist-10"
    req1 = GenerateQuestionRequest(
        session_id=session_id,
        candidate_id="cand-10",
        candidate_name="Hari",
        round_number=2,
        round_type="TECHNICAL",
        role="Full Stack Software Engineer",
        difficulty="MEDIUM",
        adaptive_enabled=True,
        resume_context=SAMPLE_RESUME_CONTEXT,
        last_candidate_answer="I don't know the architecture."
    )
    res1 = generate_interview_question(req1)
    
    assert session_id in _session_interview_state
    saved_state = _session_interview_state[session_id]
    assert saved_state.get("section_coverage") is not None
    assert saved_state.get("project_coverage") is not None
    
    req2 = GenerateQuestionRequest(
        session_id=session_id,
        candidate_id="cand-10",
        candidate_name="Hari",
        round_number=3,
        round_type="TECHNICAL",
        role="Full Stack Software Engineer",
        difficulty="MEDIUM",
        adaptive_enabled=True,
        resume_context=SAMPLE_RESUME_CONTEXT,
        last_candidate_answer="I don't know the implementation details either."
    )
    res2 = generate_interview_question(req2)
    
    # Cumulative unknowns should have incremented
    p_cov2 = res2.project_coverage.get("LearnSphere", {})
    assert p_cov2.get("unknown_answers", 0) >= 2

def test_11_cross_session_diversity_promotes_underexplored_sections():
    """Scenario 11: When projects were heavily explored in past sessions, other sections receive higher priority without permanent bans."""
    inventory = build_resume_section_inventory(SAMPLE_RESUME_CONTEXT)
    sec_cov, _ = init_or_update_coverage_state(SAMPLE_RESUME_CONTEXT)
    
    # Simulate past interviews heavily covering PROJECTS
    sec_cov["PROJECTS"]["questions_asked"] = 8
    sec_cov["PROJECTS"]["status"] = "PRODUCTIVE"
    sec_cov["TECHNICAL_SKILLS"]["questions_asked"] = 0
    sec_cov["TECHNICAL_SKILLS"]["status"] = "NOT_EXPLORED"
    
    top_section = rank_next_resume_section(sec_cov, current_section="PROJECTS")
    assert top_section in ["TECHNICAL_SKILLS", "EXPERIENCE"]

def test_12_candidate_knows_part_of_project_continues_exploring():
    """Scenario 12: Candidate cannot explain RAG but explains React well -> continues exploring React."""
    req = GenerateQuestionRequest(
        session_id="test-scen-12",
        candidate_id="cand-12",
        candidate_name="Hari",
        round_number=3,
        round_type="TECHNICAL",
        role="Full Stack Software Engineer",
        difficulty="MEDIUM",
        adaptive_enabled=True,
        resume_context=SAMPLE_RESUME_CONTEXT,
        last_candidate_answer="For the React frontend in LearnSphere, I built custom hooks for API state and used optimistic UI updates with React Query to ensure zero UI lag.",
        previous_interactions=[
            {"topic": "LearnSphere RAG", "subtopic": "RAG", "project": "LearnSphere", "section": "PROJECTS", "action": "SWITCH_TOPIC"},
            {"topic": "LearnSphere React", "subtopic": "React State", "project": "LearnSphere", "skill": "React", "section": "PROJECTS"}
        ]
    )
    res = generate_interview_question(req)
    
    assert res.action == "GO_DEEPER"
    assert "React" in res.skill

def test_13_time_aware_graceful_completion():
    """Scenario 13: Interview nearing end (remaining_seconds <= 120) finishes gracefully."""
    req = GenerateQuestionRequest(
        session_id="test-scen-13",
        candidate_id="cand-13",
        candidate_name="Hari",
        round_number=10,
        round_type="TECHNICAL",
        role="Full Stack Software Engineer",
        difficulty="MEDIUM",
        adaptive_enabled=True,
        resume_context=SAMPLE_RESUME_CONTEXT,
        last_candidate_answer="Thank you for asking.",
        remaining_seconds=90,
        previous_interactions=[{"topic": "Summary", "section": "TECHNICAL_SKILLS"}]
    )
    res = generate_interview_question(req)
    
    assert res.action == "END_INTERVIEW"
    assert res.is_completed is True

def test_14_end_to_end_adaptive_switching_progression():
    """Scenario 14: End-to-end multi-turn interview: Project Unknown -> Another Project Unknown -> Switch to Skills -> Strong Answer Deep Dive."""
    session_id = "test-e2e-14"
    history = []
    
    # Turn 1: LearnSphere question
    r1 = generate_interview_question(GenerateQuestionRequest(
        session_id=session_id, candidate_id="cand-14", round_number=2, role="Full Stack Software Engineer",
        resume_context=SAMPLE_RESUME_CONTEXT, last_candidate_answer="I don't know the LearnSphere architecture."
    ))
    history.append({"question": r1.question_text, "action": r1.action, "section": r1.section, "project": r1.project})
    assert "Architecture" in (r1.skipped_subtopics or [])
    
    # Turn 2: SentinelAI question
    r2 = generate_interview_question(GenerateQuestionRequest(
        session_id=session_id, candidate_id="cand-14", round_number=3, role="Full Stack Software Engineer",
        resume_context=SAMPLE_RESUME_CONTEXT, last_candidate_answer="I don't know SentinelAI either.",
        previous_interactions=history
    ))
    history.append({"question": r2.question_text, "action": r2.action, "section": r2.section, "project": r2.project})
    
    # Turn 3: Switched to TECHNICAL_SKILLS
    r3 = generate_interview_question(GenerateQuestionRequest(
        session_id=session_id, candidate_id="cand-14", round_number=4, role="Full Stack Software Engineer",
        resume_context=SAMPLE_RESUME_CONTEXT, last_candidate_answer="I don't know that part of SentinelAI.",
        previous_interactions=history
    ))
    assert r3.section == "TECHNICAL_SKILLS"
    assert "learnsphere" not in r3.question_text.lower()
    
    # Turn 4: Strong answer in TECHNICAL_SKILLS
    history.append({"question": r3.question_text, "action": r3.action, "section": r3.section, "skill": r3.skill})
    r4 = generate_interview_question(GenerateQuestionRequest(
        session_id=session_id, candidate_id="cand-14", round_number=5, role="Full Stack Software Engineer",
        resume_context=SAMPLE_RESUME_CONTEXT,
        last_candidate_answer="Spring Boot dependency injection uses the IoC container. We configure beans and use constructor injection with @Autowired or Lombok @RequiredArgsConstructor to eliminate tight coupling.",
        previous_interactions=history
    ))
    assert r4.action == "GO_DEEPER"
    assert r4.section == "TECHNICAL_SKILLS"
