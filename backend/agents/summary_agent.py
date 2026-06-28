from typing import List
from agents.base import BaseAgent
from models.student import StudentOnboarding
from models.scoring import SkillProfileOutput
from models.summary import SummaryOutput

class SummaryAgent(BaseAgent):
    def __init__(self):
        # Temp 0.3 as specified in prompt document
        super().__init__(model_name="gemini-1.5-pro", temperature=0.3)

    def summarise_profile(self, onboarding: StudentOnboarding, skill_profile: SkillProfileOutput) -> SummaryOutput:
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

        return self.generate(prompt=prompt, schema=SummaryOutput, system_instruction=system_instruction)
