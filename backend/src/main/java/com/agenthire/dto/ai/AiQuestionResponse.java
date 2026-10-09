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
public class AiQuestionResponse {

    @JsonProperty("question_text")
    private String questionText;

    @JsonProperty("full_speech_text")
    private String fullSpeechText;

    @JsonProperty("topic")
    private String topic;

    @JsonProperty("question_category")
    private String questionCategory;

    @JsonProperty("question_source")
    private String questionSource;

    @JsonProperty("hints")
    private List<String> hints;

    @JsonProperty("ideal_key_points")
    private List<String> idealKeyPoints;

    @JsonProperty("sample_solution")
    private String sampleSolution;

    @JsonProperty("difficulty")
    private String difficulty;

    @JsonProperty("semantic_fingerprint")
    private String semanticFingerprint;

    @JsonProperty("subtopic")
    private String subtopic;

    @JsonProperty("skill")
    private String skill;

    @JsonProperty("project")
    private String project;

    @JsonProperty("angle")
    private String angle;

    @JsonProperty("question_type")
    private String questionType;
}
