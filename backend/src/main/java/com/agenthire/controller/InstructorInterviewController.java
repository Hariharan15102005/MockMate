package com.agenthire.controller;

import com.agenthire.dto.interview.AcceptedAssignmentSummaryResponse;
import com.agenthire.dto.interview.CreateInterviewRequest;
import com.agenthire.dto.interview.InterviewDetailResponse;
import com.agenthire.dto.interview.InterviewSummaryResponse;
import com.agenthire.dto.interview.UpdateInterviewRequest;
import com.agenthire.entity.enums.InterviewStatus;
import com.agenthire.security.UserPrincipal;
import com.agenthire.service.InstructorInterviewService;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/instructor/interviews")
@RequiredArgsConstructor
@PreAuthorize("hasRole('INSTRUCTOR')")
@Tag(name = "Instructor Interview Builder", description = "Endpoints for Instructors to configure, draft, and publish interview blueprints")
@SecurityRequirement(name = "bearerAuth")
public class InstructorInterviewController {

    private final InstructorInterviewService interviewService;

    @PostMapping
    @Operation(summary = "Create interview blueprint", description = "Creates an interview blueprint draft for an accepted candidate assignment.")
    public ResponseEntity<InterviewDetailResponse> createInterview(
            @Valid @RequestBody CreateInterviewRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {

        String ipAddress = httpRequest.getRemoteAddr();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(interviewService.createInterview(request, principal.getId(), ipAddress));
    }

    @GetMapping
    @Operation(summary = "List instructor interviews", description = "Retrieves paginated interview blueprints created by the authenticated instructor.")
    public ResponseEntity<Page<InterviewSummaryResponse>> getInterviews(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) InterviewStatus status,
            @PageableDefault(size = 15, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal principal) {

        return ResponseEntity.ok(
                interviewService.getInterviews(principal.getId(), search, status, pageable)
        );
    }

    @GetMapping("/candidates/accepted")
    @Operation(summary = "Get accepted candidate assignments", description = "Retrieves candidate assignments accepted by the instructor ready for interview configuration.")
    public ResponseEntity<List<AcceptedAssignmentSummaryResponse>> getAcceptedAssignments(
            @AuthenticationPrincipal UserPrincipal principal) {

        return ResponseEntity.ok(
                interviewService.getAcceptedAssignmentsForInstructor(principal.getId())
        );
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get interview blueprint by ID", description = "Retrieves complete interview details, rounds, questions, and scoring configuration.")
    public ResponseEntity<InterviewDetailResponse> getInterviewById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal) {

        return ResponseEntity.ok(
                interviewService.getInterviewById(id, principal.getId())
        );
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update interview draft blueprint", description = "Updates interview details, rounds, questions, and scoring weights for a DRAFT interview.")
    public ResponseEntity<InterviewDetailResponse> updateInterview(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateInterviewRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {

        String ipAddress = httpRequest.getRemoteAddr();
        return ResponseEntity.ok(
                interviewService.updateInterview(id, request, principal.getId(), ipAddress)
        );
    }

    @PostMapping("/{id}/publish")
    @Operation(summary = "Publish interview blueprint", description = "Validates rounds, durations, and 100% scoring weights, transitioning the blueprint from DRAFT to PUBLISHED.")
    public ResponseEntity<InterviewDetailResponse> publishInterview(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest httpRequest) {

        String ipAddress = httpRequest.getRemoteAddr();
        return ResponseEntity.ok(
                interviewService.publishInterview(id, principal.getId(), ipAddress)
        );
    }
}
