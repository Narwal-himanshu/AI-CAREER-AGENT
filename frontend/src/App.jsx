import React, { useState } from 'react'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'
import QuizPage from './pages/QuizPage'
import Dashboard from './pages/Dashboard'
import Opportunities from './pages/Opportunities'
import Roadmap from './pages/Roadmap'
import DSA from './pages/DSA'
import Courses from './pages/Courses'
import Sidebar from './components/Sidebar'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const [studentProfile, setStudentProfile] = useState(null)
  const [quizQuestions, setQuizQuestions] = useState([])
  const [quizAnalysis, setQuizAnalysis] = useState(null)

  // Handle Login trigger
  const handleLogin = async () => {
    navigate('/roadmap')
  }

  // Handle Log out trigger
  const handleLogout = async () => {
    setStudentProfile(null)
    setQuizQuestions([])
    setQuizAnalysis(null)
    navigate('/')
  }

  // Start quiz session helper
  const handleStartQuiz = (profile, questions) => {
    setStudentProfile(profile)
    setQuizQuestions(questions)
    navigate('/quiz')
  }

  // Complete quiz assessment helper
  const handleQuizComplete = (analysis) => {
    setQuizAnalysis(analysis)
    navigate('/dashboard')
  }

  // Hide sidebar during landing page, onboarding, and quiz taking
  const showSidebar = !['/', '/onboarding', '/quiz'].includes(location.pathname)

  return (
    <div className="min-h-screen bg-paper text-ink flex">
      {showSidebar && (
        <Sidebar 
          onRestart={handleLogout}
          onGoHome={handleLogout}
        />
      )}
      <main className="flex-1 transition-all duration-300 min-h-screen">
        <Routes>
          <Route path="/" element={<Home onStartAssessment={handleLogin} />} />
          <Route path="/onboarding" element={<Onboarding onStartQuiz={handleStartQuiz} onGoHome={handleLogout} />} />
          <Route path="/quiz" element={<QuizPage profile={studentProfile} questions={quizQuestions} onComplete={handleQuizComplete} onGoHome={handleLogout} />} />
          <Route path="/dashboard" element={<Dashboard profile={studentProfile} analysis={quizAnalysis} onRestart={handleLogout} />} />
          <Route path="/opportunities" element={<Opportunities profile={studentProfile} analysis={quizAnalysis} />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/dsa" element={<DSA />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
