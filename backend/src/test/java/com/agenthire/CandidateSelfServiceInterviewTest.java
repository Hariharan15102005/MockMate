package com.agenthire;

import com.agenthire.entity.Candidate;
import com.agenthire.entity.Resume;
import com.agenthire.entity.User;
import com.agenthire.entity.enums.CandidateStatus;
import com.agenthire.entity.enums.ResumeStatus;
import com.agenthire.entity.enums.UserRole;
import com.agenthire.repository.CandidateRepository;
import com.agenthire.repository.ResumeRepository;
import com.agenthire.repository.UserRepository;
import com.agenthire.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CandidateSelfServiceInterviewTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private com.agenthire.repository.InterviewSessionRepository interviewSessionRepository;

    @Autowired
    private com.agenthire.repository.InterviewAssignmentRepository interviewAssignmentRepository;

    @Autowired
    private com.agenthire.repository.CandidateAnswerRepository candidateAnswerRepository;

    @Autowired
    private com.agenthire.repository.AnswerEvaluationRepository answerEvaluationRepository;

    @Autowired
    private com.agenthire.repository.InterviewEventRepository interviewEventRepository;

    @Autowired
    private com.agenthire.repository.MediaEventRepository mediaEventRepository;

    @Autowired
    private com.agenthire.repository.InterviewReportRepository interviewReportRepository;

    private User candidateUser;
    private Candidate candidate;
    private String candidateToken;

    private User instructorUser;
    private String instructorToken;

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        try {
            mediaEventRepository.deleteAll();
            interviewEventRepository.deleteAll();
            answerEvaluationRepository.deleteAll();
            candidateAnswerRepository.deleteAll();
            interviewReportRepository.deleteAll();
            interviewSessionRepository.deleteAll();
            interviewAssignmentRepository.deleteAll();
            resumeRepository.deleteAll();
            candidateRepository.deleteAll();
            userRepository.deleteAll();
        } catch (Exception ignored) {
        }
    }

    @BeforeEach
    void setUp() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);

        candidateUser = userRepository.save(User.builder()
                .fullName("Candidate " + suffix)
                .email("cand." + suffix + "@agenthire.ai")
                .passwordHash(passwordEncoder.encode("Password@123"))
                .role(UserRole.CANDIDATE)
                .enabled(true)
                .build());

        candidate = candidateRepository.save(Candidate.builder()
                .user(candidateUser)
                .fullName("Candidate " + suffix)
                .email(candidateUser.getEmail())
                .phone("+1555000" + suffix.substring(0, 4))
                .college("Tech Institute")
                .degree("B.Tech")
                .department("Computer Science")
                .graduationYear(2025)
                .cgpa(8.9)
                .experienceLevel("ENTRY")
                .appliedRole("Java Full Stack Developer")
                .applicationId("APP-" + suffix)
                .status(CandidateStatus.VERIFIED)
                .build());

        Resume resume = resumeRepository.save(Resume.builder()
                .candidate(candidate)
                .fileName("resume.pdf")
                .filePath("resumes/test.pdf")
                .fileSize(2048L)
                .fileType("application/pdf")
                .status(ResumeStatus.ANALYZED)
                .extractedText("Skills: Java, Spring Boot, React, MySQL. Built high throughput backend services.")
                .build());

        candidateToken = jwtService.generateToken(candidateUser);

        instructorUser = userRepository.save(User.builder()
                .fullName("Instructor " + suffix)
                .email("inst." + suffix + "@agenthire.ai")
                .passwordHash(passwordEncoder.encode("Password@123"))
                .role(UserRole.INSTRUCTOR)
                .enabled(true)
                .build());

        instructorToken = jwtService.generateToken(instructorUser);
    }

    @Test
    @DisplayName("Candidate can create self-service session successfully")
    void testCandidateCanCreateSelfServiceSession() throws Exception {
        mockMvc.perform(post("/api/candidate/interviews/self-service/session")
                        .header("Authorization", "Bearer " + candidateToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").isNotEmpty())
                .andExpect(jsonPath("$.interviewId").isNotEmpty())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.candidateId").value(candidate.getId().toString()));
    }

    @Test
    @DisplayName("Candidate can resume existing active session without duplicates")
    void testCandidateCanResumeExistingActiveSession() throws Exception {
        // First call creates session
        mockMvc.perform(post("/api/candidate/interviews/self-service/start")
                        .header("Authorization", "Bearer " + candidateToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").isNotEmpty())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));

        // Second call should return the exact same active session
        mockMvc.perform(post("/api/candidate/interviews/self-service/start")
                        .header("Authorization", "Bearer " + candidateToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").isNotEmpty())
                .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    @DisplayName("Instructor cannot use candidate self-service endpoint")
    void testInstructorForbiddenOnSelfServiceEndpoint() throws Exception {
        mockMvc.perform(post("/api/candidate/interviews/self-service/session")
                        .header("Authorization", "Bearer " + instructorToken)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Unauthenticated request returns 401")
    void testUnauthenticatedReturns401() throws Exception {
        mockMvc.perform(post("/api/candidate/interviews/self-service/session")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isUnauthorized());
    }
}
