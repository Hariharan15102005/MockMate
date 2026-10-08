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

import java.util.UUID;

@Entity
@Table(name = "behavioral_evaluations", indexes = {
        @Index(name = "idx_be_session", columnList = "session_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "session")
public class BehavioralEvaluation extends BaseEntity {

    @NotNull(message = "Session is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession session;

    @Column(name = "question_id")
    private UUID questionId;

    @Column(name = "communication_score")
    private Double communicationScore;

    @Column(name = "ownership_score")
    private Double ownershipScore;

    @Column(name = "collaboration_score")
    private Double collaborationScore;

    @Column(name = "decision_making_score")
    private Double decisionMakingScore;

    @Column(name = "conflict_handling_score")
    private Double conflictHandlingScore;

    @Column(name = "evidence_json", columnDefinition = "TEXT")
    private String evidenceJson;
}
