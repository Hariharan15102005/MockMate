package com.agenthire.repository;

import com.agenthire.entity.InterviewQuestionHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InterviewQuestionHistoryRepository extends JpaRepository<InterviewQuestionHistory, UUID> {

    List<InterviewQuestionHistory> findByCandidateId(UUID candidateId);

    List<InterviewQuestionHistory> findBySessionId(UUID sessionId);

    List<InterviewQuestionHistory> findByCandidateIdOrderByCreatedAtDesc(UUID candidateId);
}
