import React, { useState } from 'react'
import { Flame, GraduationCap, Target, Sparkles, Save, Loader2, CalendarCheck } from 'lucide-react'
import { computeReadinessScore } from '../lib/profileStore'

const DOMAINS = ['DSA/CP', 'Web Development', 'AI/ML', 'Cloud', 'CyberSec', 'Mobile']
const GOALS = ['Placement', 'GATE', 'Startup', 'Research', 'Higher Studies']
const BRANCHES = ['CSE', 'IT', 'ECE', 'AIDS', 'AIML']

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="theme-card bg-paper p-5 flex items-center gap-3.5">
      <div className="h-10 w-10 rounded-xl bg-signal-tint flex items-center justify-center text-signal flex-shrink-0">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <span className="text-[10px] font-bold text-slate uppercase tracking-wider block">{label}</span>
        <span className="text-sm font-extrabold text-ink">{value}</span>
      </div>
    </div>
  )
}

function Profile({ email, userDoc, onSaveProfile }) {
  const profile = userDoc?.profile || {}
  const streak = userDoc?.streak || { current: 0, longest: 0 }

  const [editing, setEditing] = useState(!profile.name)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: profile.name || '',
    age: profile.age || '',
    branch: profile.branch || 'CSE',
    domain_interest: profile.domain_interest || [],
    career_goal: profile.career_goal || 'Placement'
  })

  const toggleDomain = (d) => {
    setForm((prev) => ({
      ...prev,
      domain_interest: prev.domain_interest.includes(d)
        ? prev.domain_interest.filter((x) => x !== d)
        : [...prev.domain_interest, d]
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    await onSaveProfile({ ...profile, ...form })
    setSaving(false)
    setEditing(false)
  }

  const score = computeReadinessScore(userDoc)

  return (
    <div className="min-h-screen bg-mist p-6 md:p-8 space-y-6 max-w-5xl mx-auto font-sans text-ink">
      {/* Header */}
      <div className="theme-card bg-paper p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-signal-tint text-signal px-3 py-1 rounded-lg text-xs font-bold mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            My Profile
          </div>
          <h1 className="text-2xl font-display font-extrabold text-ink leading-tight">
            {form.name || 'Complete your profile'}
          </h1>
          <p className="text-xs text-slate mt-1 break-all">{email}</p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate uppercase tracking-wider block">Profile Readiness</span>
          <span className="text-3xl font-mono font-extrabold text-signal">{score}%</span>
        </div>
      </div>

      {/* Streak / continuity stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Flame} label="Current Login Streak" value={`${streak.current || 0} day${streak.current === 1 ? '' : 's'}`} />
        <StatCard icon={CalendarCheck} label="Longest Streak" value={`${streak.longest || 0} day${streak.longest === 1 ? '' : 's'}`} />
        <StatCard icon={GraduationCap} label="Branch / Course" value={form.branch || '—'} />
      </div>

      {/* Details card */}
      <div className="theme-card bg-paper p-6 space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate uppercase tracking-wider">Profile Details</span>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-bold text-signal hover:underline cursor-pointer"
            >
              Edit
            </button>
          )}
        </div>

        {!editing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <span className="text-[10px] font-bold text-slate uppercase tracking-wider block mb-1">Name</span>
              <span className="text-sm font-semibold text-ink">{form.name || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate uppercase tracking-wider block mb-1">Age</span>
              <span className="text-sm font-semibold text-ink">{form.age || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate uppercase tracking-wider block mb-1">Course</span>
              <span className="text-sm font-semibold text-ink">BTech {form.branch}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate uppercase tracking-wider block mb-1">Career Goal</span>
              <span className="text-sm font-semibold text-ink flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-signal" /> {form.career_goal || '—'}
              </span>
            </div>
            <div className="md:col-span-2">
              <span className="text-[10px] font-bold text-slate uppercase tracking-wider block mb-2">Interests</span>
              <div className="flex flex-wrap gap-1.5">
                {form.domain_interest.length > 0 ? form.domain_interest.map((d) => (
                  <span key={d} className="px-2.5 py-1 rounded-full bg-signal-tint text-signal text-[10px] font-bold border border-signal/10">
                    {d}
                  </span>
                )) : <span className="text-xs text-slate">No interests selected yet.</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Aravind Sharma"
                  className="w-full theme-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-1">Age</label>
                <input
                  type="number"
                  min="15"
                  max="99"
                  value={form.age}
                  onChange={(e) => setForm((p) => ({ ...p, age: e.target.value }))}
                  placeholder="e.g. 20"
                  className="w-full theme-input"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-1">Course / Branch</label>
                <select
                  value={form.branch}
                  onChange={(e) => setForm((p) => ({ ...p, branch: e.target.value }))}
                  className="w-full theme-input bg-paper"
                >
                  {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-1">Career Goal</label>
                <select
                  value={form.career_goal}
                  onChange={(e) => setForm((p) => ({ ...p, career_goal: e.target.value }))}
                  className="w-full theme-input bg-paper"
                >
                  {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-2">Interests</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {DOMAINS.map((d) => {
                  const isSelected = form.domain_interest.includes(d)
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => toggleDomain(d)}
                      className={`px-3 py-2.5 text-xs font-semibold rounded-xl text-left border transition-all ${
                        isSelected
                          ? 'bg-signal-tint border-signal text-signal font-bold'
                          : 'bg-paper border-gray-200/60 text-slate hover:bg-mist hover:text-ink'
                      }`}
                    >
                      {d}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-full bg-signal hover:bg-signal/90 text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Profile
              </button>
              {profile.name && (
                <button
                  onClick={() => setEditing(false)}
                  className="px-6 py-2.5 rounded-full border border-mist text-xs font-bold text-slate hover:bg-mist transition-all cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
