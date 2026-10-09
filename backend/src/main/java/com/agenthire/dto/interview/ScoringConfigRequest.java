package com.agenthire.dto.interview;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoringConfigRequest {

    @Min(0) @Max(100)
    @Builder.Default
    private Integer technicalWeight = 25;

    @Min(0) @Max(100)
    @Builder.Default
    private Integer codingWeight = 20;

    @Min(0) @Max(100)
    @Builder.Default
    private Integer problemSolvingWeight = 15;

    @Min(0) @Max(100)
    @Builder.Default
    private Integer communicationWeight = 10;

    @Min(0) @Max(100)
    @Builder.Default
    private Integer learningWeight = 10;

    @Min(0) @Max(100)
    @Builder.Default
    private Integer behavioralWeight = 10;

    @Min(0) @Max(100)
    @Builder.Default
    private Integer timeConstrainedWeight = 10;

    public int calculateTotalWeight() {
        return (technicalWeight != null ? technicalWeight : 0) +
                (codingWeight != null ? codingWeight : 0) +
                (problemSolvingWeight != null ? problemSolvingWeight : 0) +
                (communicationWeight != null ? communicationWeight : 0) +
                (learningWeight != null ? learningWeight : 0) +
                (behavioralWeight != null ? behavioralWeight : 0) +
                (timeConstrainedWeight != null ? timeConstrainedWeight : 0);
    }
}
