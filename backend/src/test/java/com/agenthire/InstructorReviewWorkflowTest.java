package com.agenthire;

import com.agenthire.dto.assignment.AssignmentDeclineRequest;
import com.agenthire.entity.AuditLog;
import com.agenthire.entity.Candidate;
import com.agenthire.entity.CandidateAssignment;
import com.agenthire.entity.Instructor;
import com.agenthire.entity.InterviewEngineer;
import com.agenthire.entity.Notification;
import com.agenthire.entity.Resume;
import com.agenthire.entity.User;
import com.agenthire.entity.enums.AssignmentStatus;
import com.agenthire.entity.enums.CandidateStatus;
import com.agenthire.entity.enums.NotificationStatus;
import com.agenthire.entity.enums.NotificationType;
import com.agenthire.entity.enums.ResumeStatus;
import com.agenthire.entity.enums.UserRole;
import com.agenthire.repository.AuditLogRepository;
import com.agenthire.repository.CandidateAssignmentRepository;
import com.agenthire.repository.CandidateRepository;
import com.agenthire.repository.InstructorRepository;
import com.agenthire.repository.InterviewEngineerRepository;
import com.agenthire.repository.NotificationRepository;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class InstructorReviewWorkflowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private ResumeRepository resumeRepository;

    @Autowired
    private CandidateAssignmentRepository assignmentRepository;

    @Autowired
    private InstructorRepository instructorRepository;

    @Autowired
    private InterviewEngineerRepository engineerRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User engineerUser;
    private User instructorUser1;
    private User instructorUser2;
    private User adminUser;
    private User candidateUser;

    private Instructor instructor1;
    private Instructor instructor2;
    private InterviewEngineer engineer;

    private String engineerToken;
    private String instructor1Token;
    private String instructor2Token;
    private String adminToken;
    private String candidateToken;

    @BeforeEach
    void setUp() {
        assignmentRepository.deleteAll();
        notificationRepository.deleteAll();
        auditLogRepository.deleteAll();
        resumeRepository.deleteAll();
        candidateRepository.deleteAll();
        instructorRepository.deleteAll();
        engineerRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Create Engineer
        engineerUser = userRepository.save(User.builder()
                .fullName("Sarah Connor")
                .email("sarah.engineer@agenthire.ai")
                .passwordHash(passwordEncoder.encode("Password@123"))
                .role(UserRole.INTERVIEW_ENGINEER)
                .enabled(true)
                .build());

        engineer = engineerRepository.save(InterviewEngineer.builder()
                .user(engineerUser)
                .employeeCode("ENG-9901")
                .department("Technical Verification")
                .active(true)
                .build());

        // 2. Create Instructor 1
        instructorUser1 = userRepository.save(User.builder()
                .fullName("Alan Turing")
                .email("alan.turing@agenthire.ai")
                .passwordHash(passwordEncoder.encode("Password@123"))
                .role(UserRole.INSTRUCTOR)
                .enabled(true)
                .build());

        instructor1 = instructorRepository.save(Instructor.builder()
                .user(instructorUser1)
                .employeeCode("INST-1001")
                .department("Computer Science & AI")
                .specialization("Distributed Systems & Java")
                .active(true)
                .build());

        // 3. Create Instructor 2
        instructorUser2 = userRepository.save(User.builder()
                .fullName("Grace Hopper")
                .email("grace.hopper@agenthire.ai")
                .passwordHash(passwordEncoder.encode("Password@123"))
                .role(UserRole.INSTRUCTOR)
                .enabled(true)
                .build());

        instructor2 = instructorRepository.save(Instructor.builder()
                .user(instructorUser2)
                .employeeCode("INST-1002")
                .department("Compiler Systems")
                .specialization("Low-level Engineering")
                .active(true)
                .build());

        // 4. Create Admin & Candidate Users
        adminUser = userRepository.save(User.builder()
                .fullName("Platform Admin")
                .email("admin.test@agenthire.ai")
                .passwordHash(passwordEncoder.encode("Password@123"))
                .role(UserRole.ADMIN)
                .enabled(true)
                .build());

        candidateUser = userRepository.save(User.builder()
                .fullName("Alice Candidate")
                .email("alice.candidate@agenthire.ai")
                .passwordHash(passwordEncoder.encode("Password@123"))
                .role(UserRole.CANDIDATE)
                .enabled(true)
                .build());

        // Generate JWT Tokens
        engineerToken = jwtService.generateToken(engineerUser);
        instructor1Token = jwtService.generateToken(instructorUser1);
        instructor2Token = jwtService.generateToken(instructorUser2);
        adminToken = jwtService.generateToken(adminUser);
        candidateToken = jwtService.generateToken(candidateUser);
    }

    private Candidate createVerifiedCandidate(String name, String email, String appId) {
        Candidate candidate = Candidate.builder()
                .fullName(name)
                .email(email)
                .phone("+15551234567")
                .college("MIT")
                .degree("B.S.")
                .department("Computer Science")
                .graduationYear(2025)
                .cgpa(9.2)
                .experienceLevel("ENTRY")
                .appliedRole("Senior Java Engineer")
                .applicationId(appId)
                .status(CandidateStatus.SENT_TO_INSTRUCTOR)
                .verifiedBy(engineerUser)
                .verifiedAt(Instant.now())
                .build();
        return candidateRepository.save(candidate);
    }

    private CandidateAssignment createSentAssignment(Candidate candidate, Instructor instructor) {
        CandidateAssignment assignment = CandidateAssignment.builder()
                .candidate(candidate)
                .interviewEngineer(engineer)
                .instructor(instructor)
                .appliedRole(candidate.getAppliedRole())
                .interviewType("TECHNICAL")
                .priority("HIGH")
                .engineerMessage("Please evaluate candidate's Spring Boot expertise.")
                .status(AssignmentStatus.SENT)
                .assignedAt(Instant.now())
                .build();
        return assignmentRepository.save(assignment);
    }

    @Test
    @DisplayName("Should successfully accept candidate assignment, transition to ACCEPTED, update candidate status, notify engineer, and create audit log")
    void testAcceptAssignmentSuccess() throws Exception {
        Candidate candidate = createVerifiedCandidate("Bob Martin", "bob.martin@agenthire.ai", "APP-DEC-01");
        CandidateAssignment assignment = createSentAssignment(candidate, instructor1);

        mockMvc.perform(post("/api/instructor/assignments/" + assignment.getId() + "/accept")
                        .header("Authorization", "Bearer " + instructor1Token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(assignment.getId().toString()))
                .andExpect(jsonPath("$.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.acceptedAt").isNotEmpty())
                .andExpect(jsonPath("$.acceptedByName").value(instructorUser1.getFullName()));

        // Verify Candidate updated status
        Candidate updatedCandidate = candidateRepository.findById(candidate.getId()).orElseThrow();
        assertEquals(CandidateStatus.ACCEPTED_BY_INSTRUCTOR, updatedCandidate.getStatus());

        // Verify Notification sent to Engineer
        List<Notification> engineerNotifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(engineerUser.getId());
        assertFalse(engineerNotifications.isEmpty());
        Notification notification = engineerNotifications.get(0);
        assertEquals(NotificationType.CANDIDATE_ASSIGNMENT_ACCEPTED, notification.getType());
        assertEquals(NotificationStatus.UNREAD, notification.getStatus());
        assertTrue(notification.getMessage().contains("Alan Turing accepted"));

        // Verify Audit Log
        List<AuditLog> auditLogs = auditLogRepository.findByUserIdOrderByCreatedAtDesc(instructorUser1.getId());
        assertFalse(auditLogs.isEmpty());
        assertEquals("CANDIDATE_ASSIGNMENT_ACCEPTED", auditLogs.get(0).getAction());
    }

    @Test
    @DisplayName("Should successfully decline candidate assignment with valid reason, transition to DECLINED, preserve candidate, notify engineer, and create audit log")
    void testDeclineAssignmentSuccess() throws Exception {
        Candidate candidate = createVerifiedCandidate("Dennis Ritchie", "dennis.ritchie@agenthire.ai", "APP-DEC-02");
        CandidateAssignment assignment = createSentAssignment(candidate, instructor1);

        AssignmentDeclineRequest declineRequest = AssignmentDeclineRequest.builder()
                .reason("The candidate does not possess required Spring Boot experience for this track.")
                .build();

        mockMvc.perform(post("/api/instructor/assignments/" + assignment.getId() + "/decline")
                        .header("Authorization", "Bearer " + instructor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(declineRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(assignment.getId().toString()))
                .andExpect(jsonPath("$.status").value("DECLINED"))
                .andExpect(jsonPath("$.declinedAt").isNotEmpty())
                .andExpect(jsonPath("$.declinedByName").value(instructorUser1.getFullName()))
                .andExpect(jsonPath("$.declineReason").value(declineRequest.getReason()));

        // Verify Candidate status is preserved / set to VERIFIED for reassignment
        Candidate updatedCandidate = candidateRepository.findById(candidate.getId()).orElseThrow();
        assertEquals(CandidateStatus.VERIFIED, updatedCandidate.getStatus());

        // Verify Notification sent to Engineer
        List<Notification> engineerNotifications = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(engineerUser.getId());
        assertFalse(engineerNotifications.isEmpty());
        Notification notification = engineerNotifications.get(0);
        assertEquals(NotificationType.CANDIDATE_ASSIGNMENT_DECLINED, notification.getType());
        assertTrue(notification.getMessage().contains("declined"));

        // Verify Audit Log
        List<AuditLog> auditLogs = auditLogRepository.findByUserIdOrderByCreatedAtDesc(instructorUser1.getId());
        assertFalse(auditLogs.isEmpty());
        assertEquals("CANDIDATE_ASSIGNMENT_DECLINED", auditLogs.get(0).getAction());
    }

    @Test
    @DisplayName("Should reject decline request when reason is missing or empty with 400 Bad Request")
    void testDeclineAssignmentMissingReason() throws Exception {
        Candidate candidate = createVerifiedCandidate("Niklaus Wirth", "niklaus.wirth@agenthire.ai", "APP-DEC-03");
        CandidateAssignment assignment = createSentAssignment(candidate, instructor1);

        AssignmentDeclineRequest emptyReasonRequest = AssignmentDeclineRequest.builder()
                .reason("   ")
                .build();

        mockMvc.perform(post("/api/instructor/assignments/" + assignment.getId() + "/decline")
                        .header("Authorization", "Bearer " + instructor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emptyReasonRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should prevent invalid state transitions (ACCEPTED -> ACCEPTED, ACCEPTED -> DECLINED, etc.) with 409 Conflict")
    void testInvalidStatusTransitions() throws Exception {
        Candidate candidate = createVerifiedCandidate("Ken Thompson", "ken.thompson@agenthire.ai", "APP-DEC-04");
        CandidateAssignment assignment = createSentAssignment(candidate, instructor1);

        // 1. First accept
        mockMvc.perform(post("/api/instructor/assignments/" + assignment.getId() + "/accept")
                        .header("Authorization", "Bearer " + instructor1Token))
                .andExpect(status().isOk());

        // 2. Second accept -> 409 Conflict
        mockMvc.perform(post("/api/instructor/assignments/" + assignment.getId() + "/accept")
                        .header("Authorization", "Bearer " + instructor1Token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("INVALID_STATUS_TRANSITION"));

        // 3. Accept then decline -> 409 Conflict
        AssignmentDeclineRequest declineRequest = AssignmentDeclineRequest.builder()
                .reason("Cannot decline after accepting")
                .build();

        mockMvc.perform(post("/api/instructor/assignments/" + assignment.getId() + "/decline")
                        .header("Authorization", "Bearer " + instructor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(declineRequest)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("INVALID_STATUS_TRANSITION"));
    }

    @Test
    @DisplayName("Should enforce strict Instructor Data Isolation (Instructor 2 cannot accept or view Instructor 1 assignment)")
    void testInstructorDataIsolation() throws Exception {
        Candidate candidate = createVerifiedCandidate("Ada Lovelace", "ada.lovelace@agenthire.ai", "APP-DEC-05");
        CandidateAssignment assignment = createSentAssignment(candidate, instructor1);

        // Instructor 2 tries to accept Instructor 1's assignment -> 404 / 403
        mockMvc.perform(post("/api/instructor/assignments/" + assignment.getId() + "/accept")
                        .header("Authorization", "Bearer " + instructor2Token))
                .andExpect(status().isNotFound());

        // Instructor 2 tries to decline Instructor 1's assignment -> 404
        AssignmentDeclineRequest declineRequest = AssignmentDeclineRequest.builder()
                .reason("Unauthorized decline attempt")
                .build();

        mockMvc.perform(post("/api/instructor/assignments/" + assignment.getId() + "/decline")
                        .header("Authorization", "Bearer " + instructor2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(declineRequest)))
                .andExpect(status().isNotFound());

        // Instructor 2 tries to get candidate detail assigned to Instructor 1 -> 404
        mockMvc.perform(get("/api/instructor/candidates/" + candidate.getId())
                        .header("Authorization", "Bearer " + instructor2Token))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should enforce RBAC on instructor decision APIs (Engineer/Candidate/Admin -> 403, No Token -> 401)")
    void testRbacOnInstructorEndpoints() throws Exception {
        Candidate candidate = createVerifiedCandidate("Margaret Hamilton", "margaret.hamilton@agenthire.ai", "APP-DEC-06");
        CandidateAssignment assignment = createSentAssignment(candidate, instructor1);

        // Engineer -> 403
        mockMvc.perform(post("/api/instructor/assignments/" + assignment.getId() + "/accept")
                        .header("Authorization", "Bearer " + engineerToken))
                .andExpect(status().isForbidden());

        // Candidate -> 403
        mockMvc.perform(post("/api/instructor/assignments/" + assignment.getId() + "/accept")
                        .header("Authorization", "Bearer " + candidateToken))
                .andExpect(status().isForbidden());

        // Admin -> 403
        mockMvc.perform(post("/api/instructor/assignments/" + assignment.getId() + "/accept")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());

        // Unauthenticated -> 401
        mockMvc.perform(post("/api/instructor/assignments/" + assignment.getId() + "/accept"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Should return accurate real-time dashboard statistics for instructor")
    void testInstructorDashboardStats() throws Exception {
        // Create 3 candidates & assignments for instructor 1
        Candidate c1 = createVerifiedCandidate("C1", "c1@test.com", "APP-ST-01");
        Candidate c2 = createVerifiedCandidate("C2", "c2@test.com", "APP-ST-02");
        Candidate c3 = createVerifiedCandidate("C3", "c3@test.com", "APP-ST-03");

        CandidateAssignment a1 = createSentAssignment(c1, instructor1);
        CandidateAssignment a2 = createSentAssignment(c2, instructor1);
        CandidateAssignment a3 = createSentAssignment(c3, instructor1);

        // Accept a1
        mockMvc.perform(post("/api/instructor/assignments/" + a1.getId() + "/accept")
                        .header("Authorization", "Bearer " + instructor1Token))
                .andExpect(status().isOk());

        // Decline a2
        AssignmentDeclineRequest declineReq = AssignmentDeclineRequest.builder()
                .reason("Skills mismatch")
                .build();
        mockMvc.perform(post("/api/instructor/assignments/" + a2.getId() + "/decline")
                        .header("Authorization", "Bearer " + instructor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(declineReq)))
                .andExpect(status().isOk());

        // Leave a3 as SENT (pending review)

        // Get dashboard stats
        mockMvc.perform(get("/api/instructor/dashboard/stats")
                        .header("Authorization", "Bearer " + instructor1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.assignedCandidates").value(3))
                .andExpect(jsonPath("$.pendingReview").value(1))
                .andExpect(jsonPath("$.accepted").value(1))
                .andExpect(jsonPath("$.declined").value(1));
    }
}
