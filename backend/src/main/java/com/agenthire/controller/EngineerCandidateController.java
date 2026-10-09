package com.agenthire.controller;

import com.agenthire.dto.candidate.CandidateAuditResponse;
import com.agenthire.dto.candidate.CandidateCreateRequest;
import com.agenthire.dto.candidate.CandidateRejectionRequest;
import com.agenthire.dto.candidate.CandidateResponse;
import com.agenthire.dto.candidate.CandidateStatsResponse;
import com.agenthire.dto.candidate.CandidateUpdateRequest;
import com.agenthire.entity.enums.CandidateStatus;
import com.agenthire.security.UserPrincipal;
import com.agenthire.service.EngineerCandidateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/engineer")
@RequiredArgsConstructor
@Tag(name = "Interview Engineer — Candidate Intake & Verification", description = "Candidate management, intake, and verification workflow APIs for Interview Engineers")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('INTERVIEW_ENGINEER')")
public class EngineerCandidateController {

    private final EngineerCandidateService candidateService;

    @PostMapping("/candidates")
    @Operation(summary = "Create candidate intake", description = "Creates a new candidate record with initial status PENDING_VERIFICATION.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Candidate intake created successfully"),
            @ApiResponse(responseCode = "400", description = "Validation error"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "409", description = "Duplicate application ID")
    })
    public ResponseEntity<CandidateResponse> createCandidate(
            @Valid @RequestBody CandidateCreateRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest servletRequest
    ) {
        String clientIp = servletRequest.getRemoteAddr();
        CandidateResponse response = candidateService.createCandidate(request, principal.getId(), clientIp);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/candidates")
    @Operation(summary = "List candidates with search & filters", description = "Retrieves paginated candidates matching optional search, status, experience, and role filters.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Candidates retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    public ResponseEntity<Page<CandidateResponse>> getCandidates(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) CandidateStatus status,
            @RequestParam(required = false) String experienceLevel,
            @RequestParam(required = false) String appliedRole
    ) {
        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<CandidateResponse> result = candidateService.getCandidates(pageable, search, status, experienceLevel, appliedRole);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/candidates/pending-verification")
    @Operation(summary = "List candidates pending verification", description = "Retrieves paginated candidates currently requiring verification review.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Pending verification candidates retrieved"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    public ResponseEntity<Page<CandidateResponse>> getPendingVerificationCandidates(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String experienceLevel,
            @RequestParam(required = false) String appliedRole
    ) {
        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<CandidateResponse> result = candidateService.getCandidates(pageable, search, CandidateStatus.PENDING_VERIFICATION, experienceLevel, appliedRole);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/candidates/{id}")
    @Operation(summary = "Get candidate by ID", description = "Retrieves complete candidate intake parameters.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Candidate retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Candidate not found")
    })
    public ResponseEntity<CandidateResponse> getCandidateById(@PathVariable UUID id) {
        CandidateResponse response = candidateService.getCandidateById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/candidates/{id}")
    @Operation(summary = "Update candidate intake information", description = "Updates candidate profile and intake notes while preserving workflow status.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Candidate updated successfully"),
            @ApiResponse(responseCode = "400", description = "Validation error"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Candidate not found"),
            @ApiResponse(responseCode = "409", description = "Duplicate application ID")
    })
    public ResponseEntity<CandidateResponse> updateCandidate(
            @PathVariable UUID id,
            @Valid @RequestBody CandidateUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest servletRequest
    ) {
        String clientIp = servletRequest.getRemoteAddr();
        CandidateResponse response = candidateService.updateCandidate(id, request, principal.getId(), clientIp);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/candidates/{id}/verify")
    @Operation(summary = "Verify candidate intake", description = "Transitions candidate status from PENDING_VERIFICATION to VERIFIED, recording verification metadata and audit event.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Candidate verified successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Candidate not found"),
            @ApiResponse(responseCode = "409", description = "Candidate is no longer pending verification")
    })
    public ResponseEntity<CandidateResponse> verifyCandidate(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest servletRequest
    ) {
        String clientIp = servletRequest.getRemoteAddr();
        CandidateResponse response = candidateService.verifyCandidate(id, principal.getId(), clientIp);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/candidates/{id}/reject")
    @Operation(summary = "Reject candidate intake", description = "Transitions candidate status from PENDING_VERIFICATION to REJECTED with a required reason, recording metadata and audit event.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Candidate rejected successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid or empty rejection reason"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Candidate not found"),
            @ApiResponse(responseCode = "409", description = "Candidate is no longer pending verification")
    })
    public ResponseEntity<CandidateResponse> rejectCandidate(
            @PathVariable UUID id,
            @Valid @RequestBody CandidateRejectionRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest servletRequest
    ) {
        String clientIp = servletRequest.getRemoteAddr();
        CandidateResponse response = candidateService.rejectCandidate(id, request, principal.getId(), clientIp);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/candidates/{id}/audit")
    @Operation(summary = "Get candidate audit history", description = "Retrieves chronologically ordered audit logs specifically for this candidate.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Candidate audit logs retrieved"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Candidate not found")
    })
    public ResponseEntity<List<CandidateAuditResponse>> getCandidateAuditHistory(@PathVariable UUID id) {
        List<CandidateAuditResponse> auditLogs = candidateService.getCandidateAuditLogs(id);
        return ResponseEntity.ok(auditLogs);
    }

    @GetMapping("/dashboard/stats")
    @Operation(summary = "Get engineer dashboard stats", description = "Calculates real-time candidate metrics from MySQL database.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Dashboard stats retrieved"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden")
    })
    public ResponseEntity<CandidateStatsResponse> getDashboardStats() {
        CandidateStatsResponse stats = candidateService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }
}
