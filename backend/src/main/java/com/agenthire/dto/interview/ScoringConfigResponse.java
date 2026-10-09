package com.agenthire.dto.interview;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoringConfigResponse {
    private UUID id;
    private Integer technicalWeight;
    private Integer codingWeight;
    private Integer problemSolvingWeight;
    private Integer communicationWeight;
    private Integer learningWeight;
    private Integer behavioralWeight;
    private Integer timeConstrainedWeight;
    private Integer totalWeight;
    private Boolean isValidTotal;
}
