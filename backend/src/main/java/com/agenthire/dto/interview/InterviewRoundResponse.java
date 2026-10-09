package com.agenthire.dto.interview;

import com.agenthire.entity.enums.Difficulty;
import com.agenthire.entity.enums.InterviewRoundType;
import com.agenthire.entity.enums.QuestionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewRoundResponse {
    private UUID id;
    private InterviewRoundType roundType;
    private String name;
    private Integer sequenceNumber;
    private Boolean enabled;
    private Integer durationMinutes;
    private Integer questionCount;
    private QuestionType questionType;
    private Difficulty difficulty;
    private Integer weight;
    private String instructions;
    private Instant createdAt;

    @Builder.Default
    private List<QuestionResponse> questions = new ArrayList<>();
}
