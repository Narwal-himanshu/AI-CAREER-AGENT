from pydantic import BaseModel, Field
from typing import List, Literal, Optional

class TimelineRisk(BaseModel):
    level: Literal["Low", "Medium", "High"]
    reason: str
    months_needed: int
    months_available: int
    is_achievable: bool

class SkillGap(BaseModel):
    area: str
    severity: Literal["Low", "Medium", "High", "Critical"]
    description: str
    fix_timeline_weeks: int
    priority: int = Field(..., description="Priority priority ranking (1 to 3)")

class StrategicRisk(BaseModel):
    risk: str
    impact: str
    mitigation: str

class RiskOutput(BaseModel):
    overall_risk_level: Literal["Low", "Medium", "High", "Critical"]
    timeline_risk: TimelineRisk
    skill_gaps: List[SkillGap]
    strategic_risks: List[StrategicRisk]
    quick_wins: List[str]
    red_flags: List[str]
    risk_summary: str = Field(..., description="2-sentence plain-English summary of the single biggest concern and what to do about it")
