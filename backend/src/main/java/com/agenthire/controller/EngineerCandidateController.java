package com.agenthire.controller;

import com.agenthire.dto.candidate.CandidateCreateRequest;
import com.agenthire.dto.candidate.CandidateResponse;
import com.agenthire.dto.candidate.CandidateStatsResponse;
import com.agenthire.dto.candidate.CandidateUpdateRequest;
import com.agenthire.entity.enums.CandidateStatus;
import com.agenthire.security.UserPrincipal;
import com.agenthire.service.EngineerCandidateService;
import io.swagger.v3.oas.annotations.Operation;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/engineer")
@RequiredArgsConstructor
@Tag(name = "Interview Engineer — Candidate Intake", description = "Candidate management and intake APIs for Interview Engineers")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('INTERVIEW_ENGINEER')")
public class EngineerCandidateController {

    private final EngineerCandidateService candidateService;

    @PostMapping("/candidates")
    @Operation(summary = "Create candidate intake", description = "Creates a new candidate record with initial status PENDING_VERIFICATION.")
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

    @GetMapping("/candidates/{id}")
    @Operation(summary = "Get candidate by ID", description = "Retrieves complete candidate intake parameters.")
    public ResponseEntity<CandidateResponse> getCandidateById(@PathVariable UUID id) {
        CandidateResponse response = candidateService.getCandidateById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/candidates/{id}")
    @Operation(summary = "Update candidate intake information", description = "Updates candidate profile and intake notes while preserving workflow status.")
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

    @GetMapping("/dashboard/stats")
    @Operation(summary = "Get engineer dashboard stats", description = "Calculates real-time candidate metrics from MySQL database.")
    public ResponseEntity<CandidateStatsResponse> getDashboardStats() {
        CandidateStatsResponse stats = candidateService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }
}
