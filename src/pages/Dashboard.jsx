import React from 'react'
import ChatbotWidget from '../components/ChatbotWidget'
import {
  Award, AlertTriangle, Play, CheckCircle2, Flame, Zap, ShieldAlert,
  Sparkles, Code2, Terminal, Brain, Layers,
} from 'lucide-react'

function Dashboard({ profile, analysis, onRestart }) {
  if (!analysis) return null

  const { skill_profile, summary, risk_report } = analysis

  // Palette for the animated glow-border effect used across dashboard cards.
  const GLOW_COLORS = [
    { glow: 'rgba(62,123,250,0.28)', border: 'rgba(62,123,250,0.3)' },   // signal / cobalt
    { glow: 'rgba(124,111,239,0.26)', border: 'rgba(124,111,239,0.3)' }, // ember / violet
    { glow: 'rgba(124,111,239,0.26)', border: 'rgba(124,111,239,0.3)' }, // ember / violet
    { glow: 'rgba(62,123,250,0.26)', border: 'rgba(62,123,250,0.3)' },   // signal / cobalt
  ]
  const glowStyle = (index) => {
    const c = GLOW_COLORS[index % GLOW_COLORS.length]
    return { '--glow-color': c.glow, '--glow-border-color': c.border }
  }

  const studentInitial = (profile?.profile?.name || 'S').trim().charAt(0).toUpperCase()

  // Helpers for styling levels matching light theme tokens
  const getLevelColor = (level) => {
    switch (level) {
      case 'Advanced': return 'text-emerald-600 bg-emerald-100/70 border-emerald-200/60'
      case 'Intermediate': return 'text-signal bg-signal-tint border-signal/10'
      default: return 'text-amber-700 bg-amber-100/70 border-amber-200/60'
    }
  }

  const getRiskColor = (level) => {
    switch (level) {
      case 'Critical': return 'text-red-700 border-red-200/60 bg-red-100/70'
      case 'High': return 'text-orange-700 border-orange-200/60 bg-orange-100/70'
      case 'Medium': return 'text-amber-700 border-amber-200/60 bg-amber-100/70'
      default: return 'text-emerald-700 border-emerald-200/60 bg-emerald-100/70'
    }
  }

  return (
    <div className="min-h-screen bg-mist p-6 md:p-8 space-y-6 max-w-7xl mx-auto font-sans text-ink">
      
      {/* 1. Header Profile Banner */}
      <div className="theme-card bg-gradient-to-br from-signal-tint via-paper to-ember/10 p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Decorative glow blob + floating sticker */}
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gradient-to-br from-signal/20 to-ember/20 blur-2xl pointer-events-none"></div>
        <div className="hidden sm:flex absolute top-4 right-6 h-10 w-10 rounded-2xl bg-gradient-to-br from-ember to-signal items-center justify-center shadow-md shape-float">
          <Sparkles className="h-5 w-5 text-white" />
        </div>

        <div className="flex items-start md:items-center gap-4 relative z-10">
          <div className="hidden sm:flex h-12 w-12 flex-shrink-0 rounded-2xl bg-gradient-to-br from-signal to-ember items-center justify-center text-white font-display font-extrabold text-lg shadow-lg shadow-signal/25">
            {studentInitial}
          </div>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-signal uppercase tracking-widest mb-1.5">
              <span>BTech {profile?.profile?.branch}</span>
              <span>•</span>
              <span>Year {profile?.profile?.year}</span>
              <span>•</span>
              <span>CGPA {profile?.profile?.cgpa}/10</span>
            </div>
            <h1 className="text-2xl font-display font-extrabold text-ink leading-tight">
              Welcome, {profile?.profile?.name || 'Student'}
            </h1>
            <p className="text-xs text-slate mt-1">
              Career Goal: <span className="text-ink font-bold">{profile?.career_goal}</span> at a <span className="text-ink font-bold">{profile?.profile?.college_tier}</span> tier college.
            </p>
          </div>
        </div>
        <button
          onClick={onRestart}
          className="relative z-10 px-5 py-2.5 rounded-full border border-signal text-signal hover:bg-signal-tint text-xs font-bold transition-all cursor-pointer bg-paper/70"
        >
          Retake Assessment
        </button>
      </div>

      {/* 2. Top Grid: Level Overview & Scoring Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Level Overview Panel */}
        <div className="theme-card bg-paper p-6 flex flex-col justify-between glow-border" style={glowStyle(0)}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-signal to-ember flex items-center justify-center flex-shrink-0">
                <Award className="h-3.5 w-3.5 text-white" />
              </span>
              <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Readiness Level</span>
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${getLevelColor(skill_profile.level)}`}>
                {skill_profile.level}
              </span>
              <span className="text-3xl font-mono font-extrabold text-ink">{skill_profile.overall_score}%</span>
            </div>
            <p className="text-xs text-slate mt-4 leading-relaxed">
              {skill_profile.classification_reason || 'Based on your diagnostic assessment and category weightings.'}
            </p>
          </div>

          <div className="border-t border-mist pt-4 mt-6 flex justify-between text-[10px] text-slate font-medium">
            <span>Classifier: {skill_profile.classifier_version || 'v2.1'}</span>
            <span>Confidence: {Math.round((skill_profile.confidence || 0.85) * 100)}%</span>
          </div>
        </div>

        {/* Scores Breakdown Panel */}
        <div className="theme-card bg-paper p-6 lg:col-span-2 space-y-4 glow-border" style={glowStyle(1)}>
          <span className="text-[10px] font-bold text-slate uppercase tracking-wider block">assessment Category Breakdown</span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            {[
              { label: 'Data Structures & Algorithms', score: skill_profile.category_scores?.dsa || 0, icon: Code2, color: 'from-signal to-ember', bar: 'bg-signal' },
              { label: 'Programming Fundamentals', score: skill_profile.category_scores?.programming || 0, icon: Terminal, color: 'from-signal to-ember', bar: 'bg-signal' },
              { label: 'Logical & Analytics', score: skill_profile.category_scores?.logic || 0, icon: Brain, color: 'from-ember to-signal', bar: 'bg-ember' },
              { label: 'Domain Specific', score: skill_profile.category_scores?.domain_specific || 0, icon: Layers, color: 'from-ember to-signal', bar: 'bg-ember' }
            ].map((cat, idx) => (
              <div key={idx} className="space-y-1.5 p-3 rounded-xl bg-mist border border-mist">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate flex items-center gap-1.5">
                    <span className={`h-5 w-5 rounded-md bg-gradient-to-br ${cat.color} flex items-center justify-center flex-shrink-0`}>
                      <cat.icon className="h-3 w-3 text-white" />
                    </span>
                    {cat.label}
                  </span>
                  <span className="text-ink font-mono font-extrabold">{cat.score}%</span>
                </div>
                <div className="w-full bg-paper h-2 rounded-full overflow-hidden border border-gray-200/50">
                  <div 
                    className={`${cat.bar} h-full rounded-full transition-all duration-500 shadow-sm`}
                    style={{ width: `${cat.score}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Middle Grid: Summary Agent & Risk Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Student Summary Agent Card */}
        <div className="theme-card bg-paper p-6 lg:col-span-2 flex flex-col justify-between glow-border" style={glowStyle(2)}>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-signal to-ember flex items-center justify-center flex-shrink-0">
                <Zap className="h-3.5 w-3.5 text-white" />
              </span>
              <span className="text-[10px] font-bold text-signal uppercase tracking-widest">Synthesis Analysis</span>
            </div>
            
            <p className="text-xs text-ink leading-relaxed font-semibold">
              "{summary.summary_text}"
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <span className="text-[10px] font-bold text-slate block mb-2 uppercase tracking-wider">Key Gaps Identified</span>
                <div className="flex flex-wrap gap-1.5">
                  {(summary.skill_profile?.gaps || skill_profile.weak_areas || []).slice(0, 4).map((gap, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold border border-red-200/30">
                      {gap}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate block mb-2 uppercase tracking-wider">Core Focus Areas</span>
                <div className="flex flex-wrap gap-1.5">
                  {(summary.focus_areas || []).map((area, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-signal-tint text-signal text-[10px] font-bold border border-signal/10">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Next Step Box */}
          <div className="mt-6 p-4 rounded-xl border border-signal/15 bg-signal-tint">
            <span className="text-[9px] font-bold text-signal uppercase tracking-widest block mb-1">Recommended Next Step</span>
            <p className="text-xs text-ink font-bold flex items-center gap-2 leading-relaxed">
              <Play className="h-4 w-4 text-signal fill-signal/20 flex-shrink-0" />
              {summary.recommended_next_step}
            </p>
          </div>
        </div>

        {/* Risk Agent Timeline Card */}
        <div className="theme-card bg-paper p-6 flex flex-col justify-between glow-border" style={glowStyle(3)}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-ember to-signal flex items-center justify-center flex-shrink-0">
                  <ShieldAlert className="h-3.5 w-3.5 text-white" />
                </span>
                <span className="text-[10px] font-bold text-slate uppercase tracking-widest">Risk Assessment</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${getRiskColor(risk_report.overall_risk_level)}`}>
                {risk_report.overall_risk_level} Risk
              </span>
            </div>

            {/* Timeline analysis */}
            <div className="p-3.5 rounded-xl border border-mist bg-mist/60 space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] text-slate font-semibold uppercase">
                <Flame className="h-4 w-4 text-ember" />
                <span>Timeline Status</span>
              </div>
              <p className="text-xs text-slate leading-relaxed font-semibold">
                {risk_report.timeline_risk?.reason}
              </p>
              <div className="grid grid-cols-2 gap-2 text-center border-t border-mist pt-2 mt-2 font-mono">
                <div>
                  <span className="text-[9px] text-slate block uppercase font-sans font-medium">Months Needed</span>
                  <span className="text-sm font-extrabold text-ink">{risk_report.timeline_risk?.months_needed}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate block uppercase font-sans font-medium">Months Left</span>
                  <span className="text-sm font-extrabold text-ink">{risk_report.timeline_risk?.months_available}</span>
                </div>
              </div>
            </div>

            {/* Quick Wins List */}
            <div>
              <span className="text-[10px] font-bold text-slate uppercase tracking-wider block mb-2">Quick Wins (1-2 Weeks)</span>
              <ul className="space-y-1.5">
                {(risk_report.quick_wins || []).slice(0, 3).map((win, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate leading-relaxed font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{win}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-mist pt-3 mt-4 text-[10px] text-slate font-medium">
            *Indian Tech Industry Benchmark calibration applied.
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Risk Details Checklist & Red Flags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Detailed Gaps Checklist */}
        <div className="theme-card bg-paper p-6 space-y-4 glow-border" style={glowStyle(0)}>
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-ember to-signal flex items-center justify-center flex-shrink-0">
              <Layers className="h-3.5 w-3.5 text-white" />
            </span>
            <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Gaps & Mitigation Details</span>
          </div>
          <div className="space-y-3">
            {(risk_report.skill_gaps || []).map((gap, i) => (
              <div key={i} className="flex justify-between items-start gap-4 p-3 rounded-xl border border-mist bg-mist/30">
                <div>
                  <h4 className="text-xs font-bold text-ink">{gap.area}</h4>
                  <p className="text-[11px] text-slate mt-1 leading-relaxed">{gap.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                    gap.severity === 'Critical' ? 'bg-red-100 text-red-700 border border-red-200/30' :
                    gap.severity === 'High' ? 'bg-orange-100 text-orange-700 border border-orange-200/30' :
                    'bg-amber-100 text-amber-700 border border-amber-200/30'
                  }`}>
                    {gap.severity}
                  </span>
                  <span className="text-[9px] text-slate font-mono font-medium">Fix: {gap.fix_timeline_weeks} wks</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strategic Risks & Red Flags */}
        <div className="theme-card bg-paper p-6 space-y-5 glow-border" style={glowStyle(1)}>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-3.5 w-3.5 text-white" />
              </span>
              <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Red Flags</span>
            </div>
            <div className="space-y-2">
              {(risk_report.red_flags || []).map((flag, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl border border-red-200/40 bg-red-50 text-xs text-red-700 leading-relaxed font-semibold">
                  <AlertTriangle className="h-4.5 w-4.5 text-red-500 flex-shrink-0" />
                  <span>{flag}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-mist pt-4">
            <span className="text-[10px] font-bold text-slate uppercase tracking-wider block mb-2">Strategic Gaps</span>
            <ul className="space-y-2">
              {(risk_report.strategic_risks || []).slice(0, 2).map((risk, i) => (
                <li key={i} className="text-xs leading-relaxed text-slate font-medium">
                  <span className="text-ink font-bold block">🚨 {risk.risk}</span>
                  <span className="text-slate block mt-0.5">Mitigation: {risk.mitigation}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Floating Chatbot Widget */}
      <ChatbotWidget summary={summary} skillProfile={skill_profile} />
    </div>
  )
}

export default Dashboard
