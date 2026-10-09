package com.agenthire.dto.interview;

import com.agenthire.entity.enums.Difficulty;
import com.agenthire.entity.enums.InterviewRoundType;
import com.agenthire.entity.enums.QuestionType;
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
public class InterviewRoundRequest {
    private UUID id;

    @NotNull(message = "Round type is required")
    private InterviewRoundType roundType;

    @NotBlank(message = "Round name is required")
    @Size(max = 100, message = "Round name cannot exceed 100 characters")
    private String name;

    public void setRoundName(String roundName) {
        if (this.name == null || this.name.isBlank()) {
            this.name = roundName;
        }
    }

    public String getRoundName() {
        return this.name;
    }

    @NotNull(message = "Sequence number is required")
    @Min(value = 1, message = "Sequence number must be at least 1")
    private Integer sequenceNumber;

    @Min(value = 1, message = "Duration must be at least 1 minute")
    private Integer durationMinutes;

    @Min(value = 1, message = "Question count must be at least 1")
    @Builder.Default
    private Integer questionCount = 1;

    private QuestionType questionType;
    private Difficulty difficulty;
    private Integer weight;
    private String instructions;

    @Builder.Default
    private Boolean enabled = true;

    @Builder.Default
    private List<QuestionRequest> questions = new ArrayList<>();
}
