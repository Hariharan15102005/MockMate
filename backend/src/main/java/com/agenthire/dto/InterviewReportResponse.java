package com.agenthire.dto;

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
public class InterviewReportResponse {
    private UUID id;
    private UUID sessionId;
    private UUID candidateId;
    private String candidateName;
    private UUID interviewId;
    private String interviewTitle;
    private Double overallScore;
    private Double technicalScore;
    private Double codingScore;
    private Double problemSolvingScore;
    private Double communicationScore;
    private Double learningScore;
    private Double behavioralScore;
    private Double timeConstrainedScore;
    private String strengthsJson;
    private String improvementAreasJson;
    private String resumeFindingsJson;
    private String technicalEvidenceJson;
    private String codingSummaryJson;
    private String learningSummaryJson;
    private String behavioralSummaryJson;
    private String aiRecommendation;
    private Instant generatedAt;
    private String reportVersion;
}
