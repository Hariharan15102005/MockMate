package com.agenthire.config;

import com.agenthire.entity.Candidate;
import com.agenthire.entity.Instructor;
import com.agenthire.entity.InterviewEngineer;
import com.agenthire.entity.User;
import com.agenthire.entity.enums.CandidateStatus;
import com.agenthire.entity.enums.UserRole;
import com.agenthire.repository.CandidateRepository;
import com.agenthire.repository.InstructorRepository;
import com.agenthire.repository.InterviewEngineerRepository;
import com.agenthire.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final InterviewEngineerRepository engineerRepository;
    private final InstructorRepository instructorRepository;
    private final CandidateRepository candidateRepository;
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

    @Override
    @Transactional
    public void run(String... args) {
        seedAdmin();
        seedEngineer();
        seedInstructor();
        seedCandidate();
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

    private void seedEngineer() {
        if (!userRepository.existsByEmail(engineerEmail.toLowerCase())) {
            User user = userRepository.save(User.builder()
                    .fullName("Sarah Jenkins")
                    .email(engineerEmail.toLowerCase())
                    .passwordHash(passwordEncoder.encode(engineerPassword))
                    .role(UserRole.INTERVIEW_ENGINEER)
                    .enabled(true)
                    .build());

            engineerRepository.save(InterviewEngineer.builder()
                    .user(user)
                    .employeeCode("ENG-DEFAULT-01")
                    .department("Technical Intake & Operations")
                    .active(true)
                    .build());

            log.info("Seeded default INTERVIEW_ENGINEER account: {}", user.getEmail());
        }
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

    private void seedCandidate() {
        if (!userRepository.existsByEmail(candidateEmail.toLowerCase())) {
            User user = userRepository.save(User.builder()
                    .fullName("Hari Haran")
                    .email(candidateEmail.toLowerCase())
                    .passwordHash(passwordEncoder.encode(candidatePassword))
                    .role(UserRole.CANDIDATE)
                    .enabled(true)
                    .build());

            candidateRepository.save(Candidate.builder()
                    .user(user)
                    .fullName(user.getFullName())
                    .email(user.getEmail())
                    .appliedRole("Java Backend Developer")
                    .status(CandidateStatus.PENDING_VERIFICATION)
                    .build());

            log.info("Seeded default CANDIDATE account: {}", user.getEmail());
        }
    }
}
