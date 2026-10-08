package com.agenthire.repository;

import com.agenthire.entity.HumanReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HumanReviewRepository extends JpaRepository<HumanReview, UUID> {
    Optional<HumanReview> findByReportId(UUID reportId);
    List<HumanReview> findByInstructorId(UUID instructorId);
}
