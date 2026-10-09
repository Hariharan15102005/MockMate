package com.agenthire.dto.assignment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstructorSummaryResponse {
    private UUID id;
    private UUID userId;
    private String fullName;
    private String email;
    private String department;
    private String specialization;
    private String employeeCode;
    private Boolean active;
}
