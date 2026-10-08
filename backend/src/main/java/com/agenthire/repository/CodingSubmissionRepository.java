package com.agenthire.repository;

import com.agenthire.entity.CodingSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CodingSubmissionRepository extends JpaRepository<CodingSubmission, UUID> {
    List<CodingSubmission> findBySessionId(UUID sessionId);
    List<CodingSubmission> findBySessionIdAndTaskId(UUID sessionId, UUID taskId);
}
