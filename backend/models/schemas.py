from pydantic import BaseModel, Field
from typing import List, Optional, Any, Literal

# ==========================================
# Agent 1: CareerRoadmapAgent Schemas
# ==========================================

class CareerRoadmapRequest(BaseModel):
    name: str
    year: int = Field(..., ge=1, le=4)
    domain: Literal["Web Dev", "AI/ML", "DSA/CP", "Cloud", "CyberSec", "Mobile"]
    career_goal: Literal["Placement", "GATE", "Startup", "Research", "Higher Studies"]
    level: Literal["Beginner", "Intermediate", "Advanced"]
    hours_per_day: int = Field(..., ge=1, le=24)
    college_tier: Literal["IIT", "NIT", "Tier-1", "Tier-2", "Tier-3"]

class Project(BaseModel):
    title: str
    description: str
    tech_stack: List[str]

class Resource(BaseModel):
    name: str
    type: Literal["YouTube", "Course", "Book", "Platform"]
    url: str
    is_free: bool

class PlanYear(BaseModel):
    year: int
    theme: str
    focus_areas: List[str]
    monthly_goals: List[str]
    skills_to_learn: List[str]
    projects_to_build: List[Project]
    resources: List[Resource]
    milestone: str
    dsa_target: str
    internship_target: Optional[str] = None

class CareerRoadmapResponse(BaseModel):
    student_name: str
    domain: str
    career_goal: str
    total_years: int
    plan: List[PlanYear]
    quick_start: str

# ==========================================
# Agent 2: DSAPracticeAgent Schemas
# ==========================================

class DSAPracticeRequest(BaseModel):
    level: Literal["Beginner", "Intermediate", "Advanced"]
    domain: str
    topic: str = "all"
    topics: List[str] = Field(default_factory=lambda: ["all"])

class Problem(BaseModel):
    order: int
    topic: str
    problem_title: str
    problem_id: str
    difficulty: str
    leetcode_url: str
    why_important: str
    approach_hint: str
    time_to_solve_minutes: int
    tags: List[str]

class DSAPracticeResponse(BaseModel):
    level: str
    topic_focus: str
    sheet: List[Problem]
    study_plan: str
    daily_target: str

# ==========================================
# Agent 3: CourseRecommendationAgent Schemas
# ==========================================

class CourseRecommendationRequest(BaseModel):
    domain: str
    level: Literal["Beginner", "Intermediate", "Advanced"]
    career_goal: str
    hours_per_day: int

class Recommendation(BaseModel):
    rank: int
    title: str
    platform: str
    url: str
    type: Literal["YouTube", "MOOC", "Website", "Book"]
    duration_hours: int
    is_free: bool
    why_recommended: str
    best_for: str
    weekly_hours_needed: int
    completion_weeks: int

class CourseRecommendationResponse(BaseModel):
    domain: str
    level: str
    recommendations: List[Recommendation]
    learning_path: str
    total_hours: int

# ==========================================
# Agent 4: OpportunitiesAgent Schemas
# ==========================================

class OpportunitiesRequest(BaseModel):
    domain: str
    level: Literal["Beginner", "Intermediate", "Advanced"]
    types: List[Literal["Hackathon", "CTF", "Contest", "Internship", "Open Source"]]

class Opportunity(BaseModel):
    title: str
    type: Literal["Hackathon", "CTF", "Contest", "Internship", "Open Source"]
    organiser: str
    url: str
    deadline: Optional[str] = None
    prize_or_perk: Optional[str] = None
    difficulty_level: Literal["Beginner", "All Levels", "Advanced"]
    domain_tags: List[str]
    why_apply: str
    registration_free: bool
    duration: str

class OpportunitiesResponse(BaseModel):
    fetched_at: str
    total_found: int
    opportunities: List[Opportunity]
    spotlight: str
    notice: Optional[str] = None
