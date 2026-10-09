package com.agenthire.service;

import com.agenthire.dto.candidate.CandidateCreateRequest;
import com.agenthire.dto.candidate.CandidateResponse;
import com.agenthire.dto.candidate.CandidateStatsResponse;
import com.agenthire.dto.candidate.CandidateUpdateRequest;
import com.agenthire.entity.Candidate;
import com.agenthire.entity.enums.CandidateStatus;
import com.agenthire.exception.DuplicateResourceException;
import com.agenthire.exception.ResourceNotFoundException;
import com.agenthire.repository.CandidateRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EngineerCandidateService {

    private final CandidateRepository candidateRepository;
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

    @Transactional(readOnly = true)
    public CandidateStatsResponse getDashboardStats() {
        return CandidateStatsResponse.builder()
                .totalCandidates(candidateRepository.count())
                .pendingVerification(candidateRepository.countByStatus(CandidateStatus.PENDING_VERIFICATION))
                .verified(candidateRepository.countByStatus(CandidateStatus.VERIFIED))
                .sentToInstructors(candidateRepository.countByStatus(CandidateStatus.SENT_TO_INSTRUCTOR))
                .build();
    }

    private CandidateResponse mapToResponse(Candidate candidate) {
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
                .createdAt(candidate.getCreatedAt())
                .updatedAt(candidate.getUpdatedAt())
                .build();
    }
}
