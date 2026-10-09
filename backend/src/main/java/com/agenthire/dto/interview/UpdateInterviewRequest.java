package com.agenthire.dto.interview;

import com.agenthire.entity.enums.Difficulty;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateInterviewRequest {

    @NotBlank(message = "Interview title is required")
    @Size(max = 150, message = "Interview title cannot exceed 150 characters")
    private String title;

    private String description;

    @Size(max = 100)
    private String targetRole;

    @Size(max = 50)
    private String experienceLevel;

    @Min(value = 5, message = "Duration must be at least 5 minutes")
    @Max(value = 300, message = "Duration cannot exceed 300 minutes")
    private Integer durationMinutes;

    private Difficulty difficulty;
    private Boolean isAdaptive;

    @Valid
    @Builder.Default
    private List<InterviewRoundRequest> rounds = new ArrayList<>();

    @Valid
    private ScoringConfigRequest scoringConfig;
}
