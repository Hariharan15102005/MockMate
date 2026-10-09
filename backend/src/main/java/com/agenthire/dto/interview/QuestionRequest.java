package com.agenthire.dto.interview;

import com.agenthire.entity.enums.Difficulty;
import com.agenthire.entity.enums.InterviewRoundType;
import com.agenthire.entity.enums.QuestionType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionRequest {
    private UUID id;

    @NotNull(message = "Question type is required")
    private QuestionType questionType;

    @NotBlank(message = "Question text is required")
    private String questionText;

    private Difficulty difficulty;
    private String expectedAnswerGuidance;
    private Integer timeLimitSeconds;
    private Integer sequenceNumber;
    private String codingLanguage;
    private String sampleInput;
    private String sampleOutput;
}
