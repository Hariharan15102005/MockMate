package com.agenthire.dto.interview;

import com.agenthire.entity.enums.Difficulty;
import jakarta.validation.Valid;
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
public class CreateInterviewRequest {

    @NotNull(message = "Candidate assignment ID is required")
    private UUID candidateAssignmentId;

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
    @Builder.Default
    private Integer durationMinutes = 60;

    @Builder.Default
    private Difficulty difficulty = Difficulty.MEDIUM;

    @Builder.Default
    private Boolean isAdaptive = false;

    @Valid
    @Builder.Default
    private List<InterviewRoundRequest> rounds = new ArrayList<>();

    @Valid
    private ScoringConfigRequest scoringConfig;
}
