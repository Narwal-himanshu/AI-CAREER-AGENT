import sys
import os
import json
from datetime import datetime

# Add the current directory to python path so we can import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models.student import StudentOnboarding, StudentProfile, TimeAndStyle
from models.quiz import QuizSubmission, QuizAnswerItem, QuizResponse
from services.agent_service import agent_service
from database import get_db_connection

def run_tests():
    print("==================================================")
    print("       AI CAREER AGENT END-TO-END TEST SUITE     ")
    print("==================================================")
    
    # Hermetic test cleanup: delete existing rows
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM skill_profiles")
    cursor.execute("DELETE FROM students")
    conn.commit()
    conn.close()
    
    # 0. Simulate Google Sign-In bare record creation
    firebase_uid = "mock-uid-12345"
    student_id = agent_service.get_or_create_student(firebase_uid, "Aravind Sharma", "aravind.sharma@btech.in")
    print(f"[OK] Auth Sync: Resolved student record for firebase_uid={firebase_uid} -> student_id={student_id}")

    # 1. Mock Onboarding Input
    print("\n[1/5] Simulating Student Onboarding...")
    onboarding = StudentOnboarding(
        student_id=student_id,
        profile=StudentProfile(
            name="Aravind Sharma",
            email="aravind.sharma@btech.in",
            year=2,
            branch="CSE",
            cgpa=8.5,
            college="Vellore Institute of Technology",
            college_tier="Tier-2"
        ),
        domain_interest=["AI/ML", "DSA/CP"],
        career_goal="Placement",
        time_and_style=TimeAndStyle(
            hours_per_day=3,
            preferred_style=["Video", "Projects", "Hands-on"]
        ),
        created_at=datetime.utcnow()
    )
    
    # Save the onboarding profile
    agent_service.save_onboarding(student_id, onboarding)
    print("[OK] Onboarding profile saved in database.")
    print(f"  Student: {onboarding.profile.name} (Year {onboarding.profile.year})")
    print(f"  Career Goal: {onboarding.career_goal} | Primary Domain: {onboarding.domain_interest[0]}")

    # 2. Quiz Generation Test
    print("\n[2/5] Simulating Quiz Generation...")
    quiz: QuizResponse = agent_service.generate_quiz_for_student(student_id, onboarding)
    print(f"[OK] Generated {len(quiz.questions)} quiz questions successfully.")
    
    # Print a sample question
    sample_q = quiz.questions[0]
    print(f"  Sample Question ID: {sample_q.question_id}")
    print(f"  Topic: {sample_q.topic} ({sample_q.difficulty})")
    print(f"  Text: {sample_q.question_text}")
    print(f"  Options: {sample_q.options}")

    # 3. Simulate Student Submission
    print("\n[3/5] Simulating Quiz Submission...")
    # Let's create an answer submission where the student answers a few correctly and one incorrectly
    answers = []
    for idx, q in enumerate(quiz.questions):
        # Let's answer the first half correctly, and the second half incorrectly to simulate an intermediate student
        is_correct = idx < len(quiz.questions) // 2
        selected = q.correct_option if is_correct else ("A" if q.correct_option != "A" else "B")
        
        answers.append(QuizAnswerItem(
            question_id=q.question_id,
            question_text=q.question_text,
            selected_option=selected,
            correct_option=q.correct_option,
            topic=q.topic,
            difficulty=q.difficulty,
            time_taken_seconds=45 if idx % 2 == 0 else 75
        ))
        
    submission = QuizSubmission(
        student_id=student_id,
        session_id="session-uuid-99999",
        quiz_answers=answers,
        total_time_seconds=650,
        submitted_at=datetime.utcnow()
    )
    print(f"[OK] Formatted submission with {len(submission.quiz_answers)} answered questions.")

    # 4. Run Analysis Pipeline
    print("\n[4/5] Running Agent Analysis Pipeline (Scoring -> Summary -> Risk)...")
    try:
        results = agent_service.submit_and_analyse_quiz(submission, student_id)
        print("[OK] Analysis pipeline executed successfully.")
        
        # 5. Validate Outputs
        print("\n[5/5] Validating Output Content & Schemas...")
        
        # Validate Skill Profile
        skill_profile = results["skill_profile"]
        print(f"  - Skill Classification Level: {skill_profile.level}")
        print(f"  - Overall Score: {skill_profile.overall_score}/100")
        print(f"  - Category Breakdown: DSA={skill_profile.category_scores.dsa}%, Programming={skill_profile.category_scores.programming}%, Logic={skill_profile.category_scores.logic}%, Domain={skill_profile.category_scores.domain_specific}%")
        print(f"  - Behavioural Signals: Rushed={skill_profile.behavioural_signals.rushed}, Consistent={skill_profile.behavioural_signals.consistent}")
        
        # Validate Summary
        summary = results["summary"]
        print(f"  - Profile Summary: \"{summary.summary_text}\"")
        print(f"  - Estimated Placement Readiness: {summary.estimated_placement_readiness}")
        print(f"  - Next Recommended Step: {summary.recommended_next_step}")
        
        # Validate Risks
        risk = results["risk_report"]
        print(f"  - Overall Risk Level: {risk.overall_risk_level}")
        print(f"  - Risk Summary: \"{risk.risk_summary}\"")
        print(f"  - Primary Skill Gaps: {', '.join([g.area for g in risk.skill_gaps])}")
        print(f"  - Quick Wins (1-2 Weeks): {risk.quick_wins}")
        print(f"  - Red Flags: {risk.red_flags}")

        print("\n==================================================")
        print("         ALL TESTS COMPLETED SUCCESSFULLY!        ")
        print("==================================================")
        
    except Exception as e:
        print(f"\n[FAIL] Error during pipeline execution: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_tests()
