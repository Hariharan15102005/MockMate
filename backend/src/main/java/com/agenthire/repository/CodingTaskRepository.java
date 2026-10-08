package com.agenthire.repository;

import com.agenthire.entity.CodingTask;
import com.agenthire.entity.enums.Difficulty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CodingTaskRepository extends JpaRepository<CodingTask, UUID> {
    List<CodingTask> findByDifficulty(Difficulty difficulty);
    List<CodingTask> findByLanguage(String language);
}
