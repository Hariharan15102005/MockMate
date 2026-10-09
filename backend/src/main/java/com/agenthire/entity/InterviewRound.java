package com.agenthire.entity;

import com.agenthire.entity.enums.Difficulty;
import com.agenthire.entity.enums.InterviewRoundType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "interview_rounds",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_interview_round_sequence", columnNames = {"interview_id", "sequence_number"})
        },
        indexes = {
                @Index(name = "idx_round_interview", columnList = "interview_id")
        })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "interview")
public class InterviewRound extends BaseEntity {

    @NotNull(message = "Interview is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_id", nullable = false)
    private Interview interview;

    @NotNull(message = "Round type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "round_type", nullable = false, length = 40)
    private InterviewRoundType roundType;

    @NotBlank(message = "Round name is required")
    @Size(max = 100)
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @NotNull(message = "Sequence number is required")
    @Column(name = "sequence_number", nullable = false)
    private Integer sequenceNumber;

    @Builder.Default
    @Column(name = "enabled", nullable = false)
    private Boolean enabled = true;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty", length = 30)
    @Builder.Default
    private Difficulty difficulty = Difficulty.MEDIUM;

    @Column(name = "question_count")
    @Builder.Default
    private Integer questionCount = 1;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", length = 40)
    private com.agenthire.entity.enums.QuestionType questionType;

    @Column(name = "weight")
    private Integer weight;

    @Column(name = "instructions", columnDefinition = "TEXT")
    private String instructions;
}
