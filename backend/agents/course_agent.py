import os
import json
import math
import logging
import asyncio
import httpx
import time
import re
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import ValidationError

from models.schemas import (
    CourseRecommendationRequest,
    CourseRecommendationResponse,
    Recommendation,
    YouTubeRecommendation,
)

logger = logging.getLogger(__name__)

# ==========================================
# Cache
# ==========================================

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

course_cache = SimpleDictCache(ttl_seconds=43200)

# ==========================================
# Curated Courses (fallback when YouTube fails)
# ==========================================

CURATED_COURSES = {
    "AI/ML": [
        {"name": "Andrew Ng Machine Learning Specialization", "platform": "Coursera", "url": "https://coursera.org/specializations/machine-learning-introduction", "level": "Beginner", "duration_hours": 50, "is_free": True},
        {"name": "fast.ai Practical Deep Learning", "platform": "fast.ai", "url": "https://course.fast.ai", "level": "Intermediate", "duration_hours": 30, "is_free": True},
        {"name": "Hugging Face NLP Course", "platform": "Hugging Face", "url": "https://huggingface.co/course", "level": "Intermediate", "duration_hours": 20, "is_free": True},
        {"name": "Stanford CS229 Machine Learning", "platform": "YouTube (Stanford)", "url": "https://www.youtube.com/playlist?list=PLoROMvodv4rMiGQp3WXShtMGgzqpfVfbU", "level": "Intermediate", "duration_hours": 40, "is_free": True},
        {"name": "deeplearning.ai TensorFlow Developer Certificate", "platform": "Coursera", "url": "https://www.coursera.org/professional-certificates/tensorflow-in-practice", "level": "Intermediate", "duration_hours": 35, "is_free": False},
        {"name": "3Blue1Brown Neural Networks", "platform": "YouTube", "url": "https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi", "level": "Beginner", "duration_hours": 5, "is_free": True},
        {"name": "Machine Learning with Python", "platform": "GeeksforGeeks", "url": "https://www.geeksforgeeks.org/machine-learning/", "level": "Beginner", "duration_hours": 25, "is_free": True},
        {"name": "Python for Data Science and ML Bootcamp", "platform": "Udemy", "url": "https://www.udemy.com/course/python-for-data-science-and-machine-learning-bootcamp/", "level": "Beginner", "duration_hours": 25, "is_free": False},
        {"name": "Applied AI with DeepLearning", "platform": "Coursera (IBM)", "url": "https://www.coursera.org/learn/applied-deep-learning-tensorflow", "level": "Intermediate", "duration_hours": 30, "is_free": False},
        {"name": "AI Engineer Internship Prep", "platform": "Internshala", "url": "https://trainings.internshala.com/", "level": "Beginner", "duration_hours": 15, "is_free": False},
        {"name": "Google AI Crash Course", "platform": "Google", "url": "https://developers.google.com/machine-learning/crash-course", "level": "Beginner", "duration_hours": 15, "is_free": True},
        {"name": "DataCamp Machine Learning Scientist", "platform": "DataCamp", "url": "https://www.datacamp.com/tracks/machine-learning-scientist-with-python", "level": "Intermediate", "duration_hours": 90, "is_free": False},
    ],
    "Web Development": [
        {"name": "The Odin Project", "platform": "Website", "url": "https://www.theodinproject.com/", "level": "Beginner", "duration_hours": 100, "is_free": True},
        {"name": "Full Stack Open", "platform": "University of Helsinki", "url": "https://fullstackopen.com/en/", "level": "Intermediate", "duration_hours": 120, "is_free": True},
        {"name": "freeCodeCamp Responsive Web Design", "platform": "freeCodeCamp", "url": "https://www.freecodecamp.org/learn/2022/responsive-web-design/", "level": "Beginner", "duration_hours": 300, "is_free": True},
        {"name": "JavaScript.info", "platform": "Website", "url": "https://javascript.info/", "level": "Intermediate", "duration_hours": 60, "is_free": True},
        {"name": "React Official Tutorial", "platform": "Website", "url": "https://react.dev/learn", "level": "Intermediate", "duration_hours": 20, "is_free": True},
        {"name": "Traversy Media Crash Courses", "platform": "YouTube", "url": "https://www.youtube.com/@TraversyMedia", "level": "Beginner", "duration_hours": 40, "is_free": True},
        {"name": "Web Development Bootcamp", "platform": "Udemy (Angela Yu)", "url": "https://www.udemy.com/course/the-complete-web-development-bootcamp/", "level": "Beginner", "duration_hours": 65, "is_free": False},
        {"name": "Full Stack Development with MERN", "platform": "GeeksforGeeks", "url": "https://www.geeksforgeeks.org/mern-stack/", "level": "Intermediate", "duration_hours": 40, "is_free": True},
        {"name": "Advanced Web Development", "platform": "Coursera (Meta)", "url": "https://www.coursera.org/professional-certificates/meta-front-end-developer", "level": "Intermediate", "duration_hours": 50, "is_free": False},
        {"name": "Web Development Internship Training", "platform": "Internshala", "url": "https://trainings.internshala.com/s/web-development", "level": "Beginner", "duration_hours": 10, "is_free": False},
        {"name": "Node.js Express MongoDB Bootcamp", "platform": "Udemy (Jonas)", "url": "https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/", "level": "Intermediate", "duration_hours": 40, "is_free": False},
        {"name": "Next.js Full Stack Tutorial", "platform": "YouTube (Traversy)", "url": "https://www.youtube.com/watch?v=mTz0GXj8NN0", "level": "Intermediate", "duration_hours": 10, "is_free": True},
    ],
    "DSA/CP": [
        {"name": "CSES Problem Set", "platform": "CSES", "url": "https://cses.fi/problemset/", "level": "Intermediate", "duration_hours": 100, "is_free": True},
        {"name": "Striver's A2Z DSA Course", "platform": "takeUforward", "url": "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2", "level": "Beginner", "duration_hours": 80, "is_free": True},
        {"name": "Neetcode Roadmap", "platform": "Neetcode", "url": "https://neetcode.io/roadmap", "level": "Intermediate", "duration_hours": 100, "is_free": True},
        {"name": "LeetCode Patterns (Blind 75)", "platform": "Neetcode", "url": "https://neetcode.io/practice", "level": "Intermediate", "duration_hours": 50, "is_free": True},
        {"name": "Abdul Bari Algorithms", "platform": "YouTube", "url": "https://www.youtube.com/channel/UCZCFT11CWBi3MHNlGf019nw", "level": "Beginner", "duration_hours": 30, "is_free": True},
        {"name": "CP-Algorithms", "platform": "Website", "url": "https://cp-algorithms.com/", "level": "Advanced", "duration_hours": 40, "is_free": True},
        {"name": "DSA Self-Paced Course", "platform": "GeeksforGeeks", "url": "https://practice.geeksforgeeks.org/courses/dsa-self-paced", "level": "Beginner", "duration_hours": 80, "is_free": False},
        {"name": "Data Structures and Algorithms Specialization", "platform": "Coursera (UCSD)", "url": "https://www.coursera.org/specializations/data-structures-algorithms", "level": "Intermediate", "duration_hours": 60, "is_free": False},
        {"name": "Mastering Data Structures & Algorithms using C and C++", "platform": "Udemy (Abdul Bari)", "url": "https://www.udemy.com/course/data-structures-and-algorithms-in-c-cpp/", "level": "Beginner", "duration_hours": 50, "is_free": False},
        {"name": "DSA in Java Training", "platform": "Internshala", "url": "https://trainings.internshala.com/s/dsa-java", "level": "Beginner", "duration_hours": 15, "is_free": False},
        {"name": "Algorithms Specialization (Stanford)", "platform": "Coursera", "url": "https://www.coursera.org/specializations/algorithms", "level": "Intermediate", "duration_hours": 40, "is_free": False},
        {"name": "Striver SDE Sheet - 191 Problems", "platform": "takeUforward", "url": "https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2", "level": "Intermediate", "duration_hours": 70, "is_free": True},
    ],
    "Cloud": [
        {"name": "AWS Cloud Practitioner Essentials", "platform": "AWS Skill Builder", "url": "https://explore.skillbuilder.aws/", "level": "Beginner", "duration_hours": 6, "is_free": True},
        {"name": "Google Cloud Computing Foundations", "platform": "Google Cloud Skills Boost", "url": "https://www.cloudskillsboost.google/", "level": "Beginner", "duration_hours": 40, "is_free": True},
        {"name": "freeCodeCamp DevOps with Docker", "platform": "YouTube", "url": "https://www.youtube.com/watch?v=3c-iBn73dDE", "level": "Beginner", "duration_hours": 3, "is_free": True},
        {"name": "Kubernetes Official Tutorials", "platform": "Website", "url": "https://kubernetes.io/docs/tutorials/", "level": "Intermediate", "duration_hours": 20, "is_free": True},
        {"name": "AWS Solutions Architect Associate", "platform": "A Cloud Guru", "url": "https://acloudguru.com/course/aws-certified-solutions-architect-associate-saa-c03", "level": "Intermediate", "duration_hours": 40, "is_free": False},
        {"name": "AWS Cloud Computing Basics", "platform": "GeeksforGeeks", "url": "https://www.geeksforgeeks.org/cloud-computing/", "level": "Beginner", "duration_hours": 15, "is_free": True},
        {"name": "AWS Certified Solutions Architect", "platform": "Udemy (Stephane Maarek)", "url": "https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/", "level": "Intermediate", "duration_hours": 30, "is_free": False},
        {"name": "Cloud Computing Specialization", "platform": "Coursera (U of Illinois)", "url": "https://www.coursera.org/specializations/cloud-computing", "level": "Intermediate", "duration_hours": 50, "is_free": False},
        {"name": "Cloud Computing Internship", "platform": "Internshala", "url": "https://trainings.internshala.com/s/cloud-computing", "level": "Beginner", "duration_hours": 10, "is_free": False},
        {"name": "Azure Fundamentals AZ-900", "platform": "Microsoft Learn", "url": "https://learn.microsoft.com/en-us/training/paths/azure-fundamentals/", "level": "Beginner", "duration_hours": 12, "is_free": True},
        {"name": "Docker and Kubernetes: The Practical Guide", "platform": "Udemy (Maximilian)", "url": "https://www.udemy.com/course/docker-kubernetes-the-practical-guide/", "level": "Intermediate", "duration_hours": 25, "is_free": False},
    ],
    "CyberSec": [
        {"name": "TryHackMe Pre Security", "platform": "TryHackMe", "url": "https://tryhackme.com/", "level": "Beginner", "duration_hours": 20, "is_free": True},
        {"name": "PicoCTF", "platform": "picoCTF", "url": "https://picoctf.org/", "level": "Beginner", "duration_hours": 30, "is_free": True},
        {"name": "Cybrary Free Courses", "platform": "Cybrary", "url": "https://www.cybrary.it/", "level": "Beginner", "duration_hours": 50, "is_free": True},
        {"name": "NetworkChuck Networking Basics", "platform": "YouTube", "url": "https://www.youtube.com/@NetworkChuck", "level": "Beginner", "duration_hours": 15, "is_free": True},
        {"name": "Professor Messer CompTIA Security+", "platform": "YouTube", "url": "https://www.youtube.com/@professormesser", "level": "Beginner", "duration_hours": 25, "is_free": True},
        {"name": "Cyber Security Course for Beginners", "platform": "GeeksforGeeks", "url": "https://www.geeksforgeeks.org/cyber-security/", "level": "Beginner", "duration_hours": 15, "is_free": True},
        {"name": "Ethical Hacking from Scratch", "platform": "Udemy", "url": "https://www.udemy.com/course/learn-ethical-hacking-from-scratch/", "level": "Beginner", "duration_hours": 25, "is_free": False},
        {"name": "Google Cybersecurity Certificate", "platform": "Coursera", "url": "https://www.coursera.org/professional-certificates/google-cybersecurity", "level": "Beginner", "duration_hours": 100, "is_free": False},
        {"name": "Cybersecurity Internship Training", "platform": "Internshala", "url": "https://trainings.internshala.com/s/cyber-security", "level": "Beginner", "duration_hours": 10, "is_free": False},
        {"name": "Nmap Network Scanning", "platform": "Udemy", "url": "https://www.udemy.com/course/nmap-network-scanning/", "level": "Intermediate", "duration_hours": 12, "is_free": False},
        {"name": "Web Application Security (OWASP Top 10)", "platform": "Udemy", "url": "https://www.udemy.com/course/web-application-security-the-complete-guide/", "level": "Intermediate", "duration_hours": 15, "is_free": False},
    ],
    "Mobile": [
        {"name": "Android Basics in Kotlin", "platform": "Google Developers", "url": "https://developer.android.com/courses", "level": "Beginner", "duration_hours": 50, "is_free": True},
        {"name": "Flutter Official Documentation", "platform": "Flutter", "url": "https://flutter.dev/learn", "level": "Beginner", "duration_hours": 40, "is_free": True},
        {"name": "React Native Official Tutorial", "platform": "Website", "url": "https://reactnative.dev/docs/getting-started", "level": "Intermediate", "duration_hours": 30, "is_free": True},
        {"name": "Mitch Koko Flutter Course", "platform": "YouTube", "url": "https://www.youtube.com/@MitchKoko", "level": "Beginner", "duration_hours": 20, "is_free": True},
        {"name": "CodeWithAndrea Flutter", "platform": "YouTube", "url": "https://www.youtube.com/@CodeWithAndrea", "level": "Intermediate", "duration_hours": 25, "is_free": True},
        {"name": "Android App Development Guide", "platform": "GeeksforGeeks", "url": "https://www.geeksforgeeks.org/android-development/", "level": "Beginner", "duration_hours": 20, "is_free": True},
        {"name": "The Complete Android N Developer Course", "platform": "Udemy", "url": "https://www.udemy.com/course/the-complete-android-n-developer-course/", "level": "Beginner", "duration_hours": 40, "is_free": False},
        {"name": "Meta React Native Developer Certificate", "platform": "Coursera", "url": "https://www.coursera.org/professional-certificates/meta-react-native-developer", "level": "Intermediate", "duration_hours": 60, "is_free": False},
        {"name": "Flutter Development Training", "platform": "Internshala", "url": "https://trainings.internshala.com/s/flutter-development", "level": "Beginner", "duration_hours": 10, "is_free": False},
        {"name": "iOS App Development with Swift", "platform": "Coursera (U of Toronto)", "url": "https://www.coursera.org/learn/developing-ios-apps-with-swift", "level": "Beginner", "duration_hours": 30, "is_free": False},
        {"name": "Build a Social Media App with Flutter", "platform": "Udemy (Andrei Neagoie)", "url": "https://www.udemy.com/course/flutter-social-media-app/", "level": "Intermediate", "duration_hours": 25, "is_free": False},
    ],
}

# ==========================================
# YouTube Scoring Constants
# ==========================================

SCORING_WEIGHTS = {
    "view_count": 0.25,
    "like_ratio": 0.20,
    "duration_bonus": 0.15,
    "channel_trust": 0.20,
    "recency": 0.10,
    "playlist_bonus": 0.10,
}

TRUSTED_CHANNELS = {
    "AI/ML": [
        "3Blue1Brown", "StatQuest", "Two Minute Papers", "DeepLearning.AI",
        "Andrej Karpathy", "Yannic Kilcher", "AI explained", "Sentdex",
        "freeCodeCamp", "AssemblyAI", "Weights & Biases", "James Briggs",
    ],
    "Web Development": [
        "Fireship", "Traversy Media", "The Net Ninja", "Academind",
        "Web Dev Simplified", "Kevin Powell", "freeCodeCamp", "CodingWithTim",
        "Jack Herrington", "ByteGrad", "Theo", "Matt Pocock",
    ],
    "DSA/CP": [
        "takeUforward", "Neetcode", "Abdul Bari", "mycodeschool",
        "Errichto", "Ben Wright", "Tushar Roy", "Gate Smashers",
        "Jenny's lectures CS/IT", "code_nicely", "codeBeyond", "Striver",
    ],
    "Cloud": [
        "freeCodeCamp", "NetworkChuck", "TechWorld with Nana", "DevOps Toolkit",
        "AWS", "Google Cloud", "KodeKloud", "Nana Janashia",
    ],
    "CyberSec": [
        "NetworkChuck", "John Hammond", "Professor Messer", "The Cyber Mentor",
        "LiveOverflow", "IppSec", "HackerSploit", "Simply Cyber",
    ],
    "Mobile": [
        "Mitch Koko", "CodeWithAndrea", "Flutter Mapp", "filledStacks",
        "The Net Ninja", "Academind", "Simon Leung", "Tech With Tim",
    ],
}

INTERVIEW_KEYWORDS = [
    "interview", "placement", "coding test", "coding round", "hr round",
    "technical interview", "system design interview", "dsa interview",
    "mcq test", "aptitude", "problem solving interview", "mock interview",
    "campus placement", "off campus", "hiring", "assessment",
]

# ==========================================
# LLM Setup
# ==========================================

def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0.3,
        api_key=os.getenv("GEMINI_API_KEY"),
        max_retries=0,
        response_mime_type="application/json",
    )


class AgentProcessingError(Exception):
    pass


def _extract_json(content: str) -> str:
    content = content.strip()
    if "```json" in content:
        return content.split("```json")[1].split("```")[0].strip()
    if "```" in content:
        return content.split("```")[1].split("```")[0].strip()
    start, end = content.find("{"), content.rfind("}")
    if start != -1 and end != -1 and end > start:
        return content[start:end + 1]
    return content


def _parse_iso_duration(duration_str: str) -> int:
    """Parse ISO 8601 duration (e.g. PT2H30M15S) to minutes."""
    if not duration_str:
        return 0
    match = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", duration_str)
    if not match:
        return 0
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    return hours * 60 + minutes + (1 if seconds >= 30 else 0)


def _current_year() -> int:
    return datetime.now().year


# ==========================================
# YouTube Pipeline
# ==========================================

class YouTubePipeline:
    """Fetches, scores, categorizes, and re-ranks YouTube content."""

    def __init__(self):
        self.api_key = os.getenv("YOUTUBE_API_KEY")
        self.base_url = "https://www.googleapis.com/youtube/v3"
        self.has_api_key = bool(self.api_key)

    async def fetch_videos(self, domain: str, level: str, max_results: int = 25) -> List[Dict[str, Any]]:
        if not self.has_api_key:
            logger.warning("YOUTUBE_API_KEY not set. Skipping YouTube video search.")
            return []

        query = f"{domain} {level} full course tutorial {_current_year()}"
        search_params = {
            "part": "snippet",
            "q": query,
            "type": "video",
            "videoDuration": "long",
            "relevanceLanguage": "en",
            "order": "relevance",
            "maxResults": min(max_results, 50),
            "key": self.api_key,
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                search_resp = await client.get(f"{self.base_url}/search", params=search_params)
                search_resp.raise_for_status()
                search_data = search_resp.json()

                video_ids = [
                    item["id"]["videoId"]
                    for item in search_data.get("items", [])
                    if item.get("id", {}).get("kind") == "youtube#video"
                ]

                if not video_ids:
                    return []

                video_params = {
                    "part": "snippet,statistics,contentDetails",
                    "id": ",".join(video_ids),
                    "key": self.api_key,
                }
                video_resp = await client.get(f"{self.base_url}/videos", params=video_params)
                video_resp.raise_for_status()
                video_data = video_resp.json()

                results = []
                for item in video_data.get("items", []):
                    snippet = item.get("snippet", {})
                    stats = item.get("statistics", {})
                    content = item.get("contentDetails", {})

                    duration_min = _parse_iso_duration(content.get("duration", ""))
                    if duration_min < 5:
                        continue

                    thumbnails = snippet.get("thumbnails", {})
                    thumb_url = thumbnails.get("medium", {}).get("url", thumbnails.get("default", {}).get("url", ""))

                    results.append({
                        "title": snippet.get("title", ""),
                        "channel": snippet.get("channelTitle", ""),
                        "url": f"https://www.youtube.com/watch?v={item['id']}",
                        "type": "video",
                        "duration_minutes": duration_min,
                        "view_count": int(stats.get("viewCount", 0)),
                        "like_count": int(stats.get("likeCount", 0)),
                        "comment_count": int(stats.get("commentCount", 0)),
                        "thumbnail": thumb_url,
                        "published_at": snippet.get("publishedAt", ""),
                        "description": snippet.get("description", "")[:500],
                    })

                logger.info(f"YouTube video search: {len(results)} results for '{domain} {level}'")
                return results

        except httpx.HTTPStatusError as e:
            logger.error(f"YouTube API HTTP error: {e.response.status_code} - {e.response.text[:200]}")
            return []
        except Exception as e:
            logger.error(f"YouTube video fetch failed: {e}")
            return []

    async def fetch_playlists(self, domain: str, level: str, max_results: int = 10) -> List[Dict[str, Any]]:
        if not self.has_api_key:
            return []

        query = f"{domain} {level} full course playlist {_current_year()}"
        search_params = {
            "part": "snippet",
            "q": query,
            "type": "playlist",
            "relevanceLanguage": "en",
            "order": "relevance",
            "maxResults": min(max_results, 50),
            "key": self.api_key,
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                search_resp = await client.get(f"{self.base_url}/search", params=search_params)
                search_resp.raise_for_status()
                search_data = search_resp.json()

                playlist_ids = [
                    item["id"]["playlistId"]
                    for item in search_data.get("items", [])
                    if item.get("id", {}).get("kind") == "youtube#playlist"
                ]

                if not playlist_ids:
                    return []

                pl_params = {
                    "part": "snippet,contentDetails",
                    "id": ",".join(playlist_ids[:10]),
                    "key": self.api_key,
                }
                pl_resp = await client.get(f"{self.base_url}/playlists", params=pl_params)
                pl_resp.raise_for_status()
                pl_data = pl_resp.json()

                results = []
                for item in pl_data.get("items", []):
                    snippet = item.get("snippet", {})
                    content = item.get("contentDetails", {})
                    item_count = content.get("itemCount", 0)

                    thumbnails = snippet.get("thumbnails", {})
                    thumb_url = thumbnails.get("medium", {}).get("url", thumbnails.get("default", {}).get("url", ""))

                    results.append({
                        "title": snippet.get("title", ""),
                        "channel": snippet.get("channelTitle", ""),
                        "url": f"https://www.youtube.com/playlist?list={item['id']}",
                        "type": "playlist",
                        "item_count": item_count,
                        "thumbnail": thumb_url,
                        "published_at": snippet.get("publishedAt", ""),
                        "description": snippet.get("description", "")[:500],
                        "view_count": 0,
                        "like_count": 0,
                        "comment_count": 0,
                        "duration_minutes": 0,
                    })

                logger.info(f"YouTube playlist search: {len(results)} playlists for '{domain} {level}'")
                return results

        except Exception as e:
            logger.error(f"YouTube playlist fetch failed: {e}")
            return []

    def _score_item(self, item: Dict[str, Any], domain: str, is_playlist: bool = False) -> float:
        score = 0.0

        views = max(item.get("view_count", 1), 1)
        log_views = math.log10(views)
        view_score = min(log_views / 8.0, 1.0)
        score += view_score * SCORING_WEIGHTS["view_count"]

        likes = item.get("like_count", 0)
        if views > 100 and likes > 0:
            like_ratio = likes / views
            like_score = min(like_ratio / 0.1, 1.0)
        else:
            like_score = 0.3
        score += like_score * SCORING_WEIGHTS["like_ratio"]

        duration = item.get("duration_minutes", 0)
        if is_playlist:
            item_count = item.get("item_count", 0)
            if item_count >= 20:
                duration_score = 1.0
            elif item_count >= 10:
                duration_score = 0.8
            else:
                duration_score = 0.5
        else:
            if 20 <= duration <= 120:
                duration_score = 1.0
            elif 120 < duration <= 300:
                duration_score = 0.85
            elif 10 <= duration < 20:
                duration_score = 0.6
            else:
                duration_score = 0.3
        score += duration_score * SCORING_WEIGHTS["duration_bonus"]

        channel = item.get("channel", "")
        trusted = TRUSTED_CHANNELS.get(domain, [])
        channel_match = any(t.lower() in channel.lower() for t in trusted)
        score += (1.0 if channel_match else 0.1) * SCORING_WEIGHTS["channel_trust"]

        pub_date = item.get("published_at", "")
        if pub_date:
            try:
                pub_dt = datetime.fromisoformat(pub_date.replace("Z", "+00:00"))
                years_old = (datetime.now(timezone.utc) - pub_dt).days / 365.0
                if years_old <= 1:
                    recency = 1.0
                elif years_old <= 2:
                    recency = 0.8
                elif years_old <= 3:
                    recency = 0.5
                else:
                    recency = 0.2
            except Exception:
                recency = 0.5
        else:
            recency = 0.5
        score += recency * SCORING_WEIGHTS["recency"]

        if is_playlist:
            score += 1.0 * SCORING_WEIGHTS["playlist_bonus"]

        return round(score, 4)

    def score_all(self, videos: List[Dict], playlists: List[Dict], domain: str) -> List[Dict]:
        scored = []
        for v in videos:
            v["score"] = self._score_item(v, domain, is_playlist=False)
            scored.append(v)
        for p in playlists:
            p["score"] = self._score_item(p, domain, is_playlist=True)
            scored.append(p)
        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored

    def categorize(self, scored_items: List[Dict]) -> Dict[str, List[Dict]]:
        top_courses = []
        top_playlists = []
        best_tutorials = []
        best_interview = []

        for item in scored_items:
            title_lower = (item.get("title", "") + " " + item.get("description", "")).lower()
            is_interview = any(kw in title_lower for kw in INTERVIEW_KEYWORDS)

            if item["type"] == "playlist":
                if len(top_playlists) < 5:
                    top_playlists.append(item)
            elif item["type"] == "video":
                duration = item.get("duration_minutes", 0)

                if is_interview and len(best_interview) < 5:
                    best_interview.append(item)

                if duration >= 20 and len(top_courses) < 5:
                    top_courses.append(item)
                elif 5 <= duration < 20 and len(best_tutorials) < 5:
                    best_tutorials.append(item)

        if len(top_courses) < 5:
            for item in scored_items:
                if item["type"] == "video" and item not in top_courses and item not in best_tutorials and item not in best_interview:
                    if len(top_courses) >= 5:
                        break
                    top_courses.append(item)

        if len(best_tutorials) < 5:
            for item in scored_items:
                if item["type"] == "video" and item not in top_courses and item not in best_tutorials and item not in best_interview:
                    if len(best_tutorials) >= 5:
                        break
                    best_tutorials.append(item)

        return {
            "top_courses": top_courses,
            "top_playlists": top_playlists,
            "best_tutorials": best_tutorials,
            "best_interview_resources": best_interview,
        }

    def _to_yt_recommendation(self, item: Dict, rank: int) -> YouTubeRecommendation:
        reasons = []
        if item.get("score", 0) > 0.7:
            reasons.append("Highly rated")
        channel = item.get("channel", "")
        trusted = TRUSTED_CHANNELS.get("", [])
        for domain_channels in TRUSTED_CHANNELS.values():
            if any(t.lower() in channel.lower() for t in domain_channels):
                reasons.append(f"Trusted channel: {channel}")
                break
        if item["type"] == "playlist":
            reasons.append(f"Curated playlist with {item.get('item_count', '?')} videos")
        views = item.get("view_count", 0)
        if views > 100000:
            reasons.append(f"{views // 1000}K+ views")

        return YouTubeRecommendation(
            rank=rank,
            title=item["title"],
            channel=item.get("channel", ""),
            url=item.get("url", ""),
            type=item["type"],
            duration_minutes=item.get("duration_minutes", 0),
            view_count=item.get("view_count", 0),
            like_count=item.get("like_count", 0),
            comment_count=item.get("comment_count", 0),
            score=item.get("score", 0),
            why_recommended="; ".join(reasons) if reasons else "Relevant to your domain",
            thumbnail=item.get("thumbnail", ""),
            published_at=item.get("published_at", ""),
            item_count=item.get("item_count"),
        )

    async def run(self, domain: str, level: str) -> Dict[str, List[YouTubeRecommendation]]:
        videos, playlists = await asyncio.gather(
            self.fetch_videos(domain, level, max_results=25),
            self.fetch_playlists(domain, level, max_results=10),
        )

        if not videos and not playlists:
            return {
                "top_courses": [],
                "top_playlists": [],
                "best_tutorials": [],
                "best_interview_resources": [],
            }

        scored = self.score_all(videos, playlists, domain)
        categories = self.categorize(scored)

        result = {}
        for cat_name, items in categories.items():
            result[cat_name] = [self._to_yt_recommendation(item, i + 1) for i, item in enumerate(items)]

        total = sum(len(v) for v in result.values())
        logger.info(f"YouTube pipeline: {total} categorized results ({len(videos)} videos, {len(playlists)} playlists)")
        return result


# ==========================================
# AI Re-ranker
# ==========================================

async def ai_rerank(
    yt_categories: Dict[str, List[YouTubeRecommendation]],
    request: CourseRecommendationRequest,
) -> Dict[str, List[YouTubeRecommendation]]:
    all_items = []
    for cat_name, items in yt_categories.items():
        for item in items:
            all_items.append((cat_name, item))

    if len(all_items) <= 5:
        return yt_categories

    items_text = "\n".join([
        f"- [{cat}] #{item.rank} '{item.title}' by {item.channel} | {item.duration_minutes}min | {item.view_count} views | score={item.score}"
        for cat, item in all_items
    ])

    system_prompt = (
        "You are an expert tech education advisor. Re-rank the following YouTube resources "
        "for a student based on quality and relevance. Return ONLY a JSON object with keys "
        "for each category, each containing a list of ranked items (each item is an integer index 0-based). "
        "You may move items between categories if more appropriate. "
        "Keep 3-5 items per category."
    )

    user_prompt = f"""
Student Profile:
- Domain: {request.domain}
- Level: {request.level}
- Career Goal: {request.career_goal}
- Study Hours: {request.hours_per_day}h/day

Current items:
{items_text}

Return JSON:
{{
  "top_courses": [indices...],
  "top_playlists": [indices...],
  "best_tutorials": [indices...],
  "best_interview_resources": [indices...]
}}
"""

    llm = get_llm()
    full_prompt = f"{system_prompt}\n\n{user_prompt}"

    try:
        response = await llm.ainvoke(full_prompt)
        content = _extract_json(response.content)
        rerank_data = json.loads(content)

        new_categories = {k: [] for k in yt_categories}
        for cat_name, indices in rerank_data.items():
            if cat_name not in new_categories:
                continue
            for idx in indices:
                if isinstance(idx, int) and 0 <= idx < len(all_items):
                    orig_cat, item = all_items[idx]
                    new_categories[cat_name].append(item)

        for cat_name in new_categories:
            for i, item in enumerate(new_categories[cat_name]):
                item.rank = i + 1

        logger.info("AI re-ranking completed successfully")
        return new_categories

    except Exception as e:
        logger.warning(f"AI re-ranking failed, using score-based ranking: {e}")
        return yt_categories


# ==========================================
# Main Course Agent
# ==========================================

class CourseRecommendationAgent:

    def _generate_mock(self, request: CourseRecommendationRequest) -> CourseRecommendationResponse:
        curated = CURATED_COURSES.get(request.domain, [])
        recommendations = []
        for i, c in enumerate(curated[:10]):
            recommendations.append({
                'rank': i + 1,
                'title': c['name'],
                'platform': c['platform'],
                'url': c['url'],
                'type': 'MOOC',
                'duration_hours': c['duration_hours'],
                'is_free': c.get('is_free', False),
                'why_recommended': f'Great for building {request.domain} fundamentals',
                'best_for': f'{request.level} learners',
                'weekly_hours_needed': min(request.hours_per_day * 7, 10),
                'completion_weeks': max(1, c['duration_hours'] // max(request.hours_per_day * 7, 1)),
            })
        return CourseRecommendationResponse(
            domain=request.domain,
            level=request.level,
            recommendations=recommendations,
            learning_path=f'Start with beginner-friendly resources, then progress to advanced {request.domain} topics.',
            total_hours=sum(r['duration_hours'] for r in recommendations),
        )

    async def fetch_youtube_courses(self, domain: str, level: str) -> List[Dict[str, Any]]:
        api_key = os.getenv("YOUTUBE_API_KEY")
        if not api_key:
            return []
        query = f"{domain} {level} full course for beginners {_current_year()}"
        params = {
            "part": "snippet",
            "q": query,
            "type": "video",
            "videoDuration": "long",
            "maxResults": 10,
            "key": api_key,
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                search_response = await client.get("https://www.googleapis.com/youtube/v3/search", params=params)
                search_response.raise_for_status()
                search_data = search_response.json()
                video_ids = [item["id"]["videoId"] for item in search_data.get("items", [])]
                if not video_ids:
                    return []
                video_params = {
                    "part": "snippet,statistics,contentDetails",
                    "id": ",".join(video_ids),
                    "key": api_key,
                }
                video_response = await client.get("https://www.googleapis.com/youtube/v3/videos", params=video_params)
                video_response.raise_for_status()
                video_data = video_response.json()
                results = []
                for item in video_data.get("items", []):
                    results.append({
                        "title": item["snippet"]["title"],
                        "channel": item["snippet"]["channelTitle"],
                        "url": f"https://www.youtube.com/watch?v={item['id']}",
                        "views": item.get("statistics", {}).get("viewCount", "0"),
                        "duration": item.get("contentDetails", {}).get("duration", ""),
                    })
                return results
        except Exception as e:
            logger.error(f"Failed to fetch YouTube courses: {e}")
            return []

    async def recommend_courses(self, request: CourseRecommendationRequest) -> CourseRecommendationResponse:
        cache_key = f"{request.domain}_{request.level}_{request.career_goal}"
        cached_result = course_cache.get(cache_key)
        if cached_result:
            logger.info(f"Returning cached course recommendations for key: {cache_key}")
            return cached_result

        youtube_results = await self.fetch_youtube_courses(request.domain, request.level)
        curated_list = CURATED_COURSES.get(request.domain, [])

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
Merge these resources, select the top 10 most relevant and high-quality courses for this specific student, and rank them.
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
        except Exception as e:
            logger.warning(f"Gemini course recommendation failed after retries, using mock: {e}")
            result = self._generate_mock(request)

        yt_pipeline = YouTubePipeline()
        yt_categories = await yt_pipeline.run(request.domain, request.level)

        if any(v for v in yt_categories.values()):
            try:
                yt_categories = await ai_rerank(yt_categories, request)
            except Exception as e:
                logger.warning(f"AI re-rank failed, keeping score-based ranking: {e}")

        result.top_courses = yt_categories.get("top_courses", [])
        result.top_playlists = yt_categories.get("top_playlists", [])
        result.best_tutorials = yt_categories.get("best_tutorials", [])
        result.best_interview_resources = yt_categories.get("best_interview_resources", [])

        course_cache.set(cache_key, result)
        return result

    @retry(
        wait=wait_exponential(multiplier=1, min=1, max=4),
        stop=stop_after_attempt(3),
        retry=retry_if_exception_type(AgentProcessingError),
        reraise=True,
    )
    async def _invoke_with_retry(self, llm, full_prompt: str) -> CourseRecommendationResponse:
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
