package com.agenthire;

import com.agenthire.dto.interview.CreateInterviewRequest;
import com.agenthire.dto.interview.InterviewRoundRequest;
import com.agenthire.dto.interview.QuestionRequest;
import com.agenthire.dto.interview.ScoringConfigRequest;
import com.agenthire.dto.interview.UpdateInterviewRequest;
import com.agenthire.entity.AuditLog;
import com.agenthire.entity.Candidate;
import com.agenthire.entity.CandidateAssignment;
import com.agenthire.entity.Instructor;
import com.agenthire.entity.Interview;
import com.agenthire.entity.InterviewEngineer;
import com.agenthire.entity.User;
import com.agenthire.entity.enums.AssignmentStatus;
import com.agenthire.entity.enums.CandidateStatus;
import com.agenthire.entity.enums.Difficulty;
import com.agenthire.entity.enums.InterviewRoundType;
import com.agenthire.entity.enums.InterviewStatus;
import com.agenthire.entity.enums.QuestionType;
import com.agenthire.entity.enums.UserRole;
import com.agenthire.repository.AuditLogRepository;
import com.agenthire.repository.CandidateAssignmentRepository;
import com.agenthire.repository.CandidateRepository;
import com.agenthire.repository.InstructorRepository;
import com.agenthire.repository.InterviewEngineerRepository;
import com.agenthire.repository.InterviewRepository;
import com.agenthire.repository.InterviewRoundRepository;
import com.agenthire.repository.InterviewScoringConfigRepository;
import com.agenthire.repository.NotificationRepository;
import com.agenthire.repository.QuestionRepository;
import com.agenthire.repository.ResumeRepository;
import com.agenthire.repository.UserRepository;
import com.agenthire.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class InterviewBuilderWorkflowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private CandidateAssignmentRepository assignmentRepository;

    @Autowired
    private InstructorRepository instructorRepository;

    @Autowired
    private InterviewEngineerRepository engineerRepository;

    @Autowired
    private InterviewRepository interviewRepository;

    @Autowired
    private InterviewRoundRepository roundRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private InterviewScoringConfigRepository scoringConfigRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User instructorUser1;
    private User instructorUser2;
    private User engineerUser;
    private User candidateUser;
    private User adminUser;

    private Instructor instructor1;
    private Instructor instructor2;
    private InterviewEngineer engineer;

    private String instructor1Token;
    private String instructor2Token;
    private String engineerToken;
    private String candidateToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        questionRepository.deleteAll();
        roundRepository.deleteAll();
        scoringConfigRepository.deleteAll();
        interviewRepository.deleteAll();
        assignmentRepository.deleteAll();
        notificationRepository.deleteAll();
        auditLogRepository.deleteAll();
        resumeRepository.deleteAll();
        candidateRepository.deleteAll();
        instructorRepository.deleteAll();
        engineerRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Create Instructor 1
        instructorUser1 = userRepository.save(User.builder()
                .fullName("Dr. Donald Knuth")
                .email("donald.knuth@agenthire.ai")
                .passwordHash(passwordEncoder.encode("Password@123"))
                .role(UserRole.INSTRUCTOR)
                .enabled(true)
                .build());

        instructor1 = instructorRepository.save(Instructor.builder()
                .user(instructorUser1)
                .employeeCode("INST-KNUTH")
                .department("Computer Systems")
                .specialization("Algorithms & Systems")
                .active(true)
                .build());

        // 2. Create Instructor 2
        instructorUser2 = userRepository.save(User.builder()
                .fullName("Dr. Barbara Liskov")
                .email("barbara.liskov@agenthire.ai")
                .passwordHash(passwordEncoder.encode("Password@123"))
                .role(UserRole.INSTRUCTOR)
                .enabled(true)
                .build());

        instructor2 = instructorRepository.save(Instructor.builder()
                .user(instructorUser2)
                .employeeCode("INST-LISKOV")
                .department("Software Architecture")
                .specialization("Type Systems & Distributed Computing")
                .active(true)
                .build());

        // 3. Create Engineer, Candidate & Admin
        engineerUser = userRepository.save(User.builder()
                .fullName("Linus Torvalds")
                .email("linus.engineer@agenthire.ai")
                .passwordHash(passwordEncoder.encode("Password@123"))
                .role(UserRole.INTERVIEW_ENGINEER)
                .enabled(true)
                .build());

        engineer = engineerRepository.save(InterviewEngineer.builder()
                .user(engineerUser)
                .employeeCode("ENG-LINUS")
                .department("Kernel & Intake")
                .active(true)
                .build());

        candidateUser = userRepository.save(User.builder()
                .fullName("Carol Candidate")
                .email("carol.candidate@agenthire.ai")
                .passwordHash(passwordEncoder.encode("Password@123"))
                .role(UserRole.CANDIDATE)
                .enabled(true)
                .build());

        adminUser = userRepository.save(User.builder()
                .fullName("Root Admin")
                .email("root.admin@agenthire.ai")
                .passwordHash(passwordEncoder.encode("Password@123"))
                .role(UserRole.ADMIN)
                .enabled(true)
                .build());

        // Tokens
        instructor1Token = jwtService.generateToken(instructorUser1);
        instructor2Token = jwtService.generateToken(instructorUser2);
        engineerToken = jwtService.generateToken(engineerUser);
        candidateToken = jwtService.generateToken(candidateUser);
        adminToken = jwtService.generateToken(adminUser);
    }

    private CandidateAssignment createAcceptedAssignment(String candidateName, String email, String appId, Instructor instructor) {
        Candidate candidate = candidateRepository.save(Candidate.builder()
                .fullName(candidateName)
                .email(email)
                .phone("+15559876543")
                .college("Stanford University")
                .degree("M.S.")
                .department("Computer Science")
                .graduationYear(2025)
                .cgpa(9.4)
                .experienceLevel("MID")
                .appliedRole("Distributed Systems Engineer")
                .applicationId(appId)
                .status(CandidateStatus.ACCEPTED_BY_INSTRUCTOR)
                .verifiedBy(engineerUser)
                .verifiedAt(Instant.now())
                .build());

        CandidateAssignment assignment = CandidateAssignment.builder()
                .candidate(candidate)
                .interviewEngineer(engineer)
                .instructor(instructor)
                .appliedRole(candidate.getAppliedRole())
                .interviewType("TECHNICAL")
                .priority("HIGH")
                .engineerMessage("Strong distributed consensus background.")
                .status(AssignmentStatus.ACCEPTED)
                .assignedAt(Instant.now())
                .acceptedAt(Instant.now())
                .acceptedBy(instructor.getUser())
                .build();

        return assignmentRepository.save(assignment);
    }

    @Test
    @DisplayName("Should successfully create an interview blueprint draft for an accepted candidate assignment")
    void testCreateInterviewDraftSuccess() throws Exception {
        CandidateAssignment assignment = createAcceptedAssignment("Grace Hopper", "grace@test.com", "APP-IB-01", instructor1);

        CreateInterviewRequest request = CreateInterviewRequest.builder()
                .candidateAssignmentId(assignment.getId())
                .title("Advanced Distributed Systems Evaluation")
                .description("In-depth evaluation covering consensus algorithms, Raft, and Java concurrency.")
                .targetRole("Staff Systems Engineer")
                .durationMinutes(75)
                .difficulty(Difficulty.HARD)
                .isAdaptive(true)
                .build();

        mockMvc.perform(post("/api/instructor/interviews")
                        .header("Authorization", "Bearer " + instructor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.title").value("Advanced Distributed Systems Evaluation"))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.durationMinutes").value(75))
                .andExpect(jsonPath("$.difficulty").value("HARD"))
                .andExpect(jsonPath("$.isAdaptive").value(true))
                .andExpect(jsonPath("$.candidate.fullName").value("Grace Hopper"))
                .andExpect(jsonPath("$.rounds").isArray())
                .andExpect(jsonPath("$.scoringConfig.isValidTotal").value(true));

        // Verify Audit Log
        List<AuditLog> auditLogs = auditLogRepository.findByUserIdOrderByCreatedAtDesc(instructorUser1.getId());
        assertFalse(auditLogs.isEmpty());
        assertEquals("INTERVIEW_CREATED", auditLogs.get(0).getAction());
    }

    @Test
    @DisplayName("Should reject interview creation if candidate assignment is not in ACCEPTED status (e.g. SENT)")
    void testCreateInterviewNonAcceptedAssignmentRejected() throws Exception {
        Candidate candidate = candidateRepository.save(Candidate.builder()
                .fullName("Alan Kay")
                .email("alan.kay@test.com")
                .appliedRole("Smalltalk Engineer")
                .applicationId("APP-IB-02")
                .status(CandidateStatus.SENT_TO_INSTRUCTOR)
                .build());

        CandidateAssignment sentAssignment = assignmentRepository.save(CandidateAssignment.builder()
                .candidate(candidate)
                .interviewEngineer(engineer)
                .instructor(instructor1)
                .appliedRole(candidate.getAppliedRole())
                .status(AssignmentStatus.SENT)
                .assignedAt(Instant.now())
                .build());

        CreateInterviewRequest request = CreateInterviewRequest.builder()
                .candidateAssignmentId(sentAssignment.getId())
                .title("OO Paradigm & System Architecture")
                .build();

        mockMvc.perform(post("/api/instructor/interviews")
                        .header("Authorization", "Bearer " + instructor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("INVALID_STATUS_TRANSITION"));
    }

    @Test
    @DisplayName("Should successfully update interview draft blueprint (title, rounds, questions, and scoring)")
    void testUpdateInterviewDraftSuccess() throws Exception {
        CandidateAssignment assignment = createAcceptedAssignment("Tim Berners-Lee", "tim@test.com", "APP-IB-03", instructor1);

        CreateInterviewRequest createReq = CreateInterviewRequest.builder()
                .candidateAssignmentId(assignment.getId())
                .title("Web Architecture Assessment")
                .durationMinutes(60)
                .build();

        String createResponseStr = mockMvc.perform(post("/api/instructor/interviews")
                        .header("Authorization", "Bearer " + instructor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        UUID interviewId = UUID.fromString(objectMapper.readTree(createResponseStr).get("id").asText());

        // Update blueprint with custom rounds and questions
        UpdateInterviewRequest updateReq = UpdateInterviewRequest.builder()
                .title("Web Architecture & HTTP Protocols Evaluation")
                .description("Updated blueprint with dedicated caching and protocol design round.")
                .durationMinutes(90)
                .difficulty(Difficulty.HARD)
                .isAdaptive(true)
                .rounds(List.of(
                        InterviewRoundRequest.builder()
                                .roundType(InterviewRoundType.INTRODUCTION)
                                .name("Architectural Background")
                                .sequenceNumber(1)
                                .durationMinutes(15)
                                .questionCount(1)
                                .difficulty(Difficulty.EASY)
                                .questions(List.of(
                                        QuestionRequest.builder()
                                                .questionType(QuestionType.TEXT)
                                                .questionText("Describe your experience scaling distributed HTTP caches.")
                                                .difficulty(Difficulty.MEDIUM)
                                                .build()
                                ))
                                .build(),
                        InterviewRoundRequest.builder()
                                .roundType(InterviewRoundType.CODING)
                                .name("Concurrent LRU Cache Implementation")
                                .sequenceNumber(2)
                                .durationMinutes(45)
                                .questionCount(1)
                                .difficulty(Difficulty.HARD)
                                .questions(List.of(
                                        QuestionRequest.builder()
                                                .questionType(QuestionType.CODING)
                                                .questionText("Implement a thread-safe LRU Cache in Java with O(1) get and put.")
                                                .difficulty(Difficulty.HARD)
                                                .codingLanguage("Java")
                                                .sampleInput("capacity = 2, put(1, 1), put(2, 2), get(1)")
                                                .sampleOutput("1")
                                                .build()
                                ))
                                .build(),
                        InterviewRoundRequest.builder()
                                .roundType(InterviewRoundType.SYSTEM_DESIGN)
                                .name("Global CDN Architecture")
                                .sequenceNumber(3)
                                .durationMinutes(30)
                                .questionCount(1)
                                .difficulty(Difficulty.HARD)
                                .build()
                ))
                .scoringConfig(ScoringConfigRequest.builder()
                        .technicalWeight(30)
                        .codingWeight(30)
                        .problemSolvingWeight(20)
                        .communicationWeight(10)
                        .learningWeight(5)
                        .behavioralWeight(5)
                        .timeConstrainedWeight(0)
                        .build())
                .build();

        mockMvc.perform(put("/api/instructor/interviews/" + interviewId)
                        .header("Authorization", "Bearer " + instructor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Web Architecture & HTTP Protocols Evaluation"))
                .andExpect(jsonPath("$.durationMinutes").value(90))
                .andExpect(jsonPath("$.rounds.length()").value(3))
                .andExpect(jsonPath("$.rounds[1].questions[0].codingLanguage").value("Java"))
                .andExpect(jsonPath("$.scoringConfig.technicalWeight").value(30))
                .andExpect(jsonPath("$.scoringConfig.isValidTotal").value(true));

        // Verify Audit Log
        List<AuditLog> auditLogs = auditLogRepository.findByUserIdOrderByCreatedAtDesc(instructorUser1.getId());
        assertEquals("INTERVIEW_UPDATED", auditLogs.get(0).getAction());
    }

    @Test
    @DisplayName("Should successfully publish valid interview blueprint and lock it from further modification")
    void testPublishInterviewSuccessAndImmutability() throws Exception {
        CandidateAssignment assignment = createAcceptedAssignment("Claude Shannon", "shannon@test.com", "APP-IB-04", instructor1);

        CreateInterviewRequest createReq = CreateInterviewRequest.builder()
                .candidateAssignmentId(assignment.getId())
                .title("Information Theory & Cryptography Evaluation")
                .durationMinutes(60)
                .build();

        String createResponseStr = mockMvc.perform(post("/api/instructor/interviews")
                        .header("Authorization", "Bearer " + instructor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        UUID interviewId = UUID.fromString(objectMapper.readTree(createResponseStr).get("id").asText());

        // 1. Publish the blueprint
        mockMvc.perform(post("/api/instructor/interviews/" + interviewId + "/publish")
                        .header("Authorization", "Bearer " + instructor1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"))
                .andExpect(jsonPath("$.publishedAt").isNotEmpty());

        // Verify in DB
        Interview publishedInDb = interviewRepository.findById(interviewId).orElseThrow();
        assertEquals(InterviewStatus.PUBLISHED, publishedInDb.getStatus());
        assertNotNull(publishedInDb.getPublishedAt());

        // Verify Audit Log
        List<AuditLog> auditLogs = auditLogRepository.findByUserIdOrderByCreatedAtDesc(instructorUser1.getId());
        assertEquals("INTERVIEW_PUBLISHED", auditLogs.get(0).getAction());

        // 2. Attempt to modify PUBLISHED interview -> 409 Conflict
        UpdateInterviewRequest updateReq = UpdateInterviewRequest.builder()
                .title("Unauthorized Modification of Published Blueprint")
                .build();

        mockMvc.perform(put("/api/instructor/interviews/" + interviewId)
                        .header("Authorization", "Bearer " + instructor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("INVALID_STATUS_TRANSITION"));

        // 3. Attempt to publish again -> 409 Conflict
        mockMvc.perform(post("/api/instructor/interviews/" + interviewId + "/publish")
                        .header("Authorization", "Bearer " + instructor1Token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("INVALID_STATUS_TRANSITION"));
    }

    @Test
    @DisplayName("Should reject publication if scoring configuration weights do not total 100%")
    void testPublishRejectsInvalidScoringWeights() throws Exception {
        CandidateAssignment assignment = createAcceptedAssignment("John von Neumann", "neumann@test.com", "APP-IB-05", instructor1);

        CreateInterviewRequest createReq = CreateInterviewRequest.builder()
                .candidateAssignmentId(assignment.getId())
                .title("High Performance Computing Blueprint")
                .durationMinutes(60)
                .build();

        String createResponseStr = mockMvc.perform(post("/api/instructor/interviews")
                        .header("Authorization", "Bearer " + instructor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        UUID interviewId = UUID.fromString(objectMapper.readTree(createResponseStr).get("id").asText());

        // Update with invalid scoring config (totals 80%)
        UpdateInterviewRequest updateReq = UpdateInterviewRequest.builder()
                .title("High Performance Computing Blueprint")
                .durationMinutes(60)
                .scoringConfig(ScoringConfigRequest.builder()
                        .technicalWeight(40)
                        .codingWeight(40)
                        .problemSolvingWeight(0)
                        .communicationWeight(0)
                        .learningWeight(0)
                        .behavioralWeight(0)
                        .timeConstrainedWeight(0) // total = 80% != 100%
                        .build())
                .build();

        mockMvc.perform(put("/api/instructor/interviews/" + interviewId)
                        .header("Authorization", "Bearer " + instructor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk());

        // Attempt to publish -> 400 Bad Request
        mockMvc.perform(post("/api/instructor/interviews/" + interviewId + "/publish")
                        .header("Authorization", "Bearer " + instructor1Token))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should enforce strict Instructor Data Isolation (Instructor 2 cannot view, update, or publish Instructor 1's interview)")
    void testInstructorDataIsolation() throws Exception {
        CandidateAssignment assignment = createAcceptedAssignment("Ada Lovelace", "ada.ib@test.com", "APP-IB-06", instructor1);

        CreateInterviewRequest createReq = CreateInterviewRequest.builder()
                .candidateAssignmentId(assignment.getId())
                .title("Analytical Engine Architecture")
                .durationMinutes(60)
                .build();

        String createResponseStr = mockMvc.perform(post("/api/instructor/interviews")
                        .header("Authorization", "Bearer " + instructor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        UUID interviewId = UUID.fromString(objectMapper.readTree(createResponseStr).get("id").asText());

        // Instructor 2 attempts to get Instructor 1's interview -> 404
        mockMvc.perform(get("/api/instructor/interviews/" + interviewId)
                        .header("Authorization", "Bearer " + instructor2Token))
                .andExpect(status().isNotFound());

        // Instructor 2 attempts to update Instructor 1's interview -> 404
        UpdateInterviewRequest updateReq = UpdateInterviewRequest.builder()
                .title("Snoop Update Attempt")
                .build();

        mockMvc.perform(put("/api/instructor/interviews/" + interviewId)
                        .header("Authorization", "Bearer " + instructor2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isNotFound());

        // Instructor 2 attempts to publish Instructor 1's interview -> 404
        mockMvc.perform(post("/api/instructor/interviews/" + interviewId + "/publish")
                        .header("Authorization", "Bearer " + instructor2Token))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should enforce RBAC on interview builder endpoints (Engineer, Candidate, Admin -> 403, No Auth -> 401)")
    void testRbacOnInterviewBuilderEndpoints() throws Exception {
        CandidateAssignment assignment = createAcceptedAssignment("Radia Perlman", "radia@test.com", "APP-IB-07", instructor1);

        CreateInterviewRequest createReq = CreateInterviewRequest.builder()
                .candidateAssignmentId(assignment.getId())
                .title("Spanning Tree Protocol Design")
                .build();

        // Engineer -> 403
        mockMvc.perform(post("/api/instructor/interviews")
                        .header("Authorization", "Bearer " + engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isForbidden());

        // Candidate -> 403
        mockMvc.perform(post("/api/instructor/interviews")
                        .header("Authorization", "Bearer " + candidateToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isForbidden());

        // Admin -> 403
        mockMvc.perform(post("/api/instructor/interviews")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isForbidden());

        // Unauthenticated -> 401
        mockMvc.perform(post("/api/instructor/interviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should return accepted candidate assignments ready for interview configuration")
    void testGetAcceptedAssignmentsEndpoint() throws Exception {
        createAcceptedAssignment("Candidate A", "ca@test.com", "APP-AC-01", instructor1);
        createAcceptedAssignment("Candidate B", "cb@test.com", "APP-AC-02", instructor1);

        mockMvc.perform(get("/api/instructor/interviews/candidates/accepted")
                        .header("Authorization", "Bearer " + instructor1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].candidateName").isNotEmpty());
    }
}
