import React, { useState, useEffect, useCallback } from 'react'
import { BookOpen, ExternalLink, Clock, Star, GraduationCap, Filter, Monitor, Video, FileText, AlertCircle, RotateCcw } from 'lucide-react'

const FORMAT_ICONS = { YouTube: Video, MOOC: Monitor, Website: FileText, Book: FileText }

function CoursesSkeleton() {
  return (
    <div className="min-h-screen bg-mist p-6 md:p-8 font-sans text-ink">
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="theme-card bg-paper p-6 border border-gray-200/60 shadow-sm space-y-3">
          <div className="h-6 w-56 bg-mist rounded" />
          <div className="h-3 w-full bg-mist rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="theme-card bg-paper p-5 border border-gray-200/60 shadow-sm space-y-2">
              <div className="h-4 w-3/4 bg-mist rounded" />
              <div className="h-3 w-1/2 bg-mist rounded" />
              <div className="h-3 w-full bg-mist rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Courses({ profile, analysis, authToken }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [typeFilter, setTypeFilter] = useState('All')

  const fetchCourses = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    setError(null)
    try {
      const payload = {
        domain: profile?.domain_interest?.[0] || 'DSA/CP',
        level: analysis?.skill_profile?.level || 'Beginner',
        career_goal: profile?.career_goal || 'Placement',
        hours_per_day: profile?.time_and_style?.hours_per_day || 2,
      }
      const headers = { 'Content-Type': 'application/json' }
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`
      const res = await fetch('http://localhost:8000/api/agents/courses', {
        method: 'POST', headers, body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to fetch course recommendations')
      const json = await res.json()
      // Defensive check: never let a malformed payload crash the page.
      if (!json || !Array.isArray(json.recommendations)) {
        throw new Error('Received an unexpected response shape from the server.')
      }
      setData(json)
    } catch (err) {
      setError(err.message || 'Something went wrong while talking to the server.')
    } finally {
      setLoading(false)
    }
  }, [profile, analysis, authToken])

  useEffect(() => {
    fetchCourses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, analysis])

  const filtered = data?.recommendations?.filter((r) => typeFilter === 'All' || r.type === typeFilter) || []

  if (loading) return <CoursesSkeleton />

  if (error) return (
    <div className="min-h-screen bg-mist p-6 md:p-8 font-sans text-ink">
      <div className="max-w-5xl mx-auto theme-card bg-paper p-8 border border-red-200 shadow-sm text-center">
        <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-display font-bold text-ink mb-1">Failed to load courses</h2>
        <p className="text-sm text-slate mb-4">{error}</p>
        <p className="text-xs text-slate mb-5">Make sure the backend server is running on port 8000 and the Gemini API key is set.</p>
        <button
          onClick={fetchCourses}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-signal text-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    </div>
  )

  if (!data) return null

  return (
    <div className="min-h-screen bg-mist p-6 md:p-8 font-sans text-ink">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="theme-card bg-paper p-6 border border-gray-200/60 shadow-sm">
          <div className="flex items-center gap-3 mb-1">
            <BookOpen className="h-6 w-6 text-signal" />
            <div>
              <h1 className="text-xl font-display font-extrabold text-ink">Course Recommendations</h1>
              <p className="text-xs text-slate mt-0.5">Curated for {data.domain} · {data.level}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-mist space-y-2">
            <p className="text-xs text-slate bg-mist p-3 rounded-xl border border-mist leading-relaxed">{data.learning_path}</p>
            <div className="flex items-center gap-2 text-xs font-bold text-signal">
              <GraduationCap className="h-3.5 w-3.5" />
              Total: {data.total_hours} hours
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-mist">
            <Filter className="h-3.5 w-3.5 text-slate" />
            <span className="text-[10px] font-bold text-slate uppercase tracking-wider mr-1">Type</span>
            {['All', 'YouTube', 'MOOC', 'Website', 'Book'].map((f) => (
              <button
                key={f}
                onClick={() => setTypeFilter(f)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  typeFilter === f
                    ? 'bg-signal text-white border-signal'
                    : 'bg-paper text-slate border-mist hover:border-signal/30'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((c, i) => {
            const FormatIcon = FORMAT_ICONS[c.type] || Video
            return (
              <div key={i} className="theme-card bg-paper p-5 border border-gray-200/60 shadow-sm hover:border-signal/25 transition-all relative">
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-signal-tint border border-signal/10 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-signal">#{c.rank}</span>
                </div>
                <div className="space-y-2 pr-6">
                  <h3 className="text-sm font-display font-bold text-ink leading-snug">{c.title}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-mist text-slate border border-mist">{c.platform}</span>
                    <span className="flex items-center gap-1 text-[10px] font-medium text-amber-600">
                      <Star className="h-3 w-3 fill-current" /> {c.best_for}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {c.duration_hours}h</span>
                    <span className="flex items-center gap-1"><FormatIcon className="h-3 w-3" /> {c.type}</span>
                    {c.is_free && <span className="font-bold text-emerald-600">Free</span>}
                    <span className="text-slate">{c.weekly_hours_needed}h/week · {c.completion_weeks} weeks</span>
                  </div>
                  <p className="text-[10px] text-slate leading-relaxed">{c.why_recommended}</p>
                </div>
                <a href={c.url} target="_blank" rel="noreferrer"
                  className="mt-4 w-full py-2 rounded-full border border-signal text-signal hover:bg-signal-tint text-center text-[10px] font-bold transition-all flex items-center justify-center gap-1.5">
                  Go to Course <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate text-sm font-semibold">No courses found for the selected filter.</div>
        )}
      </div>
    </div>
  )
}

export default Courses
