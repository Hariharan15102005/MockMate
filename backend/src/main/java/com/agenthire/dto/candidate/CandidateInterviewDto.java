package com.agenthire.dto.candidate;

import com.agenthire.entity.enums.Difficulty;
import com.agenthire.entity.enums.InterviewStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateInterviewDto {
    private UUID id;
    private String title;
    private String jobRole;
    private String description;
    private Integer durationMinutes;
    private Difficulty difficulty;
    private InterviewStatus status;
    private Boolean adaptiveQuestioningEnabled;
    private Integer roundCount;
    private String instructorName;
    private UUID activeSessionId;
    private String sessionStatus;
    private List<String> roundNames;
}
