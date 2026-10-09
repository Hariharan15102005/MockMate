package com.agenthire.controller;

import com.agenthire.dto.assignment.CandidateAssignmentDetailResponse;
import com.agenthire.dto.assignment.InstructorCandidateDetailResponse;
import com.agenthire.entity.enums.AssignmentStatus;
import com.agenthire.security.UserPrincipal;
import com.agenthire.service.InstructorCandidateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/instructor")
@RequiredArgsConstructor
@PreAuthorize("hasRole('INSTRUCTOR')")
@Tag(name = "Instructor Candidate Review", description = "Endpoints for Instructors to view and review assigned candidates")
@SecurityRequirement(name = "bearerAuth")
public class InstructorCandidateController {

    private final InstructorCandidateService instructorCandidateService;

    @GetMapping("/candidates")
    @Operation(summary = "List assigned candidates", description = "Retrieves candidates assigned specifically to the authenticated instructor.")
    public ResponseEntity<Page<CandidateAssignmentDetailResponse>> getAssignedCandidates(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) AssignmentStatus status,
            @PageableDefault(size = 15, sort = "assignedAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal) {

        return ResponseEntity.ok(
                instructorCandidateService.getAssignedCandidates(principal.getId(), search, status, pageable)
        );
    }

    @GetMapping("/candidates/{candidateId}")
    @Operation(summary = "Get assigned candidate detail", description = "Retrieves candidate details, resume, analysis, and assignment information with strict data isolation.")
    public ResponseEntity<InstructorCandidateDetailResponse> getAssignedCandidateDetail(
            @PathVariable UUID candidateId,
            @AuthenticationPrincipal UserPrincipal principal) {

        return ResponseEntity.ok(
                instructorCandidateService.getAssignedCandidateDetail(candidateId, principal.getId())
        );
    }

    @GetMapping("/assignments")
    @Operation(summary = "List instructor assignments", description = "Retrieves candidate assignments for the authenticated instructor.")
    public ResponseEntity<Page<CandidateAssignmentDetailResponse>> getAssignments(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) AssignmentStatus status,
            @PageableDefault(size = 15, sort = "assignedAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal) {

        return ResponseEntity.ok(
                instructorCandidateService.getAssignedCandidates(principal.getId(), search, status, pageable)
        );
    }

    @GetMapping("/assignments/{assignmentId}")
    @Operation(summary = "Get assignment by ID", description = "Retrieves a single candidate assignment for the authenticated instructor.")
    public ResponseEntity<CandidateAssignmentDetailResponse> getAssignmentById(
            @PathVariable UUID assignmentId,
            @AuthenticationPrincipal UserPrincipal principal) {

        return ResponseEntity.ok(
                instructorCandidateService.getAssignmentById(assignmentId, principal.getId())
        );
    }

    @PostMapping("/assignments/{assignmentId}/accept")
    @Operation(summary = "Accept candidate assignment", description = "Accepts a candidate assignment, updating status to ACCEPTED and notifying the engineer.")
    public ResponseEntity<CandidateAssignmentDetailResponse> acceptAssignment(
            @PathVariable UUID assignmentId,
            @AuthenticationPrincipal UserPrincipal principal,
            jakarta.servlet.http.HttpServletRequest httpRequest) {

        String ipAddress = httpRequest.getRemoteAddr();
        return ResponseEntity.ok(
                instructorCandidateService.acceptAssignment(assignmentId, principal.getId(), ipAddress)
        );
    }

    @PostMapping("/assignments/{assignmentId}/decline")
    @Operation(summary = "Decline candidate assignment", description = "Declines a candidate assignment with mandatory reason, updating status to DECLINED and notifying the engineer.")
    public ResponseEntity<CandidateAssignmentDetailResponse> declineAssignment(
            @PathVariable UUID assignmentId,
            @jakarta.validation.Valid @org.springframework.web.bind.annotation.RequestBody com.agenthire.dto.assignment.AssignmentDeclineRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            jakarta.servlet.http.HttpServletRequest httpRequest) {

        String ipAddress = httpRequest.getRemoteAddr();
        return ResponseEntity.ok(
                instructorCandidateService.declineAssignment(assignmentId, request, principal.getId(), ipAddress)
        );
    }

    @GetMapping("/dashboard/stats")
    @Operation(summary = "Get instructor dashboard statistics", description = "Retrieves real metrics on assigned, pending, accepted, and declined candidates.")
    public ResponseEntity<com.agenthire.dto.assignment.InstructorDashboardStatsResponse> getDashboardStats(
            @AuthenticationPrincipal UserPrincipal principal) {

        return ResponseEntity.ok(
                instructorCandidateService.getDashboardStats(principal.getId())
        );
    }
}
