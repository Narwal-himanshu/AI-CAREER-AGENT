from fastapi import APIRouter, HTTPException, status, Query
from fastapi.responses import JSONResponse
import logging

from models.schemas import (
    CareerRoadmapRequest,
    CareerRoadmapResponse,
    CourseRecommendationRequest,
    CourseRecommendationResponse,
    OpportunitiesRequest,
    OpportunitiesResponse,
    ChatRequest,
    ChatResponse,
    DSAPaginatedResponse,
)

from agents.career_roadmap_agent import career_roadmap_agent
from agents import dsa_agent
from agents.course_agent import course_agent
from agents.opportunities_agent import opportunities_agent
from agents.chatbot_agent import chatbot_agent

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/career-roadmap", response_model=CareerRoadmapResponse)
def generate_career_roadmap(request: CareerRoadmapRequest):
    try:
        return career_roadmap_agent.generate_roadmap(request)
    except Exception as e:
        logger.error(f"Career roadmap generation failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "Service temporarily unavailable", "detail": "AI service failed after retries"}
        )


# ==========================================
# DSA Practice Endpoints (Static JSON)
# ==========================================

@router.get("/dsa/modes")
async def get_dsa_modes():
    return {"modes": dsa_agent.get_modes()}


@router.get("/dsa/topics")
async def get_dsa_topics():
    topics = dsa_agent.get_topics()
    return {"topics": [t.model_dump() for t in topics]}


@router.get("/dsa/companies")
async def get_dsa_companies():
    companies = dsa_agent.get_companies()
    return {"companies": [c.model_dump() for c in companies]}


@router.get("/dsa/topic/{topic_name}")
async def get_dsa_topic_problems(
    topic_name: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    result = dsa_agent.get_topic_problems(topic_name, page=page, limit=limit)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Topic '{topic_name}' not found")
    return result.model_dump()


@router.get("/dsa/company/{company_name}")
async def get_dsa_company_problems(
    company_name: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    result = dsa_agent.get_company_problems(company_name, page=page, limit=limit)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Company '{company_name}' not found")
    return result.model_dump()


@router.get("/dsa/topic/{topic_name}/all")
async def get_all_dsa_topic_problems(topic_name: str):
    """Return all problems for a topic (no pagination). Used when filters are active."""
    problems = dsa_agent.get_all_topic_problems(topic_name)
    if problems is None:
        raise HTTPException(status_code=404, detail=f"Topic '{topic_name}' not found")
    return {"problems": [p.model_dump() for p in problems], "total": len(problems)}


@router.get("/dsa/company/{company_name}/all")
async def get_all_dsa_company_problems(company_name: str):
    """Return all problems for a company (no pagination). Used when filters are active."""
    problems = dsa_agent.get_all_company_problems(company_name)
    if problems is None:
        raise HTTPException(status_code=404, detail=f"Company '{company_name}' not found")
    return {"problems": [p.model_dump() for p in problems], "total": len(problems)}


# ==========================================
# Legacy DSA endpoint (kept for backward compat)
# ==========================================

@router.get("/dsa-topics")
async def get_dsa_topics_legacy():
    """Legacy endpoint - returns topic names only."""
    topics = dsa_agent.get_topics()
    return {"topics": [t.topic_name for t in topics]}


# ==========================================
# Other Agents
# ==========================================

@router.post("/courses", response_model=CourseRecommendationResponse)
async def get_course_recommendations(request: CourseRecommendationRequest):
    try:
        return await course_agent.recommend_courses(request)
    except Exception as e:
        logger.error(f"Course recommendation failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "Service temporarily unavailable", "detail": str(e)}
        )


@router.post("/opportunities", response_model=OpportunitiesResponse)
async def get_opportunities(request: OpportunitiesRequest, page: int = Query(1, ge=1), limit: int = Query(12, ge=1, le=50)):
    try:
        return await opportunities_agent.find_opportunities(request, page=page, limit=limit)
    except Exception as e:
        logger.error(f"Opportunities fetch failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "Service temporarily unavailable", "detail": str(e)}
        )


@router.post("/chat", response_model=ChatResponse)
def chat_with_bot(request: ChatRequest):
    try:
        return chatbot_agent.chat(request)
    except Exception as e:
        logger.error(f"Chatbot failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "Service temporarily unavailable", "detail": "AI chatbot service failed"}
        )
