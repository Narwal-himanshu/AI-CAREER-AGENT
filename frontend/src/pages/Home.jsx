import React, { useState, useEffect } from 'react'
import { 
  Search, Menu, X, ArrowRight, CheckCircle2, ShieldCheck, 
  ExternalLink, Code2, Milestone, Bell, Sparkles, BookOpen,
  Calendar, Flame, GraduationCap, HelpCircle
} from 'lucide-react'

// Sub-component 1: Slim Announcement Bar
function AnnouncementBar() {
  return (
    <div className="bg-signal text-white text-center py-2 px-4 text-xs font-semibold flex items-center justify-center gap-2 relative">
      <span>🚀 Over 1,200 personalized roadmaps generated this week!</span>
      <a href="#assessment" className="underline hover:text-signal-tint transition-all">Start yours now &rarr;</a>
    </div>
  )
}

// Sub-component 2: Sticky Navbar with Dropdowns/Mega-menus
function Navbar({ onStartAssessment }) {
  const [activeMenu, setActiveMenu] = useState(null) // 'product' | 'year' | 'resources' | null
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleMenuToggle = (menu) => {
    setActiveMenu(activeMenu === menu ? null : menu)
  }

  return (
    <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur-md border-b border-mist shadow-sm">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer">
          <GraduationCap className="h-7 w-7 text-signal" />
          <span className="font-sans font-extrabold text-xl text-ink tracking-tight">
            CareerAgent
          </span>
        </div>

        {/* Center Navigation links */}
        <nav className="hidden md:flex items-center gap-8">
          {/* Product Mega Menu */}
          <div className="relative" onMouseEnter={() => setActiveMenu('product')} onMouseLeave={() => setActiveMenu(null)}>
            <button className="flex items-center gap-1 text-sm font-semibold text-slate hover:text-ink py-5 transition-all">
              Product <span className="text-[10px]">▼</span>
            </button>
            
            {activeMenu === 'product' && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-[600px] bg-white border border-mist rounded-2xl shadow-xl p-6 grid grid-cols-5 gap-6">
                <div className="col-span-3 space-y-4">
                  <h4 className="text-xs font-bold text-slate uppercase tracking-wider">Features</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { name: 'Skill assessment', desc: 'Find your level' },
                      { name: 'Career roadmap', desc: 'Year-wise plan' },
                      { name: 'DSA practice', desc: 'Topic-wise sheet' },
                      { name: 'Course recommendations', desc: 'Curated courses' },
                      { name: 'Opportunities feed', desc: 'Hackathons & CTFs' },
                      { name: 'Resume builder', desc: 'ATS-ready templates' },
                      { name: 'AI chatbot', desc: 'Contextual assistant' }
                    ].map((item, i) => (
                      <button 
                        key={i} 
                        onClick={onStartAssessment}
                        className="text-left group cursor-pointer hover:bg-mist p-2 rounded-xl transition-all"
                      >
                        <div className="text-xs font-bold text-ink group-hover:text-signal transition-colors">{item.name}</div>
                        <div className="text-[10px] text-slate mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                {/* Promo Tile */}
                <div className="col-span-2 bg-signal-tint rounded-xl p-5 flex flex-col justify-between border border-signal/10">
                  <div>
                    <span className="text-[10px] font-bold text-signal uppercase tracking-wider block mb-1">Quick Start</span>
                    <h5 className="text-sm font-extrabold text-ink leading-tight">See your roadmap in under 5 minutes</h5>
                    <p className="text-[11px] text-slate mt-2 leading-relaxed">
                      Take our adaptive diagnostic quiz and map your placement schedule instantly.
                    </p>
                  </div>
                  <button 
                    onClick={onStartAssessment}
                    className="mt-4 px-4 py-2 bg-signal hover:bg-signal/90 text-[11px] font-bold text-white rounded-full flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    Start Assessment <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* By Year Dropdown */}
          <div className="relative" onMouseEnter={() => setActiveMenu('year')} onMouseLeave={() => setActiveMenu(null)}>
            <button className="flex items-center gap-1 text-sm font-semibold text-slate hover:text-ink py-5 transition-all">
              By year <span className="text-[10px]">▼</span>
            </button>
            {activeMenu === 'year' && (
              <div className="absolute top-full left-0 w-[240px] bg-white border border-mist rounded-2xl shadow-xl p-4 space-y-2">
                {[
                  { yr: '1st Year', blurb: 'Explore domains & foundations' },
                  { yr: '2nd Year', blurb: 'Master DSA & core theories' },
                  { yr: '3rd Year', blurb: 'Build portfolios & projects' },
                  { yr: '4th Year', blurb: 'Placements in months, not years' }
                ].map((item, i) => (
                  <button 
                    key={i} 
                    onClick={onStartAssessment}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-mist transition-all cursor-pointer"
                  >
                    <div className="text-xs font-bold text-ink">{item.yr}</div>
                    <div className="text-[10px] text-slate mt-0.5 leading-normal">{item.blurb}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Resources Dropdown */}
          <div className="relative" onMouseEnter={() => setActiveMenu('resources')} onMouseLeave={() => setActiveMenu(null)}>
            <button className="flex items-center gap-1 text-sm font-semibold text-slate hover:text-ink py-5 transition-all">
              Resources <span className="text-[10px]">▼</span>
            </button>
            {activeMenu === 'resources' && (
              <div className="absolute top-full left-0 w-[220px] bg-white border border-mist rounded-2xl shadow-xl p-4 space-y-1">
                {['PYQs & Notes', 'Industry Trends', 'Blog', 'Guides'].map((res, i) => (
                  <button 
                    key={i} 
                    onClick={onStartAssessment}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate hover:text-signal hover:bg-mist rounded-xl transition-all cursor-pointer"
                  >
                    {res}
                  </button>
                ))}
              </div>
            )}
          </div>

          <a href="#about" className="text-sm font-semibold text-slate hover:text-ink transition-all">About</a>
        </nav>

        {/* Right utilities & primary CTA */}
        <div className="hidden md:flex items-center gap-6">
          <Search className="h-4 w-4 text-slate hover:text-ink cursor-pointer transition-colors" />
          <button 
            onClick={onStartAssessment}
            className="text-sm font-semibold text-slate hover:text-ink transition-all cursor-pointer"
          >
            Log in
          </button>
          <button 
            onClick={onStartAssessment}
            className="px-5 py-2.5 bg-signal hover:bg-signal/90 text-sm font-bold text-white rounded-full shadow-sm hover:shadow transition-all cursor-pointer"
          >
            Start free assessment
          </button>
        </div>

        {/* Mobile Menu Icon */}
        <button className="md:hidden p-1 text-ink" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-paper border-b border-mist px-6 py-4 space-y-4">
          <div className="space-y-1">
            <div className="font-bold text-xs text-slate uppercase px-2 mb-1">Product</div>
            {['Skill assessment', 'Career roadmap', 'DSA practice', 'AI chatbot'].map((item) => (
              <button 
                key={item} 
                onClick={() => { setMobileMenuOpen(false); onStartAssessment(); }}
                className="w-full text-left py-2 px-2 text-sm font-medium text-ink hover:bg-mist rounded-lg"
              >
                {item}
              </button>
            ))}
          </div>
          <button 
            onClick={() => { setMobileMenuOpen(false); onStartAssessment(); }}
            className="w-full py-3 bg-signal hover:bg-signal/90 text-sm font-bold text-white rounded-full flex items-center justify-center gap-2"
          >
            Start free assessment
          </button>
        </div>
      )}
    </header>
  )
}

// Sub-component 3: Hero Section with Animated Readiness Ring
function Hero({ onStartAssessment }) {
  const [score, setScore] = useState(0)

  useEffect(() => {
    const target = 78
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
  }, [])

  return (
    <section className="bg-paper py-16 md:py-24 border-b border-mist overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        {/* Left copy column */}
        <div className="space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-signal-tint border border-signal/10 text-xs font-bold text-signal">
            <Sparkles className="h-3.5 w-3.5" />
            Adaptive AI Guidance for Engineers
          </div>
          
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

        {/* Right Readiness Ring visual column */}
        <div className="flex flex-col items-center justify-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[320px] w-[320px] bg-signal/3 rounded-full blur-3xl -z-10"></div>
          
          <div className="bg-white border border-mist p-8 rounded-3xl shadow-lg flex flex-col items-center gap-4 relative">
            <div className="absolute top-4 right-4">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>

            {/* Circular Readiness ring */}
            <div className="relative flex items-center justify-center">
              <svg className="w-48 h-48" viewBox="0 0 100 100">
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
                  stroke="#4F46E5" 
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
                  className="font-mono font-extrabold text-2xl fill-ink"
                >
                  {score}%
                </text>
              </svg>
            </div>

            <div className="text-center">
              <h3 className="text-sm font-extrabold text-ink">Readiness Classification Score</h3>
              <p className="text-xs text-slate mt-1">Intermediate Level (Sample Student Assessment)</p>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}

// Sub-component 4: Content Partner Logo Strip
function LogoStrip() {
  return (
    <section className="bg-mist py-8 border-b border-mist/50">
      <div className="max-w-[1200px] mx-auto px-6 text-center">
        <span className="text-[10px] font-bold text-slate uppercase tracking-widest block mb-4">
          Built with content from standard learning ecosystems
        </span>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-45">
          {['LeetCode', 'GeeksforGeeks', 'Udemy', 'Coursera', 'YouTube'].map((logo) => (
            <span key={logo} className="font-mono text-sm font-bold text-ink tracking-tight select-none">
              [{logo.toUpperCase()}]
            </span>
          ))}
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
    <section className="bg-paper py-16 md:py-24 border-b border-mist">
      <div className="max-w-[1200px] mx-auto px-6 space-y-12">
        <div className="text-center max-w-xl mx-auto space-y-3">
          <span className="text-xs font-bold text-signal uppercase tracking-widest block">Why CareerAgent?</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-ink leading-tight">
            Generic career roadmap advice doesn't know your gaps or your timeline.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((v, i) => (
            <div key={i} className="bg-white border border-mist p-6 rounded-2xl hover:border-signal/20 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="h-8 w-8 rounded-lg bg-signal-tint flex items-center justify-center text-signal font-bold text-sm">
                  {i + 1}
                </div>
                <h3 className="text-sm font-bold text-ink">{v.title}</h3>
                <p className="text-xs text-slate leading-relaxed">{v.desc}</p>
              </div>
            </div>
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
    { num: '04', title: 'Build your resume', desc: 'Export an ATS-optimized, project-highlighted PDF matching placements benchmark criteria.' }
  ]

  return (
    <section id="how-it-works" className="bg-mist py-16 md:py-24 border-b border-mist">
      <div className="max-w-[1200px] mx-auto px-6 space-y-12">
        <div className="text-center max-w-md mx-auto space-y-3">
          <span className="text-xs font-bold text-signal uppercase tracking-widest block">How it works</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-ink">Four steps to your target placement</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((s, idx) => (
            <div key={idx} className="relative space-y-3">
              <div className="font-mono text-4xl font-extrabold text-signal/15 tracking-tight">
                {s.num}
              </div>
              <h3 className="text-sm font-bold text-ink">{s.title}</h3>
              <p className="text-xs text-slate leading-relaxed">{s.desc}</p>
            </div>
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
        <div className="max-w-lg mx-auto text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2 rounded-full bg-emerald-500/10 text-emerald-600 mb-2">
            <ShieldCheck className="h-6 w-6 glow-emerald" />
          </div>
          <h2 className="text-2xl font-extrabold text-ink leading-tight">Built to never discourage you.</h2>
          <p className="text-xs text-slate leading-normal">
            Safety guardrails are natively baked into every agent interaction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {points.map((p, i) => (
            <div key={i} className="border border-mist p-5 rounded-2xl bg-white space-y-2.5">
              <h3 className="text-xs font-bold text-ink flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                {p.title}
              </h3>
              <p className="text-[11px] text-slate leading-relaxed">
                {p.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Sub-component 8: Interactive CSS Feature Showcases
function FeatureShowcase({ onStartAssessment }) {
  return (
    <section className="bg-paper py-16 md:py-24 space-y-24 border-b border-mist">
      <div className="max-w-[1200px] mx-auto px-6 space-y-20">
        
        {/* Showcase Row 1: Career Roadmap (Visual Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <span className="text-xs font-bold text-signal uppercase tracking-widest block">Feature 1</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-ink leading-snug">
              Year-wise custom roadmaps calibrated to your gaps.
            </h2>
            <p className="text-xs text-slate leading-relaxed">
              Based on your onboarding domain selection and diagnostic scores, downstream agents build a custom preparation timeline. Learn DSA trees when you have time, start projects when you have foundations.
            </p>
            <button onClick={onStartAssessment} className="text-xs font-bold text-signal hover:text-signal/80 flex items-center gap-1 cursor-pointer">
              Explore Roadmap Features &rarr;
            </button>
          </div>
          {/* Mock visual panel */}
          <div className="bg-mist p-6 rounded-2xl border border-mist flex flex-col gap-3.5 relative overflow-hidden">
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
        </div>

        {/* Showcase Row 2: DSA Practice Sheet (Visual Left) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="lg:order-2 space-y-5">
            <span className="text-xs font-bold text-signal uppercase tracking-widest block">Feature 2</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-ink leading-snug">
              Topic-wise DSA practice sheets with streak tracking.
            </h2>
            <p className="text-xs text-slate leading-relaxed">
              Track your LeetCode and CodeChef daily progress. Filter problems by Easy, Medium, and Hard, synced with a streak calendar that records daily solve consistency and alerts you to gaps.
            </p>
            <button onClick={onStartAssessment} className="text-xs font-bold text-signal hover:text-signal/80 flex items-center gap-1 cursor-pointer">
              Practice DSA &rarr;
            </button>
          </div>
          {/* Mock visual panel */}
          <div className="bg-mist p-6 rounded-2xl border border-mist space-y-3 lg:order-1">
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
        </div>

        {/* Showcase Row 3: Opportunities Feed (Visual Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-5">
            <span className="text-xs font-bold text-signal uppercase tracking-widest block">Feature 3</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-ink leading-snug">
              Filtered hackathons, CTFs, and open-source contests.
            </h2>
            <p className="text-xs text-slate leading-relaxed">
              We scrape CTFs, hackathons, and contests globally. Downstream search agents filter them specifically matching your skill levels and domains to guarantee realistic engagement.
            </p>
            <button onClick={onStartAssessment} className="text-xs font-bold text-signal hover:text-signal/80 flex items-center gap-1 cursor-pointer">
              Browse Active Feeds &rarr;
            </button>
          </div>
          {/* Mock visual panel */}
          <div className="bg-mist p-6 rounded-2xl border border-mist space-y-4">
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
                  onClick={onStartAssessment}
                  className="px-3.5 py-1.5 bg-signal hover:bg-signal/90 text-[10px] font-bold text-white rounded-lg flex items-center gap-1"
                >
                  Register <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Showcase Row 4: Resume Builder (Visual Left) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="lg:order-2 space-y-5">
            <span className="text-xs font-bold text-signal uppercase tracking-widest block">Feature 4</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-ink leading-snug">
              ATS-Optimized, project-focused resume builder.
            </h2>
            <p className="text-xs text-slate leading-relaxed">
              Compile your completed DSA problems, project links, and CGPA into an ATS-friendly resume layout. Download a validated PDF that matches company onboarding requirements.
            </p>
            <button onClick={onStartAssessment} className="text-xs font-bold text-signal hover:text-signal/80 flex items-center gap-1 cursor-pointer">
              Build Resume &rarr;
            </button>
          </div>
          {/* Mock visual panel */}
          <div className="bg-mist p-6 rounded-2xl border border-mist lg:order-1 space-y-3">
            <span className="text-[10px] font-bold text-slate block">MOCK ATS RESUME LAYOUT PREVIEW</span>
            <div className="p-5 bg-white border border-mist rounded-xl space-y-3 text-[10px] text-ink font-sans shadow-sm">
              <div className="text-center border-b border-mist pb-2">
                <h4 className="font-extrabold text-xs">ARAVIND SHARMA</h4>
                <p className="text-[9px] text-slate mt-0.5">aravind@btech.in | +91 99999 88888 | github.com/aravind</p>
              </div>
              <div className="space-y-1.5">
                <h5 className="font-bold border-b border-mist pb-0.5 text-signal">EDUCATION</h5>
                <p className="flex justify-between font-semibold">
                  <span>BTech Computer Science, Tier-2 Institute</span>
                  <span>CGPA: 8.5/10</span>
                </p>
              </div>
              <div className="space-y-1.5">
                <h5 className="font-bold border-b border-mist pb-0.5 text-signal">TECHNICAL SKILLS</h5>
                <p><span className="font-semibold">Languages / Core:</span> Python, OOP, DSA (Intermediate classification level)</p>
              </div>
            </div>
          </div>
        </div>

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
    <section className="bg-mist py-16 border-b border-mist">
      <div className="max-w-[1200px] mx-auto px-6 space-y-10">
        <div className="text-center max-w-sm mx-auto space-y-2">
          <span className="text-xs font-bold text-signal uppercase tracking-widest block">Resources</span>
          <h2 className="text-2xl font-extrabold text-ink">Learn & Grow Daily</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((c, i) => (
            <div key={i} className="bg-white border border-mist p-6 rounded-2xl flex flex-col justify-between hover:border-signal/20 transition-all">
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
          ))}
        </div>
      </div>
    </section>
  )
}

// Sub-component 10: Final CTA Banner
function FinalCTA({ onStartAssessment }) {
  return (
    <section id="assessment" className="bg-signal text-white py-16 md:py-20 text-center relative overflow-hidden">
      <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-white/5 blur-2xl"></div>
      <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-white/5 blur-2xl"></div>
      
      <div className="max-w-[1200px] mx-auto px-6 space-y-6 relative">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight max-w-xl mx-auto leading-tight">
          Find your path. Free, in 5 minutes.
        </h2>
        <p className="text-sm text-signal-tint max-w-md mx-auto leading-relaxed">
          Create your student profile, take the adaptive diagnostic quiz, and map your year-wise preparation today.
        </p>
        <button
          onClick={onStartAssessment}
          className="px-8 py-3.5 bg-white hover:bg-gray-100 text-sm font-bold text-signal rounded-full shadow-lg transition-all mx-auto inline-flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
        >
          Start free assessment
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  )
}

// Sub-component 11: Multi-column Footer
function Footer({ onStartAssessment }) {
  return (
    <footer className="bg-paper border-t border-mist pt-16 pb-8">
      <div className="max-w-[1200px] mx-auto px-6 space-y-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Product</h4>
            <ul className="space-y-2 text-xs">
              {['Skill assessment', 'Career roadmap', 'DSA practice', 'Course recs', 'Opportunities feed', 'Resume builder', 'AI chatbot'].map(item => (
                <li key={item}>
                  <button onClick={onStartAssessment} className="text-slate hover:text-signal transition-colors cursor-pointer">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">For Students</h4>
            <ul className="space-y-2 text-xs">
              {['1st year roadmap', '2nd year roadmap', '3rd year roadmap', '4th year roadmap'].map(item => (
                <li key={item}>
                  <button onClick={onStartAssessment} className="text-slate hover:text-signal transition-colors cursor-pointer">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2 text-xs">
              {['PYQs & notes', 'Industry trends', 'Blog', 'Guides'].map(item => (
                <li key={item}>
                  <button onClick={onStartAssessment} className="text-slate hover:text-signal transition-colors cursor-pointer">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 font-sans">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-6 w-6 text-signal" />
              <span className="font-extrabold text-sm text-ink">CareerAgent</span>
            </div>
            <p className="text-[11px] text-slate leading-relaxed">
              Personalized career guidelines tailored specifically for BTech CS students in India.
            </p>
            <div className="flex gap-3 text-slate">
              <a href="#github" className="hover:text-signal">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
              </a>
              <a href="#linkedin" className="hover:text-signal">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-mist pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 font-medium">
          <span>&copy; 2026 CareerAgent. Built for India's BTech CS community.</span>
          <div className="flex gap-4">
            <a href="#privacy" className="hover:text-signal">Privacy Policy</a>
            <a href="#terms" className="hover:text-signal">Terms of Service</a>
          </div>
        </div>

      </div>
    </footer>
  )
}

// Main Page wrapper
function Home({ onStartAssessment }) {
  return (
    <div className="bg-paper min-h-screen flex flex-col text-ink antialiased">
      <AnnouncementBar />
      <Navbar onStartAssessment={onStartAssessment} />
      <Hero onStartAssessment={onStartAssessment} />
      <LogoStrip />
      <ValueGrid />
      <HowItWorks onStartAssessment={onStartAssessment} />
      <TrustSection />
      <FeatureShowcase onStartAssessment={onStartAssessment} />
      <ResourceCards />
      <FinalCTA onStartAssessment={onStartAssessment} />
      <Footer onStartAssessment={onStartAssessment} />
    </div>
  )
}

export default Home
