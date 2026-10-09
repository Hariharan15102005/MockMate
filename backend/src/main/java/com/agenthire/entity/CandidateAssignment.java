package com.agenthire.entity;

import com.agenthire.entity.enums.AssignmentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "candidate_assignments", indexes = {
        @Index(name = "idx_ca_candidate", columnList = "candidate_id"),
        @Index(name = "idx_ca_engineer", columnList = "interview_engineer_id"),
        @Index(name = "idx_ca_instructor", columnList = "instructor_id"),
        @Index(name = "idx_ca_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"candidate", "interviewEngineer", "instructor"})
public class CandidateAssignment extends BaseEntity {

    @NotNull(message = "Candidate is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @NotNull(message = "Interview Engineer is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_engineer_id", nullable = false)
    private InterviewEngineer interviewEngineer;

    @NotNull(message = "Instructor is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id", nullable = false)
    private Instructor instructor;

    @NotBlank(message = "Applied role is required")
    @Size(max = 100)
    @Column(name = "applied_role", nullable = false, length = 100)
    private String appliedRole;

    @Size(max = 50)
    @Column(name = "interview_type", length = 50)
    private String interviewType;

    @Size(max = 20)
    @Column(name = "priority", length = 20)
    @Builder.Default
    private String priority = "MEDIUM";

    @Column(name = "engineer_message", columnDefinition = "TEXT")
    private String engineerMessage;

    @NotNull(message = "Assignment status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private AssignmentStatus status = AssignmentStatus.PENDING;

    @Column(name = "assigned_at")
    private Instant assignedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accepted_by_id")
    private User acceptedBy;

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "declined_by_id")
    private User declinedBy;

    @Column(name = "declined_at")
    private Instant declinedAt;

    @Column(name = "decline_reason", columnDefinition = "TEXT")
    private String declineReason;
}
