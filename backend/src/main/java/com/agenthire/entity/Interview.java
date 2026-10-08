package com.agenthire.entity;

import com.agenthire.entity.enums.Difficulty;
import com.agenthire.entity.enums.InterviewStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
@Table(name = "interviews", indexes = {
        @Index(name = "idx_interview_status", columnList = "status"),
        @Index(name = "idx_interview_target_role", columnList = "target_role"),
        @Index(name = "idx_interview_created_by", columnList = "created_by")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "createdBy")
public class Interview extends BaseEntity {

    @NotBlank(message = "Interview title is required")
    @Size(max = 150)
    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @NotBlank(message = "Target role is required")
    @Size(max = 100)
    @Column(name = "target_role", nullable = false, length = 100)
    private String targetRole;

    @Size(max = 50)
    @Column(name = "experience_level", length = 50)
    private String experienceLevel;

    @NotNull(message = "Duration in minutes is required")
    @Min(value = 5, message = "Duration must be at least 5 minutes")
    @Max(value = 300, message = "Duration cannot exceed 300 minutes")
    @Column(name = "duration_minutes", nullable = false)
    @Builder.Default
    private Integer durationMinutes = 60;

    @NotNull(message = "Difficulty is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty", nullable = false, length = 30)
    @Builder.Default
    private Difficulty difficulty = Difficulty.MEDIUM;

    @NotNull(message = "Interview status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private InterviewStatus status = InterviewStatus.DRAFT;

    @NotNull(message = "Creator instructor is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private Instructor createdBy;

    @Column(name = "published_at")
    private Instant publishedAt;
}
