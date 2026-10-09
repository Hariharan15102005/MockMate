package com.agenthire.dto.resume;

import com.agenthire.dto.candidate.UserSummaryResponse;
import com.agenthire.entity.enums.ResumeStatus;
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
public class ResumeResponse {
    private UUID id;
    private UUID candidateId;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private Integer version;
    private Boolean isCurrent;
    private ResumeStatus status;
    private UserSummaryResponse uploadedBy;
    private Instant uploadedAt;
    private Instant createdAt;
    private Instant updatedAt;
}
