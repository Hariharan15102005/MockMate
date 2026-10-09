package com.agenthire.dto.interview;

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
public class AcceptedAssignmentSummaryResponse {
    private UUID assignmentId;
    private UUID candidateId;
    private String candidateName;
    private String applicationId;
    private String appliedRole;
    private String experienceLevel;
    private Instant acceptedAt;
    private UUID existingInterviewId;
    private String existingInterviewStatus;
}
