package com.agenthire.repository;

import com.agenthire.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QuestionRepository extends JpaRepository<Question, UUID> {
    List<Question> findByInterviewId(UUID interviewId);
    List<Question> findByInterviewIdOrderBySequenceNumberAsc(UUID interviewId);
    List<Question> findByRoundId(UUID roundId);
}
