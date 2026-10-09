package com.agenthire.service;

import com.agenthire.dto.assignment.CandidateAssignmentDetailResponse;
import com.agenthire.dto.assignment.InstructorCandidateDetailResponse;
import com.agenthire.dto.candidate.CandidateResponse;
import com.agenthire.dto.resume.ResumeAnalysisResponse;
import com.agenthire.dto.resume.ResumeResponse;
import com.agenthire.entity.Candidate;
import com.agenthire.entity.CandidateAssignment;
import com.agenthire.entity.Instructor;
import com.agenthire.entity.Resume;
import com.agenthire.entity.ResumeAnalysis;
import com.agenthire.entity.enums.AssignmentStatus;
import com.agenthire.exception.ResourceNotFoundException;
import com.agenthire.repository.CandidateAssignmentRepository;
import com.agenthire.repository.CandidateRepository;
import com.agenthire.repository.InstructorRepository;
import com.agenthire.repository.ResumeAnalysisRepository;
import com.agenthire.repository.ResumeRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agenthire.dto.assignment.AssignmentDeclineRequest;
import com.agenthire.dto.assignment.InstructorDashboardStatsResponse;
import com.agenthire.entity.User;
import com.agenthire.entity.enums.CandidateStatus;
import com.agenthire.entity.enums.NotificationType;
import com.agenthire.exception.InvalidStatusTransitionException;
import com.agenthire.repository.UserRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class InstructorCandidateService {

    private final CandidateAssignmentRepository assignmentRepository;
    private final CandidateRepository candidateRepository;
    private final InstructorRepository instructorRepository;
    private final ResumeRepository resumeRepository;
    private final ResumeAnalysisRepository resumeAnalysisRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final EngineerAssignmentService engineerAssignmentService;
    private final EngineerResumeService engineerResumeService;
    private final EngineerCandidateService engineerCandidateService;

    @Transactional
    public CandidateAssignmentDetailResponse acceptAssignment(UUID assignmentId, UUID instructorUserId, String ipAddress) {
        Instructor instructor = getInstructorByUserId(instructorUserId);
        User instructorUser = userRepository.findById(instructorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + instructorUserId));

        CandidateAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with ID: " + assignmentId));

        // Strict Ownership Enforcement: Must belong to this instructor
        if (!assignment.getInstructor().getId().equals(instructor.getId())) {
            throw new ResourceNotFoundException("Assignment does not belong to this instructor or does not exist.");
        }

        // Validate Status Transition
        if (assignment.getStatus() != AssignmentStatus.SENT) {
            throw new InvalidStatusTransitionException(
                    "Cannot accept assignment with status: " + assignment.getStatus() + ". Only SENT assignments can be accepted."
            );
        }

        // Apply transition
        assignment.setStatus(AssignmentStatus.ACCEPTED);
        assignment.setAcceptedAt(Instant.now());
        assignment.setAcceptedBy(instructorUser);
        CandidateAssignment savedAssignment = assignmentRepository.save(assignment);

        Candidate candidate = assignment.getCandidate();
        candidate.setStatus(CandidateStatus.ACCEPTED_BY_INSTRUCTOR);
        candidateRepository.save(candidate);

        log.info("Instructor {} accepted CandidateAssignment ID: {} for Candidate: {}",
                instructor.getId(), assignment.getId(), candidate.getId());

        // Notify Interview Engineer
        notificationService.createNotification(
                assignment.getInterviewEngineer().getUser(),
                NotificationType.CANDIDATE_ASSIGNMENT_ACCEPTED,
                "Candidate Assignment Accepted: " + candidate.getFullName(),
                "Instructor " + instructorUser.getFullName() + " accepted candidate " + candidate.getFullName() +
                        " (" + candidate.getApplicationId() + ") for " + assignment.getAppliedRole() + " review.",
                "CandidateAssignment",
                savedAssignment.getId()
        );

        // Audit Log
        auditLogService.logEvent(
                instructorUserId,
                "CANDIDATE_ASSIGNMENT_ACCEPTED",
                "CandidateAssignment",
                savedAssignment.getId(),
                "Instructor " + instructorUser.getFullName() + " accepted candidate " + candidate.getFullName() + " (Status: ACCEPTED).",
                "{\"assignmentId\":\"" + savedAssignment.getId() + "\",\"candidateId\":\"" + candidate.getId() +
                        "\",\"instructorId\":\"" + instructor.getId() + "\",\"previousStatus\":\"SENT\",\"newStatus\":\"ACCEPTED\"}",
                ipAddress
        );

        return engineerAssignmentService.mapToDetailResponse(savedAssignment);
    }

    @Transactional
    public CandidateAssignmentDetailResponse declineAssignment(
            UUID assignmentId, AssignmentDeclineRequest request, UUID instructorUserId, String ipAddress) {

        if (request.getReason() == null || request.getReason().trim().isEmpty()) {
            throw new IllegalArgumentException("Decline reason is mandatory and cannot be empty.");
        }

        Instructor instructor = getInstructorByUserId(instructorUserId);
        User instructorUser = userRepository.findById(instructorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + instructorUserId));

        CandidateAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with ID: " + assignmentId));

        // Strict Ownership Enforcement: Must belong to this instructor
        if (!assignment.getInstructor().getId().equals(instructor.getId())) {
            throw new ResourceNotFoundException("Assignment does not belong to this instructor or does not exist.");
        }

        // Validate Status Transition
        if (assignment.getStatus() != AssignmentStatus.SENT) {
            throw new InvalidStatusTransitionException(
                    "Cannot decline assignment with status: " + assignment.getStatus() + ". Only SENT assignments can be declined."
            );
        }

        String sanitizedReason = request.getReason().trim();

        // Apply transition
        assignment.setStatus(AssignmentStatus.DECLINED);
        assignment.setDeclinedAt(Instant.now());
        assignment.setDeclinedBy(instructorUser);
        assignment.setDeclineReason(sanitizedReason);
        CandidateAssignment savedAssignment = assignmentRepository.save(assignment);

        Candidate candidate = assignment.getCandidate();
        candidate.setStatus(CandidateStatus.VERIFIED); // Re-enable for subsequent routing
        candidateRepository.save(candidate);

        log.info("Instructor {} declined CandidateAssignment ID: {} for Candidate: {}. Reason: {}",
                instructor.getId(), assignment.getId(), candidate.getId(), sanitizedReason);

        // Notify Interview Engineer
        notificationService.createNotification(
                assignment.getInterviewEngineer().getUser(),
                NotificationType.CANDIDATE_ASSIGNMENT_DECLINED,
                "Candidate Assignment Declined: " + candidate.getFullName(),
                "Instructor " + instructorUser.getFullName() + " declined candidate " + candidate.getFullName() +
                        ". Reason: " + sanitizedReason,
                "CandidateAssignment",
                savedAssignment.getId()
        );

        // Audit Log
        auditLogService.logEvent(
                instructorUserId,
                "CANDIDATE_ASSIGNMENT_DECLINED",
                "CandidateAssignment",
                savedAssignment.getId(),
                "Instructor " + instructorUser.getFullName() + " declined candidate " + candidate.getFullName() +
                        ". Reason: " + sanitizedReason,
                "{\"assignmentId\":\"" + savedAssignment.getId() + "\",\"candidateId\":\"" + candidate.getId() +
                        "\",\"instructorId\":\"" + instructor.getId() + "\",\"previousStatus\":\"SENT\",\"newStatus\":\"DECLINED\",\"reason\":\"" +
                        sanitizedReason.replace("\"", "\\\"") + "\"}",
                ipAddress
        );

        return engineerAssignmentService.mapToDetailResponse(savedAssignment);
    }

    @Transactional(readOnly = true)
    public CandidateAssignmentDetailResponse getAssignmentById(UUID assignmentId, UUID instructorUserId) {
        Instructor instructor = getInstructorByUserId(instructorUserId);
        CandidateAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found with ID: " + assignmentId));

        if (!assignment.getInstructor().getId().equals(instructor.getId())) {
            throw new ResourceNotFoundException("Assignment does not belong to this instructor or does not exist.");
        }

        return engineerAssignmentService.mapToDetailResponse(assignment);
    }

    @Transactional(readOnly = true)
    public InstructorDashboardStatsResponse getDashboardStats(UUID instructorUserId) {
        Instructor instructor = getInstructorByUserId(instructorUserId);
        UUID instructorId = instructor.getId();

        long assignedCandidates = assignmentRepository.countByInstructorId(instructorId);
        long pendingReview = assignmentRepository.countByInstructorIdAndStatus(instructorId, AssignmentStatus.SENT);
        long accepted = assignmentRepository.countByInstructorIdAndStatus(instructorId, AssignmentStatus.ACCEPTED);
        long declined = assignmentRepository.countByInstructorIdAndStatus(instructorId, AssignmentStatus.DECLINED);

        return InstructorDashboardStatsResponse.builder()
                .assignedCandidates(assignedCandidates)
                .pendingReview(pendingReview)
                .accepted(accepted)
                .declined(declined)
                .build();
    }

    @Transactional(readOnly = true)
    public Page<CandidateAssignmentDetailResponse> getAssignedCandidates(
            UUID instructorUserId, String search, AssignmentStatus status, Pageable pageable) {

        Instructor instructor = getInstructorByUserId(instructorUserId);

        Specification<CandidateAssignment> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.equal(root.get("instructor").get("id"), instructor.getId()));

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            if (search != null && !search.trim().isEmpty()) {
                String searchLower = "%" + search.trim().toLowerCase() + "%";
                Predicate candidateName = criteriaBuilder.like(criteriaBuilder.lower(root.get("candidate").get("fullName")), searchLower);
                Predicate candidateAppId = criteriaBuilder.like(criteriaBuilder.lower(root.get("candidate").get("applicationId")), searchLower);
                Predicate roleMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("appliedRole")), searchLower);
                predicates.add(criteriaBuilder.or(candidateName, candidateAppId, roleMatch));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return assignmentRepository.findAll(spec, pageable).map(engineerAssignmentService::mapToDetailResponse);
    }

    @Transactional(readOnly = true)
    public InstructorCandidateDetailResponse getAssignedCandidateDetail(UUID candidateId, UUID instructorUserId) {
        Instructor instructor = getInstructorByUserId(instructorUserId);

        // Strict Data Isolation: Candidate MUST be assigned to THIS instructor
        List<CandidateAssignment> assignments = assignmentRepository.findByCandidateIdOrderByAssignedAtDesc(candidateId);
        CandidateAssignment activeAssignment = assignments.stream()
                .filter(a -> a.getInstructor().getId().equals(instructor.getId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Candidate is not assigned to this instructor or does not exist."));

        Candidate candidate = activeAssignment.getCandidate();
        CandidateResponse candidateResponse = engineerCandidateService.mapToResponse(candidate);
        CandidateAssignmentDetailResponse assignmentResponse = engineerAssignmentService.mapToDetailResponse(activeAssignment);

        // Current Resume and AI Analysis (if available)
        ResumeResponse currentResumeResponse = null;
        ResumeAnalysisResponse resumeAnalysisResponse = null;

        List<Resume> candidateResumes = resumeRepository.findByCandidateIdOrderByVersionDesc(candidateId);
        if (!candidateResumes.isEmpty()) {
            Resume currentResume = candidateResumes.stream()
                    .filter(r -> Boolean.TRUE.equals(r.getIsCurrent()))
                    .findFirst()
                    .orElse(candidateResumes.get(0));

            currentResumeResponse = engineerResumeService.mapToResumeResponse(currentResume);

            ResumeAnalysis analysis = resumeAnalysisRepository.findByResumeId(currentResume.getId()).orElse(null);
            if (analysis != null) {
                try {
                    resumeAnalysisResponse = engineerResumeService.getResumeAnalysis(currentResume.getId());
                } catch (Exception e) {
                    log.debug("Resume analysis could not be mapped: {}", e.getMessage());
                }
            }
        }

        return InstructorCandidateDetailResponse.builder()
                .candidate(candidateResponse)
                .assignment(assignmentResponse)
                .currentResume(currentResumeResponse)
                .resumeAnalysis(resumeAnalysisResponse)
                .build();
    }

    private Instructor getInstructorByUserId(UUID userId) {
        return instructorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor profile not found for user ID: " + userId));
    }
}
