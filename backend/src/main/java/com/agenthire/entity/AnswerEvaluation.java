package com.agenthire.entity;

import com.agenthire.entity.enums.Difficulty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
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
@Table(name = "answer_evaluations", indexes = {
        @Index(name = "idx_eval_answer", columnList = "candidate_answer_id", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "candidateAnswer")
public class AnswerEvaluation extends BaseEntity {

    @NotNull(message = "Candidate answer is required")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_answer_id", nullable = false, unique = true)
    private CandidateAnswer candidateAnswer;

    @Column(name = "technical_score")
    private Double technicalScore;

    @Column(name = "correctness_score")
    private Double correctnessScore;

    @Column(name = "depth_score")
    private Double depthScore;

    @Column(name = "clarity_score")
    private Double clarityScore;

    @Column(name = "problem_solving_score")
    private Double problemSolvingScore;

    @Column(name = "evidence_json", columnDefinition = "TEXT")
    private String evidenceJson;

    @Column(name = "strengths_json", columnDefinition = "TEXT")
    private String strengthsJson;

    @Column(name = "weaknesses_json", columnDefinition = "TEXT")
    private String weaknessesJson;

    @Column(name = "missing_concepts_json", columnDefinition = "TEXT")
    private String missingConceptsJson;

    @Column(name = "recommended_next_action", length = 100)
    private String recommendedNextAction;

    @Enumerated(EnumType.STRING)
    @Column(name = "recommended_difficulty", length = 30)
    private Difficulty recommendedDifficulty;

    @Column(name = "evaluated_at")
    private Instant evaluatedAt;

    @Column(name = "evaluation_version", length = 20)
    @Builder.Default
    private String evaluationVersion = "1.0.0";
}
