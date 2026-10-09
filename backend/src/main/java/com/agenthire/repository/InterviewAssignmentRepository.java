package com.agenthire.repository;

import com.agenthire.entity.InterviewAssignment;
import com.agenthire.entity.enums.AssignmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InterviewAssignmentRepository extends JpaRepository<InterviewAssignment, UUID> {
    List<InterviewAssignment> findByCandidateId(UUID candidateId);
    List<InterviewAssignment> findByInterviewId(UUID interviewId);
    List<InterviewAssignment> findByAssignedById(UUID instructorId);
    List<InterviewAssignment> findByCandidateIdAndStatus(UUID candidateId, AssignmentStatus status);
    java.util.Optional<InterviewAssignment> findByCandidateIdAndInterviewId(UUID candidateId, UUID interviewId);
}
