package com.agenthire.entity;

import com.agenthire.entity.enums.SessionStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "interview_sessions", indexes = {
        @Index(name = "idx_session_status", columnList = "status"),
        @Index(name = "idx_session_candidate", columnList = "candidate_id"),
        @Index(name = "idx_session_interview", columnList = "interview_id"),
        @Index(name = "idx_session_assignment", columnList = "interview_assignment_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"interviewAssignment", "candidate", "interview"})
public class InterviewSession extends BaseEntity {

    @NotNull(message = "Interview assignment is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_assignment_id", nullable = false)
    private InterviewAssignment interviewAssignment;

    @NotNull(message = "Candidate is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @NotNull(message = "Interview is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_id", nullable = false)
    private Interview interview;

    @NotNull(message = "Session status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private SessionStatus status = SessionStatus.READY;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "last_activity_at")
    private Instant lastActivityAt;

    @Builder.Default
    @Column(name = "current_round", nullable = false)
    private Integer currentRound = 1;

    @Column(name = "remaining_seconds")
    private Integer remainingSeconds;

    @Column(name = "session_token_hash", length = 255)
    private String sessionTokenHash;
}
