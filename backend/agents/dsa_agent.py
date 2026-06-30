import os
import json
import logging
import httpx
from typing import Dict, Any
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import ValidationError

from models.schemas import DSAPracticeRequest, DSAPracticeResponse

logger = logging.getLogger(__name__)

# Cache configuration: 24h expiration (86400 seconds)
# Using a simple dictionary as TTLCache is available via cachetools
# Or implement a simple dict with timestamp
import time

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

# 24 hours cache
dsa_cache = SimpleDictCache(ttl_seconds=86400)

def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0.4,
        api_key=os.getenv("GEMINI_API_KEY")
    )

class DSAPracticeAgent:

    async def fetch_leetcode_problems(self, level: str, limit: int = 50) -> Dict[str, Any]:
        url = "https://leetcode.com/graphql"

        # Map level to LeetCode difficulty
        difficulty_mapping = {
            "Beginner": "EASY",
            "Intermediate": "MEDIUM",
            "Advanced": "HARD"
        }
        mapped_difficulty = difficulty_mapping.get(level, "EASY")

        query = """
        query problemsetQuestionList($categorySlug: String, $limit: Int, $filters: QuestionListFilterInput) {
          problemsetQuestionList: questionList(categorySlug: $categorySlug, limit: $limit, filters: $filters) {
            questions: data {
              acRate
              difficulty
              frontendQuestionId: questionFrontendId
              title
              titleSlug
              topicTags { name slug }
            }
          }
        }
        """

        variables = {
            "categorySlug": "",
            "limit": limit,
            "filters": {
                "difficulty": mapped_difficulty
            }
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    url,
                    json={"query": query, "variables": variables}
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Failed to fetch problems from LeetCode GraphQL: {e}")
            # Return empty or partial format if failed
            return {"data": {"problemsetQuestionList": {"questions": []}}}

    async def generate_dsa_sheet(self, request: DSAPracticeRequest) -> DSAPracticeResponse:
        cache_key = f"{request.level}_{request.topic}_{request.domain}"
        cached_result = dsa_cache.get(cache_key)

        if cached_result:
            logger.info(f"Returning cached DSA sheet for key: {cache_key}")
            return cached_result

        # 1. Fetch real problems
        leetcode_data = await self.fetch_leetcode_problems(request.level)
        questions = leetcode_data.get("data", {}).get("problemsetQuestionList", {}).get("questions", [])

        # We can extract a simplified list to send to Gemini to save tokens
        simplified_questions = []
        for q in questions:
            tags = [tag.get("name") for tag in q.get("topicTags", [])]
            simplified_questions.append({
                "id": q.get("frontendQuestionId"),
                "title": q.get("title"),
                "slug": q.get("titleSlug"),
                "difficulty": q.get("difficulty"),
                "tags": tags
            })

        # 2. Curate using Gemini
        llm = get_llm()

        system_prompt = (
            "You are an expert Data Structures and Algorithms instructor. "
            "Your task is to select the best problems from the provided list to create a structured study sheet."
        )

        user_prompt = f"""
Student Profile:
- Level: {request.level}
- Domain Focus: {request.domain}
- Topic: {request.topic}

Available LeetCode Problems:
{json.dumps(simplified_questions[:50], indent=2)}

Task:
Select the best 20 problems from the list above and organize them into a 4-week study sheet.
If the provided list does not have enough relevant problems, use your knowledge of standard LeetCode problems to fill the gaps, but prefer the provided ones.

The output MUST be exactly in the following JSON format:
{{
  "level": "string",
  "topic_focus": "string",
  "sheet": [
    {{
      "order": integer,
      "topic": "string",
      "problem_title": "string",
      "problem_id": "string",
      "difficulty": "string",
      "leetcode_url": "https://leetcode.com/problems/{{titleSlug}}/",
      "why_important": "string",
      "approach_hint": "string",
      "time_to_solve_minutes": integer,
      "tags": ["string"]
    }}
  ],
  "study_plan": "string",
  "daily_target": "string"
}}
Ensure the JSON is valid and conforms exactly to this structure without markdown wrappers if possible.
"""
        full_prompt = f"{system_prompt}\n\n{user_prompt}"

        try:
            response = await llm.ainvoke(full_prompt)
            content = response.content

            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()

            data = json.loads(content)
            result = DSAPracticeResponse(**data)

            # Cache the result
            dsa_cache.set(cache_key, result)
            return result

        except Exception as e:
            logger.error(f"Error curating DSA sheet with Gemini: {e}")
            raise Exception(f"Failed to generate DSA sheet: {e}")

dsa_agent = DSAPracticeAgent()
