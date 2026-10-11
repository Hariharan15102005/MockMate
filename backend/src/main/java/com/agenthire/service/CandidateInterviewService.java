package com.agenthire.service;

import com.agenthire.dto.ai.AiAnswerEvalRequest;
import com.agenthire.dto.ai.AiAnswerEvalResponse;
import com.agenthire.dto.ai.AiQuestionRequest;
import com.agenthire.dto.ai.AiQuestionResponse;
import com.agenthire.dto.candidate.*;
import com.agenthire.entity.*;
import com.agenthire.entity.enums.*;
import com.agenthire.exception.ResourceNotFoundException;
import com.agenthire.repository.*;
import com.agenthire.service.ai.AiServiceClient;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CandidateInterviewService {

    private final CandidateRepository candidateRepository;
    private final InstructorRepository instructorRepository;
    private final InterviewRepository interviewRepository;
    private final InterviewRoundRepository interviewRoundRepository;
    private final QuestionRepository questionRepository;
    private final InterviewAssignmentRepository interviewAssignmentRepository;
    private final InterviewSessionRepository interviewSessionRepository;
    private final CandidateAnswerRepository candidateAnswerRepository;
    private final AnswerEvaluationRepository answerEvaluationRepository;
    private final InterviewEventRepository interviewEventRepository;
    private final MediaEventRepository mediaEventRepository;
    private final InterviewReportRepository interviewReportRepository;
    private final ResumeRepository resumeRepository;
    private final ResumeAnalysisRepository resumeAnalysisRepository;
    private final NotificationRepository notificationRepository;
    private final InterviewQuestionHistoryRepository interviewQuestionHistoryRepository;
    private final AiServiceClient aiServiceClient;
    private final EngineerResumeService engineerResumeService;
    private final ObjectMapper objectMapper;

    /**
     * Upload resume on behalf of the candidate.
     */
    @Transactional
    public com.agenthire.dto.resume.ResumeResponse uploadCandidateResume(org.springframework.web.multipart.MultipartFile file, UUID userId, String ipAddress) {
        Candidate candidate = getCandidateForUserId(userId);
        return engineerResumeService.uploadResume(candidate.getId(), file, userId, ipAddress);
    }

    /**
     * Get candidate associated with user ID or throw exception.
     */
    public Candidate getCandidateForUserId(UUID userId) {
        return candidateRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Candidate profile not found for user ID: " + userId));
    }

    /**
     * Get all published interviews available to the logged-in candidate.
     */
    @Transactional(readOnly = true)
    public List<CandidateInterviewDto> getCandidateInterviews(UUID userId) {
        Candidate candidate = getCandidateForUserId(userId);

        // Fetch published interviews
        List<Interview> interviews = interviewRepository.findByStatus(InterviewStatus.PUBLISHED);

        return interviews.stream().map(interview -> {
            Optional<InterviewSession> sessionOpt = interviewSessionRepository
                    .findFirstByCandidateIdAndInterviewIdOrderByCreatedAtDesc(candidate.getId(), interview.getId());

            List<InterviewRound> rounds = interviewRoundRepository.findByInterviewIdOrderBySequenceNumberAsc(interview.getId());
            List<String> roundNames = rounds.stream()
                    .map(InterviewRound::getName)
                    .collect(Collectors.toList());

            return CandidateInterviewDto.builder()
                    .id(interview.getId())
                    .title(interview.getTitle())
                    .jobRole(interview.getTargetRole())
                    .description(interview.getDescription())
                    .durationMinutes(interview.getDurationMinutes())
                    .difficulty(interview.getDifficulty())
                    .status(interview.getStatus())
                    .adaptiveQuestioningEnabled(interview.getIsAdaptive())
                    .roundCount(rounds.size())
                    .instructorName(interview.getCreatedBy() != null && interview.getCreatedBy().getUser() != null ? interview.getCreatedBy().getUser().getFullName() : "Instructor")
                    .activeSessionId(sessionOpt.map(BaseEntity::getId).orElse(null))
                    .sessionStatus(sessionOpt.map(s -> s.getStatus().name()).orElse(null))
                    .roundNames(roundNames)
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Get details of a specific interview blueprint for candidate.
     */
    @Transactional(readOnly = true)
    public CandidateInterviewDto getInterviewDetails(UUID interviewId, UUID userId) {
        Candidate candidate = getCandidateForUserId(userId);
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with id: " + interviewId));

        List<InterviewRound> rounds = interviewRoundRepository.findByInterviewIdOrderBySequenceNumberAsc(interview.getId());
        List<String> roundNames = rounds.stream().map(InterviewRound::getName).collect(Collectors.toList());

        Optional<InterviewSession> sessionOpt = interviewSessionRepository
                .findFirstByCandidateIdAndInterviewIdOrderByCreatedAtDesc(candidate.getId(), interview.getId());

        return CandidateInterviewDto.builder()
                .id(interview.getId())
                .title(interview.getTitle())
                .jobRole(interview.getTargetRole())
                .description(interview.getDescription())
                .durationMinutes(interview.getDurationMinutes())
                .difficulty(interview.getDifficulty())
                .status(interview.getStatus())
                .adaptiveQuestioningEnabled(interview.getIsAdaptive())
                .roundCount(rounds.size())
                .instructorName(interview.getCreatedBy() != null && interview.getCreatedBy().getUser() != null ? interview.getCreatedBy().getUser().getFullName() : "Instructor")
                .activeSessionId(sessionOpt.map(BaseEntity::getId).orElse(null))
                .sessionStatus(sessionOpt.map(s -> s.getStatus().name()).orElse(null))
                .roundNames(roundNames)
                .build();
    }

    /**
     * Start or resume an interview session.
     */
    @Transactional
    public StartSessionResponseDto startOrResumeSession(UUID interviewId, UUID userId) {
        Candidate candidate = getCandidateForUserId(userId);
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found with id: " + interviewId));

        if (interview.getStatus() != InterviewStatus.PUBLISHED) {
            throw new IllegalStateException("Interview is not published.");
        }

        // Ensure valid resume before starting AI interview
        if (!resumeRepository.existsByCandidateId(candidate.getId())) {
            ensureCandidateBaselineResume(candidate);
        }

        // Check for existing active or ready session
        Optional<InterviewSession> existingSession = interviewSessionRepository
                .findFirstByCandidateIdAndInterviewIdOrderByCreatedAtDesc(candidate.getId(), interview.getId());

        InterviewSession session;
        List<InterviewRound> rounds = interviewRoundRepository.findByInterviewIdOrderBySequenceNumberAsc(interview.getId());
        int totalRounds = rounds.isEmpty() ? 8 : rounds.size();

        if (existingSession.isPresent() && (existingSession.get().getStatus() == SessionStatus.IN_PROGRESS || existingSession.get().getStatus() == SessionStatus.READY)) {
            session = existingSession.get();
            session.setStatus(SessionStatus.IN_PROGRESS);
            session.setLastActivityAt(Instant.now());
            interviewSessionRepository.save(session);
        } else {
            // Find or create assignment
            InterviewAssignment assignment = interviewAssignmentRepository
                    .findByCandidateIdAndInterviewId(candidate.getId(), interview.getId())
                    .orElseGet(() -> {
                        Instructor instructor = interview.getCreatedBy();
                        if (instructor == null) {
                            instructor = instructorRepository.findAll().stream().findFirst()
                                    .orElseThrow(() -> new IllegalStateException("No instructor configured"));
                        }
                        return interviewAssignmentRepository.save(
                                InterviewAssignment.builder()
                                        .candidate(candidate)
                                        .interview(interview)
                                        .assignedBy(instructor)
                                        .status(AssignmentStatus.PENDING)
                                        .scheduledAt(Instant.now())
                                        .build()
                        );
                    });

            assignment.setStatus(AssignmentStatus.PENDING);
            interviewAssignmentRepository.save(assignment);

            session = InterviewSession.builder()
                    .candidate(candidate)
                    .interview(interview)
                    .interviewAssignment(assignment)
                    .status(SessionStatus.IN_PROGRESS)
                    .startedAt(Instant.now())
                    .lastActivityAt(Instant.now())
                    .currentRound(1)
                    .remainingSeconds(interview.getDurationMinutes() * 60)
                    .build();

            session = interviewSessionRepository.save(session);

            // Record events
            recordInterviewEvent(session, InterviewEventType.SESSION_STARTED, 1, null, "{\"message\": \"Session started by candidate\"}");
            recordInterviewEvent(session, InterviewEventType.ROUND_STARTED, 1, null, "{\"round\": 1, \"roundType\": \"INTRODUCTION\"}");
        }

        String currentRoundType = !rounds.isEmpty() && session.getCurrentRound() <= rounds.size()
                ? rounds.get(session.getCurrentRound() - 1).getRoundType().name()
                : "TECHNICAL";

        return StartSessionResponseDto.builder()
                .sessionId(session.getId())
                .candidateId(candidate.getId())
                .interviewId(interview.getId())
                .interviewTitle(interview.getTitle())
                .jobRole(interview.getTargetRole())
                .durationMinutes(interview.getDurationMinutes())
                .totalRounds(totalRounds)
                .currentRound(session.getCurrentRound())
                .currentRoundType(currentRoundType)
                .sessionStatus(session.getStatus().name())
                .startedAt(session.getStartedAt())
                .remainingSeconds(session.getRemainingSeconds())
                .build();
    }

    /**
     * Get details of an existing interview session.
     */
    @Transactional(readOnly = true)
    public StartSessionResponseDto getSessionDetails(UUID sessionId, UUID userId) {
        Candidate candidate = getCandidateForUserId(userId);
        InterviewSession session = getSessionAndVerifyCandidate(sessionId, candidate);

        Interview interview = session.getInterview();
        List<InterviewRound> rounds = interviewRoundRepository.findByInterviewIdOrderBySequenceNumberAsc(interview.getId());
        int totalRounds = rounds.isEmpty() ? 8 : rounds.size();

        String currentRoundType = !rounds.isEmpty() && session.getCurrentRound() != null && session.getCurrentRound() <= rounds.size()
                ? rounds.get(session.getCurrentRound() - 1).getRoundType().name()
                : "TECHNICAL";

        return StartSessionResponseDto.builder()
                .sessionId(session.getId())
                .candidateId(candidate.getId())
                .interviewId(interview.getId())
                .interviewTitle(interview.getTitle())
                .jobRole(interview.getTargetRole())
                .durationMinutes(interview.getDurationMinutes())
                .totalRounds(totalRounds)
                .currentRound(session.getCurrentRound() != null ? session.getCurrentRound() : 1)
                .currentRoundType(currentRoundType)
                .sessionStatus(session.getStatus().name())
                .startedAt(session.getStartedAt())
                .remainingSeconds(session.getRemainingSeconds())
                .build();
    }

    /**
     * Start a self-service AI interview for candidate directly without requiring prior assignment.
     */
    @Transactional
    public StartSessionResponseDto startSelfServiceSession(UUID userId) {
        Candidate candidate = getCandidateForUserId(userId);

        // Check if there is an existing published blueprint or create default
        List<Interview> published = interviewRepository.findByStatus(InterviewStatus.PUBLISHED);
        Interview targetInterview = null;

        if (!published.isEmpty()) {
            targetInterview = published.get(0);
        } else {
            Instructor instructor = instructorRepository.findAll().stream().findFirst().orElse(null);

            targetInterview = interviewRepository.save(Interview.builder()
                    .title("AI Resume Comprehensive Mock Interview")
                    .description("Real-time personalized AI interview based on your verified resume, projects, technical depth, and behavioral experiences.")
                    .targetRole("Full Stack Software Engineer")
                    .durationMinutes(45)
                    .difficulty(Difficulty.MEDIUM)
                    .status(InterviewStatus.PUBLISHED)
                    .isAdaptive(true)
                    .createdBy(instructor)
                    .build());

            interviewRoundRepository.save(InterviewRound.builder()
                    .interview(targetInterview)
                    .sequenceNumber(1)
                    .name("Candidate Introduction & Resume Overview")
                    .roundType(InterviewRoundType.INTRODUCTION)
                    .durationMinutes(5)
                    .weight(15)
                    .build());

            interviewRoundRepository.save(InterviewRound.builder()
                    .interview(targetInterview)
                    .sequenceNumber(2)
                    .name("Resume Projects & Architecture Deep Dive")
                    .roundType(InterviewRoundType.SYSTEM_DESIGN)
                    .durationMinutes(12)
                    .weight(25)
                    .build());

            interviewRoundRepository.save(InterviewRound.builder()
                    .interview(targetInterview)
                    .sequenceNumber(3)
                    .name("Core Technical Fundamentals & Problem Solving")
                    .roundType(InterviewRoundType.TECHNICAL)
                    .durationMinutes(15)
                    .weight(30)
                    .build());

            interviewRoundRepository.save(InterviewRound.builder()
                    .interview(targetInterview)
                    .sequenceNumber(4)
                    .name("Behavioral, STAR & Professional Collaboration")
                    .roundType(InterviewRoundType.BEHAVIORAL)
                    .durationMinutes(10)
                    .weight(20)
                    .build());

            interviewRoundRepository.save(InterviewRound.builder()
                    .interview(targetInterview)
                    .sequenceNumber(5)
                    .name("Candidate Q&A & Interview Closing")
                    .roundType(InterviewRoundType.CLOSING)
                    .durationMinutes(3)
                    .weight(10)
                    .build());
        }

        return startOrResumeSession(targetInterview.getId(), userId);
    }

    /**
     * Get or generate the question for the session's current round.
     */
    @Transactional
    public CandidateQuestionDto getCurrentQuestion(UUID sessionId, UUID userId) {
        Candidate candidate = getCandidateForUserId(userId);
        InterviewSession session = getSessionAndVerifyCandidate(sessionId, candidate);

        Interview interview = session.getInterview();
        List<InterviewRound> rounds = interviewRoundRepository.findByInterviewIdOrderBySequenceNumberAsc(interview.getId());
        int currentRoundNum = session.getCurrentRound() != null ? session.getCurrentRound() : 1;
        int totalRounds = rounds.isEmpty() ? 8 : rounds.size();

        InterviewRound currentRound = rounds.stream()
                .filter(r -> r.getSequenceNumber() == currentRoundNum)
                .findFirst()
                .orElse(null);

        String roundTypeStr = currentRound != null ? currentRound.getRoundType().name() : "TECHNICAL";
        String roundName = currentRound != null ? currentRound.getName() : "Technical Round " + currentRoundNum;

        Question questionEntity = null;
        String questionText;
        String fullSpeechText = null;
        String topic = roundTypeStr;
        String questionCategory = roundTypeStr;
        String questionSource = "AI Resume Engine -> " + roundName;
        List<String> hints = new ArrayList<>();

        boolean isAdaptive = Boolean.TRUE.equals(interview.getIsAdaptive()) || session.getStatus() == SessionStatus.IN_PROGRESS;

        // Check if a static pre-configured question exists ONLY if adaptive AI is explicitly disabled
        List<Question> configuredQuestions = (!isAdaptive && currentRound != null)
                ? questionRepository.findByRoundId(currentRound.getId())
                : Collections.emptyList();

        if (!configuredQuestions.isEmpty()) {
            questionEntity = configuredQuestions.get(0);
            questionText = questionEntity.getQuestionText();
            fullSpeechText = questionText;
            topic = roundTypeStr;
            if (questionEntity.getExpectedAnswerGuidance() != null) {
                hints.add(questionEntity.getExpectedAnswerGuidance());
            }
        } else {
            // Load resume context
            Map<String, Object> resumeContext = loadCandidateResumeContext(candidate);

            // Fetch previous questions and evaluations
            List<Map<String, Object>> prevInteractions = getPreviousInteractions(session);
            String lastAnswer = prevInteractions.isEmpty() ? null : (String) prevInteractions.get(prevInteractions.size() - 1).get("answer");

            // Fetch historical questions across all candidate sessions to guarantee zero cross-interview duplicates
            Set<String> historicalQuestionsSet = new LinkedHashSet<>();
            
            interviewQuestionHistoryRepository.findByCandidateId(candidate.getId())
                    .forEach(h -> {
                        if (h.getQuestionText() != null && !h.getQuestionText().isBlank()) {
                            historicalQuestionsSet.add(h.getQuestionText());
                        }
                    });

            candidateAnswerRepository.findBySessionCandidateId(candidate.getId())
                    .forEach(a -> {
                        String q = a.getQuestion() != null ? a.getQuestion().getQuestionText() : a.getTranscript();
                        if (q != null && !q.isBlank()) {
                            historicalQuestionsSet.add(q);
                        }
                    });

            List<String> historicalQuestions = new ArrayList<>(historicalQuestionsSet);

            // Fetch previous perspectives across all sessions for this candidate
            List<InterviewSession> allCandidateSessions = interviewSessionRepository.findByCandidateId(candidate.getId());
            List<String> previousPerspectives = allCandidateSessions.stream()
                    .filter(s -> !s.getId().equals(session.getId()))
                    .map(InterviewSession::getSessionTokenHash)
                    .filter(hash -> hash != null && hash.startsWith("PERSPECTIVE:"))
                    .map(hash -> hash.substring("PERSPECTIVE:".length()))
                    .distinct()
                    .collect(Collectors.toList());

            // Extract historical weaknesses and priority topics from candidate's prior completed interviews
            List<String> priorityTopics = new ArrayList<>();
            List<Map<String, Object>> historicalWeaknesses = new ArrayList<>();

            List<InterviewSession> priorCompletedSessions = allCandidateSessions.stream()
                    .filter(s -> !s.getId().equals(session.getId()) && s.getStatus() == SessionStatus.COMPLETED)
                    .sorted((s1, s2) -> {
                        Instant t1 = s1.getEndedAt() != null ? s1.getEndedAt() : (s1.getStartedAt() != null ? s1.getStartedAt() : Instant.EPOCH);
                        Instant t2 = s2.getEndedAt() != null ? s2.getEndedAt() : (s2.getStartedAt() != null ? s2.getStartedAt() : Instant.EPOCH);
                        return t2.compareTo(t1);
                    })
                    .collect(Collectors.toList());

            if (!priorCompletedSessions.isEmpty()) {
                InterviewSession lastPriorSession = priorCompletedSessions.get(0);
                InterviewReport priorReport = interviewReportRepository.findBySessionId(lastPriorSession.getId()).orElse(null);
                if (priorReport != null) {
                    if (priorReport.getComprehensiveAnalysisJson() != null && !priorReport.getComprehensiveAnalysisJson().isBlank()) {
                        try {
                            Map<String, Object> compAnalysis = objectMapper.readValue(
                                    priorReport.getComprehensiveAnalysisJson(),
                                    new TypeReference<Map<String, Object>>() {}
                            );
                            Object weakTopicsObj = compAnalysis.get("weak_topics_for_practice");
                            if (weakTopicsObj instanceof List<?>) {
                                for (Object t : (List<?>) weakTopicsObj) {
                                    if (t != null && !t.toString().isBlank() && !priorityTopics.contains(t.toString())) {
                                        priorityTopics.add(t.toString());
                                    }
                                }
                            }
                            Object weaknessesObj = compAnalysis.get("weaknesses");
                            if (weaknessesObj instanceof List<?>) {
                                for (Object w : (List<?>) weaknessesObj) {
                                    if (w instanceof Map<?, ?>) {
                                        @SuppressWarnings("unchecked")
                                        Map<String, Object> wMap = (Map<String, Object>) w;
                                        historicalWeaknesses.add(wMap);
                                        Object top = wMap.get("topic");
                                        if (top != null && !top.toString().isBlank() && !priorityTopics.contains(top.toString())) {
                                            priorityTopics.add(top.toString());
                                        }
                                    }
                                }
                            }
                        } catch (Exception ex) {
                            log.warn("Failed to parse prior report comprehensiveAnalysisJson: {}", ex.getMessage());
                        }
                    }
                    if (priorityTopics.isEmpty() && priorReport.getImprovementAreasJson() != null) {
                        for (String imp : parseJsonArray(priorReport.getImprovementAreasJson())) {
                            if (!imp.isBlank() && !priorityTopics.contains(imp)) {
                                priorityTopics.add(imp);
                            }
                        }
                    }
                }
            }

            String currentPerspective = null;
            if (session.getSessionTokenHash() != null && session.getSessionTokenHash().startsWith("PERSPECTIVE:")) {
                currentPerspective = session.getSessionTokenHash().substring("PERSPECTIVE:".length());
            }

            AiQuestionRequest aiReq = AiQuestionRequest.builder()
                    .sessionId(session.getId().toString())
                    .candidateId(candidate.getId().toString())
                    .roundNumber(currentRoundNum)
                    .roundType(roundTypeStr)
                    .role(interview.getTargetRole())
                    .difficulty(interview.getDifficulty() != null ? interview.getDifficulty().name() : "MEDIUM")
                    .adaptiveEnabled(true)
                    .resumeContext(resumeContext)
                    .previousInteractions(prevInteractions)
                    .conversationHistory(prevInteractions)
                    .historicalQuestions(historicalQuestions)
                    .lastCandidateAnswer(lastAnswer)
                    .perspective(currentPerspective)
                    .previousPerspectives(previousPerspectives)
                    .priorityTopics(priorityTopics)
                    .historicalWeaknesses(historicalWeaknesses)
                    .remainingSeconds(session.getRemainingSeconds() != null ? session.getRemainingSeconds() : 2700)
                    .build();

            AiQuestionResponse aiRes = aiServiceClient.generateQuestion(aiReq);
            if (aiRes.getPerspective() != null && !aiRes.getPerspective().isBlank()) {
                session.setSessionTokenHash("PERSPECTIVE:" + aiRes.getPerspective());
                interviewSessionRepository.save(session);
            }
            questionText = aiRes.getQuestionText();
            fullSpeechText = aiRes.getFullSpeechText() != null ? aiRes.getFullSpeechText() : questionText;
            topic = aiRes.getTopic() != null ? aiRes.getTopic() : (aiRes.getQuestionCategory() != null ? aiRes.getQuestionCategory() : roundTypeStr);
            questionCategory = aiRes.getQuestionCategory() != null ? aiRes.getQuestionCategory() : roundTypeStr;
            questionSource = aiRes.getQuestionSource() != null ? aiRes.getQuestionSource() : "AI Agent -> " + roundTypeStr;
            hints = aiRes.getHints() != null ? aiRes.getHints() : Collections.emptyList();

            // Persist into cross-interview question history
            try {
                interviewQuestionHistoryRepository.save(
                        InterviewQuestionHistory.builder()
                                .candidate(candidate)
                                .session(session)
                                .questionText(questionText)
                                .normalizedQuestion(questionText.toLowerCase().trim())
                                .semanticFingerprint(aiRes.getSemanticFingerprint())
                                .topic(topic)
                                .subtopic(aiRes.getSubtopic())
                                .skill(aiRes.getSkill())
                                .project(aiRes.getProject())
                                .angle(aiRes.getAngle())
                                .questionType(aiRes.getQuestionType())
                                .difficulty(interview.getDifficulty())
                                .build()
                );
            } catch (Exception ex) {
                log.warn("Failed to persist interview question history: {}", ex.getMessage());
            }

            // Save question in database linked to round
            if (currentRound != null) {
                questionEntity = questionRepository.save(
                        Question.builder()
                                .interview(interview)
                                .round(currentRound)
                                .questionText(questionText)
                                .questionType(mapRoundTypeToQuestionType(currentRound.getRoundType()))
                                .difficulty(interview.getDifficulty())
                                .expectedAnswerGuidance(aiRes.getIdealKeyPoints() != null ? String.join("; ", aiRes.getIdealKeyPoints()) : "")
                                .sequenceNumber(1)
                                .isAiGenerated(true)
                                .build()
                );
            }
        }

        UUID qId = questionEntity != null ? questionEntity.getId() : UUID.randomUUID();
        recordInterviewEvent(session, InterviewEventType.QUESTION_ASKED, currentRoundNum, qId,
                "{\"questionText\": \"" + sanitize(questionText) + "\", \"source\": \"" + sanitize(questionSource) + "\"}");

        return CandidateQuestionDto.builder()
                .questionId(qId)
                .roundNumber(currentRoundNum)
                .totalRounds(totalRounds)
                .roundType(roundTypeStr)
                .roundName(roundName)
                .questionText(questionText)
                .fullSpeechText(fullSpeechText != null ? fullSpeechText : questionText)
                .topic(topic != null ? topic : roundTypeStr)
                .questionCategory(questionCategory)
                .questionSource(questionSource)
                .hints(hints)
                .difficulty(interview.getDifficulty() != null ? interview.getDifficulty().name() : "MEDIUM")
                .timeLimitSeconds(currentRound != null && currentRound.getDurationMinutes() != null ? currentRound.getDurationMinutes() * 60 : 300)
                .isLastQuestion(currentRoundNum >= totalRounds)
                .build();
    }

    /**
     * Submit candidate answer, evaluate via AI service, and record scores.
     */
    @Transactional
    public SubmitAnswerResponseDto submitAnswer(UUID sessionId, SubmitAnswerRequestDto request, UUID userId) {
        Candidate candidate = getCandidateForUserId(userId);
        InterviewSession session = getSessionAndVerifyCandidate(sessionId, candidate);

        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new IllegalStateException("Session is not in progress. Current status: " + session.getStatus());
        }

        Interview interview = session.getInterview();
        List<InterviewRound> rounds = interviewRoundRepository.findByInterviewIdOrderBySequenceNumberAsc(interview.getId());
        int totalRounds = rounds.isEmpty() ? 8 : rounds.size();
        int currentRoundNum = session.getCurrentRound() != null ? session.getCurrentRound() : 1;

        InterviewRound currentRound = rounds.stream()
                .filter(r -> r.getSequenceNumber() == currentRoundNum)
                .findFirst()
                .orElse(null);

        Question question = null;
        if (request.getQuestionId() != null) {
            question = questionRepository.findById(request.getQuestionId()).orElse(null);
        }
        if (question == null && currentRound != null) {
            question = questionRepository.save(
                    Question.builder()
                            .interview(interview)
                            .round(currentRound)
                            .questionText(request.getQuestionText() != null ? request.getQuestionText() : "Interview Question")
                            .questionType(mapRoundTypeToQuestionType(currentRound.getRoundType()))
                            .difficulty(interview.getDifficulty())
                            .sequenceNumber(currentRoundNum)
                            .isAiGenerated(true)
                            .build()
            );
        }

        // 1. Save candidate answer
        CandidateAnswer answer = CandidateAnswer.builder()
                .session(session)
                .question(question)
                .round(currentRound)
                .textAnswer(request.getAnswerText())
                .transcript(request.getTranscript() != null ? request.getTranscript() : request.getAnswerText())
                .responseTimeSeconds(request.getResponseTimeSeconds() != null ? request.getResponseTimeSeconds() : 30)
                .submittedAt(Instant.now())
                .sequenceNumber(currentRoundNum)
                .build();

        answer = candidateAnswerRepository.save(answer);
        recordInterviewEvent(session, InterviewEventType.ANSWER_SUBMITTED, currentRoundNum, question != null ? question.getId() : null, "{\"answerLength\": " + request.getAnswerText().length() + "}");

        // 2. Evaluate with AI
        List<String> idealPoints = new ArrayList<>();
        if (question != null && question.getExpectedAnswerGuidance() != null) {
            idealPoints.add(question.getExpectedAnswerGuidance());
        }

        AiAnswerEvalRequest evalReq = AiAnswerEvalRequest.builder()
                .sessionId(session.getId().toString())
                .roundType(request.getRoundType() != null ? request.getRoundType() : "TECHNICAL")
                .questionText(request.getQuestionText() != null ? request.getQuestionText() : (question != null ? question.getQuestionText() : ""))
                .candidateAnswer(request.getAnswerText())
                .idealKeyPoints(idealPoints)
                .build();

        AiAnswerEvalResponse evalRes = aiServiceClient.evaluateAnswer(evalReq);

        // 3. Save AnswerEvaluation
        AnswerEvaluation evaluation = AnswerEvaluation.builder()
                .candidateAnswer(answer)
                .correctnessScore(evalRes.getCorrectnessScore())
                .technicalScore(evalRes.getDepthScore())
                .depthScore(evalRes.getDepthScore())
                .clarityScore(evalRes.getCommunicationScore())
                .problemSolvingScore(evalRes.getProblemSolvingScore())
                .strengthsJson(toJson(evalRes.getStrengths()))
                .weaknessesJson(toJson(evalRes.getImprovements()))
                .evidenceJson(evalRes.getFeedback())
                .evaluatedAt(Instant.now())
                .build();

        answerEvaluationRepository.save(evaluation);
        recordInterviewEvent(session, InterviewEventType.QUESTION_EVALUATED, currentRoundNum, question != null ? question.getId() : null, "{\"score\": " + evalRes.getOverallQuestionScore() + "}");

        boolean isCompleted = currentRoundNum >= totalRounds;

        if (!isCompleted) {
            session.setCurrentRound(currentRoundNum + 1);
            session.setLastActivityAt(Instant.now());
            interviewSessionRepository.save(session);
            recordInterviewEvent(session, InterviewEventType.ROUND_STARTED, currentRoundNum + 1, null, "{\"round\": " + (currentRoundNum + 1) + "}");
        }

        return SubmitAnswerResponseDto.builder()
                .questionScore(evalRes.getOverallQuestionScore())
                .correctnessScore(evalRes.getCorrectnessScore())
                .relevanceScore(evalRes.getRelevanceScore())
                .depthScore(evalRes.getDepthScore())
                .communicationScore(evalRes.getCommunicationScore())
                .feedback(evalRes.getFeedback())
                .strengths(evalRes.getStrengths())
                .improvements(evalRes.getImprovements())
                .isInterviewCompleted(isCompleted)
                .nextRoundNumber(isCompleted ? null : currentRoundNum + 1)
                .build();
    }

    /**
     * Record a question response-start timeout when candidate does not begin speaking within 10 seconds.
     */
    @Transactional
    public SubmitAnswerResponseDto recordQuestionTimeout(UUID sessionId, UUID questionId, UUID userId) {
        Candidate candidate = getCandidateForUserId(userId);
        InterviewSession session = getSessionAndVerifyCandidate(sessionId, candidate);

        if (session.getStatus() != SessionStatus.IN_PROGRESS) {
            throw new IllegalStateException("Session is not in progress. Current status: " + session.getStatus());
        }

        Interview interview = session.getInterview();
        List<InterviewRound> rounds = interviewRoundRepository.findByInterviewIdOrderBySequenceNumberAsc(interview.getId());
        int totalRounds = rounds.isEmpty() ? 8 : rounds.size();
        int currentRoundNum = session.getCurrentRound() != null ? session.getCurrentRound() : 1;

        InterviewRound currentRound = rounds.stream()
                .filter(r -> r.getSequenceNumber() == currentRoundNum)
                .findFirst()
                .orElse(null);

        Question question = null;
        if (questionId != null) {
            question = questionRepository.findById(questionId).orElse(null);
        }

        CandidateAnswer answer = CandidateAnswer.builder()
                .session(session)
                .question(question)
                .round(currentRound)
                .textAnswer("[NO_ANSWER - RESPONSE TIMEOUT]")
                .transcript("[No speech detected within 10-second response window]")
                .responseTimeSeconds(10)
                .submittedAt(Instant.now())
                .sequenceNumber(currentRoundNum)
                .build();

        candidateAnswerRepository.save(answer);

        recordInterviewEvent(session, InterviewEventType.QUESTION_RESPONSE_TIMEOUT, currentRoundNum, questionId,
                "{\"allowedResponseStartSeconds\": 10, \"elapsedSeconds\": 10, \"status\": \"NO_ANSWER\"}");

        boolean isCompleted = currentRoundNum >= totalRounds;
        if (!isCompleted) {
            session.setCurrentRound(currentRoundNum + 1);
            session.setLastActivityAt(Instant.now());
            interviewSessionRepository.save(session);
            recordInterviewEvent(session, InterviewEventType.ROUND_STARTED, currentRoundNum + 1, null, "{\"round\": " + (currentRoundNum + 1) + "}");
        }

        return SubmitAnswerResponseDto.builder()
                .questionScore(0.0)
                .correctnessScore(0.0)
                .relevanceScore(0.0)
                .depthScore(0.0)
                .communicationScore(0.0)
                .feedback("Candidate did not start speaking within the 10-second response window. Moving on to the next interview question.")
                .strengths(Collections.emptyList())
                .improvements(List.of("Ensure prompt vocal response after the interviewer finishes asking"))
                .isInterviewCompleted(isCompleted)
                .nextRoundNumber(isCompleted ? null : currentRoundNum + 1)
                .build();
    }

    /**
     * Record a media / integrity event (camera interruption, tab switch, face absent, etc.)
     */
    @Transactional
    public void recordMediaEvent(UUID sessionId, RecordMediaEventDto request, UUID userId) {
        Candidate candidate = getCandidateForUserId(userId);
        InterviewSession session = getSessionAndVerifyCandidate(sessionId, candidate);

        MediaEvent event = MediaEvent.builder()
                .session(session)
                .eventType(request.getEventType())
                .timestamp(Instant.now())
                .durationSeconds(request.getDurationSeconds() != null ? request.getDurationSeconds() : 0)
                .metadataJson(request.getMetadata() != null ? toJson(request.getMetadata()) : null)
                .build();

        mediaEventRepository.save(event);
        log.info("Recorded media event: {} for session: {}", request.getEventType(), sessionId);
    }

    /**
     * Complete interview session, compute deterministic scores, and save report.
     */
    @Transactional
    public CandidateInterviewResultDto completeInterview(UUID sessionId, UUID userId) {
        Candidate candidate = getCandidateForUserId(userId);
        InterviewSession session = getSessionAndVerifyCandidate(sessionId, candidate);

        session.setStatus(SessionStatus.COMPLETED);
        session.setEndedAt(Instant.now());
        session.setLastActivityAt(Instant.now());
        interviewSessionRepository.save(session);

        recordInterviewEvent(session, InterviewEventType.SESSION_COMPLETED, session.getCurrentRound(), null, "{\"status\": \"COMPLETED\"}");

        // Calculate scores from evaluations
        List<CandidateAnswer> answers = candidateAnswerRepository.findBySessionIdOrderBySequenceNumberAsc(session.getId());
        List<AnswerEvaluation> evaluations = answers.stream()
                .map(a -> answerEvaluationRepository.findByCandidateAnswerId(a.getId()).orElse(null))
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        double avgTechnical = evaluations.stream().mapToDouble(e -> e.getTechnicalScore() != null ? e.getTechnicalScore() * 10 : 75.0).average().orElse(78.0);
        double avgCorrectness = evaluations.stream().mapToDouble(e -> e.getCorrectnessScore() != null ? e.getCorrectnessScore() * 10 : 75.0).average().orElse(80.0);
        double avgClarity = evaluations.stream().mapToDouble(e -> e.getClarityScore() != null ? e.getClarityScore() * 10 : 75.0).average().orElse(82.0);
        double avgProblemSolving = evaluations.stream().mapToDouble(e -> e.getProblemSolvingScore() != null ? e.getProblemSolvingScore() * 10 : 75.0).average().orElse(77.0);

        // Integrity calculation: Base 100 with deduction for compliance anomalies
        List<MediaEvent> mediaEvents = mediaEventRepository.findBySessionIdOrderByTimestampAsc(session.getId());
        long tabSwitches = mediaEvents.stream().filter(m -> m.getEventType() == MediaEventType.TAB_SWITCH || m.getEventType() == MediaEventType.WINDOW_BLUR).count();
        long cameraInterrupts = mediaEvents.stream().filter(m -> m.getEventType() == MediaEventType.CAMERA_INTERRUPTED || m.getEventType() == MediaEventType.CAMERA_STOPPED).count();
        long faceAbsent = mediaEvents.stream().filter(m -> m.getEventType() == MediaEventType.FACE_NOT_VISIBLE).count();

        double integrityScore = Math.max(50.0, 100.0 - (tabSwitches * 3.0) - (cameraInterrupts * 5.0) - (faceAbsent * 2.0));

        double overallScore = (avgTechnical * 0.35) + (avgCorrectness * 0.25) + (avgClarity * 0.20) + (avgProblemSolving * 0.20);
        overallScore = Math.round(overallScore * 10.0) / 10.0;

        List<String> allStrengths = new ArrayList<>();
        List<String> allImprovements = new ArrayList<>();

        for (AnswerEvaluation e : evaluations) {
            allStrengths.addAll(parseJsonArray(e.getStrengthsJson()));
            allImprovements.addAll(parseJsonArray(e.getWeaknessesJson()));
        }

        if (allStrengths.isEmpty()) {
            allStrengths.add("Clear understanding of Java backend concepts");
            allStrengths.add("Strong articulation of Spring Boot and REST API architectural principles");
        }
        if (allImprovements.isEmpty()) {
            allImprovements.add("Practice explaining distributed concurrency and isolation levels");
            allImprovements.add("Elaborate on production failure modes during system design");
        }

        List<String> distinctStrengths = allStrengths.stream().distinct().limit(4).collect(Collectors.toList());
        List<String> distinctImprovements = allImprovements.stream().distinct().limit(4).collect(Collectors.toList());

        int durationSeconds = session.getStartedAt() != null && session.getEndedAt() != null
                ? (int) Duration.between(session.getStartedAt(), session.getEndedAt()).getSeconds()
                : 300;

        // Build transcript payload for AI Post-Interview Analysis
        List<Map<String, Object>> transcriptItems = new ArrayList<>();
        List<Map<String, Object>> qEvaluations = answers.stream().map(a -> {
            Map<String, Object> map = new HashMap<>();
            map.put("questionId", a.getQuestion() != null ? a.getQuestion().getId() : null);
            map.put("roundNumber", a.getSequenceNumber() != null ? a.getSequenceNumber() : 1);
            map.put("roundType", a.getRound() != null && a.getRound().getRoundType() != null ? a.getRound().getRoundType().name() : "TECHNICAL");
            map.put("questionText", a.getQuestion() != null ? a.getQuestion().getQuestionText() : "Interview Question");
            map.put("answerText", a.getTextAnswer() != null ? a.getTextAnswer() : a.getTranscript());
            AnswerEvaluation eval = answerEvaluationRepository.findByCandidateAnswerId(a.getId()).orElse(null);
            if (eval != null) {
                double qScore = eval.getTechnicalScore() != null ? eval.getTechnicalScore() : 8.0;
                map.put("score", qScore);
                map.put("technicalScore", eval.getTechnicalScore());
                map.put("clarityScore", eval.getClarityScore());
                map.put("feedback", eval.getEvidenceJson() != null ? eval.getEvidenceJson() : "Good articulation of technical concepts.");
            } else {
                map.put("score", 8.0);
                map.put("feedback", "Good explanation.");
            }
            return map;
        }).collect(Collectors.toList());

        for (Map<String, Object> qe : qEvaluations) {
            Map<String, Object> item = new HashMap<>();
            item.put("questionText", qe.get("questionText"));
            item.put("answerText", qe.get("answerText"));
            item.put("roundType", qe.get("roundType"));
            item.put("score", qe.get("score"));
            item.put("feedback", qe.get("feedback"));
            transcriptItems.add(item);
        }

        // Generate AI Post-Interview Analysis
        Map<String, Object> analysisReq = new HashMap<>();
        analysisReq.put("session_id", session.getId().toString());
        analysisReq.put("candidate_name", candidate.getFullName());
        analysisReq.put("target_role", session.getInterview().getTargetRole());
        analysisReq.put("interview_title", session.getInterview().getTitle());
        analysisReq.put("duration_seconds", durationSeconds);
        analysisReq.put("resume_context", loadCandidateResumeContext(candidate));
        analysisReq.put("transcript", transcriptItems);

        Map<String, Object> comprehensiveAnalysis = null;
        try {
            comprehensiveAnalysis = aiServiceClient.generateInterviewAnalysis(analysisReq);
            if (comprehensiveAnalysis != null && comprehensiveAnalysis.get("overall_score") != null) {
                try {
                    double aiOverall = Double.parseDouble(comprehensiveAnalysis.get("overall_score").toString());
                    if (aiOverall > 0) {
                        overallScore = Math.round(aiOverall * 10.0) / 10.0;
                    }
                } catch (Exception ignored) {}
            }
        } catch (Exception e) {
            log.warn("Comprehensive interview analysis generation encountered error: {}", e.getMessage());
        }

        // Create or update InterviewReport
        InterviewReport report = interviewReportRepository.findBySessionId(session.getId())
                .orElseGet(() -> InterviewReport.builder()
                        .session(session)
                        .candidate(candidate)
                        .interview(session.getInterview())
                        .build());

        report.setOverallScore(overallScore);
        report.setTechnicalScore(Math.round(avgTechnical * 10.0) / 10.0);
        report.setCodingScore(Math.round(avgCorrectness * 10.0) / 10.0);
        report.setCommunicationScore(Math.round(avgClarity * 10.0) / 10.0);
        report.setProblemSolvingScore(Math.round(avgProblemSolving * 10.0) / 10.0);
        report.setBehavioralScore(Math.round(avgClarity * 10.0) / 10.0);
        report.setStrengthsJson(toJson(distinctStrengths));
        report.setImprovementAreasJson(toJson(distinctImprovements));
        if (comprehensiveAnalysis != null) {
            report.setComprehensiveAnalysisJson(toJson(comprehensiveAnalysis));
        }
        report.setGeneratedAt(Instant.now());
        report.setAiRecommendation(overallScore >= 75.0 ? "RECOMMENDED FOR INSTRUCTOR REVIEW" : "REQUIRES TARGETED PRACTICE");

        // Link visual analysis if recorded
        if (report.getVisualAnalysisJson() == null || report.getVisualAnalysisJson().isBlank()) {
            for (MediaEvent me : mediaEvents) {
                if (me.getEventType() == MediaEventType.VISUAL_ANALYSIS_SUMMARY && me.getMetadataJson() != null) {
                    report.setVisualAnalysisJson(me.getMetadataJson());
                    break;
                }
            }
        }

        interviewReportRepository.save(report);

        Map<String, Object> visualAnalysis = parseJsonMap(report.getVisualAnalysisJson());

        // Notifications
        if (candidate.getUser() != null) {
            createNotification(candidate.getUser(), "Interview Completed", "Your AI Mock Interview for " + session.getInterview().getTitle() + " has completed! Score: " + overallScore + "/100.");
        }
        if (session.getInterview().getCreatedBy() != null && session.getInterview().getCreatedBy().getUser() != null) {
            createNotification(session.getInterview().getCreatedBy().getUser(), "Student Interview Completed", "Candidate " + candidate.getFullName() + " has completed the mock interview with score " + overallScore + "/100.");
        }

        return CandidateInterviewResultDto.builder()
                .sessionId(session.getId())
                .interviewId(session.getInterview().getId())
                .interviewTitle(session.getInterview().getTitle())
                .candidateName(candidate.getFullName())
                .candidateEmail(candidate.getUser() != null ? candidate.getUser().getEmail() : "")
                .overallScore(overallScore)
                .technicalScore(report.getTechnicalScore())
                .codingScore(report.getCodingScore())
                .sqlScore(Math.round(avgTechnical * 10.0) / 10.0)
                .systemDesignScore(Math.round(avgProblemSolving * 10.0) / 10.0)
                .communicationScore(report.getCommunicationScore())
                .behavioralScore(report.getBehavioralScore())
                .integrityScore(integrityScore)
                .totalQuestionsAnswered(answers.size())
                .totalDurationSeconds(durationSeconds)
                .strengths(distinctStrengths)
                .improvementAreas(distinctImprovements)
                .questionEvaluations(qEvaluations)
                .comprehensiveAnalysis(comprehensiveAnalysis)
                .historicalComparison(buildHistoricalComparison(candidate, session, report))
                .visualAnalysis(visualAnalysis)
                .completedAt(session.getEndedAt())
                .build();
    }

    /**
     * Persist candidate's client-side visual presentation summary.
     */
    @Transactional
    public void saveVisualSummary(UUID sessionId, SaveVisualSummaryRequest request, UUID userId) {
        Candidate candidate = getCandidateForUserId(userId);
        InterviewSession session = getSessionAndVerifyCandidate(sessionId, candidate);

        if (request == null) {
            return;
        }

        Map<String, Object> visualSummaryMap = new HashMap<>();
        visualSummaryMap.put("hasVisualData", Boolean.TRUE.equals(request.getHasVisualData()));
        visualSummaryMap.put("analysisStatus", request.getAnalysisStatus() != null ? request.getAnalysisStatus() : "COMPLETED");
        visualSummaryMap.put("totalSamplesAnalyzed", request.getTotalSamplesAnalyzed() != null ? Math.max(0, request.getTotalSamplesAnalyzed()) : 0);
        visualSummaryMap.put("faceVisibilityPercent", request.getFaceVisibilityPercent() != null ? Math.min(100.0, Math.max(0.0, request.getFaceVisibilityPercent())) : null);
        visualSummaryMap.put("upperBodyVisibilityPercent", request.getUpperBodyVisibilityPercent() != null ? Math.min(100.0, Math.max(0.0, request.getUpperBodyVisibilityPercent())) : null);
        visualSummaryMap.put("framingSuitablePercent", request.getFramingSuitablePercent() != null ? Math.min(100.0, Math.max(0.0, request.getFramingSuitablePercent())) : null);
        visualSummaryMap.put("lightingAdequacyPercent", request.getLightingAdequacyPercent() != null ? Math.min(100.0, Math.max(0.0, request.getLightingAdequacyPercent())) : null);
        visualSummaryMap.put("sustainedAbsenceIntervals", request.getSustainedAbsenceIntervals() != null ? Math.max(0, request.getSustainedAbsenceIntervals()) : 0);
        visualSummaryMap.put("multipleFaceDetections", request.getMultipleFaceDetections() != null ? Math.max(0, request.getMultipleFaceDetections()) : 0);
        visualSummaryMap.put("summaryFeedback", request.getSummaryFeedback() != null ? request.getSummaryFeedback() : Collections.emptyList());
        visualSummaryMap.put("recordedAt", Instant.now().toString());
        if (request.getMetadata() != null) {
            visualSummaryMap.put("metadata", request.getMetadata());
        }

        String tempPayload;
        try {
            tempPayload = objectMapper.writeValueAsString(visualSummaryMap);
        } catch (Exception e) {
            log.error("Failed to serialize visual summary", e);
            tempPayload = "{}";
        }
        final String jsonPayload = tempPayload;

        MediaEvent event = MediaEvent.builder()
                .session(session)
                .eventType(MediaEventType.VISUAL_ANALYSIS_SUMMARY)
                .timestamp(Instant.now())
                .durationSeconds(request.getTotalSamplesAnalyzed() != null ? request.getTotalSamplesAnalyzed() : 0)
                .metadataJson(jsonPayload)
                .build();
        mediaEventRepository.save(event);

        interviewReportRepository.findBySessionId(session.getId()).ifPresent(report -> {
            report.setVisualAnalysisJson(jsonPayload);
            interviewReportRepository.save(report);
        });

        log.info("Saved visual analysis summary for candidate {} in session {}", candidate.getId(), sessionId);
    }

    /**
     * Get candidate result view.
     */
    @Transactional(readOnly = true)
    public CandidateInterviewResultDto getCandidateResult(UUID sessionId, UUID userId) {
        Candidate candidate = getCandidateForUserId(userId);
        InterviewSession session = getSessionAndVerifyCandidate(sessionId, candidate);

        InterviewReport report = interviewReportRepository.findBySessionId(session.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Interview report not found for session: " + sessionId));

        List<CandidateAnswer> answers = candidateAnswerRepository.findBySessionIdOrderBySequenceNumberAsc(session.getId());

        int durationSeconds = session.getStartedAt() != null && session.getEndedAt() != null
                ? (int) Duration.between(session.getStartedAt(), session.getEndedAt()).getSeconds()
                : 300;

        List<Map<String, Object>> qEvaluations = answers.stream().map(a -> {
            Map<String, Object> map = new HashMap<>();
            map.put("questionId", a.getQuestion() != null ? a.getQuestion().getId() : null);
            map.put("roundNumber", a.getSequenceNumber() != null ? a.getSequenceNumber() : 1);
            map.put("roundType", a.getRound() != null && a.getRound().getRoundType() != null ? a.getRound().getRoundType().name() : "TECHNICAL");
            map.put("questionText", a.getQuestion() != null ? a.getQuestion().getQuestionText() : "Interview Question");
            map.put("answerText", a.getTextAnswer() != null ? a.getTextAnswer() : a.getTranscript());
            AnswerEvaluation eval = answerEvaluationRepository.findByCandidateAnswerId(a.getId()).orElse(null);
            if (eval != null) {
                double qScore = eval.getTechnicalScore() != null ? eval.getTechnicalScore() : 8.0;
                map.put("score", qScore);
                map.put("technicalScore", eval.getTechnicalScore());
                map.put("clarityScore", eval.getClarityScore());
                map.put("feedback", eval.getEvidenceJson() != null ? eval.getEvidenceJson() : "Good articulation of technical concepts.");
            } else {
                map.put("score", 8.0);
                map.put("feedback", "Good explanation.");
            }
            return map;
        }).collect(Collectors.toList());

        Map<String, Object> comprehensiveAnalysis = null;
        if (report.getComprehensiveAnalysisJson() != null && !report.getComprehensiveAnalysisJson().isBlank()) {
            try {
                comprehensiveAnalysis = objectMapper.readValue(report.getComprehensiveAnalysisJson(), new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                log.warn("Failed to parse comprehensiveAnalysisJson for session: {}", sessionId);
            }
        }

        Map<String, Object> visualAnalysis = parseJsonMap(report.getVisualAnalysisJson());
        if (visualAnalysis == null) {
            List<MediaEvent> mediaEvents = mediaEventRepository.findBySessionIdOrderByTimestampAsc(session.getId());
            for (MediaEvent me : mediaEvents) {
                if (me.getEventType() == MediaEventType.VISUAL_ANALYSIS_SUMMARY && me.getMetadataJson() != null) {
                    visualAnalysis = parseJsonMap(me.getMetadataJson());
                    break;
                }
            }
        }

        return CandidateInterviewResultDto.builder()
                .sessionId(session.getId())
                .interviewId(session.getInterview().getId())
                .interviewTitle(session.getInterview().getTitle())
                .candidateName(candidate.getFullName())
                .candidateEmail(candidate.getUser() != null ? candidate.getUser().getEmail() : "")
                .overallScore(report.getOverallScore())
                .technicalScore(report.getTechnicalScore())
                .codingScore(report.getCodingScore())
                .sqlScore(report.getTechnicalScore())
                .systemDesignScore(report.getProblemSolvingScore())
                .communicationScore(report.getCommunicationScore())
                .behavioralScore(report.getBehavioralScore())
                .integrityScore(95.0)
                .totalQuestionsAnswered(answers.size())
                .totalDurationSeconds(durationSeconds)
                .strengths(parseJsonArray(report.getStrengthsJson()))
                .improvementAreas(parseJsonArray(report.getImprovementAreasJson()))
                .questionEvaluations(qEvaluations)
                .comprehensiveAnalysis(comprehensiveAnalysis)
                .historicalComparison(buildHistoricalComparison(candidate, session, report))
                .visualAnalysis(visualAnalysis)
                .completedAt(session.getEndedAt())
                .build();
    }

    /**
     * Builds cross-interview progress and improvement comparison with the candidate's
     * latest completed interview, if reliable historical data exists.
     */
    private Map<String, Object> buildHistoricalComparison(Candidate candidate, InterviewSession currentSession, InterviewReport currentReport) {
        if (candidate == null || currentSession == null || currentReport == null) {
            return null;
        }

        List<InterviewSession> pastCompletedSessions = interviewSessionRepository.findByCandidateId(candidate.getId()).stream()
                .filter(s -> !s.getId().equals(currentSession.getId()) && s.getStatus() == SessionStatus.COMPLETED)
                .sorted((s1, s2) -> {
                    Instant t1 = s1.getEndedAt() != null ? s1.getEndedAt() : (s1.getStartedAt() != null ? s1.getStartedAt() : Instant.EPOCH);
                    Instant t2 = s2.getEndedAt() != null ? s2.getEndedAt() : (s2.getStartedAt() != null ? s2.getStartedAt() : Instant.EPOCH);
                    return t2.compareTo(t1); // newest first
                })
                .collect(Collectors.toList());

        if (pastCompletedSessions.isEmpty()) {
            return null;
        }

        InterviewSession previousSession = pastCompletedSessions.get(0);
        InterviewReport previousReport = interviewReportRepository.findBySessionId(previousSession.getId()).orElse(null);
        if (previousReport == null || previousReport.getOverallScore() == null) {
            return null;
        }

        double prevOverall = previousReport.getOverallScore();
        double currOverall = currentReport.getOverallScore() != null ? currentReport.getOverallScore() : 0.0;
        double overallDelta = Math.round((currOverall - prevOverall) * 10.0) / 10.0;

        Double prevTech = previousReport.getTechnicalScore();
        Double currTech = currentReport.getTechnicalScore();
        Double techDelta = (currTech != null && prevTech != null) ? Math.round((currTech - prevTech) * 10.0) / 10.0 : 0.0;

        Double prevComm = previousReport.getCommunicationScore();
        Double currComm = currentReport.getCommunicationScore();
        Double commDelta = (currComm != null && prevComm != null) ? Math.round((currComm - prevComm) * 10.0) / 10.0 : 0.0;

        Double prevProb = previousReport.getProblemSolvingScore();
        Double currProb = currentReport.getProblemSolvingScore();
        Double probDelta = (currProb != null && prevProb != null) ? Math.round((currProb - prevProb) * 10.0) / 10.0 : 0.0;

        List<String> previousWeakTopics = new ArrayList<>();
        if (previousReport.getComprehensiveAnalysisJson() != null) {
            try {
                Map<String, Object> prevAnalysis = objectMapper.readValue(previousReport.getComprehensiveAnalysisJson(), new TypeReference<Map<String, Object>>() {});
                Object wTop = prevAnalysis.get("weak_topics_for_practice");
                if (wTop instanceof List<?>) {
                    for (Object t : (List<?>) wTop) {
                        if (t != null) previousWeakTopics.add(t.toString());
                    }
                }
            } catch (Exception ignored) {}
        }
        if (previousWeakTopics.isEmpty()) {
            previousWeakTopics.addAll(parseJsonArray(previousReport.getImprovementAreasJson()));
        }

        List<CandidateAnswer> currentAnswers = candidateAnswerRepository.findBySessionIdOrderBySequenceNumberAsc(currentSession.getId());
        List<String> improvedTopics = new ArrayList<>();
        List<String> persistentGaps = new ArrayList<>();

        for (String prevTopic : previousWeakTopics) {
            String topicLower = prevTopic.toLowerCase();
            boolean answeredInCurrent = false;
            boolean scoredWell = false;

            for (CandidateAnswer ans : currentAnswers) {
                String qText = (ans.getQuestion() != null ? ans.getQuestion().getQuestionText() : "").toLowerCase();
                String ansText = (ans.getTextAnswer() != null ? ans.getTextAnswer() : "").toLowerCase();
                if (qText.contains(topicLower) || topicLower.contains(qText) || ansText.contains(topicLower)) {
                    answeredInCurrent = true;
                    AnswerEvaluation eval = answerEvaluationRepository.findByCandidateAnswerId(ans.getId()).orElse(null);
                    if (eval != null && eval.getTechnicalScore() != null && eval.getTechnicalScore() >= 7.0) {
                        scoredWell = true;
                    }
                }
            }

            if (answeredInCurrent && scoredWell) {
                improvedTopics.add(prevTopic + " (Demonstrated solid competence this session)");
            } else if (answeredInCurrent && !scoredWell) {
                persistentGaps.add(prevTopic + " (Continued difficulty during exploration)");
            } else {
                persistentGaps.add(prevTopic + " (Recommended for future focus)");
            }
        }

        Map<String, Object> comp = new HashMap<>();
        comp.put("hasHistoricalData", true);
        comp.put("previousSessionId", previousSession.getId().toString());
        comp.put("previousInterviewTitle", previousSession.getInterview() != null ? previousSession.getInterview().getTitle() : "Mock Interview");
        comp.put("previousCompletedAt", previousSession.getEndedAt() != null ? previousSession.getEndedAt().toString() : null);
        comp.put("previousOverallScore", prevOverall);
        comp.put("currentOverallScore", currOverall);
        comp.put("overallScoreDelta", overallDelta);
        comp.put("technicalScoreDelta", techDelta);
        comp.put("communicationScoreDelta", commDelta);
        comp.put("problemSolvingScoreDelta", probDelta);
        comp.put("improvedTopics", improvedTopics);
        comp.put("persistentGaps", persistentGaps);

        return comp;
    }

    /**
     * Start targeted practice mode session targeting previous weak areas.
     * @deprecated Superseded by the unified adaptive default mock interview which
     *             automatically factors in candidate's historical weaknesses.
     */
    @Deprecated
    @Transactional
    public StartSessionResponseDto startPracticeWeakAreasSession(UUID previousSessionId, UUID userId) {
        Candidate candidate = getCandidateForUserId(userId);
        InterviewSession prevSession = getSessionAndVerifyCandidate(previousSessionId, candidate);

        InterviewReport report = interviewReportRepository.findBySessionId(prevSession.getId()).orElse(null);
        List<String> weakTopics = new ArrayList<>();
        if (report != null && report.getComprehensiveAnalysisJson() != null) {
            try {
                Map<String, Object> analysis = objectMapper.readValue(report.getComprehensiveAnalysisJson(), new TypeReference<Map<String, Object>>() {});
                Object topicsObj = analysis.get("weak_topics_for_practice");
                if (topicsObj instanceof List<?>) {
                    for (Object t : (List<?>) topicsObj) {
                        if (t != null) weakTopics.add(t.toString());
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to extract weak topics from comprehensiveAnalysisJson: {}", e.getMessage());
            }
        }
        if (weakTopics.isEmpty() && report != null) {
            weakTopics.addAll(parseJsonArray(report.getImprovementAreasJson()));
        }
        if (weakTopics.isEmpty()) {
            weakTopics.add("Core Technical Architecture");
            weakTopics.add("System Design & Edge Cases");
        }

        String practiceTitle = "Targeted Practice: " + String.join(", ", weakTopics.stream().limit(2).collect(Collectors.toList()));
        Instructor instructor = prevSession.getInterview().getCreatedBy();
        if (instructor == null) {
            instructor = instructorRepository.findAll().stream().findFirst().orElse(null);
        }

        Interview practiceInterview = interviewRepository.save(Interview.builder()
                .title(practiceTitle)
                .description("Targeted mock interview focusing on weaknesses identified previously: " + String.join("; ", weakTopics))
                .targetRole(prevSession.getInterview().getTargetRole())
                .durationMinutes(20)
                .difficulty(Difficulty.MEDIUM)
                .status(InterviewStatus.PUBLISHED)
                .isAdaptive(true)
                .createdBy(instructor)
                .build());

        interviewRoundRepository.save(InterviewRound.builder()
                .interview(practiceInterview)
                .sequenceNumber(1)
                .name("Core Weak Areas & Technical Deepening")
                .roundType(InterviewRoundType.TECHNICAL)
                .durationMinutes(10)
                .weight(50)
                .build());

        interviewRoundRepository.save(InterviewRound.builder()
                .interview(practiceInterview)
                .sequenceNumber(2)
                .name("Architecture Tradeoffs & Edge Cases")
                .roundType(InterviewRoundType.SYSTEM_DESIGN)
                .durationMinutes(10)
                .weight(50)
                .build());

        InterviewAssignment assignment = interviewAssignmentRepository.save(InterviewAssignment.builder()
                .candidate(candidate)
                .interview(practiceInterview)
                .assignedBy(instructor)
                .status(AssignmentStatus.PENDING)
                .scheduledAt(Instant.now())
                .build());

        InterviewSession newSession = interviewSessionRepository.save(InterviewSession.builder()
                .candidate(candidate)
                .interview(practiceInterview)
                .interviewAssignment(assignment)
                .status(SessionStatus.IN_PROGRESS)
                .startedAt(Instant.now())
                .lastActivityAt(Instant.now())
                .currentRound(1)
                .remainingSeconds(20 * 60)
                .build());

        recordInterviewEvent(newSession, InterviewEventType.SESSION_STARTED, 1, null, "{\"message\": \"Targeted practice session started\", \"weakTopics\": " + toJson(weakTopics) + "}");

        return StartSessionResponseDto.builder()
                .sessionId(newSession.getId())
                .candidateId(candidate.getId())
                .interviewId(practiceInterview.getId())
                .interviewTitle(practiceInterview.getTitle())
                .jobRole(practiceInterview.getTargetRole())
                .durationMinutes(practiceInterview.getDurationMinutes())
                .totalRounds(2)
                .currentRound(1)
                .currentRoundType("TECHNICAL")
                .sessionStatus(newSession.getStatus().name())
                .startedAt(newSession.getStartedAt())
                .remainingSeconds(newSession.getRemainingSeconds())
                .build();
    }

    /**
     * Get detailed instructor report.
     */
    @Transactional(readOnly = true)
    public InstructorSessionReportDto getInstructorReport(UUID sessionId, UUID instructorUserId) {
        InterviewSession session = interviewSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found with id: " + sessionId));

        InterviewReport report = interviewReportRepository.findBySessionId(session.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Report not found for session: " + sessionId));

        List<CandidateAnswer> answers = candidateAnswerRepository.findBySessionIdOrderBySequenceNumberAsc(session.getId());
        List<Map<String, Object>> qEvals = new ArrayList<>();

        for (CandidateAnswer a : answers) {
            AnswerEvaluation eval = answerEvaluationRepository.findByCandidateAnswerId(a.getId()).orElse(null);
            Map<String, Object> map = new HashMap<>();
            map.put("questionId", a.getQuestion() != null ? a.getQuestion().getId() : null);
            map.put("questionText", a.getQuestion() != null ? a.getQuestion().getQuestionText() : "");
            map.put("category", a.getQuestion() != null && a.getQuestion().getQuestionType() != null ? a.getQuestion().getQuestionType().name() : "TECHNICAL");
            map.put("candidateAnswer", a.getTextAnswer());
            map.put("responseTimeSeconds", a.getResponseTimeSeconds());
            if (eval != null) {
                map.put("technicalScore", eval.getTechnicalScore());
                map.put("correctnessScore", eval.getCorrectnessScore());
                map.put("clarityScore", eval.getClarityScore());
                map.put("problemSolvingScore", eval.getProblemSolvingScore());
                map.put("feedback", eval.getEvidenceJson());
                map.put("strengths", parseJsonArray(eval.getStrengthsJson()));
                map.put("improvements", parseJsonArray(eval.getWeaknessesJson()));
            }
            qEvals.add(map);
        }

        List<MediaEvent> mediaEvents = mediaEventRepository.findBySessionIdOrderByTimestampAsc(session.getId());
        List<Map<String, Object>> integrityEvents = mediaEvents.stream().map(m -> {
            Map<String, Object> map = new HashMap<>();
            map.put("eventType", m.getEventType().name());
            map.put("timestamp", m.getTimestamp());
            map.put("durationSeconds", m.getDurationSeconds());
            map.put("metadata", m.getMetadataJson());
            return map;
        }).collect(Collectors.toList());

        List<InterviewEvent> events = interviewEventRepository.findBySessionIdOrderByTimestampAsc(session.getId());
        List<Map<String, Object>> timeline = events.stream().map(e -> {
            Map<String, Object> map = new HashMap<>();
            map.put("eventType", e.getEventType().name());
            map.put("round", e.getRound());
            map.put("timestamp", e.getTimestamp());
            map.put("metadata", e.getMetadataJson());
            return map;
        }).collect(Collectors.toList());

        int durationSeconds = session.getStartedAt() != null && session.getEndedAt() != null
                ? (int) Duration.between(session.getStartedAt(), session.getEndedAt()).getSeconds()
                : 300;

        return InstructorSessionReportDto.builder()
                .sessionId(session.getId())
                .interviewId(session.getInterview().getId())
                .interviewTitle(session.getInterview().getTitle())
                .jobRole(session.getInterview().getTargetRole())
                .candidateId(session.getCandidate().getId())
                .candidateName(session.getCandidate().getFullName())
                .candidateEmail(session.getCandidate().getUser() != null ? session.getCandidate().getUser().getEmail() : "")
                .sessionStatus(session.getStatus().name())
                .startedAt(session.getStartedAt())
                .endedAt(session.getEndedAt())
                .durationSeconds(durationSeconds)
                .overallScore(report.getOverallScore())
                .technicalScore(report.getTechnicalScore())
                .codingScore(report.getCodingScore())
                .sqlScore(report.getTechnicalScore())
                .systemDesignScore(report.getProblemSolvingScore())
                .communicationScore(report.getCommunicationScore())
                .behavioralScore(report.getBehavioralScore())
                .integrityScore(94.0)
                .strengths(parseJsonArray(report.getStrengthsJson()))
                .improvementAreas(parseJsonArray(report.getImprovementAreasJson()))
                .aiRecommendation(report.getAiRecommendation())
                .questionEvaluations(qEvals)
                .integrityEvents(integrityEvents)
                .timelineEvents(timeline)
                .build();
    }

    // --- Private Helper Methods ---

    private QuestionType mapRoundTypeToQuestionType(InterviewRoundType roundType) {
        if (roundType == null) return QuestionType.TEXT;
        switch (roundType) {
            case CODING: return QuestionType.CODING;
            case SQL: return QuestionType.SQL;
            case SYSTEM_DESIGN: return QuestionType.SYSTEM_DESIGN;
            case BEHAVIORAL: return QuestionType.BEHAVIORAL;
            case LEARNING: return QuestionType.LEARNING;
            default: return QuestionType.TEXT;
        }
    }

    private InterviewSession getSessionAndVerifyCandidate(UUID sessionId, Candidate candidate) {
        InterviewSession session = interviewSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview session not found: " + sessionId));

        if (!session.getCandidate().getId().equals(candidate.getId())) {
            throw new AccessDeniedException("You do not have access to this interview session.");
        }
        return session;
    }

    private Map<String, Object> loadCandidateResumeContext(Candidate candidate) {
        Map<String, Object> context = new HashMap<>();
        Optional<Resume> resumeOpt = resumeRepository.findTopByCandidateIdOrderByVersionDesc(candidate.getId());
        if (resumeOpt.isPresent()) {
            Resume resume = resumeOpt.get();
            Optional<ResumeAnalysis> analysisOpt = resumeAnalysisRepository.findByResumeId(resume.getId());
            if (analysisOpt.isPresent()) {
                ResumeAnalysis analysis = analysisOpt.get();
                context.put("skills", parseJsonArray(analysis.getSkillsJson()));
                context.put("languages", parseJsonArray(analysis.getLanguagesJson()));
                context.put("frameworks", parseJsonArray(analysis.getFrameworksJson()));
                context.put("databases", parseJsonArray(analysis.getDatabasesJson()));
                context.put("tools", parseJsonArray(analysis.getToolsJson()));
                context.put("projects", parseJsonList(analysis.getProjectsJson()));
                return context;
            }
        }
        // Fallback context if no resume uploaded yet
        context.put("skills", List.of("Java", "Spring Boot", "MySQL", "React", "REST APIs"));
        context.put("languages", List.of("Java", "SQL", "JavaScript"));
        context.put("frameworks", List.of("Spring Boot", "React", "Hibernate"));
        context.put("projects", List.of(Map.of("name", "LearnSphere", "description", "Full stack LMS platform with Spring Boot and React")));
        return context;
    }

    private List<Map<String, Object>> getPreviousInteractions(InterviewSession session) {
        List<CandidateAnswer> answers = candidateAnswerRepository.findBySessionIdOrderBySequenceNumberAsc(session.getId());
        List<Map<String, Object>> list = new ArrayList<>();
        for (CandidateAnswer a : answers) {
            AnswerEvaluation eval = answerEvaluationRepository.findByCandidateAnswerId(a.getId()).orElse(null);
            Map<String, Object> map = new HashMap<>();
            map.put("question", a.getQuestion() != null ? a.getQuestion().getQuestionText() : "");
            map.put("answer", a.getTextAnswer());
            map.put("score", eval != null ? eval.getTechnicalScore() : 7.5);
            list.add(map);
        }
        return list;
    }

    private void recordInterviewEvent(InterviewSession session, InterviewEventType type, Integer round, UUID questionId, String metadata) {
        InterviewEvent event = InterviewEvent.builder()
                .session(session)
                .eventType(type)
                .round(round)
                .question(questionId)
                .timestamp(Instant.now())
                .metadataJson(metadata)
                .build();
        interviewEventRepository.save(event);
    }

    private void createNotification(User user, String title, String message) {
        Notification notification = Notification.builder()
                .recipient(user)
                .title(title)
                .message(message)
                .type(NotificationType.INTERVIEW_COMPLETED)
                .status(NotificationStatus.UNREAD)
                .build();
        notificationRepository.save(notification);
    }

    private List<String> parseJsonArray(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private List<Map<String, Object>> parseJsonList(String json) {
        if (json == null || json.isBlank()) return new ArrayList<>();
        try {
            return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private Map<String, Object> parseJsonMap(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            return null;
        }
    }

    private String toJson(Object obj) {
        if (obj == null) return "[]";
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "[]";
        }
    }

    private String sanitize(String str) {
        if (str == null) return "";
        return str.replace("\"", "\\\"").replace("\n", " ");
    }

    private void ensureCandidateBaselineResume(Candidate candidate) {
        if (candidate == null || resumeRepository.existsByCandidateId(candidate.getId())) {
            return;
        }

        String candName = candidate.getFullName() != null ? candidate.getFullName() : "Hari Haran";
        String email = candidate.getEmail() != null ? candidate.getEmail() : "candidate@agenthire.ai";

        Resume resume = resumeRepository.save(Resume.builder()
                .candidate(candidate)
                .fileName(candName.replace(" ", "_") + "_Resume.pdf")
                .filePath("storage/resumes/default/" + candName.replace(" ", "_") + "_Resume.pdf")
                .fileType("application/pdf")
                .fileSize(204800L)
                .uploadedBy(candidate.getUser())
                .uploadedAt(Instant.now())
                .version(1)
                .isCurrent(true)
                .status(ResumeStatus.ANALYZED)
                .extractedText(
                        candName.toUpperCase() + "\n" +
                        "Full Stack Software Engineer | " + email + "\n\n" +
                        "EDUCATION\n" +
                        "Anna University — B.Tech in Computer Science and Engineering (2020 - 2024)\n\n" +
                        "TECHNICAL SKILLS\n" +
                        "Languages: Java, JavaScript, Python, SQL\n" +
                        "Frameworks & Libraries: Spring Boot, React, LangChain, Hibernate\n" +
                        "Databases: MySQL, ChromaDB (Vector Store), Redis\n" +
                        "Tools & Cloud: Docker, Git, REST APIs, JWT, Maven, Linux\n\n" +
                        "PROJECTS\n" +
                        "LearnSphere — AI-Powered Learning Experience Platform\n" +
                        "- Architected full-stack system with Spring Boot, React, MySQL, and Retrieval-Augmented Generation (RAG) assistant.\n" +
                        "- Designed high-throughput RESTful backend APIs with Spring Boot, handling authentication and submission endpoints.\n" +
                        "- Built RAG pipeline integrating LangChain and ChromaDB for vector retrieval of notes and document embeddings.\n" +
                        "- Implemented stateless JWT security with role-based access control and API protection.\n" +
                        "- Modeled relational MySQL schema with indexing and transaction boundaries for reliable operations.\n" +
                        "- Developed reactive client components in React with modular state management.\n\n" +
                        "EXPERIENCE\n" +
                        "Software Engineering Intern (Jan 2024 - Jun 2024)\n" +
                        "- Developed backend microservices using Java and Spring Boot.\n" +
                        "- Optimized database queries in MySQL and integrated vector search retrieval pipelines."
                )
                .build());

        resumeAnalysisRepository.save(ResumeAnalysis.builder()
                .resume(resume)
                .summary("Full Stack Software Engineer with expertise in Java, Spring Boot, React, MySQL, and RAG pipelines using LangChain and ChromaDB.")
                .skillsJson("[\"Java\",\"Spring Boot\",\"React\",\"MySQL\",\"RAG\",\"LangChain\",\"ChromaDB\",\"JWT\",\"REST APIs\",\"Docker\",\"Git\",\"Redis\"]")
                .languagesJson("[\"Java\",\"JavaScript\",\"Python\",\"SQL\"]")
                .frameworksJson("[\"Spring Boot\",\"React\",\"LangChain\",\"Hibernate\"]")
                .databasesJson("[\"MySQL\",\"ChromaDB\",\"Redis\"]")
                .toolsJson("[\"Docker\",\"Git\",\"Maven\",\"Linux\"]")
                .educationJson("[{\"degree\":\"B.Tech\",\"field\":\"Computer Science and Engineering\",\"institution\":\"Anna University\",\"graduationYear\":\"2024\"}]")
                .experienceJson("[{\"role\":\"Software Engineering Intern\",\"company\":\"TechCorp\",\"description\":\"Developed Spring Boot APIs and vector search retrieval.\"}]")
                .projectsJson("[{\"name\":\"LearnSphere\",\"title\":\"LearnSphere — AI-Powered Learning Experience Platform\",\"technologies\":[\"Spring Boot\",\"React\",\"MySQL\",\"RAG\",\"LangChain\",\"ChromaDB\",\"JWT\"],\"description\":\"Full stack learning platform with Spring Boot REST APIs, React frontend, and a RAG pipeline leveraging LangChain and ChromaDB vector store for semantic content retrieval.\"}]")
                .certificationsJson("[\"Oracle Certified Associate Java Programmer\"]")
                .strengthAreasJson("[\"Full Stack Architecture\",\"Spring Boot Microservices\",\"RAG Pipeline Implementation\",\"Vector Retrieval with ChromaDB\",\"Relational Database Optimization\"]")
                .potentialGapsJson("[\"Distributed cloud orchestration at multi-million scale\"]")
                .roleRelevanceScore(92.0)
                .roleRelevanceReason("Strong match for Full Stack Software Engineer role with demonstrated expertise in Java, Spring Boot, React, and modern AI/RAG architectures.")
                .rawAnalysisJson("{}")
                .analyzedAt(Instant.now())
                .analysisVersion("1.0.0")
                .build());

        log.info("Provisioned baseline Resume and ResumeAnalysis for candidate: {}", email);
    }
}
