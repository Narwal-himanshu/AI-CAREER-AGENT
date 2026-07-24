import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  CheckCircle2, Circle, Code2, Building2, ArrowLeft, ExternalLink,
  Search, ChevronLeft, ChevronRight, Filter, Star, StarOff, BookOpen,
  Terminal, Cpu, GitBranch, Braces, Database, Layers, Zap, Target, TrendingUp
} from 'lucide-react'

const API_BASE = 'http://localhost:8000/api/agents/dsa'

const DIFFICULTY_STYLES = {
  EASY: 'bg-emerald-500/10 text-emerald-600 border border-emerald-200',
  MEDIUM: 'bg-amber-500/10 text-amber-600 border border-amber-200',
  HARD: 'bg-red-500/10 text-red-600 border border-red-200',
}

const DIFFICULTY_FILTER_STYLES = {
  EASY: { active: 'bg-emerald-500 text-white', inactive: 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' },
  MEDIUM: { active: 'bg-amber-500 text-white', inactive: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20' },
  HARD: { active: 'bg-red-500 text-white', inactive: 'bg-red-500/10 text-red-600 hover:bg-red-500/20' },
}

function diffClass(d) {
  return DIFFICULTY_STYLES[(d || '').toUpperCase()] || 'bg-mist text-slate'
}

function getCompleted() {
  try { return JSON.parse(localStorage.getItem('dsa_completed') || '{}') } catch { return {} }
}
function saveCompleted(c) { localStorage.setItem('dsa_completed', JSON.stringify(c)) }
function getBookmarked() {
  try { return JSON.parse(localStorage.getItem('dsa_bookmarked') || '{}') } catch { return {} }
}
function saveBookmarked(b) { localStorage.setItem('dsa_bookmarked', JSON.stringify(b)) }

function ProblemRow({ p, done, bookmarked, onToggleDone, onToggleBookmark, showCompany }) {
  return (
    <div className="flex items-start gap-3 p-4 hover:bg-mist/50 transition-colors">
      <button onClick={onToggleDone} className="mt-0.5 cursor-pointer flex-shrink-0" aria-label={done ? 'Mark undone' : 'Mark done'}>
        {done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-slate hover:text-signal" />}
      </button>
      <a href={p.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0 text-left group">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className={`text-xs font-bold ${done ? 'text-slate line-through' : 'text-ink group-hover:text-signal transition-colors'}`}>
              {p.title}
            </span>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${diffClass(p.difficulty)}`}>
                {p.difficulty}
              </span>
              {showCompany && p.frequency != null && (
                <span className="text-[10px] text-slate font-medium">
                  freq: {p.frequency}
                </span>
              )}
              {showCompany && p.acceptance_rate != null && (
                <span className="text-[10px] text-slate font-medium">
                  acc: {p.acceptance_rate}%
                </span>
              )}
              {p.tags?.slice(0, 3).map((t, i) => (
                <span key={i} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-mist text-slate">#{t}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={(e) => { e.preventDefault(); onToggleBookmark() }} className="cursor-pointer" aria-label={bookmarked ? 'Unbookmark' : 'Bookmark'}>
              {bookmarked
                ? <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                : <StarOff className="h-3.5 w-3.5 text-slate hover:text-amber-500" />}
            </button>
            <ExternalLink className="h-3.5 w-3.5 text-slate group-hover:text-signal" />
          </div>
        </div>
      </a>
    </div>
  )
}

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null
  const pages = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="p-1.5 rounded-lg bg-mist text-slate hover:bg-signal hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {start > 1 && <span className="text-[10px] text-slate px-1">...</span>}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-8 h-8 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
            p === page ? 'bg-signal text-white' : 'bg-mist text-slate hover:bg-signal/10'
          }`}
        >
          {p}
        </button>
      ))}
      {end < totalPages && <span className="text-[10px] text-slate px-1">...</span>}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="p-1.5 rounded-lg bg-mist text-slate hover:bg-signal hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="min-h-screen bg-mist p-6 md:p-8 font-sans text-ink">
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="theme-card bg-paper border border-gray-200/60 shadow-sm p-6 space-y-3">
            <div className="h-5 w-40 bg-mist rounded" />
            <div className="h-3 w-full bg-mist rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DSA() {
  // --- State ---
  const [view, setView] = useState('dashboard') // dashboard | topics | companies | problems
  const [topics, setTopics] = useState([])
  const [companies, setCompanies] = useState([])
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [problems, setProblems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [diffFilter, setDiffFilter] = useState({ EASY: true, MEDIUM: true, HARD: true })
  const [statusFilter, setStatusFilter] = useState({ done: false, bookmarked: false })
  const [completed, setCompleted] = useState({})
  const [bookmarked, setBookmarked] = useState({})
  const [companySearch, setCompanySearch] = useState('')
  const LIMIT = 20

  // Load progress from localStorage on mount
  useEffect(() => {
    setCompleted(getCompleted())
    setBookmarked(getBookmarked())
  }, [])

  // --- Fetch lists ---
  useEffect(() => {
    const fetchLists = async () => {
      setLoading(true)
      try {
        const [tRes, cRes] = await Promise.all([
          fetch(`${API_BASE}/topics`),
          fetch(`${API_BASE}/companies`),
        ])
        if (tRes.ok) {
          const t = await tRes.json()
          setTopics(t.topics || [])
        }
        if (cRes.ok) {
          const c = await cRes.json()
          setCompanies(c.companies || [])
        }
      } catch (e) {
        console.error('Failed to load DSA data', e)
      } finally {
        setLoading(false)
      }
    }
    fetchLists()
  }, [])

  // --- Fetch problems (paginated) ---
  const fetchProblems = useCallback(async (topic, company, pageNum) => {
    setLoading(true)
    try {
      let url
      if (topic) {
        url = `${API_BASE}/topic/${encodeURIComponent(topic)}?page=${pageNum}&limit=${LIMIT}`
      } else if (company) {
        url = `${API_BASE}/company/${encodeURIComponent(company)}?page=${pageNum}&limit=${LIMIT}`
      } else return
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setProblems(data.problems || [])
        setTotal(data.total || 0)
        setTotalPages(data.total_pages || 1)
      }
    } catch (e) {
      console.error('Failed to load problems', e)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch ALL problems (for filtering)
  const fetchAllProblems = useCallback(async (topic, company) => {
    setLoading(true)
    try {
      let url
      if (topic) url = `${API_BASE}/topic/${encodeURIComponent(topic)}/all`
      else if (company) url = `${API_BASE}/company/${encodeURIComponent(company)}/all`
      else return
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setProblems(data.problems || [])
        setTotal(data.total || 0)
        setTotalPages(1)
      }
    } catch (e) {
      console.error('Failed to load all problems', e)
    } finally {
      setLoading(false)
    }
  }, [])

  // --- Navigation ---
  const goToTopicList = () => { setView('topics'); setSelectedTopic(null); setSelectedCompany(null); setSearch(''); setDiffFilter({ EASY: true, MEDIUM: true, HARD: true }); setStatusFilter({ done: false, bookmarked: false }); setPage(1) }
  const goToCompanyList = () => { setView('companies'); setSelectedTopic(null); setSelectedCompany(null); setSearch(''); setDiffFilter({ EASY: true, MEDIUM: true, HARD: true }); setStatusFilter({ done: false, bookmarked: false }); setPage(1); setCompanySearch('') }
  const goToDashboard = () => { setView('dashboard'); setSelectedTopic(null); setSelectedCompany(null); setSearch(''); setPage(1) }

  const selectTopic = (name) => {
    setSelectedTopic(name)
    setSelectedCompany(null)
    setPage(1)
    setSearch('')
    setDiffFilter({ EASY: true, MEDIUM: true, HARD: true })
    setStatusFilter({ done: false, bookmarked: false })
    setView('problems')
    fetchProblems(name, null, 1)
  }

  const selectCompany = (name) => {
    setSelectedCompany(name)
    setSelectedTopic(null)
    setPage(1)
    setSearch('')
    setDiffFilter({ EASY: true, MEDIUM: true, HARD: true })
    setStatusFilter({ done: false, bookmarked: false })
    setView('problems')
    fetchProblems(null, name, 1)
  }

  const handlePageChange = (newPage) => {
    setPage(newPage)
    fetchProblems(selectedTopic, selectedCompany, newPage)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // --- Filters ---
  const hasActiveFilters = search.trim() || !diffFilter.EASY || !diffFilter.MEDIUM || !diffFilter.HARD || statusFilter.done || statusFilter.bookmarked

  useEffect(() => {
    if (view === 'problems' && hasActiveFilters) {
      fetchAllProblems(selectedTopic, selectedCompany)
    } else if (view === 'problems' && !hasActiveFilters) {
      fetchProblems(selectedTopic, selectedCompany, page)
    }
  }, [hasActiveFilters, view]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredProblems = useMemo(() => {
    let result = problems
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      )
    }
    result = result.filter(p => diffFilter[(p.difficulty || '').toUpperCase()])
    if (statusFilter.done) result = result.filter(p => completed[p.url])
    if (statusFilter.bookmarked) result = result.filter(p => bookmarked[p.url])
    return result
  }, [problems, search, diffFilter, statusFilter, completed, bookmarked])

  const toggleDone = (url) => {
    setCompleted(prev => {
      const next = { ...prev, [url]: !prev[url] }
      saveCompleted(next)
      return next
    })
  }

  const toggleBookmark = (url) => {
    setBookmarked(prev => {
      const next = { ...prev, [url]: !prev[url] }
      saveBookmarked(next)
      return next
    })
  }

  const toggleDiff = (d) => setDiffFilter(prev => ({ ...prev, [d]: !prev[d] }))
  const toggleStatus = (s) => setStatusFilter(prev => ({ ...prev, [s]: !prev[s] }))

  // --- Computed stats ---
  const completedCount = Object.values(completed).filter(Boolean).length
  const totalTopicProblems = topics.reduce((s, t) => s + t.problem_count, 0)
  const totalCompanyProblems = companies.reduce((s, c) => s + c.problem_count, 0)

  const filteredCompanies = useMemo(() => {
    if (!companySearch.trim()) return companies
    const q = companySearch.trim().toLowerCase()
    return companies.filter(c => c.company_name.toLowerCase().includes(q))
  }, [companies, companySearch])

  if (loading && view === 'dashboard') return <Skeleton />

  // ============================================
  // VIEW: Dashboard
  // ============================================
  if (view === 'dashboard') {
    const topicsSample = ['Array', 'String', 'Tree', 'DP', 'Graph', 'Stack', 'Matrix', 'Linked List']
    const companiesSample = ['Google', 'Amazon', 'Meta', 'Microsoft', 'Apple', 'Netflix']

    return (
      <div className="min-h-screen bg-mist p-6 md:p-8 font-sans text-ink overflow-hidden relative">
        {/* Floating code decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <Terminal className="absolute top-[8%] left-[6%] h-10 w-10 text-signal/[0.07] shape-float" />
          <Braces className="absolute top-[15%] right-[8%] h-12 w-12 text-ember/[0.08] shape-float-slow" />
          <Cpu className="absolute top-[55%] left-[4%] h-9 w-9 text-signal/[0.06] shape-float-delay" />
          <GitBranch className="absolute top-[70%] right-[5%] h-11 w-11 text-ember/[0.07] shape-float" />
          <Database className="absolute top-[35%] right-[3%] h-8 w-8 text-signal/[0.05] shape-float-slow" />
          <Layers className="absolute top-[85%] left-[10%] h-10 w-10 text-ember/[0.06] shape-float-delay" />
          <Zap className="absolute top-[5%] left-[50%] h-7 w-7 text-ember/[0.06] shape-float" />
          <Code2 className="absolute top-[45%] left-[85%] h-9 w-9 text-signal/[0.06] shape-float-delay" />
        </div>

        <div className="max-w-5xl mx-auto space-y-7 relative z-10">
          {/* Hero Header */}
          <div className="text-center py-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-signal/10 text-signal text-[11px] font-bold mb-5 tracking-wide uppercase">
              <Code2 className="h-3.5 w-3.5" />
              Data Structures & Algorithms
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold text-ink leading-tight mb-3">
              DSA Practice Hub
            </h1>
            <p className="text-base text-slate max-w-xl mx-auto leading-relaxed">
              Master coding interviews with curated problems — organized by topic and real company patterns.
            </p>
            {/* Big stats */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-7">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-signal/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-signal" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-display font-extrabold text-ink leading-none">{totalTopicProblems + totalCompanyProblems}+</p>
                  <p className="text-[10px] text-slate font-medium mt-0.5">Total Problems</p>
                </div>
              </div>
              <div className="w-px h-8 bg-mist" />
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-display font-extrabold text-ink leading-none">{topics.length}</p>
                  <p className="text-[10px] text-slate font-medium mt-0.5">Topics</p>
                </div>
              </div>
              <div className="w-px h-8 bg-mist" />
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-amber-600" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-display font-extrabold text-ink leading-none">{companies.length}</p>
                  <p className="text-[10px] text-slate font-medium mt-0.5">Companies</p>
                </div>
              </div>
              <div className="w-px h-8 bg-mist" />
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-signal/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-signal" />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-display font-extrabold text-ink leading-none">{completedCount}</p>
                  <p className="text-[10px] text-slate font-medium mt-0.5">Solved</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mode Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Topic Wise Card */}
            <button
              onClick={goToTopicList}
              className="group relative theme-card bg-paper p-7 md:p-8 border border-gray-200/60 shadow-sm hover:shadow-lg hover:border-signal/40 transition-all duration-300 cursor-pointer text-left overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-signal/[0.04] rounded-bl-[80px] transition-all duration-500 group-hover:w-40 group-hover:h-40 group-hover:bg-signal/[0.07]" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-signal/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="h-7 w-7 text-signal" />
                </div>
                <h2 className="text-2xl font-display font-extrabold text-ink mb-1.5">Topic Wise</h2>
                <p className="text-sm text-slate mb-4">
                  {topics.length} handpicked topics &middot; {totalTopicProblems} problems
                </p>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {topicsSample.map((t) => (
                    <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-mist text-slate border border-gray-200/60">#{t}</span>
                  ))}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-mist text-slate border border-gray-200/60">+{topics.length - topicsSample.length} more</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-signal group-hover:gap-2.5 transition-all duration-300">
                  Start Practicing <ArrowLeft className="h-4 w-4 rotate-180" />
                </span>
              </div>
            </button>

            {/* Company Wise Card */}
            <button
              onClick={goToCompanyList}
              className="group relative theme-card bg-paper p-7 md:p-8 border border-gray-200/60 shadow-sm hover:shadow-lg hover:border-ember/40 transition-all duration-300 cursor-pointer text-left overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-ember/[0.04] rounded-bl-[80px] transition-all duration-500 group-hover:w-40 group-hover:h-40 group-hover:bg-ember/[0.07]" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-ember/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="h-7 w-7 text-ember" />
                </div>
                <h2 className="text-2xl font-display font-extrabold text-ink mb-1.5">Company Wise</h2>
                <p className="text-sm text-slate mb-4">
                  {companies.length} top companies &middot; {totalCompanyProblems} problems
                </p>
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {companiesSample.map((c) => (
                    <span key={c} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-mist text-slate border border-gray-200/60">{c}</span>
                  ))}
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-mist text-slate border border-gray-200/60">+{companies.length - companiesSample.length} more</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-bold text-ember group-hover:gap-2.5 transition-all duration-300">
                  Explore Companies <ArrowLeft className="h-4 w-4 rotate-180" />
                </span>
              </div>
            </button>
          </div>

          {/* Quick tips / motivation strip */}
          <div className="theme-card bg-paper p-5 border border-gray-200/60 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-signal/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="h-4.5 w-4.5 text-signal" />
              </div>
              <div>
                <p className="text-sm font-display font-bold text-ink mb-0.5">Daily DSA Tip</p>
                <p className="text-xs text-slate leading-relaxed">
                  Consistency beats intensity. Solving 1-2 problems daily for 6 months beats solving 20 problems in one weekend.
                  Focus on understanding patterns, not memorizing solutions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // VIEW: Topic List
  // ============================================
  const topicIcons = {
    array: '📦', string: '🔤', matrix: '🔲', tree: '🌲', graph: '🕸️',
    stack: '📚', queue: '🚶', linked: '🔗', dynamic: '⚡', search: '🔍',
    sort: '📊', greedy: '🎯', backtrack: '🔄', binary: '⚖️', hash: '#️⃣',
    heap: '⛰️', trie: '🌳', bit: '💡', math: '🧮', default: '💻',
  }
  const getTopicIcon = (name) => {
    const lower = name.toLowerCase()
    for (const [key, icon] of Object.entries(topicIcons)) {
      if (lower.includes(key)) return icon
    }
    return topicIcons.default
  }

  if (view === 'topics') {
    const filtered = topics.filter(t => !search.trim() || t.topic_name.toLowerCase().includes(search.trim().toLowerCase()))
    return (
      <div className="min-h-screen bg-mist p-6 md:p-8 font-sans text-ink">
        <div className="max-w-5xl mx-auto space-y-5">
          <button onClick={goToDashboard} className="flex items-center gap-2 text-xs font-bold text-slate hover:text-signal transition-colors cursor-pointer">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </button>

          <div className="theme-card bg-paper p-6 border border-gray-200/60 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-signal/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-signal" />
              </div>
              <div>
                <h2 className="text-xl font-display font-extrabold text-ink">Topic Wise Problems</h2>
                <p className="text-xs text-slate">{filtered.length} of {topics.length} topics &middot; {totalTopicProblems} problems total</p>
              </div>
            </div>
            <div className="relative">
              <Search className="h-4 w-4 text-slate absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search topics (e.g. Array, Tree, DP)..."
                className="theme-input w-full pl-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((t) => (
              <button
                key={t.topic_name}
                onClick={() => selectTopic(t.topic_name)}
                className="group theme-card bg-paper p-5 border border-gray-200/60 shadow-sm hover:border-signal/30 hover:shadow-md transition-all duration-200 cursor-pointer text-left"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl leading-none mt-0.5">{getTopicIcon(t.topic_name)}</span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-display font-bold text-ink group-hover:text-signal transition-colors">{t.topic_name}</h3>
                    <p className="text-[10px] text-slate mt-1 font-medium">{t.problem_count} problems</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="theme-card bg-paper p-10 border border-gray-200/60 shadow-sm text-center">
              <Search className="h-8 w-8 text-slate mx-auto mb-3" />
              <h3 className="text-sm font-display font-bold text-ink mb-1">No topics found</h3>
              <p className="text-xs text-slate">Try a different search term.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ============================================
  // VIEW: Company List
  // ============================================
  const getCompanyColor = (name) => {
    const colors = [
      'bg-signal/10 text-signal', 'bg-ember/10 text-ember',
      'bg-emerald-500/10 text-emerald-600', 'bg-violet-500/10 text-violet-600',
      'bg-rose-500/10 text-rose-600', 'bg-cyan-500/10 text-cyan-600',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
  }

  if (view === 'companies') {
    return (
      <div className="min-h-screen bg-mist p-6 md:p-8 font-sans text-ink">
        <div className="max-w-5xl mx-auto space-y-5">
          <button onClick={goToDashboard} className="flex items-center gap-2 text-xs font-bold text-slate hover:text-signal transition-colors cursor-pointer">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
          </button>

          <div className="theme-card bg-paper p-6 border border-gray-200/60 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-ember/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-ember" />
              </div>
              <div>
                <h2 className="text-xl font-display font-extrabold text-ink">Company Wise Problems</h2>
                <p className="text-xs text-slate">{filteredCompanies.length} of {companies.length} companies &middot; {totalCompanyProblems} problems total</p>
              </div>
            </div>
            <div className="relative">
              <Search className="h-4 w-4 text-slate absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                placeholder="Search companies (e.g. Google, Amazon, Meta)..."
                className="theme-input w-full pl-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredCompanies.map((c) => (
              <button
                key={c.company_name}
                onClick={() => selectCompany(c.company_name)}
                className="group theme-card bg-paper p-5 border border-gray-200/60 shadow-sm hover:border-ember/30 hover:shadow-md transition-all duration-200 cursor-pointer text-left"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-display font-extrabold ${getCompanyColor(c.company_name)}`}>
                    {c.company_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-display font-bold text-ink group-hover:text-ember transition-colors truncate">{c.company_name}</h3>
                    <p className="text-[10px] text-slate mt-1 font-medium">{c.problem_count} problems</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          {filteredCompanies.length === 0 && (
            <div className="theme-card bg-paper p-10 border border-gray-200/60 shadow-sm text-center">
              <Search className="h-8 w-8 text-slate mx-auto mb-3" />
              <h3 className="text-sm font-display font-bold text-ink mb-1">No companies found</h3>
              <p className="text-xs text-slate">Try a different search term.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ============================================
  // VIEW: Problems
  // ============================================
  const currentName = selectedTopic || selectedCompany || ''
  const showCompany = !!selectedCompany

  return (
    <div className="min-h-screen bg-mist p-6 md:p-8 font-sans text-ink">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Back button */}
        <button
          onClick={selectedTopic ? goToTopicList : goToCompanyList}
          className="flex items-center gap-2 text-xs font-bold text-slate hover:text-signal transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to {selectedTopic ? 'Topics' : 'Companies'}
        </button>

        {/* Header */}
        <div className="theme-card bg-paper p-5 border border-gray-200/60 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${showCompany ? 'bg-ember/10' : 'bg-signal/10'}`}>
              {showCompany
                ? <Building2 className="h-5 w-5 text-ember" />
                : <BookOpen className="h-5 w-5 text-signal" />}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-display font-extrabold text-ink">{currentName}</h2>
              <p className="text-xs text-slate mt-0.5">
                {total} problems {showCompany ? '· Sorted by frequency' : ''} · {Object.values(completed).filter(Boolean).length} solved
              </p>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="theme-card bg-paper p-3 border border-gray-200/60 shadow-sm space-y-2">
          <div className="relative">
            <Search className="h-4 w-4 text-slate absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems by name or tag..."
              className="theme-input w-full pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="h-3 w-3 text-slate flex-shrink-0" />
            {['EASY', 'MEDIUM', 'HARD'].map((d) => {
              const active = diffFilter[d]
              const styles = DIFFICULTY_FILTER_STYLES[d]
              return (
                <button key={d} onClick={() => toggleDiff(d)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${active ? styles.active : styles.inactive}`}>
                  {d}
                </button>
              )
            })}
            <span className="w-px h-4 bg-mist" />
            <button onClick={() => toggleStatus('done')}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${statusFilter.done ? 'bg-signal text-white' : 'bg-mist text-slate hover:bg-signal/10'}`}>
              <CheckCircle2 className="h-3 w-3 inline mr-1" /> Done
            </button>
            <button onClick={() => toggleStatus('bookmarked')}
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${statusFilter.bookmarked ? 'bg-amber-500 text-white' : 'bg-mist text-slate hover:bg-amber-500/10'}`}>
              <Star className="h-3 w-3 inline mr-1" /> Bookmarked
            </button>
            {hasActiveFilters && (
              <span className="text-[10px] text-slate ml-auto">
                Showing {filteredProblems.length} of {total}
              </span>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="theme-card bg-paper p-10 border border-gray-200/60 shadow-sm text-center">
            <div className="animate-spin h-5 w-5 border-2 border-signal border-t-transparent rounded-full mx-auto" />
            <p className="text-xs text-slate mt-2">Loading problems...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredProblems.length === 0 && (
          <div className="theme-card bg-paper p-10 border border-gray-200/60 shadow-sm text-center">
            <Search className="h-8 w-8 text-slate mx-auto mb-3" />
            <h3 className="text-sm font-display font-bold text-ink mb-1">No matches</h3>
            <p className="text-xs text-slate">Try adjusting your filters or search query.</p>
          </div>
        )}

        {/* Problem list */}
        {!loading && filteredProblems.length > 0 && (
          <div className="theme-card bg-paper border border-gray-200/60 shadow-sm overflow-hidden">
            <div className="divide-y divide-mist">
              {filteredProblems.map((p) => (
                <ProblemRow
                  key={p.url}
                  p={p}
                  done={!!completed[p.url]}
                  bookmarked={!!bookmarked[p.url]}
                  onToggleDone={() => toggleDone(p.url)}
                  onToggleBookmark={() => toggleBookmark(p.url)}
                  showCompany={showCompany}
                />
              ))}
            </div>

            {/* Pagination - only show when no active filters */}
            {!hasActiveFilters && (
              <>
                <div className="border-t border-mist px-4 py-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate">
                    Page {page} of {totalPages} &middot; {(page - 1) * LIMIT + 1}-{Math.min(page * LIMIT, total)} of {total}
                  </span>
                </div>
                <Pagination page={page} totalPages={totalPages} onPageChange={handlePageChange} />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
