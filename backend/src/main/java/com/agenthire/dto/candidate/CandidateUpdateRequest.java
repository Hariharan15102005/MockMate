package com.agenthire.dto.candidate;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateUpdateRequest {

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Valid email address is required")
    @Size(max = 150, message = "Email cannot exceed 150 characters")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Size(min = 7, max = 30, message = "Phone number must be between 7 and 30 characters")
    private String phone;

    @NotBlank(message = "Location is required")
    @Size(max = 100, message = "Location cannot exceed 100 characters")
    private String location;

    @NotBlank(message = "College / University is required")
    @Size(max = 150, message = "College cannot exceed 150 characters")
    private String college;

    @NotBlank(message = "Degree is required")
    @Size(max = 100, message = "Degree cannot exceed 100 characters")
    private String degree;

    @NotBlank(message = "Department is required")
    @Size(max = 100, message = "Department cannot exceed 100 characters")
    private String department;

    @NotNull(message = "Graduation year is required")
    @Min(value = 1950, message = "Graduation year must be at least 1950")
    @Max(value = 2100, message = "Graduation year cannot be beyond 2100")
    private Integer graduationYear;

    @DecimalMin(value = "0.0", message = "CGPA cannot be negative")
    @DecimalMax(value = "10.0", message = "CGPA maximum is 10.0")
    private Double cgpa;

    @Size(max = 50, message = "Experience level cannot exceed 50 characters")
    private String experienceLevel;

    @NotBlank(message = "Applied role is required")
    @Size(max = 100, message = "Applied role cannot exceed 100 characters")
    private String appliedRole;

    @NotBlank(message = "Application ID is required")
    @Size(max = 100, message = "Application ID cannot exceed 100 characters")
    private String applicationId;

    @Size(max = 50, message = "Source cannot exceed 50 characters")
    private String source;

    @Size(max = 2000, message = "Engineer notes cannot exceed 2000 characters")
    private String engineerNotes;
}
