package com.agenthire.controller;

import com.agenthire.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/test")
@Tag(name = "Security Verification", description = "Role-based authorization test verification endpoints")
@SecurityRequirement(name = "bearerAuth")
public class TestSecurityController {

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin only test endpoint")
    public ResponseEntity<ApiResponse<String>> testAdmin() {
        return ResponseEntity.ok(ApiResponse.success("Authorized: ADMIN access granted"));
    }

    @GetMapping("/engineer")
    @PreAuthorize("hasRole('INTERVIEW_ENGINEER')")
    @Operation(summary = "Interview Engineer only test endpoint")
    public ResponseEntity<ApiResponse<String>> testEngineer() {
        return ResponseEntity.ok(ApiResponse.success("Authorized: INTERVIEW_ENGINEER access granted"));
    }

    @GetMapping("/instructor")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    @Operation(summary = "Instructor only test endpoint")
    public ResponseEntity<ApiResponse<String>> testInstructor() {
        return ResponseEntity.ok(ApiResponse.success("Authorized: INSTRUCTOR access granted"));
    }

    @GetMapping("/candidate")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Candidate only test endpoint")
    public ResponseEntity<ApiResponse<String>> testCandidate() {
        return ResponseEntity.ok(ApiResponse.success("Authorized: CANDIDATE access granted"));
    }
}
