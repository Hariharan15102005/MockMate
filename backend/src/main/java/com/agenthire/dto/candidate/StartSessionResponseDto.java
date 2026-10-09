package com.agenthire.dto.candidate;

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
public class StartSessionResponseDto {
    private UUID sessionId;
    private UUID interviewId;
    private String interviewTitle;
    private String jobRole;
    private Integer durationMinutes;
    private Integer totalRounds;
    private Integer currentRound;
    private String currentRoundType;
    private UUID candidateId;
    private String sessionStatus;
    private Instant startedAt;
    private Integer remainingSeconds;

    public String getStatus() {
        return sessionStatus;
    }
}
