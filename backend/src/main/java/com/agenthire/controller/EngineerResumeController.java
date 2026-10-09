package com.agenthire.controller;

import com.agenthire.dto.resume.ResumeAnalysisResponse;
import com.agenthire.dto.resume.ResumeResponse;
import com.agenthire.security.UserPrincipal;
import com.agenthire.service.EngineerResumeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/engineer")
@RequiredArgsConstructor
@Tag(name = "Interview Engineer — Resume Management & AI Analysis", description = "Resume upload, versioning, AI parsing, and secure download APIs for Interview Engineers")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('INTERVIEW_ENGINEER')")
public class EngineerResumeController {

    private final EngineerResumeService resumeService;

    @PostMapping(value = "/candidates/{candidateId}/resume", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload candidate resume", description = "Uploads and persists a candidate resume (PDF/DOCX, <= 10MB), triggers text extraction and AI analysis.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Resume uploaded successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid file format or size exceeded"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Candidate not found"),
            @ApiResponse(responseCode = "409", description = "Candidate not verified")
    })
    public ResponseEntity<ResumeResponse> uploadResume(
            @PathVariable UUID candidateId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest servletRequest
    ) {
        String clientIp = servletRequest.getRemoteAddr();
        ResumeResponse response = resumeService.uploadResume(candidateId, file, principal.getId(), clientIp);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/candidates/{candidateId}/resumes")
    @Operation(summary = "List candidate resumes", description = "Retrieves all resume versions uploaded for a candidate.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Resumes retrieved"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Candidate not found")
    })
    public ResponseEntity<List<ResumeResponse>> getCandidateResumes(@PathVariable UUID candidateId) {
        List<ResumeResponse> resumes = resumeService.getResumesByCandidate(candidateId);
        return ResponseEntity.ok(resumes);
    }

    @GetMapping("/candidates/{candidateId}/resume/current")
    @Operation(summary = "Get current candidate resume", description = "Retrieves the active/latest resume record for a candidate.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Current resume retrieved"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Resume not found")
    })
    public ResponseEntity<ResumeResponse> getCurrentResume(@PathVariable UUID candidateId) {
        ResumeResponse resume = resumeService.getCurrentResumeByCandidate(candidateId);
        return ResponseEntity.ok(resume);
    }

    @GetMapping("/resumes/{resumeId}")
    @Operation(summary = "Get resume by ID", description = "Retrieves metadata for a specific resume record.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Resume retrieved"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Resume not found")
    })
    public ResponseEntity<ResumeResponse> getResumeById(@PathVariable UUID resumeId) {
        ResumeResponse resume = resumeService.getResumeById(resumeId);
        return ResponseEntity.ok(resume);
    }

    @GetMapping("/resumes/{resumeId}/analysis")
    @Operation(summary = "Get structured resume analysis", description = "Retrieves structured AI analysis findings for an analyzed resume.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Analysis retrieved"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Analysis not found")
    })
    public ResponseEntity<ResumeAnalysisResponse> getResumeAnalysis(@PathVariable UUID resumeId) {
        ResumeAnalysisResponse analysis = resumeService.getResumeAnalysis(resumeId);
        return ResponseEntity.ok(analysis);
    }

    @GetMapping("/resumes/{resumeId}/download")
    @Operation(summary = "Download resume file", description = "Streams the stored resume document with secure authentication.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "File stream returned"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden"),
            @ApiResponse(responseCode = "404", description = "Resume file not found")
    })
    public ResponseEntity<Resource> downloadResume(@PathVariable UUID resumeId) throws IOException {
        ResumeResponse resumeMeta = resumeService.getResumeById(resumeId);
        Resource fileResource = resumeService.downloadResumeFile(resumeId);

        String contentType = resumeMeta.getFileType() != null ? resumeMeta.getFileType() : MediaType.APPLICATION_OCTET_STREAM_VALUE;

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resumeMeta.getFileName() + "\"")
                .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(fileResource.contentLength()))
                .body(fileResource);
    }
}
