package com.agenthire.dto.assignment;

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
public class AssignmentDeclineRequest {

    @NotBlank(message = "Decline reason is required")
    @Size(max = 1000, message = "Decline reason cannot exceed 1000 characters")
    private String reason;
}
