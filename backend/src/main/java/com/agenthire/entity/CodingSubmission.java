package com.agenthire.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.Instant;

@Entity
@Table(name = "coding_submissions", indexes = {
        @Index(name = "idx_submission_session", columnList = "session_id"),
        @Index(name = "idx_submission_task", columnList = "task_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"session", "task"})
public class CodingSubmission extends BaseEntity {

    @NotNull(message = "Session is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession session;

    @NotNull(message = "Task is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private CodingTask task;

    @NotBlank(message = "Language is required")
    @Size(max = 50)
    @Column(name = "language", nullable = false, length = 50)
    private String language;

    @NotBlank(message = "Source code is required")
    @Column(name = "source_code", nullable = false, columnDefinition = "TEXT")
    private String sourceCode;

    @Builder.Default
    @Column(name = "submission_number", nullable = false)
    private Integer submissionNumber = 1;

    @Builder.Default
    @Column(name = "tests_passed", nullable = false)
    private Integer testsPassed = 0;

    @Builder.Default
    @Column(name = "tests_total", nullable = false)
    private Integer testsTotal = 0;

    @Column(name = "execution_time_ms")
    private Long executionTimeMs;

    @Column(name = "memory_usage_kb")
    private Long memoryUsageKb;

    @Size(max = 50)
    @Column(name = "status", length = 50)
    private String status;

    @Column(name = "submitted_at")
    private Instant submittedAt;
}
