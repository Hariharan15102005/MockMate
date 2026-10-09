package com.agenthire.entity;

import com.agenthire.entity.enums.Difficulty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "interview_question_history", indexes = {
        @Index(name = "idx_iqh_candidate", columnList = "candidate_id"),
        @Index(name = "idx_iqh_session", columnList = "session_id"),
        @Index(name = "idx_iqh_fingerprint", columnList = "semantic_fingerprint"),
        @Index(name = "idx_iqh_topic", columnList = "topic"),
        @Index(name = "idx_iqh_skill", columnList = "skill")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"candidate", "session", "resume"})
public class InterviewQuestionHistory extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id")
    private Resume resume;

    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "normalized_question", columnDefinition = "TEXT")
    private String normalizedQuestion;

    @Column(name = "semantic_fingerprint", length = 255)
    private String semanticFingerprint;

    @Column(name = "topic", length = 100)
    private String topic;

    @Column(name = "subtopic", length = 100)
    private String subtopic;

    @Column(name = "skill", length = 100)
    private String skill;

    @Column(name = "project", length = 100)
    private String project;

    @Column(name = "angle", length = 100)
    private String angle;

    @Column(name = "question_type", length = 100)
    private String questionType;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty", length = 30)
    private Difficulty difficulty;

    @Column(name = "score")
    private Double score;
}
