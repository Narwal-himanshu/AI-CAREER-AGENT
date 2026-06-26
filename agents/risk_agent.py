import json
from agents.base import BaseAgent
from models.student import StudentOnboarding
from models.summary import SummaryOutput
from models.risk import RiskOutput

class RiskAgent(BaseAgent):
    def __init__(self):
        # Temp 0.2 as specified in prompt document
        super().__init__(model_name="gemini-1.5-pro", temperature=0.2)

    def assess_risk(self, onboarding: StudentOnboarding, summary: SummaryOutput) -> RiskOutput:
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

        return self.generate(prompt=prompt, schema=RiskOutput, system_instruction=system_instruction)
