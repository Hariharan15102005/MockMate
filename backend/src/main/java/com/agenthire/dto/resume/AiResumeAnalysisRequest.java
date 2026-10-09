package com.agenthire.dto.resume;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiResumeAnalysisRequest {

    @JsonProperty("candidate_id")
    private String candidateId;

    @JsonProperty("resume_id")
    private String resumeId;

    @JsonProperty("resume_text")
    private String resumeText;

    @JsonProperty("applied_role")
    private String appliedRole;
}
