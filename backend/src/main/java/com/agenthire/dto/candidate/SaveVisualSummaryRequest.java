package com.agenthire.dto.candidate;

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
public class SaveVisualSummaryRequest {

    @JsonProperty("hasVisualData")
    private Boolean hasVisualData;

    @JsonProperty("analysisStatus")
    private String analysisStatus;

    @JsonProperty("totalSamplesAnalyzed")
    private Integer totalSamplesAnalyzed;

    @JsonProperty("faceVisibilityPercent")
    private Double faceVisibilityPercent;

    @JsonProperty("upperBodyVisibilityPercent")
    private Double upperBodyVisibilityPercent;

    @JsonProperty("framingSuitablePercent")
    private Double framingSuitablePercent;

    @JsonProperty("lightingAdequacyPercent")
    private Double lightingAdequacyPercent;

    @JsonProperty("sustainedAbsenceIntervals")
    private Integer sustainedAbsenceIntervals;

    @JsonProperty("multipleFaceDetections")
    private Integer multipleFaceDetections;

    @JsonProperty("summaryFeedback")
    private List<String> summaryFeedback;

    @JsonProperty("metadata")
    private Map<String, Object> metadata;
}
