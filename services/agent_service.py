from typing import Dict, Optional, Any
from models.student import StudentOnboarding
from models.quiz import QuizSubmission, QuizResponse
from models.scoring import SkillProfileOutput
from models.summary import SummaryOutput
from models.risk import RiskOutput
from agents.question_agent import QuestionAgent
from agents.scoring_agent import ScoringAgent
from agents.summary_agent import SummaryAgent
from agents.risk_agent import RiskAgent

class AgentService:
    def __init__(self):
        self.question_agent = QuestionAgent()
        self.scoring_agent = ScoringAgent()
        self.summary_agent = SummaryAgent()
        self.risk_agent = RiskAgent()
        
        # Simple in-memory database to store onboarding profiles by student_id
        self._student_db: Dict[str, StudentOnboarding] = {}

    def save_onboarding(self, onboarding: StudentOnboarding) -> None:
        """Saves student onboarding details in the local in-memory store."""
        self._student_db[onboarding.student_id] = onboarding

    def get_onboarding(self, student_id: str) -> Optional[StudentOnboarding]:
        """Retrieves student onboarding details by student_id."""
        return self._student_db.get(student_id)

    def generate_quiz_for_student(self, onboarding: StudentOnboarding) -> QuizResponse:
        """Orchestrates quiz generation based on student onboarding profile."""
        # Save profile for later lookup when answers are submitted
        self.save_onboarding(onboarding)
        return self.question_agent.generate_quiz(onboarding)

    def submit_and_analyse_quiz(self, submission: QuizSubmission) -> Dict[str, Any]:
        """
        Runs the full assessment pipeline:
        1. Retrieve student onboarding profile
        2. Score quiz & classify level (ScoringAgent)
        3. Synthesize summary context (SummaryAgent)
        4. Assess career & timeline risks (RiskAgent)
        5. Package and return full dashboard payload
        """
        student_id = submission.student_id
        onboarding = self.get_onboarding(student_id)
        
        # Resilient fallback if student didn't onboard via the API
        if not onboarding:
            # Generate a standard dummy onboarding profile so the pipeline doesn't break
            from models.student import StudentProfile, TimeAndStyle
            import datetime
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
                created_at=datetime.datetime.utcnow()
            )
            # Store it for future calls
            self.save_onboarding(onboarding)

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

        # Return full dashboard payload
        return {
            "student_id": student_id,
            "skill_profile": skill_profile,
            "summary": summary,
            "risk_report": risk
        }

# Singleton instance
agent_service = AgentService()
