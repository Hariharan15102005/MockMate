package com.agenthire.dto;

import com.agenthire.entity.enums.Difficulty;
import com.agenthire.entity.enums.InterviewRoundType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewRoundResponse {
    private UUID id;
    private UUID interviewId;
    private InterviewRoundType roundType;
    private String name;
    private Integer sequenceNumber;
    private Boolean enabled;
    private Integer durationMinutes;
    private Difficulty difficulty;
    private Integer weight;
    private String instructions;
}
