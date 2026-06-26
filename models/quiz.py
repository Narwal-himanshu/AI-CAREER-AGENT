from pydantic import BaseModel, Field
from typing import List, Dict, Literal, Optional
from datetime import datetime

class OptionsModel(BaseModel):
    A: str = Field(..., description="Option A text")
    B: str = Field(..., description="Option B text")
    C: str = Field(..., description="Option C text")
    D: str = Field(..., description="Option D text")

class Question(BaseModel):
    question_id: str = Field(..., description="Unique question ID, e.g. q_001")
    question_text: str = Field(..., description="The main body of the question")
    options: OptionsModel = Field(..., description="Four options mapped from A to D")
    correct_option: Literal["A", "B", "C", "D"] = Field(..., description="The correct answer option")
    explanation: str = Field(..., description="Explanation of the correct answer")
    topic: str = Field(..., description="The topic of the question")
    difficulty: Literal["Easy", "Medium", "Hard"] = Field(..., description="Difficulty level")
    estimated_time_seconds: int = Field(..., description="Estimated time to complete in seconds")

class QuizResponse(BaseModel):
    questions: List[Question] = Field(..., description="Generated quiz questions")

class QuizAnswerItem(BaseModel):
    question_id: str = Field(..., description="ID of the question answered")
    question_text: str = Field(..., description="Text of the question")
    selected_option: Literal["A", "B", "C", "D"] = Field(..., description="Option selected by student")
    correct_option: Literal["A", "B", "C", "D"] = Field(..., description="The actual correct option")
    topic: str = Field(..., description="Topic of the question")
    difficulty: Literal["Easy", "Medium", "Hard"] = Field(..., description="Difficulty of the question")
    time_taken_seconds: int = Field(..., ge=0, description="Time taken to answer in seconds")

class QuizSubmission(BaseModel):
    student_id: str = Field(..., description="UUID v4 of the student")
    session_id: str = Field(..., description="UUID v4 of the quiz session")
    quiz_answers: List[QuizAnswerItem] = Field(..., description="Answers submitted by the student")
    total_time_seconds: int = Field(..., ge=0, description="Total time taken for the quiz")
    submitted_at: Optional[datetime] = Field(default_factory=datetime.utcnow, description="Submission timestamp")
