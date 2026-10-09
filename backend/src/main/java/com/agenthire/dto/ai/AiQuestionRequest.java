package com.agenthire.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiQuestionRequest {

    @JsonProperty("session_id")
    private String sessionId;

    @JsonProperty("candidate_id")
    private String candidateId;

    @JsonProperty("round_number")
    private Integer roundNumber;

    @JsonProperty("round_type")
    private String roundType;

    @JsonProperty("role")
    private String role;

    @JsonProperty("difficulty")
    private String difficulty;

    @JsonProperty("adaptive_enabled")
    private Boolean adaptiveEnabled;

    @JsonProperty("resume_context")
    private Map<String, Object> resumeContext;

    @JsonProperty("previous_interactions")
    private List<Map<String, Object>> previousInteractions;

    @JsonProperty("historical_questions")
    private List<String> historicalQuestions;

    @JsonProperty("conversation_history")
    private List<Map<String, Object>> conversationHistory;

    @JsonProperty("last_candidate_answer")
    private String lastCandidateAnswer;
}
