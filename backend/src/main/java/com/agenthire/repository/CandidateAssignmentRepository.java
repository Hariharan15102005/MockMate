package com.agenthire.repository;

import com.agenthire.entity.CandidateAssignment;
import com.agenthire.entity.enums.AssignmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CandidateAssignmentRepository extends JpaRepository<CandidateAssignment, UUID> {
    List<CandidateAssignment> findByCandidateId(UUID candidateId);
    List<CandidateAssignment> findByInterviewEngineerId(UUID engineerId);
    List<CandidateAssignment> findByInstructorId(UUID instructorId);
    List<CandidateAssignment> findByInstructorIdAndStatus(UUID instructorId, AssignmentStatus status);
}
