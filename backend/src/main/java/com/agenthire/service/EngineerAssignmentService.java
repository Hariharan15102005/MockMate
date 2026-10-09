package com.agenthire.service;

import com.agenthire.dto.assignment.CandidateAssignRequest;
import com.agenthire.dto.assignment.CandidateAssignmentDetailResponse;
import com.agenthire.dto.assignment.InstructorSummaryResponse;
import com.agenthire.entity.Candidate;
import com.agenthire.entity.CandidateAssignment;
import com.agenthire.entity.Instructor;
import com.agenthire.entity.InterviewEngineer;
import com.agenthire.entity.User;
import com.agenthire.entity.enums.AssignmentStatus;
import com.agenthire.entity.enums.CandidateStatus;
import com.agenthire.entity.enums.NotificationType;
import com.agenthire.entity.enums.UserRole;
import com.agenthire.exception.DuplicateResourceException;
import com.agenthire.exception.InvalidStatusTransitionException;
import com.agenthire.exception.ResourceNotFoundException;
import com.agenthire.repository.CandidateAssignmentRepository;
import com.agenthire.repository.CandidateRepository;
import com.agenthire.repository.InstructorRepository;
import com.agenthire.repository.InterviewEngineerRepository;
import com.agenthire.repository.ResumeRepository;
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
public class EngineerAssignmentService {

    private final CandidateAssignmentRepository assignmentRepository;
    private final CandidateRepository candidateRepository;
    private final InstructorRepository instructorRepository;
    private final InterviewEngineerRepository engineerRepository;
    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;

    @Transactional
    public CandidateAssignmentDetailResponse assignCandidate(UUID candidateId, CandidateAssignRequest request, UUID engineerUserId, String ipAddress) {
        Candidate candidate = candidateRepository.findById(candidateId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate not found with ID: " + candidateId));

        // Enforce candidate eligibility: must be VERIFIED (or SENT_TO_INSTRUCTOR for reassignment)
        if (candidate.getStatus() != CandidateStatus.VERIFIED && candidate.getStatus() != CandidateStatus.SENT_TO_INSTRUCTOR) {
            throw new InvalidStatusTransitionException(
                    "Candidate must be in VERIFIED status for instructor routing. Current status is: " + candidate.getStatus()
            );
        }

        // Enforce resume requirement
        boolean hasResume = resumeRepository.existsByCandidateId(candidateId);
        if (!hasResume) {
            throw new InvalidStatusTransitionException(
                    "Candidate must have an uploaded resume document before being routed to an instructor."
            );
        }

        // Validate Instructor
        Instructor instructor = findInstructorOrThrow(request.getInstructorId());
        if (!Boolean.TRUE.equals(instructor.getActive()) || !Boolean.TRUE.equals(instructor.getUser().getEnabled())) {
            throw new IllegalArgumentException("The selected instructor is not currently active.");
        }
        if (instructor.getUser().getRole() != UserRole.INSTRUCTOR) {
            throw new IllegalArgumentException("Selected user is not an INSTRUCTOR.");
        }

        // Authenticate/Retrieve Interview Engineer profile
        User engineerUser = userRepository.findById(engineerUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Engineer user not found with ID: " + engineerUserId));

        InterviewEngineer engineer = engineerRepository.findByUserId(engineerUserId)
                .orElseGet(() -> engineerRepository.save(InterviewEngineer.builder()
                        .user(engineerUser)
                        .employeeCode("ENG-" + engineerUser.getId().toString().substring(0, 8).toUpperCase())
                        .department("Technical Intake & Operations")
                        .active(true)
                        .build()));

        // Duplicate active assignment protection
        List<AssignmentStatus> activeStatuses = List.of(AssignmentStatus.SENT, AssignmentStatus.PENDING, AssignmentStatus.ACCEPTED);
        boolean activeAssignmentExists = assignmentRepository.existsByCandidateIdAndInstructorIdAndStatusIn(
                candidate.getId(), instructor.getId(), activeStatuses
        );
        if (activeAssignmentExists) {
            throw new DuplicateResourceException(
                    "Candidate '" + candidate.getFullName() + "' already has an active assignment with Instructor '" +
                            instructor.getUser().getFullName() + "'."
            );
        }

        String trimmedMessage = request.getMessage() != null ? request.getMessage().trim() : null;

        // Create and save CandidateAssignment
        CandidateAssignment assignment = CandidateAssignment.builder()
                .candidate(candidate)
                .interviewEngineer(engineer)
                .instructor(instructor)
                .appliedRole(candidate.getAppliedRole())
                .interviewType(request.getInterviewType() != null ? request.getInterviewType().trim() : "TECHNICAL")
                .priority(request.getPriority() != null ? request.getPriority().trim() : "MEDIUM")
                .engineerMessage(trimmedMessage)
                .status(AssignmentStatus.SENT)
                .assignedAt(Instant.now())
                .build();

        CandidateAssignment savedAssignment = assignmentRepository.save(assignment);
        log.info("Created CandidateAssignment ID: {} for Candidate: {} -> Instructor: {}",
                savedAssignment.getId(), candidate.getId(), instructor.getId());

        // Update candidate status
        candidate.setStatus(CandidateStatus.SENT_TO_INSTRUCTOR);
        candidateRepository.save(candidate);

        // Atomic Notification to Instructor
        notificationService.createNotification(
                instructor.getUser(),
                NotificationType.CANDIDATE_ASSIGNED,
                "New Candidate Assigned: " + candidate.getFullName(),
                "Candidate " + candidate.getFullName() + " (" + candidate.getApplicationId() + ") has been assigned to you for " +
                        candidate.getAppliedRole() + " review.",
                "CandidateAssignment",
                savedAssignment.getId()
        );

        // Audit Logging
        auditLogService.logEvent(
                engineerUserId,
                "CANDIDATE_SENT_TO_INSTRUCTOR",
                "CandidateAssignment",
                savedAssignment.getId(),
                "Candidate " + candidate.getFullName() + " assigned to Instructor " + instructor.getUser().getFullName() + " (Status: SENT).",
                "{\"candidateId\":\"" + candidate.getId() + "\",\"instructorId\":\"" + instructor.getId() + "\",\"assignmentId\":\"" + savedAssignment.getId() + "\"}",
                ipAddress
        );

        return mapToDetailResponse(savedAssignment);
    }

    @Transactional(readOnly = true)
    public Page<InstructorSummaryResponse> getInstructors(String search, Pageable pageable) {
        Specification<Instructor> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.isTrue(root.get("active")));

            if (search != null && !search.trim().isEmpty()) {
                String searchLower = "%" + search.trim().toLowerCase() + "%";
                Predicate nameMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("user").get("fullName")), searchLower);
                Predicate emailMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("user").get("email")), searchLower);
                Predicate deptMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("department")), searchLower);
                Predicate specMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("specialization")), searchLower);
                predicates.add(criteriaBuilder.or(nameMatch, emailMatch, deptMatch, specMatch));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return instructorRepository.findAll(spec, pageable).map(this::mapToInstructorSummary);
    }

    @Transactional(readOnly = true)
    public Page<CandidateAssignmentDetailResponse> getAssignments(String search, AssignmentStatus status, UUID instructorId, Pageable pageable) {
        Specification<CandidateAssignment> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            if (instructorId != null) {
                predicates.add(criteriaBuilder.equal(root.get("instructor").get("id"), instructorId));
            }

            if (search != null && !search.trim().isEmpty()) {
                String searchLower = "%" + search.trim().toLowerCase() + "%";
                Predicate candidateName = criteriaBuilder.like(criteriaBuilder.lower(root.get("candidate").get("fullName")), searchLower);
                Predicate candidateAppId = criteriaBuilder.like(criteriaBuilder.lower(root.get("candidate").get("applicationId")), searchLower);
                Predicate roleMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("appliedRole")), searchLower);
                Predicate instructorName = criteriaBuilder.like(criteriaBuilder.lower(root.get("instructor").get("user").get("fullName")), searchLower);
                predicates.add(criteriaBuilder.or(candidateName, candidateAppId, roleMatch, instructorName));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return assignmentRepository.findAll(spec, pageable).map(this::mapToDetailResponse);
    }

    @Transactional(readOnly = true)
    public CandidateAssignmentDetailResponse getAssignmentById(UUID assignmentId) {
        CandidateAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate assignment not found with ID: " + assignmentId));
        return mapToDetailResponse(assignment);
    }

    private Instructor findInstructorOrThrow(UUID instructorOrUserId) {
        // Try direct Instructor ID
        return instructorRepository.findById(instructorOrUserId)
                .or(() -> instructorRepository.findByUserId(instructorOrUserId))
                .or(() -> {
                    // Try looking up by User ID and lazily creating Instructor profile if role is INSTRUCTOR
                    return userRepository.findById(instructorOrUserId)
                            .filter(u -> u.getRole() == UserRole.INSTRUCTOR)
                            .map(u -> instructorRepository.save(Instructor.builder()
                                    .user(u)
                                    .employeeCode("INST-" + u.getId().toString().substring(0, 8).toUpperCase())
                                    .department("Evaluation Board")
                                    .active(true)
                                    .build()));
                })
                .orElseThrow(() -> new ResourceNotFoundException("Instructor profile not found for ID: " + instructorOrUserId));
    }

    public InstructorSummaryResponse mapToInstructorSummary(Instructor inst) {
        return InstructorSummaryResponse.builder()
                .id(inst.getId())
                .userId(inst.getUser().getId())
                .fullName(inst.getUser().getFullName())
                .email(inst.getUser().getEmail())
                .department(inst.getDepartment())
                .specialization(inst.getSpecialization())
                .employeeCode(inst.getEmployeeCode())
                .active(inst.getActive())
                .build();
    }

    public CandidateAssignmentDetailResponse mapToDetailResponse(CandidateAssignment ca) {
        Candidate c = ca.getCandidate();
        InterviewEngineer ie = ca.getInterviewEngineer();
        Instructor inst = ca.getInstructor();

        CandidateAssignmentDetailResponse.CandidateSummary candidateSummary = CandidateAssignmentDetailResponse.CandidateSummary.builder()
                .id(c.getId())
                .fullName(c.getFullName())
                .email(c.getEmail())
                .phone(c.getPhone())
                .college(c.getCollege())
                .degree(c.getDegree())
                .department(c.getDepartment())
                .applicationId(c.getApplicationId())
                .appliedRole(c.getAppliedRole())
                .experienceLevel(c.getExperienceLevel())
                .cgpa(c.getCgpa())
                .status(c.getStatus())
                .build();

        CandidateAssignmentDetailResponse.EngineerSummary engineerSummary = CandidateAssignmentDetailResponse.EngineerSummary.builder()
                .id(ie.getId())
                .userId(ie.getUser().getId())
                .fullName(ie.getUser().getFullName())
                .email(ie.getUser().getEmail())
                .employeeCode(ie.getEmployeeCode())
                .department(ie.getDepartment())
                .build();

        CandidateAssignmentDetailResponse.InstructorSummary instructorSummary = CandidateAssignmentDetailResponse.InstructorSummary.builder()
                .id(inst.getId())
                .userId(inst.getUser().getId())
                .fullName(inst.getUser().getFullName())
                .email(inst.getUser().getEmail())
                .employeeCode(inst.getEmployeeCode())
                .department(inst.getDepartment())
                .specialization(inst.getSpecialization())
                .build();

        return CandidateAssignmentDetailResponse.builder()
                .id(ca.getId())
                .candidate(candidateSummary)
                .engineer(engineerSummary)
                .instructor(instructorSummary)
                .appliedRole(ca.getAppliedRole())
                .interviewType(ca.getInterviewType())
                .priority(ca.getPriority())
                .engineerMessage(ca.getEngineerMessage())
                .status(ca.getStatus())
                .assignedAt(ca.getAssignedAt())
                .acceptedAt(ca.getAcceptedAt())
                .createdAt(ca.getCreatedAt())
                .build();
    }
}
