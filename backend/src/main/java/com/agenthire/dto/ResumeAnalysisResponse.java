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
public class ResumeAnalysisResponse {
    private UUID id;
    private UUID resumeId;
    private String summary;
    private String skillsJson;
    private String languagesJson;
    private String frameworksJson;
    private String databasesJson;
    private String toolsJson;
    private String projectsJson;
    private String internshipsJson;
    private String experienceJson;
    private String educationJson;
    private String certificationsJson;
    private String strengthAreasJson;
    private String questionAreasJson;
    private Instant analyzedAt;
    private String analysisVersion;
}
