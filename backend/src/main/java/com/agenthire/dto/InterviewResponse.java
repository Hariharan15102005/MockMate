package com.agenthire.dto;

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
public class InterviewResponse {
    private UUID id;
    private String title;
    private String description;
    private String targetRole;
    private String experienceLevel;
    private Integer durationMinutes;
    private Difficulty difficulty;
    private InterviewStatus status;
    private UUID createdById;
    private String instructorName;
    private Instant publishedAt;
    private Instant createdAt;
    private Instant updatedAt;
}
