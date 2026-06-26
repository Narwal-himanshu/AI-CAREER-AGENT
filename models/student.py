from pydantic import BaseModel, Field, EmailStr
from typing import List, Literal, Optional
from datetime import datetime

class StudentProfile(BaseModel):
    name: str = Field(..., description="Student's name")
    email: EmailStr = Field(..., description="Student's email address")
    year: int = Field(..., ge=1, le=4, description="College year (1 to 4)")
    branch: Literal["CSE", "IT", "ECE", "AIDS", "AIML"] = Field(..., description="Academic branch")
    cgpa: float = Field(..., ge=0.0, le=10.0, description="Cumulative Grade Point Average")
    college: str = Field(..., description="College name")
    college_tier: Literal["IIT", "NIT", "IIIT", "Tier-1", "Tier-2", "Tier-3"] = Field(..., description="College tier classification")

class TimeAndStyle(BaseModel):
    hours_per_day: int = Field(..., ge=0, le=24, description="Available study hours per day")
    preferred_style: List[Literal["Video", "Reading", "Projects", "Hands-on"]] = Field(..., description="Preferred learning styles")

class StudentOnboarding(BaseModel):
    student_id: str = Field(..., description="Unique UUID v4 identifier for the student")
    profile: StudentProfile
    domain_interest: List[Literal["Web Development", "AI/ML", "DSA/CP", "Cloud", "CyberSec", "Mobile"]] = Field(..., description="Student's primary domains of interest")
    career_goal: Literal["Placement", "GATE", "Startup", "Research", "Higher Studies"] = Field(..., description="Primary career goal")
    time_and_style: TimeAndStyle
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow, description="Creation timestamp")
