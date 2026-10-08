package com.agenthire.repository;

import com.agenthire.entity.InterviewScoringConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InterviewScoringConfigRepository extends JpaRepository<InterviewScoringConfig, UUID> {
    Optional<InterviewScoringConfig> findByInterviewId(UUID interviewId);
}
