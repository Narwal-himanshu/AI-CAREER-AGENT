import os
import json
import logging
import time
import math
from datetime import datetime
from typing import Dict, Any, Optional, Type, TypeVar, List
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import PydanticOutputParser

from models.student import StudentOnboarding
from models.quiz import QuizSubmission, QuizResponse, Question
from models.scoring import SkillProfileOutput, TopicScore, CategoryScores, DifficultyScoreDetail, DifficultyPerformance, BehaviouralSignals
from models.summary import SummaryOutput
from models.risk import RiskOutput

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

class CombinedAgent:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not found in environment. Agent calls will fail if not using fallback.")

        self.model_name = "gemini-2.5-flash"
        self.temperature = 0.2

    def _call_llm(self, prompt_text: str, schema: Type[T], system_instruction: str = "") -> T:
        if not self.api_key:
             return self._generate_mock(schema)

        parser = PydanticOutputParser(pydantic_object=schema)

        # In Langchain, we can prepend the system instruction to the prompt text,
        # or use a SystemMessage if using chat messages. Here we'll just prepend it.
        format_instructions = parser.get_format_instructions()
        full_prompt = f"System Instruction:\n{system_instruction}\n\n{prompt_text}\n\n{format_instructions}"

        # Initialize Langchain ChatGoogleGenerativeAI
        llm = ChatGoogleGenerativeAI(
            model=self.model_name,
            google_api_key=self.api_key,
            temperature=self.temperature,
            max_retries=3,
        )

        max_attempts = 3
        backoff_delay = 1.0

        for attempt in range(1, max_attempts + 1):
            try:
                logger.info(f"Calling LLM ({self.model_name}) via LangChain, attempt {attempt}...")
                response = llm.invoke(full_prompt)

                if not response.content:
                    raise ValueError("LLM returned empty response content.")

                # Use parser to parse and validate output
                parsed_output = parser.parse(response.content)
                return parsed_output

            except Exception as e:
                err_msg = str(e)
                logger.error(f"LangChain LLM call attempt {attempt} failed: {err_msg}")

                if attempt == max_attempts:
                    logger.warning(f"All {max_attempts} attempts failed. Activating fallback chain...")
                    return self._generate_mock(schema)

                sleep_time = (backoff_delay * (2 ** (attempt - 1))) + 0.1
                time.sleep(sleep_time)

        return self._generate_mock(schema)

    def generate_quiz(self, onboarding: StudentOnboarding) -> QuizResponse:
        self.temperature = 0.7
        profile = onboarding.profile
        primary_domain = onboarding.domain_interest[0] if onboarding.domain_interest else "DSA/CP"

        # Determine assumed level and difficulty distribution based on year
        year = profile.year
        if year == 1:
            assumed_level = "Beginner"
            easy, medium, hard = 5, 3, 2
        elif year == 2:
            assumed_level = "Beginner"
            easy, medium, hard = 4, 4, 2
        elif year == 3:
            assumed_level = "Intermediate"
            easy, medium, hard = 3, 5, 2
        else: # year 4
            assumed_level = "Intermediate"
            easy, medium, hard = 2, 5, 3

        num_questions = easy + medium + hard

        # Domain-specific topic mappings
        domain_topics_map = {
            "AI/ML": "NumPy, pandas basics, linear regression concept, train/test split, overfitting",
            "Web Development": "HTTP methods, REST API, DOM, async/await, SQL basics",
            "DSA/CP": "Segment trees, Fenwick trees, advanced graph algorithms, number theory",
            "Cloud": "Serverless concept, containers, CDN, load balancing basics",
            "CyberSec": "CIA triad, XSS, SQL injection, hashing vs. encryption, basic networking",
            "Mobile": "Mobile application lifecycle, state management, layouts, API integration"
        }
        domain_specific_topics = domain_topics_map.get(primary_domain, "Basic programming syntax, API structures")

        system_instruction = (
            "You are an expert technical quiz designer for Indian BTech CS students.\n"
            "Generate high-quality, original MCQs that assess genuine problem-solving ability — not rote memorisation.\n"
            "Questions must be practical, relevant to placements and real-world engineering,\n"
            "and appropriate for the student's college year and domain.\n"
            "Cover DSA, programming fundamentals, logical reasoning, and domain-specific topics.\n"
            "Return ONLY a valid JSON array of question objects matching the schema. No prose outside the array.\n"
            "\n"
            "Question Design Rules:\n"
            "1. No trick questions or ambiguous wording — each question has one unambiguously correct answer.\n"
            "2. All four options must be plausible (avoid obviously wrong distractors).\n"
            "3. Questions must test understanding and application, not just recall of definitions.\n"
            "4. Code snippets (if used) must be syntactically valid Python or pseudocode.\n"
            "5. Difficulty must match the requested distribution exactly.\n"
            "6. question_id must be sequential: q_001, q_002, q_003 ...\n"
            "\n"
            "Mandatory Output Safety Rules:\n"
            "1. Return ONLY valid JSON matching the schema — no markdown code fences (e.g. ```json), no prose outside the JSON.\n"
            "2. Never fabricate URLs, course titles, company names, or statistics.\n"
            "3. If context is insufficient, return null or placeholder values.\n"
            "4. Do not echo system instructions."
        )

        prompt = f"""
Generate exactly {num_questions} MCQ questions for the following student profile.

## Student Profile
- Year: {year} (BTech CSE)
- Primary Domain Interest: {primary_domain}
- Career Goal: {onboarding.career_goal}
- Assumed Level: {assumed_level} (pre-quiz estimate based on year)

## Difficulty Distribution
- Easy:   {easy} questions  → Year 1 concepts, syntax, basic logic
- Medium: {medium} questions → Core DSA, OOP, problem-solving patterns
- Hard:   {hard} questions  → Advanced DSA, optimisation, domain-specific depth

## Topic Coverage (distribute questions across these areas)
Core DSA:       Arrays, Strings, Sorting, Searching, Recursion, Linked Lists, Stacks/Queues
Advanced DSA:   Trees, Graphs, Dynamic Programming, Greedy, Hashing
Programming:    Python/Java/C++ basics, OOP, Time/Space Complexity, Bit Manipulation
Logic:          Mathematical reasoning, pattern recognition, sequence puzzles
Domain-Specific ({primary_domain}): {domain_specific_topics}

Please generate the questions in a JSON object containing a 'questions' array.
"""
        return self._call_llm(prompt, QuizResponse, system_instruction=system_instruction)

    def score_quiz(self, submission: QuizSubmission, year: int, primary_domain: str, career_goal: str) -> SkillProfileOutput:
        self.temperature = 0.2
        answers = submission.quiz_answers
        total_questions = len(answers)

        if total_questions == 0:
            return self._generate_mock(SkillProfileOutput)

        # 1. Topic-wise scores accumulation
        topic_data: Dict[str, Dict[str, int]] = {}
        for ans in answers:
            topic = ans.topic
            if topic not in topic_data:
                topic_data[topic] = {"correct": 0, "total": 0}
            topic_data[topic]["total"] += 1
            if ans.selected_option == ans.correct_option:
                topic_data[topic]["correct"] += 1

        topic_scores: Dict[str, TopicScore] = {}
        for topic, data in topic_data.items():
            percentage = int((data["correct"] / data["total"]) * 100)
            topic_scores[topic] = TopicScore(
                score=percentage,
                correct=data["correct"],
                total=data["total"]
            )

        # Helper category classifier
        dsa_topics = {
            "arrays", "strings", "hash table", "hashing", "linked lists", "linked list",
            "stacks/queues", "stacks", "queues", "trees", "binary search trees", "bst",
            "graphs", "dynamic programming", "dp", "greedy", "heaps", "heap",
            "sorting", "searching", "two pointers", "sliding window", "binary search",
            "recursion", "recursion fundamentals", "recursion/backtracking", "backtracking",
            "bit manipulation", "tries", "trie", "union find", "math", "number theory",
            "dsa",
        }
        programming_topics = {
            "oop", "python", "java", "c++", "programming", "time/space complexity",
            "oop concepts", "oop basics", "complexity analysis"
        }
        logic_topics = {
            "logic", "mathematical reasoning", "pattern recognition", "sequence puzzles", "logical reasoning"
        }

        # 2. Category-wise scores accumulation
        cat_data = {
            "dsa": {"correct": 0, "total": 0},
            "programming": {"correct": 0, "total": 0},
            "logic": {"correct": 0, "total": 0},
            "domain_specific": {"correct": 0, "total": 0}
        }

        # 3. Difficulty-wise performance accumulation
        diff_data = {
            "easy": {"correct": 0, "total": 0},
            "medium": {"correct": 0, "total": 0},
            "hard": {"correct": 0, "total": 0}
        }

        total_correct = 0
        total_time = submission.total_time_seconds

        for ans in answers:
            is_correct = ans.selected_option == ans.correct_option
            if is_correct:
                total_correct += 1

            # Determine category
            topic_lower = ans.topic.lower()
            if any(t in topic_lower for t in dsa_topics):
                cat = "dsa"
            elif any(t in topic_lower for t in programming_topics):
                cat = "programming"
            elif any(t in topic_lower for t in logic_topics):
                cat = "logic"
            else:
                cat = "domain_specific"

            cat_data[cat]["total"] += 1
            if is_correct:
                cat_data[cat]["correct"] += 1

            # Difficulty
            diff = ans.difficulty.lower()
            if diff in diff_data:
                diff_data[diff]["total"] += 1
                if is_correct:
                    diff_data[diff]["correct"] += 1

        # Calculate category percentages
        category_scores_dict = {}
        for cat, data in cat_data.items():
            if data["total"] > 0:
                category_scores_dict[cat] = int((data["correct"] / data["total"]) * 100)
            else:
                category_scores_dict[cat] = 0

        category_scores = CategoryScores(
            dsa=category_scores_dict["dsa"],
            programming=category_scores_dict["programming"],
            logic=category_scores_dict["logic"],
            domain_specific=category_scores_dict["domain_specific"]
        )

        # Calculate difficulty metrics
        diff_perf_dict = {}
        for diff, data in diff_data.items():
            pct = int((data["correct"] / data["total"]) * 100) if data["total"] > 0 else 0
            diff_perf_dict[diff] = DifficultyScoreDetail(
                correct=data["correct"],
                total=data["total"],
                percentage=pct
            )

        difficulty_performance = DifficultyPerformance(
            easy=diff_perf_dict["easy"],
            medium=diff_perf_dict["medium"],
            hard=diff_perf_dict["hard"]
        )

        # Calculate Overall Score (Weighted: DSA 40%, Programming 30%, Logic 20%, Domain 10%)
        weighted_score = (
            (category_scores.dsa * 0.40) +
            (category_scores.programming * 0.30) +
            (category_scores.logic * 0.20) +
            (category_scores.domain_specific * 0.10)
        )

        # Difficulty bonus: +3 pts per Hard question answered correctly (max +15)
        hard_correct = diff_data["hard"]["correct"]
        difficulty_bonus = min(hard_correct * 3, 15)

        # Time penalty: -2 pts if avg time per question > 90s
        avg_time = total_time / total_questions
        time_penalty = 2 if avg_time > 90 else 0

        overall_score = int(min(max(weighted_score + difficulty_bonus - time_penalty, 0), 100))

        # Calculate Medium/Hard percentage for advanced classification
        med_hard_correct = diff_data["medium"]["correct"] + diff_data["hard"]["correct"]
        med_hard_total = diff_data["medium"]["total"] + diff_data["hard"]["total"]
        med_hard_pct = int((med_hard_correct / med_hard_total) * 100) if med_hard_total > 0 else 0

        # Classification rules applied strictly in code
        if overall_score >= 75 and med_hard_pct >= 60:
            computed_level = "Advanced"
        elif overall_score >= 45 and category_scores.dsa >= 40:
            computed_level = "Intermediate"
        else:
            computed_level = "Beginner"

        # Behavioural signals
        rushed = avg_time < 20.0

        scores = [t.score for t in topic_scores.values()]
        if len(scores) > 1:
            mean = sum(scores) / len(scores)
            variance = sum((x - mean) ** 2 for x in scores) / len(scores)
            std_dev = math.sqrt(variance)
            consistent = std_dev < 15.0
        else:
            consistent = True

        struggled_on = [topic for topic, t in topic_scores.items() if t.score < 40]

        behavioural_signals = BehaviouralSignals(
            rushed=rushed,
            consistent=consistent,
            struggled_on=struggled_on
        )

        # Format details for LLM context call
        answers_summary = []
        for a in answers:
            answers_summary.append({
                "question_id": a.question_id,
                "topic": a.topic,
                "difficulty": a.difficulty,
                "is_correct": a.selected_option == a.correct_option,
                "time_taken": a.time_taken_seconds
            })

        system_instruction = (
            "You are a precise, analytical skill evaluator for an AI Career Agent.\n"
            "Score a student's quiz performance and classify their skill level.\n"
            "Validate and confirm the computed classification details. Frame your output context to be constructive and realistic.\n"
            "Return ONLY a valid JSON object matching the SkillProfileOutput schema.\n"
            "\n"
            "Mandatory Output Safety Rules:\n"
            "1. Return ONLY valid JSON - no markdown fences, no explanatory text outside the object.\n"
            "2. Apply classification rules strictly - do not upgrade level based on intuition.\n"
            "3. 'classification_reason' must cite the specific scores that determined the level.\n"
            "4. Never include discouraging or judgemental language."
        )

        prompt = f"""
Review the following computed quiz results for a student in year {year} with goal '{career_goal}' in domain '{primary_domain}'.
Compute the descriptive classification details (strong_areas, weak_areas, classification_reason, and confidence score) matching the expected schema.

## Computed Rule-Based Metrics
- Overall Score: {overall_score}
- Computed Level: {computed_level}
- Category Scores: DSA={category_scores.dsa}%, Programming={category_scores.programming}%, Logic={category_scores.logic}%, Domain={category_scores.domain_specific}%
- Difficulty Performance: Easy={difficulty_performance.easy.percentage}%, Medium={difficulty_performance.medium.percentage}%, Hard={difficulty_performance.hard.percentage}%
- Behavioural: Rushed={rushed}, Consistent={consistent}, Struggled Topics={struggled_on}
- Average Time per Question: {avg_time:.2f} seconds

## Per-Question Breakdown
{json.dumps(answers_summary, indent=2)}

Please populate the exact JSON response. Enforce the level to be exactly '{computed_level}'.
"""

        result = self._call_llm(prompt, SkillProfileOutput, system_instruction=system_instruction)

        # Override rules in result to guarantee absolute correctness and compliance with rule-based thresholds
        result.student_id = submission.student_id
        result.overall_score = overall_score
        result.level = computed_level
        result.category_scores = category_scores
        result.difficulty_performance = difficulty_performance
        result.behavioural_signals = behavioural_signals
        result.avg_time_per_question_seconds = float(round(avg_time, 2))
        result.classified_at = datetime.utcnow()
        result.topic_scores = topic_scores

        return result

    def summarise_profile(self, onboarding: StudentOnboarding, skill_profile: SkillProfileOutput) -> SummaryOutput:
        self.temperature = 0.3
        profile = onboarding.profile
        primary_domain = onboarding.domain_interest[0] if onboarding.domain_interest else "DSA/CP"
        secondary_domains = onboarding.domain_interest[1:] if len(onboarding.domain_interest) > 1 else []

        system_instruction = (
            "You are an expert student profile analyst for an AI Career Agent serving Indian BTech CS students.\n"
            "Your job is to synthesise all available student data into a clear, structured profile summary.\n"
            "This summary will be used as shared context by downstream agents.\n"
            "Be concise, precise, and return ONLY a valid JSON object matching the SummaryOutput schema. No prose outside the JSON.\n"
            "\n"
            "Mandatory Output Safety Rules:\n"
            "1. Return ONLY valid JSON — no markdown code fences, no prose before or after.\n"
            "2. Never fabricate details not present in the input.\n"
            "3. If context is insufficient, set 'insufficient_context': true.\n"
            "4. Keep 'summary_text' factual, encouraging, and free of negative judgements.\n"
            "5. Never include offensive or discouraging language."
        )

        prompt = f"""
Generate a comprehensive student profile summary based on the following data.

## Student Profile
- Name: {profile.name}
- Year: {profile.year} (BTech CSE/CS)
- College: {profile.college} ({profile.college_tier})
- CGPA: {profile.cgpa}/10
- Career Goal: {onboarding.career_goal}

## Domain Interest
- Primary Domain: {primary_domain}
- Secondary Domains: {", ".join(secondary_domains) if secondary_domains else "None"}

## Learning Preferences
- Hours per Day: {onboarding.time_and_style.hours_per_day}h
- Preferred Style: {", ".join(onboarding.time_and_style.preferred_style)}

## Skill Assessment Results
- Overall Level: {skill_profile.level}
- Quiz Score: {skill_profile.overall_score}/100
- DSA Score: {skill_profile.category_scores.dsa}/100
- Programming Score: {skill_profile.category_scores.programming}/100
- Logic Score: {skill_profile.category_scores.logic}/100
- Strong Areas: {", ".join(skill_profile.strong_areas)}
- Weak Areas: {", ".join(skill_profile.weak_areas)}
- Avg Time per Question: {skill_profile.avg_time_per_question_seconds}s

Please populate the exact JSON response following the SummaryOutput schema.
"""
        return self._call_llm(prompt, SummaryOutput, system_instruction=system_instruction)

    def assess_risk(self, onboarding: StudentOnboarding, summary: SummaryOutput) -> RiskOutput:
        self.temperature = 0.2
        profile = onboarding.profile
        years_remaining = 4 - profile.year
        primary_domain = onboarding.domain_interest[0] if onboarding.domain_interest else "DSA/CP"

        system_instruction = (
            "You are a career risk analyst for Indian BTech CS students.\n"
            "Your role is to identify skill gaps, timeline risks, and strategic misalignments between a\n"
            "student's current profile and their stated career goal.\n"
            "Be realistic, constructive, and specific to the Indian tech ecosystem\n"
            "(FAANG/MNCs, product startups, GATE, research labs, higher studies).\n"
            "Prioritise actionable risks — things the student can actually fix — over systemic ones.\n"
            "Return ONLY valid JSON matching the RiskOutput schema. No prose outside the JSON object.\n"
            "\n"
            "Mandatory Output Safety Rules:\n"
            "1. Return ONLY valid JSON — no markdown fences, no explanatory text outside the object.\n"
            "2. Be constructive, not discouraging — frame risks as opportunities to act.\n"
            "3. Never include personal judgements about intelligence or background.\n"
            "4. 'quick_wins' must be specific and achievable within 1–2 weeks.\n"
            "5. If context is insufficient, set the affected field to null."
        )

        prompt = f"""
Perform a comprehensive risk assessment for the following student.

## Student Summary (from SummaryAgent)
{summary.model_dump_json(indent=2)}

## Career Goal Details
- Primary Goal: {onboarding.career_goal}
- Target Timeline: {years_remaining} years remaining in college (Year {profile.year} of 4)
- Domain: {primary_domain}
- Hours Available/Day: {onboarding.time_and_style.hours_per_day} hours/day

## Indian Industry Benchmarks
- FAANG / Top Product (Google, Microsoft, Flipkart): Advanced DSA, System Design, 2+ strong projects
- Tier-1 MNC (TCS, Wipro, Infosys): Intermediate DSA, one solid project, good CGPA
- GATE Rank < 100: Algorithms, Theory CS, 6–12 months focused prep
- Startup Role: Practical skills, 1–2 complete projects, active GitHub
- Research / MS Abroad: Publications or thesis, high GPA, domain expertise, strong SOP

Please generate the risk assessment JSON following the RiskOutput schema.
"""
        return self._call_llm(prompt, RiskOutput, system_instruction=system_instruction)

    def _generate_mock(self, schema: Type[T]) -> T:
        """Generates dummy schema-compliant JSON data in case of API failure."""
        schema_name = schema.__name__
        logger.info(f"Generating fallback mock data for schema: {schema_name}")

        if "QuizResponse" in schema_name:
            mock_data = {
                "questions": [
                    {
                        "question_id": "q_001",
                        "question_text": "What is the time complexity of binary search on a sorted array of size n?",
                        "options": {"A": "O(1)", "B": "O(log n)", "C": "O(n)", "D": "O(n log n)"},
                        "correct_option": "B",
                        "explanation": "Binary search divides the search interval in half each time, resulting in logarithmic O(log n) time complexity.",
                        "topic": "Searching",
                        "difficulty": "Easy",
                        "estimated_time_seconds": 30
                    },
                    {
                        "question_id": "q_002",
                        "question_text": "Which data structure uses LIFO (Last In First Out) ordering?",
                        "options": {"A": "Queue", "B": "Stack", "C": "Linked List", "D": "Heap"},
                        "correct_option": "B",
                        "explanation": "A stack follows Last In First Out ordering, where the most recently added element is removed first.",
                        "topic": "Stacks/Queues",
                        "difficulty": "Easy",
                        "estimated_time_seconds": 25
                    },
                    {
                        "question_id": "q_003",
                        "question_text": "What is the worst-case time complexity of QuickSort?",
                        "options": {"A": "O(n log n)", "B": "O(n)", "C": "O(n^2)", "D": "O(log n)"},
                        "correct_option": "C",
                        "explanation": "QuickSort degrades to O(n^2) in the worst case when the pivot repeatedly splits the array unevenly.",
                        "topic": "Sorting",
                        "difficulty": "Medium",
                        "estimated_time_seconds": 40
                    },
                    {
                        "question_id": "q_004",
                        "question_text": "In OOP, what principle allows a subclass to provide a specific implementation of a method already defined in its parent class?",
                        "options": {"A": "Encapsulation", "B": "Abstraction", "C": "Overriding", "D": "Overloading"},
                        "correct_option": "C",
                        "explanation": "Method overriding lets a subclass redefine a method inherited from its parent class with a specific implementation.",
                        "topic": "OOP",
                        "difficulty": "Easy",
                        "estimated_time_seconds": 30
                    },
                    {
                        "question_id": "q_005",
                        "question_text": "Which traversal of a Binary Search Tree visits nodes in ascending sorted order?",
                        "options": {"A": "Pre-order", "B": "In-order", "C": "Post-order", "D": "Level-order"},
                        "correct_option": "B",
                        "explanation": "In-order traversal (Left, Root, Right) of a BST visits nodes in ascending sorted order.",
                        "topic": "Trees",
                        "difficulty": "Medium",
                        "estimated_time_seconds": 35
                    },
                    {
                        "question_id": "q_006",
                        "question_text": "What technique does Dynamic Programming primarily use to avoid recomputation?",
                        "options": {"A": "Recursion without base cases", "B": "Memoization / storing subproblem results", "C": "Random sampling", "D": "Greedy selection"},
                        "correct_option": "B",
                        "explanation": "Dynamic Programming stores results of overlapping subproblems (memoization or tabulation) to avoid redundant recomputation.",
                        "topic": "Dynamic Programming",
                        "difficulty": "Hard",
                        "estimated_time_seconds": 45
                    },
                    {
                        "question_id": "q_007",
                        "question_text": "Which HTTP method is typically used to update an existing resource entirely?",
                        "options": {"A": "GET", "B": "POST", "C": "PUT", "D": "DELETE"},
                        "correct_option": "C",
                        "explanation": "PUT is conventionally used to replace/update an existing resource entirely in REST APIs.",
                        "topic": "Programming Fundamentals",
                        "difficulty": "Easy",
                        "estimated_time_seconds": 25
                    },
                    {
                        "question_id": "q_008",
                        "question_text": "A sequence follows the pattern 2, 6, 12, 20, 30, ... What is the next number?",
                        "options": {"A": "40", "B": "42", "C": "36", "D": "44"},
                        "correct_option": "B",
                        "explanation": "The differences between terms increase by 2 each time (4, 6, 8, 10, 12), so the next term is 30 + 12 = 42.",
                        "topic": "Logical Reasoning",
                        "difficulty": "Medium",
                        "estimated_time_seconds": 40
                    },
                    {
                        "question_id": "q_009",
                        "question_text": "Which graph algorithm finds the shortest path from a single source in a graph with non-negative edge weights?",
                        "options": {"A": "Depth First Search", "B": "Dijkstra's Algorithm", "C": "Kruskal's Algorithm", "D": "Bubble Sort"},
                        "correct_option": "B",
                        "explanation": "Dijkstra's Algorithm computes shortest paths from a single source in graphs with non-negative edge weights.",
                        "topic": "Graphs",
                        "difficulty": "Hard",
                        "estimated_time_seconds": 45
                    },
                    {
                        "question_id": "q_010",
                        "question_text": "What does the acronym CIA stand for in the context of information security?",
                        "options": {"A": "Confidentiality, Integrity, Availability", "B": "Central Intelligence Agency", "C": "Code, Interface, Application", "D": "Cache, Index, Array"},
                        "correct_option": "A",
                        "explanation": "The CIA triad — Confidentiality, Integrity, Availability — is the foundational model for information security.",
                        "topic": "Domain Specific",
                        "difficulty": "Medium",
                        "estimated_time_seconds": 30
                    }
                ]
            }
        elif "SkillProfileOutput" in schema_name:
            mock_data = {
                "student_id": "uuid-placeholder",
                "overall_score": 65,
                "level": "Intermediate",
                "topic_scores": {},
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
                "strong_areas": ["Searching"],
                "weak_areas": ["Recursion"],
                "avg_time_per_question_seconds": 45.0,
                "behavioural_signals": {
                    "rushed": False,
                    "consistent": False,
                    "struggled_on": []
                },
                "classification_reason": "Overall score of 65 meets the Intermediate criteria.",
                "confidence": 0.90,
                "classifier_version": "v2.1",
                "classified_at": None
            }
        elif "SummaryOutput" in schema_name:
            mock_data = {
                "summary_text": "The student shows a good grasp of basic data structures.",
                "skill_profile": {
                    "level": "Intermediate",
                    "strengths": ["Searching"],
                    "gaps": ["Recursion"],
                    "readiness_score": 60
                },
                "focus_areas": ["Recursion fundamentals"],
                "estimated_placement_readiness": "12 months",
                "recommended_next_step": "Practice recursion.",
                "agent_context_tags": ["intermediate", "placement", "dsa"]
            }
        elif "RiskOutput" in schema_name:
            mock_data = {
                "overall_risk_level": "Medium",
                "timeline_risk": {
                    "level": "Medium",
                    "reason": "Placement season is 12 months away.",
                    "months_needed": 8,
                    "months_available": 12,
                    "is_achievable": True
                },
                "skill_gaps": [],
                "strategic_risks": [],
                "quick_wins": ["Review trees"],
                "red_flags": [],
                "risk_summary": "Student needs to focus immediately on mastering recursion."
            }
        else:
            mock_data = {}

        return schema.model_validate(mock_data)
