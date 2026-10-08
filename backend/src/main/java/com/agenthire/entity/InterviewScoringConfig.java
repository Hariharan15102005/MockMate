package com.agenthire.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "interview_scoring_configs", indexes = {
        @Index(name = "idx_isc_interview", columnList = "interview_id", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "interview")
public class InterviewScoringConfig extends BaseEntity {

    @NotNull(message = "Associated interview is required")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_id", nullable = false, unique = true)
    private Interview interview;

    @NotNull
    @Min(0)
    @Max(100)
    @Builder.Default
    @Column(name = "technical_weight", nullable = false)
    private Integer technicalWeight = 25;

    @NotNull
    @Min(0)
    @Max(100)
    @Builder.Default
    @Column(name = "coding_weight", nullable = false)
    private Integer codingWeight = 20;

    @NotNull
    @Min(0)
    @Max(100)
    @Builder.Default
    @Column(name = "problem_solving_weight", nullable = false)
    private Integer problemSolvingWeight = 15;

    @NotNull
    @Min(0)
    @Max(100)
    @Builder.Default
    @Column(name = "communication_weight", nullable = false)
    private Integer communicationWeight = 10;

    @NotNull
    @Min(0)
    @Max(100)
    @Builder.Default
    @Column(name = "learning_weight", nullable = false)
    private Integer learningWeight = 10;

    @NotNull
    @Min(0)
    @Max(100)
    @Builder.Default
    @Column(name = "behavioral_weight", nullable = false)
    private Integer behavioralWeight = 10;

    @NotNull
    @Min(0)
    @Max(100)
    @Builder.Default
    @Column(name = "time_constrained_weight", nullable = false)
    private Integer timeConstrainedWeight = 10;

    public int calculateTotalWeight() {
        return (technicalWeight != null ? technicalWeight : 0) +
                (codingWeight != null ? codingWeight : 0) +
                (problemSolvingWeight != null ? problemSolvingWeight : 0) +
                (communicationWeight != null ? communicationWeight : 0) +
                (learningWeight != null ? learningWeight : 0) +
                (behavioralWeight != null ? behavioralWeight : 0) +
                (timeConstrainedWeight != null ? timeConstrainedWeight : 0);
    }

    public boolean isValidTotal() {
        return calculateTotalWeight() == 100;
    }
}
