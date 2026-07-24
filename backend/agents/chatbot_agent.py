import os
import logging
from typing import List, Optional, Dict, Any
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
from langchain_google_genai import ChatGoogleGenerativeAI

from models.schemas import ChatRequest, ChatResponse, ChatMessage

logger = logging.getLogger(__name__)


def get_llm():
    return ChatGoogleGenerativeAI(
        model="gemini-2.0-flash",
        temperature=0.5,
        api_key=os.getenv("GEMINI_API_KEY"),
        max_retries=0,
    )


class AgentProcessingError(Exception):
    pass


SYSTEM_PROMPT = """You are an expert AI career guidance assistant for Indian BTech CS students. You help students with:
- Career planning and roadmap guidance
- DSA (Data Structures & Algorithms) preparation tips
- Skill development recommendations
- Internship and placement advice
- Project ideas and GitHub portfolio tips
- GATE exam preparation guidance
- Startup ecosystem guidance
- Domain-specific learning paths (Web Dev, AI/ML, DSA/CP, Cloud, CyberSec, Mobile)

Guidelines:
- Be concise, helpful, and encouraging
- Give specific, actionable advice
- Reference the student's profile context when relevant
- Keep responses under 150 words unless detail is needed
- Use a friendly, supportive tone appropriate for college students
- If you don't know something specific, acknowledge it and suggest where to find the info
- Never make up URLs or resources - only mention well-known platforms (LeetCode, GFG, Coursera, etc.)
"""

CONTEXT_TEMPLATE = """Student Profile Context:
{context}

Conversation so far:
{history}

Current user message: {message}

Respond as the career guidance assistant. Be helpful, specific, and encouraging."""


def _build_conversation_history(history: List[ChatMessage]) -> str:
    if not history:
        return "(No prior messages)"
    lines = []
    for msg in history[-10:]:  # last 10 messages for context window
        role = "Student" if msg.role == "user" else "Assistant"
        lines.append(f"{role}: {msg.content}")
    return "\n".join(lines)


def _build_context(student_context: Optional[Dict[str, Any]]) -> str:
    if not student_context:
        return "No student profile available."

    parts = []
    if student_context.get("name"):
        parts.append(f"Name: {student_context['name']}")
    if student_context.get("year"):
        parts.append(f"Year: {student_context['year']}")
    if student_context.get("domain"):
        parts.append(f"Domain of Interest: {student_context['domain']}")
    if student_context.get("career_goal"):
        parts.append(f"Career Goal: {student_context['career_goal']}")
    if student_context.get("level"):
        parts.append(f"Skill Level: {student_context['level']}")
    if student_context.get("college_tier"):
        parts.append(f"College Tier: {student_context['college_tier']}")
    if student_context.get("hours_per_day"):
        parts.append(f"Study Hours/Day: {student_context['hours_per_day']}")
    if student_context.get("category_scores"):
        scores = student_context["category_scores"]
        parts.append(f"Category Scores: DSA={scores.get('dsa', 'N/A')}%, Programming={scores.get('programming', 'N/A')}%, Logic={scores.get('logic', 'N/A')}%, Domain={scores.get('domain', 'N/A')}%")
    if student_context.get("weak_areas"):
        parts.append(f"Weak Areas: {', '.join(student_context['weak_areas'])}")
    if student_context.get("recommended_next_step"):
        parts.append(f"Recommended Next Step: {student_context['recommended_next_step']}")

    return "\n".join(parts) if parts else "No student profile available."


@retry(
    wait=wait_exponential(multiplier=1, min=1, max=4),
    stop=stop_after_attempt(3),
    retry=retry_if_exception_type(AgentProcessingError),
    reraise=True
)
def _generate_reply(prompt: str) -> str:
    llm = get_llm()
    try:
        response = llm.invoke(prompt)
        return response.content.strip()
    except Exception as e:
        logger.error(f"Gemini chat error: {e}")
        raise AgentProcessingError(f"LLM call failed: {e}")


class ChatbotAgent:
    def chat(self, request: ChatRequest) -> ChatResponse:
        context_str = _build_context(request.student_context)
        history_str = _build_conversation_history(request.conversation_history)

        full_prompt = CONTEXT_TEMPLATE.format(
            context=context_str,
            history=history_str,
            message=request.message
        )

        system_and_prompt = f"{SYSTEM_PROMPT}\n\n{full_prompt}"

        try:
            reply = _generate_reply(system_and_prompt)
            return ChatResponse(reply=reply)
        except Exception as e:
            logger.warning(f"Chatbot LLM failed, using fallback: {e}")
            return self._fallback_reply(request)

    def _fallback_reply(self, request: ChatRequest) -> ChatResponse:
        lower_msg = request.message.lower()
        ctx = request.student_context or {}
        level = ctx.get("level", "Beginner")
        next_step = ctx.get("recommended_next_step", "Start with DSA fundamentals")
        weak = ctx.get("weak_areas", ["problem-solving"])[0] if ctx.get("weak_areas") else "problem-solving"

        if any(w in lower_msg for w in ["dsa", "algorithm", "data structure", "coding"]):
            reply = f"For DSA preparation at {level} level, I recommend solving 2-3 problems daily on LeetCode. Focus on your weak area: {weak}. Start with easy problems and gradually move to medium ones."
        elif any(w in lower_msg for w in ["project", "github", "portfolio"]):
            reply = "Build 2-3 solid projects that showcase your skills. Push them to GitHub with clean READMEs. Focus on full-stack projects that solve real problems — this stands out to recruiters."
        elif any(w in lower_msg for w in ["internship", "placement", "job", "hire"]):
            reply = f"At {level} level, start applying for internships on LinkedIn and Internshala. Your next step: {next_step}. Build a strong resume with projects and DSA problem count."
        elif any(w in lower_msg for w in ["gate", "exam", "study"]):
            reply = "For GATE preparation, focus on core CS subjects: OS, DBMS, CN, and Theory of Computation. Start with standard textbooks and solve previous year papers daily."
        else:
            reply = f"Based on your profile ({level} level), I suggest: {next_step}. Feel free to ask me about DSA, projects, internships, or any career-related topic!"

        return ChatResponse(reply=reply)


chatbot_agent = ChatbotAgent()
