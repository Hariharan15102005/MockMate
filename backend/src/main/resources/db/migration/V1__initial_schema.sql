-- =========================================================================
-- AgentHire Platform Initial Relational Database Schema
-- Version: 1.0.0
-- Database: MySQL 8.0+ Compatible
-- =========================================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
);

-- 2. Candidates Table
CREATE TABLE IF NOT EXISTS candidates (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    location VARCHAR(100),
    college VARCHAR(150),
    degree VARCHAR(100),
    department VARCHAR(100),
    graduation_year INT,
    cgpa DOUBLE,
    experience_level VARCHAR(50),
    applied_role VARCHAR(100) NOT NULL,
    application_id VARCHAR(100) UNIQUE,
    source VARCHAR(50),
    status VARCHAR(40) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    engineer_notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_candidate_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_candidate_email (email),
    INDEX idx_candidate_status (status),
    INDEX idx_candidate_applied_role (applied_role),
    INDEX idx_candidate_application_id (application_id)
);

-- 3. Interview Engineers Table
CREATE TABLE IF NOT EXISTS interview_engineers (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    employee_code VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(100),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ie_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    INDEX idx_ie_employee_code (employee_code),
    INDEX idx_ie_user_id (user_id)
);

-- 4. Instructors Table
CREATE TABLE IF NOT EXISTS instructors (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,
    employee_code VARCHAR(50) NOT NULL UNIQUE,
    department VARCHAR(100),
    specialization VARCHAR(150),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_inst_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
    INDEX idx_inst_employee_code (employee_code),
    INDEX idx_inst_user_id (user_id)
);

-- 5. Resumes Table
CREATE TABLE IF NOT EXISTS resumes (
    id VARCHAR(36) PRIMARY KEY,
    candidate_id VARCHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) DEFAULT 'application/pdf',
    file_size BIGINT,
    uploaded_by VARCHAR(36),
    uploaded_at TIMESTAMP,
    version INT NOT NULL DEFAULT 1,
    is_current BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_resume_candidate FOREIGN KEY (candidate_id) REFERENCES candidates (id) ON DELETE CASCADE,
    CONSTRAINT fk_resume_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_resume_candidate (candidate_id),
    INDEX idx_resume_is_current (is_current)
);

-- 6. Resume Analysis Table
CREATE TABLE IF NOT EXISTS resume_analysis (
    id VARCHAR(36) PRIMARY KEY,
    resume_id VARCHAR(36) NOT NULL UNIQUE,
    summary TEXT,
    skills_json TEXT,
    languages_json TEXT,
    frameworks_json TEXT,
    databases_json TEXT,
    tools_json TEXT,
    projects_json TEXT,
    internships_json TEXT,
    experience_json TEXT,
    education_json TEXT,
    certifications_json TEXT,
    strength_areas_json TEXT,
    question_areas_json TEXT,
    analyzed_at TIMESTAMP,
    analysis_version VARCHAR(20) DEFAULT '1.0.0',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ra_resume FOREIGN KEY (resume_id) REFERENCES resumes (id) ON DELETE CASCADE,
    INDEX idx_resume_analysis_resume (resume_id)
);

-- 7. Candidate Assignments Table (Engineer -> Instructor)
CREATE TABLE IF NOT EXISTS candidate_assignments (
    id VARCHAR(36) PRIMARY KEY,
    candidate_id VARCHAR(36) NOT NULL,
    interview_engineer_id VARCHAR(36) NOT NULL,
    instructor_id VARCHAR(36) NOT NULL,
    applied_role VARCHAR(100) NOT NULL,
    interview_type VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    engineer_message TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    assigned_at TIMESTAMP,
    accepted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ca_candidate FOREIGN KEY (candidate_id) REFERENCES candidates (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ca_engineer FOREIGN KEY (interview_engineer_id) REFERENCES interview_engineers (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ca_instructor FOREIGN KEY (instructor_id) REFERENCES instructors (id) ON DELETE RESTRICT,
    INDEX idx_ca_candidate (candidate_id),
    INDEX idx_ca_engineer (interview_engineer_id),
    INDEX idx_ca_instructor (instructor_id),
    INDEX idx_ca_status (status)
);

-- 8. Interviews Table
CREATE TABLE IF NOT EXISTS interviews (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    target_role VARCHAR(100) NOT NULL,
    experience_level VARCHAR(50),
    duration_minutes INT NOT NULL DEFAULT 60,
    difficulty VARCHAR(30) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    created_by VARCHAR(36) NOT NULL,
    published_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_interview_created_by FOREIGN KEY (created_by) REFERENCES instructors (id) ON DELETE RESTRICT,
    INDEX idx_interview_status (status),
    INDEX idx_interview_target_role (target_role),
    INDEX idx_interview_created_by (created_by)
);

-- 9. Interview Scoring Configs Table
CREATE TABLE IF NOT EXISTS interview_scoring_configs (
    id VARCHAR(36) PRIMARY KEY,
    interview_id VARCHAR(36) NOT NULL UNIQUE,
    technical_weight INT NOT NULL DEFAULT 25,
    coding_weight INT NOT NULL DEFAULT 20,
    problem_solving_weight INT NOT NULL DEFAULT 15,
    communication_weight INT NOT NULL DEFAULT 10,
    learning_weight INT NOT NULL DEFAULT 10,
    behavioral_weight INT NOT NULL DEFAULT 10,
    time_constrained_weight INT NOT NULL DEFAULT 10,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_isc_interview FOREIGN KEY (interview_id) REFERENCES interviews (id) ON DELETE CASCADE,
    INDEX idx_isc_interview (interview_id)
);

-- 10. Interview Rounds Table
CREATE TABLE IF NOT EXISTS interview_rounds (
    id VARCHAR(36) PRIMARY KEY,
    interview_id VARCHAR(36) NOT NULL,
    round_type VARCHAR(40) NOT NULL,
    name VARCHAR(100) NOT NULL,
    sequence_number INT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    duration_minutes INT,
    difficulty VARCHAR(30) DEFAULT 'MEDIUM',
    weight INT,
    instructions TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ir_interview FOREIGN KEY (interview_id) REFERENCES interviews (id) ON DELETE CASCADE,
    CONSTRAINT uk_interview_round_sequence UNIQUE (interview_id, sequence_number),
    INDEX idx_round_interview (interview_id)
);

-- 11. Questions Table
CREATE TABLE IF NOT EXISTS questions (
    id VARCHAR(36) PRIMARY KEY,
    interview_id VARCHAR(36),
    round_id VARCHAR(36),
    question_type VARCHAR(40) NOT NULL,
    question_text TEXT NOT NULL,
    difficulty VARCHAR(30) DEFAULT 'MEDIUM',
    expected_answer_guidance TEXT,
    time_limit_seconds INT,
    is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_q_interview FOREIGN KEY (interview_id) REFERENCES interviews (id) ON DELETE SET NULL,
    CONSTRAINT fk_q_round FOREIGN KEY (round_id) REFERENCES interview_rounds (id) ON DELETE SET NULL,
    CONSTRAINT fk_q_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_question_interview (interview_id),
    INDEX idx_question_round (round_id),
    INDEX idx_question_type (question_type)
);

-- 12. Interview Assignments Table (Instructor -> Candidate)
CREATE TABLE IF NOT EXISTS interview_assignments (
    id VARCHAR(36) PRIMARY KEY,
    interview_id VARCHAR(36) NOT NULL,
    candidate_id VARCHAR(36) NOT NULL,
    assigned_by VARCHAR(36) NOT NULL,
    scheduled_at TIMESTAMP,
    expires_at TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    candidate_instructions TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ia_interview FOREIGN KEY (interview_id) REFERENCES interviews (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ia_candidate FOREIGN KEY (candidate_id) REFERENCES candidates (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ia_assigned_by FOREIGN KEY (assigned_by) REFERENCES instructors (id) ON DELETE RESTRICT,
    INDEX idx_ia_candidate (candidate_id),
    INDEX idx_ia_interview (interview_id),
    INDEX idx_ia_assigned_by (assigned_by),
    INDEX idx_ia_scheduled_at (scheduled_at),
    INDEX idx_ia_status (status)
);

-- 13. Interview Sessions Table
CREATE TABLE IF NOT EXISTS interview_sessions (
    id VARCHAR(36) PRIMARY KEY,
    interview_assignment_id VARCHAR(36) NOT NULL,
    candidate_id VARCHAR(36) NOT NULL,
    interview_id VARCHAR(36) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'READY',
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    last_activity_at TIMESTAMP,
    current_round INT NOT NULL DEFAULT 1,
    remaining_seconds INT,
    session_token_hash VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_is_assignment FOREIGN KEY (interview_assignment_id) REFERENCES interview_assignments (id) ON DELETE RESTRICT,
    CONSTRAINT fk_is_candidate FOREIGN KEY (candidate_id) REFERENCES candidates (id) ON DELETE RESTRICT,
    CONSTRAINT fk_is_interview FOREIGN KEY (interview_id) REFERENCES interviews (id) ON DELETE RESTRICT,
    INDEX idx_session_status (status),
    INDEX idx_session_candidate (candidate_id),
    INDEX idx_session_interview (interview_id),
    INDEX idx_session_assignment (interview_assignment_id)
);

-- 14. Candidate Answers Table
CREATE TABLE IF NOT EXISTS candidate_answers (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    question_id VARCHAR(36) NOT NULL,
    round_id VARCHAR(36),
    text_answer TEXT,
    transcript TEXT,
    response_time_seconds INT,
    submitted_at TIMESTAMP,
    sequence_number INT,
    audio_reference VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ca_session FOREIGN KEY (session_id) REFERENCES interview_sessions (id) ON DELETE CASCADE,
    CONSTRAINT fk_ca_question FOREIGN KEY (question_id) REFERENCES questions (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ca_round FOREIGN KEY (round_id) REFERENCES interview_rounds (id) ON DELETE SET NULL,
    INDEX idx_answer_session (session_id),
    INDEX idx_answer_question (question_id)
);

-- 15. Answer Evaluations Table
CREATE TABLE IF NOT EXISTS answer_evaluations (
    id VARCHAR(36) PRIMARY KEY,
    candidate_answer_id VARCHAR(36) NOT NULL UNIQUE,
    technical_score DOUBLE,
    correctness_score DOUBLE,
    depth_score DOUBLE,
    clarity_score DOUBLE,
    problem_solving_score DOUBLE,
    evidence_json TEXT,
    strengths_json TEXT,
    weaknesses_json TEXT,
    missing_concepts_json TEXT,
    recommended_next_action VARCHAR(100),
    recommended_difficulty VARCHAR(30),
    evaluated_at TIMESTAMP,
    evaluation_version VARCHAR(20) DEFAULT '1.0.0',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ae_answer FOREIGN KEY (candidate_answer_id) REFERENCES candidate_answers (id) ON DELETE CASCADE,
    INDEX idx_eval_answer (candidate_answer_id)
);

-- 16. Coding Tasks Table
CREATE TABLE IF NOT EXISTS coding_tasks (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    difficulty VARCHAR(30) NOT NULL DEFAULT 'MEDIUM',
    language VARCHAR(50),
    starter_code TEXT,
    constraints_text TEXT,
    examples_json TEXT,
    time_limit_seconds INT,
    test_configuration_json TEXT,
    created_by VARCHAR(36),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ct_created_by FOREIGN KEY (created_by) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_coding_task_difficulty (difficulty),
    INDEX idx_coding_task_language (language)
);

-- 17. Coding Submissions Table
CREATE TABLE IF NOT EXISTS coding_submissions (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    task_id VARCHAR(36) NOT NULL,
    language VARCHAR(50) NOT NULL,
    source_code TEXT NOT NULL,
    submission_number INT NOT NULL DEFAULT 1,
    tests_passed INT NOT NULL DEFAULT 0,
    tests_total INT NOT NULL DEFAULT 0,
    execution_time_ms BIGINT,
    memory_usage_kb BIGINT,
    status VARCHAR(50),
    submitted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_csub_session FOREIGN KEY (session_id) REFERENCES interview_sessions (id) ON DELETE CASCADE,
    CONSTRAINT fk_csub_task FOREIGN KEY (task_id) REFERENCES coding_tasks (id) ON DELETE RESTRICT,
    INDEX idx_submission_session (session_id),
    INDEX idx_submission_task (task_id)
);

-- 18. Learning Tasks Table
CREATE TABLE IF NOT EXISTS learning_tasks (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    concept VARCHAR(150) NOT NULL,
    learning_material TEXT NOT NULL,
    learning_time_seconds INT NOT NULL DEFAULT 180,
    difficulty VARCHAR(30) NOT NULL DEFAULT 'MEDIUM',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_lt_difficulty (difficulty)
);

-- 19. Learning Results Table
CREATE TABLE IF NOT EXISTS learning_results (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    learning_task_id VARCHAR(36) NOT NULL,
    comprehension_score DOUBLE,
    application_score DOUBLE,
    adaptation_score DOUBLE,
    transfer_score DOUBLE,
    total_score DOUBLE,
    evidence_json TEXT,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_lr_session FOREIGN KEY (session_id) REFERENCES interview_sessions (id) ON DELETE CASCADE,
    CONSTRAINT fk_lr_task FOREIGN KEY (learning_task_id) REFERENCES learning_tasks (id) ON DELETE RESTRICT,
    INDEX idx_lr_session (session_id),
    INDEX idx_lr_task (learning_task_id)
);

-- 20. Behavioral Evaluations Table
CREATE TABLE IF NOT EXISTS behavioral_evaluations (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    question_id VARCHAR(36),
    communication_score DOUBLE,
    ownership_score DOUBLE,
    collaboration_score DOUBLE,
    decision_making_score DOUBLE,
    conflict_handling_score DOUBLE,
    evidence_json TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_be_session FOREIGN KEY (session_id) REFERENCES interview_sessions (id) ON DELETE CASCADE,
    INDEX idx_be_session (session_id)
);

-- 21. Interview Events Table
CREATE TABLE IF NOT EXISTS interview_events (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    event_type VARCHAR(40) NOT NULL,
    round_number INT,
    question_id VARCHAR(36),
    timestamp TIMESTAMP,
    metadata_json TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ievent_session FOREIGN KEY (session_id) REFERENCES interview_sessions (id) ON DELETE CASCADE,
    INDEX idx_ievent_session (session_id),
    INDEX idx_ievent_type (event_type),
    INDEX idx_ievent_timestamp (timestamp)
);

-- 22. Media Events Table
CREATE TABLE IF NOT EXISTS media_events (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    event_type VARCHAR(40) NOT NULL,
    timestamp TIMESTAMP,
    duration_seconds INT,
    metadata_json TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_mevent_session FOREIGN KEY (session_id) REFERENCES interview_sessions (id) ON DELETE CASCADE,
    INDEX idx_mevent_session (session_id),
    INDEX idx_mevent_type (event_type),
    INDEX idx_mevent_timestamp (timestamp)
);

-- 23. Interview Reports Table
CREATE TABLE IF NOT EXISTS interview_reports (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL UNIQUE,
    candidate_id VARCHAR(36) NOT NULL,
    interview_id VARCHAR(36) NOT NULL,
    overall_score DOUBLE,
    technical_score DOUBLE,
    coding_score DOUBLE,
    problem_solving_score DOUBLE,
    communication_score DOUBLE,
    learning_score DOUBLE,
    behavioral_score DOUBLE,
    time_constrained_score DOUBLE,
    strengths_json TEXT,
    improvement_areas_json TEXT,
    resume_findings_json TEXT,
    technical_evidence_json TEXT,
    coding_summary_json TEXT,
    learning_summary_json TEXT,
    behavioral_summary_json TEXT,
    ai_recommendation VARCHAR(100),
    generated_at TIMESTAMP,
    report_version VARCHAR(20) DEFAULT '1.0.0',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rep_session FOREIGN KEY (session_id) REFERENCES interview_sessions (id) ON DELETE RESTRICT,
    CONSTRAINT fk_rep_candidate FOREIGN KEY (candidate_id) REFERENCES candidates (id) ON DELETE RESTRICT,
    CONSTRAINT fk_rep_interview FOREIGN KEY (interview_id) REFERENCES interviews (id) ON DELETE RESTRICT,
    INDEX idx_report_session (session_id),
    INDEX idx_report_candidate (candidate_id),
    INDEX idx_report_interview (interview_id)
);

-- 24. Human Reviews Table
CREATE TABLE IF NOT EXISTS human_reviews (
    id VARCHAR(36) PRIMARY KEY,
    report_id VARCHAR(36) NOT NULL UNIQUE,
    instructor_id VARCHAR(36) NOT NULL,
    decision VARCHAR(30) NOT NULL,
    comments TEXT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_hr_report FOREIGN KEY (report_id) REFERENCES interview_reports (id) ON DELETE CASCADE,
    CONSTRAINT fk_hr_instructor FOREIGN KEY (instructor_id) REFERENCES instructors (id) ON DELETE RESTRICT,
    INDEX idx_hr_report (report_id),
    INDEX idx_hr_instructor (instructor_id),
    INDEX idx_hr_decision (decision)
);

-- 25. Report Deliveries Table (Engineer -> Instructor)
CREATE TABLE IF NOT EXISTS report_deliveries (
    id VARCHAR(36) PRIMARY KEY,
    report_id VARCHAR(36) NOT NULL,
    sent_by_engineer_id VARCHAR(36) NOT NULL,
    sent_to_instructor_id VARCHAR(36) NOT NULL,
    sent_at TIMESTAMP,
    status VARCHAR(30) DEFAULT 'DELIVERED',
    message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rd_report FOREIGN KEY (report_id) REFERENCES interview_reports (id) ON DELETE CASCADE,
    CONSTRAINT fk_rd_sent_by FOREIGN KEY (sent_by_engineer_id) REFERENCES interview_engineers (id) ON DELETE RESTRICT,
    CONSTRAINT fk_rd_sent_to FOREIGN KEY (sent_to_instructor_id) REFERENCES instructors (id) ON DELETE RESTRICT,
    INDEX idx_rd_report (report_id),
    INDEX idx_rd_sent_by (sent_by_engineer_id),
    INDEX idx_rd_sent_to (sent_to_instructor_id)
);

-- 26. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    recipient_id VARCHAR(36) NOT NULL,
    type VARCHAR(40) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id VARCHAR(36),
    status VARCHAR(20) NOT NULL DEFAULT 'UNREAD',
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_recipient FOREIGN KEY (recipient_id) REFERENCES users (id) ON DELETE CASCADE,
    INDEX idx_notif_recipient (recipient_id),
    INDEX idx_notif_status (status),
    INDEX idx_notif_type (type)
);

-- 27. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(36),
    description TEXT,
    metadata_json TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
    INDEX idx_audit_user (user_id),
    INDEX idx_audit_action (action),
    INDEX idx_audit_created_at (created_at),
    INDEX idx_audit_entity (entity_type, entity_id)
);
