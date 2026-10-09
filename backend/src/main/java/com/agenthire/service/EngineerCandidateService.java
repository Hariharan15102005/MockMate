package com.agenthire.service;

import com.agenthire.dto.candidate.CandidateAuditResponse;
import com.agenthire.dto.candidate.CandidateCreateRequest;
import com.agenthire.dto.candidate.CandidateRejectionRequest;
import com.agenthire.dto.candidate.CandidateResponse;
import com.agenthire.dto.candidate.CandidateStatsResponse;
import com.agenthire.dto.candidate.CandidateUpdateRequest;
import com.agenthire.dto.candidate.UserSummaryResponse;
import com.agenthire.entity.AuditLog;
import com.agenthire.entity.Candidate;
import com.agenthire.entity.User;
import com.agenthire.entity.enums.CandidateStatus;
import com.agenthire.exception.DuplicateResourceException;
import com.agenthire.exception.InvalidStatusTransitionException;
import com.agenthire.exception.ResourceNotFoundException;
import com.agenthire.repository.AuditLogRepository;
import com.agenthire.repository.CandidateRepository;
import com.agenthire.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EngineerCandidateService {

    private final CandidateRepository candidateRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditLogService auditLogService;

    @Transactional
    public CandidateResponse createCandidate(CandidateCreateRequest request, UUID engineerUserId, String ipAddress) {
        String trimmedAppId = request.getApplicationId().trim();
        if (candidateRepository.existsByApplicationId(trimmedAppId)) {
            throw new DuplicateResourceException("Candidate with application ID '" + trimmedAppId + "' already exists");
        }

        Candidate candidate = Candidate.builder()
                .fullName(request.getFullName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .phone(request.getPhone().trim())
                .location(request.getLocation().trim())
                .college(request.getCollege().trim())
                .degree(request.getDegree().trim())
                .department(request.getDepartment().trim())
                .graduationYear(request.getGraduationYear())
                .cgpa(request.getCgpa())
                .experienceLevel(request.getExperienceLevel() != null ? request.getExperienceLevel().trim() : null)
                .appliedRole(request.getAppliedRole().trim())
                .applicationId(trimmedAppId)
                .source(request.getSource() != null ? request.getSource().trim() : null)
                .status(CandidateStatus.PENDING_VERIFICATION)
                .engineerNotes(request.getEngineerNotes())
                .build();

        Candidate saved = candidateRepository.save(candidate);
        log.info("Interview Engineer {} created Candidate with ID: {}, Application ID: {}", engineerUserId, saved.getId(), saved.getApplicationId());

        auditLogService.logEvent(
                engineerUserId,
                "CANDIDATE_CREATED",
                "Candidate",
                saved.getId(),
                "Candidate intake created by interview engineer. Status set to PENDING_VERIFICATION.",
                "{\"applicationId\":\"" + saved.getApplicationId() + "\",\"appliedRole\":\"" + saved.getAppliedRole() + "\"}",
                ipAddress
        );

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<CandidateResponse> getCandidates(
            Pageable pageable,
            String search,
            CandidateStatus status,
            String experienceLevel,
            String appliedRole
    ) {
        Specification<Candidate> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.trim().isEmpty()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                Predicate nameMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("fullName")), searchPattern);
                Predicate emailMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("email")), searchPattern);
                Predicate appIdMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("applicationId")), searchPattern);
                Predicate roleMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("appliedRole")), searchPattern);
                Predicate collegeMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("college")), searchPattern);
                predicates.add(criteriaBuilder.or(nameMatch, emailMatch, appIdMatch, roleMatch, collegeMatch));
            }

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            if (experienceLevel != null && !experienceLevel.trim().isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("experienceLevel"), experienceLevel.trim()));
            }

            if (appliedRole != null && !appliedRole.trim().isEmpty()) {
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("appliedRole")), "%" + appliedRole.trim().toLowerCase() + "%"));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return candidateRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    @Transactional(readOnly = true)
    public CandidateResponse getCandidateById(UUID candidateId) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found with ID: " + candidateId));
        return mapToResponse(candidate);
    }

    @Transactional
    public CandidateResponse updateCandidate(UUID candidateId, CandidateUpdateRequest request, UUID engineerUserId, String ipAddress) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found with ID: " + candidateId));

        String trimmedAppId = request.getApplicationId().trim();
        if (!candidate.getApplicationId().equalsIgnoreCase(trimmedAppId) && candidateRepository.existsByApplicationId(trimmedAppId)) {
            throw new DuplicateResourceException("Candidate with application ID '" + trimmedAppId + "' already exists");
        }

        candidate.setFullName(request.getFullName().trim());
        candidate.setEmail(request.getEmail().trim().toLowerCase());
        candidate.setPhone(request.getPhone().trim());
        candidate.setLocation(request.getLocation().trim());
        candidate.setCollege(request.getCollege().trim());
        candidate.setDegree(request.getDegree().trim());
        candidate.setDepartment(request.getDepartment().trim());
        candidate.setGraduationYear(request.getGraduationYear());
        candidate.setCgpa(request.getCgpa());
        candidate.setExperienceLevel(request.getExperienceLevel() != null ? request.getExperienceLevel().trim() : null);
        candidate.setAppliedRole(request.getAppliedRole().trim());
        candidate.setApplicationId(trimmedAppId);
        candidate.setSource(request.getSource() != null ? request.getSource().trim() : null);
        candidate.setEngineerNotes(request.getEngineerNotes());

        Candidate updated = candidateRepository.save(candidate);
        log.info("Interview Engineer {} updated Candidate with ID: {}", engineerUserId, updated.getId());

        auditLogService.logEvent(
                engineerUserId,
                "CANDIDATE_UPDATED",
                "Candidate",
                updated.getId(),
                "Candidate intake details updated by interview engineer.",
                "{\"applicationId\":\"" + updated.getApplicationId() + "\"}",
                ipAddress
        );

        return mapToResponse(updated);
    }

    @Transactional
    public CandidateResponse verifyCandidate(UUID candidateId, UUID engineerUserId, String ipAddress) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found with ID: " + candidateId));

        if (candidate.getStatus() != CandidateStatus.PENDING_VERIFICATION) {
            throw new InvalidStatusTransitionException("Candidate is no longer pending verification (current status: " + candidate.getStatus() + ")");
        }

        User engineerUser = userRepository.findById(engineerUserId).orElse(null);
        CandidateStatus previousStatus = candidate.getStatus();

        candidate.setStatus(CandidateStatus.VERIFIED);
        candidate.setVerifiedBy(engineerUser);
        candidate.setVerifiedAt(Instant.now());
        candidate.setRejectedBy(null);
        candidate.setRejectedAt(null);
        candidate.setRejectionReason(null);

        Candidate saved = candidateRepository.save(candidate);
        log.info("Interview Engineer {} verified Candidate ID: {}, Application ID: {}", engineerUserId, saved.getId(), saved.getApplicationId());

        auditLogService.logEvent(
                engineerUserId,
                "CANDIDATE_VERIFIED",
                "Candidate",
                saved.getId(),
                "Candidate verified by interview engineer.",
                "{\"applicationId\":\"" + saved.getApplicationId() + "\",\"previousStatus\":\"" + previousStatus + "\",\"newStatus\":\"VERIFIED\"}",
                ipAddress
        );

        return mapToResponse(saved);
    }

    @Transactional
    public CandidateResponse rejectCandidate(UUID candidateId, CandidateRejectionRequest request, UUID engineerUserId, String ipAddress) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found with ID: " + candidateId));

        if (candidate.getStatus() != CandidateStatus.PENDING_VERIFICATION) {
            throw new InvalidStatusTransitionException("Candidate is no longer pending verification (current status: " + candidate.getStatus() + ")");
        }

        User engineerUser = userRepository.findById(engineerUserId).orElse(null);
        CandidateStatus previousStatus = candidate.getStatus();
        String reason = request.getReason().trim();

        candidate.setStatus(CandidateStatus.REJECTED);
        candidate.setRejectedBy(engineerUser);
        candidate.setRejectedAt(Instant.now());
        candidate.setRejectionReason(reason);
        candidate.setVerifiedBy(null);
        candidate.setVerifiedAt(null);

        Candidate saved = candidateRepository.save(candidate);
        log.info("Interview Engineer {} rejected Candidate ID: {}, Application ID: {}", engineerUserId, saved.getId(), saved.getApplicationId());

        String sanitizedReason = reason.replace("\"", "\\\"");
        auditLogService.logEvent(
                engineerUserId,
                "CANDIDATE_REJECTED",
                "Candidate",
                saved.getId(),
                "Candidate rejected by interview engineer. Reason: " + reason,
                "{\"applicationId\":\"" + saved.getApplicationId() + "\",\"previousStatus\":\"" + previousStatus + "\",\"newStatus\":\"REJECTED\",\"rejectionReason\":\"" + sanitizedReason + "\"}",
                ipAddress
        );

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<CandidateAuditResponse> getCandidateAuditLogs(UUID candidateId) {
        if (!candidateRepository.existsById(candidateId)) {
            throw new ResourceNotFoundException("Candidate not found with ID: " + candidateId);
        }

        List<AuditLog> logs = auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc("Candidate", candidateId);

        return logs.stream().map(log -> CandidateAuditResponse.builder()
                .id(log.getId())
                .action(log.getAction())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .description(log.getDescription())
                .metadataJson(log.getMetadataJson())
                .ipAddress(log.getIpAddress())
                .actor(log.getUser() != null ? UserSummaryResponse.builder()
                        .id(log.getUser().getId())
                        .fullName(log.getUser().getFullName())
                        .email(log.getUser().getEmail())
                        .build() : null)
                .createdAt(log.getCreatedAt())
                .build()).toList();
    }

    @Transactional(readOnly = true)
    public CandidateStatsResponse getDashboardStats() {
        return CandidateStatsResponse.builder()
                .totalCandidates(candidateRepository.count())
                .pendingVerification(candidateRepository.countByStatus(CandidateStatus.PENDING_VERIFICATION))
                .verified(candidateRepository.countByStatus(CandidateStatus.VERIFIED))
                .rejected(candidateRepository.countByStatus(CandidateStatus.REJECTED))
                .sentToInstructors(candidateRepository.countByStatus(CandidateStatus.SENT_TO_INSTRUCTOR))
                .build();
    }

    private CandidateResponse mapToResponse(Candidate candidate) {
        UserSummaryResponse verifiedBySummary = candidate.getVerifiedBy() != null
                ? UserSummaryResponse.builder()
                .id(candidate.getVerifiedBy().getId())
                .fullName(candidate.getVerifiedBy().getFullName())
                .email(candidate.getVerifiedBy().getEmail())
                .build()
                : null;

        UserSummaryResponse rejectedBySummary = candidate.getRejectedBy() != null
                ? UserSummaryResponse.builder()
                .id(candidate.getRejectedBy().getId())
                .fullName(candidate.getRejectedBy().getFullName())
                .email(candidate.getRejectedBy().getEmail())
                .build()
                : null;

        return CandidateResponse.builder()
                .id(candidate.getId())
                .applicationId(candidate.getApplicationId())
                .fullName(candidate.getFullName())
                .email(candidate.getEmail())
                .phone(candidate.getPhone())
                .location(candidate.getLocation())
                .college(candidate.getCollege())
                .degree(candidate.getDegree())
                .department(candidate.getDepartment())
                .graduationYear(candidate.getGraduationYear())
                .cgpa(candidate.getCgpa())
                .experienceLevel(candidate.getExperienceLevel())
                .appliedRole(candidate.getAppliedRole())
                .source(candidate.getSource())
                .status(candidate.getStatus())
                .engineerNotes(candidate.getEngineerNotes())
                .rejectionReason(candidate.getRejectionReason())
                .verifiedBy(verifiedBySummary)
                .verifiedAt(candidate.getVerifiedAt())
                .rejectedBy(rejectedBySummary)
                .rejectedAt(candidate.getRejectedAt())
                .createdAt(candidate.getCreatedAt())
                .updatedAt(candidate.getUpdatedAt())
                .build();
    }
}
