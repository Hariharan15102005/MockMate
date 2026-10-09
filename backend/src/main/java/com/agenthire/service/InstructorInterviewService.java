package com.agenthire.service;

import com.agenthire.dto.assignment.InstructorSummaryResponse;
import com.agenthire.dto.interview.AcceptedAssignmentSummaryResponse;
import com.agenthire.dto.interview.CreateInterviewRequest;
import com.agenthire.dto.interview.InterviewDetailResponse;
import com.agenthire.dto.interview.InterviewRoundRequest;
import com.agenthire.dto.interview.InterviewRoundResponse;
import com.agenthire.dto.interview.InterviewSummaryResponse;
import com.agenthire.dto.interview.QuestionRequest;
import com.agenthire.dto.interview.QuestionResponse;
import com.agenthire.dto.interview.ScoringConfigRequest;
import com.agenthire.dto.interview.ScoringConfigResponse;
import com.agenthire.dto.interview.UpdateInterviewRequest;
import com.agenthire.entity.Candidate;
import com.agenthire.entity.CandidateAssignment;
import com.agenthire.entity.Instructor;
import com.agenthire.entity.Interview;
import com.agenthire.entity.InterviewRound;
import com.agenthire.entity.InterviewScoringConfig;
import com.agenthire.entity.Question;
import com.agenthire.entity.User;
import com.agenthire.entity.enums.AssignmentStatus;
import com.agenthire.entity.enums.Difficulty;
import com.agenthire.entity.enums.InterviewRoundType;
import com.agenthire.entity.enums.InterviewStatus;
import com.agenthire.entity.enums.QuestionType;
import com.agenthire.exception.DuplicateResourceException;
import com.agenthire.exception.InvalidStatusTransitionException;
import com.agenthire.exception.ResourceNotFoundException;
import com.agenthire.repository.CandidateAssignmentRepository;
import com.agenthire.repository.CandidateRepository;
import com.agenthire.repository.InstructorRepository;
import com.agenthire.repository.InterviewRepository;
import com.agenthire.repository.InterviewRoundRepository;
import com.agenthire.repository.InterviewScoringConfigRepository;
import com.agenthire.repository.QuestionRepository;
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
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InstructorInterviewService {

    private final InterviewRepository interviewRepository;
    private final InterviewRoundRepository roundRepository;
    private final QuestionRepository questionRepository;
    private final InterviewScoringConfigRepository scoringConfigRepository;
    private final CandidateAssignmentRepository assignmentRepository;
    private final InstructorRepository instructorRepository;
    private final UserRepository userRepository;
    private final AuditLogService auditLogService;
    private final EngineerAssignmentService engineerAssignmentService;

    @Transactional
    public InterviewDetailResponse createInterview(CreateInterviewRequest request, UUID instructorUserId, String ipAddress) {
        Instructor instructor = getInstructorByUserId(instructorUserId);

        CandidateAssignment assignment = assignmentRepository.findById(request.getCandidateAssignmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Candidate assignment not found with ID: " + request.getCandidateAssignmentId()));

        // Strict Ownership Enforcement: Must belong to authenticated instructor
        if (!assignment.getInstructor().getId().equals(instructor.getId())) {
            throw new ResourceNotFoundException("Candidate assignment does not belong to this instructor.");
        }

        // Eligibility check: Must be in ACCEPTED status
        if (assignment.getStatus() != AssignmentStatus.ACCEPTED) {
            throw new InvalidStatusTransitionException(
                    "Interview blueprint can only be created for ACCEPTED candidate assignments. Current assignment status: " + assignment.getStatus()
            );
        }

        // Check if an active interview already exists for this assignment
        Optional<Interview> existingInterviewOpt = interviewRepository.findByCandidateAssignmentId(assignment.getId());
        if (existingInterviewOpt.isPresent()) {
            Interview existing = existingInterviewOpt.get();
            if (existing.getStatus() == InterviewStatus.PUBLISHED) {
                throw new DuplicateResourceException(
                        "An interview blueprint is already PUBLISHED for Candidate '" + assignment.getCandidate().getFullName() + "'."
                );
            }
            log.info("Returning existing DRAFT interview ID: {} for assignment ID: {}", existing.getId(), assignment.getId());
            return mapToDetailResponse(existing);
        }

        Candidate candidate = assignment.getCandidate();

        Interview interview = Interview.builder()
                .title(request.getTitle() != null && !request.getTitle().trim().isEmpty()
                        ? request.getTitle().trim()
                        : "Technical Assessment: " + candidate.getAppliedRole())
                .description(request.getDescription())
                .targetRole(request.getTargetRole() != null && !request.getTargetRole().trim().isEmpty()
                        ? request.getTargetRole().trim()
                        : candidate.getAppliedRole())
                .experienceLevel(request.getExperienceLevel() != null && !request.getExperienceLevel().trim().isEmpty()
                        ? request.getExperienceLevel().trim()
                        : candidate.getExperienceLevel())
                .durationMinutes(request.getDurationMinutes() != null ? request.getDurationMinutes() : 60)
                .difficulty(request.getDifficulty() != null ? request.getDifficulty() : Difficulty.MEDIUM)
                .status(InterviewStatus.DRAFT)
                .createdBy(instructor)
                .candidate(candidate)
                .candidateAssignment(assignment)
                .isAdaptive(Boolean.TRUE.equals(request.getIsAdaptive()))
                .build();

        Interview savedInterview = interviewRepository.save(interview);
        log.info("Created Interview Blueprint ID: {} for Candidate: {} by Instructor: {}",
                savedInterview.getId(), candidate.getId(), instructor.getId());

        // Process rounds & questions
        if (request.getRounds() != null && !request.getRounds().isEmpty()) {
            saveRoundsAndQuestions(savedInterview, request.getRounds(), instructor.getUser());
        } else {
            // Seed default initial blueprint rounds if none provided
            seedDefaultRounds(savedInterview, instructor.getUser());
        }

        // Process scoring configuration
        saveScoringConfig(savedInterview, request.getScoringConfig());

        // Audit Logging
        auditLogService.logEvent(
                instructorUserId,
                "INTERVIEW_CREATED",
                "Interview",
                savedInterview.getId(),
                "Instructor " + instructor.getUser().getFullName() + " created interview draft blueprint: " + savedInterview.getTitle(),
                "{\"interviewId\":\"" + savedInterview.getId() + "\",\"candidateId\":\"" + candidate.getId() +
                        "\",\"assignmentId\":\"" + assignment.getId() + "\",\"status\":\"DRAFT\"}",
                ipAddress
        );

        return mapToDetailResponse(savedInterview);
    }

    @Transactional(readOnly = true)
    public InterviewDetailResponse getInterviewById(UUID interviewId, UUID instructorUserId) {
        Instructor instructor = getInstructorByUserId(instructorUserId);
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with ID: " + interviewId));

        if (!interview.getCreatedBy().getId().equals(instructor.getId())) {
            throw new ResourceNotFoundException("Interview does not belong to this instructor or does not exist.");
        }

        return mapToDetailResponse(interview);
    }

    @Transactional(readOnly = true)
    public Page<InterviewSummaryResponse> getInterviews(
            UUID instructorUserId, String search, InterviewStatus status, Pageable pageable) {

        Instructor instructor = getInstructorByUserId(instructorUserId);

        Specification<Interview> spec = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.equal(root.get("createdBy").get("id"), instructor.getId()));

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            if (search != null && !search.trim().isEmpty()) {
                String searchLower = "%" + search.trim().toLowerCase() + "%";
                Predicate titleMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), searchLower);
                Predicate roleMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("targetRole")), searchLower);
                Predicate candidateMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("candidate").get("fullName")), searchLower);
                Predicate appMatch = criteriaBuilder.like(criteriaBuilder.lower(root.get("candidate").get("applicationId")), searchLower);
                predicates.add(criteriaBuilder.or(titleMatch, roleMatch, candidateMatch, appMatch));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return interviewRepository.findAll(spec, pageable).map(this::mapToSummaryResponse);
    }

    @Transactional(readOnly = true)
    public List<AcceptedAssignmentSummaryResponse> getAcceptedAssignmentsForInstructor(UUID instructorUserId) {
        Instructor instructor = getInstructorByUserId(instructorUserId);

        List<CandidateAssignment> acceptedAssignments = assignmentRepository.findByInstructorIdAndStatus(
                instructor.getId(), AssignmentStatus.ACCEPTED
        );

        return acceptedAssignments.stream().map(ca -> {
            Optional<Interview> interviewOpt = interviewRepository.findByCandidateAssignmentId(ca.getId());
            return AcceptedAssignmentSummaryResponse.builder()
                    .assignmentId(ca.getId())
                    .candidateId(ca.getCandidate().getId())
                    .candidateName(ca.getCandidate().getFullName())
                    .applicationId(ca.getCandidate().getApplicationId())
                    .appliedRole(ca.getAppliedRole())
                    .experienceLevel(ca.getCandidate().getExperienceLevel())
                    .acceptedAt(ca.getAcceptedAt())
                    .existingInterviewId(interviewOpt.map(Interview::getId).orElse(null))
                    .existingInterviewStatus(interviewOpt.map(i -> i.getStatus().name()).orElse(null))
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public InterviewDetailResponse updateInterview(
            UUID interviewId, UpdateInterviewRequest request, UUID instructorUserId, String ipAddress) {

        Instructor instructor = getInstructorByUserId(instructorUserId);
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with ID: " + interviewId));

        // Strict Ownership
        if (!interview.getCreatedBy().getId().equals(instructor.getId())) {
            throw new ResourceNotFoundException("Interview does not belong to this instructor.");
        }

        // Immutability Rule: PUBLISHED interviews cannot be edited
        if (interview.getStatus() != InterviewStatus.DRAFT) {
            throw new InvalidStatusTransitionException(
                    "Interview blueprint is in " + interview.getStatus() + " status and cannot be modified. Only DRAFT interviews may be edited."
            );
        }

        if (request.getTitle() != null && !request.getTitle().trim().isEmpty()) {
            interview.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null) {
            interview.setDescription(request.getDescription());
        }
        if (request.getTargetRole() != null && !request.getTargetRole().trim().isEmpty()) {
            interview.setTargetRole(request.getTargetRole().trim());
        }
        if (request.getExperienceLevel() != null) {
            interview.setExperienceLevel(request.getExperienceLevel());
        }
        if (request.getDurationMinutes() != null) {
            interview.setDurationMinutes(request.getDurationMinutes());
        }
        if (request.getDifficulty() != null) {
            interview.setDifficulty(request.getDifficulty());
        }
        if (request.getIsAdaptive() != null) {
            interview.setIsAdaptive(request.getIsAdaptive());
        }

        Interview updatedInterview = interviewRepository.save(interview);

        // Update rounds & questions
        if (request.getRounds() != null) {
            // Delete existing questions & rounds for this interview to prevent orphaned entities
            List<InterviewRound> existingRounds = roundRepository.findByInterviewIdOrderBySequenceNumberAsc(interviewId);
            for (InterviewRound r : existingRounds) {
                List<Question> questions = questionRepository.findByRoundId(r.getId());
                questionRepository.deleteAll(questions);
            }
            questionRepository.flush();
            roundRepository.deleteAll(existingRounds);
            roundRepository.flush();

            saveRoundsAndQuestions(updatedInterview, request.getRounds(), instructor.getUser());
        }

        // Update scoring configuration
        if (request.getScoringConfig() != null) {
            saveScoringConfig(updatedInterview, request.getScoringConfig());
        }

        log.info("Updated Interview Draft Blueprint ID: {}", updatedInterview.getId());

        // Audit Logging
        auditLogService.logEvent(
                instructorUserId,
                "INTERVIEW_UPDATED",
                "Interview",
                updatedInterview.getId(),
                "Instructor " + instructor.getUser().getFullName() + " updated interview blueprint: " + updatedInterview.getTitle(),
                "{\"interviewId\":\"" + updatedInterview.getId() + "\",\"status\":\"DRAFT\"}",
                ipAddress
        );

        return mapToDetailResponse(updatedInterview);
    }

    @Transactional
    public InterviewDetailResponse publishInterview(UUID interviewId, UUID instructorUserId, String ipAddress) {
        Instructor instructor = getInstructorByUserId(instructorUserId);
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with ID: " + interviewId));

        if (!interview.getCreatedBy().getId().equals(instructor.getId())) {
            throw new ResourceNotFoundException("Interview does not belong to this instructor.");
        }

        if (interview.getStatus() != InterviewStatus.DRAFT) {
            throw new InvalidStatusTransitionException(
                    "Interview cannot be published from status: " + interview.getStatus() + ". Only DRAFT interviews can be published."
            );
        }

        // Comprehensive Publication Validation
        if (interview.getTitle() == null || interview.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Interview title is required for publication.");
        }
        if (interview.getDurationMinutes() == null || interview.getDurationMinutes() < 5) {
            throw new IllegalArgumentException("Interview duration must be at least 5 minutes.");
        }

        List<InterviewRound> rounds = roundRepository.findByInterviewIdOrderBySequenceNumberAsc(interviewId);
        if (rounds.isEmpty()) {
            throw new IllegalArgumentException("Interview blueprint must contain at least one configured interview round to be published.");
        }

        // Validate unique round sequence numbers
        Set<Integer> seqNumbers = new HashSet<>();
        for (InterviewRound r : rounds) {
            if (!seqNumbers.add(r.getSequenceNumber())) {
                throw new IllegalArgumentException("Duplicate round sequence number detected: " + r.getSequenceNumber());
            }
            if (r.getDurationMinutes() != null && r.getDurationMinutes() <= 0) {
                throw new IllegalArgumentException("Round '" + r.getName() + "' duration must be greater than 0.");
            }
        }

        // Validate scoring weights total 100%
        InterviewScoringConfig scoringConfig = scoringConfigRepository.findByInterviewId(interviewId)
                .orElseGet(() -> saveScoringConfig(interview, null));

        if (!scoringConfig.isValidTotal()) {
            throw new IllegalArgumentException(
                    "Interview scoring configuration weights must total exactly 100%. Current total: " + scoringConfig.calculateTotalWeight() + "%."
            );
        }

        // Transition status to PUBLISHED
        interview.setStatus(InterviewStatus.PUBLISHED);
        interview.setPublishedAt(Instant.now());
        Interview publishedInterview = interviewRepository.save(interview);

        log.info("Successfully PUBLISHED Interview Blueprint ID: {} for Candidate: {}",
                publishedInterview.getId(), interview.getCandidate().getId());

        // Audit Logging
        auditLogService.logEvent(
                instructorUserId,
                "INTERVIEW_PUBLISHED",
                "Interview",
                publishedInterview.getId(),
                "Instructor " + instructor.getUser().getFullName() + " published interview blueprint: " + publishedInterview.getTitle(),
                "{\"interviewId\":\"" + publishedInterview.getId() + "\",\"status\":\"PUBLISHED\",\"publishedAt\":\"" + publishedInterview.getPublishedAt() + "\"}",
                ipAddress
        );

        return mapToDetailResponse(publishedInterview);
    }

    private void saveRoundsAndQuestions(Interview interview, List<InterviewRoundRequest> roundRequests, User creator) {
        Set<Integer> seqSet = new HashSet<>();

        for (int i = 0; i < roundRequests.size(); i++) {
            InterviewRoundRequest req = roundRequests.get(i);
            int seq = req.getSequenceNumber() != null ? req.getSequenceNumber() : (i + 1);

            if (!seqSet.add(seq)) {
                throw new IllegalArgumentException("Duplicate sequence number: " + seq + " in interview rounds.");
            }

            InterviewRound round = InterviewRound.builder()
                    .interview(interview)
                    .roundType(req.getRoundType())
                    .name(req.getName())
                    .sequenceNumber(seq)
                    .durationMinutes(req.getDurationMinutes() != null ? req.getDurationMinutes() : 15)
                    .questionCount(req.getQuestionCount() != null ? req.getQuestionCount() : 2)
                    .questionType(req.getQuestionType() != null ? req.getQuestionType() : QuestionType.TEXT)
                    .difficulty(req.getDifficulty() != null ? req.getDifficulty() : Difficulty.MEDIUM)
                    .weight(req.getWeight() != null ? req.getWeight() : 20)
                    .instructions(req.getInstructions())
                    .enabled(req.getEnabled() == null || req.getEnabled())
                    .build();

            InterviewRound savedRound = roundRepository.save(round);

            if (req.getQuestions() != null && !req.getQuestions().isEmpty()) {
                for (int qIdx = 0; qIdx < req.getQuestions().size(); qIdx++) {
                    QuestionRequest qReq = req.getQuestions().get(qIdx);
                    Question question = Question.builder()
                            .interview(interview)
                            .round(savedRound)
                            .questionType(qReq.getQuestionType() != null ? qReq.getQuestionType() : QuestionType.TEXT)
                            .questionText(qReq.getQuestionText())
                            .difficulty(qReq.getDifficulty() != null ? qReq.getDifficulty() : Difficulty.MEDIUM)
                            .expectedAnswerGuidance(qReq.getExpectedAnswerGuidance())
                            .timeLimitSeconds(qReq.getTimeLimitSeconds() != null ? qReq.getTimeLimitSeconds() : 120)
                            .sequenceNumber(qReq.getSequenceNumber() != null ? qReq.getSequenceNumber() : (qIdx + 1))
                            .codingLanguage(qReq.getCodingLanguage())
                            .sampleInput(qReq.getSampleInput())
                            .sampleOutput(qReq.getSampleOutput())
                            .isAiGenerated(false)
                            .createdBy(creator)
                            .build();

                    questionRepository.save(question);
                }
            }
        }
    }

    private void seedDefaultRounds(Interview interview, User creator) {
        List<InterviewRoundRequest> defaultRounds = List.of(
                InterviewRoundRequest.builder()
                        .roundType(InterviewRoundType.INTRODUCTION)
                        .name("Candidate Introduction & Background")
                        .sequenceNumber(1)
                        .durationMinutes(5)
                        .questionCount(1)
                        .questionType(QuestionType.TEXT)
                        .difficulty(Difficulty.EASY)
                        .weight(10)
                        .instructions("Introduce candidate background and core motivation.")
                        .build(),
                InterviewRoundRequest.builder()
                        .roundType(InterviewRoundType.TECHNICAL)
                        .name("Core Technical & Domain Evaluation")
                        .sequenceNumber(2)
                        .durationMinutes(20)
                        .questionCount(3)
                        .questionType(QuestionType.TEXT)
                        .difficulty(Difficulty.MEDIUM)
                        .weight(35)
                        .instructions("Evaluate domain knowledge in target technologies.")
                        .build(),
                InterviewRoundRequest.builder()
                        .roundType(InterviewRoundType.CODING)
                        .name("Hands-on Problem Solving & Coding")
                        .sequenceNumber(3)
                        .durationMinutes(25)
                        .questionCount(1)
                        .questionType(QuestionType.CODING)
                        .difficulty(Difficulty.MEDIUM)
                        .weight(35)
                        .instructions("Live interactive algorithmic assessment.")
                        .build(),
                InterviewRoundRequest.builder()
                        .roundType(InterviewRoundType.CLOSING)
                        .name("Summary & Wrap-up")
                        .sequenceNumber(4)
                        .durationMinutes(10)
                        .questionCount(1)
                        .questionType(QuestionType.TEXT)
                        .difficulty(Difficulty.EASY)
                        .weight(20)
                        .instructions("Candidate Q&A and session conclusion.")
                        .build()
        );

        saveRoundsAndQuestions(interview, defaultRounds, creator);
    }

    private InterviewScoringConfig saveScoringConfig(Interview interview, ScoringConfigRequest req) {
        InterviewScoringConfig config = scoringConfigRepository.findByInterviewId(interview.getId())
                .orElseGet(() -> InterviewScoringConfig.builder().interview(interview).build());

        if (req != null) {
            if (req.getTechnicalWeight() != null) config.setTechnicalWeight(req.getTechnicalWeight());
            if (req.getCodingWeight() != null) config.setCodingWeight(req.getCodingWeight());
            if (req.getProblemSolvingWeight() != null) config.setProblemSolvingWeight(req.getProblemSolvingWeight());
            if (req.getCommunicationWeight() != null) config.setCommunicationWeight(req.getCommunicationWeight());
            if (req.getLearningWeight() != null) config.setLearningWeight(req.getLearningWeight());
            if (req.getBehavioralWeight() != null) config.setBehavioralWeight(req.getBehavioralWeight());
            if (req.getTimeConstrainedWeight() != null) config.setTimeConstrainedWeight(req.getTimeConstrainedWeight());
        }

        return scoringConfigRepository.save(config);
    }

    private Instructor getInstructorByUserId(UUID userId) {
        return instructorRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Instructor profile not found for user ID: " + userId));
    }

    public InterviewDetailResponse mapToDetailResponse(Interview interview) {
        Candidate c = interview.getCandidate();
        Instructor inst = interview.getCreatedBy();

        InterviewDetailResponse.CandidateSummary candidateSummary = null;
        if (c != null) {
            candidateSummary = InterviewDetailResponse.CandidateSummary.builder()
                    .id(c.getId())
                    .fullName(c.getFullName())
                    .email(c.getEmail())
                    .applicationId(c.getApplicationId())
                    .appliedRole(c.getAppliedRole())
                    .college(c.getCollege())
                    .degree(c.getDegree())
                    .build();
        }

        InstructorSummaryResponse instructorSummary = engineerAssignmentService.mapToInstructorSummary(inst);

        // Fetch Rounds & Questions
        List<InterviewRound> rounds = roundRepository.findByInterviewIdOrderBySequenceNumberAsc(interview.getId());
        List<InterviewRoundResponse> roundResponses = rounds.stream().map(r -> {
            List<Question> questions = questionRepository.findByRoundId(r.getId());
            List<QuestionResponse> questionResponses = questions.stream().map(q -> QuestionResponse.builder()
                    .id(q.getId())
                    .roundId(r.getId())
                    .questionType(q.getQuestionType())
                    .questionText(q.getQuestionText())
                    .difficulty(q.getDifficulty())
                    .expectedAnswerGuidance(q.getExpectedAnswerGuidance())
                    .timeLimitSeconds(q.getTimeLimitSeconds())
                    .sequenceNumber(q.getSequenceNumber())
                    .codingLanguage(q.getCodingLanguage())
                    .sampleInput(q.getSampleInput())
                    .sampleOutput(q.getSampleOutput())
                    .isAiGenerated(q.getIsAiGenerated())
                    .createdAt(q.getCreatedAt())
                    .build()).collect(Collectors.toList());

            return InterviewRoundResponse.builder()
                    .id(r.getId())
                    .roundType(r.getRoundType())
                    .name(r.getName())
                    .sequenceNumber(r.getSequenceNumber())
                    .enabled(r.getEnabled())
                    .durationMinutes(r.getDurationMinutes())
                    .questionCount(r.getQuestionCount())
                    .questionType(r.getQuestionType())
                    .difficulty(r.getDifficulty())
                    .weight(r.getWeight())
                    .instructions(r.getInstructions())
                    .createdAt(r.getCreatedAt())
                    .questions(questionResponses)
                    .build();
        }).collect(Collectors.toList());

        // Fetch Scoring Config
        ScoringConfigResponse scoringConfigResponse = null;
        Optional<InterviewScoringConfig> scoringOpt = scoringConfigRepository.findByInterviewId(interview.getId());
        if (scoringOpt.isPresent()) {
            InterviewScoringConfig sc = scoringOpt.get();
            scoringConfigResponse = ScoringConfigResponse.builder()
                    .id(sc.getId())
                    .technicalWeight(sc.getTechnicalWeight())
                    .codingWeight(sc.getCodingWeight())
                    .problemSolvingWeight(sc.getProblemSolvingWeight())
                    .communicationWeight(sc.getCommunicationWeight())
                    .learningWeight(sc.getLearningWeight())
                    .behavioralWeight(sc.getBehavioralWeight())
                    .timeConstrainedWeight(sc.getTimeConstrainedWeight())
                    .totalWeight(sc.calculateTotalWeight())
                    .isValidTotal(sc.isValidTotal())
                    .build();
        }

        return InterviewDetailResponse.builder()
                .id(interview.getId())
                .title(interview.getTitle())
                .description(interview.getDescription())
                .targetRole(interview.getTargetRole())
                .experienceLevel(interview.getExperienceLevel())
                .durationMinutes(interview.getDurationMinutes())
                .difficulty(interview.getDifficulty())
                .status(interview.getStatus())
                .isAdaptive(interview.getIsAdaptive())
                .publishedAt(interview.getPublishedAt())
                .createdAt(interview.getCreatedAt())
                .updatedAt(interview.getUpdatedAt())
                .candidateAssignmentId(interview.getCandidateAssignment() != null ? interview.getCandidateAssignment().getId() : null)
                .candidate(candidateSummary)
                .creatorInstructor(instructorSummary)
                .rounds(roundResponses)
                .scoringConfig(scoringConfigResponse)
                .build();
    }

    public InterviewSummaryResponse mapToSummaryResponse(Interview interview) {
        Candidate c = interview.getCandidate();
        List<InterviewRound> rounds = roundRepository.findByInterviewIdOrderBySequenceNumberAsc(interview.getId());

        return InterviewSummaryResponse.builder()
                .id(interview.getId())
                .title(interview.getTitle())
                .targetRole(interview.getTargetRole())
                .durationMinutes(interview.getDurationMinutes())
                .difficulty(interview.getDifficulty())
                .status(interview.getStatus())
                .isAdaptive(interview.getIsAdaptive())
                .roundCount(rounds.size())
                .candidateId(c != null ? c.getId() : null)
                .candidateName(c != null ? c.getFullName() : null)
                .candidateApplicationId(c != null ? c.getApplicationId() : null)
                .publishedAt(interview.getPublishedAt())
                .createdAt(interview.getCreatedAt())
                .build();
    }
}
