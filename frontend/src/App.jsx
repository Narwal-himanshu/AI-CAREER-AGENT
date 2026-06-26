import React, { useState } from 'react'
import Onboarding from './pages/Onboarding'
import QuizPage from './pages/QuizPage'
import Dashboard from './pages/Dashboard'
import Opportunities from './pages/Opportunities'
import Sidebar from './components/Sidebar'

function App() {
  const [currentPage, setCurrentPage] = useState('onboarding')
  const [studentProfile, setStudentProfile] = useState(null)
  const [quizQuestions, setQuizQuestions] = useState([])
  const [quizAnalysis, setQuizAnalysis] = useState(null)

  // Start quiz session helper
  const handleStartQuiz = (profile, questions) => {
    setStudentProfile(profile)
    setQuizQuestions(questions)
    setCurrentPage('quiz')
  }

  // Complete quiz assessment helper
  const handleQuizComplete = (analysis) => {
    setQuizAnalysis(analysis)
    setCurrentPage('dashboard')
  }

  // Restart onboarding helper
  const handleRestart = () => {
    setStudentProfile(null)
    setQuizQuestions([])
    setQuizAnalysis(null)
    setCurrentPage('onboarding')
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'onboarding':
        return <Onboarding onStartQuiz={handleStartQuiz} />
      case 'quiz':
        return (
          <QuizPage 
            profile={studentProfile} 
            questions={quizQuestions} 
            onComplete={handleQuizComplete} 
          />
        )
      case 'dashboard':
        return (
          <Dashboard 
            profile={studentProfile} 
            analysis={quizAnalysis} 
            onRestart={handleRestart} 
          />
        )
      case 'opportunities':
        return (
          <Opportunities 
            profile={studentProfile} 
            analysis={quizAnalysis} 
          />
        )
      default:
        return <Onboarding onStartQuiz={handleStartQuiz} />
    }
  }

  // Hide sidebar during onboarding and active quiz taking for focus
  const showSidebar = currentPage === 'dashboard' || currentPage === 'opportunities'

  return (
    <div className="min-h-screen bg-[#0b0f19] flex">
      {showSidebar && (
        <Sidebar 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          onRestart={handleRestart}
        />
      )}
      <main className={`flex-1 ${showSidebar ? 'md:pl-64' : ''} transition-all duration-300 min-h-screen`}>
        {renderPage()}
      </main>
    </div>
  )
}

export default App
