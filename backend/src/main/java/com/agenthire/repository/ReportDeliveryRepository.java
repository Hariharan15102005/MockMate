package com.agenthire.repository;

import com.agenthire.entity.ReportDelivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReportDeliveryRepository extends JpaRepository<ReportDelivery, UUID> {
    List<ReportDelivery> findByReportId(UUID reportId);
    List<ReportDelivery> findBySentById(UUID engineerId);
    List<ReportDelivery> findBySentToId(UUID instructorId);
}
