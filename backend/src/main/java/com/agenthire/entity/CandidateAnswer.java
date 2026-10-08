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

import java.time.Instant;

@Entity
@Table(name = "candidate_answers", indexes = {
        @Index(name = "idx_answer_session", columnList = "session_id"),
        @Index(name = "idx_answer_question", columnList = "question_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"session", "question", "round"})
public class CandidateAnswer extends BaseEntity {

    @NotNull(message = "Session is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession session;

    @NotNull(message = "Question is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "round_id")
    private InterviewRound round;

    @Column(name = "text_answer", columnDefinition = "TEXT")
    private String textAnswer;

    @Column(name = "transcript", columnDefinition = "TEXT")
    private String transcript;

    @Column(name = "response_time_seconds")
    private Integer responseTimeSeconds;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(name = "sequence_number")
    private Integer sequenceNumber;

    @Column(name = "audio_reference", length = 500)
    private String audioReference;
}
