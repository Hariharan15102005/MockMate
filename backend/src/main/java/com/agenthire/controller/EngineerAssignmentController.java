package com.agenthire.controller;

import com.agenthire.dto.assignment.CandidateAssignRequest;
import com.agenthire.dto.assignment.CandidateAssignmentDetailResponse;
import com.agenthire.dto.assignment.InstructorSummaryResponse;
import com.agenthire.entity.enums.AssignmentStatus;
import com.agenthire.security.UserPrincipal;
import com.agenthire.service.EngineerAssignmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
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
@RequestMapping("/api/engineer")
@RequiredArgsConstructor
@PreAuthorize("hasRole('INTERVIEW_ENGINEER')")
@Tag(name = "Engineer Candidate Assignment", description = "Endpoints for Interview Engineers to route verified candidates to Instructors")
@SecurityRequirement(name = "bearerAuth")
public class EngineerAssignmentController {

    private final EngineerAssignmentService assignmentService;

    @PostMapping("/candidates/{candidateId}/assign")
    @Operation(summary = "Assign candidate to instructor", description = "Routes a verified candidate with resume to an active instructor for interview review.")
    public ResponseEntity<CandidateAssignmentDetailResponse> assignCandidate(
            @PathVariable UUID candidateId,
            @Valid @RequestBody CandidateAssignRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest servletRequest) {

        String ipAddress = servletRequest.getRemoteAddr();
        CandidateAssignmentDetailResponse response = assignmentService.assignCandidate(
                candidateId, request, principal.getId(), ipAddress
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/instructors")
    @Operation(summary = "List available instructors", description = "Retrieves active instructors available for candidate assignment.")
    public ResponseEntity<Page<InstructorSummaryResponse>> getInstructors(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "user.fullName", direction = Sort.Direction.ASC) Pageable pageable) {

        return ResponseEntity.ok(assignmentService.getInstructors(search, pageable));
    }

    @GetMapping("/assignments")
    @Operation(summary = "List candidate assignments", description = "Retrieves paginated candidate assignments with optional filters.")
    public ResponseEntity<Page<CandidateAssignmentDetailResponse>> getAssignments(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) AssignmentStatus status,
            @RequestParam(required = false) UUID instructorId,
            @PageableDefault(size = 15, sort = "assignedAt", direction = Sort.Direction.DESC) Pageable pageable) {

        return ResponseEntity.ok(assignmentService.getAssignments(search, status, instructorId, pageable));
    }

    @GetMapping("/assignments/{assignmentId}")
    @Operation(summary = "Get assignment details", description = "Retrieves detailed information for a specific candidate assignment.")
    public ResponseEntity<CandidateAssignmentDetailResponse> getAssignmentById(@PathVariable UUID assignmentId) {
        return ResponseEntity.ok(assignmentService.getAssignmentById(assignmentId));
    }
}
