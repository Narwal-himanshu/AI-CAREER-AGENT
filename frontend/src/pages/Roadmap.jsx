import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { Milestone, ArrowRight, AlertCircle, RotateCcw } from 'lucide-react'
import { YEAR_SLUGS, getYearBySlug, ROADMAP_BASE_PATH } from '../lib/yearNav'

const DOMAIN_MAP = {
  'DSA/CP': 'DSA/CP', 'Web Development': 'Web Dev', 'AI/ML': 'AI/ML',
  'Cloud': 'Cloud', 'CyberSec': 'CyberSec', 'Mobile': 'Mobile',
}

function RoadmapSkeleton() {
  return (
    <div className="min-h-screen bg-mist p-6 md:p-8 font-sans text-ink">
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="theme-card bg-paper p-6 border border-gray-200/60 shadow-sm space-y-3">
          <div className="h-6 w-56 bg-mist rounded" />
          <div className="h-3 w-full bg-mist rounded" />
        </div>
        <div className="theme-card bg-paper p-5 border border-gray-200/60 shadow-sm space-y-2">
          <div className="h-4 w-24 bg-mist rounded" />
          <div className="h-3 w-full bg-mist rounded" />
          <div className="h-3 w-2/3 bg-mist rounded" />
        </div>
      </div>
    </div>
  )
}

function YearPlanCard({ year }) {
  return (
    <div className="theme-card bg-paper p-5 border border-gray-200/60 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold text-signal uppercase tracking-wider">Year {year.year}</span>
        <span className="text-xs font-bold text-slate">— {year.theme}</span>
      </div>

      <div className="mt-3 space-y-3">
        <div>
          <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Focus Areas</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {year.focus_areas.map((f, i) => (
              <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded bg-signal-tint text-signal border border-signal/10">{f}</span>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Monthly Goals</span>
          <ul className="mt-1 space-y-1">
            {year.monthly_goals.map((g, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate">
                <ArrowRight className="h-3 w-3 text-signal mt-0.5 flex-shrink-0" />
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Skills to Learn</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {year.skills_to_learn.map((s, i) => (
                <span key={i} className="text-[10px] font-medium px-2 py-0.5 rounded bg-mist text-slate border border-mist">{s}</span>
              ))}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate uppercase tracking-wider">DSA Target</span>
            <p className="text-xs text-slate mt-1">{year.dsa_target}</p>
          </div>
        </div>

        {year.projects_to_build.length > 0 && (
          <div>
            <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Projects</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {year.projects_to_build.map((p, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-mist border border-mist">
                  <span className="text-xs font-bold text-ink">{p.title}</span>
                  <p className="text-[10px] text-slate mt-0.5">{p.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.tech_stack.map((t, j) => (
                      <span key={j} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-paper text-slate">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {year.resources.length > 0 && (
          <div>
            <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Resources</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {year.resources.map((r, i) => (
                <a key={i} href={r.url} target="_blank" rel="noreferrer"
                  className="text-[10px] font-bold px-2 py-0.5 rounded bg-paper border border-signal/20 text-signal hover:bg-signal-tint transition-colors">
                  {r.name} ({r.type})
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-mist">
        <span className="text-[10px] font-bold text-signal">Milestone: </span>
        <span className="text-xs text-slate">{year.milestone}</span>
        {year.internship_target && (
          <span className="ml-4 text-[10px] font-bold text-amber-600">Internship target: {year.internship_target}</span>
        )}
      </div>
    </div>
  )
}

function Roadmap({ profile, analysis, authToken }) {
  const { yearSlug } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const yearIsInvalid = yearSlug && !YEAR_SLUGS.includes(yearSlug)
  const selectedYear = yearSlug ? getYearBySlug(yearSlug) : null

  const fetchRoadmap = useCallback(async () => {
    if (!profile || yearIsInvalid) return
    setLoading(true)
    setError(null)
    try {
      const payload = {
        name: profile?.profile?.name || 'Student',
        year: selectedYear ? selectedYear.num : (profile?.profile?.year || 2),
        domain: DOMAIN_MAP[profile?.domain_interest?.[0]] || 'DSA/CP',
        career_goal: profile?.career_goal || 'Placement',
        level: analysis?.skill_profile?.level || 'Beginner',
        hours_per_day: Math.max(1, Math.floor(profile?.time_and_style?.hours_per_day || 2)),
        college_tier: profile?.profile?.college_tier || 'Tier-2',
      }
      const headers = { 'Content-Type': 'application/json' }
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`
      const res = await fetch('http://localhost:8000/api/agents/career-roadmap', {
        method: 'POST', headers, body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to generate roadmap')
      setData(await res.json())
    } catch (err) {
      setError(err.message || 'Something went wrong while talking to the server.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, analysis, authToken, yearSlug])

  useEffect(() => {
    fetchRoadmap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, analysis, yearSlug])

  if (yearIsInvalid) return <Navigate to={ROADMAP_BASE_PATH} replace />

  if (loading) return <RoadmapSkeleton />

  if (error) return (
    <div className="min-h-screen bg-mist p-6 md:p-8 font-sans text-ink">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="theme-card bg-paper p-8 border border-red-200 shadow-sm text-center">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-display font-bold text-ink mb-1">Failed to generate roadmap</h2>
          <p className="text-sm text-slate mb-4">{error}</p>
          <p className="text-xs text-slate mb-5">Make sure the backend server is running on port 8000 and the Gemini API key is set.</p>
          <button
            onClick={fetchRoadmap}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-signal text-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      </div>
    </div>
  )

  if (!data) return null

  const focusedYear = data.plan.find((y) => y.year === selectedYear.num)

  if (!focusedYear) return (
    <div className="min-h-screen bg-mist p-6 md:p-8 font-sans text-ink">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="theme-card bg-paper p-10 border border-gray-200/60 shadow-sm text-center">
          <Milestone className="h-8 w-8 text-slate mx-auto mb-3" />
          <h3 className="text-sm font-display font-bold text-ink mb-1">No roadmap yet</h3>
          <p className="text-xs text-slate mb-4">We couldn't generate a roadmap. Try retrying below.</p>
          <button
            onClick={fetchRoadmap}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-signal text-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-mist p-6 md:p-8 font-sans text-ink">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="theme-card bg-paper p-6 border border-gray-200/60 shadow-sm">
          <div className="flex items-center gap-3 mb-1">
            <Milestone className="h-6 w-6 text-signal" />
            <div>
              <h1 className="text-xl font-display font-extrabold text-ink">
                {selectedYear.label} Roadmap
              </h1>
              <p className="text-xs text-slate mt-0.5">for {data.student_name} · {data.domain} · {data.career_goal}</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-slate bg-mist p-3 rounded-xl border border-mist leading-relaxed">{data.quick_start}</p>
        </div>

        <YearPlanCard year={focusedYear} />
      </div>
    </div>
  )
}

export default Roadmap
