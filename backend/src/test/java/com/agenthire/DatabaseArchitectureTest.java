package com.agenthire;

import com.agenthire.entity.AnswerEvaluation;
import com.agenthire.entity.AuditLog;
import com.agenthire.entity.BehavioralEvaluation;
import com.agenthire.entity.Candidate;
import com.agenthire.entity.CandidateAnswer;
import com.agenthire.entity.CandidateAssignment;
import com.agenthire.entity.CodingSubmission;
import com.agenthire.entity.CodingTask;
import com.agenthire.entity.HumanReview;
import com.agenthire.entity.Instructor;
import com.agenthire.entity.Interview;
import com.agenthire.entity.InterviewAssignment;
import com.agenthire.entity.InterviewEngineer;
import com.agenthire.entity.InterviewEvent;
import com.agenthire.entity.InterviewReport;
import com.agenthire.entity.InterviewRound;
import com.agenthire.entity.InterviewScoringConfig;
import com.agenthire.entity.InterviewSession;
import com.agenthire.entity.LearningResult;
import com.agenthire.entity.LearningTask;
import com.agenthire.entity.MediaEvent;
import com.agenthire.entity.Notification;
import com.agenthire.entity.Question;
import com.agenthire.entity.ReportDelivery;
import com.agenthire.entity.Resume;
import com.agenthire.entity.ResumeAnalysis;
import com.agenthire.entity.User;
import com.agenthire.entity.enums.AssignmentStatus;
import com.agenthire.entity.enums.CandidateStatus;
import com.agenthire.entity.enums.Difficulty;
import com.agenthire.entity.enums.HumanDecision;
import com.agenthire.entity.enums.InterviewEventType;
import com.agenthire.entity.enums.InterviewRoundType;
import com.agenthire.entity.enums.InterviewStatus;
import com.agenthire.entity.enums.MediaEventType;
import com.agenthire.entity.enums.NotificationStatus;
import com.agenthire.entity.enums.NotificationType;
import com.agenthire.entity.enums.QuestionType;
import com.agenthire.entity.enums.SessionStatus;
import com.agenthire.entity.enums.UserRole;
import com.agenthire.repository.AnswerEvaluationRepository;
import com.agenthire.repository.AuditLogRepository;
import com.agenthire.repository.BehavioralEvaluationRepository;
import com.agenthire.repository.CandidateAnswerRepository;
import com.agenthire.repository.CandidateAssignmentRepository;
import com.agenthire.repository.CandidateRepository;
import com.agenthire.repository.CodingSubmissionRepository;
import com.agenthire.repository.CodingTaskRepository;
import com.agenthire.repository.HumanReviewRepository;
import com.agenthire.repository.InstructorRepository;
import com.agenthire.repository.InterviewAssignmentRepository;
import com.agenthire.repository.InterviewEngineerRepository;
import com.agenthire.repository.InterviewEventRepository;
import com.agenthire.repository.InterviewReportRepository;
import com.agenthire.repository.InterviewRepository;
import com.agenthire.repository.InterviewRoundRepository;
import com.agenthire.repository.InterviewScoringConfigRepository;
import com.agenthire.repository.InterviewSessionRepository;
import com.agenthire.repository.LearningResultRepository;
import com.agenthire.repository.LearningTaskRepository;
import com.agenthire.repository.MediaEventRepository;
import com.agenthire.repository.NotificationRepository;
import com.agenthire.repository.QuestionRepository;
import com.agenthire.repository.ReportDeliveryRepository;
import com.agenthire.repository.ResumeAnalysisRepository;
import com.agenthire.repository.ResumeRepository;
import com.agenthire.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class DatabaseArchitectureTest {

    @Autowired private UserRepository userRepository;
    @Autowired private CandidateRepository candidateRepository;
    @Autowired private InterviewEngineerRepository engineerRepository;
    @Autowired private InstructorRepository instructorRepository;
    @Autowired private ResumeRepository resumeRepository;
    @Autowired private ResumeAnalysisRepository resumeAnalysisRepository;
    @Autowired private CandidateAssignmentRepository candidateAssignmentRepository;
    @Autowired private InterviewRepository interviewRepository;
    @Autowired private InterviewScoringConfigRepository scoringConfigRepository;
    @Autowired private InterviewRoundRepository interviewRoundRepository;
    @Autowired private QuestionRepository questionRepository;
    @Autowired private InterviewAssignmentRepository interviewAssignmentRepository;
    @Autowired private InterviewSessionRepository interviewSessionRepository;
    @Autowired private CandidateAnswerRepository candidateAnswerRepository;
    @Autowired private AnswerEvaluationRepository answerEvaluationRepository;
    @Autowired private CodingTaskRepository codingTaskRepository;
    @Autowired private CodingSubmissionRepository codingSubmissionRepository;
    @Autowired private LearningTaskRepository learningTaskRepository;
    @Autowired private LearningResultRepository learningResultRepository;
    @Autowired private BehavioralEvaluationRepository behavioralEvaluationRepository;
    @Autowired private InterviewEventRepository interviewEventRepository;
    @Autowired private MediaEventRepository mediaEventRepository;
    @Autowired private InterviewReportRepository interviewReportRepository;
    @Autowired private HumanReviewRepository humanReviewRepository;
    @Autowired private ReportDeliveryRepository reportDeliveryRepository;
    @Autowired private NotificationRepository notificationRepository;
    @Autowired private AuditLogRepository auditLogRepository;

    @Test
    @DisplayName("Complete Recruitment Lifecycle: Persistence, Relationships & Business Integrity")
    void testCompleteDatabaseLifecycle() {
        // 1. Create Users with unique test emails
        User adminUser = userRepository.save(User.builder()
                .fullName("System Administrator Test")
                .email("test.admin@agenthire.ai")
                .passwordHash("$2a$10$encryptedadminhash")
                .role(UserRole.ADMIN)
                .enabled(true)
                .build());

        User engineerUser = userRepository.save(User.builder()
                .fullName("Sarah Jenkins Test")
                .email("test.sarah.ie@agenthire.ai")
                .passwordHash("$2a$10$encryptedengineerhash")
                .role(UserRole.INTERVIEW_ENGINEER)
                .enabled(true)
                .build());

        User instructorUser = userRepository.save(User.builder()
                .fullName("Dr. Alan Turing Test")
                .email("test.alan.inst@agenthire.ai")
                .passwordHash("$2a$10$encryptedinstructorhash")
                .role(UserRole.INSTRUCTOR)
                .enabled(true)
                .build());

        User candidateUser = userRepository.save(User.builder()
                .fullName("Hari Haran Test")
                .email("test.hari.candidate@agenthire.ai")
                .passwordHash("$2a$10$encryptedcandidatehash")
                .role(UserRole.CANDIDATE)
                .enabled(true)
                .build());

        assertNotNull(adminUser.getId());
        assertNotNull(adminUser.getCreatedAt());

        // 2. Profiles
        InterviewEngineer engineer = engineerRepository.save(InterviewEngineer.builder()
                .user(engineerUser)
                .employeeCode("ENG-TEST-101")
                .department("Technical Talent Operations")
                .active(true)
                .build());

        Instructor instructor = instructorRepository.save(Instructor.builder()
                .user(instructorUser)
                .employeeCode("INST-TEST-202")
                .department("Engineering Assessment Board")
                .specialization("Distributed Systems & JVM")
                .active(true)
                .build());

        Candidate candidate = candidateRepository.save(Candidate.builder()
                .user(candidateUser)
                .fullName("Hari Haran Test")
                .email("test.hari.candidate@agenthire.ai")
                .phone("+91-9876543210")
                .location("Bangalore, India")
                .college("National Institute of Technology")
                .degree("Bachelor of Technology")
                .department("Computer Science & Engineering")
                .graduationYear(2025)
                .cgpa(8.95)
                .experienceLevel("Fresher")
                .appliedRole("Java Backend Developer")
                .applicationId("APP-TEST-2026-9901")
                .source("Campus Placement")
                .status(CandidateStatus.PENDING_VERIFICATION)
                .engineerNotes("Top percentile candidate with strong Spring Boot projects.")
                .build());

        // 3. Resume & AI Resume Analysis
        Resume resume = resumeRepository.save(Resume.builder()
                .candidate(candidate)
                .fileName("Hari_Haran_Resume_2026.pdf")
                .filePath("/storage/resumes/2026/09/app_9901.pdf")
                .fileType("application/pdf")
                .fileSize(1048576L)
                .uploadedBy(engineerUser)
                .uploadedAt(Instant.now())
                .version(1)
                .isCurrent(true)
                .build());

        ResumeAnalysis resumeAnalysis = resumeAnalysisRepository.save(ResumeAnalysis.builder()
                .resume(resume)
                .summary("Demonstrated experience building Spring Boot microservices and MySQL schema design.")
                .skillsJson("[\"Java\", \"Spring Boot\", \"MySQL\", \"Docker\", \"REST APIs\"]")
                .frameworksJson("[\"Spring Boot 3\", \"Hibernate\"]")
                .databasesJson("[\"MySQL\", \"PostgreSQL\"]")
                .projectsJson("[{\"title\":\"AgentHire\",\"tech\":[\"Spring Boot\",\"React\"]}]")
                .analyzedAt(Instant.now())
                .analysisVersion("1.0.0")
                .build());

        assertNotNull(resumeAnalysis.getId());

        // 4. Verification & Routing: Engineer -> Instructor
        candidate.setStatus(CandidateStatus.VERIFIED);
        candidateRepository.save(candidate);

        CandidateAssignment candidateAssignment = candidateAssignmentRepository.save(CandidateAssignment.builder()
                .candidate(candidate)
                .interviewEngineer(engineer)
                .instructor(instructor)
                .appliedRole("Java Backend Developer")
                .interviewType("FULL_TECHNICAL_AND_CODING")
                .priority("HIGH")
                .engineerMessage("Candidate has verified Spring Boot expertise. Please probe transaction isolation and coding depth.")
                .status(AssignmentStatus.SENT)
                .assignedAt(Instant.now())
                .build());

        assertNotNull(candidateAssignment.getId());
        assertEquals(AssignmentStatus.SENT, candidateAssignment.getStatus());

        // 5. Instructor Accepts & Builds Interview
        candidateAssignment.setStatus(AssignmentStatus.ACCEPTED);
        candidateAssignment.setAcceptedAt(Instant.now());
        candidateAssignmentRepository.save(candidateAssignment);

        Interview interview = interviewRepository.save(Interview.builder()
                .title("Java Backend Software Engineer II Assessment")
                .description("Comprehensive evaluation covering core Java, Spring concurrency, SQL performance, and coding.")
                .targetRole("Java Backend Developer")
                .experienceLevel("Entry-to-Mid")
                .durationMinutes(75)
                .difficulty(Difficulty.ADAPTIVE)
                .status(InterviewStatus.PUBLISHED)
                .createdBy(instructor)
                .publishedAt(Instant.now())
                .build());

        InterviewScoringConfig scoringConfig = scoringConfigRepository.save(InterviewScoringConfig.builder()
                .interview(interview)
                .technicalWeight(25)
                .codingWeight(20)
                .problemSolvingWeight(15)
                .communicationWeight(10)
                .learningWeight(10)
                .behavioralWeight(10)
                .timeConstrainedWeight(10)
                .build());

        assertTrue(scoringConfig.isValidTotal(), "Scoring weights must sum to exactly 100%");

        InterviewRound round1 = interviewRoundRepository.save(InterviewRound.builder()
                .interview(interview)
                .roundType(InterviewRoundType.TECHNICAL)
                .name("Core Java & Concurrency")
                .sequenceNumber(1)
                .enabled(true)
                .durationMinutes(20)
                .difficulty(Difficulty.HARD)
                .weight(25)
                .instructions("Explain memory model, garbage collection, and deadlock avoidance.")
                .build());

        Question q1 = questionRepository.save(Question.builder()
                .interview(interview)
                .round(round1)
                .questionType(QuestionType.TEXT)
                .questionText("How does Spring manage declarative transactions with @Transactional under the hood using AOP?")
                .difficulty(Difficulty.MEDIUM)
                .expectedAnswerGuidance("Look for mentions of dynamic proxies, TransactionInterceptor, ThreadLocal PlatformTransactionManager, and rollback rules.")
                .timeLimitSeconds(180)
                .isAiGenerated(false)
                .createdBy(instructorUser)
                .build());

        // 6. Interview Assignment & Live Session Attempt
        InterviewAssignment interviewAssignment = interviewAssignmentRepository.save(InterviewAssignment.builder()
                .interview(interview)
                .candidate(candidate)
                .assignedBy(instructor)
                .scheduledAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(86400))
                .status(AssignmentStatus.SENT)
                .candidateInstructions("Ensure your camera and microphone are tested prior to starting.")
                .build());

        InterviewSession session = interviewSessionRepository.save(InterviewSession.builder()
                .interviewAssignment(interviewAssignment)
                .candidate(candidate)
                .interview(interview)
                .status(SessionStatus.IN_PROGRESS)
                .startedAt(Instant.now())
                .lastActivityAt(Instant.now())
                .currentRound(1)
                .remainingSeconds(4500)
                .sessionTokenHash("sha256_secured_session_token_hash")
                .build());

        // 7. Candidate Answers & AI Evaluates
        CandidateAnswer answer = candidateAnswerRepository.save(CandidateAnswer.builder()
                .session(session)
                .question(q1)
                .round(round1)
                .textAnswer("Spring uses CGLIB or JDK dynamic proxies to wrap the @Transactional method. It opens a connection on the PlatformTransactionManager and attaches it to the current thread.")
                .transcript("Spring uses dynamic proxies to intercept method calls...")
                .responseTimeSeconds(45)
                .submittedAt(Instant.now())
                .sequenceNumber(1)
                .build());

        AnswerEvaluation evaluation = answerEvaluationRepository.save(AnswerEvaluation.builder()
                .candidateAnswer(answer)
                .technicalScore(92.0)
                .correctnessScore(95.0)
                .depthScore(90.0)
                .clarityScore(88.0)
                .problemSolvingScore(85.0)
                .evidenceJson("{\"concept\":\"AOP Proxies\",\"mastery\":\"High\"}")
                .strengthsJson("[\"Accurately articulated proxy interception and ThreadLocal connection binding.\"]")
                .weaknessesJson("[\"Did not explicitly mention self-invocation pitfalls.\"]")
                .missingConceptsJson("[\"Transactional self-invocation bypass\"]")
                .recommendedNextAction("INCREASE_DIFFICULTY")
                .recommendedDifficulty(Difficulty.HARD)
                .evaluatedAt(Instant.now())
                .evaluationVersion("1.0.0")
                .build());

        assertNotNull(evaluation.getId());

        // 8. Coding Task & Submission
        CodingTask codingTask = codingTaskRepository.save(CodingTask.builder()
                .title("LRU Cache with TTL Eviction")
                .description("Design a data structure with O(1) get and put operations with background TTL cleanup.")
                .difficulty(Difficulty.HARD)
                .language("Java")
                .starterCode("class LRUCache {\n    public int get(int key) { return -1; }\n}")
                .constraints("1 <= capacity <= 1000")
                .examplesJson("[{\"input\":\"put(1,1)\",\"output\":\"null\"}]")
                .timeLimitSeconds(900)
                .createdBy(instructorUser)
                .build());

        CodingSubmission codingSubmission = codingSubmissionRepository.save(CodingSubmission.builder()
                .session(session)
                .task(codingTask)
                .language("Java")
                .sourceCode("class LRUCache { private LinkedHashMap<Integer, Integer> map; ... }")
                .submissionNumber(1)
                .testsPassed(12)
                .testsTotal(12)
                .executionTimeMs(145L)
                .memoryUsageKb(24500L)
                .status("ACCEPTED")
                .submittedAt(Instant.now())
                .build());

        assertEquals(12, codingSubmission.getTestsPassed());

        // 9. Learning Adaptability & Behavioral Evaluation
        LearningTask learningTask = learningTaskRepository.save(LearningTask.builder()
                .title("Count-Min Sketch Probabilistic Counting")
                .concept("Count-Min Sketch")
                .learningMaterial("A Count-Min Sketch uses d hash functions and a 2D array to estimate frequency with sub-linear space.")
                .learningTimeSeconds(180)
                .difficulty(Difficulty.HARD)
                .build());

        LearningResult learningResult = learningResultRepository.save(LearningResult.builder()
                .session(session)
                .learningTask(learningTask)
                .comprehensionScore(88.0)
                .applicationScore(90.0)
                .adaptationScore(85.0)
                .transferScore(87.0)
                .totalScore(87.5)
                .evidenceJson("{\"speed\":\"Fast\",\"understanding\":\"Deep\"}")
                .completedAt(Instant.now())
                .build());

        assertNotNull(learningResult.getId());

        BehavioralEvaluation behavioralEvaluation = behavioralEvaluationRepository.save(BehavioralEvaluation.builder()
                .session(session)
                .questionId(q1.getId())
                .communicationScore(90.0)
                .ownershipScore(92.0)
                .collaborationScore(88.0)
                .decisionMakingScore(85.0)
                .conflictHandlingScore(86.0)
                .evidenceJson("{\"rubric\":\"STAR\",\"result\":\"Demonstrated accountability\"}")
                .build());

        assertNotNull(behavioralEvaluation.getId());

        // 10. Compliance & Media Events
        interviewEventRepository.save(InterviewEvent.builder()
                .session(session)
                .eventType(InterviewEventType.SESSION_STARTED)
                .round(1)
                .timestamp(Instant.now())
                .metadataJson("{\"client\":\"Chrome 128\"}")
                .build());

        mediaEventRepository.save(MediaEvent.builder()
                .session(session)
                .eventType(MediaEventType.CAMERA_STARTED)
                .timestamp(Instant.now())
                .durationSeconds(4500)
                .metadataJson("{\"resolution\":\"1080p\"}")
                .build());

        // 11. Completion, Deterministic Report Generation
        session.setStatus(SessionStatus.COMPLETED);
        session.setEndedAt(Instant.now());
        interviewSessionRepository.save(session);

        InterviewReport report = interviewReportRepository.save(InterviewReport.builder()
                .session(session)
                .candidate(candidate)
                .interview(interview)
                .overallScore(89.4)
                .technicalScore(91.0)
                .codingScore(95.0)
                .problemSolvingScore(88.0)
                .communicationScore(89.0)
                .learningScore(87.5)
                .behavioralScore(88.2)
                .timeConstrainedScore(88.0)
                .strengthsJson("[\"Superb core Java architecture\",\"Flawless O(1) coding submission\"]")
                .improvementAreasJson("[\"Refine distributed locking edge cases\"]")
                .aiRecommendation("STRONG_HIRE")
                .generatedAt(Instant.now())
                .reportVersion("1.0.0")
                .build());

        assertNotNull(report.getId());

        // 12. Engineer Reviews & Delivers to Instructor
        ReportDelivery reportDelivery = reportDeliveryRepository.save(ReportDelivery.builder()
                .report(report)
                .sentBy(engineer)
                .sentTo(instructor)
                .sentAt(Instant.now())
                .status("DELIVERED")
                .message("Technical events clean, zero integrity flags, excellent scoring. Ready for your final decision.")
                .build());

        assertNotNull(reportDelivery.getId());

        // 13. Instructor Reviews & Makes Final Human Decision
        HumanReview humanReview = humanReviewRepository.save(HumanReview.builder()
                .report(report)
                .instructor(instructor)
                .decision(HumanDecision.SHORTLIST)
                .comments("Outstanding depth on Spring transaction boundaries and concurrency. Recommend for Team Architecture round.")
                .reviewedAt(Instant.now())
                .build());

        assertEquals(HumanDecision.SHORTLIST, humanReview.getDecision());

        // 14. Notifications & Audit Logs
        Notification notification = notificationRepository.save(Notification.builder()
                .recipient(candidateUser)
                .type(NotificationType.REPORT_READY)
                .title("Interview Assessment Complete")
                .message("Your Java Backend assessment results have been compiled and reviewed.")
                .relatedEntityType("INTERVIEW_REPORT")
                .relatedEntityId(report.getId())
                .status(NotificationStatus.UNREAD)
                .build());

        assertNotNull(notification.getId());

        AuditLog auditLog = auditLogRepository.save(AuditLog.builder()
                .user(instructorUser)
                .action("HUMAN_DECISION_SUBMITTED")
                .entityType("INTERVIEW_REPORT")
                .entityId(report.getId())
                .description("Instructor Dr. Alan Turing finalized human review decision as SHORTLIST.")
                .ipAddress("192.168.1.50")
                .build());

        assertNotNull(auditLog.getId());

        // 15. Verify Repositories and Queries
        List<Candidate> verifiedCandidates = candidateRepository.findByStatus(CandidateStatus.VERIFIED);
        assertFalse(verifiedCandidates.isEmpty());

        Optional<ResumeAnalysis> fetchedAnalysis = resumeAnalysisRepository.findByResumeId(resume.getId());
        assertTrue(fetchedAnalysis.isPresent());

        Optional<InterviewReport> fetchedReport = interviewReportRepository.findBySessionId(session.getId());
        assertTrue(fetchedReport.isPresent());
        assertEquals(89.4, fetchedReport.get().getOverallScore());
    }
}
