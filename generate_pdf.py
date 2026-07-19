#!/usr/bin/env python3
"""
AI Career Agent - Project Documentation PDF Generator
Generates a comprehensive PDF explaining the entire codebase.
"""

from fpdf import FPDF
import os
from datetime import datetime


class ProjectPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=20)

    def header(self):
        self.set_font('Helvetica', 'B', 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 6, 'AI Career Agent - Project Documentation', 0, 0, 'L')
        self.cell(0, 6, f'Page {self.page_no()}', 0, 1, 'R')
        self.set_draw_color(200, 200, 200)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(3)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 7)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f'Generated {datetime.now().strftime("%B %d, %Y")} | AI Career Agent v1.0', 0, 0, 'C')

    def chapter_title(self, title, level=1):
        if level == 1:
            self.set_font('Helvetica', 'B', 16)
            self.set_text_color(40, 40, 40)
            self.ln(6)
            self.cell(0, 10, title, 0, 1)
            self.set_draw_color(79, 70, 229)
            self.set_line_width(0.8)
            self.line(10, self.get_y(), 80, self.get_y())
            self.ln(4)
        elif level == 2:
            self.set_font('Helvetica', 'B', 13)
            self.set_text_color(60, 60, 60)
            self.ln(4)
            self.cell(0, 8, title, 0, 1)
            self.ln(2)
        elif level == 3:
            self.set_font('Helvetica', 'B', 11)
            self.set_text_color(80, 80, 80)
            self.ln(3)
            self.cell(0, 7, title, 0, 1)
            self.ln(1)

    def body_text(self, text):
        self.set_font('Helvetica', '', 9)
        self.set_text_color(50, 50, 50)
        self.multi_cell(0, 5, text)
        self.ln(1)

    def bullet_point(self, text, indent=10):
        self.set_font('Helvetica', '', 9)
        self.set_text_color(50, 50, 50)
        self.set_x(self.l_margin + indent)
        self.multi_cell(190 - indent, 5, '- ' + text)

    def code_block(self, text):
        self.set_font('Courier', '', 7.5)
        self.set_text_color(40, 40, 40)
        self.set_fill_color(245, 245, 245)
        self.set_draw_color(220, 220, 220)
        x = self.get_x()
        y = self.get_y()
        self.rect(x, y, 190, 5, 'DF')
        self.multi_cell(190, 4, text, 0, 'L')
        self.ln(2)

    def table_row(self, cells, widths, bold=False, fill=False):
        style = 'B' if bold else ''
        self.set_font('Helvetica', style, 8)
        if fill:
            self.set_fill_color(240, 240, 255)
        h = 6
        x_start = self.get_x()
        max_h = h
        for i, (cell, w) in enumerate(zip(cells, widths)):
            self.set_xy(x_start + sum(widths[:i]), self.get_y())
        self.set_text_color(40, 40, 40)
        for i, (cell, w) in enumerate(zip(cells, widths)):
            x = x_start + sum(widths[:i])
            self.set_xy(x, self.get_y())
            self.cell(w, h, str(cell)[:int(w/1.8)], 0 if not bold else 0, 0, 'L', fill)
        self.ln(h)
        if bold:
            self.set_draw_color(79, 70, 229)
            self.set_line_width(0.3)
            self.line(x_start, self.get_y(), x_start + sum(widths), self.get_y())


def generate_documentation_pdf():
    pdf = ProjectPDF()
    pdf.set_title("AI Career Agent - Project Documentation")
    pdf.set_author("Himanshu Narwal")

    # ========== COVER PAGE ==========
    pdf.add_page()
    pdf.ln(40)
    pdf.set_font('Helvetica', 'B', 32)
    pdf.set_text_color(40, 40, 40)
    pdf.cell(0, 15, 'AI Career Agent', 0, 1, 'C')
    pdf.set_font('Helvetica', '', 14)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 10, 'Comprehensive Project Documentation', 0, 1, 'C')
    pdf.ln(5)
    pdf.set_draw_color(79, 70, 229)
    pdf.set_line_width(1)
    pdf.line(70, pdf.get_y(), 140, pdf.get_y())
    pdf.ln(10)
    pdf.set_font('Helvetica', '', 11)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(0, 8, 'Personalised Career Guidance for BTech CS Students', 0, 1, 'C')
    pdf.cell(0, 8, 'Stack: FastAPI + React + LangChain + Gemini AI + Firebase', 0, 1, 'C')
    pdf.ln(15)
    pdf.set_font('Helvetica', '', 10)
    pdf.cell(0, 7, f'Version 1.0 | {datetime.now().strftime("%B %Y")}', 0, 1, 'C')
    pdf.cell(0, 7, 'GitHub: github.com/Narwal-himanshu/AI-CAREER-AGENT', 0, 1, 'C')

    # ========== TABLE OF CONTENTS ==========
    pdf.add_page()
    pdf.chapter_title("Table of Contents")
    toc_items = [
        "1. Project Overview",
        "2. Tech Stack & Architecture",
        "3. Project Structure",
        "4. Backend (FastAPI + Python)",
        "   4.1 API Endpoints",
        "   4.2 Database Schema (SQLite)",
        "   4.3 AI Agents",
        "   4.4 Authentication Flow",
        "5. Frontend (React + Vite + Tailwind)",
        "   5.1 Pages & Routes",
        "   5.2 Components",
        "   5.3 State Management",
        "6. AI Agent System - Detailed",
        "   6.1 QuestionAgent",
        "   6.2 ScoringAgent",
        "   6.3 SummaryAgent",
        "   6.4 RiskAgent",
        "   6.5 CareerRoadmapAgent",
        "   6.6 DSA Practice Agent",
        "   6.7 CourseRecommendationAgent",
        "   6.8 OpportunitiesAgent",
        "7. Data Flow & User Journey",
        "8. What Has Been Done (Implemented)",
        "9. What Can Be Done (Future Scope)",
        "10. Setup & Running Instructions",
    ]
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(50, 50, 50)
    for item in toc_items:
        if item.startswith("   "):
            pdf.set_x(25)
            pdf.set_font('Helvetica', '', 9)
        else:
            pdf.set_font('Helvetica', 'B', 10)
        pdf.cell(0, 6, item, 0, 1)

    # ========== 1. PROJECT OVERVIEW ==========
    pdf.add_page()
    pdf.chapter_title("1. Project Overview")
    pdf.body_text(
        "AI Career Agent is an AI-powered platform built for BTech Computer Science students across India. "
        "It delivers personalised, adaptive career guidance from 1st year through 4th year - covering skill "
        "assessment, course recommendations, DSA practice, live opportunities, resume generation, and an "
        "intelligent Q&A chatbot."
    )
    pdf.body_text(
        "The platform uses a multi-agent architecture powered by Google Gemini (via LangChain) to generate "
        "adaptive quizzes, classify skill levels, produce personalised career roadmaps, recommend courses, "
        "fetch live opportunities, and generate ATS-friendly resumes."
    )
    pdf.chapter_title("Core Features", 2)
    features = [
        "Skill Assessment Quiz - 5-question adaptive MCQ covering DSA, logic, and coding",
        "Skill Classification - Beginner / Intermediate / Advanced level determination",
        "Career Roadmap - Year-wise, domain-specific preparation timeline via LLM",
        "DSA Practice Sheet - 112 curated LeetCode problems across 16+ topics",
        "Course Recommendations - Curated courses from YouTube, Coursera, Udemy",
        "Live Opportunities - Hackathons, CTFs, contests from Devpost, Clist, Serper",
        "Resume Builder - ATS-optimised resume generation (backend ready)",
        "Dashboard - Personalised view with scoring breakdown, risk analysis, gaps",
        "Chatbot Widget - Context-aware Q&A for career guidance",
        "Profile Management - Firebase-backed user profiles with streak tracking",
    ]
    for f in features:
        pdf.bullet_point(f)

    # ========== 2. TECH STACK ==========
    pdf.add_page()
    pdf.chapter_title("2. Tech Stack & Architecture")
    pdf.chapter_title("Frontend", 2)
    tech_fe = [
        ("React 18", "UI framework with functional components and hooks"),
        ("Vite", "Build tool and dev server"),
        ("Tailwind CSS", "Utility-first CSS framework for styling"),
        ("React Router v6", "Client-side routing with nested routes"),
        ("Firebase Auth", "Google + Email/Password authentication"),
        ("Firestore", "NoSQL database for user profiles and quiz results"),
        ("Lucide React", "Icon library"),
    ]
    for name, desc in tech_fe:
        pdf.bullet_point(f"{name}: {desc}")

    pdf.chapter_title("Backend", 2)
    tech_be = [
        ("FastAPI", "Async Python web framework for REST API"),
        ("SQLite", "Lightweight database (career_agent.db)"),
        ("LangChain", "LLM orchestration framework"),
        ("Google Gemini API", "LLM provider (gemini-2.5-flash / 2.0-flash)"),
        ("Pydantic v2", "Data validation and schema enforcement"),
        ("Firebase Admin SDK", "Server-side token verification"),
        ("Tenacity", "Retry logic with exponential backoff"),
        ("Feedparser", "RSS feed parsing for hackathons"),
        ("Httpx", "Async HTTP client for external APIs"),
    ]
    for name, desc in tech_be:
        pdf.bullet_point(f"{name}: {desc}")

    pdf.chapter_title("Architecture Diagram (Simplified)", 2)
    arch_text = (
        "Browser (React) --HTTPS--> FastAPI Backend --LangChain--> Gemini AI\n"
        "                                    |                         |\n"
        "                              SQLite DB                  External APIs\n"
        "                           (students,               (Devpost, Clist,\n"
        "                            skill_profiles)          Serper, YouTube)\n"
        "                                    |\n"
        "                              Firebase Auth\n"
        "                           (Google + Email)"
    )
    pdf.code_block(arch_text)

    # ========== 3. PROJECT STRUCTURE ==========
    pdf.add_page()
    pdf.chapter_title("3. Project Structure")
    structure = (
        "AI-CAREER-AGENT/\n"
        "|\n"
        "|-- backend/                      # FastAPI backend\n"
        "|   |-- main.py                   # App entry point, auth, core routes\n"
        "|   |-- config.py                 # Environment config (API keys, ports)\n"
        "|   |-- database.py               # SQLite schema init + connection\n"
        "|   |-- models/                   # Pydantic data models\n"
        "|   |   |-- student.py            # StudentOnboarding schema\n"
        "|   |   |-- quiz.py               # QuizResponse, QuizSubmission\n"
        "|   |   |-- scoring.py            # SkillProfileOutput schema\n"
        "|   |   |-- summary.py            # SummaryOutput schema\n"
        "|   |   |-- risk.py               # RiskOutput schema\n"
        "|   |   |-- schemas.py            # Agent request/response schemas\n"
        "|   |-- agents/                   # AI Agent implementations\n"
        "|   |   |-- combined_agent.py     # Core agent (quiz, score, summary, risk)\n"
        "|   |   |-- career_roadmap_agent.py\n"
        "|   |   |-- dsa_agent.py          # DSA sheet + LeetCode fetcher\n"
        "|   |   |-- course_agent.py       # Course recommendations\n"
        "|   |   |-- opportunities_agent.py # Live hackathons/contests\n"
        "|   |-- services/\n"
        "|   |   |-- agent_service.py      # Orchestrator service layer\n"
        "|   |-- routes/\n"
        "|   |   |-- agents.py             # /api/agents/* endpoints\n"
        "|   |-- career_agent.db           # SQLite database file\n"
        "|\n"
        "|-- frontend/                     # React frontend (Vite)\n"
        "|   |-- src/\n"
        "|   |   |-- App.jsx               # Root component, routing, auth\n"
        "|   |   |-- firebase.js           # Firebase config\n"
        "|   |   |-- pages/                # 12 page components\n"
        "|   |   |-- components/           # Shared UI components\n"
        "|   |   |-- data/quizBank.js      # Local quiz questions + evaluator\n"
        "|   |   |-- lib/\n"
        "|   |       |-- profileStore.js   # Firestore CRUD operations\n"
        "|   |       |-- yearNav.js        # Year slug utilities\n"
        "|\n"
        "|-- README.md                     # Prompt engineering doc\n"
        "|-- package-lock.json"
    )
    pdf.code_block(structure)

    # ========== 4. BACKEND DETAILS ==========
    pdf.add_page()
    pdf.chapter_title("4. Backend (FastAPI + Python)")

    pdf.chapter_title("4.1 API Endpoints", 2)
    endpoints = [
        ("GET", "/health", "Health check", "No"),
        ("GET", "/me/status", "Onboarding + quiz progress", "Yes"),
        ("GET", "/api/onboarding", "Get saved profile", "Yes"),
        ("POST", "/api/onboarding", "Save student profile", "Yes"),
        ("GET", "/api/quiz/generate", "Generate quiz from profile", "Yes"),
        ("POST", "/api/quiz/generate", "Generate quiz with payload", "Yes"),
        ("POST", "/api/quiz/submit", "Submit + analyse quiz", "Yes"),
        ("GET", "/api/dashboard", "Get cached analysis", "Yes"),
        ("POST", "/api/agents/career-roadmap", "Generate roadmap", "No*"),
        ("POST", "/api/agents/dsa-sheet", "Generate DSA sheet", "No*"),
        ("GET", "/api/agents/dsa-topics", "List DSA topics", "No"),
        ("POST", "/api/agents/courses", "Course recommendations", "No*"),
        ("POST", "/api/agents/opportunities", "Live opportunities", "No*"),
    ]
    widths = [18, 65, 65, 20]
    pdf.table_row(["Method", "Endpoint", "Description", "Auth"], widths, bold=True, fill=True)
    for ep in endpoints:
        pdf.table_row(ep, widths)
    pdf.body_text("* Agent routes are not behind auth middleware yet (identified gap).")

    pdf.chapter_title("4.2 Database Schema (SQLite)", 2)
    pdf.body_text("The backend uses SQLite with two main tables:")
    pdf.chapter_title("students table", 3)
    students_cols = [
        "student_id TEXT PRIMARY KEY",
        "firebase_uid TEXT UNIQUE NOT NULL",
        "name TEXT, email TEXT",
        "year INTEGER, branch TEXT",
        "cgpa REAL, college TEXT",
        "college_tier TEXT",
        "domain_interest TEXT (JSON)",
        "career_goal TEXT",
        "hours_per_day INTEGER",
        "preferred_style TEXT (JSON)",
        "created_at TEXT",
    ]
    for col in students_cols:
        pdf.bullet_point(col)

    pdf.chapter_title("skill_profiles table", 3)
    skill_cols = [
        "student_id TEXT PRIMARY KEY (FK)",
        "overall_score INTEGER",
        "level TEXT (Beginner/Intermediate/Advanced)",
        "category_scores TEXT (JSON)",
        "classification_reason TEXT",
        "weak_areas TEXT (JSON array)",
        "summary_text TEXT",
        "focus_areas TEXT (JSON array)",
        "recommended_next_step TEXT",
        "overall_risk_level TEXT",
        "risk_report TEXT (JSON)",
        "created_at TEXT",
    ]
    for col in skill_cols:
        pdf.bullet_point(col)

    # ========== 4.3 AI AGENTS ==========
    pdf.add_page()
    pdf.chapter_title("4.3 AI Agents (Backend)", 2)
    pdf.body_text(
        "The backend implements 5 AI agents using LangChain + Google Gemini. "
        "Each agent has a system prompt, input schema, output schema, and mock fallback."
    )
    agents_table = [
        ("CombinedAgent", "Quiz gen + Scoring + Summary + Risk", "gemini-2.5-flash"),
        ("CareerRoadmapAgent", "Year-wise career roadmap", "gemini-2.0-flash"),
        ("DSAPracticeAgent", "112 LeetCode problems + API fetch", "gemini-2.0-flash"),
        ("CourseRecommendationAgent", "Curated courses + YouTube", "gemini-2.0-flash"),
        ("OpportunitiesAgent", "Hackathons, CTFs, contests", "gemini-2.0-flash"),
    ]
    pdf.table_row(["Agent", "Responsibility", "LLM Model"], [45, 80, 45], bold=True, fill=True)
    for a in agents_table:
        pdf.table_row(a, [45, 80, 45])

    pdf.chapter_title("4.4 Authentication Flow", 2)
    pdf.body_text(
        "1. Frontend uses Firebase Auth (Google + Email/Password).\n"
        "2. On login, frontend receives a Firebase ID token.\n"
        "3. Token is sent as 'Authorization: Bearer <token>' header.\n"
        "4. Backend's get_current_student() dependency verifies the token.\n"
        "5. Firebase UID is resolved to a student_id via SQLite lookup/insert.\n"
        "6. Mock auth mode available for development (tokens starting with 'mock-uid-')."
    )

    # ========== 5. FRONTEND DETAILS ==========
    pdf.add_page()
    pdf.chapter_title("5. Frontend (React + Vite + Tailwind)")

    pdf.chapter_title("5.1 Pages & Routes", 2)
    routes = [
        ("/", "Home", "Landing page with hero, features, CTA"),
        ("/about", "About", "About page with product info"),
        ("/login", "Login", "Firebase Google + Email auth"),
        ("/onboarding", "Onboarding", "3-step profile setup wizard"),
        ("/quiz", "QuizPage", "5-question timed MCQ assessment"),
        ("/dashboard", "Dashboard", "Results: scores, summary, risk"),
        ("/opportunities", "Opportunities", "Live hackathons/CTFs feed"),
        ("/roadmap", "Roadmap", "AI-generated career roadmap"),
        ("/dsa", "DSA", "112 LeetCode problems tracker"),
        ("/courses", "Courses", "Course recommendations"),
        ("/resume", "Resume", "Resume builder (placeholder)"),
        ("/profile", "Profile", "User profile management"),
    ]
    pdf.table_row(["Route", "Component", "Description"], [30, 35, 95], bold=True, fill=True)
    for r in routes:
        pdf.table_row(r, [30, 35, 95])

    pdf.chapter_title("5.2 Key Components", 2)
    components = [
        "Sidebar - Collapsible navigation with year-wise sub-menu",
        "UserMenu - Avatar dropdown with profile, restart, sign-out",
        "ChatbotWidget - Floating AI chatbot on dashboard",
        "SharedLanding - AnnouncementBar, Navbar, FinalCTA, Footer",
        "YearDropdown - Year-wise roadmap navigation",
    ]
    for c in components:
        pdf.bullet_point(c)

    pdf.chapter_title("5.3 State Management", 2)
    pdf.body_text(
        "The app uses React state (useState/useEffect) with no external state library. "
        "Key state lives in App.jsx and flows down as props:"
    )
    states = [
        "authUser / authToken - Firebase auth state",
        "userDoc - Firestore user document (profile, streak, analysis)",
        "studentProfile - Current quiz payload",
        "quizQuestions - Generated quiz questions",
        "quizAnalysis - Completed analysis results",
        "authLoading / profileLoading - Loading guards for protected routes",
    ]
    for s in states:
        pdf.bullet_point(s)

    # ========== 6. AI AGENT SYSTEM ==========
    pdf.add_page()
    pdf.chapter_title("6. AI Agent System - Detailed")
    pdf.body_text(
        "All AI agents follow the same pattern: System Prompt -> User Prompt -> Gemini API -> "
        "JSON Parse -> Pydantic Validation -> Fallback to Mock Data on failure."
    )

    pdf.chapter_title("6.1 QuestionAgent (combined_agent.py)", 2)
    pdf.body_text(
        "Purpose: Generates adaptive MCQs for skill assessment quiz.\n"
        "Model: gemini-2.5-flash | Temperature: 0.7 | Max Tokens: 3000\n"
        "Input: Student profile (year, domain, career goal)\n"
        "Output: QuizResponse with 5 questions (Easy/Medium/Hard distribution)\n"
        "Logic: Year-based difficulty distribution (Y1: 5E/3M/2H, Y2: 4E/4M/2H, etc.)\n"
        "Domain-specific topics mapped per student's chosen domain."
    )

    pdf.chapter_title("6.2 ScoringAgent (combined_agent.py)", 2)
    pdf.body_text(
        "Purpose: Scores quiz and classifies skill level.\n"
        "Model: gemini-2.5-flash | Temperature: 0.2\n"
        "Scoring Formula:\n"
        "  - Topic Score = (correct/total) * 100\n"
        "  - Overall Score = DSA(40%) + Programming(30%) + Logic(20%) + Domain(10%)\n"
        "  - Difficulty Bonus: +3 pts per Hard correct (max +15)\n"
        "  - Time Penalty: -2 pts if avg > 90s\n"
        "Classification Rules (strict):\n"
        "  - Beginner: score < 45 OR DSA < 30\n"
        "  - Intermediate: score >= 45 AND DSA >= 40\n"
        "  - Advanced: score >= 75 AND Med/Hard correct >= 60%"
    )

    pdf.chapter_title("6.3 SummaryAgent (combined_agent.py)", 2)
    pdf.body_text(
        "Purpose: Synthesises student profile + quiz results into structured summary.\n"
        "Temperature: 0.3 | Output: SummaryOutput schema\n"
        "Produces: summary_text, skill_profile, focus_areas, placement_readiness, next_step"
    )

    pdf.chapter_title("6.4 RiskAgent (combined_agent.py)", 2)
    pdf.body_text(
        "Purpose: Identifies skill gaps, timeline risks, strategic misalignments.\n"
        "Temperature: 0.2 | Output: RiskOutput schema\n"
        "Considers: Indian tech ecosystem benchmarks (FAANG, MNCs, GATE, startups)\n"
        "Produces: overall_risk_level, timeline_risk, skill_gaps, quick_wins, red_flags"
    )

    pdf.add_page()
    pdf.chapter_title("6.5 CareerRoadmapAgent", 2)
    pdf.body_text(
        "Purpose: Generates personalised year-by-year career roadmap.\n"
        "Model: gemini-2.0-flash | Temperature: 0.4\n"
        "Features: Retry with exponential backoff (3 attempts), mock fallback\n"
        "Output: CareerRoadmapResponse with plan per year, resources, milestones"
    )

    pdf.chapter_title("6.6 DSA Practice Agent", 2)
    pdf.body_text(
        "Purpose: Provides 112 curated LeetCode problems across 16 DSA topics.\n"
        "Built-in Problem Set: 112 hardcoded problems (Arrays through Math/Number Theory)\n"
        "Live LeetCode Fetch: GraphQL API to fetch problems by difficulty + topic\n"
        "Caching: 24-hour TTL cache for API results\n"
        "Topics: Arrays, Strings, Hash Table, Linked Lists, Stacks, Queues, Trees, BSTs,\n"
        "  Graphs, Heaps, Sorting, Searching, Two Pointers, Sliding Window, Binary Search,\n"
        "  Recursion/Backtracking, Dynamic Programming, Greedy, Bit Manipulation, Tries,\n"
        "  Union Find, Math & Number Theory"
    )

    pdf.chapter_title("6.7 CourseRecommendationAgent", 2)
    pdf.body_text(
        "Purpose: Recommends courses from curated list + YouTube API.\n"
        "Model: gemini-2.0-flash | Temperature: 0.3\n"
        "Curated courses for: AI/ML, Web Dev, DSA/CP, Cloud, CyberSec, Mobile\n"
        "YouTube API integration for fresh course discovery\n"
        "Caching: 12-hour TTL for recommendations"
    )

    pdf.chapter_title("6.8 OpportunitiesAgent", 2)
    pdf.body_text(
        "Purpose: Fetches live hackathons, CTFs, contests, internships.\n"
        "Sources:\n"
        "  1. Devpost RSS feed (hackathons)\n"
        "  2. Serper.dev web search (domain-specific opportunities)\n"
        "  3. Clist.by API (competitive programming contests)\n"
        "Model: gemini-2.0-flash for parsing/filtering results\n"
        "Caching: 6-hour TTL for opportunities feed"
    )

    # ========== 7. DATA FLOW ==========
    pdf.add_page()
    pdf.chapter_title("7. Data Flow & User Journey")
    pdf.body_text("Complete user journey through the application:")
    steps = [
        "1. User visits landing page -> clicks 'Start Free Assessment'",
        "2. Login page -> Firebase Google/Email authentication",
        "3. Onboarding (3 steps):",
        "   Step 1: Name, email, age, year, branch, college, tier, CGPA",
        "   Step 2: Domain interests (multi-select), career goal",
        "   Step 3: Hours/day, learning style preference",
        "4. Profile saved to Firestore + local state",
        "5. Quiz generated (5 MCQs from local quiz bank)",
        "6. Quiz taken with per-question timer (60s countdown)",
        "7. Quiz scored locally via evaluateQuizLocally()",
        "8. Results saved to Firestore",
        "9. Dashboard displayed with:",
        "   - Skill level (Beginner/Intermediate/Advanced)",
        "   - Category scores (DSA, Programming, Logic, Domain)",
        "   - Summary analysis",
        "   - Risk assessment with timeline",
        "   - Quick wins and red flags",
        "10. Sidebar navigation to: Roadmap, DSA, Courses, Resume, etc.",
        "11. Chatbot widget available on dashboard for Q&A",
    ]
    for s in steps:
        pdf.bullet_point(s)

    pdf.chapter_title("Frontend vs Backend Quiz Flow", 2)
    pdf.body_text(
        "IMPORTANT: The current frontend uses a LOCAL quiz system (quizBank.js) "
        "that does NOT call the backend API. The backend quiz endpoints exist and "
        "are fully functional but the frontend bypasses them for speed/offline use. "
        "The backend agents (CareerRoadmap, DSA, Courses, Opportunities) ARE called "
        "from the frontend via /api/agents/* endpoints."
    )

    # ========== 8. WHAT HAS BEEN DONE ==========
    pdf.add_page()
    pdf.chapter_title("8. What Has Been Done (Implemented)")
    pdf.body_text("Features that are fully implemented and working:")
    pdf.ln(2)

    done_items = [
        "Authentication: Firebase Google + Email/Password login/signup",
        "Onboarding: 3-step wizard with profile, interests, goals",
        "Quiz System: 5-question local MCQ quiz with timer",
        "Skill Classification: Beginner/Intermediate/Advanced scoring",
        "Dashboard: Full analysis view with scores, gaps, risk, timeline",
        "DSA Practice: 112 LeetCode problems with topic filtering",
        "Career Roadmap: AI-generated year-wise preparation plan",
        "Course Recommendations: Curated + YouTube courses by domain",
        "Live Opportunities: Hackathons, CTFs from 3 data sources",
        "Sidebar Navigation: Collapsible with year-wise sub-menus",
        "User Profile: Firestore-backed profile with streak tracking",
        "Responsive Design: Mobile sidebar drawer, desktop collapse",
        "Readiness Score: Animated ring on landing page",
        "Chatbot Widget: Basic UI on dashboard page",
        "About Page: Product information page",
        "Backend API: 13 endpoints with auth, validation, error handling",
        "Database: SQLite with students + skill_profiles tables",
        "Agent Fallback: Mock data for all agents when API fails",
        "Error Handling: Structured error codes + retry logic",
        "Caching: In-memory TTL caches for DSA, courses, opportunities",
    ]
    for item in done_items:
        pdf.bullet_point("[DONE] " + item)

    # ========== 9. WHAT CAN BE DONE ==========
    pdf.add_page()
    pdf.chapter_title("9. What Can Be Done (Future Scope)")
    pdf.body_text("Identified gaps and improvement opportunities:")
    pdf.ln(2)

    pdf.chapter_title("High Priority", 2)
    high = [
        "Connect frontend quiz to backend API (currently uses local evaluator)",
        "Add auth middleware to /api/agents/* routes (currently unprotected)",
        "Implement Resume Builder (backend agent exists, frontend is placeholder)",
        "Add ChatbotAgent backend integration (currently frontend-only UI)",
        "Switch from SQLite to PostgreSQL for production deployment",
        "Add Docker + CI/CD pipeline (GitHub Actions)",
        "Deploy to Railway (backend) + Vercel (frontend)",
    ]
    for item in high:
        pdf.bullet_point("[TODO] " + item)

    pdf.chapter_title("Medium Priority", 2)
    med = [
        "Add Redis caching layer (currently in-memory dict caches)",
        "Implement monthly re-assessment flow",
        "Add PYQs + Notes section (curated static files)",
        "Implement industry trends section (Tavily weekly search)",
        "Add progress tracking with streak calendar",
        "Build mind games / engagement features",
        "Consolidate two frontend codebases (root src/ vs frontend/)",
        "Add dark mode support",
        "Implement notifications for opportunity deadlines",
    ]
    for item in med:
        pdf.bullet_point("[TODO] " + item)

    pdf.chapter_title("Low Priority / Nice-to-Have", 2)
    low = [
        "Add rate limiting on API endpoints",
        "Implement user analytics dashboard",
        "Add A/B testing for quiz difficulty distributions",
        "Integrate Pinecone as alternative vector DB",
        "Add WebSocket for real-time chatbot",
        "Implement email notifications for weekly summaries",
        "Add multi-language support (Hindi, regional languages)",
        "Mobile app (React Native / Flutter)",
    ]
    for item in low:
        pdf.bullet_point("[TODO] " + item)

    # ========== 10. SETUP ==========
    pdf.add_page()
    pdf.chapter_title("10. Setup & Running Instructions")
    pdf.chapter_title("Prerequisites", 2)
    prereqs = [
        "Python 3.10+",
        "Node.js 18+ and npm",
        "Google Gemini API key",
        "Firebase project (for auth + Firestore)",
    ]
    for p in prereqs:
        pdf.bullet_point(p)

    pdf.chapter_title("Backend Setup", 2)
    setup_be = (
        "cd backend\n"
        "python -m venv venv\n"
        "source venv/bin/activate\n"
        "pip install -r requirements.txt\n"
        "\n"
        "# Create .env file with:\n"
        "# GEMINI_API_KEY=your_key_here\n"
        "# FIREBASE_PROJECT_ID=your_project_id\n"
        "\n"
        "python main.py\n"
        "# Server starts at http://localhost:8000"
    )
    pdf.code_block(setup_be)

    pdf.chapter_title("Frontend Setup", 2)
    setup_fe = (
        "cd frontend\n"
        "npm install\n"
        "\n"
        "# Create .env file with Firebase config:\n"
        "# VITE_FIREBASE_API_KEY=...\n"
        "# VITE_FIREBASE_AUTH_DOMAIN=...\n"
        "# VITE_FIREBASE_PROJECT_ID=...\n"
        "# VITE_FIREBASE_STORAGE_BUCKET=...\n"
        "# VITE_FIREBASE_MESSAGING_SENDER_ID=...\n"
        "# VITE_FIREBASE_APP_ID=...\n"
        "\n"
        "npm run dev\n"
        "# Frontend starts at http://localhost:5173"
    )
    pdf.code_block(setup_fe)

    pdf.chapter_title("Environment Variables", 2)
    envs = [
        ("GEMINI_API_KEY", "Google Gemini API key (required for AI agents)"),
        ("FIREBASE_PROJECT_ID", "Firebase project ID (optional, defaults to ai-career-14816)"),
        ("FIREBASE_SERVICE_ACCOUNT_JSON", "Path to Firebase service account JSON (optional)"),
        ("YOUTUBE_API_KEY", "YouTube Data API key (optional, for course search)"),
        ("SERPER_API_KEY", "Serper.dev API key (optional, for opportunity search)"),
        ("PORT", "Backend port (default: 8000)"),
        ("HOST", "Backend host (default: 0.0.0.0)"),
    ]
    pdf.table_row(["Variable", "Description"], [60, 100], bold=True, fill=True)
    for e in envs:
        pdf.table_row(e, [60, 100])

    # Save PDF
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "AI_Career_Agent_Documentation.pdf")
    pdf.output(output_path)
    print(f"PDF generated: {output_path}")
    return output_path


if __name__ == "__main__":
    generate_documentation_pdf()
