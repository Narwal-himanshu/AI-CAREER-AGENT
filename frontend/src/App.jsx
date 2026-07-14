import React, { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from './firebase'
import {
  ensureUserAndRecordLogin,
  saveUserProfile,
  saveQuizResult,
  computeReadinessScore,
  computeReadinessLabel
} from './lib/profileStore'
import Home from './pages/Home'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import QuizPage from './pages/QuizPage'
import Dashboard from './pages/Dashboard'
import Opportunities from './pages/Opportunities'
import Roadmap from './pages/Roadmap'
import DSA from './pages/DSA'
import Courses from './pages/Courses'
import Resume from './pages/Resume'
import Profile from './pages/Profile'
import Sidebar from './components/Sidebar'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const [authUser, setAuthUser] = useState(null)
  const [authToken, setAuthToken] = useState(null)
  const [userDoc, setUserDoc] = useState(null)
  const [studentProfile, setStudentProfile] = useState(null)
  const [quizQuestions, setQuizQuestions] = useState([])
  const [quizAnalysis, setQuizAnalysis] = useState(null)

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthUser(user)
        const token = await user.getIdToken()
        setAuthToken(token)

        // Create/refresh the Firestore user doc and update the login streak
        try {
          const doc = await ensureUserAndRecordLogin(user.uid, user.email)
          setUserDoc(doc)

          // Rehydrate a previously completed assessment (if any) so a page
          // refresh doesn't force the user back through onboarding.
          if (doc?.quizProfilePayload && doc?.analysis) {
            setStudentProfile(doc.quizProfilePayload)
            setQuizAnalysis(doc.analysis)
          }
        } catch (err) {
          console.error('Failed to sync user profile:', err)
        }
      } else {
        setAuthUser(null)
        setAuthToken(null)
        setUserDoc(null)
      }
    })
    return () => unsub()
  }, [])

  // Handle Login trigger — show login page, or jump straight to onboarding if already signed in
  const handleLogin = async () => {
    if (authUser) {
      navigate('/onboarding')
    } else {
      navigate('/login')
    }
  }

  // Handle successful Firebase auth — navigate based on mode
  const handleLoginSubmit = async (user) => {
    const token = await user.getIdToken()
    setAuthUser(user)
    setAuthToken(token)
    try {
      const doc = await ensureUserAndRecordLogin(user.uid, user.email)
      setUserDoc(doc)
      if (doc?.quizProfilePayload && doc?.analysis) {
        setStudentProfile(doc.quizProfilePayload)
        setQuizAnalysis(doc.analysis)
      }
    } catch (err) {
      console.error('Failed to sync user profile:', err)
    }
    navigate('/')
  }

  // Opportunities feed doesn't require profile setup - go straight to the page
  const handleGoToOpportunities = () => {
    navigate('/opportunities')
  }

  // Central router for the Product mega-menu / feature showcase buttons.
  // Sends the user to the right real page instead of always re-triggering the assessment.
  const handleFeatureNav = (key) => {
    if (!authUser) {
      navigate('/login')
      return
    }
    const routes = {
      roadmap: '/roadmap',
      dsa: '/dsa',
      courses: '/courses',
      resume: '/resume',
      chatbot: studentProfile ? '/dashboard' : '/onboarding'
    }
    navigate(routes[key] || '/onboarding')
  }

  // Handle Log out
  const handleLogout = async () => {
    await signOut(auth)
    setAuthUser(null)
    setAuthToken(null)
    setUserDoc(null)
    setStudentProfile(null)
    setQuizQuestions([])
    setQuizAnalysis(null)
    navigate('/')
  }

  // Navigate to home without logging out
  const handleNavigateHome = () => {
    navigate('/')
  }

  // Restart the assessment (does NOT sign the user out — just clears the quiz state)
  const handleRestartAssessment = () => {
    setStudentProfile(null)
    setQuizQuestions([])
    setQuizAnalysis(null)
    navigate('/onboarding')
  }

  const handleGoToProfile = () => {
    navigate('/profile')
  }

  // Persist profile fields (name, age, course, interests, goal, etc.) to Firestore
  const handleSaveProfile = async (profileFields) => {
    if (!authUser) return
    await saveUserProfile(authUser.uid, profileFields)
    setUserDoc((prev) => ({ ...(prev || {}), profile: profileFields }))
  }

  // Start quiz session helper
  const handleStartQuiz = (profile, questions) => {
    setStudentProfile(profile)
    setQuizQuestions(questions)
    navigate('/quiz')
  }

  // Persist the finished quiz analysis to Firestore so it survives refreshes
  const handleQuizFinished = async (profile, analysis) => {
    if (!authUser) return
    await saveQuizResult(authUser.uid, profile, analysis)
    setUserDoc((prev) => ({ ...(prev || {}), quizProfilePayload: profile, analysis }))
  }

  // Complete quiz assessment helper
  const handleQuizComplete = (analysis) => {
    setQuizAnalysis(analysis)
    navigate('/dashboard')
  }

  // Hide sidebar during landing page, onboarding, login, and quiz taking
  const showSidebar = !['/', '/login', '/onboarding', '/quiz'].includes(location.pathname)

  const readinessScore = computeReadinessScore(userDoc)
  const readinessLabel = computeReadinessLabel(userDoc)

  return (
    <div className="min-h-screen bg-paper text-ink flex">
      {showSidebar && (
        <Sidebar
          onRestart={handleRestartAssessment}
          onGoHome={handleNavigateHome}
          email={authUser?.email}
          displayName={authUser?.displayName}
          onGoToProfile={handleGoToProfile}
          onSignOut={handleLogout}
        />
      )}
      <main className="flex-1 transition-all duration-300 min-h-screen">
        <Routes>
          <Route path="/" element={
            <Home
              onStartAssessment={handleLogin}
              onGoToOpportunities={handleGoToOpportunities}
              onFeatureNav={handleFeatureNav}
              authUser={authUser}
              onGoToProfile={handleGoToProfile}
              onSignOut={handleLogout}
              readinessScore={readinessScore}
              readinessLabel={readinessLabel}
            />
          } />
          <Route path="/login" element={
            authUser ? <Navigate to="/" replace /> : <Login onLogin={handleLoginSubmit} onGoHome={handleNavigateHome} />
          } />
          <Route path="/onboarding" element={
            <Onboarding
              key={userDoc ? 'ready' : 'loading'}
              onStartQuiz={handleStartQuiz}
              onGoHome={handleNavigateHome}
              authUser={authUser}
              userDoc={userDoc}
              onSaveProfile={handleSaveProfile}
            />
          } />
          <Route path="/quiz" element={
            <QuizPage
              profile={studentProfile}
              questions={quizQuestions}
              onComplete={handleQuizComplete}
              onGoHome={handleNavigateHome}
              onQuizFinished={handleQuizFinished}
            />
          } />
          <Route path="/dashboard" element={
            studentProfile ? <Dashboard profile={studentProfile} analysis={quizAnalysis} onRestart={handleRestartAssessment} /> : <Navigate to="/onboarding" replace />
          } />
          <Route path="/opportunities" element={<Opportunities profile={studentProfile} analysis={quizAnalysis} />} />
          <Route path="/roadmap" element={
            studentProfile ? <Roadmap profile={studentProfile} analysis={quizAnalysis} /> : <Navigate to="/onboarding" replace />
          } />
          <Route path="/dsa" element={
            studentProfile ? <DSA profile={studentProfile} analysis={quizAnalysis} /> : <Navigate to="/onboarding" replace />
          } />
          <Route path="/courses" element={
            studentProfile ? <Courses profile={studentProfile} analysis={quizAnalysis} /> : <Navigate to="/onboarding" replace />
          } />
          <Route path="/resume" element={
            studentProfile ? <Resume /> : <Navigate to="/onboarding" replace />
          } />
          <Route path="/profile" element={
            authUser ? (
              <Profile key={userDoc ? 'ready' : 'loading'} email={authUser.email} userDoc={userDoc} onSaveProfile={handleSaveProfile} />
            ) : <Navigate to="/login" replace />
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
