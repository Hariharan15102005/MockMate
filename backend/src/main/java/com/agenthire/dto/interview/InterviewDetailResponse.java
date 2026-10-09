package com.agenthire.dto.interview;

import com.agenthire.dto.candidate.CandidateResponse;
import com.agenthire.dto.assignment.InstructorSummaryResponse;
import com.agenthire.entity.enums.Difficulty;
import com.agenthire.entity.enums.InterviewStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewDetailResponse {
    private UUID id;
    private String title;
    private String description;
    private String targetRole;
    private String experienceLevel;
    private Integer durationMinutes;
    private Difficulty difficulty;
    private InterviewStatus status;
    private Boolean isAdaptive;
    private Instant publishedAt;
    private Instant createdAt;
    private Instant updatedAt;

    private UUID candidateAssignmentId;
    private CandidateSummary candidate;
    private InstructorSummaryResponse creatorInstructor;

    @Builder.Default
    private List<InterviewRoundResponse> rounds = new ArrayList<>();

    private ScoringConfigResponse scoringConfig;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CandidateSummary {
        private UUID id;
        private String fullName;
        private String email;
        private String applicationId;
        private String appliedRole;
        private String college;
        private String degree;
    }
}
