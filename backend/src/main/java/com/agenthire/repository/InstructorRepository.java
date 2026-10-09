package com.agenthire.repository;

import com.agenthire.entity.Instructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InstructorRepository extends JpaRepository<Instructor, UUID>, JpaSpecificationExecutor<Instructor> {
    Optional<Instructor> findByUserId(UUID userId);
    Optional<Instructor> findByEmployeeCode(String employeeCode);
    boolean existsByEmployeeCode(String employeeCode);
    List<Instructor> findByActiveTrue();
    Page<Instructor> findByActiveTrue(Pageable pageable);
}

