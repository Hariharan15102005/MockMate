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
    private final EngineerAssignmentService engineerAssignmentService;
    private final EngineerResumeService engineerResumeService;
    private final EngineerCandidateService engineerCandidateService;

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
