package com.agenthire.dto.resume;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiResumeAnalysisResponse {

    @JsonProperty("resume_id")
    private String resumeId;

    @JsonProperty("candidate_id")
    private String candidateId;

    @JsonProperty("summary")
    private String summary;

    @JsonProperty("skills")
    private List<String> skills;

    @JsonProperty("languages")
    private List<String> languages;

    @JsonProperty("frameworks")
    private List<String> frameworks;

    @JsonProperty("databases")
    private List<String> databases;

    @JsonProperty("tools")
    private List<String> tools;

    @JsonProperty("education")
    private List<EducationDto> education;

    @JsonProperty("experience")
    private List<ExperienceDto> experience;

    @JsonProperty("projects")
    private List<ProjectDto> projects;

    @JsonProperty("certifications")
    private List<String> certifications;

    @JsonProperty("strengths")
    private List<String> strengths;

    @JsonProperty("potential_gaps")
    private List<String> potentialGaps;

    @JsonProperty("role_relevance")
    private RoleRelevanceDto roleRelevance;

    @JsonProperty("analysis_version")
    private String analysisVersion;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EducationDto {
        private String degree;
        private String field;
        private String institution;
        @JsonProperty("graduation_year")
        private Integer graduationYear;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExperienceDto {
        private String company;
        private String role;
        private String duration;
        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectDto {
        private String name;
        private List<String> technologies;
        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoleRelevanceDto {
        private Double score;
        private String reason;
    }
}
