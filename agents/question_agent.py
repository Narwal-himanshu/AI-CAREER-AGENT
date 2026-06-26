from typing import Dict, Any, List
from agents.base import BaseAgent
from models.quiz import QuizResponse, Question
from models.student import StudentOnboarding

class QuestionAgent(BaseAgent):
    def __init__(self):
        # Temp 0.7 as specified in prompt document
        super().__init__(model_name="gemini-1.5-pro", temperature=0.7)

    def generate_quiz(self, onboarding: StudentOnboarding) -> QuizResponse:
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

        # Domain-specific topic mappings from document
        domain_topics_map = {
            "AI/ML": "NumPy, pandas basics, linear regression concept, train/test split, overfitting",
            "Web Development": "HTTP methods, REST API, DOM, async/await, SQL basics",
            "DSA/CP": "Segment trees, Fenwick trees, advanced graph algorithms, number theory",
            "Cloud": "Serverless concept, containers, CDN, load balancing basics",
            "CyberSec": "CIA triad, XSS, SQL injection, hashing vs. encryption, basic networking",
            "Mobile": "Mobile application lifecycle, state management, layouts, API integration"
        }
        domain_specific_topics = domain_topics_map.get(primary_domain, "Basic programming syntax, API structures")

        # Create system instruction
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

        # Create user prompt
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

        # Call base agent generate method
        return self.generate(prompt=prompt, schema=QuizResponse, system_instruction=system_instruction)
