package com.agenthire.dto.candidate;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitAnswerRequestDto {
    private UUID questionId;
    private Integer roundNumber;
    private String roundType;
    private String questionText;
    
    @NotBlank(message = "Answer cannot be empty")
    private String answerText;

    private String transcript;
    private Integer responseTimeSeconds;
}
