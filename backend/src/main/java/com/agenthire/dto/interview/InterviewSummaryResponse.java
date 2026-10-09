package com.agenthire.dto.interview;

import com.agenthire.entity.enums.Difficulty;
import com.agenthire.entity.enums.InterviewStatus;
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
public class InterviewSummaryResponse {
    private UUID id;
    private String title;
    private String targetRole;
    private Integer durationMinutes;
    private Difficulty difficulty;
    private InterviewStatus status;
    private Boolean isAdaptive;
    private Integer roundCount;
    private UUID candidateId;
    private String candidateName;
    private String candidateApplicationId;
    private Instant publishedAt;
    private Instant createdAt;
}
