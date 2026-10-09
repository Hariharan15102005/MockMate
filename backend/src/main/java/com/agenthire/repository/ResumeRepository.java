package com.agenthire.repository;

import com.agenthire.entity.Resume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResumeRepository extends JpaRepository<Resume, UUID> {
    List<Resume> findByCandidateId(UUID candidateId);
    List<Resume> findByCandidateIdOrderByVersionDesc(UUID candidateId);
    Optional<Resume> findByCandidateIdAndIsCurrentTrue(UUID candidateId);
    Optional<Resume> findTopByCandidateIdOrderByVersionDesc(UUID candidateId);
    boolean existsByCandidateId(UUID candidateId);
}

