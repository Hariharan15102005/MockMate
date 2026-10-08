package com.agenthire.repository;

import com.agenthire.entity.InterviewReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InterviewReportRepository extends JpaRepository<InterviewReport, UUID> {
    Optional<InterviewReport> findBySessionId(UUID sessionId);
    List<InterviewReport> findByCandidateId(UUID candidateId);
    List<InterviewReport> findByInterviewId(UUID interviewId);
}
