import React, { useState, useEffect, useCallback } from 'react'
import {
  BookOpen, ExternalLink, Clock, Star, GraduationCap, Filter, Monitor, Video,
  FileText, AlertCircle, RotateCcw, Play, List, Users, Award, Eye, ThumbsUp,
} from 'lucide-react'

const FORMAT_ICONS = { YouTube: Video, MOOC: Monitor, Website: FileText, Book: FileText }

function formatViews(n) {
  if (!n) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

function formatDuration(mins) {
  if (!mins) return ''
  if (mins >= 60) {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }
  return `${mins}m`
}

function CoursesSkeleton() {
  return (
    <div className="min-h-screen bg-mist p-6 md:p-8 font-sans text-ink">
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="theme-card bg-paper p-6 border border-gray-200/60 shadow-sm space-y-3">
          <div className="h-6 w-56 bg-mist rounded" />
          <div className="h-3 w-full bg-mist rounded" />
        </div>
        {[1, 2, 3].map((s) => (
          <div key={s} className="space-y-3">
            <div className="h-4 w-40 bg-mist rounded" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="theme-card bg-paper p-5 border border-gray-200/60 shadow-sm space-y-2">
                  <div className="h-24 bg-mist rounded" />
                  <div className="h-3 w-3/4 bg-mist rounded" />
                  <div className="h-3 w-1/2 bg-mist rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function YouTubeCard({ item, rankBadge }) {
  return (
    <div className="theme-card bg-paper border border-gray-200/60 shadow-sm hover:border-signal/25 transition-all overflow-hidden">
      {item.thumbnail && (
        <div className="relative">
          <img src={item.thumbnail} alt="" className="w-full h-36 object-cover" loading="lazy" />
          {item.duration_minutes > 0 && (
            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              {formatDuration(item.duration_minutes)}
            </span>
          )}
          {item.type === 'playlist' && (
            <span className="absolute bottom-2 left-2 bg-signal/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
              <List className="h-2.5 w-2.5" /> Playlist
            </span>
          )}
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-display font-bold text-ink leading-snug line-clamp-2 flex-1">{item.title}</h3>
          {rankBadge && (
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-signal-tint border border-signal/10 flex items-center justify-center">
              <span className="text-[10px] font-bold text-signal">#{item.rank}</span>
            </span>
          )}
        </div>
        <p className="text-[10px] font-medium text-slate">{item.channel}</p>
        <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate">
          {item.view_count > 0 && (
            <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {formatViews(item.view_count)}</span>
          )}
          {item.like_count > 0 && (
            <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {formatViews(item.like_count)}</span>
          )}
          {item.duration_minutes > 0 && (
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDuration(item.duration_minutes)}</span>
          )}
          {item.item_count && (
            <span className="flex items-center gap-1"><Play className="h-3 w-3" /> {item.item_count} videos</span>
          )}
          {item.score > 0.7 && (
            <span className="font-bold text-emerald-600">Top Pick</span>
          )}
        </div>
        {item.why_recommended && (
          <p className="text-[10px] text-slate leading-relaxed">{item.why_recommended}</p>
        )}
      </div>
      <a href={item.url} target="_blank" rel="noreferrer"
        className="mx-4 mb-4 w-[calc(100%-2rem)] py-2 rounded-full border border-signal text-signal hover:bg-signal-tint text-center text-[10px] font-bold transition-all flex items-center justify-center gap-1.5">
        {item.type === 'playlist' ? 'Open Playlist' : 'Watch Now'} <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  )
}

function CuratedCard({ c }) {
  const FormatIcon = FORMAT_ICONS[c.type] || Video
  return (
    <div className="theme-card bg-paper p-5 border border-gray-200/60 shadow-sm hover:border-signal/25 transition-all relative">
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
          {c.is_free
            ? <span className="font-bold text-emerald-600">Free</span>
            : <span className="font-bold text-amber-600">Paid</span>
          }
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
}

function YtSection({ title, icon: Icon, items, emptyText }) {
  if (!items || items.length === 0) return null
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-signal" />
        <h2 className="text-sm font-display font-extrabold text-ink">{title}</h2>
        <span className="text-[10px] font-bold text-slate bg-mist px-2 py-0.5 rounded-full">{items.length}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, i) => (
          <YouTubeCard key={i} item={item} rankBadge />
        ))}
      </div>
    </div>
  )
}

function Courses({ profile, analysis, authToken }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [typeFilter, setTypeFilter] = useState('All')

  const [activeTab, setActiveTab] = useState('youtube')

  const fetchCourses = useCallback(async () => {
    if (!profile) return
    setLoading(true)
    setError(null)
    try {
      const payload = {
        domain: profile?.domain_interest?.[0] || 'DSA/CP',
        level: analysis?.skill_profile?.level || 'Beginner',
        career_goal: profile?.career_goal || 'Placement',
        hours_per_day: Math.max(1, Math.floor(profile?.time_and_style?.hours_per_day || 2)),
      }
      const headers = { 'Content-Type': 'application/json' }
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`
      const res = await fetch('http://localhost:8000/api/agents/courses', {
        method: 'POST', headers, body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to fetch course recommendations')
      const json = await res.json()
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
  }, [profile, analysis])

  const hasYouTube = data && (
    (data.top_courses?.length > 0) ||
    (data.top_playlists?.length > 0) ||
    (data.best_tutorials?.length > 0) ||
    (data.best_interview_resources?.length > 0)
  )

  const filtered = data?.recommendations?.filter((r) => {
    if (typeFilter === 'Free') return r.is_free
    if (typeFilter === 'Paid') return !r.is_free
    if (typeFilter !== 'All' && r.type !== typeFilter) return false
    return true
  }) || []

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
        {/* Header */}
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
        </div>

        {/* Tab Switcher */}
        {hasYouTube && (
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('youtube')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'youtube'
                  ? 'bg-signal text-white shadow-md shadow-signal/20'
                  : 'bg-paper text-slate border border-mist hover:border-signal/30'
              }`}
            >
              <Video className="h-3.5 w-3.5" /> YouTube Picks
            </button>
            <button
              onClick={() => setActiveTab('curated')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'curated'
                  ? 'bg-signal text-white shadow-md shadow-signal/20'
                  : 'bg-paper text-slate border border-mist hover:border-signal/30'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" /> Curated Courses
            </button>
          </div>
        )}

        {/* YouTube Sections */}
        {activeTab === 'youtube' && hasYouTube && (
          <div className="space-y-8">
            <YtSection title="Top Courses" icon={Award} items={data.top_courses} />
            <YtSection title="Top Playlists" icon={List} items={data.top_playlists} />
            <YtSection title="Best Tutorials" icon={Play} items={data.best_tutorials} />
            <YtSection title="Interview & Placement Resources" icon={Users} items={data.best_interview_resources} />
          </div>
        )}

        {activeTab === 'youtube' && !hasYouTube && (
          <div className="text-center py-12 text-slate text-sm font-semibold">
            No YouTube recommendations available. Showing curated courses instead.
          </div>
        )}

        {/* Curated Courses Tab */}
        {activeTab === 'curated' && (
          <>
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-slate" />
              <span className="text-[10px] font-bold text-slate uppercase tracking-wider mr-1">Type</span>
              {['All', 'MOOC', 'Website', 'Book', 'Free', 'Paid'].map((f) => (
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((c, i) => (
                <CuratedCard key={i} c={c} />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-slate text-sm font-semibold">No courses found for the selected filter.</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Courses
