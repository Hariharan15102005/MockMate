package com.agenthire.dto.assignment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstructorDashboardStatsResponse {
    private long assignedCandidates;
    private long pendingReview;
    private long accepted;
    private long declined;
}
