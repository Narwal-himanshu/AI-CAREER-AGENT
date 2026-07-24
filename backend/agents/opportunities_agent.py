import os
import logging
import asyncio
import httpx
import feedparser
import time
from datetime import datetime
from typing import Dict, Any, List

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
            f"{domain} hackathon {month_name} {year} for students India",
            f"{domain} coding contest competition {month_name} {year} India",
            f"open source programs students {year} {domain}",
            f"{domain} internship hiring {year} India students",
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

    def _classify_type(self, title: str, snippet: str) -> str:
        text = f"{title} {snippet}".lower()
        if any(w in text for w in ["ctf", "capture the flag"]):
            return "CTF"
        if any(w in text for w in ["hackathon", "hack"]):
            return "Hackathon"
        if any(w in text for w in ["contest", "competition", "weekly contest", "biweekly"]):
            return "Contest"
        if any(w in text for w in ["internship", "intern", "hiring"]):
            return "Internship"
        if any(w in text for w in ["open source", "gsoc", "hacktoberfest", "outreachy", "lfx"]):
            return "Open Source"
        return "Contest"

    def _classify_level(self, text: str) -> str:
        text = text.lower()
        if any(w in text for w in ["advanced", "expert", "senior"]):
            return "Advanced"
        return "All Levels"

    def _guess_deadline(self, text: str) -> str:
        import re
        date_match = re.search(r'(\d{4}-\d{2}-\d{2})', text)
        if date_match:
            return date_match.group(1)
        return None

    def _extract_prize(self, text: str) -> str:
        import re
        prize_patterns = [
            r'prize[s]?\s*(?:pool)?\s*[:\-]?\s*([₹$]\s*[\d,]+(?:\s*(?:lakh|crore|K|M|USD)?)?)',
            r'([₹$]\s*[\d,]+(?:\s*(?:lakh|crore|K|M|USD)?)?)\s*(?:prize|cash|reward)',
            r'win\s+([₹$]\s*[\d,]+(?:\s*(?:lakh|crore|K|M|USD)?)?)',
        ]
        for pat in prize_patterns:
            m = re.search(pat, text, re.IGNORECASE)
            if m:
                return f"Prize: {m.group(1).strip()}"
        return None

    def _parse_serper_results(self, items: List[Dict], domain: str, requested_types: List[str]) -> List[Dict]:
        opportunities = []
        seen_urls = set()

        for item in items:
            url = item.get("url", "")
            if url in seen_urls:
                continue
            seen_urls.add(url)

            title = item.get("title", "")
            snippet = item.get("snippet", "")
            full_text = f"{title} {snippet}"

            opp_type = self._classify_type(title, snippet)
            if opp_type not in requested_types:
                continue

            # Extract organiser from common patterns
            organiser = "Unknown"
            lower_title = title.lower()
            for sep in [" by ", " - ", " | ", " — ", " @ ", " from "]:
                if sep in lower_title:
                    parts = title.split(sep)
                    organiser = parts[-1].strip()[:60]
                    break
            if organiser == "Unknown":
                # Try known brands
                known_brands = ["Goldman Sachs", "Google", "Microsoft", "Amazon", "Meta", "Apple",
                                "Hacktoberfest", "LeetCode", "CodeChef", "Codeforces", "Kaggle",
                                "Devpost", "Unstop", "Internshala", "HackerEarth", "HackerRank"]
                for brand in known_brands:
                    if brand.lower() in lower_title:
                        organiser = brand
                        break
            if organiser == "Unknown" and len(title.split()) <= 4:
                organiser = title

            opportunities.append({
                "title": title,
                "type": opp_type,
                "organiser": organiser,
                "url": url,
                "deadline": self._guess_deadline(full_text),
                "prize_or_perk": self._extract_prize(full_text),
                "difficulty_level": self._classify_level(full_text),
                "domain_tags": [domain, opp_type],
                "why_apply": snippet or f"Great {opp_type.lower()} opportunity for {domain} students.",
                "registration_free": "free" in full_text.lower() or "no fee" in full_text.lower() or "registration" in full_text.lower(),
                "duration": "Varies",
            })

        return opportunities

    async def find_opportunities(self, request: OpportunitiesRequest, page: int = 1, limit: int = 12) -> OpportunitiesResponse:
        cache_key = f"{request.domain}_{request.level}"
        cached_result = opportunities_cache.get(cache_key)

        if cached_result:
            logger.info(f"Returning cached opportunities for key: {cache_key}")
            all_opps = [o.model_dump() if hasattr(o, 'model_dump') else o for o in cached_result.opportunities]
        else:
            # Fetch from all sources concurrently
            devpost_task = self.fetch_devpost()
            serper_task = self.fetch_serper(request.domain)
            clist_task = self.fetch_clist()

            results = await asyncio.gather(devpost_task, serper_task, clist_task)
            devpost_items, serper_items, clist_items = results

            # Parse Serper results directly (no Gemini needed)
            parsed = self._parse_serper_results(serper_items, request.domain, request.types)

            # Add Devpost results
            for item in devpost_items:
                opp_type = self._classify_type(item.get("title", ""), "")
                if opp_type not in request.types:
                    continue
                parsed.append({
                    "title": item.get("title", ""),
                    "type": opp_type,
                    "organiser": "Devpost",
                    "url": item.get("url", ""),
                    "deadline": None,
                    "prize_or_perk": None,
                    "difficulty_level": "All Levels",
                    "domain_tags": [request.domain, opp_type],
                    "why_apply": f"Active hackathon on Devpost for {request.domain} students.",
                    "registration_free": True,
                    "duration": "Varies",
                })

            # Add Clist contest results
            for item in clist_items:
                parsed.append({
                    "title": item.get("title", ""),
                    "type": "Contest",
                    "organiser": item.get("platform", "Unknown"),
                    "url": item.get("url", ""),
                    "deadline": item.get("end", None),
                    "prize_or_perk": None,
                    "difficulty_level": "All Levels",
                    "domain_tags": [request.domain, "CP"],
                    "why_apply": f"Upcoming competitive programming contest on {item.get('platform', 'unknown')}.",
                    "registration_free": True,
                    "duration": item.get("end", "TBD"),
                })

            all_opps = parsed

            # Cache all results
            if all_opps:
                spotlight = f"Best match: {all_opps[0]['title']} — {all_opps[0]['why_apply']}"
                cache_obj = OpportunitiesResponse(
                    fetched_at=datetime.utcnow().isoformat(),
                    total_found=len(all_opps),
                    opportunities=all_opps,
                    spotlight=spotlight,
                )
                opportunities_cache.set(cache_key, cache_obj)

        if not all_opps:
            return OpportunitiesResponse(
                fetched_at=datetime.utcnow().isoformat(),
                total_found=0,
                opportunities=[],
                spotlight="No opportunities found right now.",
                notice="No matching opportunities found — try broadening your filters."
            )

        # Paginate
        total = len(all_opps)
        total_pages = max(1, (total + limit - 1) // limit)
        start = (page - 1) * limit
        end = start + limit
        page_opps = all_opps[start:end]

        spotlight = f"Best match: {all_opps[0]['title']} — {all_opps[0]['why_apply']}"

        return OpportunitiesResponse(
            fetched_at=datetime.utcnow().isoformat(),
            total_found=total,
            opportunities=page_opps,
            spotlight=spotlight,
            page=page,
            total_pages=total_pages,
            has_more=page < total_pages,
        )

opportunities_agent = OpportunitiesAgent()
