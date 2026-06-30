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
        api_key=os.getenv("GEMINI_API_KEY")
    )

class AgentProcessingError(Exception):
    pass

@retry(
    wait=wait_exponential(multiplier=1, min=2, max=10),
    stop=stop_after_attempt(3),
    retry=retry_if_exception_type((AgentProcessingError, Exception)),
    reraise=True
)
def _generate_roadmap_with_retry(prompt: str) -> CareerRoadmapResponse:
    llm = get_llm()
    try:
        response = llm.invoke(prompt)
        content = response.content

        # Simple heuristic to extract JSON block if it's markdown wrapped
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()

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
    def generate_roadmap(self, request: CareerRoadmapRequest) -> CareerRoadmapResponse:
        system_prompt = (
            "You are an expert career counsellor for Indian BTech CS students. "
            "You have deep knowledge of Indian tech industry hiring, FAANG prep, GATE, startup ecosystems. "
            "Generate a realistic, actionable year-by-year career roadmap based on the student's profile."
        )

        user_prompt = f"""
Student Profile:
- Name: {request.name}
- Year: {request.year} (1-4)
- Domain of Interest: {request.domain}
- Career Goal: {request.career_goal}
- Current Skill Level: {request.level}
- Study Hours Available/Day: {request.hours_per_day}
- College Tier: {request.college_tier}

Generate a detailed career roadmap for this student.
The output MUST be exactly in the following JSON format:
{{
  "student_name": "string",
  "domain": "string",
  "career_goal": "string",
  "total_years": integer,
  "plan": [
    {{
      "year": integer,
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
Ensure the JSON is valid and conforms exactly to this structure.
"""

        full_prompt = f"{system_prompt}\n\n{user_prompt}"

        try:
            return _generate_roadmap_with_retry(full_prompt)
        except Exception as e:
            # Re-prompt once with schema example appended dynamically if the retries fail
            logger.warning("Retrying with explicit schema example appended.")
            fallback_prompt = full_prompt + "\n\nCRITICAL: Your previous response failed to parse. Make sure you output ONLY valid JSON without any leading/trailing text or markdown wrappers."
            try:
                return _generate_roadmap_with_retry(fallback_prompt)
            except Exception as final_e:
                logger.error(f"Failed to generate roadmap after fallback: {final_e}")
                raise final_e

career_roadmap_agent = CareerRoadmapAgent()
