package com.agenthire;

import com.agenthire.dto.assignment.CandidateAssignRequest;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class CandidateAssignmentWorkflowTest {

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

    private String engineerToken;
    private String instructorToken1;
    private String instructorToken2;
    private String adminToken;
    private String candidateToken;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        assignmentRepository.deleteAll();
        resumeRepository.deleteAll();
        candidateRepository.deleteAll();

        engineerUser = getOrCreateTestUser("assign.engineer@agenthire.ai", "Assignment Engineer", UserRole.INTERVIEW_ENGINEER);
        instructorUser1 = getOrCreateTestUser("instructor1@agenthire.ai", "Dr. Alan Turing", UserRole.INSTRUCTOR);
        instructorUser2 = getOrCreateTestUser("instructor2@agenthire.ai", "Dr. Ada Lovelace", UserRole.INSTRUCTOR);
        adminUser = getOrCreateTestUser("assign.admin@agenthire.ai", "Assignment Admin", UserRole.ADMIN);
        candidateUser = getOrCreateTestUser("assign.candidate@agenthire.ai", "Assignment Candidate", UserRole.CANDIDATE);

        engineerRepository.findByUserId(engineerUser.getId()).orElseGet(() ->
                engineerRepository.save(InterviewEngineer.builder()
                        .user(engineerUser)
                        .employeeCode("ENG-TEST-01")
                        .department("Intake Board")
                        .active(true)
                        .build()));

        instructor1 = instructorRepository.findByUserId(instructorUser1.getId()).orElseGet(() ->
                instructorRepository.save(Instructor.builder()
                        .user(instructorUser1)
                        .employeeCode("INST-TEST-01")
                        .department("Architecture")
                        .specialization("Distributed Systems")
                        .active(true)
                        .build()));

        instructor2 = instructorRepository.findByUserId(instructorUser2.getId()).orElseGet(() ->
                instructorRepository.save(Instructor.builder()
                        .user(instructorUser2)
                        .employeeCode("INST-TEST-02")
                        .department("Algorithms")
                        .specialization("Data Structures")
                        .active(true)
                        .build()));

        engineerToken = "Bearer " + jwtService.generateToken(engineerUser);
        instructorToken1 = "Bearer " + jwtService.generateToken(instructorUser1);
        instructorToken2 = "Bearer " + jwtService.generateToken(instructorUser2);
        adminToken = "Bearer " + jwtService.generateToken(adminUser);
        candidateToken = "Bearer " + jwtService.generateToken(candidateUser);
    }

    private User getOrCreateTestUser(String email, String fullName, UserRole role) {
        return userRepository.findByEmail(email).orElseGet(() ->
                userRepository.save(User.builder()
                        .fullName(fullName)
                        .email(email)
                        .passwordHash(passwordEncoder.encode("Password123!@#"))
                        .role(role)
                        .enabled(true)
                        .build()));
    }

    private Candidate createCandidateWithResume(String appId, String email, CandidateStatus status) {
        Candidate candidate = candidateRepository.save(Candidate.builder()
                .fullName("Sarah Connor")
                .email(email)
                .phone("+91-9876543210")
                .location("Bengaluru, India")
                .college("MIT")
                .degree("B.S.")
                .department("Computer Science")
                .graduationYear(2025)
                .cgpa(9.2)
                .experienceLevel("FRESHER")
                .appliedRole("Java Developer")
                .applicationId(appId)
                .source("CAMPUS")
                .status(status)
                .build());

        resumeRepository.save(Resume.builder()
                .candidate(candidate)
                .fileName("sarah_resume.pdf")
                .filePath("resumes/test-uuid.pdf")
                .fileType("application/pdf")
                .fileSize(1024L)
                .uploadedBy(engineerUser)
                .uploadedAt(Instant.now())
                .version(1)
                .isCurrent(true)
                .status(ResumeStatus.ANALYZED)
                .build());

        return candidate;
    }

    @Test
    @DisplayName("Engineer assigns verified candidate with resume to instructor successfully")
    void testAssignCandidateSuccess() throws Exception {
        Candidate candidate = createCandidateWithResume("APP-ASSIGN-01", "sarah.assign@example.com", CandidateStatus.VERIFIED);

        CandidateAssignRequest request = CandidateAssignRequest.builder()
                .instructorId(instructor1.getId())
                .message("Please evaluate for senior Java backend role.")
                .interviewType("TECHNICAL")
                .priority("HIGH")
                .build();

        mockMvc.perform(post("/api/engineer/candidates/" + candidate.getId() + "/assign")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.status").value("SENT"))
                .andExpect(jsonPath("$.candidate.id").value(candidate.getId().toString()))
                .andExpect(jsonPath("$.instructor.id").value(instructor1.getId().toString()))
                .andExpect(jsonPath("$.engineerMessage").value("Please evaluate for senior Java backend role."));

        // Verify CandidateAssignment in MySQL
        List<CandidateAssignment> assignments = assignmentRepository.findByCandidateId(candidate.getId());
        assertEquals(1, assignments.size());
        CandidateAssignment savedAssignment = assignments.get(0);
        assertEquals(AssignmentStatus.SENT, savedAssignment.getStatus());
        assertEquals("Please evaluate for senior Java backend role.", savedAssignment.getEngineerMessage());

        // Verify Candidate status updated to SENT_TO_INSTRUCTOR
        Candidate inDb = candidateRepository.findById(candidate.getId()).orElseThrow();
        assertEquals(CandidateStatus.SENT_TO_INSTRUCTOR, inDb.getStatus());

        // Verify Notification created for instructor
        List<Notification> notifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(instructorUser1.getId());
        assertFalse(notifs.isEmpty());
        Notification notification = notifs.get(0);
        assertEquals(NotificationType.CANDIDATE_ASSIGNED, notification.getType());
        assertEquals(NotificationStatus.UNREAD, notification.getStatus());
        assertTrue(notification.getTitle().contains("Sarah Connor"));

        // Verify Audit Log created
        List<AuditLog> auditLogs = auditLogRepository.findByUserIdOrderByCreatedAtDesc(engineerUser.getId());
        assertTrue(auditLogs.stream().anyMatch(l -> "CANDIDATE_SENT_TO_INSTRUCTOR".equals(l.getAction())));
    }

    @Test
    @DisplayName("Assignment rejected with 409 Conflict if candidate is not VERIFIED")
    void testAssignCandidateUnverifiedConflict() throws Exception {
        Candidate pendingCandidate = candidateRepository.save(Candidate.builder()
                .fullName("Unverified Candidate")
                .email("unver@example.com")
                .college("Test College")
                .degree("B.E.")
                .department("CSE")
                .graduationYear(2025)
                .appliedRole("Java Developer")
                .applicationId("APP-UNVER-01")
                .status(CandidateStatus.PENDING_VERIFICATION)
                .build());

        CandidateAssignRequest request = CandidateAssignRequest.builder()
                .instructorId(instructor1.getId())
                .message("Review candidate")
                .build();

        mockMvc.perform(post("/api/engineer/candidates/" + pendingCandidate.getId() + "/assign")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Assignment rejected with 409 Conflict if candidate has no uploaded resume")
    void testAssignCandidateNoResumeConflict() throws Exception {
        Candidate verifiedWithoutResume = candidateRepository.save(Candidate.builder()
                .fullName("No Resume Candidate")
                .email("noresume@example.com")
                .college("Test College")
                .degree("B.E.")
                .department("CSE")
                .graduationYear(2025)
                .appliedRole("Java Developer")
                .applicationId("APP-NORES-01")
                .status(CandidateStatus.VERIFIED)
                .build());

        CandidateAssignRequest request = CandidateAssignRequest.builder()
                .instructorId(instructor1.getId())
                .message("Review candidate")
                .build();

        mockMvc.perform(post("/api/engineer/candidates/" + verifiedWithoutResume.getId() + "/assign")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Duplicate active assignment rejected with 409 Conflict")
    void testDuplicateActiveAssignmentConflict() throws Exception {
        Candidate candidate = createCandidateWithResume("APP-DUP-01", "sarah.dup@example.com", CandidateStatus.VERIFIED);

        CandidateAssignRequest request = CandidateAssignRequest.builder()
                .instructorId(instructor1.getId())
                .message("First assignment")
                .build();

        // 1st Assignment -> 201
        mockMvc.perform(post("/api/engineer/candidates/" + candidate.getId() + "/assign")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());

        // 2nd Assignment to same instructor -> 409
        mockMvc.perform(post("/api/engineer/candidates/" + candidate.getId() + "/assign")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("DUPLICATE_RESOURCE"));
    }

    @Test
    @DisplayName("Instructor Data Isolation: Instructor 1 cannot view Candidate assigned to Instructor 2")
    void testInstructorDataIsolation() throws Exception {
        Candidate candidateA = createCandidateWithResume("APP-ISO-01", "candA@example.com", CandidateStatus.VERIFIED);
        Candidate candidateB = createCandidateWithResume("APP-ISO-02", "candB@example.com", CandidateStatus.VERIFIED);

        // Assign Candidate A to Instructor 1
        CandidateAssignRequest reqA = CandidateAssignRequest.builder()
                .instructorId(instructor1.getId())
                .message("Assign to Instructor 1")
                .build();

        mockMvc.perform(post("/api/engineer/candidates/" + candidateA.getId() + "/assign")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqA)))
                .andExpect(status().isCreated());

        // Assign Candidate B to Instructor 2
        CandidateAssignRequest reqB = CandidateAssignRequest.builder()
                .instructorId(instructor2.getId())
                .message("Assign to Instructor 2")
                .build();

        mockMvc.perform(post("/api/engineer/candidates/" + candidateB.getId() + "/assign")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reqB)))
                .andExpect(status().isCreated());

        // Instructor 1 lists candidates -> only sees Candidate A
        mockMvc.perform(get("/api/instructor/candidates")
                        .header("Authorization", instructorToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].candidate.id").value(candidateA.getId().toString()));

        // Instructor 1 attempts to access Candidate B -> 404
        mockMvc.perform(get("/api/instructor/candidates/" + candidateB.getId())
                        .header("Authorization", instructorToken1))
                .andExpect(status().isNotFound());

        // Instructor 2 accesses Candidate B -> 200 OK
        mockMvc.perform(get("/api/instructor/candidates/" + candidateB.getId())
                        .header("Authorization", instructorToken2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.candidate.id").value(candidateB.getId().toString()))
                .andExpect(jsonPath("$.currentResume.fileName").value("sarah_resume.pdf"));
    }

    @Test
    @DisplayName("RBAC Security: Admin, Instructor, Candidate, and Unauthenticated rejected on engineer assign API")
    void testRbacRestrictions() throws Exception {
        Candidate candidate = createCandidateWithResume("APP-RBAC-01", "rbac.assign@example.com", CandidateStatus.VERIFIED);
        CandidateAssignRequest req = CandidateAssignRequest.builder()
                .instructorId(instructor1.getId())
                .message("Test message")
                .build();

        // Admin -> 403
        mockMvc.perform(post("/api/engineer/candidates/" + candidate.getId() + "/assign")
                        .header("Authorization", adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());

        // Instructor -> 403
        mockMvc.perform(post("/api/engineer/candidates/" + candidate.getId() + "/assign")
                        .header("Authorization", instructorToken1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());

        // Candidate -> 403
        mockMvc.perform(post("/api/engineer/candidates/" + candidate.getId() + "/assign")
                        .header("Authorization", candidateToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());

        // Unauthenticated -> 401
        mockMvc.perform(post("/api/engineer/candidates/" + candidate.getId() + "/assign")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Engineer lists available active instructors")
    void testListInstructors() throws Exception {
        mockMvc.perform(get("/api/engineer/instructors")
                        .header("Authorization", engineerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.totalElements").value(org.hamcrest.Matchers.greaterThanOrEqualTo(2)));
    }

    @Test
    @DisplayName("Instructor notifications API retrieves notifications and marks as read")
    void testInstructorNotifications() throws Exception {
        Candidate candidate = createCandidateWithResume("APP-NOTIF-01", "sarah.notif@example.com", CandidateStatus.VERIFIED);
        CandidateAssignRequest req = CandidateAssignRequest.builder()
                .instructorId(instructor1.getId())
                .message("Review candidate")
                .build();

        mockMvc.perform(post("/api/engineer/candidates/" + candidate.getId() + "/assign")
                        .header("Authorization", engineerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated());

        // Instructor gets unread count
        mockMvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", instructorToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(1));

        // Instructor gets notifications
        String notifListJson = mockMvc.perform(get("/api/notifications")
                        .header("Authorization", instructorToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("CANDIDATE_ASSIGNED"))
                .andExpect(jsonPath("$[0].status").value("UNREAD"))
                .andReturn().getResponse().getContentAsString();

        List<Notification> notifs = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(instructorUser1.getId());
        UUID notifId = notifs.get(0).getId();

        // Mark as read
        mockMvc.perform(put("/api/notifications/" + notifId + "/read")
                        .header("Authorization", instructorToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("READ"));

        // Verify unread count is 0
        mockMvc.perform(get("/api/notifications/unread-count")
                        .header("Authorization", instructorToken1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(0));
    }
}
