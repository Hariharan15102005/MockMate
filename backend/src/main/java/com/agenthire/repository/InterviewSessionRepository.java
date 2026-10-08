package com.agenthire.repository;

import com.agenthire.entity.InterviewSession;
import com.agenthire.entity.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, UUID> {
    Optional<InterviewSession> findByInterviewAssignmentId(UUID interviewAssignmentId);
    List<InterviewSession> findByCandidateId(UUID candidateId);
    List<InterviewSession> findByInterviewId(UUID interviewId);
    List<InterviewSession> findByStatus(SessionStatus status);
}
