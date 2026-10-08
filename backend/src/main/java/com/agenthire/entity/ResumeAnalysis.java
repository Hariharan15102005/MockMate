package com.agenthire.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.Instant;

@Entity
@Table(name = "resume_analysis", indexes = {
        @Index(name = "idx_resume_analysis_resume", columnList = "resume_id", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString(exclude = "resume")
public class ResumeAnalysis extends BaseEntity {

    @NotNull(message = "Associated resume is required")
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resume_id", nullable = false, unique = true)
    private Resume resume;

    @Column(name = "summary", columnDefinition = "TEXT")
    private String summary;

    @Column(name = "skills_json", columnDefinition = "TEXT")
    private String skillsJson;

    @Column(name = "languages_json", columnDefinition = "TEXT")
    private String languagesJson;

    @Column(name = "frameworks_json", columnDefinition = "TEXT")
    private String frameworksJson;

    @Column(name = "databases_json", columnDefinition = "TEXT")
    private String databasesJson;

    @Column(name = "tools_json", columnDefinition = "TEXT")
    private String toolsJson;

    @Column(name = "projects_json", columnDefinition = "TEXT")
    private String projectsJson;

    @Column(name = "internships_json", columnDefinition = "TEXT")
    private String internshipsJson;

    @Column(name = "experience_json", columnDefinition = "TEXT")
    private String experienceJson;

    @Column(name = "education_json", columnDefinition = "TEXT")
    private String educationJson;

    @Column(name = "certifications_json", columnDefinition = "TEXT")
    private String certificationsJson;

    @Column(name = "strength_areas_json", columnDefinition = "TEXT")
    private String strengthAreasJson;

    @Column(name = "question_areas_json", columnDefinition = "TEXT")
    private String questionAreasJson;

    @Column(name = "analyzed_at")
    private Instant analyzedAt;

    @Column(name = "analysis_version", length = 20)
    @Builder.Default
    private String analysisVersion = "1.0.0";
}
