package com.agenthire.repository;

import com.agenthire.entity.Candidate;
import com.agenthire.entity.enums.CandidateStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, UUID> {
    Optional<Candidate> findByEmail(String email);
    Optional<Candidate> findByApplicationId(String applicationId);
    List<Candidate> findByStatus(CandidateStatus status);
    List<Candidate> findByAppliedRole(String appliedRole);
}
