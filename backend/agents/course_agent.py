import os
import json
import logging
import httpx
import time
from typing import Dict, Any, List
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import ValidationError

from models.schemas import CourseRecommendationRequest, CourseRecommendationResponse

logger = logging.getLogger(__name__)

class SimpleDictCache:
    def __init__(self, ttl_seconds):
        self.cache = {}
        self.ttl = ttl_seconds

    def get(self, key):
        if key in self.cache:
            data, timestamp = self.cache[key]
            if time.time() - timestamp < self.ttl:
                return data
            else:
                del self.cache[key]
        return None

    def set(self, key, value):
        self.cache[key] = (value, time.time())

# 12 hours cache
course_cache = SimpleDictCache(ttl_seconds=43200)

CURATED_COURSES = {
    "AI/ML": [
        {"name": "Andrew Ng Machine Learning Specialization", "platform": "Coursera (audit free)", "url": "https://coursera.org/specializations/machine-learning-introduction", "level": "Beginner", "duration_hours": 50},
        {"name": "fast.ai Practical Deep Learning", "platform": "fast.ai", "url": "https://course.fast.ai", "level": "Intermediate", "duration_hours": 30},
        {"name": "Hugging Face NLP Course", "platform": "Hugging Face", "url": "https://huggingface.co/course", "level": "Intermediate", "duration_hours": 20}
    ],
    "Web Dev": [
        {"name": "The Odin Project", "platform": "Website", "url": "https://www.theodinproject.com/", "level": "Beginner", "duration_hours": 100},
        {"name": "Full Stack Open", "platform": "University of Helsinki", "url": "https://fullstackopen.com/en/", "level": "Intermediate", "duration_hours": 120}
    ],
    "DSA/CP": [
        {"name": "CSES Problem Set", "platform": "CSES", "url": "https://cses.fi/problemset/", "level": "Intermediate", "duration_hours": 100},
        {"name": "Striver's A2Z DSA Course", "platform": "takeUforward", "url": "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2", "level": "Beginner", "duration_hours": 80}
    ],
    "Cloud": [
        {"name": "AWS Cloud Practitioner Essentials", "platform": "AWS Skill Builder", "url": "https://explore.skillbuilder.aws/", "level": "Beginner", "duration_hours": 6},
        {"name": "Google Cloud Computing Foundations", "platform": "Google Cloud Skills Boost", "url": "https://www.cloudskillsboost.google/", "level": "Beginner", "duration_hours": 40}
    ],
    "CyberSec": [
        {"name": "TryHackMe Pre Security", "platform": "TryHackMe", "url": "https://tryhackme.com/", "level": "Beginner", "duration_hours": 20},
        {"name": "PicoCTF", "platform": "picoCTF", "url": "https://picoctf.org/", "level": "Beginner", "duration_hours": 30}
    ],
    "Mobile": [
        {"name": "Android Basics in Kotlin", "platform": "Google Developers", "url": "https://developer.android.com/courses", "level": "Beginner", "duration_hours": 50},
        {"name": "Flutter Official Documentation", "platform": "Flutter", "url": "https://flutter.dev/learn", "level": "Beginner", "duration_hours": 40}
    ]
}

def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0.3,
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


class CourseRecommendationAgent:

    def _generate_mock(self, request: CourseRecommendationRequest) -> CourseRecommendationResponse:
        curated = CURATED_COURSES.get(request.domain, [])
        recommendations = []
        for i, c in enumerate(curated[:5]):
            recommendations.append({
                'rank': i + 1,
                'title': c['name'],
                'platform': c['platform'],
                'url': c['url'],
                'type': 'MOOC',
                'duration_hours': c['duration_hours'],
                'is_free': True,
                'why_recommended': f'Great for building {request.domain} fundamentals',
                'best_for': f'{request.level} learners',
                'weekly_hours_needed': min(request.hours_per_day * 7, 10),
                'completion_weeks': max(1, c['duration_hours'] // (request.hours_per_day * 7 or 1))
            })
        return CourseRecommendationResponse(
            domain=request.domain,
            level=request.level,
            recommendations=recommendations,
            learning_path=f'Start with the beginner-friendly resources, then progress to advanced {request.domain} topics.',
            total_hours=sum(r['duration_hours'] for r in recommendations)
        )

    async def fetch_youtube_courses(self, domain: str, level: str) -> List[Dict[str, Any]]:
        api_key = os.getenv("YOUTUBE_API_KEY")
        if not api_key:
            logger.warning("YOUTUBE_API_KEY not found. Skipping YouTube search.")
            return []

        search_url = "https://www.googleapis.com/youtube/v3/search"
        query = f"{domain} {level} full course for beginners 2024"

        params = {
            "part": "snippet",
            "q": query,
            "type": "video",
            "videoDuration": "long",
            "maxResults": 10,
            "key": api_key
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                search_response = await client.get(search_url, params=params)
                search_response.raise_for_status()
                search_data = search_response.json()

                video_ids = [item["id"]["videoId"] for item in search_data.get("items", [])]

                if not video_ids:
                    return []

                # Fetch statistics and content details
                video_url = "https://www.googleapis.com/youtube/v3/videos"
                video_params = {
                    "part": "snippet,statistics,contentDetails",
                    "id": ",".join(video_ids),
                    "key": api_key
                }

                video_response = await client.get(video_url, params=video_params)
                video_response.raise_for_status()
                video_data = video_response.json()

                results = []
                for item in video_data.get("items", []):
                    results.append({
                        "title": item["snippet"]["title"],
                        "channel": item["snippet"]["channelTitle"],
                        "url": f"https://www.youtube.com/watch?v={item['id']}",
                        "views": item.get("statistics", {}).get("viewCount", "0"),
                        "duration": item.get("contentDetails", {}).get("duration", "")
                    })
                return results

        except Exception as e:
            logger.error(f"Failed to fetch YouTube courses: {e}")
            return []

    async def recommend_courses(self, request: CourseRecommendationRequest) -> CourseRecommendationResponse:
        cache_key = f"{request.domain}_{request.level}"
        cached_result = course_cache.get(cache_key)

        if cached_result:
            logger.info(f"Returning cached course recommendations for key: {cache_key}")
            return cached_result

        # 1. Fetch YouTube results
        youtube_results = await self.fetch_youtube_courses(request.domain, request.level)

        # 2. Get curated courses for the domain
        curated_list = CURATED_COURSES.get(request.domain, [])

        # 3. Use Gemini to merge and rank
        llm = get_llm()

        system_prompt = (
            "You are an expert tech education advisor. Your task is to recommend the best learning resources "
            "for a student based on curated lists and recent YouTube data. You must filter out low-quality content "
            "and structure the response into a cohesive learning path."
        )

        user_prompt = f"""
Student Profile:
- Domain: {request.domain}
- Level: {request.level}
- Career Goal: {request.career_goal}
- Study Hours Available/Day: {request.hours_per_day}

Curated Courses for this domain:
{json.dumps(curated_list, indent=2)}

Recent YouTube Full Courses:
{json.dumps(youtube_results, indent=2)}

Task:
Merge these resources, select the top 5 most relevant and high-quality courses for this specific student, and rank them.
Output the results strictly in this JSON format:
{{
  "domain": "{request.domain}",
  "level": "{request.level}",
  "recommendations": [
    {{
      "rank": integer,
      "title": "string",
      "platform": "string",
      "url": "string",
      "type": "YouTube | MOOC | Website | Book",
      "duration_hours": integer,
      "is_free": true,
      "why_recommended": "string",
      "best_for": "string",
      "weekly_hours_needed": integer,
      "completion_weeks": integer
    }}
  ],
  "learning_path": "string explaining the suggested order to take these courses",
  "total_hours": integer
}}
Ensure the JSON is valid and conforms exactly to this structure without markdown wrappers.
"""
        full_prompt = f"{system_prompt}\n\n{user_prompt}"

        try:
            result = await self._invoke_with_retry(llm, full_prompt)
            # Cache the result
            course_cache.set(cache_key, result)
            return result

        except Exception as e:
            logger.warning(f"Gemini course recommendation failed after retries, using mock: {e}")
            result = self._generate_mock(request)
            course_cache.set(cache_key, result)
            return result

    @retry(
        wait=wait_exponential(multiplier=1, min=1, max=4),
        stop=stop_after_attempt(3),
        retry=retry_if_exception_type(AgentProcessingError),
        reraise=True,
    )
    async def _invoke_with_retry(self, llm, full_prompt: str) -> CourseRecommendationResponse:
        """Call Gemini and parse+validate the JSON. Retries on parse/validation
        failures (malformed AI output) and transient API errors."""
        try:
            response = await llm.ainvoke(full_prompt)
            content = _extract_json(response.content)
            data = json.loads(content)
            return CourseRecommendationResponse(**data)
        except json.JSONDecodeError as e:
            logger.error(f"Course agent: failed to parse Gemini JSON: {e}")
            raise AgentProcessingError(f"Invalid JSON from Gemini: {e}")
        except ValidationError as e:
            logger.error(f"Course agent: Gemini JSON failed schema validation: {e}")
            raise AgentProcessingError(f"Schema validation failed: {e}")
        except AgentProcessingError:
            raise
        except Exception as e:
            logger.error(f"Course agent: Gemini call failed: {e}")
            raise AgentProcessingError(f"Gemini call failed: {e}")

course_agent = CourseRecommendationAgent()
