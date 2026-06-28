import React, { useState, useEffect, useRef } from 'react'
import { auth, googleProvider } from './firebase'
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth'
import Home from './pages/Home'
import Onboarding from './pages/Onboarding'
import QuizPage from './pages/QuizPage'
import Dashboard from './pages/Dashboard'
import Opportunities from './pages/Opportunities'
import Sidebar from './components/Sidebar'
import { Loader2, GraduationCap } from 'lucide-react'

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [statusLoading, setStatusLoading] = useState(false)
  const [dbStatus, setDbStatus] = useState(null)

  const isMockModeRef = useRef(false)

  const [currentPage, setCurrentPage] = useState('home')
  const [studentProfile, setStudentProfile] = useState(null)
  const [quizQuestions, setQuizQuestions] = useState([])
  const [quizAnalysis, setQuizAnalysis] = useState(null)

  // Listen to Firebase Auth state
  useEffect(() => {
    // Timeout loading state after 2.5s if Firebase hangs on invalid credentials
    const loaderTimeout = setTimeout(() => {
      setAuthLoading(false)
    }, 2500)

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      clearTimeout(loaderTimeout)
      if (user) {
        isMockModeRef.current = false
        if (auth.app.options.apiKey === "AIzaSyAky5V_XMkaW9UZd3dZY8_BfldB_WSrIMY") {
          console.warn("Stale Firebase session detected on invalid API key. Signing out.")
          await signOut(auth)
          setCurrentUser(null)
          setDbStatus(null)
          setAuthLoading(false)
          setCurrentPage('home')
          return
        }
        setCurrentUser(user)
        await syncUserStatus(user)
      } else {
        if (isMockModeRef.current) {
          return
        }
        setCurrentUser(null)
        setDbStatus(null)
        setAuthLoading(false)
        setCurrentPage('home')
      }
    })
    return () => {
      clearTimeout(loaderTimeout)
      unsubscribe()
    }
  }, [])

  // Retrieves student's progress and routes them accordingly
  const syncUserStatus = async (user) => {
    setStatusLoading(true)
    try {
      const token = user.getIdToken ? await user.getIdToken() : `mock-uid-${user.uid}`
      
      const response = await fetch('http://localhost:8000/me/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const statusData = await response.json()
        setDbStatus(statusData)

        if (statusData.quiz_complete) {
          // Returning student who has finished the quiz -> route to Dashboard
          const dashRes = await fetch('http://localhost:8000/api/dashboard', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (dashRes.ok) {
            const dashData = await dashRes.json()
            setQuizAnalysis(dashData)
            setStudentProfile(dashData) // Store profile summary context
            setCurrentPage('dashboard')
          } else {
            setCurrentPage('onboarding')
          }
        } else if (statusData.onboarding_complete) {
          // Returning student who onboarded but hasn't taken/finished the quiz
          const onboardRes = await fetch('http://localhost:8000/api/onboarding', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (onboardRes.ok) {
            const onboardData = await onboardRes.json()
            setStudentProfile(onboardData)
          }

          const quizRes = await fetch('http://localhost:8000/api/quiz/generate', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (quizRes.ok) {
            const quizData = await quizRes.json()
            setQuizQuestions(quizData.questions)
            setCurrentPage('quiz')
          } else {
            setCurrentPage('onboarding')
          }
        } else {
          // New student signed in, onboarding is incomplete -> route to Onboarding
          setCurrentPage('onboarding')
        }
      } else {
        setCurrentPage('onboarding')
      }
    } catch (err) {
      console.error("Authentication status sync failed:", err)
      setCurrentPage('onboarding')
    } finally {
      setStatusLoading(false)
      setAuthLoading(false)
    }
  }

  // Handle Google Sign-in trigger
  const handleLogin = async () => {
    setAuthLoading(true)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      console.error("Sign in failed:", err)
      
      // Fallback dev sign-in for testing when Firebase credentials are not yet configured
      if (
        err.code === 'auth/configuration-not-found' || 
        err.code === 'auth/operation-not-allowed' || 
        err.code === 'auth/api-key-not-valid' ||
        err.message?.toLowerCase().includes('api-key') ||
        err.message?.toLowerCase().includes('api key') ||
        err.message?.includes('authDomain')
      ) {
        console.warn("Firebase Auth unconfigured. Starting local developer mock session.")
        const mockUser = {
          uid: 'mock-uid-999',
          displayName: 'Aravind Sharma',
          email: 'aravind@btech.in'
        }
        isMockModeRef.current = true
        setCurrentUser(mockUser)
        await syncUserStatus(mockUser)
      } else {
        alert("Google Authentication failed: " + err.message)
        setAuthLoading(false)
      }
    }
  }

  // Handle Log out trigger
  const handleLogout = async () => {
    setAuthLoading(true)
    try {
      if (auth.currentUser) {
        isMockModeRef.current = false
        await signOut(auth)
      } else {
        // Clear mock user session
        isMockModeRef.current = false
        setCurrentUser(null)
        setDbStatus(null)
        setAuthLoading(false)
        setCurrentPage('home')
      }
    } catch (err) {
      console.error("Logout failed:", err)
      setAuthLoading(false)
    }
  }

  // Start quiz session helper (from onboarding page transition)
  const handleStartQuiz = (profile, questions) => {
    setStudentProfile(profile)
    setQuizQuestions(questions)
    setCurrentPage('quiz')
  }

  // Complete quiz assessment helper (from quiz submission)
  const handleQuizComplete = (analysis) => {
    setQuizAnalysis(analysis)
    setCurrentPage('dashboard')
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onStartAssessment={handleLogin} />
      case 'onboarding':
        return (
          <Onboarding 
            onStartQuiz={handleStartQuiz} 
            onGoHome={handleLogout} 
          />
        )
      case 'quiz':
        return (
          <QuizPage 
            profile={studentProfile} 
            questions={quizQuestions} 
            onComplete={handleQuizComplete} 
            onGoHome={handleLogout}
          />
        )
      case 'dashboard':
        return (
          <Dashboard 
            profile={studentProfile} 
            analysis={quizAnalysis} 
            onRestart={handleLogout} 
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
        return <Home onStartAssessment={handleLogin} />
    }
  }

  // Render a high-fidelity loading spinner on auth state resolving
  if (authLoading || statusLoading) {
    return (
      <div className="min-h-screen bg-mist flex flex-col items-center justify-center font-sans text-ink">
        <div className="theme-card bg-paper p-8 rounded-2xl border border-gray-200/60 shadow-sm flex flex-col items-center gap-4">
          <GraduationCap className="h-10 w-10 text-signal animate-pulse" />
          <div className="flex items-center gap-2">
            <Loader2 className="h-4.5 w-4.5 animate-spin text-signal" />
            <span className="text-xs font-bold text-slate uppercase tracking-widest">
              Resolving Session...
            </span>
          </div>
          {/* Dev Bypass helper for invalid client project IDs */}
          <button
            onClick={async () => {
              console.warn("Bypassing auth check. Starting local developer mock session.")
              const mockUser = {
                uid: 'mock-uid-999',
                displayName: 'Aravind Sharma',
                email: 'aravind@btech.in'
              }
              isMockModeRef.current = true
              setCurrentUser(mockUser)
              await syncUserStatus(mockUser)
            }}
            className="mt-4 px-5 py-2.5 bg-signal hover:bg-signal/90 text-xs font-bold text-white rounded-full transition-all shadow-md shadow-signal/15 cursor-pointer"
          >
            Bypass to Dev Sandbox
          </button>
        </div>
      </div>
    )
  }

  // Hide sidebar during landing page, onboarding, and quiz taking
  const showSidebar = currentPage === 'dashboard' || currentPage === 'opportunities'

  return (
    <div className="min-h-screen bg-paper text-ink flex">
      {showSidebar && (
        <Sidebar 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
          onRestart={handleLogout}
          onGoHome={handleLogout}
        />
      )}
      <main className="flex-1 transition-all duration-300 min-h-screen">
        {renderPage()}
      </main>
    </div>
  )
}

export default App
