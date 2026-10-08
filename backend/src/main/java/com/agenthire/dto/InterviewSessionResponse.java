package com.agenthire.dto;

import com.agenthire.entity.enums.SessionStatus;
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
public class InterviewSessionResponse {
    private UUID id;
    private UUID interviewAssignmentId;
    private UUID candidateId;
    private String candidateName;
    private UUID interviewId;
    private String interviewTitle;
    private SessionStatus status;
    private Instant startedAt;
    private Instant endedAt;
    private Integer currentRound;
    private Integer remainingSeconds;
    private Instant createdAt;
}
