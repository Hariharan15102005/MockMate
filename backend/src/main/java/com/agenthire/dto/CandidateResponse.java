package com.agenthire.dto;

import com.agenthire.entity.enums.CandidateStatus;
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
public class CandidateResponse {
    private UUID id;
    private UUID userId;
    private String fullName;
    private String email;
    private String phone;
    private String location;
    private String college;
    private String degree;
    private String department;
    private Integer graduationYear;
    private Double cgpa;
    private String experienceLevel;
    private String appliedRole;
    private String applicationId;
    private String source;
    private CandidateStatus status;
    private String engineerNotes;
    private Instant createdAt;
    private Instant updatedAt;
}
