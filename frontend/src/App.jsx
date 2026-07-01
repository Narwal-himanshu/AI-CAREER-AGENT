import React, { useState } from 'react'
import Home from './pages/Home'
import Login from './pages/Login'
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

  // Handle Login trigger — show login page
  const handleLogin = async () => {
    navigate('/login')
  }

  // Handle Login form submit — authenticate and redirect appropriately
  const handleLoginSubmit = (mode) => {
    if (mode === 'signup') {
      navigate('/onboarding')
    } else {
      // mode === 'dashboard'
      navigate('/dashboard')
    }
  }

  // Opportunities feed doesn't require profile setup - go straight to the page
  const handleGoToOpportunities = () => {
    navigate('/opportunities')
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
  const showSidebar = !['/', '/login', '/onboarding', '/quiz'].includes(location.pathname)

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
          <Route path="/" element={<Home onStartAssessment={handleLogin} onGoToOpportunities={handleGoToOpportunities} />} />
          <Route path="/login" element={<Login onLogin={handleLoginSubmit} onGoHome={handleLogout} />} />
          <Route path="/onboarding" element={<Onboarding onStartQuiz={handleStartQuiz} onGoHome={handleLogout} />} />
          <Route path="/quiz" element={<QuizPage profile={studentProfile} questions={quizQuestions} onComplete={handleQuizComplete} onGoHome={handleLogout} />} />
          <Route path="/dashboard" element={
            studentProfile ? <Dashboard profile={studentProfile} analysis={quizAnalysis} onRestart={handleLogout} /> : <Navigate to="/onboarding" replace />
          } />
          <Route path="/opportunities" element={<Opportunities profile={studentProfile} analysis={quizAnalysis} />} />
          <Route path="/roadmap" element={
            studentProfile ? <Roadmap /> : <Navigate to="/onboarding" replace />
          } />
          <Route path="/dsa" element={
            studentProfile ? <DSA /> : <Navigate to="/onboarding" replace />
          } />
          <Route path="/courses" element={
            studentProfile ? <Courses /> : <Navigate to="/onboarding" replace />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
