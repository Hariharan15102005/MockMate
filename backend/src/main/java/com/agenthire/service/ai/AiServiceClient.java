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
}
