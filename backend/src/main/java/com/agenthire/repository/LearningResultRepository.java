package com.agenthire.repository;

import com.agenthire.entity.LearningResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LearningResultRepository extends JpaRepository<LearningResult, UUID> {
    List<LearningResult> findBySessionId(UUID sessionId);
    Optional<LearningResult> findBySessionIdAndLearningTaskId(UUID sessionId, UUID learningTaskId);
}
