package com.agenthire.dto.assignment;

import com.agenthire.dto.candidate.CandidateResponse;
import com.agenthire.dto.resume.ResumeAnalysisResponse;
import com.agenthire.dto.resume.ResumeResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstructorCandidateDetailResponse {
    private CandidateResponse candidate;
    private CandidateAssignmentDetailResponse assignment;
    private ResumeResponse currentResume;
    private ResumeAnalysisResponse resumeAnalysis;
}
