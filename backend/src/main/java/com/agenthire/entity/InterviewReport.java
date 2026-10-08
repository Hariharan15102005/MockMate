package com.agenthire.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "interview_reports", indexes = {
        @Index(name = "idx_report_session", columnList = "session_id", unique = true),
        @Index(name = "idx_report_candidate", columnList = "candidate_id"),
        @Index(name = "idx_report_interview", columnList = "interview_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"session", "candidate", "interview"})
public class InterviewReport extends BaseEntity {

    @NotNull(message = "Session is required")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false, unique = true)
    private InterviewSession session;

    @NotNull(message = "Candidate is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @NotNull(message = "Interview is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_id", nullable = false)
    private Interview interview;

    @Column(name = "overall_score")
    private Double overallScore;

    @Column(name = "technical_score")
    private Double technicalScore;

    @Column(name = "coding_score")
    private Double codingScore;

    @Column(name = "problem_solving_score")
    private Double problemSolvingScore;

    @Column(name = "communication_score")
    private Double communicationScore;

    @Column(name = "learning_score")
    private Double learningScore;

    @Column(name = "behavioral_score")
    private Double behavioralScore;

    @Column(name = "time_constrained_score")
    private Double timeConstrainedScore;

    @Column(name = "strengths_json", columnDefinition = "TEXT")
    private String strengthsJson;

    @Column(name = "improvement_areas_json", columnDefinition = "TEXT")
    private String improvementAreasJson;

    @Column(name = "resume_findings_json", columnDefinition = "TEXT")
    private String resumeFindingsJson;

    @Column(name = "technical_evidence_json", columnDefinition = "TEXT")
    private String technicalEvidenceJson;

    @Column(name = "coding_summary_json", columnDefinition = "TEXT")
    private String codingSummaryJson;

    @Column(name = "learning_summary_json", columnDefinition = "TEXT")
    private String learningSummaryJson;

    @Column(name = "behavioral_summary_json", columnDefinition = "TEXT")
    private String behavioralSummaryJson;

    @Column(name = "ai_recommendation", length = 100)
    private String aiRecommendation;

    @Column(name = "generated_at")
    private Instant generatedAt;

    @Column(name = "report_version", length = 20)
    @Builder.Default
    private String reportVersion = "1.0.0";
}
