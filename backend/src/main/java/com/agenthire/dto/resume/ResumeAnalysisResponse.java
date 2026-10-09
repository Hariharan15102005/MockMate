package com.agenthire.dto.resume;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResumeAnalysisResponse {

    private UUID id;
    private UUID resumeId;
    private UUID candidateId;
    private String summary;
    private List<String> skills;
    private List<String> languages;
    private List<String> frameworks;
    private List<String> databases;
    private List<String> tools;
    private List<AiResumeAnalysisResponse.EducationDto> education;
    private List<AiResumeAnalysisResponse.ExperienceDto> experience;
    private List<AiResumeAnalysisResponse.ProjectDto> projects;
    private List<String> certifications;
    private List<String> strengths;
    private List<String> potentialGaps;
    private AiResumeAnalysisResponse.RoleRelevanceDto roleRelevance;
    private Instant analyzedAt;
    private String analysisVersion;
    private Instant createdAt;
}
