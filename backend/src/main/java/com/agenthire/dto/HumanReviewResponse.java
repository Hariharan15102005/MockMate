package com.agenthire.dto;

import com.agenthire.entity.enums.HumanDecision;
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
public class HumanReviewResponse {
    private UUID id;
    private UUID reportId;
    private UUID instructorId;
    private String instructorName;
    private HumanDecision decision;
    private String comments;
    private Instant reviewedAt;
}
