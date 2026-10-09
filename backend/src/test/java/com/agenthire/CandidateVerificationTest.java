package com.agenthire;

import com.agenthire.dto.candidate.CandidateCreateRequest;
import com.agenthire.dto.candidate.CandidateRejectionRequest;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class CandidateVerificationTest {

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

        engineerUser = getOrCreateTestUser("verification.engineer@agenthire.ai", "Verification Engineer", UserRole.INTERVIEW_ENGINEER);
        User adminUser = getOrCreateTestUser("verification.admin@agenthire.ai", "Verification Admin", UserRole.ADMIN);
        User instructorUser = getOrCreateTestUser("verification.instructor@agenthire.ai", "Verification Instructor", UserRole.INSTRUCTOR);
        User candidateUser = getOrCreateTestUser("verification.candidate@agenthire.ai", "Verification Candidate", UserRole.CANDIDATE);

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

    private Candidate createPendingCandidate(String appId, String email, String fullName) {
        return candidateRepository.save(Candidate.builder()
                .fullName(fullName)
                .email(email)
                .phone("+91-9876543210")
                .location("Bengaluru, India")
                .college("Indian Institute of Science")
                .degree("M.Tech")
                .department("Computer Science")
                .graduationYear(2025)
                .cgpa(9.2)
                .experienceLevel("EXPERIENCED")
                .appliedRole("Backend Architect")
                .applicationId(appId)
                .source("DIRECT")
                .status(CandidateStatus.PENDING_VERIFICATION)
                .engineerNotes("Verified intake details.")
                .build());
    }

    @Test
    @DisplayName("Verify Candidate: PENDING_VERIFICATION -> VERIFIED transitions successfully")
    void testVerifyCandidateSuccess() throws Exception {
        Candidate candidate = createPendingCandidate("APP-VER-001", "candidate.ver1@example.com", "Maya Lin");

        mockMvc.perform(post("/api/engineer/candidates/" + candidate.getId() + "/verify")
                        .header("Authorization", engineerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(candidate.getId().toString()))
                .andExpect(jsonPath("$.status").value("VERIFIED"))
                .andExpect(jsonPath("$.verifiedBy.id").value(engineerUser.getId().toString()))
                .andExpect(jsonPath("$.verifiedBy.fullName").value("Verification Engineer"))
                .andExpect(jsonPath("$.verifiedAt").exists())
                .andExpect(jsonPath("$.rejectionReason").doesNotExist());

        // Verify in database
        Candidate inDb = candidateRepository.findById(candidate.getId()).orElseThrow();
        assertEquals(CandidateStatus.VERIFIED, inDb.getStatus());
        assertNotNull(inDb.getVerifiedBy());
        assertEquals(engineerUser.getId(), inDb.getVerifiedBy().getId());
        assertNotNull(inDb.getVerifiedAt());
        assertNull(inDb.getRejectedBy());
        assertNull(inDb.getRejectionReason());

        // Verify Audit Log
        List<AuditLog> auditLogs = auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc("Candidate", candidate.getId());
        boolean hasVerifiedAudit = auditLogs.stream().anyMatch(l -> "CANDIDATE_VERIFIED".equals(l.getAction()));
        assertTrue(hasVerifiedAudit, "Audit log for CANDIDATE_VERIFIED must be recorded");
    }

    @Test
    @DisplayName("Reject Candidate: PENDING_VERIFICATION -> REJECTED transitions successfully with reason")
    void testRejectCandidateSuccess() throws Exception {
        Candidate candidate = createPendingCandidate("APP-REJ-001", "candidate.rej1@example.com", "Robert Smith");
        CandidateRejectionRequest rejectionRequest = CandidateRejectionRequest.builder()
                .reason("Degree certificate details could not be validated with Anna University records.")
                .build();

        mockMvc.perform(post("/api/engineer/candidates/" + candidate.getId() + "/reject")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectionRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(candidate.getId().toString()))
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.rejectedBy.id").value(engineerUser.getId().toString()))
                .andExpect(jsonPath("$.rejectedBy.fullName").value("Verification Engineer"))
                .andExpect(jsonPath("$.rejectedAt").exists())
                .andExpect(jsonPath("$.rejectionReason").value("Degree certificate details could not be validated with Anna University records."));

        // Verify in database
        Candidate inDb = candidateRepository.findById(candidate.getId()).orElseThrow();
        assertEquals(CandidateStatus.REJECTED, inDb.getStatus());
        assertNotNull(inDb.getRejectedBy());
        assertEquals(engineerUser.getId(), inDb.getRejectedBy().getId());
        assertNotNull(inDb.getRejectedAt());
        assertEquals("Degree certificate details could not be validated with Anna University records.", inDb.getRejectionReason());
        assertNull(inDb.getVerifiedBy());

        // Verify Audit Log
        List<AuditLog> auditLogs = auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc("Candidate", candidate.getId());
        boolean hasRejectedAudit = auditLogs.stream().anyMatch(l -> "CANDIDATE_REJECTED".equals(l.getAction()));
        assertTrue(hasRejectedAudit, "Audit log for CANDIDATE_REJECTED must be recorded");
    }

    @Test
    @DisplayName("Invalid Status Transitions return 409 Conflict")
    void testInvalidStatusTransitions() throws Exception {
        Candidate candidate = createPendingCandidate("APP-CONFLICT-001", "candidate.conflict@example.com", "Alice Walker");

        // 1. First verify -> 200
        mockMvc.perform(post("/api/engineer/candidates/" + candidate.getId() + "/verify")
                        .header("Authorization", engineerToken))
                .andExpect(status().isOk());

        // 2. VERIFIED -> VERIFIED (Double verify) -> 409 Conflict
        mockMvc.perform(post("/api/engineer/candidates/" + candidate.getId() + "/verify")
                        .header("Authorization", engineerToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("INVALID_STATUS_TRANSITION"));

        // 3. VERIFIED -> REJECTED -> 409 Conflict
        CandidateRejectionRequest rejectionReq = CandidateRejectionRequest.builder()
                .reason("Cannot reject already verified candidate")
                .build();

        mockMvc.perform(post("/api/engineer/candidates/" + candidate.getId() + "/reject")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectionReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("INVALID_STATUS_TRANSITION"));

        // Create a rejected candidate
        Candidate rejectedCandidate = createPendingCandidate("APP-CONFLICT-002", "candidate.conflict2@example.com", "Bob Marley");
        mockMvc.perform(post("/api/engineer/candidates/" + rejectedCandidate.getId() + "/reject")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectionReq)))
                .andExpect(status().isOk());

        // 4. REJECTED -> VERIFIED -> 409 Conflict
        mockMvc.perform(post("/api/engineer/candidates/" + rejectedCandidate.getId() + "/verify")
                        .header("Authorization", engineerToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("INVALID_STATUS_TRANSITION"));

        // 5. REJECTED -> REJECTED -> 409 Conflict
        mockMvc.perform(post("/api/engineer/candidates/" + rejectedCandidate.getId() + "/reject")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejectionReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("INVALID_STATUS_TRANSITION"));
    }

    @Test
    @DisplayName("Rejection Request Validation: Missing, empty, or whitespace reason returns 400 Bad Request")
    void testRejectionValidation() throws Exception {
        Candidate candidate = createPendingCandidate("APP-VAL-001", "candidate.val@example.com", "Catherine Zeta");

        // Missing reason (empty body)
        mockMvc.perform(post("/api/engineer/candidates/" + candidate.getId() + "/reject")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.validationErrors.reason").exists());

        // Empty reason string ""
        CandidateRejectionRequest emptyReq = CandidateRejectionRequest.builder().reason("").build();
        mockMvc.perform(post("/api/engineer/candidates/" + candidate.getId() + "/reject")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emptyReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.validationErrors.reason").exists());

        // Whitespace only reason "   "
        CandidateRejectionRequest whitespaceReq = CandidateRejectionRequest.builder().reason("   ").build();
        mockMvc.perform(post("/api/engineer/candidates/" + candidate.getId() + "/reject")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(whitespaceReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.validationErrors.reason").exists());
    }

    @Test
    @DisplayName("Role-Based Access Control: Verification & Rejection restricted to INTERVIEW_ENGINEER")
    void testRbacRestrictions() throws Exception {
        Candidate candidate = createPendingCandidate("APP-RBAC-002", "candidate.rbac@example.com", "Daniel Craig");
        CandidateRejectionRequest rejectionReq = CandidateRejectionRequest.builder()
                .reason("Valid rejection reason for RBAC test")
                .build();
        String rejJson = objectMapper.writeValueAsString(rejectionReq);

        // Verify endpoint RBAC
        // Admin -> 403
        mockMvc.perform(post("/api/engineer/candidates/" + candidate.getId() + "/verify")
                        .header("Authorization", adminToken))
                .andExpect(status().isForbidden());

        // Instructor -> 403
        mockMvc.perform(post("/api/engineer/candidates/" + candidate.getId() + "/verify")
                        .header("Authorization", instructorToken))
                .andExpect(status().isForbidden());

        // Candidate -> 403
        mockMvc.perform(post("/api/engineer/candidates/" + candidate.getId() + "/verify")
                        .header("Authorization", candidateToken))
                .andExpect(status().isForbidden());

        // Unauthenticated -> 401
        mockMvc.perform(post("/api/engineer/candidates/" + candidate.getId() + "/verify"))
                .andExpect(status().isUnauthorized());

        // Reject endpoint RBAC
        // Admin -> 403
        mockMvc.perform(post("/api/engineer/candidates/" + candidate.getId() + "/reject")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(rejJson))
                .andExpect(status().isForbidden());

        // Instructor -> 403
        mockMvc.perform(post("/api/engineer/candidates/" + candidate.getId() + "/reject")
                        .header("Authorization", instructorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(rejJson))
                .andExpect(status().isForbidden());

        // Candidate -> 403
        mockMvc.perform(post("/api/engineer/candidates/" + candidate.getId() + "/reject")
                        .header("Authorization", candidateToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(rejJson))
                .andExpect(status().isForbidden());

        // Unauthenticated -> 401
        mockMvc.perform(post("/api/engineer/candidates/" + candidate.getId() + "/reject")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(rejJson))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Candidate Audit History API returns chronological audit trail")
    void testCandidateAuditHistory() throws Exception {
        Candidate candidate = createPendingCandidate("APP-AUDIT-001", "candidate.audit@example.com", "Eleanor Rigby");

        // Verify candidate
        mockMvc.perform(post("/api/engineer/candidates/" + candidate.getId() + "/verify")
                        .header("Authorization", engineerToken))
                .andExpect(status().isOk());

        // Get audit history
        mockMvc.perform(get("/api/engineer/candidates/" + candidate.getId() + "/audit")
                        .header("Authorization", engineerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].action").value("CANDIDATE_VERIFIED"))
                .andExpect(jsonPath("$[0].entityType").value("Candidate"))
                .andExpect(jsonPath("$[0].actor.fullName").value("Verification Engineer"));
    }

    @Test
    @DisplayName("Pending Verification API returns only candidates requiring engineer review")
    void testPendingVerificationEndpoint() throws Exception {
        Candidate pending1 = createPendingCandidate("APP-PND-01", "pnd1@example.com", "Pending One");
        Candidate pending2 = createPendingCandidate("APP-PND-02", "pnd2@example.com", "Pending Two");

        // Verify one of them
        mockMvc.perform(post("/api/engineer/candidates/" + pending1.getId() + "/verify")
                        .header("Authorization", engineerToken))
                .andExpect(status().isOk());

        // Fetch pending candidates
        mockMvc.perform(get("/api/engineer/candidates/pending-verification")
                        .header("Authorization", engineerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].id").value(pending2.getId().toString()))
                .andExpect(jsonPath("$.content[0].status").value("PENDING_VERIFICATION"));
    }

    @Test
    @DisplayName("Dashboard stats reflect verified and rejected metrics from MySQL")
    void testDashboardStatsWithVerifiedAndRejected() throws Exception {
        Candidate c1 = createPendingCandidate("APP-DSH-01", "dsh1@example.com", "Dash One");
        Candidate c2 = createPendingCandidate("APP-DSH-02", "dsh2@example.com", "Dash Two");
        Candidate c3 = createPendingCandidate("APP-DSH-03", "dsh3@example.com", "Dash Three");

        // Verify c1
        mockMvc.perform(post("/api/engineer/candidates/" + c1.getId() + "/verify")
                        .header("Authorization", engineerToken))
                .andExpect(status().isOk());

        // Reject c2
        CandidateRejectionRequest rejReq = CandidateRejectionRequest.builder().reason("Did not meet eligibility").build();
        mockMvc.perform(post("/api/engineer/candidates/" + c2.getId() + "/reject")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(rejReq)))
                .andExpect(status().isOk());

        // c3 remains pending

        mockMvc.perform(get("/api/engineer/dashboard/stats")
                        .header("Authorization", engineerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalCandidates").value(3))
                .andExpect(jsonPath("$.pendingVerification").value(1))
                .andExpect(jsonPath("$.verified").value(1))
                .andExpect(jsonPath("$.rejected").value(1));
    }
}
