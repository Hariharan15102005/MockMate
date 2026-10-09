package com.agenthire.service;

import com.agenthire.dto.ai.AiAnswerEvalResponse;
import com.agenthire.dto.ai.AiQuestionResponse;
import com.agenthire.dto.candidate.*;
import com.agenthire.entity.*;
import com.agenthire.entity.enums.*;
import com.agenthire.repository.*;
import com.agenthire.service.ai.AiServiceClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CandidateInterviewServiceTest {

    @Mock
    private CandidateRepository candidateRepository;
    @Mock
    private InstructorRepository instructorRepository;
    @Mock
    private InterviewRepository interviewRepository;
    @Mock
    private InterviewRoundRepository interviewRoundRepository;
    @Mock
    private QuestionRepository questionRepository;
    @Mock
    private InterviewAssignmentRepository interviewAssignmentRepository;
    @Mock
    private InterviewSessionRepository interviewSessionRepository;
    @Mock
    private CandidateAnswerRepository candidateAnswerRepository;
    @Mock
    private AnswerEvaluationRepository answerEvaluationRepository;
    @Mock
    private InterviewEventRepository interviewEventRepository;
    @Mock
    private MediaEventRepository mediaEventRepository;
    @Mock
    private InterviewReportRepository interviewReportRepository;
    @Mock
    private ResumeRepository resumeRepository;
    @Mock
    private ResumeAnalysisRepository resumeAnalysisRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private InterviewQuestionHistoryRepository interviewQuestionHistoryRepository;
    @Mock
    private AiServiceClient aiServiceClient;
    @Mock
    private EngineerResumeService engineerResumeService;

    private ObjectMapper objectMapper = new ObjectMapper();

    private CandidateInterviewService candidateInterviewService;

    private User candidateUser;
    private Candidate candidate;
    private Instructor instructor;
    private Interview interview;
    private InterviewRound round1;
    private InterviewAssignment assignment;
    private InterviewSession session;

    @BeforeEach
    void setUp() {
        candidateInterviewService = new CandidateInterviewService(
                candidateRepository,
                instructorRepository,
                interviewRepository,
                interviewRoundRepository,
                questionRepository,
                interviewAssignmentRepository,
                interviewSessionRepository,
                candidateAnswerRepository,
                answerEvaluationRepository,
                interviewEventRepository,
                mediaEventRepository,
                interviewReportRepository,
                resumeRepository,
                resumeAnalysisRepository,
                notificationRepository,
                interviewQuestionHistoryRepository,
                aiServiceClient,
                engineerResumeService,
                objectMapper
        );

        candidateUser = User.builder()
                .email("hari@gmail.com")
                .fullName("Hari Haran")
                .role(UserRole.CANDIDATE)
                .build();
        candidateUser.setId(UUID.randomUUID());

        candidate = Candidate.builder()
                .user(candidateUser)
                .fullName("Hari Haran")
                .email("hari@gmail.com")
                .appliedRole("Java Full Stack Developer")
                .status(CandidateStatus.VERIFIED)
                .build();
        candidate.setId(UUID.randomUUID());

        instructor = Instructor.builder()
                .user(User.builder().fullName("Instructor Khariharan").email("khariharan.career@gmail.com").role(UserRole.INSTRUCTOR).build())
                .build();
        instructor.setId(UUID.randomUUID());

        interview = Interview.builder()
                .title("Java Full Stack AI Mock Interview")
                .targetRole("Java Full Stack Developer")
                .durationMinutes(45)
                .difficulty(Difficulty.MEDIUM)
                .status(InterviewStatus.PUBLISHED)
                .createdBy(instructor)
                .isAdaptive(true)
                .build();
        interview.setId(UUID.randomUUID());

        round1 = InterviewRound.builder()
                .interview(interview)
                .name("Technical Round 1")
                .roundType(InterviewRoundType.TECHNICAL)
                .sequenceNumber(1)
                .durationMinutes(10)
                .build();
        round1.setId(UUID.randomUUID());

        assignment = InterviewAssignment.builder()
                .interview(interview)
                .candidate(candidate)
                .assignedBy(instructor)
                .status(AssignmentStatus.PENDING)
                .build();
        assignment.setId(UUID.randomUUID());

        session = InterviewSession.builder()
                .interview(interview)
                .candidate(candidate)
                .interviewAssignment(assignment)
                .status(SessionStatus.IN_PROGRESS)
                .startedAt(Instant.now())
                .currentRound(1)
                .remainingSeconds(2700)
                .build();
        session.setId(UUID.randomUUID());
    }

    @Test
    @DisplayName("Candidate can view available published mock interviews")
    void testGetCandidateInterviews() {
        when(candidateRepository.findByUserId(candidateUser.getId())).thenReturn(Optional.of(candidate));
        when(interviewRepository.findByStatus(InterviewStatus.PUBLISHED)).thenReturn(List.of(interview));
        when(interviewRoundRepository.findByInterviewIdOrderBySequenceNumberAsc(interview.getId())).thenReturn(List.of(round1));
        when(interviewSessionRepository.findFirstByCandidateIdAndInterviewIdOrderByCreatedAtDesc(candidate.getId(), interview.getId()))
                .thenReturn(Optional.of(session));

        List<CandidateInterviewDto> result = candidateInterviewService.getCandidateInterviews(candidateUser.getId());

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Java Full Stack AI Mock Interview", result.get(0).getTitle());
        assertEquals(SessionStatus.IN_PROGRESS.name(), result.get(0).getSessionStatus());
    }

    @Test
    @DisplayName("Candidate can start or resume interview session successfully")
    void testStartOrResumeSession() {
        when(candidateRepository.findByUserId(candidateUser.getId())).thenReturn(Optional.of(candidate));
        when(interviewRepository.findById(interview.getId())).thenReturn(Optional.of(interview));
        when(interviewSessionRepository.findFirstByCandidateIdAndInterviewIdOrderByCreatedAtDesc(candidate.getId(), interview.getId()))
                .thenReturn(Optional.of(session));
        when(interviewRoundRepository.findByInterviewIdOrderBySequenceNumberAsc(interview.getId())).thenReturn(List.of(round1));
        when(interviewSessionRepository.save(any(InterviewSession.class))).thenReturn(session);

        StartSessionResponseDto response = candidateInterviewService.startOrResumeSession(interview.getId(), candidateUser.getId());

        assertNotNull(response);
        assertEquals(session.getId(), response.getSessionId());
        assertEquals(1, response.getCurrentRound());
        assertEquals("TECHNICAL", response.getCurrentRoundType());
    }

    @Test
    @DisplayName("Candidate submits answer and receives AI score & feedback")
    void testSubmitAnswer() {
        when(candidateRepository.findByUserId(candidateUser.getId())).thenReturn(Optional.of(candidate));
        when(interviewSessionRepository.findById(session.getId())).thenReturn(Optional.of(session));
        when(interviewRoundRepository.findByInterviewIdOrderBySequenceNumberAsc(interview.getId())).thenReturn(List.of(round1));
        when(candidateAnswerRepository.save(any(CandidateAnswer.class))).thenAnswer(i -> {
            CandidateAnswer a = i.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        AiAnswerEvalResponse aiEval = AiAnswerEvalResponse.builder()
                .correctnessScore(8.5)
                .relevanceScore(9.0)
                .depthScore(8.0)
                .completenessScore(8.0)
                .communicationScore(8.5)
                .problemSolvingScore(8.0)
                .overallQuestionScore(8.3)
                .feedback("Strong explanation of Spring lifecycle.")
                .strengths(List.of("Clear IoC explanation"))
                .improvements(List.of("Elaborate on BeanPostProcessor"))
                .build();

        when(aiServiceClient.evaluateAnswer(any())).thenReturn(aiEval);

        SubmitAnswerRequestDto request = SubmitAnswerRequestDto.builder()
                .roundNumber(1)
                .roundType("TECHNICAL")
                .questionText("Explain Spring IoC container.")
                .answerText("Spring IoC container manages beans throughout their lifecycle with dependency injection.")
                .responseTimeSeconds(30)
                .build();

        SubmitAnswerResponseDto response = candidateInterviewService.submitAnswer(session.getId(), request, candidateUser.getId());

        assertNotNull(response);
        assertEquals(8.3, response.getQuestionScore());
        assertEquals(8.5, response.getCorrectnessScore());
        assertTrue(response.getIsInterviewCompleted()); // Only 1 round in mock setup
        verify(answerEvaluationRepository, times(1)).save(any(AnswerEvaluation.class));
    }

    @Test
    @DisplayName("Candidate cannot access another candidate's interview session")
    void testCrossCandidateAccessDenied() {
        Candidate anotherCandidate = Candidate.builder()
                .fullName("Other Candidate")
                .email("other@gmail.com")
                .build();
        anotherCandidate.setId(UUID.randomUUID());

        when(candidateRepository.findByUserId(candidateUser.getId())).thenReturn(Optional.of(anotherCandidate));
        when(interviewSessionRepository.findById(session.getId())).thenReturn(Optional.of(session));

        assertThrows(AccessDeniedException.class, () -> {
            candidateInterviewService.getCurrentQuestion(session.getId(), candidateUser.getId());
        });
    }

    @Test
    @DisplayName("Deterministic report calculation upon interview completion")
    void testCompleteInterview() {
        when(candidateRepository.findByUserId(candidateUser.getId())).thenReturn(Optional.of(candidate));
        when(interviewSessionRepository.findById(session.getId())).thenReturn(Optional.of(session));
        when(interviewSessionRepository.save(any(InterviewSession.class))).thenReturn(session);

        CandidateAnswer answer = CandidateAnswer.builder()
                .session(session)
                .textAnswer("Sample answer")
                .sequenceNumber(1)
                .build();
        answer.setId(UUID.randomUUID());

        AnswerEvaluation eval = AnswerEvaluation.builder()
                .candidateAnswer(answer)
                .technicalScore(8.5)
                .correctnessScore(8.0)
                .clarityScore(8.5)
                .problemSolvingScore(8.0)
                .strengthsJson("[\"Strong Java core fundamentals\"]")
                .weaknessesJson("[\"Review database indexing\"]")
                .build();

        when(candidateAnswerRepository.findBySessionIdOrderBySequenceNumberAsc(session.getId())).thenReturn(List.of(answer));
        when(answerEvaluationRepository.findByCandidateAnswerId(answer.getId())).thenReturn(Optional.of(eval));
        when(mediaEventRepository.findBySessionIdOrderByTimestampAsc(session.getId())).thenReturn(Collections.emptyList());
        when(interviewReportRepository.findBySessionId(session.getId())).thenReturn(Optional.empty());

        CandidateInterviewResultDto result = candidateInterviewService.completeInterview(session.getId(), candidateUser.getId());

        assertNotNull(result);
        assertTrue(result.getOverallScore() >= 70.0);
        assertEquals(100.0, result.getIntegrityScore()); // 0 media anomalies
        assertEquals(SessionStatus.COMPLETED, session.getStatus());
        verify(interviewReportRepository, times(1)).save(any(InterviewReport.class));
    }
}
