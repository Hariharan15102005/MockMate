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
}
