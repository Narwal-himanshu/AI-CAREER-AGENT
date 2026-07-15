from fastapi import APIRouter, HTTPException, status
import logging

from models.schemas import (
    CareerRoadmapRequest,
    CareerRoadmapResponse,
    DSAPracticeRequest,
    DSAPracticeResponse,
    CourseRecommendationRequest,
    CourseRecommendationResponse,
    OpportunitiesRequest,
    OpportunitiesResponse
)

from agents.career_roadmap_agent import career_roadmap_agent
from agents.dsa_agent import dsa_agent, ALL_TOPIC_NAMES
from agents.course_agent import course_agent
from agents.opportunities_agent import opportunities_agent

logger = logging.getLogger(__name__)

router = APIRouter()

from fastapi.responses import JSONResponse

@router.post("/career-roadmap", response_model=CareerRoadmapResponse)
def generate_career_roadmap(request: CareerRoadmapRequest):
    try:
        # Agent 1 is synchronous
        return career_roadmap_agent.generate_roadmap(request)
    except Exception as e:
        logger.error(f"Career roadmap generation failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "Service temporarily unavailable", "detail": "AI service failed after retries"}
        )

@router.post("/dsa-sheet", response_model=DSAPracticeResponse)
async def generate_dsa_sheet(request: DSAPracticeRequest):
    try:
        # Agent 2 is asynchronous
        return await dsa_agent.generate_dsa_sheet(request)
    except Exception as e:
        logger.error(f"DSA sheet generation failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "Service temporarily unavailable", "detail": str(e)}
        )

@router.get("/dsa-topics")
async def get_dsa_topics():
    return {"topics": ALL_TOPIC_NAMES}

@router.post("/courses", response_model=CourseRecommendationResponse)
async def get_course_recommendations(request: CourseRecommendationRequest):
    try:
        # Agent 3 is asynchronous
        return await course_agent.recommend_courses(request)
    except Exception as e:
        logger.error(f"Course recommendation failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "Service temporarily unavailable", "detail": str(e)}
        )

@router.post("/opportunities", response_model=OpportunitiesResponse)
async def get_opportunities(request: OpportunitiesRequest):
    try:
        # Agent 4 is asynchronous
        return await opportunities_agent.find_opportunities(request)
    except Exception as e:
        logger.error(f"Opportunities fetch failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "Service temporarily unavailable", "detail": str(e)}
        )
