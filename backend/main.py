from fastapi import FastAPI, HTTPException, status, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
import logging
import os
import firebase_admin
from firebase_admin import auth, credentials

from models.student import StudentOnboarding
from models.quiz import QuizSubmission, QuizResponse
from services.agent_service import agent_service
from database import get_db_connection

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Career Agent Backend API",
    description="Adaptive skill assessment, career recommendations, and risk reports for Indian BTech CS students.",
    version="1.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Initialize Firebase Admin SDK once at startup
firebase_initialized = False
firebase_service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "")

if firebase_service_account_path and os.path.exists(firebase_service_account_path):
    try:
        cred = credentials.Certificate(firebase_service_account_path)
        firebase_admin.initialize_app(cred)
        firebase_initialized = True
        logger.info("Firebase Admin initialized via service account JSON.")
    except Exception as e:
        logger.error(f"Failed to initialize Firebase with JSON: {e}")
else:
    try:
        proj_id = os.getenv("FIREBASE_PROJECT_ID", "ai-career-14816")
        firebase_admin.initialize_app(options={'projectId': proj_id})
        firebase_initialized = True
        logger.info(f"Firebase Admin initialized for project ID: {proj_id}")
    except Exception as e:
        logger.warning(
            f"Firebase Admin default initialization failed ({e}). Fallback mock token mode is enabled for development."
        )

# 2. Authentication Dependency
def get_current_student(authorization: str = Header(...)) -> str:
    """
    Dependency to verify the Bearer token in the Authorization header.
    Resolves the student's firebase_uid and retrieves or inserts their database student_id.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="ERR_AUTH_401: Unauthorized access. Missing or malformed Bearer prefix."
        )
    
    token = authorization.split("Bearer ")[1]
    
    # Enable fallback development mode for testing or mock accounts
    if not firebase_initialized or token.startswith("mock-uid-"):
        firebase_uid = token
        name = "Dev Mock Student"
        email = "mock@student.in"
        logger.info(f"Dev Auth: Verified mock token for {firebase_uid}")
    else:
        try:
            decoded_token = auth.verify_id_token(token)
            firebase_uid = decoded_token.get("uid")
            name = decoded_token.get("name", "Anonymous Student")
            email = decoded_token.get("email", "anonymous@student.in")
        except Exception as e:
            logger.error(f"Firebase token verification failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="ERR_AUTH_401: Unauthorized access. Missing, malformed, or expired Firebase ID token."
            )
            
    # Lookup or create the bare student record in SQLite
    student_id = agent_service.get_or_create_student(firebase_uid, name, email)
    return student_id

@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "AI Career Agent Backend"}

@app.get("/me/status")
def get_student_status(student_id: str = Depends(get_current_student)):
    """
    Returns the onboarding and quiz progress status for the verified student.
    This serves as the single source of truth for routing.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Fetch onboarding details
    cursor.execute("SELECT year, branch, college, career_goal FROM students WHERE student_id = ?", (student_id,))
    student_row = cursor.fetchone()
    
    # 2. Fetch quiz profile details
    cursor.execute("SELECT level FROM skill_profiles WHERE student_id = ?", (student_id,))
    profile_row = cursor.fetchone()
    conn.close()
    
    onboarding_complete = False
    if student_row:
        onboarding_complete = all([
            student_row['year'] is not None,
            student_row['branch'] is not None,
            student_row['college'] is not None,
            student_row['career_goal'] is not None
        ])
        
    quiz_complete = profile_row is not None
    level = profile_row['level'] if profile_row else None
    
    return {
        "onboarding_complete": onboarding_complete,
        "quiz_complete": quiz_complete,
        "level": level
    }

@app.get("/api/onboarding")
def get_onboarding(student_id: str = Depends(get_current_student)):
    """
    Retrieves the saved onboarding profile details for the authenticated student.
    """
    onboarding = agent_service.get_onboarding(student_id)
    if not onboarding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ERR_ONBOARD_NOT_FOUND: Onboarding profile not found."
        )
    return onboarding

@app.post("/api/onboarding", status_code=status.HTTP_201_CREATED)
def onboard_student(onboarding: StudentOnboarding, student_id: str = Depends(get_current_student)):
    """
    Onboarding endpoint to save a student's profile (safe UPDATE).
    """
    try:
        agent_service.save_onboarding(student_id, onboarding)
        return {"status": "success", "message": "Student onboarding successful", "student_id": student_id}
    except Exception as e:
        logger.error(f"Error during student onboarding: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ERR_DB_WRITE: Failed to write onboarding profile to database"
        )

@app.get("/api/quiz/generate", response_model=QuizResponse)
def generate_quiz_get(student_id: str = Depends(get_current_student)):
    """
    Generates or fetches the personalized assessment quiz using the student's saved onboarding profile.
    """
    try:
        onboarding = agent_service.get_onboarding(student_id)
        if not onboarding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ERR_ONBOARD_NOT_FOUND: Onboarding profile not found. Complete onboarding first."
            )
        logger.info(f"Generating assessment quiz for student from saved profile: {student_id}")
        quiz = agent_service.generate_quiz_for_student(student_id, onboarding)
        return quiz
    except ValidationError as e:
        logger.error(f"Validation error during quiz generation: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="ERR_LLM_SCHEMA: Generated quiz failed validation against expected schema"
        )
    except Exception as e:
        logger.error(f"Quiz generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ERR_LLM_504: Quiz generation timed out or failed: {str(e)}"
        )

@app.post("/api/quiz/generate", response_model=QuizResponse)
def generate_quiz(onboarding: StudentOnboarding, student_id: str = Depends(get_current_student)):
    """
    Generates a personalized skill assessment quiz calibrated to the student's year, domain, and goals.
    """
    try:
        logger.info(f"Generating assessment quiz for student: {student_id}")
        quiz = agent_service.generate_quiz_for_student(student_id, onboarding)
        return quiz
    except ValidationError as e:
        logger.error(f"Validation error during quiz generation: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="ERR_LLM_SCHEMA: Generated quiz failed validation against expected schema"
        )
    except Exception as e:
        logger.error(f"Quiz generation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ERR_LLM_504: Quiz generation timed out or failed: {str(e)}"
        )

@app.post("/api/quiz/submit")
def submit_quiz(submission: QuizSubmission, student_id: str = Depends(get_current_student)):
    """
    Submits quiz responses, evaluates results, and performs risk/summary analyses (safe upsert).
    """
    if len(submission.quiz_answers) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ERR_QUIZ_INC: Student submitted insufficient answers. Minimum 3 responses required."
        )

    try:
        logger.info(f"Processing quiz submission for student: {student_id}")
        analysis_result = agent_service.submit_and_analyse_quiz(submission, student_id)
        return analysis_result
    except ValidationError as e:
        logger.error(f"Validation error during scoring or analysis: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="ERR_LLM_SCHEMA: Downstream agent output failed validation against expected schema"
        )
    except Exception as e:
        logger.error(f"Quiz analysis pipeline failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ERR_LLM_504: Analysis failed during agent processing: {str(e)}"
        )

@app.get("/api/dashboard")
def get_dashboard(student_id: str = Depends(get_current_student)):
    """
    Fetches the completed assessment analysis dashboard payload for a returning student.
    """
    try:
        analysis = agent_service.get_cached_analysis(student_id)
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ERR_QUIZ_NOT_FOUND: Assessment analysis not found for student. Complete the quiz first."
            )
        return analysis
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to fetch cached dashboard: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ERR_DB_READ: Failed to read dashboard analysis from database"
        )

if __name__ == "__main__":
    import uvicorn
    import config
    logger.info(f"Starting server on {config.HOST}:{config.PORT}...")
    uvicorn.run("main:app", host=config.HOST, port=config.PORT, reload=True)
