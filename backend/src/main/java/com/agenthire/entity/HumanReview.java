package com.agenthire.entity;

import com.agenthire.entity.enums.HumanDecision;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
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
@Table(name = "human_reviews", indexes = {
        @Index(name = "idx_hr_report", columnList = "report_id", unique = true),
        @Index(name = "idx_hr_instructor", columnList = "instructor_id"),
        @Index(name = "idx_hr_decision", columnList = "decision")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"report", "instructor"})
public class HumanReview extends BaseEntity {

    @NotNull(message = "Interview report is required")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false, unique = true)
    private InterviewReport report;

    @NotNull(message = "Instructor is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id", nullable = false)
    private Instructor instructor;

    @NotNull(message = "Human decision is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "decision", nullable = false, length = 30)
    private HumanDecision decision;

    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;
}
