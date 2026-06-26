from pydantic import BaseModel, Field
from typing import List, Dict, Literal, Optional
from datetime import datetime

class TopicScore(BaseModel):
    score: int = Field(..., description="Score percentage (0-100)")
    correct: int = Field(..., description="Number of correct answers")
    total: int = Field(..., description="Total questions")

class CategoryScores(BaseModel):
    dsa: int = Field(..., description="DSA score percentage")
    programming: int = Field(..., description="Programming score percentage")
    logic: int = Field(..., description="Logic score percentage")
    domain_specific: int = Field(..., description="Domain score percentage")

class DifficultyScoreDetail(BaseModel):
    correct: int = Field(..., description="Number of correct answers")
    total: int = Field(..., description="Total questions")
    percentage: int = Field(..., description="Score percentage (0-100)")

class DifficultyPerformance(BaseModel):
    easy: DifficultyScoreDetail
    medium: DifficultyScoreDetail
    hard: DifficultyScoreDetail

class BehaviouralSignals(BaseModel):
    rushed: bool
    consistent: bool
    struggled_on: List[str]

class SkillProfileOutput(BaseModel):
    student_id: Optional[str] = None
    overall_score: int = Field(..., description="Overall score percentage")
    level: Literal["Beginner", "Intermediate", "Advanced"]
    topic_scores: Dict[str, TopicScore]
    category_scores: CategoryScores
    difficulty_performance: DifficultyPerformance
    strong_areas: List[str]
    weak_areas: List[str]
    avg_time_per_question_seconds: float
    behavioural_signals: BehaviouralSignals
    classification_reason: str
    confidence: float = Field(..., description="Confidence score")
    classifier_version: Optional[str] = None
    classified_at: Optional[datetime] = None
