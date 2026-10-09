package com.agenthire.dto.candidate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateInterviewResultDto {
    private UUID sessionId;
    private UUID interviewId;
    private String interviewTitle;
    private String candidateName;
    private String candidateEmail;
    private Double overallScore;
    private Double technicalScore;
    private Double codingScore;
    private Double sqlScore;
    private Double systemDesignScore;
    private Double communicationScore;
    private Double behavioralScore;
    private Double integrityScore;
    private Integer totalQuestionsAnswered;
    private Integer totalDurationSeconds;
    private List<String> strengths;
    private List<String> improvementAreas;
    private List<Map<String, Object>> questionEvaluations;
    private Instant completedAt;
}
