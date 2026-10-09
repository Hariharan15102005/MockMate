package com.agenthire.service;

import com.agenthire.dto.candidate.UserSummaryResponse;
import com.agenthire.dto.resume.AiResumeAnalysisRequest;
import com.agenthire.dto.resume.AiResumeAnalysisResponse;
import com.agenthire.dto.resume.ResumeAnalysisResponse;
import com.agenthire.dto.resume.ResumeResponse;
import com.agenthire.entity.Candidate;
import com.agenthire.entity.Resume;
import com.agenthire.entity.ResumeAnalysis;
import com.agenthire.entity.User;
import com.agenthire.entity.enums.CandidateStatus;
import com.agenthire.entity.enums.ResumeStatus;
import com.agenthire.exception.InvalidStatusTransitionException;
import com.agenthire.exception.ResourceNotFoundException;
import com.agenthire.repository.CandidateRepository;
import com.agenthire.repository.ResumeAnalysisRepository;
import com.agenthire.repository.ResumeRepository;
import com.agenthire.repository.UserRepository;
import com.agenthire.service.ai.AiServiceClient;
import com.agenthire.service.extraction.ResumeTextExtractorService;
import com.agenthire.service.storage.ResumeStorageService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EngineerResumeService {

    private static final long MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

    private final ResumeRepository resumeRepository;
    private final ResumeAnalysisRepository resumeAnalysisRepository;
    private final CandidateRepository candidateRepository;
    private final UserRepository userRepository;
    private final ResumeStorageService resumeStorageService;
    private final ResumeTextExtractorService resumeTextExtractorService;
    private final AiServiceClient aiServiceClient;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    @Transactional
    public ResumeResponse uploadResume(UUID candidateId, MultipartFile file, UUID engineerUserId, String ipAddress) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found with ID: " + candidateId));

        // Enforce candidate verification rule
        if (candidate.getStatus() != CandidateStatus.VERIFIED) {
            throw new InvalidStatusTransitionException(
                    "Resume upload is permitted only for VERIFIED candidates. Current candidate status is: " + candidate.getStatus()
            );
        }

        // Validate File
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Resume file cannot be empty.");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("File size (" + file.getSize() + " bytes) exceeds the maximum allowed 10 MB limit.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            originalFilename = "resume.pdf";
        }
        originalFilename = originalFilename.trim();

        String extension = getFileExtension(originalFilename);
        if (!"pdf".equals(extension) && !"docx".equals(extension)) {
            throw new IllegalArgumentException("Unsupported file type '." + extension + "'. Only PDF and DOCX formats are supported.");
        }

        User engineerUser = userRepository.findById(engineerUserId).orElse(null);

        // Versioning: Mark previous resumes as not current
        List<Resume> existingResumes = resumeRepository.findByCandidateIdOrderByVersionDesc(candidateId);
        int nextVersion = 1;
        if (!existingResumes.isEmpty()) {
            nextVersion = existingResumes.get(0).getVersion() + 1;
            for (Resume existing : existingResumes) {
                if (Boolean.TRUE.equals(existing.getIsCurrent())) {
                    existing.setIsCurrent(false);
                    resumeRepository.save(existing);
                }
            }
        }

        // Store file securely
        String storageKey = resumeStorageService.storeResume(file, "." + extension);

        String contentType = file.getContentType();
        if (contentType == null || contentType.trim().isEmpty()) {
            contentType = "pdf".equals(extension) ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        }

        Resume resume = Resume.builder()
                .candidate(candidate)
                .fileName(originalFilename)
                .filePath(storageKey)
                .fileType(contentType)
                .fileSize(file.getSize())
                .uploadedBy(engineerUser)
                .uploadedAt(Instant.now())
                .version(nextVersion)
                .isCurrent(true)
                .status(ResumeStatus.UPLOADED)
                .build();

        Resume savedResume = resumeRepository.save(resume);
        log.info("Uploaded resume ID: {}, version: {} for candidate ID: {}", savedResume.getId(), nextVersion, candidateId);

        auditLogService.logEvent(
                engineerUserId,
                "RESUME_UPLOADED",
                "Resume",
                savedResume.getId(),
                "Resume document uploaded (v" + nextVersion + ", " + originalFilename + ").",
                "{\"candidateId\":\"" + candidate.getId() + "\",\"fileName\":\"" + originalFilename + "\",\"version\":" + nextVersion + ",\"fileSize\":" + file.getSize() + "}",
                ipAddress
        );

        // Automatic Text Extraction & AI Analysis
        processResumeAiAnalysis(savedResume, candidate, extension, engineerUserId, ipAddress);

        return mapToResumeResponse(savedResume);
    }

    private void processResumeAiAnalysis(Resume resume, Candidate candidate, String extension, UUID engineerUserId, String ipAddress) {
        try {
            resume.setStatus(ResumeStatus.PROCESSING);
            resumeRepository.save(resume);

            auditLogService.logEvent(
                    engineerUserId,
                    "RESUME_ANALYSIS_STARTED",
                    "Resume",
                    resume.getId(),
                    "Resume text extraction and AI analysis initiated.",
                    "{\"candidateId\":\"" + candidate.getId() + "\",\"resumeId\":\"" + resume.getId() + "\"}",
                    ipAddress
            );

            // 1. Text Extraction
            String extractedText;
            try (InputStream stream = resumeStorageService.loadAsStream(resume.getFilePath())) {
                extractedText = resumeTextExtractorService.extractText(stream, extension);
            }
            resume.setExtractedText(extractedText);

            // 2. Call FastAPI AI Service
            AiResumeAnalysisRequest aiRequest = AiResumeAnalysisRequest.builder()
                    .candidateId(candidate.getId().toString())
                    .resumeId(resume.getId().toString())
                    .resumeText(extractedText)
                    .appliedRole(candidate.getAppliedRole())
                    .build();

            AiResumeAnalysisResponse aiResponse = aiServiceClient.analyzeResume(aiRequest);

            // 3. Persist Structured ResumeAnalysis
            ResumeAnalysis analysis = ResumeAnalysis.builder()
                    .resume(resume)
                    .summary(aiResponse.getSummary())
                    .skillsJson(toJsonSafe(aiResponse.getSkills()))
                    .languagesJson(toJsonSafe(aiResponse.getLanguages()))
                    .frameworksJson(toJsonSafe(aiResponse.getFrameworks()))
                    .databasesJson(toJsonSafe(aiResponse.getDatabases()))
                    .toolsJson(toJsonSafe(aiResponse.getTools()))
                    .educationJson(toJsonSafe(aiResponse.getEducation()))
                    .experienceJson(toJsonSafe(aiResponse.getExperience()))
                    .projectsJson(toJsonSafe(aiResponse.getProjects()))
                    .certificationsJson(toJsonSafe(aiResponse.getCertifications()))
                    .strengthAreasJson(toJsonSafe(aiResponse.getStrengths()))
                    .potentialGapsJson(toJsonSafe(aiResponse.getPotentialGaps()))
                    .roleRelevanceScore(aiResponse.getRoleRelevance() != null ? aiResponse.getRoleRelevance().getScore() : null)
                    .roleRelevanceReason(aiResponse.getRoleRelevance() != null ? aiResponse.getRoleRelevance().getReason() : null)
                    .rawAnalysisJson(toJsonSafe(aiResponse))
                    .analyzedAt(Instant.now())
                    .analysisVersion(aiResponse.getAnalysisVersion() != null ? aiResponse.getAnalysisVersion() : "1.0.0")
                    .build();

            resumeAnalysisRepository.save(analysis);

            resume.setStatus(ResumeStatus.ANALYZED);
            resumeRepository.save(resume);
            log.info("Resume ID {} successfully analyzed by AI Service.", resume.getId());

            auditLogService.logEvent(
                    engineerUserId,
                    "RESUME_ANALYSIS_COMPLETED",
                    "Resume",
                    resume.getId(),
                    "Resume AI analysis completed and structured findings stored.",
                    "{\"candidateId\":\"" + candidate.getId() + "\",\"resumeId\":\"" + resume.getId() + "\"}",
                    ipAddress
            );

        } catch (Exception e) {
            log.error("Resume AI analysis failed for resume ID: {}. Error: {}", resume.getId(), e.getMessage());
            resume.setStatus(ResumeStatus.ANALYSIS_FAILED);
            resumeRepository.save(resume);

            auditLogService.logEvent(
                    engineerUserId,
                    "RESUME_ANALYSIS_FAILED",
                    "Resume",
                    resume.getId(),
                    "Resume AI analysis failed: " + e.getMessage(),
                    "{\"candidateId\":\"" + candidate.getId() + "\",\"resumeId\":\"" + resume.getId() + "\"}",
                    ipAddress
            );
        }
    }

    @Transactional(readOnly = true)
    public List<ResumeResponse> getResumesByCandidate(UUID candidateId) {
        if (!candidateRepository.existsById(candidateId)) {
            throw new ResourceNotFoundException("Candidate not found with ID: " + candidateId);
        }
        return resumeRepository.findByCandidateIdOrderByVersionDesc(candidateId)
                .stream()
                .map(this::mapToResumeResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ResumeResponse getCurrentResumeByCandidate(UUID candidateId) {
        Resume resume = resumeRepository.findByCandidateIdAndIsCurrentTrue(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("No current resume found for candidate ID: " + candidateId));
        return mapToResumeResponse(resume);
    }

    @Transactional(readOnly = true)
    public ResumeResponse getResumeById(UUID resumeId) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found with ID: " + resumeId));
        return mapToResumeResponse(resume);
    }

    @Transactional(readOnly = true)
    public ResumeAnalysisResponse getResumeAnalysis(UUID resumeId) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found with ID: " + resumeId));

        ResumeAnalysis analysis = resumeAnalysisRepository.findByResumeId(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("No AI analysis found for resume ID: " + resumeId));

        return mapToAnalysisResponse(analysis, resume);
    }

    @Transactional(readOnly = true)
    public Resource downloadResumeFile(UUID resumeId) {
        Resume resume = resumeRepository.findById(resumeId)
                .orElseThrow(() -> new ResourceNotFoundException("Resume not found with ID: " + resumeId));

        return resumeStorageService.loadAsResource(resume.getFilePath());
    }

    public ResumeResponse mapToResumeResponse(Resume resume) {
        UserSummaryResponse uploadedBySummary = resume.getUploadedBy() != null
                ? UserSummaryResponse.builder()
                .id(resume.getUploadedBy().getId())
                .fullName(resume.getUploadedBy().getFullName())
                .email(resume.getUploadedBy().getEmail())
                .build()
                : null;

        return ResumeResponse.builder()
                .id(resume.getId())
                .candidateId(resume.getCandidate().getId())
                .fileName(resume.getFileName())
                .fileType(resume.getFileType())
                .fileSize(resume.getFileSize())
                .version(resume.getVersion())
                .isCurrent(resume.getIsCurrent())
                .status(resume.getStatus())
                .uploadedBy(uploadedBySummary)
                .uploadedAt(resume.getUploadedAt())
                .createdAt(resume.getCreatedAt())
                .updatedAt(resume.getUpdatedAt())
                .build();
    }

    private ResumeAnalysisResponse mapToAnalysisResponse(ResumeAnalysis analysis, Resume resume) {
        List<String> skills = fromJsonSafe(analysis.getSkillsJson(), new TypeReference<>() {});
        List<String> languages = fromJsonSafe(analysis.getLanguagesJson(), new TypeReference<>() {});
        List<String> frameworks = fromJsonSafe(analysis.getFrameworksJson(), new TypeReference<>() {});
        List<String> databases = fromJsonSafe(analysis.getDatabasesJson(), new TypeReference<>() {});
        List<String> tools = fromJsonSafe(analysis.getToolsJson(), new TypeReference<>() {});
        List<AiResumeAnalysisResponse.EducationDto> education = fromJsonSafe(analysis.getEducationJson(), new TypeReference<>() {});
        List<AiResumeAnalysisResponse.ExperienceDto> experience = fromJsonSafe(analysis.getExperienceJson(), new TypeReference<>() {});
        List<AiResumeAnalysisResponse.ProjectDto> projects = fromJsonSafe(analysis.getProjectsJson(), new TypeReference<>() {});
        List<String> certifications = fromJsonSafe(analysis.getCertificationsJson(), new TypeReference<>() {});
        List<String> strengths = fromJsonSafe(analysis.getStrengthAreasJson(), new TypeReference<>() {});
        List<String> potentialGaps = fromJsonSafe(analysis.getPotentialGapsJson(), new TypeReference<>() {});

        AiResumeAnalysisResponse.RoleRelevanceDto roleRelevance = null;
        if (analysis.getRoleRelevanceScore() != null || analysis.getRoleRelevanceReason() != null) {
            roleRelevance = AiResumeAnalysisResponse.RoleRelevanceDto.builder()
                    .score(analysis.getRoleRelevanceScore())
                    .reason(analysis.getRoleRelevanceReason())
                    .build();
        }

        return ResumeAnalysisResponse.builder()
                .id(analysis.getId())
                .resumeId(resume.getId())
                .candidateId(resume.getCandidate().getId())
                .summary(analysis.getSummary())
                .skills(skills)
                .languages(languages)
                .frameworks(frameworks)
                .databases(databases)
                .tools(tools)
                .education(education)
                .experience(experience)
                .projects(projects)
                .certifications(certifications)
                .strengths(strengths)
                .potentialGaps(potentialGaps)
                .roleRelevance(roleRelevance)
                .analyzedAt(analysis.getAnalyzedAt())
                .analysisVersion(analysis.getAnalysisVersion())
                .createdAt(analysis.getCreatedAt())
                .build();
    }

    private String toJsonSafe(Object obj) {
        if (obj == null) return null;
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.error("Failed to serialize object to JSON", e);
            return null;
        }
    }

    private <T> T fromJsonSafe(String json, TypeReference<T> typeRef) {
        if (json == null || json.trim().isEmpty()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, typeRef);
        } catch (Exception e) {
            log.warn("Failed to parse JSON string to {}: {}", typeRef.getType(), e.getMessage());
            return null;
        }
    }

    private String getFileExtension(String filename) {
        int dotIdx = filename.lastIndexOf('.');
        if (dotIdx == -1 || dotIdx == filename.length() - 1) {
            return "";
        }
        return filename.substring(dotIdx + 1).toLowerCase();
    }
}
