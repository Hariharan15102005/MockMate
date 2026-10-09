package com.agenthire.repository;

import com.agenthire.entity.CandidateAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CandidateAnswerRepository extends JpaRepository<CandidateAnswer, UUID> {
    List<CandidateAnswer> findBySessionIdOrderBySequenceNumberAsc(UUID sessionId);
    Optional<CandidateAnswer> findBySessionIdAndQuestionId(UUID sessionId, UUID questionId);
    List<CandidateAnswer> findBySessionCandidateId(UUID candidateId);
}
