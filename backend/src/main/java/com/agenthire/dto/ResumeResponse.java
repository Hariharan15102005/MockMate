package com.agenthire.dto;

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
    private String filePath;
    private String fileType;
    private Long fileSize;
    private UUID uploadedById;
    private Instant uploadedAt;
    private Integer version;
    private Boolean isCurrent;
}
