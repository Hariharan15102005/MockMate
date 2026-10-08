package com.agenthire.repository;

import com.agenthire.entity.BehavioralEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BehavioralEvaluationRepository extends JpaRepository<BehavioralEvaluation, UUID> {
    List<BehavioralEvaluation> findBySessionId(UUID sessionId);
}
