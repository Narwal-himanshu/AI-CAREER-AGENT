import React, { useState, useEffect } from 'react'
import { Timer, ArrowRight, Loader2, Award, GraduationCap } from 'lucide-react'
import { auth } from '../firebase'

function QuizPage({ profile, questions, onComplete, onGoHome }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({}) // maps q_id to selected option
  const [timings, setTimings] = useState({}) // maps q_id to time elapsed in seconds
  const [questionTimeLeft, setQuestionTimeLeft] = useState(60)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const currentQuestion = questions[currentIdx]

  // Initialize/Reset question timer when index changes
  useEffect(() => {
    if (currentQuestion) {
      setQuestionTimeLeft(currentQuestion.estimated_time_seconds || 60)
    }
  }, [currentIdx, questions])

  // Clock Countdown and Timings Accumulator
  useEffect(() => {
    const timer = setInterval(() => {
      // Increment elapsed time for this question
      if (currentQuestion) {
        const qId = currentQuestion.question_id
        setTimings((prev) => ({
          ...prev,
          [qId]: (prev[qId] || 0) + 1
        }))
      }

      // Decrement countdown
      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          handleNextQuestion()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentIdx, currentQuestion])

  const handleSelectOption = (option) => {
    if (currentQuestion) {
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.question_id]: option
      }))
    }
  }

  const handleNextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1)
    }
  }

  const handlePrevQuestion = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    const total_time_seconds = Object.values(timings).reduce((a, b) => a + b, 0)

    const quiz_answers = questions.map((q) => {
      const qId = q.question_id
      const selected = answers[qId] || 'A'
      return {
        question_id: qId,
        question_text: q.question_text,
        selected_option: selected,
        correct_option: q.correct_option,
        topic: q.topic,
        difficulty: q.difficulty,
        time_taken_seconds: timings[qId] || 45
      }
    })

    const payload = {
      student_id: profile.student_id,
      session_id: 'session-' + Math.random().toString(36).substring(2, 15),
      quiz_answers,
      total_time_seconds,
    }

    try {
      const token = (auth.currentUser && auth.app.options.apiKey !== "AIzaSyAky5V_XMkaW9UZd3dZY8_BfldB_WSrIMY") 
        ? await auth.currentUser.getIdToken() 
        : 'mock-uid-123'
      const response = await fetch('http://localhost:8000/api/quiz/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errDetail = await response.json()
        throw new Error(errDetail.detail || 'Failed to submit quiz assessment.')
      }

      const analysisData = await response.json()
      onComplete(analysisData)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Submission failed. Check API server connection.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!currentQuestion) {
    return (
      <div className="flex h-screen items-center justify-center bg-paper">
        <Loader2 className="h-8 w-8 animate-spin text-signal" />
      </div>
    )
  }

  const progressPct = ((currentIdx + 1) / questions.length) * 100
  const selectedOption = answers[currentQuestion.question_id]

  return (
    <div className="min-h-screen bg-mist flex flex-col font-sans text-ink">
      
      {/* Persistent Header */}
      <header className="fixed top-0 inset-x-0 h-16 border-b border-mist bg-paper/95 backdrop-blur-md z-30 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
          <div onClick={onGoHome} className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity">
            <GraduationCap className="h-6.5 w-6.5 text-signal" />
            <span className="font-display font-extrabold text-lg text-ink tracking-tight">CareerAgent</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Question progress */}
            <span className="text-xs font-semibold text-slate">
              Question {currentIdx + 1} of {questions.length}
            </span>
            {/* Time Countdown */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-signal-tint border border-signal/10 text-xs font-bold text-signal">
              <Timer className={`h-3.5 w-3.5 ${questionTimeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-signal'}`} />
              <span className={questionTimeLeft <= 10 ? 'text-red-500 font-extrabold' : 'text-signal font-mono'}>
                {questionTimeLeft}s
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main card viewport */}
      <div className="flex-1 pt-24 pb-12 flex items-center justify-center px-6">
        <div className="w-full max-w-2xl theme-card bg-paper p-8 relative shadow-sm border border-gray-200/60">

          {error && (
            <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-sm font-medium text-red-500">
              {error}
            </div>
          )}

          {/* Progress bar */}
          <div className="w-full bg-mist h-1.5 rounded-full mb-6 overflow-hidden">
            <div 
              className="bg-signal h-full rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>

          {/* Question Details */}
          <div className="space-y-6">
            <div>
              <div className="flex gap-2 items-center text-[10px] font-bold text-signal uppercase tracking-widest mb-1.5">
                <span>{currentQuestion.topic}</span>
                <span>•</span>
                <span className={`px-2 py-0.5 rounded ${
                  currentQuestion.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-600' :
                  currentQuestion.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-600' :
                  'bg-red-500/10 text-red-600'
                }`}>{currentQuestion.difficulty}</span>
              </div>
              <h3 className="text-base font-display font-bold text-ink leading-relaxed">
                {currentQuestion.question_text}
              </h3>
            </div>

            {/* Options grid */}
            <div className="space-y-2.5">
              {Object.entries(currentQuestion.options).map(([key, text]) => {
                const isSelected = selectedOption === key
                return (
                  <button
                    key={key}
                    onClick={() => handleSelectOption(key)}
                    className={`w-full px-5 py-4 text-xs font-semibold rounded-xl text-left border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-signal-tint border-signal text-signal font-bold shadow-sm' 
                        : 'bg-paper border-gray-200/60 text-slate hover:bg-mist hover:text-ink'
                    }`}
                  >
                    <span className={`inline-flex items-center justify-center h-5 w-5 rounded-md mr-3 text-[10px] font-bold ${
                      isSelected ? 'bg-signal text-white' : 'bg-mist text-slate'
                    }`}>
                      {key}
                    </span>
                    {text}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-mist">
            <button
              onClick={handlePrevQuestion}
              disabled={currentIdx === 0}
              className="px-5 py-2.5 rounded-full border border-signal hover:bg-signal-tint text-xs font-bold text-signal disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Previous
            </button>

            {currentIdx < questions.length - 1 ? (
              <button
                onClick={handleNextQuestion}
                className="px-6 py-3 rounded-full bg-signal hover:bg-signal/90 text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-signal/20"
              >
                Next Question
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                disabled={submitting}
                onClick={handleSubmit}
                className="px-6 py-3 rounded-full bg-signal hover:bg-signal/90 text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-signal/20"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    Analyzing Skills...
                  </>
                ) : (
                  <>
                    Submit Assessment
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

export default QuizPage
