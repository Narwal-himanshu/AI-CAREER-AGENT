import React, { useMemo, useState } from 'react'
import {
  GraduationCap, ArrowRight, ArrowLeft, Loader2, CheckCircle2,
  User, Target, Brain, Cpu, Compass, Code2, Terminal, Cloud, Shield, Smartphone,
} from 'lucide-react'
import { ASSESSMENT_CATEGORIES, DOMAINS } from '../data/assessment/config'
import {
  CODING_JOURNEY_QUESTION, CAREER_GOAL_QUESTIONS, LEARNING_STYLE_QUESTIONS,
  PERSONALITY_QUESTIONS, SKILL_QUESTIONS_BY_DOMAIN,
} from '../data/assessment/questions'
import { evaluateAssessment } from '../data/assessment/scoring'

// Maps the richer "primary_target" answer down to the vocabulary Profile.jsx's
// career_goal dropdown already uses, so editing the profile later stays in sync.
const CAREER_GOAL_MAP = {
  product_based: 'Placement',
  service_based: 'Placement',
  startup: 'Startup',
  higher_studies: 'Higher Studies',
  government_exams: 'GATE',
}

const LEARNING_STYLE_MAP = {
  video: 'Video',
  reading: 'Reading',
  building: 'Projects',
  problems: 'Hands-on',
}

const ICONS = { User, Target, Brain, Cpu, Compass, Code2, Terminal, Cloud, Shield, Smartphone }

// --- Small reusable building blocks -----------------------------------------

function SectionIntro({ icon, kicker, title, desc }) {
  const Icon = ICONS[icon]
  return (
    <div className="mb-6">
      <div className="inline-flex items-center gap-1.5 bg-signal-tint text-signal px-3 py-1 rounded-lg text-xs font-bold mb-3">
        <Icon className="h-3.5 w-3.5 text-signal" />
        {kicker}
      </div>
      <h2 className="text-2xl font-display font-bold text-ink">{title}</h2>
      <p className="text-sm text-slate mt-1.5">{desc}</p>
    </div>
  )
}

// Generic single/multi-select MCQ option grid. Selecting immediately
// highlights the option (background + border + scale) with a smooth transition.
function OptionGrid({ options, value, multi, onSelect, columns = 2 }) {
  const isSelected = (val) => (multi ? (value || []).includes(val) : value === val)
  return (
    <div className={`grid grid-cols-1 ${columns === 2 ? 'md:grid-cols-2' : ''} gap-2.5`}>
      {options.map((opt) => {
        const selected = isSelected(opt.value)
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onSelect(opt.value)}
            className={`px-4 py-3.5 text-sm font-semibold rounded-xl text-left border-2 transition-all duration-200 cursor-pointer ${
              selected
                ? 'bg-signal-tint border-signal text-signal font-bold shadow-sm scale-[1.01]'
                : 'bg-paper border-gray-200/70 text-slate hover:bg-mist hover:border-gray-300'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function MCQQuestion({ q, value, onSingle, onMulti }) {
  return (
    <div className="space-y-3">
      <h3 className="text-base font-bold text-ink">
        {q.question}
        {q.type === 'multi' && <span className="ml-2 text-xs font-medium text-slate">(select all that apply)</span>}
      </h3>
      <OptionGrid
        options={q.options}
        value={value}
        multi={q.type === 'multi'}
        onSelect={(val) => (q.type === 'multi' ? onMulti(q.id, val) : onSingle(q.id, val))}
      />
    </div>
  )
}

const LEVEL_STYLES = {
  Easy: 'bg-emerald-500/10 text-emerald-600',
  Recognition: 'bg-emerald-500/10 text-emerald-600',
  Application: 'bg-signal-tint text-signal',
  Comprehension: 'bg-amber-500/10 text-amber-600',
  'Design thinking': 'bg-purple-500/10 text-purple-600',
  'Intermediate+': 'bg-red-500/10 text-red-600',
}

function SkillQuestionCard({ question, selected, onSelect }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest">
        <span className="text-signal">{question.domain}</span>
        <span className="text-slate/40">•</span>
        <span className={`px-2 py-0.5 rounded ${LEVEL_STYLES[question.level] || 'bg-mist text-slate'}`}>{question.level}</span>
      </div>
      <h3 className="text-lg font-display font-bold text-ink leading-relaxed">{question.question}</h3>
      <div className="space-y-2.5">
        {question.options.map((opt) => {
          const isSelected = selected === opt.key
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onSelect(opt.key)}
              className={`w-full px-5 py-4 text-sm font-semibold rounded-xl text-left border-2 transition-all duration-200 cursor-pointer flex items-center gap-3 ${
                isSelected
                  ? 'bg-signal-tint border-signal text-signal font-bold shadow-sm'
                  : 'bg-paper border-gray-200/70 text-slate hover:bg-mist hover:border-gray-300'
              }`}
            >
              <span className={`inline-flex items-center justify-center h-6 w-6 rounded-md text-xs font-bold flex-shrink-0 ${
                isSelected ? 'bg-signal text-white' : 'bg-mist text-slate'
              }`}>
                {opt.key}
              </span>
              {opt.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// --- Main component ----------------------------------------------------------

function Onboarding({ onAssessmentComplete, onGoHome, authUser, userDoc, onSaveProfile }) {
  const [step, setStep] = useState(0)
  const [furthestStep, setFurthestStep] = useState(0)
  const [skillIdx, setSkillIdx] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const savedProfile = userDoc?.profile || {}

  const [formData, setFormData] = useState({
    // Personal Profile
    name: savedProfile.name || '',
    age: savedProfile.age || '',
    email: authUser?.email || '',
    year: savedProfile.year || 2,
    branch: savedProfile.branch || 'CSE',
    cgpa: savedProfile.cgpa || 8.0,
    college: savedProfile.college || '',
    college_tier: savedProfile.college_tier || 'Tier-2',
    coding_journey: '',
    // Career Goals
    domain_interest: savedProfile.domain_interest?.length ? savedProfile.domain_interest : ['DSA/CP'],
    primary_target: '',
    urgency: '',
    company_type: '',
    // Learning Style
    learn_best: [],
    stuck_move: '',
    hours_per_day: String(savedProfile.hours_per_day || '1.5'),
    study_format: '',
    // Personality & Motivation
    plan_disruption: '',
    motivation: '',
    failure_handling: '',
    self_description: '',
  })

  const [skillAnswers, setSkillAnswers] = useState({})

  const flatSkillQuestions = useMemo(() => {
    return formData.domain_interest.flatMap((domain) =>
      (SKILL_QUESTIONS_BY_DOMAIN[domain] || []).map((q) => ({ ...q, domain }))
    )
  }, [formData.domain_interest])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSingleSelect = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleMultiToggle = (field, value) => {
    setFormData((prev) => {
      const current = prev[field]
      const updated = current.includes(value) ? current.filter((x) => x !== value) : [...current, value]
      return { ...prev, [field]: updated }
    })
  }

  const goToStep = (idx) => {
    if (idx <= furthestStep) {
      setStep(idx)
      setSkillIdx(0)
    }
  }

  const advanceStep = () => {
    const next = Math.min(step + 1, ASSESSMENT_CATEGORIES.length - 1)
    setStep(next)
    setFurthestStep((prev) => Math.max(prev, next))
    setSkillIdx(0)
  }

  const goBack = () => {
    if (step === 3 && skillIdx > 0) {
      setSkillIdx((i) => i - 1)
      return
    }
    setStep((prev) => Math.max(0, prev - 1))
  }

  // --- Step validation gates ---
  const validateStep0 = () =>
    formData.name && formData.email && formData.age && formData.college &&
    formData.cgpa >= 0 && formData.cgpa <= 10 && formData.coding_journey

  const validateStep1 = () =>
    formData.domain_interest.length > 0 && formData.primary_target && formData.urgency && formData.company_type

  const validateStep2 = () =>
    formData.learn_best.length > 0 && formData.stuck_move && formData.hours_per_day && formData.study_format

  const validateStep4 = () =>
    formData.plan_disruption && formData.motivation && formData.failure_handling && formData.self_description

  const currentSkillQuestion = flatSkillQuestions[skillIdx]
  const skillAnsweredCount = flatSkillQuestions.filter((q) => skillAnswers[q.id]).length
  const allSkillAnswered = flatSkillQuestions.length > 0 && skillAnsweredCount === flatSkillQuestions.length

  const handleSkillNext = () => {
    if (skillIdx < flatSkillQuestions.length - 1) {
      setSkillIdx((i) => i + 1)
    } else {
      advanceStep()
    }
  }

  const handleFinalSubmit = async () => {
    setLoading(true)
    setError(null)

    const career_goal = CAREER_GOAL_MAP[formData.primary_target] || 'Placement'
    const student_id = 'stu-' + Math.random().toString(36).substring(2, 15)

    const payload = {
      student_id,
      profile: {
        name: formData.name,
        email: formData.email,
        age: Number(formData.age),
        year: Number(formData.year),
        branch: formData.branch,
        cgpa: Number(formData.cgpa),
        college: formData.college,
        college_tier: formData.college_tier,
      },
      domain_interest: formData.domain_interest,
      career_goal,
      time_and_style: {
        hours_per_day: Number(formData.hours_per_day),
        preferred_style: formData.learn_best.map((s) => LEARNING_STYLE_MAP[s] || s),
      },
    }

    try {
      if (onSaveProfile) {
        await onSaveProfile({
          name: formData.name,
          age: Number(formData.age),
          year: Number(formData.year),
          branch: formData.branch,
          cgpa: Number(formData.cgpa),
          college: formData.college,
          college_tier: formData.college_tier,
          domain_interest: formData.domain_interest,
          career_goal,
          hours_per_day: Number(formData.hours_per_day),
      preferred_style: formData.learn_best.map((s) => LEARNING_STYLE_MAP[s] || s),
        })
      }

      const analysis = evaluateAssessment(
        { ...formData, career_goal, hours_per_day: Number(formData.hours_per_day) },
        skillAnswers
      )

      onAssessmentComplete(payload, analysis)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Something went wrong while saving your assessment.')
    } finally {
      setLoading(false)
    }
  }

  const progressPct = step === 3
    ? ((3 + (flatSkillQuestions.length ? (skillIdx + 1) / flatSkillQuestions.length : 1)) / ASSESSMENT_CATEGORIES.length) * 100
    : ((step + 1) / ASSESSMENT_CATEGORIES.length) * 100

  return (
    <div className="min-h-screen bg-mist flex flex-col font-sans text-ink">

      {/* Gradient hero banner */}
      <div className="bg-gradient-to-r from-signal to-purple-600 text-white px-6 md:px-10 pt-8 pb-14">
        <div className="max-w-5xl mx-auto">
          <div onClick={onGoHome} className="flex items-center gap-2 mb-6 cursor-pointer hover:opacity-85 transition-opacity w-fit">
            <GraduationCap className="h-6.5 w-6.5 text-white" />
            <span className="font-display font-extrabold text-lg text-white tracking-tight">CareerAgent</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-extrabold">Career Discovery Journey</h1>
          <p className="text-signal-tint mt-1.5 text-sm md:text-base">Let's calibrate a placement roadmap that actually fits you</p>
        </div>
      </div>

      {/* Progress + category nav card, overlapping the banner */}
      <div className="max-w-5xl w-full mx-auto px-6 md:px-10 -mt-8 relative z-10">
        <div className="bg-paper rounded-3xl shadow-lg border border-gray-200/60 p-5 md:p-7">
          <div className="w-full h-1.5 bg-mist rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-gradient-to-r from-signal to-purple-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="grid grid-cols-5 gap-1.5 md:gap-3">
            {ASSESSMENT_CATEGORIES.map((cat, idx) => {
              const Icon = ICONS[cat.icon]
              const isActive = idx === step
              const isDone = idx < step
              const isClickable = idx <= furthestStep
              return (
                <button
                  key={cat.id}
                  type="button"
                  disabled={!isClickable}
                  onClick={() => goToStep(idx)}
                  className={`flex flex-col items-center gap-1.5 md:gap-2 group ${isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                >
                  <span className={`h-10 w-10 md:h-14 md:w-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isActive ? 'border-signal bg-signal-tint text-signal scale-110 shadow-md shadow-signal/20' :
                    isDone ? 'border-emerald-400 bg-emerald-50 text-emerald-600' :
                    'border-gray-200 bg-mist text-slate/40'
                  }`}>
                    {isDone ? <CheckCircle2 className="h-4.5 w-4.5 md:h-5 md:w-5" /> : <Icon className="h-4.5 w-4.5 md:h-5 md:w-5" />}
                  </span>
                  <span className={`hidden sm:block text-[9px] md:text-xs font-bold text-center leading-tight ${
                    isActive ? 'text-signal' : isDone ? 'text-emerald-600' : 'text-slate/40'
                  }`}>
                    {cat.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Step content — spacious, not a tiny centered card */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-6 md:px-10 py-8">
        <div key={`${step}-${skillIdx}`} className="bg-paper rounded-3xl shadow-sm border border-gray-200/60 p-6 md:p-10 step-fade-in">

          {error && (
            <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-sm font-medium text-red-500">
              {error}
            </div>
          )}

          {/* Step 0: Personal Profile */}
          {step === 0 && (
            <div className="space-y-6">
              <SectionIntro
                icon="User" kicker="Personal Profile"
                title="Let's set up your profile"
                desc="Fill in your academic details to calibrate your roadmaps."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-1">Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Aravind Sharma" className="w-full theme-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-1">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="e.g. aravind@student.in" className="w-full theme-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-1">Age</label>
                  <input type="number" name="age" min="15" max="99" value={formData.age} onChange={handleChange} placeholder="e.g. 20" className="w-full theme-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-1">College</label>
                  <input type="text" name="college" value={formData.college} onChange={handleChange} placeholder="e.g. XYZ Institute of Technology" className="w-full theme-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-1">College Year</label>
                  <select name="year" value={formData.year} onChange={handleChange} className="w-full theme-input">
                    {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-1">Branch</label>
                  <select name="branch" value={formData.branch} onChange={handleChange} className="w-full theme-input">
                    {['CSE', 'IT', 'ECE', 'AIDS', 'AIML'].map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-1">CGPA</label>
                  <input type="number" name="cgpa" min="0" max="10" step="0.1" value={formData.cgpa} onChange={handleChange} className="w-full theme-input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-1">College Tier</label>
                  <select name="college_tier" value={formData.college_tier} onChange={handleChange} className="w-full theme-input">
                    {['Tier-1', 'Tier-2', 'Tier-3'].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <MCQQuestion q={CODING_JOURNEY_QUESTION} value={formData.coding_journey} onSingle={handleSingleSelect} />
              </div>

              <div className="flex justify-end pt-6 border-t border-mist mt-6">
                <button
                  onClick={() => validateStep0() ? advanceStep() : setError('Please fill out all fields correctly before continuing')}
                  className="px-8 py-3 rounded-full bg-signal hover:bg-signal/90 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-signal/25"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 1: Career Goals */}
          {step === 1 && (
            <div className="space-y-7">
              <SectionIntro
                icon="Target" kicker="Career Goals"
                title="Where are you headed?"
                desc="This shapes your roadmap urgency and which Skill Assessment questions you'll see next."
              />

              <div>
                <h3 className="text-base font-bold text-ink mb-3">Which field pulls you in the most right now? <span className="text-xs font-medium text-slate">(select all that apply)</span></h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                  {DOMAINS.map((d) => {
                    const isSelected = formData.domain_interest.includes(d.id)
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => handleMultiToggle('domain_interest', d.id)}
                        className={`px-4 py-3.5 text-sm font-semibold rounded-xl text-left border-2 transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-signal-tint border-signal text-signal font-bold shadow-sm'
                            : 'bg-paper border-gray-200/70 text-slate hover:bg-mist hover:border-gray-300'
                        }`}
                      >
                        {d.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {CAREER_GOAL_QUESTIONS.map((q) => (
                <MCQQuestion key={q.id} q={q} value={formData[q.id]} onSingle={handleSingleSelect} columns={q.options.length > 4 ? 1 : 2} />
              ))}

              <div className="flex gap-4 pt-6 border-t border-mist mt-6">
                <button onClick={goBack} className="px-6 py-3 rounded-full border border-signal text-signal hover:bg-signal-tint text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  onClick={() => validateStep1() ? advanceStep() : setError('Please select at least one domain and answer every question')}
                  className="flex-1 py-3 rounded-full bg-signal hover:bg-signal/90 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-signal/25"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Learning Style */}
          {step === 2 && (
            <div className="space-y-7">
              <SectionIntro
                icon="Brain" kicker="Learning Style"
                title="How do you learn best?"
                desc="We'll format your DSA and course recommendations to match your pace and style."
              />

              {LEARNING_STYLE_QUESTIONS.map((q) => (
                <MCQQuestion
                  key={q.id} q={q} value={formData[q.id]}
                  onSingle={handleSingleSelect} onMulti={handleMultiToggle}
                />
              ))}

              <div className="flex gap-4 pt-6 border-t border-mist mt-6">
                <button onClick={goBack} className="px-6 py-3 rounded-full border border-signal text-signal hover:bg-signal-tint text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  onClick={() => validateStep2() ? advanceStep() : setError('Please answer every question before continuing')}
                  className="flex-1 py-3 rounded-full bg-signal hover:bg-signal/90 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-signal/25"
                >
                  Continue to Skill Assessment
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Skill Assessment (paginated, domain-driven) */}
          {step === 3 && currentSkillQuestion && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <SectionIntro
                  icon="Cpu" kicker="Skill Assessment"
                  title="Let's see where you stand"
                  desc={`Question ${skillIdx + 1} of ${flatSkillQuestions.length} — based on the domains you picked.`}
                />
              </div>

              <SkillQuestionCard
                question={currentSkillQuestion}
                selected={skillAnswers[currentSkillQuestion.id]}
                onSelect={(key) => setSkillAnswers((prev) => ({ ...prev, [currentSkillQuestion.id]: key }))}
              />

              <div className="flex gap-4 pt-6 border-t border-mist mt-6">
                <button onClick={goBack} className="px-6 py-3 rounded-full border border-signal text-signal hover:bg-signal-tint text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  disabled={!skillAnswers[currentSkillQuestion.id]}
                  onClick={handleSkillNext}
                  className="flex-1 py-3 rounded-full bg-signal hover:bg-signal/90 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-signal/25"
                >
                  {skillIdx < flatSkillQuestions.length - 1 ? 'Next Question' : 'Continue to Personality'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Personality & Motivation */}
          {step === 4 && (
            <div className="space-y-7">
              <SectionIntro
                icon="Compass" kicker="Personality & Motivation"
                title="What keeps you consistent?"
                desc="This personalizes your risk timeline and quick-win suggestions — no wrong answers here."
              />

              {PERSONALITY_QUESTIONS.map((q) => (
                <MCQQuestion key={q.id} q={q} value={formData[q.id]} onSingle={handleSingleSelect} />
              ))}

              <div className="flex gap-4 pt-6 border-t border-mist mt-6">
                <button onClick={goBack} className="px-6 py-3 rounded-full border border-signal text-signal hover:bg-signal-tint text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5">
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  disabled={loading || !validateStep4() || !allSkillAnswered}
                  onClick={handleFinalSubmit}
                  className="flex-1 py-3 rounded-full bg-signal hover:bg-signal/90 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-signal/25"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      Building Your Roadmap...
                    </>
                  ) : (
                    <>
                      See My Results
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default Onboarding
