package com.agenthire.repository;

import com.agenthire.entity.Instructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InstructorRepository extends JpaRepository<Instructor, UUID> {
    Optional<Instructor> findByUserId(UUID userId);
    Optional<Instructor> findByEmployeeCode(String employeeCode);
    boolean existsByEmployeeCode(String employeeCode);
}
