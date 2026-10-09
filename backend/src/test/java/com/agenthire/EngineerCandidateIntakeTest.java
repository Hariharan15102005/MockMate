package com.agenthire;

import com.agenthire.dto.candidate.CandidateCreateRequest;
import com.agenthire.dto.candidate.CandidateUpdateRequest;
import com.agenthire.entity.AuditLog;
import com.agenthire.entity.Candidate;
import com.agenthire.entity.User;
import com.agenthire.entity.enums.CandidateStatus;
import com.agenthire.entity.enums.UserRole;
import com.agenthire.repository.AuditLogRepository;
import com.agenthire.repository.CandidateRepository;
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
public class EngineerCandidateIntakeTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String engineerToken;
    private String adminToken;
    private String instructorToken;
    private String candidateToken;
    private User engineerUser;

    @BeforeEach
    void setUp() {
        candidateRepository.deleteAll();

        engineerUser = getOrCreateTestUser("intake.engineer@agenthire.ai", "Intake Engineer", UserRole.INTERVIEW_ENGINEER);
        User adminUser = getOrCreateTestUser("intake.admin@agenthire.ai", "Intake Admin", UserRole.ADMIN);
        User instructorUser = getOrCreateTestUser("intake.instructor@agenthire.ai", "Intake Instructor", UserRole.INSTRUCTOR);
        User candidateUser = getOrCreateTestUser("intake.candidate@agenthire.ai", "Intake Candidate", UserRole.CANDIDATE);

        engineerToken = "Bearer " + jwtService.generateToken(engineerUser);
        adminToken = "Bearer " + jwtService.generateToken(adminUser);
        instructorToken = "Bearer " + jwtService.generateToken(instructorUser);
        candidateToken = "Bearer " + jwtService.generateToken(candidateUser);
    }

    private User getOrCreateTestUser(String email, String fullName, UserRole role) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User user = User.builder()
                    .fullName(fullName)
                    .email(email)
                    .passwordHash(passwordEncoder.encode("Password123!@#"))
                    .role(role)
                    .enabled(true)
                    .build();
            return userRepository.save(user);
        });
    }

    private CandidateCreateRequest buildSampleRequest(String appId, String email) {
        return CandidateCreateRequest.builder()
                .fullName("Alex Chen")
                .email(email)
                .phone("+91-9876543210")
                .location("Bengaluru, India")
                .college("National Institute of Technology")
                .degree("B.Tech")
                .department("Computer Science & Engineering")
                .graduationYear(2026)
                .cgpa(8.85)
                .experienceLevel("FRESHER")
                .appliedRole("Java Backend Engineer")
                .applicationId(appId)
                .source("CAMPUS")
                .engineerNotes("Excellent grasp of data structures and Spring Boot.")
                .build();
    }

    @Test
    @DisplayName("Create candidate successfully as Interview Engineer")
    void testCreateCandidateSuccess() throws Exception {
        CandidateCreateRequest request = buildSampleRequest("APP-2026-101", "alex.chen@example.com");

        mockMvc.perform(post("/api/engineer/candidates")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.applicationId").value("APP-2026-101"))
                .andExpect(jsonPath("$.fullName").value("Alex Chen"))
                .andExpect(jsonPath("$.email").value("alex.chen@example.com"))
                .andExpect(jsonPath("$.status").value("PENDING_VERIFICATION"))
                .andExpect(jsonPath("$.cgpa").value(8.85));

        // Verify database persistence
        assertTrue(candidateRepository.existsByApplicationId("APP-2026-101"));

        // Verify audit log record
        List<AuditLog> logs = auditLogRepository.findAll();
        boolean auditFound = logs.stream().anyMatch(l -> "CANDIDATE_CREATED".equals(l.getAction()));
        assertTrue(auditFound, "Expected CANDIDATE_CREATED audit log to be persisted");
    }

    @Test
    @DisplayName("Create candidate with duplicate application ID returns 409 Conflict")
    void testDuplicateApplicationId() throws Exception {
        CandidateCreateRequest req1 = buildSampleRequest("APP-DUP-001", "first@example.com");
        CandidateCreateRequest req2 = buildSampleRequest("APP-DUP-001", "second@example.com");

        // First creation succeeds
        mockMvc.perform(post("/api/engineer/candidates")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated());

        // Second creation with duplicate application ID fails with 409
        mockMvc.perform(post("/api/engineer/candidates")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("DUPLICATE_RESOURCE"));
    }

    @Test
    @DisplayName("Create candidate validation: invalid email, invalid CGPA, missing required field")
    void testCandidateValidationErrors() throws Exception {
        // Missing fullName & invalid email
        CandidateCreateRequest invalidReq = CandidateCreateRequest.builder()
                .email("invalid-email")
                .phone("1234567")
                .location("Chennai")
                .college("College")
                .degree("B.E.")
                .department("IT")
                .graduationYear(2025)
                .cgpa(11.5) // CGPA > 10.0
                .appliedRole("Developer")
                .applicationId("APP-INVALID-1")
                .build();

        mockMvc.perform(post("/api/engineer/candidates")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.validationErrors.fullName").exists())
                .andExpect(jsonPath("$.validationErrors.email").exists())
                .andExpect(jsonPath("$.validationErrors.cgpa").exists());
    }

    @Test
    @DisplayName("Create candidate validation: invalid graduation year (< 1950)")
    void testInvalidGraduationYear() throws Exception {
        CandidateCreateRequest req = buildSampleRequest("APP-YEAR-001", "year@example.com");
        req.setGraduationYear(1800);

        mockMvc.perform(post("/api/engineer/candidates")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.validationErrors.graduationYear").exists());
    }

    @Test
    @DisplayName("Role-Based Access Control: Admin, Instructor, Candidate, and Unauthenticated are rejected")
    void testRbacRestrictions() throws Exception {
        CandidateCreateRequest request = buildSampleRequest("APP-RBAC-001", "rbac@example.com");
        String json = objectMapper.writeValueAsString(request);

        // Admin -> 403
        mockMvc.perform(post("/api/engineer/candidates")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isForbidden());

        // Instructor -> 403
        mockMvc.perform(post("/api/engineer/candidates")
                        .header("Authorization", instructorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isForbidden());

        // Candidate -> 403
        mockMvc.perform(post("/api/engineer/candidates")
                        .header("Authorization", candidateToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isForbidden());

        // Unauthenticated -> 401
        mockMvc.perform(post("/api/engineer/candidates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Get candidate list with search & pagination")
    void testGetCandidateListAndSearch() throws Exception {
        Candidate c1 = candidateRepository.save(Candidate.builder()
                .fullName("Sarah Connor")
                .email("sarah@example.com")
                .phone("9876543210")
                .location("Chennai")
                .college("Anna University")
                .degree("B.E.")
                .department("CSE")
                .graduationYear(2025)
                .cgpa(9.1)
                .experienceLevel("FRESHER")
                .appliedRole("Frontend Specialist")
                .applicationId("APP-SEARCH-01")
                .status(CandidateStatus.PENDING_VERIFICATION)
                .build());

        Candidate c2 = candidateRepository.save(Candidate.builder()
                .fullName("David Bowman")
                .email("david@example.com")
                .phone("9876543211")
                .location("Bengaluru")
                .college("IIT Madras")
                .degree("M.Tech")
                .department("AI & DS")
                .graduationYear(2024)
                .cgpa(9.5)
                .experienceLevel("EXPERIENCED")
                .appliedRole("ML Engineer")
                .applicationId("APP-SEARCH-02")
                .status(CandidateStatus.PENDING_VERIFICATION)
                .build());

        // List all
        mockMvc.perform(get("/api/engineer/candidates")
                        .header("Authorization", engineerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.content").isArray());

        // Search by name "Sarah"
        mockMvc.perform(get("/api/engineer/candidates?search=Sarah")
                        .header("Authorization", engineerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].fullName").value("Sarah Connor"));

        // Search by application ID "APP-SEARCH-02"
        mockMvc.perform(get("/api/engineer/candidates?search=APP-SEARCH-02")
                        .header("Authorization", engineerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].fullName").value("David Bowman"));
    }

    @Test
    @DisplayName("Get candidate by ID and 404 for unknown candidate")
    void testGetCandidateById() throws Exception {
        Candidate candidate = candidateRepository.save(Candidate.builder()
                .fullName("Elena Vance")
                .email("elena@example.com")
                .phone("9876543212")
                .location("Hyderabad")
                .college("BITS Pilani")
                .degree("B.E.")
                .department("ECE")
                .graduationYear(2025)
                .appliedRole("Embedded Systems Engineer")
                .applicationId("APP-ID-01")
                .status(CandidateStatus.PENDING_VERIFICATION)
                .build());

        mockMvc.perform(get("/api/engineer/candidates/" + candidate.getId())
                        .header("Authorization", engineerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(candidate.getId().toString()))
                .andExpect(jsonPath("$.fullName").value("Elena Vance"));

        // Unknown UUID -> 404
        mockMvc.perform(get("/api/engineer/candidates/" + UUID.randomUUID())
                        .header("Authorization", engineerToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Update candidate intake details and verify audit log")
    void testUpdateCandidate() throws Exception {
        Candidate candidate = candidateRepository.save(Candidate.builder()
                .fullName("Michael Scott")
                .email("michael@example.com")
                .phone("9876543213")
                .location("Scranton")
                .college("Penn State")
                .degree("B.S.")
                .department("Business & CS")
                .graduationYear(2024)
                .cgpa(7.5)
                .appliedRole("Product Manager")
                .applicationId("APP-UPDATE-01")
                .status(CandidateStatus.PENDING_VERIFICATION)
                .build());

        CandidateUpdateRequest updateReq = CandidateUpdateRequest.builder()
                .fullName("Michael Gary Scott")
                .email("michael.scott@example.com")
                .phone("9876543213")
                .location("New York")
                .college("Penn State")
                .degree("B.S.")
                .department("Business & CS")
                .graduationYear(2024)
                .cgpa(8.0)
                .experienceLevel("EXPERIENCED")
                .appliedRole("Senior Product Manager")
                .applicationId("APP-UPDATE-01")
                .source("REFERRAL")
                .engineerNotes("Updated following initial phone screen.")
                .build();

        mockMvc.perform(put("/api/engineer/candidates/" + candidate.getId())
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Michael Gary Scott"))
                .andExpect(jsonPath("$.location").value("New York"))
                .andExpect(jsonPath("$.appliedRole").value("Senior Product Manager"))
                .andExpect(jsonPath("$.status").value("PENDING_VERIFICATION")); // Status preserved

        // Verify updated in database
        Candidate updatedInDb = candidateRepository.findById(candidate.getId()).orElseThrow();
        assertEquals("Michael Gary Scott", updatedInDb.getFullName());
        assertEquals(8.0, updatedInDb.getCgpa());

        // Verify audit log record for update
        List<AuditLog> logs = auditLogRepository.findAll();
        boolean updateFound = logs.stream().anyMatch(l -> "CANDIDATE_UPDATED".equals(l.getAction()));
        assertTrue(updateFound, "Expected CANDIDATE_UPDATED audit log");
    }

    @Test
    @DisplayName("Get real engineer dashboard stats from database")
    void testGetDashboardStats() throws Exception {
        candidateRepository.save(Candidate.builder()
                .fullName("User One")
                .email("one@example.com")
                .appliedRole("Role A")
                .applicationId("APP-STAT-1")
                .status(CandidateStatus.PENDING_VERIFICATION)
                .build());

        candidateRepository.save(Candidate.builder()
                .fullName("User Two")
                .email("two@example.com")
                .appliedRole("Role B")
                .applicationId("APP-STAT-2")
                .status(CandidateStatus.VERIFIED)
                .build());

        candidateRepository.save(Candidate.builder()
                .fullName("User Three")
                .email("three@example.com")
                .appliedRole("Role C")
                .applicationId("APP-STAT-3")
                .status(CandidateStatus.SENT_TO_INSTRUCTOR)
                .build());

        mockMvc.perform(get("/api/engineer/dashboard/stats")
                        .header("Authorization", engineerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCandidates").value(3))
                .andExpect(jsonPath("$.pendingVerification").value(1))
                .andExpect(jsonPath("$.verified").value(1))
                .andExpect(jsonPath("$.sentToInstructors").value(1));
    }
}
