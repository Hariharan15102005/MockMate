package com.agenthire.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.Instant;

@Entity
@Table(name = "learning_results", indexes = {
        @Index(name = "idx_lr_session", columnList = "session_id"),
        @Index(name = "idx_lr_task", columnList = "learning_task_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"session", "learningTask"})
public class LearningResult extends BaseEntity {

    @NotNull(message = "Session is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession session;

    @NotNull(message = "Learning task is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "learning_task_id", nullable = false)
    private LearningTask learningTask;

    @Column(name = "comprehension_score")
    private Double comprehensionScore;

    @Column(name = "application_score")
    private Double applicationScore;

    @Column(name = "adaptation_score")
    private Double adaptationScore;

    @Column(name = "transfer_score")
    private Double transferScore;

    @Column(name = "total_score")
    private Double totalScore;

    @Column(name = "evidence_json", columnDefinition = "TEXT")
    private String evidenceJson;

    @Column(name = "completed_at")
    private Instant completedAt;
}
