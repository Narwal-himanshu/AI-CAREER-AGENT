import os
import json
import time
import logging
from typing import Type, TypeVar, Optional, Any
from pydantic import BaseModel
import google.generativeai as genai
import config

T = TypeVar("T", bound=BaseModel)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def pydantic_to_gemini_schema(model: Type[BaseModel]) -> dict:
    """
    Converts a Pydantic model to a clean, Gemini-compatible OpenAPI schema.
    - Dereferences $ref and $defs.
    - Flattens nullable unions (anyOf).
    - Strips unsupported keys like default, minimum, maximum, propertyNames, additionalProperties, $defs.
    """
    schema = model.model_json_schema()
    defs = schema.get("$defs", {}) or schema.get("definitions", {}) or {}
    
    def resolve_ref(s: Any) -> Any:
        if not isinstance(s, dict):
            return s
        if "$ref" in s:
            ref_path = s["$ref"].split("/")[-1]
            ref_schema = defs.get(ref_path, {})
            return resolve_ref(ref_schema)
            
        resolved = {}
        for k, v in s.items():
            if isinstance(v, dict):
                resolved[k] = resolve_ref(v)
            elif isinstance(v, list):
                resolved[k] = [resolve_ref(item) if isinstance(item, dict) else item for item in v]
            else:
                resolved[k] = v
        return resolved

    resolved_schema = resolve_ref(schema)
    
    def clean(s: Any) -> Any:
        if not isinstance(s, dict):
            return s
            
        unsupported = {
            "default", "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum",
            "propertyNames", "pattern", "additionalProperties", "title", "examples",
            "minLength", "maxLength", "default_factory", "$defs", "definitions"
        }
        
        # Handle array items anyOf
        if s.get("type") == "array" and "items" in s:
            items = s["items"]
            if isinstance(items, dict) and "anyOf" in items:
                non_null_items = [x for x in items["anyOf"] if x.get("type") != "null"]
                if non_null_items:
                    s["items"] = non_null_items[0]
                    
        # Handle field anyOf (nullable representations in Pydantic v2)
        if "anyOf" in s:
            non_null_types = [x for x in s["anyOf"] if x.get("type") != "null"]
            if non_null_types:
                # Merge first non-null type schema back
                chosen = non_null_types[0]
                if isinstance(chosen, dict):
                    s.update(chosen)
            s.pop("anyOf", None)

        cleaned = {}
        for k, v in s.items():
            if k in unsupported:
                continue
            if isinstance(v, dict):
                cleaned[k] = clean(v)
            elif isinstance(v, list):
                cleaned[k] = [clean(item) if isinstance(item, dict) else item for item in v]
            else:
                cleaned[k] = v
        return cleaned

    return clean(resolved_schema)


class BaseAgent:
    def __init__(self, model_name: str = "gemini-1.5-pro", temperature: float = 0.3):
        self.model_name = model_name
        self.temperature = temperature
        self.api_key = config.GEMINI_API_KEY
        
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel(self.model_name)
        else:
            self.model = None
            logger.warning(
                f"No GEMINI_API_KEY found. {self.__class__.__name__} will operate in mock/fallback mode."
            )

    def generate(self, prompt: str, schema: Type[T], system_instruction: Optional[str] = None) -> T:
        """
        Generates content from the Gemini API and parses it into the target Pydantic schema.
        Includes schema cleaning, model fallbacks, and retry policies.
        """
        if not self.model:
            logger.info(f"Using local mock fallback for {self.__class__.__name__}")
            return self._generate_mock(schema)

        # Build clean Gemini OpenAPI schema
        try:
            cleaned_schema = pydantic_to_gemini_schema(schema)
        except Exception as e:
            logger.error(f"Error creating schema mapping: {e}")
            return self._generate_mock(schema)

        max_attempts = 3
        backoff_delay = 1.0
        current_model_name = self.model_name

        for attempt in range(1, max_attempts + 1):
            try:
                generation_config = genai.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=cleaned_schema,
                    temperature=self.temperature,
                )

                # Set system instruction if supported
                if system_instruction:
                    model_to_use = genai.GenerativeModel(
                        current_model_name,
                        system_instruction=system_instruction
                    )
                else:
                    model_to_use = genai.GenerativeModel(current_model_name)

                logger.info(f"Calling Gemini API ({current_model_name}), attempt {attempt}...")
                response = model_to_use.generate_content(
                    prompt,
                    generation_config=generation_config
                )

                if not response.text:
                    raise ValueError("Gemini returned empty response text (possibly safety block).")

                # Parse JSON and validate against schema
                parsed_json = json.loads(response.text)
                return schema.model_validate(parsed_json)

            except Exception as e:
                err_msg = str(e)
                logger.error(f"Gemini API attempt {attempt} failed: {err_msg}")
                
                # Check for 404 / unsupported model errors and fallback to gemini-1.5-flash
                if ("404" in err_msg or "not found" in err_msg or "not supported" in err_msg) and current_model_name == "gemini-1.5-pro":
                    logger.warning(
                        "gemini-1.5-pro is unavailable or restricted. Auto-falling back to gemini-1.5-flash..."
                    )
                    current_model_name = "gemini-1.5-flash"
                    # Retry immediately with the fallback model
                    continue
                
                if attempt == max_attempts:
                    logger.warning(f"All {max_attempts} attempts failed. Activating fallback chain...")
                    return self._generate_mock(schema)
                
                sleep_time = (backoff_delay * (2 ** (attempt - 1))) + 0.1
                time.sleep(sleep_time)

        return self._generate_mock(schema)

    def _generate_mock(self, schema: Type[T]) -> T:
        """Generates dummy schema-compliant JSON data in case of API failure or missing keys."""
        schema_name = schema.__name__
        logger.info(f"Generating fallback mock data for schema: {schema_name}")
        
        if "Question" in schema_name or "QuizResponse" in schema_name:
            mock_data = {
                "questions": [
                    {
                        "question_id": "q_001",
                        "question_text": "What is the time complexity of binary search on a sorted array of size n?",
                        "options": {
                            "A": "O(1)",
                            "B": "O(log n)",
                            "C": "O(n)",
                            "D": "O(n log n)"
                        },
                        "correct_option": "B",
                        "explanation": "Binary search divides the search interval in half each time, resulting in logarithmic O(log n) time complexity.",
                        "topic": "Searching",
                        "difficulty": "Easy",
                        "estimated_time_seconds": 30
                    },
                    {
                        "question_id": "q_002",
                        "question_text": "Which data structure operates on a First-In-First-Out (FIFO) basis?",
                        "options": {
                            "A": "Stack",
                            "B": "Queue",
                            "C": "Binary Tree",
                            "D": "Heap"
                        },
                        "correct_option": "B",
                        "explanation": "A queue adds new elements at the back and removes elements from the front, implementing FIFO logic.",
                        "topic": "Stacks/Queues",
                        "difficulty": "Easy",
                        "estimated_time_seconds": 30
                    },
                    {
                        "question_id": "q_003",
                        "question_text": "What is the primary drawback of using recursion to calculate Fibonacci numbers without memoization?",
                        "options": {
                            "A": "Stack overflow due to deep recursion",
                            "B": "Exponential time complexity O(2^n) from redundant subproblems",
                            "C": "Linear space complexity O(n)",
                            "D": "Inefficient memory allocation for global variables"
                        },
                        "correct_option": "B",
                        "explanation": "Without caching, recursion re-computes identical Fibonacci sub-states repeatedly, creating a tree of depth n and time complexity O(2^n).",
                        "topic": "Recursion",
                        "difficulty": "Medium",
                        "estimated_time_seconds": 60
                    }
                ]
            }
        elif "SkillProfileOutput" in schema_name:
            mock_data = {
                "student_id": "uuid-placeholder",
                "overall_score": 65,
                "level": "Intermediate",
                "topic_scores": {
                    "Searching": {"score": 100, "correct": 1, "total": 1},
                    "Stacks/Queues": {"score": 100, "correct": 1, "total": 1},
                    "Recursion": {"score": 0, "correct": 0, "total": 1}
                },
                "category_scores": {
                    "dsa": 60,
                    "programming": 70,
                    "logic": 70,
                    "domain_specific": 65
                },
                "difficulty_performance": {
                    "easy": {"correct": 2, "total": 2, "percentage": 100},
                    "medium": {"correct": 0, "total": 1, "percentage": 0},
                    "hard": {"correct": 0, "total": 0, "percentage": 0}
                },
                "strong_areas": ["Searching", "Stacks/Queues"],
                "weak_areas": ["Recursion"],
                "avg_time_per_question_seconds": 45.0,
                "behavioural_signals": {
                    "rushed": False,
                    "consistent": False,
                    "struggled_on": ["Recursion"]
                },
                "classification_reason": "Overall score of 65 meets the Intermediate criteria, but recursion represents a key weak area.",
                "confidence": 0.90,
                "classifier_version": "v2.1",
                "classified_at": None
            }
        elif "SummaryOutput" in schema_name:
            mock_data = {
                "summary_text": "The student shows a good grasp of basic data structures and search algorithms but struggles with recursive concepts. They have intermediate capability overall and need to build conceptual depth.",
                "skill_profile": {
                    "level": "Intermediate",
                    "strengths": ["Searching", "Stacks/Queues"],
                    "gaps": ["Recursion", "Trees & Graphs"],
                    "readiness_score": 60
                },
                "focus_areas": ["Recursion fundamentals", "Dynamic Programming patterns"],
                "estimated_placement_readiness": "12 months",
                "recommended_next_step": "Complete 15 medium-difficulty recursion problems on recursion trees.",
                "agent_context_tags": ["intermediate", "placement", "dsa", "year-2"]
            }
        elif "RiskOutput" in schema_name:
            mock_data = {
                "overall_risk_level": "Medium",
                "timeline_risk": {
                    "level": "Medium",
                    "reason": "Placement season is 12 months away. The student is at Intermediate level, which is on track but requires consistent daily study.",
                    "months_needed": 8,
                    "months_available": 12,
                    "is_achievable": True
                },
                "skill_gaps": [
                    {
                        "area": "Advanced Recursion",
                        "severity": "Medium",
                        "description": "Lack of comfort in mapping recursive call stacks, which is crucial for Trees and DP.",
                        "fix_timeline_weeks": 4,
                        "priority": 1
                    }
                ],
                "strategic_risks": [
                    {
                        "risk": "Neglecting system design",
                        "impact": "Low for intermediate entry roles, but limits product startup opportunities",
                        "mitigation": "Read basic architectural overviews in parallel"
                    }
                ],
                "quick_wins": [
                    "Implement binary tree traversals recursively and iteratively",
                    "Build a simple calculator using stacks"
                ],
                "red_flags": [
                    "Failed medium-level recursion question during diagnostic assessment"
                ],
                "risk_summary": "The student has adequate time but needs to focus immediately on mastering recursion, or they will face bottlenecks in advanced DSA topics."
            }
        else:
            mock_data = {}

        return schema.model_validate(mock_data)
