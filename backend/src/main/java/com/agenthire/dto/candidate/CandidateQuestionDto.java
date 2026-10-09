package com.agenthire.dto.candidate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateQuestionDto {
    private UUID questionId;
    private Integer roundNumber;
    private Integer totalRounds;
    private String roundType;
    private String roundName;
    private String questionText;
    private String fullSpeechText;
    private String topic;
    private String questionCategory;
    private String questionSource;
    private List<String> hints;
    private String difficulty;
    private Integer timeLimitSeconds;
    private Boolean isLastQuestion;
}
