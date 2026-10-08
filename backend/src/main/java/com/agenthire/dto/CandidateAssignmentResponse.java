package com.agenthire.dto;

import com.agenthire.entity.enums.AssignmentStatus;
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
public class CandidateAssignmentResponse {
    private UUID id;
    private UUID candidateId;
    private String candidateName;
    private UUID interviewEngineerId;
    private String engineerName;
    private UUID instructorId;
    private String instructorName;
    private String appliedRole;
    private String interviewType;
    private String priority;
    private String engineerMessage;
    private AssignmentStatus status;
    private Instant assignedAt;
    private Instant acceptedAt;
    private Instant createdAt;
}
