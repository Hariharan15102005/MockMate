package com.agenthire.dto.candidate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateRejectionRequest {

    @NotBlank(message = "Rejection reason is required and cannot be empty")
    @Size(max = 1000, message = "Rejection reason cannot exceed 1000 characters")
    private String reason;
}
