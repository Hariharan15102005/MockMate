package com.agenthire;

import com.agenthire.dto.resume.AiResumeAnalysisResponse;
import com.agenthire.entity.AuditLog;
import com.agenthire.entity.Candidate;
import com.agenthire.entity.Resume;
import com.agenthire.entity.ResumeAnalysis;
import com.agenthire.entity.User;
import com.agenthire.entity.enums.CandidateStatus;
import com.agenthire.entity.enums.ResumeStatus;
import com.agenthire.entity.enums.UserRole;
import com.agenthire.repository.AuditLogRepository;
import com.agenthire.repository.CandidateRepository;
import com.agenthire.repository.ResumeAnalysisRepository;
import com.agenthire.repository.ResumeRepository;
import com.agenthire.repository.UserRepository;
import com.agenthire.security.JwtService;
import com.agenthire.service.ai.AiServiceClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class EngineerResumeWorkflowTest {

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
    private ResumeAnalysisRepository resumeAnalysisRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private AiServiceClient aiServiceClient;

    private String engineerToken;
    private String adminToken;
    private String instructorToken;
    private String candidateToken;
    private User engineerUser;

    @BeforeEach
    void setUp() {
        resumeAnalysisRepository.deleteAll();
        resumeRepository.deleteAll();
        candidateRepository.deleteAll();

        engineerUser = getOrCreateTestUser("resume.engineer@agenthire.ai", "Resume Engineer", UserRole.INTERVIEW_ENGINEER);
        User adminUser = getOrCreateTestUser("resume.admin@agenthire.ai", "Resume Admin", UserRole.ADMIN);
        User instructorUser = getOrCreateTestUser("resume.instructor@agenthire.ai", "Resume Instructor", UserRole.INSTRUCTOR);
        User candidateUser = getOrCreateTestUser("resume.candidate@agenthire.ai", "Resume Candidate", UserRole.CANDIDATE);

        engineerToken = "Bearer " + jwtService.generateToken(engineerUser);
        adminToken = "Bearer " + jwtService.generateToken(adminUser);
        instructorToken = "Bearer " + jwtService.generateToken(instructorUser);
        candidateToken = "Bearer " + jwtService.generateToken(candidateUser);

        // Setup default mock AI response
        AiResumeAnalysisResponse mockAiResponse = AiResumeAnalysisResponse.builder()
                .summary("Backend engineer with Java and Spring Boot experience.")
                .skills(List.of("Java", "Spring Boot", "MySQL", "Docker"))
                .languages(List.of("Java", "SQL"))
                .frameworks(List.of("Spring Boot"))
                .databases(List.of("MySQL"))
                .tools(List.of("Docker", "Git"))
                .education(List.of(AiResumeAnalysisResponse.EducationDto.builder()
                        .degree("B.Tech")
                        .field("Computer Science")
                        .institution("NIT")
                        .graduationYear(2025)
                        .build()))
                .experience(List.of(AiResumeAnalysisResponse.ExperienceDto.builder()
                        .company("Tech Corp")
                        .role("Software Intern")
                        .duration("6 months")
                        .description("Built REST APIs in Spring Boot")
                        .build()))
                .projects(List.of(AiResumeAnalysisResponse.ProjectDto.builder()
                        .name("MockMate Platform")
                        .technologies(List.of("Java", "Spring Boot", "MySQL"))
                        .description("AI interview platform")
                        .build()))
                .certifications(List.of("Oracle Java 11 Certified"))
                .strengths(List.of("Strong Java and microservices foundation"))
                .potentialGaps(List.of("Evaluate distributed caching depth in technical rounds"))
                .roleRelevance(AiResumeAnalysisResponse.RoleRelevanceDto.builder()
                        .score(92.5)
                        .reason("High alignment for Java Developer role")
                        .build())
                .analysisVersion("1.0.0")
                .build();

        Mockito.when(aiServiceClient.analyzeResume(any())).thenReturn(mockAiResponse);
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

    private Candidate createCandidate(String appId, String email, CandidateStatus status) {
        return candidateRepository.save(Candidate.builder()
                .fullName("Sarah Connor")
                .email(email)
                .phone("+91-9876543210")
                .location("Bengaluru, India")
                .college("Anna University")
                .degree("B.E.")
                .department("Computer Science")
                .graduationYear(2025)
                .cgpa(8.9)
                .experienceLevel("FRESHER")
                .appliedRole("Java Developer")
                .applicationId(appId)
                .source("DIRECT")
                .status(status)
                .build());
    }

    private byte[] createValidPdfBytes(String textContent) throws IOException {
        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage();
            doc.addPage(page);
            try (PDPageContentStream stream = new PDPageContentStream(doc, page)) {
                stream.beginText();
                stream.setFont(new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 12);
                stream.newLineAtOffset(50, 700);
                stream.showText(textContent);
                stream.endText();
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.save(out);
            return out.toByteArray();
        }
    }

    private byte[] createValidDocxBytes(String textContent) throws IOException {
        try (XWPFDocument doc = new XWPFDocument()) {
            XWPFParagraph p = doc.createParagraph();
            XWPFRun r = p.createRun();
            r.setText(textContent);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.write(out);
            return out.toByteArray();
        }
    }

    @Test
    @DisplayName("Upload PDF resume on VERIFIED candidate triggers text extraction and AI analysis")
    void testUploadPdfResumeSuccess() throws Exception {
        Candidate candidate = createCandidate("APP-RES-01", "sarah.res@example.com", CandidateStatus.VERIFIED);
        byte[] pdfBytes = createValidPdfBytes("SARAH CONNOR - Java Backend Developer Resume");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "sarah_resume.pdf",
                "application/pdf",
                pdfBytes
        );

        mockMvc.perform(multipart("/api/engineer/candidates/" + candidate.getId() + "/resume")
                        .file(file)
                        .header("Authorization", engineerToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.candidateId").value(candidate.getId().toString()))
                .andExpect(jsonPath("$.fileName").value("sarah_resume.pdf"))
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.isCurrent").value(true))
                .andExpect(jsonPath("$.status").value("ANALYZED"));

        // Verify Resume saved in MySQL
        List<Resume> resumes = resumeRepository.findByCandidateId(candidate.getId());
        assertEquals(1, resumes.size());
        Resume saved = resumes.get(0);
        assertEquals(ResumeStatus.ANALYZED, saved.getStatus());
        assertTrue(saved.getIsCurrent());

        // Verify ResumeAnalysis persisted
        ResumeAnalysis analysis = resumeAnalysisRepository.findByResumeId(saved.getId()).orElseThrow();
        assertEquals("Backend engineer with Java and Spring Boot experience.", analysis.getSummary());
        assertEquals(92.5, analysis.getRoleRelevanceScore());

        // Verify Audit Logs
        List<AuditLog> auditLogs = auditLogRepository.findByUserIdOrderByCreatedAtDesc(engineerUser.getId());
        boolean uploadLogged = auditLogs.stream().anyMatch(l -> "RESUME_UPLOADED".equals(l.getAction()));
        boolean analysisLogged = auditLogs.stream().anyMatch(l -> "RESUME_ANALYSIS_COMPLETED".equals(l.getAction()));
        assertTrue(uploadLogged, "Expected RESUME_UPLOADED audit log");
        assertTrue(analysisLogged, "Expected RESUME_ANALYSIS_COMPLETED audit log");
    }

    @Test
    @DisplayName("Upload DOCX resume on VERIFIED candidate succeeds")
    void testUploadDocxResumeSuccess() throws Exception {
        Candidate candidate = createCandidate("APP-RES-02", "sarah.docx@example.com", CandidateStatus.VERIFIED);
        byte[] docxBytes = createValidDocxBytes("SARAH CONNOR - Full Stack Engineer DOCX Resume");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "sarah_resume.docx",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                docxBytes
        );

        mockMvc.perform(multipart("/api/engineer/candidates/" + candidate.getId() + "/resume")
                        .file(file)
                        .header("Authorization", engineerToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fileName").value("sarah_resume.docx"))
                .andExpect(jsonPath("$.status").value("ANALYZED"));
    }

    @Test
    @DisplayName("Resume upload rejected with 409 Conflict if candidate is not VERIFIED")
    void testUploadResumeUnverifiedCandidateConflict() throws Exception {
        Candidate pendingCandidate = createCandidate("APP-UNVER-01", "unver@example.com", CandidateStatus.PENDING_VERIFICATION);
        Candidate rejectedCandidate = createCandidate("APP-REJ-01", "rej@example.com", CandidateStatus.REJECTED);
        byte[] pdfBytes = createValidPdfBytes("Resume");
        MockMultipartFile file = new MockMultipartFile("file", "resume.pdf", "application/pdf", pdfBytes);

        // PENDING_VERIFICATION -> 409
        mockMvc.perform(multipart("/api/engineer/candidates/" + pendingCandidate.getId() + "/resume")
                        .file(file)
                        .header("Authorization", engineerToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("INVALID_STATUS_TRANSITION"));

        // REJECTED -> 409
        mockMvc.perform(multipart("/api/engineer/candidates/" + rejectedCandidate.getId() + "/resume")
                        .file(file)
                        .header("Authorization", engineerToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("INVALID_STATUS_TRANSITION"));
    }

    @Test
    @DisplayName("Resume upload validation: unsupported format and empty file return 400 Bad Request")
    void testUploadValidationErrors() throws Exception {
        Candidate candidate = createCandidate("APP-VAL-01", "val@example.com", CandidateStatus.VERIFIED);

        // Unsupported extension .exe
        MockMultipartFile exeFile = new MockMultipartFile("file", "virus.exe", "application/octet-stream", new byte[]{1, 2, 3});
        mockMvc.perform(multipart("/api/engineer/candidates/" + candidate.getId() + "/resume")
                        .file(exeFile)
                        .header("Authorization", engineerToken))
                .andExpect(status().isBadRequest());

        // Empty file
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.pdf", "application/pdf", new byte[0]);
        mockMvc.perform(multipart("/api/engineer/candidates/" + candidate.getId() + "/resume")
                        .file(emptyFile)
                        .header("Authorization", engineerToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Resume versioning: uploading 2nd resume marks v1 as not current and creates v2")
    void testResumeVersioning() throws Exception {
        Candidate candidate = createCandidate("APP-VER-01", "version@example.com", CandidateStatus.VERIFIED);
        byte[] pdfBytes = createValidPdfBytes("Resume Version 1");
        MockMultipartFile file1 = new MockMultipartFile("file", "v1.pdf", "application/pdf", pdfBytes);
        MockMultipartFile file2 = new MockMultipartFile("file", "v2.pdf", "application/pdf", pdfBytes);

        // Upload version 1
        mockMvc.perform(multipart("/api/engineer/candidates/" + candidate.getId() + "/resume")
                        .file(file1)
                        .header("Authorization", engineerToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.isCurrent").value(true));

        // Upload version 2
        mockMvc.perform(multipart("/api/engineer/candidates/" + candidate.getId() + "/resume")
                        .file(file2)
                        .header("Authorization", engineerToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.version").value(2))
                .andExpect(jsonPath("$.isCurrent").value(true));

        // Verify version 1 isCurrent is now false
        List<Resume> all = resumeRepository.findByCandidateIdOrderByVersionDesc(candidate.getId());
        assertEquals(2, all.size());
        assertEquals(2, all.get(0).getVersion());
        assertTrue(all.get(0).getIsCurrent());
        assertEquals(1, all.get(1).getVersion());
        assertFalse(all.get(1).getIsCurrent());
    }

    @Test
    @DisplayName("Get resume analysis and download resume file")
    void testGetAnalysisAndDownload() throws Exception {
        Candidate candidate = createCandidate("APP-GET-01", "get@example.com", CandidateStatus.VERIFIED);
        byte[] pdfBytes = createValidPdfBytes("Downloadable PDF Content");
        MockMultipartFile file = new MockMultipartFile("file", "downloadable.pdf", "application/pdf", pdfBytes);

        String responseJson = mockMvc.perform(multipart("/api/engineer/candidates/" + candidate.getId() + "/resume")
                        .file(file)
                        .header("Authorization", engineerToken))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        Resume savedResume = resumeRepository.findByCandidateId(candidate.getId()).get(0);

        // Get Analysis
        mockMvc.perform(get("/api/engineer/resumes/" + savedResume.getId() + "/analysis")
                        .header("Authorization", engineerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary").value("Backend engineer with Java and Spring Boot experience."))
                .andExpect(jsonPath("$.roleRelevance.score").value(92.5));

        // Download File
        mockMvc.perform(get("/api/engineer/resumes/" + savedResume.getId() + "/download")
                        .header("Authorization", engineerToken))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"downloadable.pdf\""));
    }

    @Test
    @DisplayName("AI failure sets status to ANALYSIS_FAILED while preserving uploaded file and candidate state")
    void testAiFailureHandling() throws Exception {
        Candidate candidate = createCandidate("APP-FAIL-01", "fail@example.com", CandidateStatus.VERIFIED);
        byte[] pdfBytes = createValidPdfBytes("Resume text");
        MockMultipartFile file = new MockMultipartFile("file", "fail.pdf", "application/pdf", pdfBytes);

        // Simulate AI service failure
        Mockito.when(aiServiceClient.analyzeResume(any())).thenThrow(new RuntimeException("AI Service timeout"));

        mockMvc.perform(multipart("/api/engineer/candidates/" + candidate.getId() + "/resume")
                        .file(file)
                        .header("Authorization", engineerToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ANALYSIS_FAILED"));

        // Verify resume persisted with ANALYSIS_FAILED
        Resume saved = resumeRepository.findByCandidateId(candidate.getId()).get(0);
        assertEquals(ResumeStatus.ANALYSIS_FAILED, saved.getStatus());

        // Verify Candidate remains VERIFIED
        Candidate inDb = candidateRepository.findById(candidate.getId()).orElseThrow();
        assertEquals(CandidateStatus.VERIFIED, inDb.getStatus());
    }

    @Test
    @DisplayName("RBAC Security: Admin, Instructor, Candidate, and Unauthenticated are rejected on resume endpoints")
    void testRbacRestrictions() throws Exception {
        Candidate candidate = createCandidate("APP-RBAC-01", "rbac.res@example.com", CandidateStatus.VERIFIED);
        byte[] pdfBytes = createValidPdfBytes("Resume");
        MockMultipartFile file = new MockMultipartFile("file", "resume.pdf", "application/pdf", pdfBytes);

        // Admin -> 403
        mockMvc.perform(multipart("/api/engineer/candidates/" + candidate.getId() + "/resume")
                        .file(file)
                        .header("Authorization", adminToken))
                .andExpect(status().isForbidden());

        // Instructor -> 403
        mockMvc.perform(multipart("/api/engineer/candidates/" + candidate.getId() + "/resume")
                        .file(file)
                        .header("Authorization", instructorToken))
                .andExpect(status().isForbidden());

        // Candidate -> 403
        mockMvc.perform(multipart("/api/engineer/candidates/" + candidate.getId() + "/resume")
                        .file(file)
                        .header("Authorization", candidateToken))
                .andExpect(status().isForbidden());

        // Unauthenticated -> 401
        mockMvc.perform(multipart("/api/engineer/candidates/" + candidate.getId() + "/resume")
                        .file(file))
                .andExpect(status().isUnauthorized());
    }
}
