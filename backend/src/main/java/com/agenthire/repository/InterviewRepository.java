package com.agenthire.repository;

import com.agenthire.entity.Interview;
import com.agenthire.entity.enums.InterviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, UUID>, JpaSpecificationExecutor<Interview> {
    List<Interview> findByCreatedById(UUID instructorId);
    Page<Interview> findByCreatedById(UUID instructorId, Pageable pageable);
    List<Interview> findByStatus(InterviewStatus status);
    List<Interview> findByTargetRole(String targetRole);
    Optional<Interview> findByCandidateAssignmentId(UUID candidateAssignmentId);
    List<Interview> findByCandidateId(UUID candidateId);
    long countByCreatedByIdAndStatus(UUID instructorId, InterviewStatus status);
}
