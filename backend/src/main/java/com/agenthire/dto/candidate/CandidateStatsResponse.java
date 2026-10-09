package com.agenthire.dto.candidate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateStatsResponse {
    private long totalCandidates;
    private long pendingVerification;
    private long verified;
    private long sentToInstructors;
}
