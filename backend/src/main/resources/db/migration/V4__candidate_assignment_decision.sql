-- =========================================================================
-- AgentHire Platform Migration: Candidate Assignment Decision Workflow
-- Version: 4.0.0
-- =========================================================================

ALTER TABLE candidate_assignments ADD COLUMN accepted_by_id VARCHAR(36);
ALTER TABLE candidate_assignments ADD COLUMN declined_by_id VARCHAR(36);
ALTER TABLE candidate_assignments ADD COLUMN declined_at TIMESTAMP;
ALTER TABLE candidate_assignments ADD COLUMN decline_reason TEXT;

ALTER TABLE candidate_assignments ADD CONSTRAINT fk_ca_accepted_by FOREIGN KEY (accepted_by_id) REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE candidate_assignments ADD CONSTRAINT fk_ca_declined_by FOREIGN KEY (declined_by_id) REFERENCES users (id) ON DELETE SET NULL;

CREATE INDEX idx_ca_accepted_at ON candidate_assignments (accepted_at);
CREATE INDEX idx_ca_declined_at ON candidate_assignments (declined_at);
