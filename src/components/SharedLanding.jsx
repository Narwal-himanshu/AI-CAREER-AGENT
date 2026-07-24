import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Menu, X, ArrowRight, GraduationCap
} from 'lucide-react'
import UserMenu from './UserMenu'

export function AnnouncementBar() {
  return (
    <div className="bg-gradient-to-r from-signal to-purple-600 text-white text-center py-2.5 px-4 text-sm font-semibold flex items-center justify-center gap-2 relative">
      <span>🚀 Your custom placement roadmap.</span>
      <a href="#assessment" className="underline hover:text-signal-tint transition-all">Start yours now &rarr;</a>
    </div>
  )
}

export function Navbar({ onStartAssessment, onGoToOpportunities, onFeatureNav, onYearNav, authUser, onGoToProfile, onSignOut }) {
  const [activeMenu, setActiveMenu] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleMenuToggle = (menu) => {
    setActiveMenu(activeMenu === menu ? null : menu)
  }

  const featureHandlers = {
    'Skill assessment': onStartAssessment,
    'Career roadmap': () => onFeatureNav('roadmap'),
    'DSA practice': () => onFeatureNav('dsa'),
    'Course recommendations': () => onFeatureNav('courses'),
    'Opportunities feed': onGoToOpportunities,
    'Resume builder': () => onFeatureNav('resume'),
    'AI chatbot': () => onFeatureNav('chatbot')
  }

  return (
    <header className="sticky top-0 z-40 w-full md:mx-4 md:mt-3 md:w-[calc(100%-2rem)] md:rounded-full bg-[#0b0e1f]/90 bg-opacity-95 backdrop-blur-md border-b md:border border-white/10 shadow-lg shadow-black/20">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">

        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <GraduationCap className="h-7 w-7 text-signal-tint" />
          <span className="font-sans font-extrabold text-xl text-white tracking-tight">
            CareerAgent
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <div className="relative" onMouseEnter={() => setActiveMenu('product')} onMouseLeave={() => setActiveMenu(null)}>
            <button className="flex items-center gap-1 text-base font-semibold text-white/60 hover:text-white py-5 transition-all">
              Product <span className="text-xs">▼</span>
            </button>

            {activeMenu === 'product' && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-[600px] bg-[#0b0e1f] border border-white/10 rounded-2xl shadow-2xl p-6 grid grid-cols-5 gap-6 dropdown-panel z-50">
                <div className="col-span-3 space-y-4">
                  <h4 className="text-sm font-bold text-white/50 uppercase tracking-wider">Features</h4>
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
                        onClick={featureHandlers[item.name]}
                        className="text-left group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-all"
                      >
                        <div className="text-sm font-bold text-white group-hover:text-signal-tint transition-colors">{item.name}</div>
                        <div className="text-xs text-white/40 mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-span-2 bg-white/5 rounded-xl p-5 flex flex-col justify-between border border-signal/20">
                  <div>
                    <span className="text-xs font-bold text-signal-tint uppercase tracking-wider block mb-1">Quick Start</span>
                    <h5 className="text-base font-extrabold text-white leading-tight">See your roadmap in under 5 minutes</h5>
                    <p className="text-xs text-white/50 mt-2 leading-relaxed">
                      Take our adaptive diagnostic quiz and map your placement schedule instantly.
                    </p>
                  </div>
                  <button
                    onClick={onStartAssessment}
                    className="mt-4 px-4 py-2 bg-gradient-to-r from-signal to-purple-600 hover:opacity-90 text-xs font-bold text-white rounded-full flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    Start Assessment <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative" onMouseEnter={() => setActiveMenu('resources')} onMouseLeave={() => setActiveMenu(null)}>
            <button className="flex items-center gap-1 text-base font-semibold text-white/60 hover:text-white py-5 transition-all">
              Resources <span className="text-xs">▼</span>
            </button>
            {activeMenu === 'resources' && (
              <div className="absolute top-full left-0 w-[220px] bg-[#0b0e1f] border border-white/10 rounded-2xl shadow-2xl p-4 space-y-1 dropdown-panel z-50">
                {['PYQs & Notes', 'Industry Trends', 'Blog', 'Guides'].map((res, i) => (
                  <button
                    key={i}
                    onClick={onStartAssessment}
                    className="w-full text-left px-3 py-2 text-sm font-semibold text-white/60 hover:text-signal-tint hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                  >
                    {res}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => navigate('/about')} className="text-base font-semibold text-white/60 hover:text-white transition-all cursor-pointer">About</button>
        </nav>

        <div className="hidden md:flex items-center gap-6">
          <Search className="h-4.5 w-4.5 text-white/50 hover:text-white cursor-pointer transition-colors" />
          {authUser ? (
            <UserMenu
              email={authUser.email}
              displayName={authUser.displayName}
              onGoToProfile={onGoToProfile}
              onSignOut={onSignOut}
            />
          ) : (
            <>
              <button
                onClick={onStartAssessment}
                className="text-base font-semibold text-white/60 hover:text-white transition-all cursor-pointer"
              >
                Log in
              </button>
              <button
                onClick={onStartAssessment}
                className="px-5 py-2.5 bg-gradient-to-r from-signal to-purple-600 hover:opacity-90 text-sm font-bold text-white rounded-full shadow-lg shadow-signal/25 transition-all cursor-pointer"
              >
                Start free assessment
              </button>
            </>
          )}
        </div>

        <button className="md:hidden p-1 text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0b0e1f] border-b border-white/10 px-6 py-4 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto z-50 absolute w-full left-0">
          <div className="space-y-1">
            <div className="font-bold text-sm text-white/40 uppercase px-2 mb-1">Product</div>
            {['Skill assessment', 'Career roadmap', 'DSA practice', 'Opportunities feed', 'AI chatbot'].map((item) => (
              <button
                key={item}
                onClick={() => { setMobileMenuOpen(false); featureHandlers[item](); }}
                className="w-full text-left py-2 px-2 text-base font-medium text-white hover:bg-white/5 rounded-lg"
              >
                {item}
              </button>
            ))}
          </div>

          <button
            onClick={() => { setMobileMenuOpen(false); onStartAssessment(); }}
            className="w-full py-3 bg-gradient-to-r from-signal to-purple-600 hover:opacity-90 text-sm font-bold text-white rounded-full flex items-center justify-center gap-2"
          >
            Start free assessment
          </button>
        </div>
      )}
    </header>
  )
}

import { Reveal } from "./Reveal"

export function FinalCTA({ onStartAssessment }) {
  return (
    <section id="assessment" className="bg-gradient-to-br from-signal to-purple-600 text-white py-16 md:py-20 text-center relative overflow-hidden">
      <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-white/5 blur-2xl"></div>
      <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-white/5 blur-2xl"></div>

      <Reveal delay={0}>
      <div className="max-w-[1200px] mx-auto px-6 space-y-6 relative">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight max-w-xl mx-auto leading-tight">
          Find your path. Free, in 5 minutes.
        </h2>
        <p className="text-base text-signal-tint max-w-md mx-auto leading-relaxed">
          Create your student profile, take the adaptive diagnostic quiz, and map your year-wise preparation today.
        </p>
        <button
          onClick={onStartAssessment}
          className="px-8 py-3.5 bg-white hover:bg-gray-100 text-base font-bold text-signal rounded-full shadow-lg transition-all mx-auto inline-flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
        >
          Start free assessment
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
      </Reveal>
    </section>
  )
}

export function Footer({ onStartAssessment }) {
  const navigate = useNavigate()
  return (
    <footer className="bg-[#03040f] border-t border-white/10 pt-16 pb-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-dot-pattern text-white/[0.03] pointer-events-none"></div>
      <div className="max-w-[1200px] mx-auto px-6 space-y-12 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Product</h4>
            <ul className="space-y-2 text-sm">
              {['Skill assessment', 'Career roadmap', 'DSA practice', 'Course recs', 'Opportunities feed', 'Resume builder', 'AI chatbot'].map(item => (
                <li key={item}>
                  <button onClick={onStartAssessment} className="text-white/50 hover:text-signal-tint transition-colors cursor-pointer">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">For Students</h4>
            <ul className="space-y-2 text-sm">
              {['1st year roadmap', '2nd year roadmap', '3rd year roadmap', '4th year roadmap'].map(item => (
                <li key={item}>
                  <button onClick={onStartAssessment} className="text-white/50 hover:text-signal-tint transition-colors cursor-pointer">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Resources</h4>
            <ul className="space-y-2 text-sm">
              {['PYQs & notes', 'Industry trends', 'Blog', 'Guides'].map(item => (
                <li key={item}>
                  <button onClick={onStartAssessment} className="text-white/50 hover:text-signal-tint transition-colors cursor-pointer">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 font-sans">
            <div className="flex items-center gap-2 mb-2 cursor-pointer" onClick={() => navigate('/')}>
              <GraduationCap className="h-6 w-6 text-signal-tint" />
              <span className="font-extrabold text-base text-white">CareerAgent</span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed">
              Personalized career guidelines tailored specifically for BTech CS students in India.
            </p>
            <div className="flex gap-3 text-white/50">
              <a href="#github" className="hover:text-signal-tint">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
              </a>
              <a href="#linkedin" className="hover:text-signal-tint">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          </div>

        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/40 font-medium">
          <span>&copy; 2026 CareerAgent. Built for India's BTech CS community.</span>
          <div className="flex gap-4">
            <a href="#privacy" className="hover:text-signal-tint">Privacy Policy</a>
            <a href="#terms" className="hover:text-signal-tint">Terms of Service</a>
          </div>
        </div>

      </div>
    </footer>
  )
}
