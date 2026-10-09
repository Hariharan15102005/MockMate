-- =========================================================================
-- AgentHire Platform Migration: Interview Builder & Configuration
-- Version: 5.0.0
-- =========================================================================

ALTER TABLE interviews ADD COLUMN candidate_id VARCHAR(36);
ALTER TABLE interviews ADD COLUMN candidate_assignment_id VARCHAR(36);
ALTER TABLE interviews ADD COLUMN is_adaptive BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE interviews ADD CONSTRAINT fk_interview_candidate FOREIGN KEY (candidate_id) REFERENCES candidates (id) ON DELETE CASCADE;
ALTER TABLE interviews ADD CONSTRAINT fk_interview_assignment FOREIGN KEY (candidate_assignment_id) REFERENCES candidate_assignments (id) ON DELETE SET NULL;

CREATE INDEX idx_interview_candidate ON interviews (candidate_id);
CREATE INDEX idx_interview_assignment ON interviews (candidate_assignment_id);

ALTER TABLE interview_rounds ADD COLUMN question_count INT DEFAULT 1;
ALTER TABLE interview_rounds ADD COLUMN question_type VARCHAR(40);

ALTER TABLE questions ADD COLUMN sequence_number INT DEFAULT 1;
ALTER TABLE questions ADD COLUMN coding_language VARCHAR(50);
ALTER TABLE questions ADD COLUMN sample_input TEXT;
ALTER TABLE questions ADD COLUMN sample_output TEXT;
