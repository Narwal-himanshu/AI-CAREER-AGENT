import React, { useState, useEffect } from 'react'
import { Timer, ArrowRight, Loader2, Award } from 'lucide-react'

function QuizPage({ profile, questions, onComplete }) {
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
          // Time is up! Move to next question or stay
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

    // Calculate total time
    const total_time_seconds = Object.values(timings).reduce((a, b) => a + b, 0)

    // Format quiz answers payload
    const quiz_answers = questions.map((q) => {
      const qId = q.question_id
      const selected = answers[qId] || 'A' // default to 'A' if unanswered
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
      const response = await fetch('http://localhost:8000/api/quiz/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      <div className="flex h-screen items-center justify-center bg-[#0b0f19]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    )
  }

  const progressPct = ((currentIdx + 1) / questions.length) * 100
  const selectedOption = answers[currentQuestion.question_id]

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-gradient-to-tr from-[#080b11] via-[#0b0f19] to-[#121021]">
      <div className="w-full max-w-2xl glass-panel p-8 relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-violet-600/10 blur-3xl"></div>

        {/* Header Dashboard */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Award className="h-6 w-6 text-violet-500" />
            <span className="font-bold text-white text-md">Diagnostic Assessment</span>
          </div>

          {/* Time Remaining Timer */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 text-sm font-semibold">
            <Timer className={`h-4 w-4 ${questionTimeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-violet-400'}`} />
            <span className={questionTimeLeft <= 10 ? 'text-red-400 font-bold' : 'text-gray-300'}>
              {questionTimeLeft}s
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/5 h-2 rounded-full mb-8 overflow-hidden">
          <div 
            className="bg-violet-600 h-full rounded-full transition-all duration-300 shadow-md shadow-violet-500/30"
            style={{ width: `${progressPct}%` }}
          ></div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-sm font-medium text-red-400">
            {error}
          </div>
        )}

        {/* Question Content */}
        <div className="space-y-6">
          <div>
            <div className="flex gap-2 items-center text-xs font-semibold text-violet-400 uppercase tracking-widest mb-2">
              <span>Question {currentIdx + 1} of {questions.length}</span>
              <span>•</span>
              <span>{currentQuestion.topic}</span>
              <span>•</span>
              <span className={`px-2 py-0.5 rounded text-[10px] ${
                currentQuestion.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400' :
                currentQuestion.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400' :
                'bg-red-500/10 text-red-400'
              }`}>{currentQuestion.difficulty}</span>
            </div>
            <h3 className="text-lg font-bold text-white leading-relaxed">
              {currentQuestion.question_text}
            </h3>
          </div>

          {/* Options grid */}
          <div className="space-y-3">
            {Object.entries(currentQuestion.options).map(([key, text]) => {
              const isSelected = selectedOption === key
              return (
                <button
                  key={key}
                  onClick={() => handleSelectOption(key)}
                  className={`w-full px-5 py-4 text-sm font-medium rounded-xl text-left border transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-violet-600/15 border-violet-500 text-violet-300 font-bold shadow-md shadow-violet-500/10' 
                      : 'bg-white/3 border-white/5 text-gray-300 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <span className={`inline-flex items-center justify-center h-6 w-6 rounded-lg mr-3 text-xs font-bold ${
                    isSelected ? 'bg-violet-600 text-white shadow' : 'bg-white/5 text-gray-400'
                  }`}>
                    {key}
                  </span>
                  {text}
                </button>
              )
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5">
          <button
            onClick={handlePrevQuestion}
            disabled={currentIdx === 0}
            className="px-5 py-2.5 rounded-xl border border-white/5 bg-white/3 hover:bg-white/5 text-xs font-bold text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Previous
          </button>

          {currentIdx < questions.length - 1 ? (
            <button
              onClick={handleNextQuestion}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-violet-600/20"
            >
              Next Question
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              disabled={submitting}
              onClick={handleSubmit}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-violet-600/20"
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
  )
}

export default QuizPage
