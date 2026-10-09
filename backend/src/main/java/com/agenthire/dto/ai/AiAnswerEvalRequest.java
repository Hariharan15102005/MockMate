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
public class AiAnswerEvalRequest {

    @JsonProperty("session_id")
    private String sessionId;

    @JsonProperty("round_type")
    private String roundType;

    @JsonProperty("question_text")
    private String questionText;

    @JsonProperty("candidate_answer")
    private String candidateAnswer;

    @JsonProperty("ideal_key_points")
    private List<String> idealKeyPoints;

    @JsonProperty("rubric")
    private Map<String, Double> rubric;
}
