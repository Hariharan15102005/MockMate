-- =========================================================================
-- AgentHire Platform Migration: Resume Management & AI Analysis
-- Version: 3.0.0
-- =========================================================================

ALTER TABLE resumes ADD COLUMN status VARCHAR(40) DEFAULT 'UPLOADED' NOT NULL;
ALTER TABLE resumes ADD COLUMN extracted_text LONGTEXT NULL;
ALTER TABLE resumes MODIFY COLUMN file_type VARCHAR(100) NULL;

CREATE INDEX idx_resume_status ON resumes (status);

ALTER TABLE resume_analysis ADD COLUMN potential_gaps_json TEXT NULL;
ALTER TABLE resume_analysis ADD COLUMN role_relevance_score DOUBLE NULL;
ALTER TABLE resume_analysis ADD COLUMN role_relevance_reason TEXT NULL;
ALTER TABLE resume_analysis ADD COLUMN raw_analysis_json LONGTEXT NULL;

