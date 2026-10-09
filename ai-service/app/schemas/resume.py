from typing import List, Optional
from pydantic import BaseModel, Field

class ResumeAnalysisRequest(BaseModel):
    candidate_id: str = Field(..., description="Unique Candidate UUID")
    resume_id: str = Field(..., description="Unique Resume UUID")
    resume_text: str = Field(..., description="Extracted plain text of the candidate resume")
    applied_role: str = Field(..., description="Role applied for by the candidate")

class EducationItem(BaseModel):
    degree: Optional[str] = None
    field: Optional[str] = None
    institution: Optional[str] = None
    graduation_year: Optional[int] = None

class ExperienceItem(BaseModel):
    company: Optional[str] = None
    role: Optional[str] = None
    duration: Optional[str] = None
    description: Optional[str] = None

class ProjectItem(BaseModel):
    name: str
    technologies: List[str] = Field(default_factory=list)
    description: Optional[str] = None

class RoleRelevance(BaseModel):
    score: float = Field(..., ge=0.0, le=100.0, description="Relevance score between 0.0 and 100.0")
    reason: str = Field(..., description="Objective rationale for role alignment")

class ResumeAnalysisResponse(BaseModel):
    resume_id: str
    candidate_id: str
    summary: str
    skills: List[str] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    frameworks: List[str] = Field(default_factory=list)
    databases: List[str] = Field(default_factory=list)
    tools: List[str] = Field(default_factory=list)
    education: List[EducationItem] = Field(default_factory=list)
    experience: List[ExperienceItem] = Field(default_factory=list)
    projects: List[ProjectItem] = Field(default_factory=list)
    certifications: List[str] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    potential_gaps: List[str] = Field(default_factory=list)
    role_relevance: RoleRelevance
    analysis_version: str = "1.0.0"
