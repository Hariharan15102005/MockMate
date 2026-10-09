package com.agenthire.dto.interview;

import com.agenthire.entity.enums.Difficulty;
import com.agenthire.entity.enums.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionResponse {
    private UUID id;
    private UUID roundId;
    private QuestionType questionType;
    private String questionText;
    private Difficulty difficulty;
    private String expectedAnswerGuidance;
    private Integer timeLimitSeconds;
    private Integer sequenceNumber;
    private String codingLanguage;
    private String sampleInput;
    private String sampleOutput;
    private Boolean isAiGenerated;
    private Instant createdAt;
}
