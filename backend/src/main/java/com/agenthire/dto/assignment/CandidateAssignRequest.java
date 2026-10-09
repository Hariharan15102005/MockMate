package com.agenthire.dto.assignment;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateAssignRequest {

    @NotNull(message = "Instructor ID is required")
    private UUID instructorId;

    @Size(max = 1000, message = "Message cannot exceed 1000 characters")
    private String message;

    @Size(max = 50, message = "Interview type cannot exceed 50 characters")
    @Builder.Default
    private String interviewType = "TECHNICAL";

    @Size(max = 20, message = "Priority cannot exceed 20 characters")
    @Builder.Default
    private String priority = "MEDIUM";
}
