package com.agenthire.repository;

import com.agenthire.entity.CandidateAssignment;
import com.agenthire.entity.enums.AssignmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CandidateAssignmentRepository extends JpaRepository<CandidateAssignment, UUID>, JpaSpecificationExecutor<CandidateAssignment> {
    List<CandidateAssignment> findByCandidateId(UUID candidateId);
    List<CandidateAssignment> findByCandidateIdOrderByAssignedAtDesc(UUID candidateId);
    List<CandidateAssignment> findByInterviewEngineerId(UUID engineerId);
    List<CandidateAssignment> findByInstructorId(UUID instructorId);
    List<CandidateAssignment> findByInstructorIdAndStatus(UUID instructorId, AssignmentStatus status);
    List<CandidateAssignment> findByInstructorIdOrderByAssignedAtDesc(UUID instructorId);
    boolean existsByCandidateIdAndStatusIn(UUID candidateId, Collection<AssignmentStatus> statuses);
    boolean existsByCandidateIdAndInstructorIdAndStatusIn(UUID candidateId, UUID instructorId, Collection<AssignmentStatus> statuses);
    Optional<CandidateAssignment> findFirstByCandidateIdAndStatusInOrderByAssignedAtDesc(UUID candidateId, Collection<AssignmentStatus> statuses);
    Optional<CandidateAssignment> findFirstByCandidateIdAndInstructorIdAndStatusInOrderByAssignedAtDesc(UUID candidateId, UUID instructorId, Collection<AssignmentStatus> statuses);
    long countByStatus(AssignmentStatus status);
    long countByInstructorIdAndStatus(UUID instructorId, AssignmentStatus status);
    long countByInstructorId(UUID instructorId);
}

