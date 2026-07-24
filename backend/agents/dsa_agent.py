"""DSA Practice Agent — serves static JSON data with pagination."""

import json
import math
import logging
from pathlib import Path
from typing import Optional

from models.schemas import (
    DSAProblem,
    DSATopicInfo,
    DSACompanyInfo,
    DSAPaginatedResponse,
)

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
TOPICWISE_FILE = DATA_DIR / "topicwise.json"
COMPANYWISE_FILE = DATA_DIR / "companywise.json"

# Loaded once at startup
_topic_data: dict = {}
_company_data: dict = {}


def _load_data():
    global _topic_data, _company_data
    if not _topic_data and TOPICWISE_FILE.exists():
        _topic_data = json.loads(TOPICWISE_FILE.read_text(encoding="utf-8"))
        logger.info(f"Loaded topicwise data: {_topic_data.get('total_topics', 0)} topics, {_topic_data.get('total_problems', 0)} problems")
    if not _company_data and COMPANYWISE_FILE.exists():
        _company_data = json.loads(COMPANYWISE_FILE.read_text(encoding="utf-8"))
        logger.info(f"Loaded companywise data: {_company_data.get('total_companies', 0)} companies, {_company_data.get('total_problems', 0)} problems")


def get_modes() -> list[str]:
    return ["topicwise", "companywise"]


def get_topics() -> list[DSATopicInfo]:
    _load_data()
    return [
        DSATopicInfo(topic_name=t["topic_name"], problem_count=t["problem_count"])
        for t in _topic_data.get("topics", [])
    ]


def get_companies() -> list[DSACompanyInfo]:
    _load_data()
    return [
        DSACompanyInfo(company_name=c["company_name"], problem_count=c["problem_count"])
        for c in _company_data.get("companies", [])
    ]


def get_topic_problems(topic_name: str, page: int = 1, limit: int = 20) -> Optional[DSAPaginatedResponse]:
    _load_data()
    # Find topic (case-insensitive)
    topic_name_lower = topic_name.lower()
    for t in _topic_data.get("topics", []):
        if t["topic_name"].lower() == topic_name_lower:
            problems = [
                DSAProblem(
                    title=p["title"],
                    url=p["url"],
                    difficulty=p.get("difficulty", "MEDIUM"),
                    tags=p.get("tags", []),
                )
                for p in t["problems"]
            ]
            total = len(problems)
            total_pages = max(1, math.ceil(total / limit))
            start = (page - 1) * limit
            end = start + limit
            return DSAPaginatedResponse(
                problems=problems[start:end],
                total=total,
                page=page,
                limit=limit,
                total_pages=total_pages,
            )
    return None


def get_company_problems(company_name: str, page: int = 1, limit: int = 20) -> Optional[DSAPaginatedResponse]:
    _load_data()
    # Find company (case-insensitive)
    company_name_lower = company_name.lower()
    for c in _company_data.get("companies", []):
        if c["company_name"].lower() == company_name_lower:
            problems = [
                DSAProblem(
                    title=p["title"],
                    url=p["url"],
                    difficulty=p.get("difficulty", "MEDIUM"),
                    tags=p.get("tags", []),
                    frequency=p.get("frequency"),
                    acceptance_rate=p.get("acceptance_rate"),
                )
                for p in c["problems"]
            ]
            total = len(problems)
            total_pages = max(1, math.ceil(total / limit))
            start = (page - 1) * limit
            end = start + limit
            return DSAPaginatedResponse(
                problems=problems[start:end],
                total=total,
                page=page,
                limit=limit,
                total_pages=total_pages,
            )
    return None


def get_all_topic_problems(topic_name: str) -> Optional[list[DSAProblem]]:
    """Return ALL problems for a topic (no pagination). Used when filters are active."""
    _load_data()
    topic_name_lower = topic_name.lower()
    for t in _topic_data.get("topics", []):
        if t["topic_name"].lower() == topic_name_lower:
            return [
                DSAProblem(
                    title=p["title"],
                    url=p["url"],
                    difficulty=p.get("difficulty", "MEDIUM"),
                    tags=p.get("tags", []),
                )
                for p in t["problems"]
            ]
    return None


def get_all_company_problems(company_name: str) -> Optional[list[DSAProblem]]:
    """Return ALL problems for a company (no pagination). Used when filters are active."""
    _load_data()
    company_name_lower = company_name.lower()
    for c in _company_data.get("companies", []):
        if c["company_name"].lower() == company_name_lower:
            return [
                DSAProblem(
                    title=p["title"],
                    url=p["url"],
                    difficulty=p.get("difficulty", "MEDIUM"),
                    tags=p.get("tags", []),
                    frequency=p.get("frequency"),
                    acceptance_rate=p.get("acceptance_rate"),
                )
                for p in c["problems"]
            ]
    return None
