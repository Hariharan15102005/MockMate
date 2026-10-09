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
public class CandidateAuditResponse {
    private UUID id;
    private String action;
    private String entityType;
    private UUID entityId;
    private String description;
    private String metadataJson;
    private String ipAddress;
    private UserSummaryResponse actor;
    private Instant createdAt;
}
