import React from 'react'
import { Navbar, FinalCTA, Footer } from '../components/SharedLanding'

function About({
  onStartAssessment,
  onGoToOpportunities,
  onFeatureNav,
  onYearNav,
  authUser,
  onGoToProfile,
  onSignOut
}) {
  return (
    <div className="bg-paper min-h-screen flex flex-col text-ink antialiased">
      <Navbar
        onStartAssessment={onStartAssessment}
        onGoToOpportunities={onGoToOpportunities}
        onFeatureNav={onFeatureNav}
        onYearNav={onYearNav}
        authUser={authUser}
        onGoToProfile={onGoToProfile}
        onSignOut={onSignOut}
      />

      {/* Hero Section */}
      <section className="pt-24 pb-16 md:pt-32 md:pb-24 px-6 border-b border-mist">
        <div className="max-w-[800px] mx-auto text-center space-y-6">
          <h1 className="font-sans text-4xl md:text-6xl font-extrabold text-ink leading-tight tracking-tight dropdown-panel">
            Stop figuring out what to figure out.
          </h1>
          <p className="text-lg md:text-xl text-slate max-w-2xl mx-auto leading-relaxed dropdown-panel" style={{ animationDelay: '50ms' }}>
            From a blank mind to a clear next step.
          </p>
        </div>
      </section>

      {/* Founder's Story & Mission */}
      <section className="py-20 md:py-32 px-6 bg-white">
        <div className="max-w-[800px] mx-auto space-y-24">

          <div className="space-y-6">
            <span className="text-xs font-bold text-signal uppercase tracking-widest block">The Problem</span>
            <p className="text-lg md:text-xl text-ink leading-relaxed font-medium">
              We've been through that phase ourselves — the one where you're not lacking effort, you're lacking direction.
            </p>
            <p className="text-base text-slate leading-relaxed">
              Every semester felt like starting over: which language, which domain, which project actually matters, what recruiters even want. We burned real time just figuring out what to figure out, instead of doing the work.
            </p>
          </div>

          <div className="space-y-6">
            <span className="text-xs font-bold text-signal uppercase tracking-widest block">Our Mission</span>
            <p className="text-lg md:text-xl text-ink leading-relaxed font-medium border-l-4 border-signal pl-6">
              Most students don't need more content — they need to know what matters right now.
            </p>
            <p className="text-base text-slate leading-relaxed">
              Our mission is to replace the blank-mind moment with one clear next step, every year of college, until you walk into placements knowing you actually did the work that counted.
            </p>
          </div>

          <div className="space-y-6 bg-mist p-8 md:p-12 rounded-3xl border border-mist">
            <span className="text-xs font-bold text-signal uppercase tracking-widest block">Why Year-Wise Roadmaps?</span>
            <h3 className="text-xl font-extrabold text-ink">One clear next step, not everything at once.</h3>
            <p className="text-base text-slate leading-relaxed">
              That's the actual problem we built this to solve. Not another course library, not another list of "100 must-do projects." A year-wise roadmap — so instead of a blank mind, you open the app and know exactly what this year is for.
            </p>
            <ul className="space-y-4 pt-4">
              {[
                { year: '1st Year', text: 'Explore and build foundations.' },
                { year: '2nd Year', text: 'DSA and core theory.' },
                { year: '3rd Year', text: 'Portfolio and real projects.' },
                { year: '4th Year', text: 'Placements.' }
              ].map((item, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <div className="h-6 w-6 rounded-full bg-signal-tint flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="h-2 w-2 bg-signal rounded-full"></div>
                  </div>
                  <div>
                    <span className="font-bold text-ink">{item.year}: </span>
                    <span className="text-slate">{item.text}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </section>

      {/* Verified Stats Section */}
      <section className="py-20 md:py-24 px-6 bg-paper border-t border-mist">
        <div className="max-w-[1000px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center">

            <div className="space-y-3 p-6 theme-card">
              <div className="text-4xl font-display font-extrabold text-signal tracking-tight">4</div>
              <div className="text-sm font-bold text-ink uppercase tracking-wider">Years Covered</div>
              <p className="text-xs text-slate">One clear plan for each stage of college</p>
            </div>

            <div className="space-y-3 p-6 theme-card">
              <div className="text-4xl font-display font-extrabold text-signal tracking-tight">15+</div>
              <div className="text-sm font-bold text-ink uppercase tracking-wider">DSA Topics Mapped</div>
              <p className="text-xs text-slate">Curated arrays to dynamic programming</p>
            </div>

            <div className="space-y-3 p-6 theme-card">
              <div className="text-4xl font-display font-extrabold text-signal tracking-tight">6</div>
              <div className="text-sm font-bold text-ink uppercase tracking-wider">Tech Domains</div>
              <p className="text-xs text-slate">Web Dev, AI/ML, Cloud, CyberSec, and more</p>
            </div>

          </div>
        </div>
      </section>

      <FinalCTA onStartAssessment={onStartAssessment} />
      <Footer onStartAssessment={onStartAssessment} />
    </div>
  )
}

export default About
