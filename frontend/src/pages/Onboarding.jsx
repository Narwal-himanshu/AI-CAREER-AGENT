import React, { useState } from 'react'
import { GraduationCap, ArrowRight, Loader2, Sparkles, BookOpen, Target, Calendar } from 'lucide-react'
import { auth } from '../firebase'

function Onboarding({ onStartQuiz, onGoHome }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Onboarding Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    year: 2,
    branch: 'CSE',
    cgpa: 8.0,
    college: '',
    college_tier: 'Tier-2',
    domain_interest: ['DSA/CP'],
    career_goal: 'Placement',
    hours_per_day: 2,
    preferred_style: ['Video', 'Projects']
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectToggle = (field, item) => {
    setFormData((prev) => {
      const current = prev[field]
      const updated = current.includes(item)
        ? current.filter((x) => x !== item)
        : [...current, item]
      return { ...prev, [field]: updated }
    })
  }

  const validateStep1 = () => {
    return formData.name && formData.email && formData.college && formData.cgpa >= 0 && formData.cgpa <= 10
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    const student_id = 'stu-' + Math.random().toString(36).substring(2, 15)

    const payload = {
      student_id,
      profile: {
        name: formData.name,
        email: formData.email,
        year: Number(formData.year),
        branch: formData.branch,
        cgpa: Number(formData.cgpa),
        college: formData.college,
        college_tier: formData.college_tier
      },
      domain_interest: formData.domain_interest,
      career_goal: formData.career_goal,
      time_and_style: {
        hours_per_day: Number(formData.hours_per_day),
        preferred_style: formData.preferred_style
      }
    }

    try {
      const token = (auth.currentUser && auth.app.options.apiKey !== "AIzaSyAky5V_XMkaW9UZd3dZY8_BfldB_WSrIMY") 
        ? await auth.currentUser.getIdToken() 
        : 'mock-uid-123'
      const response = await fetch('http://localhost:8000/api/quiz/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errDetail = await response.json()
        throw new Error(errDetail.detail || 'Failed to generate assessment quiz.')
      }

      const quizData = await response.json()
      onStartQuiz(payload, quizData.questions)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Connecting to backend failed. Make sure the FastAPI server is running on port 8000.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-mist flex flex-col font-sans text-ink">
      
      {/* Persistent Header */}
      <header className="fixed top-0 inset-x-0 h-16 border-b border-mist bg-paper/95 backdrop-blur-md z-30 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
          <div onClick={onGoHome} className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity">
            <GraduationCap className="h-6.5 w-6.5 text-signal" />
            <span className="font-display font-extrabold text-lg text-ink tracking-tight">CareerAgent</span>
          </div>
          <span className="text-xs font-bold text-slate uppercase tracking-wider">
            Step {step} of 3
          </span>
        </div>
      </header>

      {/* Main card viewport */}
      <div className="flex-1 pt-24 pb-12 flex items-center justify-center px-6">
        <div className="w-full max-w-xl theme-card bg-paper p-8 relative shadow-sm border border-gray-200/60">

          {error && (
            <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-sm font-medium text-red-500">
              {error}
            </div>
          )}

          {/* Step 1: Academic & Profile Details */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-signal-tint text-signal px-3 py-1 rounded-lg text-xs font-bold mb-2">
                  <Sparkles className="h-3.5 w-3.5 text-signal" />
                  Personal Profile
                </div>
                <h2 className="text-xl font-display font-bold text-ink">
                  Let's set up your profile
                </h2>
                <p className="text-xs text-slate mt-1">Fill in your academic details to calibrate your roadmaps.</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-1">Name</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Aravind Sharma" 
                    className="w-full theme-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-1">Email</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. aravind@student.in" 
                    className="w-full theme-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-1">College Year</label>
                    <select 
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className="w-full theme-input bg-paper"
                    >
                      <option value={1}>1st Year</option>
                      <option value={2}>2nd Year</option>
                      <option value={3}>3rd Year</option>
                      <option value={4}>4th Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-1">Branch</label>
                    <select 
                      name="branch"
                      value={formData.branch}
                      onChange={handleChange}
                      className="w-full theme-input bg-paper"
                    >
                      <option value="CSE">CSE</option>
                      <option value="IT">IT</option>
                      <option value="ECE">ECE</option>
                      <option value="AIDS">AIDS</option>
                      <option value="AIML">AIML</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-1">College Name</label>
                  <input 
                    type="text" 
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                    placeholder="e.g. VIT Vellore" 
                    className="w-full theme-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-1">College Tier</label>
                    <select 
                      name="college_tier"
                      value={formData.college_tier}
                      onChange={handleChange}
                      className="w-full theme-input bg-paper"
                    >
                      <option value="IIT">IIT</option>
                      <option value="NIT">NIT</option>
                      <option value="IIIT">IIIT</option>
                      <option value="Tier-1">Tier-1 Private/Govt</option>
                      <option value="Tier-2">Tier-2 College</option>
                      <option value="Tier-3">Tier-3 College</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-1">CGPA (out of 10)</label>
                    <input 
                      type="number" 
                      name="cgpa"
                      step="0.01"
                      min="0"
                      max="10"
                      value={formData.cgpa}
                      onChange={handleChange}
                      className="w-full theme-input"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => validateStep1() ? setStep(2) : setError('Please fill out all fields correctly')}
                className="w-full mt-6 py-3 rounded-full bg-signal hover:bg-signal/90 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-signal/25"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Step 2: Interests & Goals */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-signal-tint text-signal px-3 py-1 rounded-lg text-xs font-bold mb-2">
                  <Target className="h-3.5 w-3.5 text-signal" />
                  Target Goals
                </div>
                <h2 className="text-xl font-display font-bold text-ink">
                  Interests & Goals
                </h2>
                <p className="text-xs text-slate mt-1">Specify your career aspirations and primary technical domains.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-2">Primary Domain Interest (Select multiple)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['DSA/CP', 'Web Development', 'AI/ML', 'Cloud', 'CyberSec', 'Mobile'].map((domain) => {
                      const isSelected = formData.domain_interest.includes(domain)
                      return (
                        <button
                          key={domain}
                          type="button"
                          onClick={() => handleSelectToggle('domain_interest', domain)}
                          className={`px-4 py-3 text-xs font-semibold rounded-xl text-left border transition-all ${
                            isSelected 
                              ? 'bg-signal-tint border-signal text-signal font-bold' 
                              : 'bg-paper border-gray-200/60 text-slate hover:bg-mist hover:text-ink'
                          }`}
                        >
                          {domain}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-2">Career Goal</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Placement', 'GATE', 'Startup', 'Research', 'Higher Studies'].map((goal) => {
                      const isSelected = formData.career_goal === goal
                      return (
                        <button
                          key={goal}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, career_goal: goal }))}
                          className={`px-4 py-3 text-xs font-semibold rounded-xl text-left border transition-all ${
                            isSelected 
                              ? 'bg-signal-tint border-signal text-signal font-bold' 
                              : 'bg-paper border-gray-200/60 text-slate hover:bg-mist hover:text-ink'
                          }`}
                        >
                          {goal}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 rounded-full border border-signal text-signal hover:bg-signal-tint text-sm font-bold transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={() => formData.domain_interest.length > 0 ? setStep(3) : setError('Select at least one domain interest')}
                  className="flex-1 py-3 rounded-full bg-signal hover:bg-signal/90 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-signal/25"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Time availability & Learning Styles */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-signal-tint text-signal px-3 py-1 rounded-lg text-xs font-bold mb-2">
                  <Calendar className="h-3.5 w-3.5 text-signal" />
                  Learning Pace
                </div>
                <h2 className="text-xl font-display font-bold text-ink">
                  Schedule & Learning Style
                </h2>
                <p className="text-xs text-slate mt-1">Lastly, indicate your learning pace and preference style.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-2">
                    Daily Study commitment: {formData.hours_per_day} hours/day
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    name="hours_per_day"
                    value={formData.hours_per_day}
                    onChange={handleChange}
                    className="w-full accent-signal cursor-pointer bg-gray-200 h-1.5 rounded-lg"
                  />
                  <div className="flex justify-between text-xs text-slate mt-1 font-medium">
                    <span>1 hour</span>
                    <span>6 hours</span>
                    <span>12 hours</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate uppercase tracking-wider mb-2">Preferred Learning style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Video', 'Reading', 'Projects', 'Hands-on'].map((style) => {
                      const isSelected = formData.preferred_style.includes(style)
                      return (
                        <button
                          key={style}
                          type="button"
                          onClick={() => handleSelectToggle('preferred_style', style)}
                          className={`px-4 py-3 text-xs font-semibold rounded-xl text-left border transition-all ${
                            isSelected 
                              ? 'bg-signal-tint border-signal text-signal font-bold' 
                              : 'bg-paper border-gray-200/60 text-slate hover:bg-mist hover:text-ink'
                          }`}
                        >
                          {style}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  disabled={loading}
                  onClick={() => setStep(2)}
                  className="w-1/3 py-3 rounded-full border border-signal text-signal hover:bg-signal-tint text-sm font-bold transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  disabled={loading || formData.preferred_style.length === 0}
                  onClick={handleSubmit}
                  className="flex-1 py-3 rounded-full bg-signal hover:bg-signal/90 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-signal/25"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      Generating Quiz...
                    </>
                  ) : (
                    <>
                      Start Assessment Quiz
                      <BookOpen className="h-4 w-4" />
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
