import os
import json
import logging
from typing import Any
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import ValidationError

from models.schemas import CareerRoadmapRequest, CareerRoadmapResponse

logger = logging.getLogger(__name__)

# Initialize the Gemini model via LangChain
def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0.4,
        api_key=os.getenv("GEMINI_API_KEY"),
        max_retries=0,
        # Force Gemini to return raw JSON instead of markdown-wrapped text.
        response_mime_type="application/json",
    )

class AgentProcessingError(Exception):
    pass


def _extract_json(content: str) -> str:
    """Best-effort extraction of a JSON object from an LLM response, in case
    response_mime_type is ignored and the model still wraps the payload in
    markdown fences or extra prose."""
    content = content.strip()
    if "```json" in content:
        return content.split("```json")[1].split("```")[0].strip()
    if "```" in content:
        return content.split("```")[1].split("```")[0].strip()
    start, end = content.find("{"), content.rfind("}")
    if start != -1 and end != -1 and end > start:
        return content[start:end + 1]
    return content


@retry(
    wait=wait_exponential(multiplier=1, min=1, max=4),
    stop=stop_after_attempt(3),
    retry=retry_if_exception_type(AgentProcessingError),
    reraise=True
)
def _generate_roadmap_with_retry(prompt: str) -> CareerRoadmapResponse:
    llm = get_llm()
    try:
        response = llm.invoke(prompt)
        content = _extract_json(response.content)
        data = json.loads(content)
        return CareerRoadmapResponse(**data)
    except ValidationError as e:
        logger.error(f"Validation error in roadmap agent: {e}")
        # Next attempt will retry
        raise AgentProcessingError(f"Failed to validate LLM output: {e}")
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error in roadmap agent: {e}")
        raise AgentProcessingError(f"Failed to parse JSON: {e}")
    except Exception as e:
        logger.error(f"Unexpected error calling Gemini: {e}")
        raise AgentProcessingError(f"Error calling Gemini API: {e}")

class CareerRoadmapAgent:
    def _generate_mock(self, request: CareerRoadmapRequest) -> CareerRoadmapResponse:
        year_map = {1: 'Foundations', 2: 'Skill Building', 3: 'Specialisation', 4: 'Launch'}
        theme = year_map.get(request.year, 'Skill Building')
        return CareerRoadmapResponse(
            student_name=request.name,
            domain=request.domain,
            career_goal=request.career_goal,
            total_years=1,
            plan=[{
                'year': request.year,
                'theme': theme,
                'focus_areas': [f'{request.domain} fundamentals', 'Communication skills', 'Networking'],
                'monthly_goals': [f'Complete {request.domain} module', 'Build a mini project', 'Solve practice problems', 'Review and revise'],
                'skills_to_learn': ['Core concepts', 'Problem solving', 'Tools & frameworks'],
                'projects_to_build': [{'title': f'{request.domain} Capstone', 'description': f'A project applying {request.domain} skills', 'tech_stack': ['Python', 'React', 'SQL']}],
                'resources': [{'name': f'Best {request.domain} Course', 'type': 'Course', 'url': 'https://coursera.org', 'is_free': True}],
                'milestone': f'Complete {request.domain} foundation',
                'dsa_target': 'Solve 100 problems',
                'internship_target': 'Apply for internships' if request.year >= 3 else None
            }],
            quick_start=f"Start with {request.domain} fundamentals and build a strong foundation in your {['first','second','third','fourth'][request.year-1]} year."
        )

    def generate_roadmap(self, request: CareerRoadmapRequest) -> CareerRoadmapResponse:
        system_prompt = (
            "You are an expert career counsellor for Indian BTech CS students. "
            "You have deep knowledge of Indian tech industry hiring, FAANG prep, GATE, startup ecosystems. "
            "Generate a realistic, actionable year-by-year career roadmap based on the student's profile."
        )

        user_prompt = f"""
Student Profile:
- Name: {request.name}
- Current Year: {request.year} (1-4)
- Domain of Interest: {request.domain}
- Career Goal: {request.career_goal}
- Current Skill Level: {request.level}
- Study Hours Available/Day: {request.hours_per_day}
- College Tier: {request.college_tier}

Generate a detailed career roadmap for the student's CURRENT year (Year {request.year}) only.
Do NOT include plans for other years — only the year the student is currently in.
The output MUST be exactly in the following JSON format:
{{
  "student_name": "string",
  "domain": "string",
  "career_goal": "string",
  "total_years": 1,
  "plan": [
    {{
      "year": {request.year},
      "theme": "string",
      "focus_areas": ["string", "string"],
      "monthly_goals": ["string", "string", "string", "string"],
      "skills_to_learn": ["string", "string", "string"],
      "projects_to_build": [
        {{
          "title": "string",
          "description": "string",
          "tech_stack": ["string"]
        }}
      ],
      "resources": [
        {{
          "name": "string",
          "type": "YouTube|Course|Book|Platform",
          "url": "string",
          "is_free": boolean
        }}
      ],
      "milestone": "string",
      "dsa_target": "string",
      "internship_target": "string or null"
    }}
  ],
  "quick_start": "string"
}}
Ensure the JSON is valid and conforms exactly to this structure. The plan array must contain exactly one entry (for Year {request.year}).
"""

        full_prompt = f"{system_prompt}\n\n{user_prompt}"

        try:
            return _generate_roadmap_with_retry(full_prompt)
        except Exception as e:
            logger.warning(f"LLM roadmap failed, using mock: {e}")
            return self._generate_mock(request)

career_roadmap_agent = CareerRoadmapAgent()
