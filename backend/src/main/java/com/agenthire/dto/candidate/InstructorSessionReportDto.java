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
public class InstructorSessionReportDto {
    private UUID sessionId;
    private UUID interviewId;
    private String interviewTitle;
    private String jobRole;
    private UUID candidateId;
    private String candidateName;
    private String candidateEmail;
    private String sessionStatus;
    private Instant startedAt;
    private Instant endedAt;
    private Integer durationSeconds;
    
    // Scores
    private Double overallScore;
    private Double technicalScore;
    private Double codingScore;
    private Double sqlScore;
    private Double systemDesignScore;
    private Double communicationScore;
    private Double behavioralScore;
    private Double integrityScore;

    // AI summary
    private List<String> strengths;
    private List<String> improvementAreas;
    private String aiRecommendation;

    // Detailed itemized records
    private List<Map<String, Object>> questionEvaluations;
    private List<Map<String, Object>> integrityEvents;
    private List<Map<String, Object>> timelineEvents;
}
