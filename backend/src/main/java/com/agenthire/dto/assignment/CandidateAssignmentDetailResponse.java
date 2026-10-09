package com.agenthire.dto.assignment;

import com.agenthire.entity.enums.AssignmentStatus;
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
public class CandidateAssignmentDetailResponse {
    private UUID id;
    private CandidateSummary candidate;
    private EngineerSummary engineer;
    private InstructorSummary instructor;
    private String appliedRole;
    private String interviewType;
    private String priority;
    private String engineerMessage;
    private AssignmentStatus status;
    private Instant assignedAt;
    private Instant acceptedAt;
    private Instant createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CandidateSummary {
        private UUID id;
        private String fullName;
        private String email;
        private String phone;
        private String college;
        private String degree;
        private String department;
        private String applicationId;
        private String appliedRole;
        private String experienceLevel;
        private Double cgpa;
        private CandidateStatus status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EngineerSummary {
        private UUID id;
        private UUID userId;
        private String fullName;
        private String email;
        private String employeeCode;
        private String department;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InstructorSummary {
        private UUID id;
        private UUID userId;
        private String fullName;
        private String email;
        private String employeeCode;
        private String department;
        private String specialization;
    }
}
