import React, { useState, useEffect, useCallback } from 'react'
import {
  Calendar, ExternalLink, Trophy, Filter, ShieldCheck, RotateCcw,
  Star, Clock, Info,
} from 'lucide-react'

const TYPE_ICONS = {
  Hackathon: Trophy,
  Contest: ShieldCheck,
  CTF: ShieldCheck,
  'Open Source': Star,
  Internship: Info,
}

function OppSkeleton() {
  return (
    <div className="min-h-screen bg-mist p-6 md:p-8 space-y-6 max-w-7xl mx-auto font-sans text-ink animate-pulse">
      <div className="theme-card bg-paper p-6 border border-gray-200/60 shadow-sm space-y-3">
        <div className="h-6 w-56 bg-mist rounded" />
        <div className="h-3 w-full bg-mist rounded" />
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 w-24 bg-mist rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="theme-card bg-paper p-6 border border-gray-200/60 shadow-sm space-y-4">
            <div className="h-5 w-20 bg-mist rounded" />
            <div className="h-5 w-3/4 bg-mist rounded" />
            <div className="h-16 bg-mist rounded" />
            <div className="flex gap-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-5 w-16 bg-mist rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function OppCard({ opp, studentLevel }) {
  const TypeIcon = TYPE_ICONS[opp.type] || Trophy
  const isMatchLevel = opp.difficulty_level === studentLevel || opp.difficulty_level === 'All Levels'

  return (
    <div className="theme-card bg-paper p-6 flex flex-col justify-between hover:border-signal/25 transition-all duration-300 relative">
      <div className="space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div>
            <span className="text-[10px] font-bold text-signal uppercase tracking-widest bg-signal-tint border border-signal/10 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1">
              <TypeIcon className="h-3 w-3" /> {opp.type}
            </span>
            <h3 className="text-base font-display font-bold text-ink mt-3 leading-snug">
              {opp.title}
            </h3>
          </div>
          <span className={`text-[10px] font-bold flex items-center gap-1 flex-shrink-0 ${isMatchLevel ? 'text-signal' : 'text-slate'}`}>
            <ShieldCheck className="h-4 w-4 text-current" />
            {opp.difficulty_level}
          </span>
        </div>

        <p className="text-xs text-slate leading-relaxed">{opp.why_apply}</p>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {opp.domain_tags.map((tag, i) => (
            <span key={i} className="px-2 py-0.5 rounded text-[9px] font-bold bg-mist text-slate border border-mist">
              #{tag}
            </span>
          ))}
        </div>

        {opp.prize_or_perk && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            <p className="text-[10px] font-bold text-amber-700">
              <Trophy className="h-3 w-3 inline mr-1" />
              {opp.prize_or_perk}
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center border-t border-mist pt-4 mt-6">
        <div className="space-y-1">
          <span className="text-[9px] text-slate uppercase block font-semibold">Organiser</span>
          <span className="text-xs text-ink font-bold block">{opp.organiser}</span>
        </div>
        <div className="space-y-1 text-right">
          <span className="text-[9px] text-slate uppercase block font-semibold">Deadline</span>
          <span className="text-xs text-amber-600 font-bold block flex items-center justify-end gap-1.5 font-mono">
            <Calendar className="h-3.5 w-3.5" />
            {opp.deadline || 'Ongoing'}
          </span>
        </div>
      </div>

      <a
        href={opp.url}
        target="_blank"
        rel="noreferrer"
        className="mt-4 py-2.5 rounded-full border border-signal text-signal hover:bg-signal-tint text-center text-xs font-bold transition-all flex items-center justify-center gap-2"
      >
        {opp.registration_free ? 'Register (Free)' : 'Apply / Register'}
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  )
}

function Opportunities({ profile, analysis }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [filterType, setFilterType] = useState('All')
  const [page, setPage] = useState(1)
  const [allOpps, setAllOpps] = useState([])

  const primaryDomain = profile?.domain_interest?.[0] || 'DSA/CP'
  const studentLevel = analysis?.skill_profile?.level || 'Beginner'
  const PAGE_SIZE = 12

  const fetchOpps = useCallback(async (pageNum = 1, append = false) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    setError(null)
    try {
      const headers = { 'Content-Type': 'application/json' }
      const res = await fetch(`http://localhost:8000/api/agents/opportunities?page=${Number(pageNum)}&limit=${PAGE_SIZE}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          domain: primaryDomain,
          level: studentLevel,
          types: ['Hackathon', 'CTF', 'Contest', 'Internship', 'Open Source'],
        }),
      })
      if (!res.ok) throw new Error('Failed to fetch opportunities')
      const json = await res.json()
      if (append) {
        setAllOpps(prev => [...prev, ...json.opportunities])
      } else {
        setAllOpps(json.opportunities)
      }
      setData(json)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [primaryDomain, studentLevel])

  useEffect(() => {
    fetchOpps(1)
  }, [primaryDomain, studentLevel])

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchOpps(nextPage, true)
  }

  if (loading) return <OppSkeleton />

  if (error) return (
    <div className="min-h-screen bg-mist p-6 md:p-8 font-sans text-ink">
      <div className="max-w-5xl mx-auto theme-card bg-paper p-8 border border-red-200 shadow-sm text-center">
        <Trophy className="h-8 w-8 text-red-400 mx-auto mb-3" />
        <h2 className="text-lg font-display font-bold text-ink mb-1">Failed to load opportunities</h2>
        <p className="text-sm text-slate mb-4">{error}</p>
        <button
          onClick={fetchOpps}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-signal text-white text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    </div>
  )

  const opps = allOpps
  const filtered = filterType === 'All' ? opps : opps.filter((o) => o.type === filterType)
  const filterCategories = ['All', 'Hackathon', 'Contest', 'CTF', 'Open Source', 'Internship']
  const hasMore = data?.has_more || false
  const totalCount = data?.total_found || 0

  return (
    <div className="min-h-screen bg-mist p-6 md:p-8 space-y-6 max-w-7xl mx-auto font-sans text-ink">

      {/* Header banner */}
      <div className="theme-card bg-paper p-6 relative overflow-hidden">
        <div className="flex items-center gap-3">
          <Trophy className="h-7 w-7 text-signal" />
          <div>
            <h1 className="text-2xl font-display font-extrabold text-ink">Live Opportunities</h1>
            <p className="text-xs text-slate mt-1">
              Personalized hackathons, contests, and open-source campaigns matching your{' '}
              <span className="text-ink font-bold">{primaryDomain}</span> domain.
            </p>
          </div>
        </div>
        {data?.spotlight && (
          <div className="mt-4 bg-signal-tint border border-signal/10 rounded-xl px-4 py-3">
            <p className="text-xs text-ink leading-relaxed">
              <Star className="h-3.5 w-3.5 inline text-signal mr-1" />
              <span className="font-bold text-signal">Spotlight:</span> {data.spotlight}
            </p>
          </div>
        )}
        {data?.notice && (
          <p className="mt-2 text-[10px] text-amber-600 font-semibold flex items-center gap-1">
            <Info className="h-3 w-3" /> {data.notice}
          </p>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-mist pb-4">
        <Filter className="h-4 w-4 text-slate mr-2" />
        {filterCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => { setFilterType(cat); setPage(1); }}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              filterType === cat
                ? 'bg-signal text-white border-signal shadow-sm'
                : 'bg-paper border-gray-200/60 text-slate hover:bg-mist hover:text-ink'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.length > 0 ? (
          filtered.map((opp, i) => (
            <OppCard key={i} opp={opp} studentLevel={studentLevel} />
          ))
        ) : (
          <div className="col-span-2 text-center py-12 text-slate text-sm font-semibold">
            No opportunities found for the selected filter.
          </div>
        )}
      </div>

      {/* Load More */}
      {hasMore && filterType === 'All' && (
        <div className="flex justify-center pt-4">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 rounded-full border border-signal text-signal hover:bg-signal-tint text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loadingMore ? (
              <>
                <span className="h-3.5 w-3.5 border-2 border-signal border-t-transparent rounded-full animate-spin" />
                Loading...
              </>
            ) : (
              <>Load More ({filtered.length} of {totalCount})</>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

export default Opportunities
