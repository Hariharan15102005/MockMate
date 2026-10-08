package com.agenthire.repository;

import com.agenthire.entity.LearningTask;
import com.agenthire.entity.enums.Difficulty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LearningTaskRepository extends JpaRepository<LearningTask, UUID> {
    List<LearningTask> findByDifficulty(Difficulty difficulty);
}
