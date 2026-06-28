from typing import Dict, Optional, Any
import json
import logging
from datetime import datetime

from models.student import StudentOnboarding, StudentProfile, TimeAndStyle
from models.quiz import QuizSubmission, QuizResponse
from models.scoring import SkillProfileOutput
from models.summary import SummaryOutput
from models.risk import RiskOutput
from agents.question_agent import QuestionAgent
from agents.scoring_agent import ScoringAgent
from agents.summary_agent import SummaryAgent
from agents.risk_agent import RiskAgent
from database import get_db_connection, get_or_create_student_by_firebase_uid

logger = logging.getLogger(__name__)

class AgentService:
    def __init__(self):
        self.question_agent = QuestionAgent()
        self.scoring_agent = ScoringAgent()
        self.summary_agent = SummaryAgent()
        self.risk_agent = RiskAgent()

    def get_or_create_student(self, firebase_uid: str, name: str, email: str) -> str:
        """Retrieves student_id or creates a bare student row, returning student_id."""
        return get_or_create_student_by_firebase_uid(firebase_uid, name, email)

    def save_onboarding(self, student_id: str, onboarding: StudentOnboarding) -> None:
        """Saves student onboarding details in the SQLite persistent database (idempotent UPDATE)."""
        logger.info(f"Saving onboarding for student: {student_id}")
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # We perform an UPDATE because get_or_create_student already inserts the bare record at auth stage
        cursor.execute("""
            UPDATE students 
            SET name = ?, 
                email = ?, 
                year = ?, 
                branch = ?, 
                cgpa = ?, 
                college = ?, 
                college_tier = ?, 
                domain_interest = ?, 
                career_goal = ?, 
                hours_per_day = ?, 
                preferred_style = ?, 
                created_at = ?
            WHERE student_id = ?
        """, (
            onboarding.profile.name,
            onboarding.profile.email,
            onboarding.profile.year,
            onboarding.profile.branch,
            onboarding.profile.cgpa,
            onboarding.profile.college,
            onboarding.profile.college_tier,
            json.dumps(onboarding.domain_interest),
            onboarding.career_goal,
            onboarding.time_and_style.hours_per_day,
            json.dumps(onboarding.time_and_style.preferred_style),
            onboarding.created_at.isoformat() if onboarding.created_at else datetime.utcnow().isoformat(),
            student_id
        ))
        
        conn.commit()
        conn.close()

    def get_onboarding(self, student_id: str) -> Optional[StudentOnboarding]:
        """Retrieves student onboarding details by student_id from SQLite."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM students WHERE student_id = ?", (student_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row or row['year'] is None:
            return None
            
        return StudentOnboarding(
            student_id=row['student_id'],
            profile=StudentProfile(
                name=row['name'],
                email=row['email'],
                year=row['year'],
                branch=row['branch'],
                cgpa=row['cgpa'],
                college=row['college'],
                college_tier=row['college_tier']
            ),
            domain_interest=json.loads(row['domain_interest']) if row['domain_interest'] else [],
            career_goal=row['career_goal'],
            time_and_style=TimeAndStyle(
                hours_per_day=row['hours_per_day'],
                preferred_style=json.loads(row['preferred_style']) if row['preferred_style'] else []
            ),
            created_at=datetime.fromisoformat(row['created_at']) if row['created_at'] else datetime.utcnow()
        )

    def generate_quiz_for_student(self, student_id: str, onboarding: StudentOnboarding) -> QuizResponse:
        """Orchestrates quiz generation based on student onboarding profile."""
        # Overwrite request student_id with auth-verified student_id
        onboarding.student_id = student_id
        self.save_onboarding(student_id, onboarding)
        return self.question_agent.generate_quiz(onboarding)

    def submit_and_analyse_quiz(self, submission: QuizSubmission, student_id: str) -> Dict[str, Any]:
        """
        Runs the full assessment pipeline and saves output (Scoring -> Summary -> Risk) via an upsert.
        """
        submission.student_id = student_id
        onboarding = self.get_onboarding(student_id)
        
        # Resilient fallback if student profile is empty
        if not onboarding:
            onboarding = StudentOnboarding(
                student_id=student_id,
                profile=StudentProfile(
                    name="Anonymous Student",
                    email="anonymous@student.in",
                    year=2,
                    branch="CSE",
                    cgpa=8.0,
                    college="BTech Institute",
                    college_tier="Tier-2"
                ),
                domain_interest=["DSA/CP"],
                career_goal="Placement",
                time_and_style=TimeAndStyle(
                    hours_per_day=2,
                    preferred_style=["Video", "Projects"]
                ),
                created_at=datetime.utcnow()
            )
            self.save_onboarding(student_id, onboarding)

        profile = onboarding.profile
        primary_domain = onboarding.domain_interest[0] if onboarding.domain_interest else "DSA/CP"

        # 1. Scoring & Level Classification
        skill_profile = self.scoring_agent.score_quiz(
            submission=submission,
            year=profile.year,
            primary_domain=primary_domain,
            career_goal=onboarding.career_goal
        )

        # 2. Profile Summary
        summary = self.summary_agent.summarise_profile(
            onboarding=onboarding,
            skill_profile=skill_profile
        )

        # 3. Risk Assessment
        risk = self.risk_agent.assess_risk(
            onboarding=onboarding,
            summary=summary
        )

        # 4. Save results using SQL upsert on skill_profiles
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO skill_profiles (
                student_id, overall_score, level, category_scores, classification_reason, weak_areas,
                summary_text, focus_areas, recommended_next_step, overall_risk_level, risk_report, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(student_id) DO UPDATE SET
                overall_score=excluded.overall_score,
                level=excluded.level,
                category_scores=excluded.category_scores,
                classification_reason=excluded.classification_reason,
                weak_areas=excluded.weak_areas,
                summary_text=excluded.summary_text,
                focus_areas=excluded.focus_areas,
                recommended_next_step=excluded.recommended_next_step,
                overall_risk_level=excluded.overall_risk_level,
                risk_report=excluded.risk_report,
                created_at=excluded.created_at
        """, (
            student_id,
            skill_profile.overall_score,
            skill_profile.level,
            json.dumps(skill_profile.category_scores.model_dump() if hasattr(skill_profile.category_scores, 'model_dump') else skill_profile.category_scores.dict()),
            skill_profile.classification_reason,
            json.dumps(skill_profile.weak_areas),
            summary.summary_text,
            json.dumps(summary.focus_areas),
            summary.recommended_next_step,
            risk.overall_risk_level,
            json.dumps(risk.model_dump() if hasattr(risk, 'model_dump') else risk.dict()),
            datetime.utcnow().isoformat()
        ))
        conn.commit()
        conn.close()

        return {
            "student_id": student_id,
            "skill_profile": skill_profile,
            "summary": summary,
            "risk_report": risk
        }

    def get_cached_analysis(self, student_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves already saved quiz results from SQLite for returning students."""
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM skill_profiles WHERE student_id = ?", (student_id,))
        row = cursor.fetchone()
        conn.close()
        
        if not row:
            return None

        # Reconstruct structured response payload
        return {
            "student_id": student_id,
            "skill_profile": {
                "overall_score": row["overall_score"],
                "level": row["level"],
                "category_scores": json.loads(row["category_scores"]) if row["category_scores"] else {},
                "classification_reason": row["classification_reason"],
                "weak_areas": json.loads(row["weak_areas"]) if row["weak_areas"] else []
            },
            "summary": {
                "summary_text": row["summary_text"],
                "focus_areas": json.loads(row["focus_areas"]) if row["focus_areas"] else [],
                "recommended_next_step": row["recommended_next_step"]
            },
            "risk_report": json.loads(row["risk_report"]) if row["risk_report"] else {}
        }

# Singleton instance
agent_service = AgentService()
