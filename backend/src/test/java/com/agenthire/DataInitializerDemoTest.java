package com.agenthire;

import com.agenthire.entity.Candidate;
import com.agenthire.entity.CandidateAssignment;
import com.agenthire.entity.Instructor;
import com.agenthire.entity.Interview;
import com.agenthire.entity.InterviewRound;
import com.agenthire.entity.InterviewScoringConfig;
import com.agenthire.entity.Question;
import com.agenthire.entity.enums.AssignmentStatus;
import com.agenthire.entity.enums.InterviewStatus;
import com.agenthire.repository.CandidateAssignmentRepository;
import com.agenthire.repository.CandidateRepository;
import com.agenthire.repository.InstructorRepository;
import com.agenthire.repository.InterviewRepository;
import com.agenthire.repository.InterviewRoundRepository;
import com.agenthire.repository.InterviewScoringConfigRepository;
import com.agenthire.repository.QuestionRepository;
import com.agenthire.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@TestPropertySource(properties = {
        "app.seed.demo.enabled=true"
})
@Transactional
class DataInitializerDemoTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InstructorRepository instructorRepository;

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private CandidateAssignmentRepository assignmentRepository;

    @Autowired
    private InterviewRepository interviewRepository;

    @Autowired
    private InterviewRoundRepository roundRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private InterviewScoringConfigRepository scoringConfigRepository;

    @Test
    @DisplayName("Verify default demo accounts, accepted assignment, and published interview blueprint are seeded correctly")
    void testDemoDataSeeding() {
        // 1. Verify Demo Instructor
        assertThat(userRepository.existsByEmail("khariharan.career@gmail.com")).isTrue();
        var instructorUser = userRepository.findByEmail("khariharan.career@gmail.com").orElse(null);
        assertThat(instructorUser).isNotNull();
        Instructor instructor = instructorRepository.findByUserId(instructorUser.getId()).orElse(null);
        assertThat(instructor).isNotNull();

        // 2. Verify Demo Candidate
        assertThat(userRepository.existsByEmail("hari@gmail.com")).isTrue();
        Candidate candidate = candidateRepository.findByEmail("hari@gmail.com").orElse(null);
        assertThat(candidate).isNotNull();
        assertThat(candidate.getApplicationId()).isEqualTo("MOCKMATE-DEMO-001");

        // 3. Verify Accepted Assignment
        List<CandidateAssignment> assignments = assignmentRepository.findByCandidateId(candidate.getId());
        assertThat(assignments).isNotEmpty();
        CandidateAssignment assignment = assignments.get(0);
        assertThat(assignment.getStatus()).isEqualTo(AssignmentStatus.ACCEPTED);
        assertThat(assignment.getInstructor().getId()).isEqualTo(instructor.getId());

        // 4. Verify Published Interview Blueprint
        List<Interview> interviews = interviewRepository.findByCreatedById(instructor.getId());
        assertThat(interviews).isNotEmpty();
        Interview interview = interviews.get(0);
        assertThat(interview.getTitle()).isEqualTo("Java Full Stack Developer — Mock Interview");
        assertThat(interview.getStatus()).isEqualTo(InterviewStatus.PUBLISHED);
        assertThat(interview.getIsAdaptive()).isTrue();
        assertThat(interview.getDurationMinutes()).isEqualTo(45);

        // 5. Verify 8 Deterministic Rounds
        List<InterviewRound> rounds = roundRepository.findByInterviewIdOrderBySequenceNumberAsc(interview.getId());
        assertThat(rounds).hasSize(8);

        // 6. Verify Questions
        List<Question> questions = questionRepository.findByInterviewIdOrderBySequenceNumberAsc(interview.getId());
        assertThat(questions).hasSize(17);

        // 7. Verify Scoring Rubric
        InterviewScoringConfig scoringConfig = scoringConfigRepository.findByInterviewId(interview.getId()).orElse(null);
        assertThat(scoringConfig).isNotNull();
        assertThat(scoringConfig.isValidTotal()).isTrue();
        assertThat(scoringConfig.calculateTotalWeight()).isEqualTo(100);
    }
}
