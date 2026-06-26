from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class SummarySkillProfile(BaseModel):
    level: Literal["Beginner", "Intermediate", "Advanced"]
    strengths: List[str]
    gaps: List[str]
    readiness_score: int = Field(..., description="Readiness score percentage (0-100)")

class SummaryOutput(BaseModel):
    summary_text: str = Field(..., description="2-3 sentence natural language summary of the student")
    skill_profile: SummarySkillProfile
    focus_areas: List[str]
    estimated_placement_readiness: Literal["6 months", "12 months", "18 months", "24 months"]
    recommended_next_step: str = Field(..., description="Single most important action the student should take right now")
    agent_context_tags: List[str] = Field(..., description="Tags used for context grouping down the line")
