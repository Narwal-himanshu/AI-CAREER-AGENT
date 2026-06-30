import os
import json
import logging
import asyncio
import httpx
import feedparser
import time
from datetime import datetime
from typing import Dict, Any, List
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import ValidationError

from models.schemas import OpportunitiesRequest, OpportunitiesResponse

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

# 6 hours cache
opportunities_cache = SimpleDictCache(ttl_seconds=21600)

def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0.3,
        api_key=os.getenv("GEMINI_API_KEY")
    )

class OpportunitiesAgent:

    async def fetch_devpost(self) -> List[Dict[str, Any]]:
        # Source A: Devpost RSS
        url = "https://devpost.com/hackathons.rss"
        try:
            # feedparser can handle URLs directly, but using httpx to ensure async non-blocking
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                feed = feedparser.parse(response.text)

                results = []
                for entry in feed.entries[:10]:
                    results.append({
                        "source": "Devpost",
                        "title": entry.get("title", ""),
                        "url": entry.get("link", ""),
                        "published": entry.get("published", "")
                    })
                return results
        except Exception as e:
            logger.error(f"Devpost fetch failed: {e}")
            return []

    async def fetch_serper(self, domain: str) -> List[Dict[str, Any]]:
        # Source B: Serper.dev web search
        api_key = os.getenv("SERPER_API_KEY")
        if not api_key:
            logger.warning("SERPER_API_KEY not found. Skipping Serper search.")
            return []

        url = "https://google.serper.dev/search"
        headers = {
            "X-API-KEY": api_key,
            "Content-Type": "application/json"
        }

        now = datetime.now()
        month_name = now.strftime("%B")
        year = now.year

        queries = [
            f"{domain} hackathon CTF contest {month_name} {year} for students India",
            f"open source programs students 2025 {domain}"
        ]

        results = []
        async with httpx.AsyncClient(timeout=10.0) as client:
            for q in queries:
                try:
                    payload = {"q": q, "num": 10}
                    response = await client.post(url, headers=headers, json=payload)
                    response.raise_for_status()
                    data = response.json()

                    for item in data.get("organic", []):
                        results.append({
                            "source": "Serper",
                            "title": item.get("title", ""),
                            "url": item.get("link", ""),
                            "snippet": item.get("snippet", "")
                        })
                except Exception as e:
                    logger.error(f"Serper fetch failed for query '{q}': {e}")

        return results

    async def fetch_clist(self) -> List[Dict[str, Any]]:
        # Source C: Clist.by API
        url = "https://clist.by/api/v4/contest/"
        params = {
            "format": "json",
            "upcoming": "true",
            "limit": 20
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()

                valid_resources = ["codeforces", "codechef", "leetcode", "hackerearth"]
                results = []

                for contest in data.get("objects", []):
                    resource_name = contest.get("resource", "").lower()
                    if any(v in resource_name for v in valid_resources):
                        results.append({
                            "source": "Clist",
                            "title": contest.get("event", ""),
                            "url": contest.get("href", ""),
                            "start": contest.get("start", ""),
                            "end": contest.get("end", ""),
                            "platform": contest.get("resource", "")
                        })
                return results
        except Exception as e:
            logger.error(f"Clist fetch failed: {e}")
            return []

    async def find_opportunities(self, request: OpportunitiesRequest) -> OpportunitiesResponse:
        cache_key = f"{request.domain}_{request.level}"
        cached_result = opportunities_cache.get(cache_key)

        if cached_result:
            logger.info(f"Returning cached opportunities for key: {cache_key}")
            return cached_result

        # Fetch from all sources concurrently
        devpost_task = self.fetch_devpost()
        serper_task = self.fetch_serper(request.domain)
        clist_task = self.fetch_clist()

        results = await asyncio.gather(devpost_task, serper_task, clist_task)
        all_raw_results = {
            "devpost": results[0],
            "serper": results[1],
            "clist": results[2]
        }

        # Check if all sources failed
        if not any(results):
            logger.warning("All opportunity sources failed.")
            return OpportunitiesResponse(
                fetched_at=datetime.utcnow().isoformat(),
                total_found=0,
                opportunities=[],
                spotlight="No spotlight available.",
                notice="Live data temporarily unavailable — try again shortly"
            )

        # 2. Use Gemini to parse and filter
        llm = get_llm()

        system_prompt = (
            "You are an expert student career researcher. You parse raw search results and API feeds "
            "to extract clean, actionable opportunities (hackathons, contests, internships, open source) "
            "for Indian BTech students."
        )

        user_prompt = f"""
Student Profile:
- Domain: {request.domain}
- Level: {request.level}
- Interested Types: {', '.join(request.types)}

Raw Data from Sources:
{json.dumps(all_raw_results, indent=2)}

Task:
Parse, deduplicate, and filter the raw data. Extract ONLY the opportunities that match the student's domain, level, and interested types.
Format the output exactly as this JSON structure:
{{
  "fetched_at": "{datetime.utcnow().isoformat()}",
  "total_found": integer,
  "opportunities": [
    {{
      "title": "string",
      "type": "Hackathon | CTF | Contest | Internship | Open Source",
      "organiser": "string",
      "url": "string",
      "deadline": "YYYY-MM-DD or null",
      "prize_or_perk": "string or null",
      "difficulty_level": "Beginner | All Levels | Advanced",
      "domain_tags": ["string"],
      "why_apply": "string",
      "registration_free": boolean,
      "duration": "string"
    }}
  ],
  "spotlight": "string explaining the single best opportunity right now for this student and why"
}}
Ensure the JSON is valid and conforms exactly to this structure without markdown wrappers.
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
            result = OpportunitiesResponse(**data)

            # Cache the result
            opportunities_cache.set(cache_key, result)
            return result

        except Exception as e:
            logger.error(f"Error formatting opportunities with Gemini: {e}")
            # Fallback if Gemini fails
            return OpportunitiesResponse(
                fetched_at=datetime.utcnow().isoformat(),
                total_found=0,
                opportunities=[],
                spotlight="AI processing failed.",
                notice="Failed to process live data — please try again later."
            )

opportunities_agent = OpportunitiesAgent()
