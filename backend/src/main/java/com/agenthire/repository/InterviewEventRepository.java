package com.agenthire.repository;

import com.agenthire.entity.InterviewEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InterviewEventRepository extends JpaRepository<InterviewEvent, UUID> {
    List<InterviewEvent> findBySessionIdOrderByTimestampAsc(UUID sessionId);
}
