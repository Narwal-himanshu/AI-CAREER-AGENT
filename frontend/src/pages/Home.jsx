import { Reveal } from "../components/Reveal";
import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Search, Menu, X, ArrowRight, CheckCircle2, ShieldCheck,
  ExternalLink, Code2, Milestone, Bell, Sparkles, BookOpen,
  Calendar, Flame, GraduationCap, HelpCircle, ChevronDown,
  Terminal, PlayCircle, LayoutDashboard, Trophy
} from 'lucide-react'
import { AnnouncementBar, Navbar, FinalCTA, Footer } from '../components/SharedLanding'
import ChatbotWidget from '../components/ChatbotWidget'

// Shared palette for the animated glow-border effect used across card grids.
const GLOW_COLORS = [
  { glow: 'rgba(79,70,229,0.32)', border: 'rgba(79,70,229,0.35)' },   // signal / indigo
  { glow: 'rgba(245,158,11,0.30)', border: 'rgba(245,158,11,0.35)' }, // ember / amber
  { glow: 'rgba(16,185,129,0.30)', border: 'rgba(16,185,129,0.35)' }, // emerald
  { glow: 'rgba(168,85,247,0.28)', border: 'rgba(168,85,247,0.32)' }, // purple
]

function glowStyle(index) {
  const c = GLOW_COLORS[index % GLOW_COLORS.length]
  return { '--glow-color': c.glow, '--glow-border-color': c.border }
}

// Sub-component 3: Hero Section with Animated Readiness Ring
function Hero({ onStartAssessment, targetScore, scoreLabel }) {
  const [score, setScore] = useState(0)

  useEffect(() => {
    const target = targetScore
    setScore(0)
    const interval = setInterval(() => {
      setScore((prev) => {
        if (prev >= target) {
          clearInterval(interval)
          return target
        }
        return prev + 1
      })
    }, 15)
    return () => clearInterval(interval)
  }, [targetScore])

  return (
    <section className="bg-paper py-16 md:py-24 border-b border-mist overflow-hidden relative">

      {/* Subtle background texture */}
      <div className="absolute inset-0 bg-dot-pattern text-signal/[0.05] pointer-events-none"></div>

      {/* Background Decorative Shapes */}
      <div className="hidden md:flex absolute inset-0 pointer-events-none overflow-hidden max-w-[1400px] mx-auto">
        {/* Left shapes */}
        <div className="absolute top-16 left-12 w-16 h-16 rounded-full bg-signal/10 backdrop-blur-2xl flex items-center justify-center shape-float">
          <Code2 className="w-8 h-8 text-signal opacity-50" />
        </div>
        <div className="absolute bottom-24 left-32 w-12 h-12 rounded-full bg-ember/10 backdrop-blur-2xl flex items-center justify-center shape-float-delay">
          <GraduationCap className="w-6 h-6 text-ember opacity-50" />
        </div>
        <div className="absolute top-1/2 -left-4 w-20 h-20 rounded-full bg-emerald-500/10 backdrop-blur-2xl flex items-center justify-center shape-float-slow">
          <Milestone className="w-10 h-10 text-emerald-500 opacity-50" />
        </div>

        {/* Right shapes */}
        <div className="absolute top-24 right-20 w-14 h-14 rounded-full bg-ember/10 backdrop-blur-2xl flex items-center justify-center shape-float-slow">
          <Sparkles className="w-7 h-7 text-ember opacity-50" />
        </div>
        <div className="absolute bottom-32 right-12 w-24 h-24 rounded-full bg-signal/10 backdrop-blur-2xl flex items-center justify-center shape-float-delay">
          <BookOpen className="w-12 h-12 text-signal opacity-50" />
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left copy column */}
        <Reveal delay={0}><div className="space-y-6 max-w-lg">
          <h1 className="font-sans text-4xl md:text-5xl font-extrabold text-ink leading-tight tracking-tight">
            Personalised career roadmaps for BTech CS students.
          </h1>
          
          
          <p className="text-base text-slate leading-relaxed">
            Stop guessing your placement readiness. Take our 5-minute diagnostic quiz, find your level, and unlock a customized preparation sheet containing roadmaps, DSA trackers, and curated resources.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <button
              onClick={onStartAssessment}
              className="px-8 py-3.5 bg-signal hover:bg-signal/95 text-sm font-bold text-white rounded-full shadow-lg shadow-signal/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Start free assessment
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="#how-it-works"
              className="px-8 py-3.5 border border-mist bg-white hover:bg-mist text-sm font-bold text-slate hover:text-ink rounded-full text-center transition-all flex items-center justify-center gap-1.5"
            >
              See how it works
            </a>
          </div>
        </div>
        </Reveal>

        {/* Right Readiness Ring visual column */}
        <Reveal delay={150} className="flex flex-col items-center justify-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[320px] w-[320px] bg-signal/3 rounded-full blur-3xl -z-10"></div>
          
          <div className="bg-white border border-mist p-8 rounded-3xl shadow-lg flex flex-col items-center gap-4 relative">
            {/* Stickers */}
            <div className="absolute -left-6 bottom-8 w-12 h-12 rounded-full bg-ember/10 backdrop-blur-xl flex items-center justify-center shape-float-delay z-10 border border-white/50 shadow-sm">
              <Flame className="w-5 h-5 text-ember" />
            </div>
            <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-signal/10 backdrop-blur-xl flex items-center justify-center shape-float z-10 border border-white/50 shadow-sm">
              <Sparkles className="w-4 h-4 text-signal" />
            </div>

            <div className="absolute top-4 right-4 z-10">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>

            {/* Circular Readiness ring */}
            <div className="relative flex items-center justify-center">
              {/* Soft blurred glow behind ring */}
              <div className="absolute inset-0 bg-gradient-to-tr from-signal via-ember to-emerald-500 blur-2xl opacity-20 rounded-full scale-90"></div>

              <svg className="w-56 h-56 relative z-10" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4F46E5" /> {/* signal */}
                    <stop offset="50%" stopColor="#F59E0B" /> {/* ember */}
                    <stop offset="100%" stopColor="#10B981" /> {/* emerald-500 */}
                  </linearGradient>
                </defs>
                <circle 
                  cx="50" 
                  cy="50" 
                  r="42" 
                  stroke="#EEF0FF" 
                  strokeWidth="7" 
                  fill="transparent" 
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="42" 
                  stroke="url(#score-gradient)"
                  strokeWidth="7" 
                  fill="transparent"
                  strokeDasharray="263.8" 
                  strokeDashoffset={263.8 - (263.8 * score) / 100}
                  strokeLinecap="round" 
                  transform="rotate(-90 50 50)" 
                  className="transition-all duration-300 ease-out" 
                />
                <text 
                  x="50" 
                  y="55" 
                  textAnchor="middle" 
                  className="font-mono font-black text-3xl"
                  fill="url(#score-gradient)"
                >
                  {score}%
                </text>
              </svg>
            </div>

            <div className="text-center relative z-10">
              <span className="text-[10px] font-bold text-signal uppercase tracking-widest block mb-1">YOUR LEVEL</span>
              <h3 className="text-sm font-extrabold text-ink">Readiness Classification Score</h3>
              <p className="text-xs text-slate mt-1">{scoreLabel}</p>
            </div>
          </div>
        </Reveal>

      </div>
    </section>
  )
}

// Sub-component 4: Content Partner Logo Strip
const PARTNER_LOGOS = [
  { name: 'LeetCode', icon: Code2, color: '#F59E0B' },
  { name: 'GeeksforGeeks', icon: Terminal, color: '#10B981' },
  { name: 'Udemy', icon: GraduationCap, color: '#A855F7' },
  { name: 'Coursera', icon: BookOpen, color: '#4F46E5' },
  { name: 'YouTube', icon: PlayCircle, color: '#EF4444' },
]

function LogoStrip() {
  // Duplicate the list so the marquee can loop seamlessly at -50%.
  const track = [...PARTNER_LOGOS, ...PARTNER_LOGOS]

  return (
    <section className="bg-mist py-8 border-b border-mist/50 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 text-center">
        <Reveal delay={0}>
          <span className="text-[10px] font-bold text-slate uppercase tracking-widest block mb-5">
            Built with content from standard learning ecosystems
          </span>
        </Reveal>
      </div>

      {/* Edge fade masks so logos scroll in/out smoothly */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-mist to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-mist to-transparent z-10" />

        <div className="flex w-max marquee-track">
          {track.map((logo, index) => {
            const Icon = logo.icon
            return (
              <div
                key={`${logo.name}-${index}`}
                className="flex items-center gap-2.5 px-8 md:px-10 select-none flex-shrink-0"
              >
                <span
                  className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${logo.color}1A` }}
                >
                  <Icon className="h-4.5 w-4.5" style={{ color: logo.color }} />
                </span>
                <span className="font-mono text-sm font-bold text-ink tracking-tight whitespace-nowrap">
                  {logo.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// Sub-component 5: Value Framing Proposition Grid
function ValueGrid() {
  const values = [
    {
      title: 'Fully Personalised',
      desc: 'No generic syllabus. Your roadmap adjusts dynamically depending on your current academic year and college tier.'
    },
    {
      title: 'Adaptive Assessment',
      desc: 'Our diagnostic quiz adapts difficulty on-the-fly to pinpoint your core strengths and weak areas accurately.'
    },
    {
      title: 'Highly Practical',
      desc: 'Direct integration with curated YouTube links, Udemy lectures, and topic-wise LeetCode practice trackers.'
    },
    {
      title: 'Always Free to Start',
      desc: 'Onboard and identify your skill profile in 5 minutes with zero upfront payment constraints.'
    }
  ]

  return (
    <section className="bg-paper py-16 md:py-24 border-b border-mist relative overflow-hidden">
      <div className="absolute inset-0 bg-dot-pattern text-slate/[0.04] pointer-events-none"></div>
      <div className="max-w-[1200px] mx-auto px-6 space-y-12 relative z-10">
        <Reveal delay={0}>
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="text-xs font-bold text-signal uppercase tracking-widest block">Why CareerAgent?</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-ink leading-tight">
              Generic career roadmap advice doesn't know your gaps or your timeline.
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v, i) => (
            <Reveal key={i} delay={i * 100} className="flex">
              <div
                className="w-full bg-white border border-slate/20 p-6 rounded-2xl hover:border-signal/20 transition-all flex flex-col justify-between glow-border"
                style={glowStyle(i)}
              >
                <div className="space-y-3">
                  <div className="h-8 w-8 rounded-lg bg-signal-tint flex items-center justify-center text-signal font-bold text-sm">
                    {i + 1}
                  </div>
                  <h3 className="text-sm font-bold text-ink">{v.title}</h3>
                  <p className="text-xs text-slate leading-relaxed">{v.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// Sub-component 6: How It Works Flow
function HowItWorks({ onStartAssessment }) {
  const steps = [
    { num: '01', title: 'Take the quiz', desc: 'Complete our 10-15 question adaptive MCQ sheet covering DSA, logic, and core coding.' },
    { num: '02', title: 'Get your roadmap', desc: 'Instantly view your custom year-wise preparation timeline showing targeted goals.' },
    { num: '03', title: 'Practice daily', desc: 'Mark off topic-wise LeetCode sheets and track streaks with context-aware learning recs.' },
  ]

  return (
    <section id="how-it-works" className="bg-mist py-16 md:py-24 border-b border-mist">
      <div className="max-w-[1200px] mx-auto px-6 space-y-12">
        <Reveal delay={0}>
          <div className="text-center max-w-md mx-auto space-y-3">
            <span className="text-xs font-bold text-signal uppercase tracking-widest block">How it works</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-ink">Three steps to your target placement</h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((s, idx) => (
            <Reveal key={idx} delay={idx * 100} className="flex">
              <div
                className="w-full relative space-y-3 bg-white border border-slate/20 hover:border-signal/20 rounded-2xl p-6 transition-all glow-border"
                style={glowStyle(idx)}
              >
                <div className="font-mono text-4xl font-extrabold text-signal/15 tracking-tight">
                  {s.num}
                </div>
                <h3 className="text-sm font-bold text-ink">{s.title}</h3>
                <p className="text-xs text-slate leading-relaxed">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="text-center pt-4">
          <button
            onClick={onStartAssessment}
            className="px-6 py-3 bg-signal hover:bg-signal/90 text-xs font-bold text-white rounded-full flex items-center justify-center gap-2 mx-auto shadow-md transition-all cursor-pointer"
          >
            Create Your Account Now
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  )
}

// Sub-component 7: Trust and Safety Guardrails Section
function TrustSection() {
  const points = [
    { title: 'Validated Outputs Only', text: 'Every generated question, scoring category, and risk timeline evaluation passes standard programmatic validation pipelines before reaching you.' },
    { title: 'Zero Hallucinations', text: 'Our agent templates prohibit fabricating external URLs, resource names, or company data. We use checked vectors to retrieve resources.' },
    { title: 'Encouraging & Constructive', text: 'Risk assessments highlight skill gaps and timelines realistically, framing critical metrics as actionable wins rather than discouraging constraints.' }
  ]

  return (
    <section className="bg-paper py-16 border-b border-mist">
      <div className="max-w-[1200px] mx-auto px-6 space-y-10">
        <Reveal delay={0}>
          <div className="max-w-lg mx-auto text-center space-y-2">
            <div className="inline-flex items-center justify-center p-2 rounded-full bg-emerald-500/10 text-emerald-600 mb-2">
              <ShieldCheck className="h-6 w-6 glow-emerald" />
            </div>
            <h2 className="text-2xl font-extrabold text-ink leading-tight">Built to never discourage you.</h2>
            <p className="text-xs text-slate leading-normal">
              Safety guardrails are natively baked into every agent interaction.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {points.map((p, i) => (
            <Reveal key={i} delay={i * 100} className="flex">
              <div
                className="w-full border border-mist p-5 rounded-2xl bg-white space-y-2.5 glow-border"
                style={glowStyle(i)}
              >
                <h3 className="text-xs font-bold text-ink flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  {p.title}
                </h3>
                <p className="text-[11px] text-slate leading-relaxed">
                  {p.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// Sub-component 8: Interactive CSS Feature Showcases
function FeatureShowcase({ onStartAssessment, onGoToOpportunities, onFeatureNav }) {
  return (
    <section className="bg-ink py-16 md:py-24 space-y-24 border-b border-mist relative overflow-hidden">
      {/* Dark background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-dot-pattern text-white/5 mix-blend-overlay"></div>
        {/* Glow blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-signal/15 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-ember/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3"></div>
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-signal/10 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2"></div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 space-y-20 relative z-10">
        
        {/* Showcase Row 1: Career Roadmap (Visual Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <Reveal delay={0}>
            <div className="space-y-5">
              <span className="text-xs font-bold text-signal-tint uppercase tracking-widest block">Feature 1</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-snug">
                Year-wise custom roadmaps calibrated to your gaps.
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Based on your onboarding domain selection and diagnostic scores, downstream agents build a custom preparation timeline. Learn DSA trees when you have time, start projects when you have foundations.
              </p>
              <button onClick={() => onFeatureNav('roadmap')} className="text-xs font-bold text-signal-tint hover:text-white flex items-center gap-1 cursor-pointer">
                Explore Roadmap Features &rarr;
              </button>
            </div>
          </Reveal>
          {/* Mock visual panel */}
          <Reveal delay={150}>
            <div className="bg-mist p-6 rounded-2xl border border-mist flex flex-col gap-3.5 relative overflow-hidden glow-border" style={glowStyle(0)}>
            <span className="text-[10px] font-bold text-slate block">MOCK INTERACTIVE ROADMAP VIEW</span>
            <div className="space-y-3 relative">
              <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-signal/15"></div>
              {[
                { name: 'Semester 3: DSA Core', desc: 'Focus: Recursion, Arrays, Sorting', active: true },
                { name: 'Semester 4: System Concepts', desc: 'Focus: OOP, Database Indexing', active: false },
                { name: 'Semester 5: Projects Portfolio', desc: 'Focus: Full-stack, GitHub uploads', active: false }
              ].map((node, i) => (
                <div key={i} className="flex gap-4 items-start relative pl-6">
                  <div className={`absolute left-1.5 top-1.5 h-3.5 w-3.5 rounded-full border-2 ${
                    node.active ? 'bg-signal border-signal' : 'bg-white border-slate/30'
                  }`}></div>
                  <div className="p-3 bg-white border border-mist rounded-xl flex-1">
                    <h4 className="text-xs font-bold text-ink">{node.name}</h4>
                    <p className="text-[10px] text-slate mt-0.5">{node.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </Reveal>
        </div>

        {/* Showcase Row 2: DSA Practice Sheet (Visual Left) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <Reveal delay={0} className="lg:order-2">
            <div className="space-y-5">
              <span className="text-xs font-bold text-ember uppercase tracking-widest block">Feature 2</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-snug">
                Topic-wise DSA practice sheets with streak tracking.
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Track your LeetCode and CodeChef daily progress. Filter problems by Easy, Medium, and Hard, synced with a streak calendar that records daily solve consistency and alerts you to gaps.
              </p>
              <button onClick={() => onFeatureNav('dsa')} className="text-xs font-bold text-ember hover:text-white flex items-center gap-1 cursor-pointer">
                Practice DSA &rarr;
              </button>
            </div>
          </Reveal>
          {/* Mock visual panel */}
          <Reveal delay={150} className="lg:order-1">
            <div className="bg-mist p-6 rounded-2xl border border-mist space-y-3 glow-border" style={glowStyle(1)}>
            <div className="flex justify-between items-center text-[10px] font-bold text-slate">
              <span>MOCK DSA PROGRESS TRACKER</span>
              <span className="text-ember flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-ember fill-ember/20" /> 12 Day Streak
              </span>
            </div>
            <div className="space-y-2">
              {[
                { title: '1. Two Sum', diff: 'Easy', status: 'Completed', cat: 'Arrays' },
                { title: '2. Reverse LinkedList', diff: 'Easy', status: 'Completed', cat: 'Linked List' },
                { title: '3. Longest Palindromic Substring', diff: 'Medium', status: 'In Progress', cat: 'Strings' }
              ].map((prob, i) => (
                <div key={i} className="p-3 bg-white border border-mist rounded-xl flex items-center justify-between">
                  <div className="flex gap-2.5 items-center">
                    <input 
                      type="checkbox" 
                      readOnly 
                      checked={prob.status === 'Completed'} 
                      className="rounded accent-signal" 
                    />
                    <div>
                      <h4 className="text-xs font-bold text-ink">{prob.title}</h4>
                      <span className="text-[9px] text-slate">{prob.cat}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    prob.diff === 'Easy' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                  }`}>{prob.diff}</span>
                </div>
              ))}
            </div>
            </div>
          </Reveal>
        </div>

        {/* Showcase Row 3: Opportunities Feed (Visual Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <Reveal delay={0}>
            <div className="space-y-5">
              <span className="text-xs font-bold text-signal-tint uppercase tracking-widest block">Feature 3</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-snug">
                Filtered hackathons, CTFs, and open-source contests.
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                We scrape CTFs, hackathons, and contests globally. Downstream search agents filter them specifically matching your skill levels and domains to guarantee realistic engagement.
              </p>
              <button onClick={onGoToOpportunities} className="text-xs font-bold text-signal-tint hover:text-white flex items-center gap-1 cursor-pointer">
                Browse Active Feeds &rarr;
              </button>
            </div>
          </Reveal>
          {/* Mock visual panel */}
          <Reveal delay={150}>
            <div className="bg-mist p-6 rounded-2xl border border-mist space-y-4 glow-border" style={glowStyle(3)}>
            <span className="text-[10px] font-bold text-slate block">MOCK OPPORTUNITY DETAILS CARD</span>
            <div className="p-4 bg-white border border-mist rounded-xl space-y-3 relative">
              <span className="absolute top-4 right-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[9px] font-bold px-2 py-0.5 rounded-full">
                Beginner Match
              </span>
              <div>
                <span className="text-[9px] text-signal font-bold uppercase tracking-wider block">Hackathon</span>
                <h4 className="text-xs font-bold text-ink mt-0.5">Smart India Hackathon 2026</h4>
              </div>
              <p className="text-[11px] text-slate leading-relaxed">
                National hackathon solving government database challenges. Matches your web dev interest domain.
              </p>
              <div className="flex justify-between border-t border-mist pt-3 text-[10px]">
                <div>
                  <span className="text-slate block">Deadline</span>
                  <span className="text-amber-500 font-bold">2026-08-15</span>
                </div>
                <button 
                  onClick={onGoToOpportunities}
                  className="px-3.5 py-1.5 bg-signal hover:bg-signal/90 text-[10px] font-bold text-white rounded-lg flex items-center gap-1"
                >
                  Register <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
            </div>
          </Reveal>
        </div>

      </div>
    </section>
  )
}

// Sub-component 8b: Quick Access Feature Cards (CTA buttons)
function QuickAccessCTA({ onLandingFeatureNav, onStartAssessment, authUser }) {
  const features = [
    {
      key: 'roadmap',
      title: 'Generate Career Roadmap',
      desc: 'Get a personalised year-wise preparation plan.',
      icon: Milestone,
      color: 'from-signal to-indigo-600',
      bg: 'bg-signal-tint',
      textColor: 'text-signal'
    },
    {
      key: 'dsa',
      title: 'DSA Practice',
      desc: 'Topic-wise and company-wise problem sheets.',
      icon: Code2,
      color: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    },
    {
      key: 'dashboard',
      title: 'Dashboard',
      desc: 'View your skill profile, gaps, and risk report.',
      icon: LayoutDashboard,
      color: 'from-purple-500 to-pink-500',
      bg: 'bg-purple-50',
      textColor: 'text-purple-600'
    },
    {
      key: 'opportunities',
      title: 'Opportunities',
      desc: 'Hackathons, CTFs, contests, and internships.',
      icon: Trophy,
      color: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50',
      textColor: 'text-amber-600'
    }
  ]

  const handleClick = (key) => {
    onLandingFeatureNav(key)
  }

  return (
    <section className="bg-paper py-16 md:py-24 border-b border-mist relative overflow-hidden">
      <div className="absolute inset-0 bg-dot-pattern text-slate/[0.04] pointer-events-none"></div>
      <div className="max-w-[1200px] mx-auto px-6 space-y-12 relative z-10">
        <Reveal delay={0}>
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="text-xs font-bold text-signal uppercase tracking-widest block">Get Started</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-ink leading-tight">
              Jump right into a feature.
            </h2>
            <p className="text-xs text-slate leading-relaxed max-w-md mx-auto">
              {authUser
                ? 'Choose a feature to begin your personalised career journey.'
                : 'Create a free account to unlock personalised features, or explore opportunities right away.'}
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <Reveal key={f.key} delay={i * 80} className="flex">
                <button
                  onClick={() => handleClick(f.key)}
                  className="w-full text-left bg-white border border-slate/20 p-6 rounded-2xl hover:border-signal/25 hover:shadow-lg hover:shadow-signal/5 transition-all duration-300 group cursor-pointer flex flex-col gap-4"
                >
                  <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink group-hover:text-signal transition-colors">{f.title}</h3>
                    <p className="text-[11px] text-slate mt-1.5 leading-relaxed">{f.desc}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-signal mt-auto">
                    {authUser ? 'Open' : 'Sign up to start'}
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              </Reveal>
            )
          })}
        </div>

        {!authUser && (
          <div className="text-center pt-2">
            <button
              onClick={onStartAssessment}
              className="px-6 py-3 bg-signal hover:bg-signal/90 text-xs font-bold text-white rounded-full flex items-center justify-center gap-2 mx-auto shadow-md transition-all cursor-pointer"
            >
              Create Free Account
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

// Sub-component 9: Resource Cards (3-card grid)
function ResourceCards() {
  const cards = [
    {
      label: 'Latest Blog Post',
      title: 'How to transition from Beginner to Intermediate DSA in 12 weeks',
      desc: 'A structured blueprint analyzing recursion, dynamic array allocation, and pattern-based LeetCode practice.'
    },
    {
      label: 'This Weeks Top Opportunity',
      title: 'HuggingFace Open Source AI Hackathon',
      desc: 'Build open-source spaces using Gradio/Streamlit and custom LLM interfaces. Deadline: July 20, 2026.'
    },
    {
      label: 'Newest Course Added',
      title: 'Mastering System Concepts & OOP in Java',
      desc: 'Curated 14-part video playlist mapping direct college syllabus constraints for CSE students.'
    }
  ]

  return (
    <section className="bg-mist py-16 border-b border-mist relative">
      {/* Sharp Accent Divider */}
      <div className="absolute top-0 left-0 w-full h-8 -mt-8 bg-mist" style={{ clipPath: 'polygon(0 100%, 100% 0, 100% 100%)' }}></div>
      <div className="absolute inset-0 bg-dot-pattern text-slate/[0.04] pointer-events-none"></div>
      <div className="max-w-[1200px] mx-auto px-6 space-y-10 relative z-10">
        <Reveal delay={0}>
          <div className="text-center max-w-sm mx-auto space-y-2">
            <span className="text-xs font-bold text-signal uppercase tracking-widest block">Resources</span>
            <h2 className="text-2xl font-extrabold text-ink">Learn & Grow Daily</h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((c, i) => (
            <Reveal key={i} delay={i * 100} className="flex">
              <div
                className="w-full bg-white border border-mist p-6 rounded-2xl flex flex-col justify-between hover:border-signal/20 transition-all glow-border"
                style={glowStyle(i)}
              >
                <div className="space-y-3">
                  <span className="text-[9px] font-bold text-signal uppercase tracking-wider block bg-signal-tint px-2.5 py-0.5 rounded-full w-max">
                    {c.label}
                  </span>
                  <h3 className="text-sm font-extrabold text-ink leading-snug">{c.title}</h3>
                  <p className="text-xs text-slate leading-relaxed">{c.desc}</p>
                </div>
                <button className="text-xs font-bold text-signal hover:text-signal/80 mt-6 text-left flex items-center gap-0.5">
                  Read resource &rarr;
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// Main Page wrapper
function Home({
  onStartAssessment,
  onGoToOpportunities,
  onFeatureNav,
  onLandingFeatureNav,
  onYearNav,
  authUser,
  onGoToProfile,
  onSignOut,
  readinessScore = 0,
  readinessLabel = ''
}) {
  return (
    <div className="bg-paper min-h-screen flex flex-col text-ink antialiased">
      <AnnouncementBar />
      <Navbar
        onStartAssessment={onStartAssessment}
        onGoToOpportunities={onGoToOpportunities}
        onFeatureNav={onFeatureNav}
        onYearNav={onYearNav}
        authUser={authUser}
        onGoToProfile={onGoToProfile}
        onSignOut={onSignOut}
      />
      <Hero onStartAssessment={onStartAssessment} targetScore={readinessScore} scoreLabel={readinessLabel} />
      <LogoStrip />
      <ValueGrid />
      <HowItWorks onStartAssessment={onStartAssessment} />
      <TrustSection />
      <FeatureShowcase onStartAssessment={onStartAssessment} onGoToOpportunities={onGoToOpportunities} onFeatureNav={onFeatureNav} />
      <QuickAccessCTA
        onLandingFeatureNav={onLandingFeatureNav}
        onStartAssessment={onStartAssessment}
        authUser={authUser}
      />
      <ResourceCards />
      <FinalCTA onStartAssessment={onStartAssessment} />
      <Footer onStartAssessment={onStartAssessment} />
      <ChatbotWidget />
    </div>
  )
}

export default Home
