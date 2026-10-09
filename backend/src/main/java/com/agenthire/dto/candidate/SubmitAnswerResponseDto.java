package com.agenthire.dto.candidate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitAnswerResponseDto {
    private Double questionScore;
    private Double correctnessScore;
    private Double relevanceScore;
    private Double depthScore;
    private Double communicationScore;
    private String feedback;
    private List<String> strengths;
    private List<String> improvements;
    private Boolean isInterviewCompleted;
    private Integer nextRoundNumber;
}
