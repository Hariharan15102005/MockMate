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
public class InterviewAssignmentResponse {
    private UUID id;
    private UUID interviewId;
    private String interviewTitle;
    private UUID candidateId;
    private String candidateName;
    private UUID assignedById;
    private String instructorName;
    private Instant scheduledAt;
    private Instant expiresAt;
    private AssignmentStatus status;
    private String candidateInstructions;
    private Instant createdAt;
}
