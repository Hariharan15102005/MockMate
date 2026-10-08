package com.agenthire.repository;

import com.agenthire.entity.AnswerEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnswerEvaluationRepository extends JpaRepository<AnswerEvaluation, UUID> {
    Optional<AnswerEvaluation> findByCandidateAnswerId(UUID candidateAnswerId);
}
