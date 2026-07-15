import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  CheckCircle2, Circle, Code2, AlertCircle, Clock, ExternalLink,
  Search, ChevronDown, ChevronRight, RotateCcw, Filter
} from 'lucide-react'

const DIFFICULTY_STYLES = {
  EASY: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
  MEDIUM: 'bg-amber-500/10 text-amber-600 border-amber-200',
  HARD: 'bg-red-500/10 text-red-600 border-red-200',
}

const DIFFICULTY_FILTER_STYLES = {
  EASY: { active: 'bg-emerald-500 text-white', inactive: 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' },
  MEDIUM: { active: 'bg-amber-500 text-white', inactive: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20' },
  HARD: { active: 'bg-red-500 text-white', inactive: 'bg-red-500/10 text-red-600 hover:bg-red-500/20' },
}

function difficultyClass(difficulty) {
  const key = (difficulty || '').toUpperCase()
  return DIFFICULTY_STYLES[key] || 'bg-mist text-slate'
}

const API_BASE = 'http://localhost:8000/api/agents'

function DSASkeleton() {
  return (
    <div className="min-h-screen bg-mist p-6 md:p-8 font-sans text-ink">
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="theme-card bg-paper p-6 border border-gray-200/60 shadow-sm space-y-4">
          <div className="h-6 w-48 bg-mist rounded" />
          <div className="h-3 w-full bg-mist rounded" />
          <div className="h-3 w-2/3 bg-mist rounded" />
        </div>
        <div className="theme-card bg-paper p-4 border border-gray-200/60 shadow-sm">
          <div className="h-10 w-full bg-mist rounded-xl" />
        </div>
        <div className="theme-card bg-paper p-4 border border-gray-200/60 shadow-sm flex gap-2 flex-wrap">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-7 w-20 bg-mist rounded-full" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="theme-card bg-paper border border-gray-200/60 shadow-sm p-5 space-y-2">
            <div className="h-4 w-32 bg-mist rounded" />
            <div className="h-3 w-24 bg-mist rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

function DSA({ profile, analysis, authToken }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [completed, setCompleted] = useState({})
  const [search, setSearch] = useState('')
  const [expandedTopics, setExpandedTopics] = useState({})
  const [availableTopics, setAvailableTopics] = useState([])
  const [selectedTopics, setSelectedTopics] = useState([])
  const [diffFilter, setDiffFilter] = useState({ EASY: true, MEDIUM: true, HARD: true })

  const skillLevel = analysis?.skill_profile?.level || 'Beginner'
  const weakAreas = analysis?.skill_profile?.weak_areas || []

  // Fetch available topics on mount
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await fetch(`${API_BASE}/dsa-topics`)
        if (res.ok) {
          const json = await res.json()
          setAvailableTopics(json.topics || [])
        }
      } catch {
        // Fallback topics if API unavailable
        setAvailableTopics([
          'Arrays', 'Strings', 'Hash Table', 'Linked Lists', 'Stacks', 'Queues',
          'Trees', 'Graphs', 'Heaps (Priority Queue)', 'Sorting', 'Searching',
          'Two Pointers', 'Sliding Window', 'Dynamic Programming', 'Greedy',
          'Recursion / Backtracking', 'Bit Manipulation', 'Tries', 'Union Find',
        ])
      }
    }
    fetchTopics()
  }, [])

  const fetchSheet = useCallback(async (topics) => {
    if (!profile) return
    setLoading(true)
    setError(null)
    try {
      const topicsToSend = topics && topics.length > 0 ? topics : ['all']
      const payload = {
        level: skillLevel,
        domain: profile?.domain_interest?.[0] || 'DSA/CP',
        topic: topicsToSend[0] || 'all',
        topics: topicsToSend,
      }
      const headers = { 'Content-Type': 'application/json' }
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`
      const res = await fetch(`${API_BASE}/dsa-sheet`, {
        method: 'POST', headers, body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error('Failed to generate DSA sheet')
      const json = await res.json()
      setData(json)
      const firstTopic = json?.sheet?.[0]?.topic
      if (firstTopic) setExpandedTopics((prev) => (Object.keys(prev).length ? prev : { [firstTopic]: true }))
    } catch (err) {
      setError(err.message || 'Something went wrong while talking to the server.')
    } finally {
      setLoading(false)
    }
  }, [profile, skillLevel, authToken])

  useEffect(() => {
    fetchSheet([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, analysis])

  const handleTopicToggle = (topic) => {
    setSelectedTopics((prev) => {
      const next = prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
      return next
    })
  }

  const handleSelectAllTopics = () => {
    setSelectedTopics(availableTopics.length === selectedTopics.length ? [] : [...availableTopics])
  }

  const handleApplyTopics = () => {
    fetchSheet(selectedTopics)
  }

  const handleDiffToggle = (diff) => {
    setDiffFilter((prev) => ({ ...prev, [diff]: !prev[diff] }))
  }

  const groupedByTopic = useMemo(() => {
    return (data?.sheet || []).reduce((acc, p) => {
      const topic = p.topic || 'General'
      if (!acc[topic]) acc[topic] = []
      acc[topic].push(p)
      return acc
    }, {})
  }, [data])

  const filteredTopics = useMemo(() => {
    const query = search.trim().toLowerCase()
    const entries = Object.entries(groupedByTopic)
    return entries
      .map(([topic, problems]) => {
        let filtered = problems
        if (query) {
          filtered = filtered.filter(
            (p) =>
              topic.toLowerCase().includes(query) ||
              p.problem_title?.toLowerCase().includes(query)
          )
        }
        // Difficulty filter
        filtered = filtered.filter((p) => diffFilter[(p.difficulty || '').toUpperCase()])
        return [topic, filtered]
      })
      .filter(([, problems]) => problems.length > 0)
  }, [groupedByTopic, search, diffFilter])

  const totalProblems = data?.sheet?.length || 0
  const visibleProblems = filteredTopics.reduce((sum, [, ps]) => sum + ps.length, 0)
  const completedCount = Object.values(completed).filter(Boolean).length

  const toggleTopic = (topic) => {
    setExpandedTopics((prev) => ({ ...prev, [topic]: !prev[topic] }))
  }

  const openProblem = (url) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (loading) return <DSASkeleton />

  if (error) return (
    <div className="min-h-screen bg-mist p-6 md:p-8 font-sans text-ink">
      <div className="max-w-4xl mx-auto theme-card bg-paper p-8 border border-red-200 shadow-sm text-center">
        <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-display font-bold text-ink mb-1">Failed to generate DSA sheet</h2>
        <p className="text-sm text-slate mb-4">{error}</p>
        <p className="text-xs text-slate mb-5">Make sure the backend server is running on port 8000 and the Gemini API key is set.</p>
        <button
          onClick={() => fetchSheet(selectedTopics)}
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="theme-card bg-paper p-6 border border-gray-200/60 shadow-sm">
          <div className="flex items-center gap-3 mb-1">
            <Code2 className="h-6 w-6 text-signal" />
            <div>
              <h1 className="text-xl font-display font-extrabold text-ink">DSA Practice</h1>
              <p className="text-xs text-slate mt-0.5">{data.level} · {data.topic_focus}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-mist">
            <span className="text-[10px] font-bold text-slate">{completedCount}/{totalProblems} done</span>
            <div className="w-32 h-1.5 bg-mist rounded-full overflow-hidden">
              <div className="h-full bg-signal rounded-full transition-all" style={{ width: `${totalProblems ? (completedCount / totalProblems) * 100 : 0}%` }} />
            </div>
          </div>

          {weakAreas.length > 0 && (
            <div className="mt-3 p-3 rounded-xl border border-amber-200 bg-amber-50 flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs font-bold text-amber-700">Focus Areas from Assessment</span>
                <p className="text-[11px] text-amber-600 mt-0.5">Prioritise: {weakAreas.join(', ')}</p>
              </div>
            </div>
          )}

          <div className="mt-3 p-3 rounded-xl border border-signal/10 bg-signal-tint">
            <span className="text-[10px] font-bold text-signal uppercase tracking-wider">Study Plan</span>
            <p className="text-xs text-slate mt-1">{data.study_plan}</p>
            <p className="text-xs font-bold text-signal mt-1">Daily target: {data.daily_target}</p>
          </div>
        </div>

        {/* Topic Selector */}
        <div className="theme-card bg-paper p-4 border border-gray-200/60 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-display font-bold text-ink">Select Topics</span>
            <span className="text-[10px] text-slate">{selectedTopics.length} of {availableTopics.length} selected</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={handleSelectAllTopics}
              className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer border ${
                availableTopics.length > 0 && selectedTopics.length === availableTopics.length
                  ? 'bg-signal text-white border-signal'
                  : 'bg-mist text-slate border-transparent hover:border-slate/20'
              }`}
            >
              All
            </button>
            {availableTopics.map((topic) => {
              const active = selectedTopics.includes(topic)
              return (
                <button
                  key={topic}
                  onClick={() => handleTopicToggle(topic)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer border ${
                    active
                      ? 'bg-signal text-white border-signal'
                      : 'bg-mist text-slate border-transparent hover:border-slate/20'
                  }`}
                >
                  {topic}
                </button>
              )
            })}
          </div>
          <button
            onClick={handleApplyTopics}
            className="mt-3 px-4 py-1.5 rounded-full bg-signal text-white text-[11px] font-bold hover:opacity-90 transition-all cursor-pointer"
          >
            Generate Sheet
          </button>
        </div>

        {/* Search + Difficulty Filter */}
        <div className="theme-card bg-paper p-3 border border-gray-200/60 shadow-sm space-y-2">
          <div className="relative">
            <Search className="h-4 w-4 text-slate absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search topics or problems (e.g. Arrays, Two Sum)..."
              className="theme-input w-full pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-3 w-3 text-slate" />
            {['EASY', 'MEDIUM', 'HARD'].map((diff) => {
              const active = diffFilter[diff]
              const styles = DIFFICULTY_FILTER_STYLES[diff]
              return (
                <button
                  key={diff}
                  onClick={() => handleDiffToggle(diff)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${active ? styles.active : styles.inactive}`}
                >
                  {diff}
                </button>
              )
            })}
            {visibleProblems < totalProblems && (
              <span className="text-[10px] text-slate ml-auto">
                Showing {visibleProblems} of {totalProblems}
              </span>
            )}
          </div>
        </div>

        {/* Empty state: no problems at all */}
        {totalProblems === 0 && (
          <div className="theme-card bg-paper p-10 border border-gray-200/60 shadow-sm text-center">
            <Code2 className="h-8 w-8 text-slate mx-auto mb-3" />
            <h3 className="text-sm font-display font-bold text-ink mb-1">No problems yet</h3>
            <p className="text-xs text-slate">Select topics above and generate a practice sheet.</p>
          </div>
        )}

        {/* Empty state: search matched nothing */}
        {totalProblems > 0 && filteredTopics.length === 0 && (
          <div className="theme-card bg-paper p-10 border border-gray-200/60 shadow-sm text-center">
            <Search className="h-8 w-8 text-slate mx-auto mb-3" />
            <h3 className="text-sm font-display font-bold text-ink mb-1">No matches for "{search}"</h3>
            <p className="text-xs text-slate">Try a different topic, problem name, or difficulty filter.</p>
          </div>
        )}

        {/* Topic accordion list */}
        {filteredTopics.map(([topic, problems]) => {
          const isOpen = !!expandedTopics[topic]
          const topicDone = problems.filter((p) => completed[p.problem_id || p.leetcode_url]).length
          return (
            <div key={topic} className="theme-card bg-paper border border-gray-200/60 shadow-sm overflow-hidden">
              <button
                onClick={() => toggleTopic(topic)}
                className="w-full flex items-center justify-between gap-3 p-5 hover:bg-mist/50 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  {isOpen ? <ChevronDown className="h-4 w-4 text-slate flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-slate flex-shrink-0" />}
                  <div>
                    <h3 className="text-sm font-display font-bold text-ink">{topic}</h3>
                    <span className="text-[10px] text-slate font-medium">{topicDone}/{problems.length} problems solved</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {['EASY', 'MEDIUM', 'HARD'].map((d) => {
                    const count = problems.filter((p) => (p.difficulty || '').toUpperCase() === d).length
                    if (!count) return null
                    return (
                      <span key={d} className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${difficultyClass(d)}`}>
                        {count} {d[0]}
                      </span>
                    )
                  })}
                </div>
              </button>

              {isOpen && (
                <div className="divide-y divide-mist border-t border-mist">
                  {problems.map((p) => {
                    const key = p.problem_id || p.leetcode_url
                    const done = completed[key]
                    return (
                      <div key={key} className="flex items-start gap-3 p-4 hover:bg-mist/50 transition-colors">
                        <button
                          onClick={() => setCompleted((prev) => ({ ...prev, [key]: !prev[key] }))}
                          className="mt-0.5 cursor-pointer flex-shrink-0"
                          aria-label={done ? 'Mark as not done' : 'Mark as done'}
                        >
                          {done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-slate hover:text-signal" />}
                        </button>
                        <button
                          onClick={() => openProblem(p.leetcode_url)}
                          className="flex-1 min-w-0 text-left cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className={`text-xs font-bold ${done ? 'text-slate line-through' : 'text-ink hover:text-signal transition-colors'}`}>{p.problem_title}</span>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${difficultyClass(p.difficulty)}`}>{p.difficulty}</span>
                                <span className="flex items-center gap-1 text-[10px] text-slate">
                                  <Clock className="h-3 w-3" /> {p.time_to_solve_minutes}min
                                </span>
                                {p.tags?.slice(0, 3).map((t, i) => (
                                  <span key={i} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-mist text-slate">#{t}</span>
                                ))}
                              </div>
                            </div>
                            <ExternalLink className="h-3.5 w-3.5 text-signal flex-shrink-0" />
                          </div>
                          <p className="text-[10px] text-slate mt-1.5 leading-relaxed">{p.why_important}</p>
                          <p className="text-[10px] text-slate mt-0.5 italic">Hint: {p.approach_hint}</p>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DSA
