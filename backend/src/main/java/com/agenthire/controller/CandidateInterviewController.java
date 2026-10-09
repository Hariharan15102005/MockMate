package com.agenthire.controller;

import com.agenthire.dto.candidate.*;
import com.agenthire.security.UserPrincipal;
import com.agenthire.service.CandidateInterviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "Candidate Interview", description = "Endpoints for candidate interview execution and results")
public class CandidateInterviewController {

    private final CandidateInterviewService candidateInterviewService;

    @GetMapping("/api/candidate/interviews")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Get candidate interviews", description = "Retrieves all published interviews available to the candidate")
    public ResponseEntity<List<CandidateInterviewDto>> getCandidateInterviews(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(candidateInterviewService.getCandidateInterviews(principal.getId()));
    }

    @GetMapping("/api/candidate/interviews/{id}")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Get interview details", description = "Retrieves blueprint details for a specific interview")
    public ResponseEntity<CandidateInterviewDto> getInterviewDetails(
            @PathVariable("id") UUID interviewId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(candidateInterviewService.getInterviewDetails(interviewId, principal.getId()));
    }

    @PostMapping(value = "/api/candidate/interviews/resume/upload", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Upload candidate resume", description = "Uploads candidate resume before interview session")
    public ResponseEntity<com.agenthire.dto.resume.ResumeResponse> uploadResume(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @AuthenticationPrincipal UserPrincipal principal,
            jakarta.servlet.http.HttpServletRequest request
    ) {
        String clientIp = request.getRemoteAddr();
        return ResponseEntity.ok(candidateInterviewService.uploadCandidateResume(file, principal.getId(), clientIp));
    }

    @PostMapping("/api/candidate/interviews/{id}/start-session")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Start or resume interview session")
    public ResponseEntity<StartSessionResponseDto> startOrResumeSession(
            @PathVariable("id") UUID interviewId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(candidateInterviewService.startOrResumeSession(interviewId, principal.getId()));
    }

    @PostMapping({"/api/candidate/interviews/self-service/start", "/api/candidate/interviews/self-service/session"})
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Start or resume self-service AI Resume interview")
    public ResponseEntity<StartSessionResponseDto> startSelfServiceSession(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(candidateInterviewService.startSelfServiceSession(principal.getId()));
    }

    @GetMapping("/api/candidate/interviews/sessions/{sessionId}")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Get interview session details")
    public ResponseEntity<StartSessionResponseDto> getSessionDetails(
            @PathVariable("sessionId") UUID sessionId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(candidateInterviewService.getSessionDetails(sessionId, principal.getId()));
    }

    @GetMapping("/api/candidate/interviews/sessions/{sessionId}/current-question")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Get current interview question")
    public ResponseEntity<CandidateQuestionDto> getCurrentQuestion(
            @PathVariable("sessionId") UUID sessionId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(candidateInterviewService.getCurrentQuestion(sessionId, principal.getId()));
    }

    @PostMapping("/api/candidate/interviews/sessions/{sessionId}/answers")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Submit answer for question")
    public ResponseEntity<SubmitAnswerResponseDto> submitAnswer(
            @PathVariable("sessionId") UUID sessionId,
            @Valid @RequestBody SubmitAnswerRequestDto request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(candidateInterviewService.submitAnswer(sessionId, request, principal.getId()));
    }

    @PostMapping("/api/candidate/interviews/sessions/{sessionId}/timeout")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Record question response-start timeout")
    public ResponseEntity<SubmitAnswerResponseDto> recordQuestionTimeout(
            @PathVariable("sessionId") UUID sessionId,
            @RequestParam(value = "questionId", required = false) UUID questionId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(candidateInterviewService.recordQuestionTimeout(sessionId, questionId, principal.getId()));
    }

    @PostMapping("/api/candidate/interviews/sessions/{sessionId}/events")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Record media and integrity compliance events")
    public ResponseEntity<Void> recordMediaEvent(
            @PathVariable("sessionId") UUID sessionId,
            @Valid @RequestBody RecordMediaEventDto request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        candidateInterviewService.recordMediaEvent(sessionId, request, principal.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/api/candidate/interviews/sessions/{sessionId}/complete")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Complete interview session")
    public ResponseEntity<CandidateInterviewResultDto> completeInterview(
            @PathVariable("sessionId") UUID sessionId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(candidateInterviewService.completeInterview(sessionId, principal.getId()));
    }

    @GetMapping("/api/candidate/interviews/sessions/{sessionId}/result")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Get student interview result")
    public ResponseEntity<CandidateInterviewResultDto> getCandidateResult(
            @PathVariable("sessionId") UUID sessionId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(candidateInterviewService.getCandidateResult(sessionId, principal.getId()));
    }

    @GetMapping("/api/instructor/interviews/sessions/{sessionId}/report")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    @Operation(summary = "Get instructor detailed evaluation report")
    public ResponseEntity<InstructorSessionReportDto> getInstructorReport(
            @PathVariable("sessionId") UUID sessionId,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.ok(candidateInterviewService.getInstructorReport(sessionId, principal.getId()));
    }
}
