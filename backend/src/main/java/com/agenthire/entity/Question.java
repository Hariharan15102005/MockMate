package com.agenthire.entity;

import com.agenthire.entity.enums.Difficulty;
import com.agenthire.entity.enums.QuestionType;
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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name = "questions", indexes = {
        @Index(name = "idx_question_interview", columnList = "interview_id"),
        @Index(name = "idx_question_round", columnList = "round_id"),
        @Index(name = "idx_question_type", columnList = "question_type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = {"interview", "round", "createdBy"})
public class Question extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interview_id")
    private Interview interview;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "round_id")
    private InterviewRound round;

    @NotNull(message = "Question type is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false, length = 40)
    private QuestionType questionType;

    @NotBlank(message = "Question text is required")
    @Column(name = "question_text", nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty", length = 30)
    @Builder.Default
    private Difficulty difficulty = Difficulty.MEDIUM;

    @Column(name = "expected_answer_guidance", columnDefinition = "TEXT")
    private String expectedAnswerGuidance;

    @Column(name = "time_limit_seconds")
    private Integer timeLimitSeconds;

    @Builder.Default
    @Column(name = "is_ai_generated", nullable = false)
    private Boolean isAiGenerated = false;

    @Column(name = "sequence_number")
    @Builder.Default
    private Integer sequenceNumber = 1;

    @Column(name = "coding_language", length = 50)
    private String codingLanguage;

    @Column(name = "sample_input", columnDefinition = "TEXT")
    private String sampleInput;

    @Column(name = "sample_output", columnDefinition = "TEXT")
    private String sampleOutput;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
}
