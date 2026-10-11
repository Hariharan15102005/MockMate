package com.agenthire.config;

import com.agenthire.entity.Candidate;
import com.agenthire.entity.CandidateAssignment;
import com.agenthire.entity.Instructor;
import com.agenthire.entity.Interview;
import com.agenthire.entity.InterviewEngineer;
import com.agenthire.entity.InterviewRound;
import com.agenthire.entity.InterviewScoringConfig;
import com.agenthire.entity.Question;
import com.agenthire.entity.User;
import com.agenthire.entity.enums.AssignmentStatus;
import com.agenthire.entity.enums.CandidateStatus;
import com.agenthire.entity.enums.Difficulty;
import com.agenthire.entity.enums.InterviewRoundType;
import com.agenthire.entity.enums.InterviewStatus;
import com.agenthire.entity.enums.QuestionType;
import com.agenthire.entity.enums.UserRole;
import com.agenthire.repository.CandidateAssignmentRepository;
import com.agenthire.entity.Resume;
import com.agenthire.entity.ResumeAnalysis;
import com.agenthire.entity.enums.ResumeStatus;
import com.agenthire.repository.CandidateRepository;
import com.agenthire.repository.InstructorRepository;
import com.agenthire.repository.InterviewEngineerRepository;
import com.agenthire.repository.InterviewRepository;
import com.agenthire.repository.InterviewRoundRepository;
import com.agenthire.repository.InterviewScoringConfigRepository;
import com.agenthire.repository.QuestionRepository;
import com.agenthire.repository.ResumeAnalysisRepository;
import com.agenthire.repository.ResumeRepository;
import com.agenthire.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final InterviewEngineerRepository engineerRepository;
    private final InstructorRepository instructorRepository;
    private final CandidateRepository candidateRepository;
    private final CandidateAssignmentRepository assignmentRepository;
    private final InterviewRepository interviewRepository;
    private final InterviewRoundRepository roundRepository;
    private final QuestionRepository questionRepository;
    private final InterviewScoringConfigRepository scoringConfigRepository;
    private final ResumeRepository resumeRepository;
    private final ResumeAnalysisRepository resumeAnalysisRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin.email:admin@agenthire.ai}")
    private String adminEmail;

    @Value("${app.seed.admin.password:Admin@123456}")
    private String adminPassword;

    @Value("${app.seed.engineer.email:engineer@agenthire.ai}")
    private String engineerEmail;

    @Value("${app.seed.engineer.password:Engineer@123456}")
    private String engineerPassword;

    @Value("${app.seed.instructor.email:instructor@agenthire.ai}")
    private String instructorEmail;

    @Value("${app.seed.instructor.password:Instructor@123456}")
    private String instructorPassword;

    @Value("${app.seed.candidate.email:candidate@agenthire.ai}")
    private String candidateEmail;

    @Value("${app.seed.candidate.password:Candidate@123456}")
    private String candidatePassword;

    @Value("${app.seed.demo.enabled:true}")
    private boolean seedDemoEnabled;

    // Demo Accounts
    private static final String DEMO_INSTRUCTOR_EMAIL = "khariharan.career@gmail.com";
    private static final String DEMO_INSTRUCTOR_PASSWORD = "Hari@12345678";
    private static final String DEMO_CANDIDATE_EMAIL = "hari@gmail.com";
    private static final String DEMO_CANDIDATE_PASSWORD = "Hari@12345678";
    private static final String DEMO_INTERVIEW_TITLE = "Java Full Stack Developer — Mock Interview";

    @Override
    @Transactional
    public void run(String... args) {
        seedAdmin();
        InterviewEngineer defaultEngineer = seedEngineer();
        seedInstructor();
        Candidate defaultCandidate = seedCandidate();
        seedResumeForCandidate(defaultCandidate);

        if (seedDemoEnabled) {
            // Seed dedicated Demo Instructor & Candidate with complete published interview blueprint
            Instructor demoInstructor = seedDemoInstructor();
            Candidate demoCandidate = seedDemoCandidate();
            seedResumeForCandidate(demoCandidate);
            CandidateAssignment demoAssignment = seedDemoAssignment(demoCandidate, defaultEngineer, demoInstructor);
            seedDemoInterviewBlueprint(demoCandidate, demoAssignment, demoInstructor);
        }
    }

    private void seedAdmin() {
        if (!userRepository.existsByEmail(adminEmail.toLowerCase())) {
            User admin = userRepository.save(User.builder()
                    .fullName("Platform Administrator")
                    .email(adminEmail.toLowerCase())
                    .passwordHash(passwordEncoder.encode(adminPassword))
                    .role(UserRole.ADMIN)
                    .enabled(true)
                    .build());
            log.info("Seeded default ADMIN account: {}", admin.getEmail());
        }
    }

    private InterviewEngineer seedEngineer() {
        User user = userRepository.findByEmail(engineerEmail.toLowerCase()).orElseGet(() -> {
            User u = userRepository.save(User.builder()
                    .fullName("Sarah Jenkins")
                    .email(engineerEmail.toLowerCase())
                    .passwordHash(passwordEncoder.encode(engineerPassword))
                    .role(UserRole.INTERVIEW_ENGINEER)
                    .enabled(true)
                    .build());
            log.info("Seeded default INTERVIEW_ENGINEER account: {}", u.getEmail());
            return u;
        });

        return engineerRepository.findByUserId(user.getId()).orElseGet(() ->
                engineerRepository.save(InterviewEngineer.builder()
                        .user(user)
                        .employeeCode("ENG-DEFAULT-01")
                        .department("Technical Intake & Operations")
                        .active(true)
                        .build())
        );
    }

    private void seedInstructor() {
        if (!userRepository.existsByEmail(instructorEmail.toLowerCase())) {
            User user = userRepository.save(User.builder()
                    .fullName("Dr. Alan Turing")
                    .email(instructorEmail.toLowerCase())
                    .passwordHash(passwordEncoder.encode(instructorPassword))
                    .role(UserRole.INSTRUCTOR)
                    .enabled(true)
                    .build());

            instructorRepository.save(Instructor.builder()
                    .user(user)
                    .employeeCode("INST-DEFAULT-01")
                    .department("Software Architecture Board")
                    .specialization("Cloud Systems & Algorithms")
                    .active(true)
                    .build());

            log.info("Seeded default INSTRUCTOR account: {}", user.getEmail());
        }
    }

    private Candidate seedCandidate() {
        User user = userRepository.findByEmail(candidateEmail.toLowerCase()).orElseGet(() -> {
            User u = userRepository.save(User.builder()
                    .fullName("Hari Haran")
                    .email(candidateEmail.toLowerCase())
                    .passwordHash(passwordEncoder.encode(candidatePassword))
                    .role(UserRole.CANDIDATE)
                    .enabled(true)
                    .build());
            log.info("Seeded default CANDIDATE account: {}", u.getEmail());
            return u;
        });

        return candidateRepository.findByEmail(candidateEmail.toLowerCase()).orElseGet(() ->
                candidateRepository.save(Candidate.builder()
                        .user(user)
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .appliedRole("Java Backend Developer")
                        .status(CandidateStatus.PENDING_VERIFICATION)
                        .build())
        );
    }

    private Instructor seedDemoInstructor() {
        User user = userRepository.findByEmail(DEMO_INSTRUCTOR_EMAIL).orElseGet(() -> {
            User u = userRepository.save(User.builder()
                    .fullName("Hariharan K")
                    .email(DEMO_INSTRUCTOR_EMAIL)
                    .passwordHash(passwordEncoder.encode(DEMO_INSTRUCTOR_PASSWORD))
                    .role(UserRole.INSTRUCTOR)
                    .enabled(true)
                    .build());
            log.info("Seeded demo INSTRUCTOR account: {}", u.getEmail());
            return u;
        });

        // Ensure password is up to date
        if (!passwordEncoder.matches(DEMO_INSTRUCTOR_PASSWORD, user.getPasswordHash())) {
            user.setPasswordHash(passwordEncoder.encode(DEMO_INSTRUCTOR_PASSWORD));
            userRepository.save(user);
        }

        return instructorRepository.findByUserId(user.getId()).orElseGet(() ->
                instructorRepository.save(Instructor.builder()
                        .user(user)
                        .employeeCode("INST-HARI-01")
                        .department("Software Engineering & Architecture")
                        .specialization("Java Full Stack & Distributed Systems")
                        .active(true)
                        .build())
        );
    }

    private Candidate seedDemoCandidate() {
        User user = userRepository.findByEmail(DEMO_CANDIDATE_EMAIL).orElseGet(() -> {
            User u = userRepository.save(User.builder()
                    .fullName("Hari Haran")
                    .email(DEMO_CANDIDATE_EMAIL)
                    .passwordHash(passwordEncoder.encode(DEMO_CANDIDATE_PASSWORD))
                    .role(UserRole.CANDIDATE)
                    .enabled(true)
                    .build());
            log.info("Seeded demo CANDIDATE account: {}", u.getEmail());
            return u;
        });

        // Ensure password is up to date
        if (!passwordEncoder.matches(DEMO_CANDIDATE_PASSWORD, user.getPasswordHash())) {
            user.setPasswordHash(passwordEncoder.encode(DEMO_CANDIDATE_PASSWORD));
            userRepository.save(user);
        }

        return candidateRepository.findByEmail(DEMO_CANDIDATE_EMAIL).orElseGet(() ->
                candidateRepository.save(Candidate.builder()
                        .user(user)
                        .applicationId("MOCKMATE-DEMO-001")
                        .fullName("Hari Haran")
                        .email(DEMO_CANDIDATE_EMAIL)
                        .phone("+91 9876543210")
                        .appliedRole("Java Full Stack Developer")
                        .experienceLevel("Fresher")
                        .degree("B.Tech Computer Science")
                        .department("Software Engineering")
                        .college("Anna University")
                        .graduationYear(2024)
                        .location("Chennai, India")
                        .status(CandidateStatus.ACCEPTED_BY_INSTRUCTOR)
                        .build())
        );
    }

    private CandidateAssignment seedDemoAssignment(Candidate candidate, InterviewEngineer engineer, Instructor instructor) {
        List<CandidateAssignment> existing = assignmentRepository.findByCandidateId(candidate.getId());
        for (CandidateAssignment ca : existing) {
            if (ca.getInstructor().getId().equals(instructor.getId()) && ca.getStatus() == AssignmentStatus.ACCEPTED) {
                return ca;
            }
        }

        CandidateAssignment assignment = CandidateAssignment.builder()
                .candidate(candidate)
                .interviewEngineer(engineer)
                .instructor(instructor)
                .appliedRole("Java Full Stack Developer")
                .interviewType("TECHNICAL")
                .priority("HIGH")
                .engineerMessage("Candidate verified and assigned for Java Full Stack Mock Assessment.")
                .status(AssignmentStatus.ACCEPTED)
                .assignedAt(Instant.now())
                .acceptedBy(instructor.getUser())
                .acceptedAt(Instant.now())
                .build();

        log.info("Seeded demo CandidateAssignment (ACCEPTED) for candidate {}", candidate.getEmail());
        return assignmentRepository.save(assignment);
    }

    private void seedDemoInterviewBlueprint(Candidate candidate, CandidateAssignment assignment, Instructor instructor) {
        List<Interview> existingInterviews = interviewRepository.findByCreatedById(instructor.getId());
        for (Interview interview : existingInterviews) {
            if (DEMO_INTERVIEW_TITLE.equalsIgnoreCase(interview.getTitle()) &&
                    interview.getCandidate() != null &&
                    interview.getCandidate().getId().equals(candidate.getId())) {
                log.info("Demo Interview Blueprint '{}' already exists. Skipping recreation.", DEMO_INTERVIEW_TITLE);
                return;
            }
        }

        // 1. Create Published Interview
        Interview interview = Interview.builder()
                .title(DEMO_INTERVIEW_TITLE)
                .targetRole("Java Full Stack Developer")
                .description("Comprehensive Java Full Stack assessment blueprint evaluating Core Java, Spring Boot, Live Coding, SQL, Basic System Design, and Behavioral fit.")
                .experienceLevel("JUNIOR")
                .durationMinutes(45)
                .difficulty(Difficulty.MEDIUM)
                .status(InterviewStatus.PUBLISHED)
                .createdBy(instructor)
                .candidate(candidate)
                .candidateAssignment(assignment)
                .isAdaptive(true)
                .publishedAt(Instant.now())
                .build();

        interview = interviewRepository.save(interview);
        log.info("Created Demo Published Interview ID: {}", interview.getId());

        // 2. Create 8 Deterministic Rounds
        // Round 1: INTRODUCTION
        InterviewRound r1 = roundRepository.save(InterviewRound.builder()
                .interview(interview)
                .name("Introduction")
                .roundType(InterviewRoundType.INTRODUCTION)
                .sequenceNumber(1)
                .durationMinutes(5)
                .questionCount(2)
                .difficulty(Difficulty.EASY)
                .questionType(QuestionType.TEXT)
                .instructions("Warm up and background discovery.")
                .build());

        questionRepository.save(Question.builder()
                .interview(interview).round(r1)
                .questionText("Tell me about yourself and your technical background.")
                .questionType(QuestionType.TEXT).difficulty(Difficulty.EASY).sequenceNumber(1).build());

        questionRepository.save(Question.builder()
                .interview(interview).round(r1)
                .questionText("Why are you interested in a Java Full Stack Developer role?")
                .questionType(QuestionType.TEXT).difficulty(Difficulty.EASY).sequenceNumber(2).build());

        // Round 2: RESUME
        InterviewRound r2 = roundRepository.save(InterviewRound.builder()
                .interview(interview)
                .name("Resume & Projects")
                .roundType(InterviewRoundType.RESUME)
                .sequenceNumber(2)
                .durationMinutes(7)
                .questionCount(3)
                .difficulty(Difficulty.MEDIUM)
                .questionType(QuestionType.TEXT)
                .instructions("Deep dive into academic/personal project architectures.")
                .build());

        questionRepository.save(Question.builder()
                .interview(interview).round(r2)
                .questionText("Explain one of your most important projects and your specific contribution to it.")
                .questionType(QuestionType.TEXT).difficulty(Difficulty.MEDIUM).sequenceNumber(1).build());

        questionRepository.save(Question.builder()
                .interview(interview).round(r2)
                .questionText("What was the most difficult technical problem you faced while building your project, and how did you solve it?")
                .questionType(QuestionType.TEXT).difficulty(Difficulty.MEDIUM).sequenceNumber(2).build());

        questionRepository.save(Question.builder()
                .interview(interview).round(r2)
                .questionText("Explain the architecture of your project from frontend to backend and database.")
                .questionType(QuestionType.TEXT).difficulty(Difficulty.MEDIUM).sequenceNumber(3).build());

        // Round 3: TECHNICAL
        InterviewRound r3 = roundRepository.save(InterviewRound.builder()
                .interview(interview)
                .name("Java & Spring Boot Technical")
                .roundType(InterviewRoundType.TECHNICAL)
                .sequenceNumber(3)
                .durationMinutes(10)
                .questionCount(4)
                .difficulty(Difficulty.MEDIUM)
                .questionType(QuestionType.TEXT)
                .instructions("Core Java, OOP principles, and Spring Boot framework essentials.")
                .build());

        questionRepository.save(Question.builder()
                .interview(interview).round(r3)
                .questionText("What is the difference between HashMap and ConcurrentHashMap in Java?")
                .questionType(QuestionType.TEXT).difficulty(Difficulty.MEDIUM).sequenceNumber(1).build());

        questionRepository.save(Question.builder()
                .interview(interview).round(r3)
                .questionText("Explain the four pillars of Object-Oriented Programming with Java examples.")
                .questionType(QuestionType.TEXT).difficulty(Difficulty.MEDIUM).sequenceNumber(2).build());

        questionRepository.save(Question.builder()
                .interview(interview).round(r3)
                .questionText("What is dependency injection in Spring Boot and why is it useful?")
                .questionType(QuestionType.TEXT).difficulty(Difficulty.MEDIUM).sequenceNumber(3).build());

        questionRepository.save(Question.builder()
                .interview(interview).round(r3)
                .questionText("What is the difference between @Controller, @RestController and @Service in Spring Boot?")
                .questionType(QuestionType.TEXT).difficulty(Difficulty.MEDIUM).sequenceNumber(4).build());

        // Round 4: CODING
        InterviewRound r4 = roundRepository.save(InterviewRound.builder()
                .interview(interview)
                .name("Java Coding")
                .roundType(InterviewRoundType.CODING)
                .sequenceNumber(4)
                .durationMinutes(10)
                .questionCount(2)
                .difficulty(Difficulty.MEDIUM)
                .questionType(QuestionType.CODING)
                .instructions("Algorithmic problem solving and clean coding.")
                .build());

        questionRepository.save(Question.builder()
                .interview(interview).round(r4)
                .questionText("Given an integer array nums and an integer target, return the indices of the two numbers that add up to target.\n\nExample:\nnums = [2,7,11,15]\ntarget = 9\n\nOutput:\n[0,1]")
                .questionType(QuestionType.CODING).difficulty(Difficulty.MEDIUM)
                .codingLanguage("Java")
                .sampleInput("4\n2 7 11 15\n9")
                .sampleOutput("0 1")
                .sequenceNumber(1).build());

        questionRepository.save(Question.builder()
                .interview(interview).round(r4)
                .questionText("Given a string containing (), {}, and [], determine whether the input string has valid matching brackets.\n\nExample:\n\nInput:\n{[()]}\n\nOutput:\ntrue")
                .questionType(QuestionType.CODING).difficulty(Difficulty.MEDIUM)
                .codingLanguage("Java")
                .sampleInput("{[()]}")
                .sampleOutput("true")
                .sequenceNumber(2).build());

        // Round 5: SQL
        InterviewRound r5 = roundRepository.save(InterviewRound.builder()
                .interview(interview)
                .name("SQL & Database")
                .roundType(InterviewRoundType.SQL)
                .sequenceNumber(5)
                .durationMinutes(5)
                .questionCount(2)
                .difficulty(Difficulty.MEDIUM)
                .questionType(QuestionType.SQL)
                .instructions("Relational schema design and query optimization.")
                .build());

        questionRepository.save(Question.builder()
                .interview(interview).round(r5)
                .questionText("Write a SQL query to find the second highest salary from an Employee table.")
                .questionType(QuestionType.SQL).difficulty(Difficulty.MEDIUM).sequenceNumber(1).build());

        questionRepository.save(Question.builder()
                .interview(interview).round(r5)
                .questionText("Explain the difference between INNER JOIN, LEFT JOIN and RIGHT JOIN with an example.")
                .questionType(QuestionType.SQL).difficulty(Difficulty.EASY).sequenceNumber(2).build());

        // Round 6: SYSTEM_DESIGN
        InterviewRound r6 = roundRepository.save(InterviewRound.builder()
                .interview(interview)
                .name("Basic System Design")
                .roundType(InterviewRoundType.SYSTEM_DESIGN)
                .sequenceNumber(6)
                .durationMinutes(5)
                .questionCount(1)
                .difficulty(Difficulty.MEDIUM)
                .questionType(QuestionType.SYSTEM_DESIGN)
                .instructions("High level architecture and component design.")
                .build());

        questionRepository.save(Question.builder()
                .interview(interview).round(r6)
                .questionText("Design a simple e-commerce application that supports users, products, carts and orders. Explain the major components, APIs and database design.")
                .questionType(QuestionType.SYSTEM_DESIGN).difficulty(Difficulty.MEDIUM).sequenceNumber(1).build());

        // Round 7: BEHAVIORAL
        InterviewRound r7 = roundRepository.save(InterviewRound.builder()
                .interview(interview)
                .name("Behavioral & HR")
                .roundType(InterviewRoundType.BEHAVIORAL)
                .sequenceNumber(7)
                .durationMinutes(3)
                .questionCount(2)
                .difficulty(Difficulty.MEDIUM)
                .questionType(QuestionType.BEHAVIORAL)
                .instructions("Situational judgment and adaptability.")
                .build());

        questionRepository.save(Question.builder()
                .interview(interview).round(r7)
                .questionText("Tell me about a time when you faced a difficult technical problem and how you handled it.")
                .questionType(QuestionType.BEHAVIORAL).difficulty(Difficulty.MEDIUM).sequenceNumber(1).build());

        questionRepository.save(Question.builder()
                .interview(interview).round(r7)
                .questionText("How do you handle learning a technology that you have never used before?")
                .questionType(QuestionType.BEHAVIORAL).difficulty(Difficulty.EASY).sequenceNumber(2).build());

        // Round 8: CLOSING
        InterviewRound r8 = roundRepository.save(InterviewRound.builder()
                .interview(interview)
                .name("Closing")
                .roundType(InterviewRoundType.CLOSING)
                .sequenceNumber(8)
                .durationMinutes(2)
                .questionCount(1)
                .difficulty(Difficulty.EASY)
                .questionType(QuestionType.TEXT)
                .instructions("Wrap up and candidate questions.")
                .build());

        questionRepository.save(Question.builder()
                .interview(interview).round(r8)
                .questionText("Do you have any questions for the interviewer?")
                .questionType(QuestionType.TEXT).difficulty(Difficulty.EASY).sequenceNumber(1).build());

        // 3. Create Scoring Rubric (Total = 100%)
        scoringConfigRepository.save(InterviewScoringConfig.builder()
                .interview(interview)
                .technicalWeight(25)
                .codingWeight(25)
                .problemSolvingWeight(10)
                .communicationWeight(10)
                .learningWeight(10)
                .behavioralWeight(10)
                .timeConstrainedWeight(10) // Representing SQL / System Design / Time constraint
                .build());

        log.info("Successfully seeded demo interview blueprint with 8 rounds, 17 questions, and 100% scoring rubric!");
    }

    private void seedResumeForCandidate(Candidate candidate) {
        if (candidate == null || resumeRepository.existsByCandidateId(candidate.getId())) {
            return;
        }

        Resume resume = resumeRepository.save(Resume.builder()
                .candidate(candidate)
                .fileName("Hari_Haran_Resume.pdf")
                .filePath("storage/resumes/demo/Hari_Haran_Resume.pdf")
                .fileType("application/pdf")
                .fileSize(204800L)
                .uploadedBy(candidate.getUser())
                .uploadedAt(Instant.now())
                .version(1)
                .isCurrent(true)
                .status(ResumeStatus.ANALYZED)
                .extractedText(
                        candidate.getFullName().toUpperCase() + "\n" +
                        "Full Stack Software Engineer | Chennai, India | " + candidate.getEmail() + " | +91 9876543210\n\n" +
                        "EDUCATION\n" +
                        "Anna University — B.Tech in Computer Science and Engineering (2020 - 2024) | GPA: 8.8/10\n\n" +
                        "TECHNICAL SKILLS\n" +
                        "Languages: Java, JavaScript, Python, SQL\n" +
                        "Frameworks & Libraries: Spring Boot, React, LangChain, Hibernate\n" +
                        "Databases: MySQL, ChromaDB (Vector Store), Redis\n" +
                        "Tools & Cloud: Docker, Git, REST APIs, JWT, Maven, Linux\n\n" +
                        "PROJECTS\n" +
                        "LearnSphere — AI-Powered Learning Experience Platform\n" +
                        "- Architected a full-stack educational system using Spring Boot, React, MySQL, and a Retrieval-Augmented Generation (RAG) assistant.\n" +
                        "- Designed high-throughput RESTful backend APIs with Spring Boot, handling authentication, course catalog, and submission endpoints.\n" +
                        "- Built a custom RAG pipeline integrating LangChain and ChromaDB for vector retrieval of lecture notes and textbook embeddings.\n" +
                        "- Implemented stateless JWT security with role-based access control (RBAC) and data protection.\n" +
                        "- Modeled relational MySQL schema with composite indexing and transaction boundaries for reliable enrollment and grading.\n" +
                        "- Developed reactive, responsive client components in React with modular state management and real-time query feedback.\n\n" +
                        "EXPERIENCE\n" +
                        "TechCorp Solutions — Software Engineering Intern (Jan 2024 - Jun 2024)\n" +
                        "- Contributed to microservices development using Java and Spring Boot.\n" +
                        "- Optimized database queries in MySQL, reducing API latency by 35%.\n" +
                        "- Participated in code reviews, CI/CD pipelines with Docker, and unit testing with JUnit."
                )
                .build());

        resumeAnalysisRepository.save(ResumeAnalysis.builder()
                .resume(resume)
                .summary("Full Stack Software Engineer with expertise in Java, Spring Boot, React, MySQL, and RAG pipelines using LangChain and ChromaDB. Proven experience building scalable REST microservices and intelligent retrieval systems.")
                .skillsJson("[\"Java\",\"Spring Boot\",\"React\",\"MySQL\",\"RAG\",\"LangChain\",\"ChromaDB\",\"JWT\",\"REST APIs\",\"Docker\",\"Git\",\"Redis\"]")
                .languagesJson("[\"Java\",\"JavaScript\",\"Python\",\"SQL\"]")
                .frameworksJson("[\"Spring Boot\",\"React\",\"LangChain\",\"Hibernate\"]")
                .databasesJson("[\"MySQL\",\"ChromaDB\",\"Redis\"]")
                .toolsJson("[\"Docker\",\"Git\",\"Maven\",\"Linux\"]")
                .educationJson("[{\"degree\":\"B.Tech\",\"field\":\"Computer Science and Engineering\",\"institution\":\"Anna University\",\"graduationYear\":\"2024\"}]")
                .experienceJson("[{\"role\":\"Software Engineering Intern\",\"company\":\"TechCorp Solutions\",\"description\":\"Developed Spring Boot APIs, optimized MySQL queries, and built vector retrieval features.\"}]")
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

        log.info("Seeded analyzed Resume & ResumeAnalysis for candidate: {}", candidate.getEmail());
    }
}
