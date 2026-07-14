import os
import json
import logging
import httpx
from typing import Dict, Any
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
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
        api_key=os.getenv("GEMINI_API_KEY"),
        max_retries=0,
        # Force Gemini to return raw JSON instead of markdown-wrapped text so we
        # don't have to rely on brittle string-splitting to extract the payload.
        response_mime_type="application/json",
    )


class AgentProcessingError(Exception):
    pass


def _extract_json(content: str) -> str:
    """Best-effort extraction of a JSON object from an LLM response, in case
    response_mime_type is ignored by a given model/SDK version and the model
    still wraps the payload in markdown fences or extra prose."""
    content = content.strip()
    if "```json" in content:
        return content.split("```json")[1].split("```")[0].strip()
    if "```" in content:
        return content.split("```")[1].split("```")[0].strip()
    # Fallback: grab the outermost {...} block
    start, end = content.find("{"), content.rfind("}")
    if start != -1 and end != -1 and end > start:
        return content[start:end + 1]
    return content


class DSAPracticeAgent:

    def _generate_mock_sheet(self, request: DSAPracticeRequest) -> DSAPracticeResponse:
        problems = [
            {'order': 1, 'topic': 'Arrays', 'problem_title': 'Two Sum', 'problem_id': '1', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/two-sum/', 'why_important': 'Classic hashmap problem for O(n) thinking', 'approach_hint': 'Use a hashmap to store complements', 'time_to_solve_minutes': 15, 'tags': ['Array', 'Hash Table']},
            {'order': 2, 'topic': 'Arrays', 'problem_title': 'Best Time to Buy and Sell Stock', 'problem_id': '121', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/best-time-to-buy-and-sell-stock/', 'why_important': 'Sliding window / DP intro', 'approach_hint': 'Track min price and max profit', 'time_to_solve_minutes': 20, 'tags': ['Array', 'DP']},
            {'order': 3, 'topic': 'Strings', 'problem_title': 'Valid Parentheses', 'problem_id': '20', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/valid-parentheses/', 'why_important': 'Stack application', 'approach_hint': 'Use a stack to match brackets', 'time_to_solve_minutes': 15, 'tags': ['String', 'Stack']},
            {'order': 4, 'topic': 'Linked Lists', 'problem_title': 'Reverse Linked List', 'problem_id': '206', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/reverse-linked-list/', 'why_important': 'Pointer manipulation fundamentals', 'approach_hint': 'Iteratively reverse pointers', 'time_to_solve_minutes': 15, 'tags': ['Linked List']},
            {'order': 5, 'topic': 'Trees', 'problem_title': 'Maximum Depth of Binary Tree', 'problem_id': '104', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/maximum-depth-of-binary-tree/', 'why_important': 'Recursion on trees', 'approach_hint': 'DFS: max(left, right) + 1', 'time_to_solve_minutes': 10, 'tags': ['Tree', 'DFS']},
            {'order': 6, 'topic': 'Searching', 'problem_title': 'Binary Search', 'problem_id': '704', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/binary-search/', 'why_important': 'O(log n) search', 'approach_hint': 'Standard binary search', 'time_to_solve_minutes': 10, 'tags': ['Binary Search']},
            {'order': 7, 'topic': 'DP', 'problem_title': 'Climbing Stairs', 'problem_id': '70', 'difficulty': 'EASY', 'leetcode_url': 'https://leetcode.com/problems/climbing-stairs/', 'why_important': 'Fibonacci-style DP', 'approach_hint': 'dp[n] = dp[n-1] + dp[n-2]', 'time_to_solve_minutes': 15, 'tags': ['DP']},
            {'order': 8, 'topic': 'Graphs', 'problem_title': 'Number of Islands', 'problem_id': '200', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/number-of-islands/', 'why_important': 'Grid DFS/BFS classic', 'approach_hint': 'DFS on each 1 and mark visited', 'time_to_solve_minutes': 25, 'tags': ['Graph', 'DFS']},
            {'order': 9, 'topic': 'Heaps', 'problem_title': 'Top K Frequent Elements', 'problem_id': '347', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/top-k-frequent-elements/', 'why_important': 'Heap / bucket sort', 'approach_hint': 'Count frequencies then use heap', 'time_to_solve_minutes': 20, 'tags': ['Heap', 'Hash Table']},
            {'order': 10, 'topic': 'Sliding Window', 'problem_title': 'Longest Substring Without Repeating Characters', 'problem_id': '3', 'difficulty': 'MEDIUM', 'leetcode_url': 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', 'why_important': 'Sliding window pattern', 'approach_hint': 'Use two pointers + set', 'time_to_solve_minutes': 20, 'tags': ['Sliding Window', 'String']},
        ]
        return DSAPracticeResponse(
            level=request.level,
            topic_focus=request.domain,
            sheet=problems,
            study_plan='Solve 2-3 problems daily, focusing on one topic at a time. Review solutions and track patterns.',
            daily_target='2-3 problems per day'
        )

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
            result = await self._invoke_with_retry(llm, full_prompt)
            # Cache the result
            dsa_cache.set(cache_key, result)
            return result

        except Exception as e:
            logger.warning(f"Gemini DSA curation failed after retries, using mock: {e}")
            result = self._generate_mock_sheet(request)
            dsa_cache.set(cache_key, result)
            return result

    @retry(
        wait=wait_exponential(multiplier=1, min=1, max=4),
        stop=stop_after_attempt(3),
        retry=retry_if_exception_type(AgentProcessingError),
        reraise=True,
    )
    async def _invoke_with_retry(self, llm, full_prompt: str) -> DSAPracticeResponse:
        """Call Gemini and parse+validate the JSON. Retries on parse/validation
        failures (malformed AI output) and transient API errors."""
        try:
            response = await llm.ainvoke(full_prompt)
            content = _extract_json(response.content)
            data = json.loads(content)
            return DSAPracticeResponse(**data)
        except json.JSONDecodeError as e:
            logger.error(f"DSA agent: failed to parse Gemini JSON: {e}")
            raise AgentProcessingError(f"Invalid JSON from Gemini: {e}")
        except ValidationError as e:
            logger.error(f"DSA agent: Gemini JSON failed schema validation: {e}")
            raise AgentProcessingError(f"Schema validation failed: {e}")
        except AgentProcessingError:
            raise
        except Exception as e:
            logger.error(f"DSA agent: Gemini call failed: {e}")
            raise AgentProcessingError(f"Gemini call failed: {e}")

dsa_agent = DSAPracticeAgent()
