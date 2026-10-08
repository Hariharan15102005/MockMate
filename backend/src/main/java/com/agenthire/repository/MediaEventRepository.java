package com.agenthire.repository;

import com.agenthire.entity.MediaEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MediaEventRepository extends JpaRepository<MediaEvent, UUID> {
    List<MediaEvent> findBySessionIdOrderByTimestampAsc(UUID sessionId);
}
