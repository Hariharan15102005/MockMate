package com.agenthire.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiAnswerEvalResponse {

    @JsonProperty("correctness_score")
    private Double correctnessScore;

    @JsonProperty("relevance_score")
    private Double relevanceScore;

    @JsonProperty("depth_score")
    private Double depthScore;

    @JsonProperty("completeness_score")
    private Double completenessScore;

    @JsonProperty("communication_score")
    private Double communicationScore;

    @JsonProperty("problem_solving_score")
    private Double problemSolvingScore;

    @JsonProperty("overall_question_score")
    private Double overallQuestionScore;

    @JsonProperty("feedback")
    private String feedback;

    @JsonProperty("strengths")
    private List<String> strengths;

    @JsonProperty("improvements")
    private List<String> improvements;
}
