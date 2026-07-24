from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict, Literal

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
# Agent 2: DSA Practice Schemas (Static JSON)
# ==========================================

class DSAProblem(BaseModel):
    title: str
    url: str
    difficulty: str = "MEDIUM"
    tags: List[str] = Field(default_factory=list)
    frequency: Optional[float] = None
    acceptance_rate: Optional[float] = None

class DSATopicInfo(BaseModel):
    topic_name: str
    problem_count: int

class DSACompanyInfo(BaseModel):
    company_name: str
    problem_count: int

class DSAPaginatedResponse(BaseModel):
    problems: List[DSAProblem]
    total: int
    page: int
    limit: int
    total_pages: int

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

class YouTubeRecommendation(BaseModel):
    rank: int
    title: str
    channel: str
    url: str
    type: Literal["video", "playlist"]
    duration_minutes: int = 0
    view_count: int = 0
    like_count: int = 0
    comment_count: int = 0
    score: float = 0.0
    why_recommended: str = ""
    thumbnail: str = ""
    published_at: str = ""
    item_count: Optional[int] = None

class CourseRecommendationResponse(BaseModel):
    domain: str
    level: str
    recommendations: List[Recommendation]
    learning_path: str
    total_hours: int
    top_courses: List[YouTubeRecommendation] = Field(default_factory=list)
    top_playlists: List[YouTubeRecommendation] = Field(default_factory=list)
    best_tutorials: List[YouTubeRecommendation] = Field(default_factory=list)
    best_interview_resources: List[YouTubeRecommendation] = Field(default_factory=list)

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
    page: int = 1
    total_pages: int = 1
    has_more: bool = False

# ==========================================
# Agent 5: ChatbotAgent Schemas
# ==========================================

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    message: str
    conversation_history: List[ChatMessage] = Field(default_factory=list)
    student_context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    reply: str
    sources: List[str] = Field(default_factory=list)
