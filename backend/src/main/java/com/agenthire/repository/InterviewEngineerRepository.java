package com.agenthire.repository;

import com.agenthire.entity.InterviewEngineer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InterviewEngineerRepository extends JpaRepository<InterviewEngineer, UUID> {
    Optional<InterviewEngineer> findByUserId(UUID userId);
    Optional<InterviewEngineer> findByEmployeeCode(String employeeCode);
    boolean existsByEmployeeCode(String employeeCode);
}
