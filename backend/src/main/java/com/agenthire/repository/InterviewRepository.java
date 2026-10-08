package com.agenthire.repository;

import com.agenthire.entity.Interview;
import com.agenthire.entity.enums.InterviewStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InterviewRepository extends JpaRepository<Interview, UUID> {
    List<Interview> findByCreatedById(UUID instructorId);
    List<Interview> findByStatus(InterviewStatus status);
    List<Interview> findByTargetRole(String targetRole);
}
