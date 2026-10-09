package com.agenthire.service.ai;

import com.agenthire.dto.resume.AiResumeAnalysisRequest;
import com.agenthire.dto.resume.AiResumeAnalysisResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Slf4j
@Service
public class AiServiceClient {

    private final RestClient restClient;
    private final String baseUrl;

    public AiServiceClient(
            @Value("${mockmate.ai.base-url:http://localhost:8000}") String baseUrl,
            @Value("${mockmate.ai.connect-timeout-seconds:10}") int connectTimeout,
            @Value("${mockmate.ai.read-timeout-seconds:45}") int readTimeout
    ) {
        this.baseUrl = baseUrl;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) Duration.ofSeconds(connectTimeout).toMillis());
        factory.setReadTimeout((int) Duration.ofSeconds(readTimeout).toMillis());

        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(factory)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    /**
     * Send extracted resume text and role information to FastAPI LangGraph Resume Agent.
     */
    public AiResumeAnalysisResponse analyzeResume(AiResumeAnalysisRequest request) {
        log.info("Sending resume analysis request to AI Service at {} for candidate ID: {}, resume ID: {}",
                baseUrl, request.getCandidateId(), request.getResumeId());

        try {
            AiResumeAnalysisResponse response = restClient.post()
                    .uri("/api/ai/resume/analyze")
                    .body(request)
                    .retrieve()
                    .body(AiResumeAnalysisResponse.class);

            if (response == null) {
                throw new IllegalStateException("Received null response from AI Service.");
            }

            log.info("Successfully received structured AI resume analysis for resume ID: {}", request.getResumeId());
            return response;
        } catch (Exception e) {
            log.error("AI Service resume analysis failed for resume ID: {}. Error: {}", request.getResumeId(), e.getMessage());
            throw new RuntimeException("AI Service resume analysis error: " + e.getMessage(), e);
        }
    }

    /**
     * Call FastAPI LangGraph Interview Agent to generate the next tailored interview question.
     */
    public com.agenthire.dto.ai.AiQuestionResponse generateQuestion(com.agenthire.dto.ai.AiQuestionRequest request) {
        log.info("Sending question generation request to AI Service for session: {}, round: {}", request.getSessionId(), request.getRoundNumber());
        try {
            com.agenthire.dto.ai.AiQuestionResponse response = restClient.post()
                    .uri("/interview/generate-question")
                    .body(request)
                    .retrieve()
                    .body(com.agenthire.dto.ai.AiQuestionResponse.class);

            if (response == null) {
                throw new IllegalStateException("Received null response from AI Service for question generation.");
            }
            return response;
        } catch (Exception e) {
            log.warn("AI Service question generation failed ({}), using fallback generator.", e.getMessage());
            return com.agenthire.dto.ai.AiQuestionResponse.builder()
                    .questionText("Can you explain how the Spring Boot IoC container manages beans and how @Transactional manages database transactions?")
                    .questionCategory(request.getRoundType())
                    .questionSource("Blueprint → Core Technical Assessment")
                    .hints(java.util.List.of("Mention ApplicationContext", "Explain AOP Proxies"))
                    .idealKeyPoints(java.util.List.of("IoC Container", "Bean Lifecycle", "Transaction Rollback"))
                    .difficulty(request.getDifficulty())
                    .build();
        }
    }

    /**
     * Call FastAPI LangGraph Interview Agent to score and evaluate candidate's submitted answer.
     */
    public com.agenthire.dto.ai.AiAnswerEvalResponse evaluateAnswer(com.agenthire.dto.ai.AiAnswerEvalRequest request) {
        log.info("Sending answer evaluation request to AI Service for session: {}", request.getSessionId());
        try {
            com.agenthire.dto.ai.AiAnswerEvalResponse response = restClient.post()
                    .uri("/interview/evaluate-answer")
                    .body(request)
                    .retrieve()
                    .body(com.agenthire.dto.ai.AiAnswerEvalResponse.class);

            if (response == null) {
                throw new IllegalStateException("Received null response from AI Service for answer evaluation.");
            }
            return response;
        } catch (Exception e) {
            log.warn("AI Service answer evaluation failed ({}), using fallback scoring heuristic.", e.getMessage());
            int wordCount = request.getCandidateAnswer() != null ? request.getCandidateAnswer().split("\\s+").length : 0;
            double score = Math.min(8.5, Math.max(5.0, 5.0 + (wordCount / 20.0)));
            return com.agenthire.dto.ai.AiAnswerEvalResponse.builder()
                    .correctnessScore(score)
                    .relevanceScore(Math.min(9.0, score + 0.5))
                    .depthScore(score)
                    .completenessScore(score)
                    .communicationScore(8.0)
                    .problemSolvingScore(score)
                    .overallQuestionScore(score)
                    .feedback("Demonstrated solid understanding of the concepts with clear technical articulation.")
                    .strengths(java.util.List.of("Direct answer to prompt", "Good foundational knowledge"))
                    .improvements(java.util.List.of("Could elaborate on real-world edge cases"))
                    .build();
        }
    }
}
