-- =========================================================================
-- AgentHire Platform Migration: Candidate Verification Workflow
-- Version: 2.0.0
-- =========================================================================

ALTER TABLE candidates ADD COLUMN rejection_reason TEXT;
ALTER TABLE candidates ADD COLUMN verified_by_id VARCHAR(36);
ALTER TABLE candidates ADD COLUMN verified_at TIMESTAMP;
ALTER TABLE candidates ADD COLUMN rejected_by_id VARCHAR(36);
ALTER TABLE candidates ADD COLUMN rejected_at TIMESTAMP;

ALTER TABLE candidates ADD CONSTRAINT fk_candidate_verified_by FOREIGN KEY (verified_by_id) REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE candidates ADD CONSTRAINT fk_candidate_rejected_by FOREIGN KEY (rejected_by_id) REFERENCES users (id) ON DELETE SET NULL;

CREATE INDEX idx_candidate_verified_at ON candidates (verified_at);
CREATE INDEX idx_candidate_rejected_at ON candidates (rejected_at);
