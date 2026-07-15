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
import About from './pages/About'
import Sidebar from './components/Sidebar'
import { Menu, Loader2 } from 'lucide-react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { roadmapPathForSlug } from './lib/yearNav'

// Where we stash the page a signed-out (or profile-less) visitor was trying to
// reach, e.g. "/roadmap/3rd-year", so we can send them there automatically
// once they finish login / onboarding / the quiz instead of dumping them on
// the dashboard.
const POST_AUTH_REDIRECT_KEY = 'postAuthRedirect'

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const [authUser, setAuthUser] = useState(null)
  const [authToken, setAuthToken] = useState(null)
  const [userDoc, setUserDoc] = useState(null)
  const [studentProfile, setStudentProfile] = useState(null)
  const [quizQuestions, setQuizQuestions] = useState([])
  const [quizAnalysis, setQuizAnalysis] = useState(null)

  // authLoading: true until Firebase's first auth-state callback fires.
  // profileLoading: true while we're fetching/creating the Firestore user doc
  // for a signed-in user. Together these let protected routes (roadmap,
  // dashboard, etc.) show a loader instead of bouncing a refreshed/deep-linked
  // page to /onboarding before we actually know whether a profile exists.
  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)

  // Sidebar collapse (desktop) / drawer (mobile) state. Collapsed preference
  // is remembered across visits.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('sidebarCollapsed') === 'true'
    } catch {
      return false
    }
  })
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('sidebarCollapsed', String(next))
      } catch {
        // ignore storage errors (e.g. private browsing)
      }
      return next
    })
  }

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthUser(user)
        const token = await user.getIdToken()
        setAuthToken(token)

        // Create/refresh the Firestore user doc and update the login streak
        setProfileLoading(true)
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
        } finally {
          setProfileLoading(false)
        }
      } else {
        setAuthUser(null)
        setAuthToken(null)
        setUserDoc(null)
      }
      setAuthLoading(false)
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

  const peekPostAuthRedirect = () => {
    try { return sessionStorage.getItem(POST_AUTH_REDIRECT_KEY) } catch { return null }
  }

  const consumePostAuthRedirect = () => {
    const path = peekPostAuthRedirect()
    try { sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY) } catch { /* ignore storage errors */ }
    return path
  }

  // Handle successful Firebase auth — navigate based on mode
  const handleLoginSubmit = async (user) => {
    const token = await user.getIdToken()
    setAuthUser(user)
    setAuthToken(token)
    let hasProfile = false
    try {
      const doc = await ensureUserAndRecordLogin(user.uid, user.email)
      setUserDoc(doc)
      if (doc?.quizProfilePayload && doc?.analysis) {
        setStudentProfile(doc.quizProfilePayload)
        setQuizAnalysis(doc.analysis)
        hasProfile = true
      }
    } catch (err) {
      console.error('Failed to sync user profile:', err)
    }

    const redirect = peekPostAuthRedirect()
    if (redirect && hasProfile) {
      // Already has a completed profile — go straight to the page they wanted
      // (e.g. a specific year's roadmap).
      consumePostAuthRedirect()
      navigate(redirect)
    } else if (redirect) {
      // No profile yet — keep the redirect stashed so it can be honored once
      // onboarding + the quiz are done (see handleQuizComplete).
      navigate('/onboarding')
    } else {
      navigate('/')
    }
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

  // "By year" navigation (Navbar dropdown + Sidebar sub-menu both call this).
  // Guards on auth/profile first so the request survives login + onboarding +
  // the quiz and lands the user exactly where they meant to go.
  const handleYearNav = (slug) => {
    const path = roadmapPathForSlug(slug)
    if (!authUser) {
      try { sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, path) } catch { /* ignore storage errors */ }
      navigate('/login')
      return
    }
    if (!studentProfile) {
      try { sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, path) } catch { /* ignore storage errors */ }
      navigate('/onboarding')
      return
    }
    navigate(path)
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

  const handleGoHome = () => {
    navigate('/')
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
    const redirect = consumePostAuthRedirect()
    navigate(redirect || '/dashboard')
  }

  // Hide sidebar during landing page, onboarding, login, and quiz taking
  const showSidebar = !['/', '/about', '/login', '/onboarding', '/quiz'].includes(location.pathname)

  const readinessScore = computeReadinessScore(userDoc)
  const readinessLabel = computeReadinessLabel(userDoc)

  // True while we still don't know for sure whether a signed-in user has a
  // completed profile — prevents a flash-redirect to /onboarding on refresh
  // or a deep link (e.g. /roadmap/3rd-year) while Firebase/Firestore are
  // still resolving.
  const bootingProfile = authLoading || (!!authUser && profileLoading)

  // Shared guard for every route that needs a completed student profile.
  // Centralizing this avoids repeating the loading/redirect ternary on each
  // <Route> and keeps all profile-gated pages consistent.
  const requireProfile = (element) => {
    if (bootingProfile) {
      return (
        <div className="min-h-screen flex items-center justify-center text-slate">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )
    }
    return studentProfile ? element : <Navigate to="/onboarding" replace />
  }

  return (
    <div className="min-h-screen bg-paper text-ink flex">
      {showSidebar && (
        <Sidebar
          onRestart={handleRestartAssessment}
          onGoHome={handleLogout}
          email={authUser?.email}
          displayName={authUser?.displayName}
          onGoToProfile={handleGoToProfile}
          onSignOut={handleLogout}
          onYearNav={handleYearNav}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
      )}
      <main
        className={`flex-1 min-h-screen w-full transition-all duration-300 ease-in-out ${
          showSidebar ? (sidebarCollapsed ? 'md:ml-20' : 'md:ml-64') : ''
        }`}
      >
        {/* Mobile top bar: only shown on small screens so the sidebar (an
            overlay drawer below md) always has a way to be opened, and page
            content never sits underneath it. */}
        {showSidebar && (
          <div className="md:hidden sticky top-0 z-20 flex items-center gap-3 border-b border-mist bg-paper/95 backdrop-blur px-4 py-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 -ml-2 text-ink hover:bg-mist rounded-lg transition-colors cursor-pointer"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-display font-extrabold text-base text-ink">CareerAgent</span>
          </div>
        )}
        <Routes>
          <Route path="/" element={
            <Home
              onStartAssessment={handleLogin}
              onGoToOpportunities={handleGoToOpportunities}
              onFeatureNav={handleFeatureNav}
              onYearNav={handleYearNav}
              authUser={authUser}
              onGoToProfile={handleGoToProfile}
              onSignOut={handleLogout}
              readinessScore={readinessScore}
              readinessLabel={readinessLabel}
            />
          } />
          <Route path="/about" element={
            <About
              onStartAssessment={handleLogin}
              onGoToOpportunities={handleGoToOpportunities}
              onFeatureNav={handleFeatureNav}
              onYearNav={handleYearNav}
              authUser={authUser}
              onGoToProfile={handleGoToProfile}
              onSignOut={handleLogout}
            />
          } />
          <Route path="/login" element={
            authUser ? <Navigate to="/" replace /> : <Login onLogin={handleLoginSubmit} onGoHome={handleNavigateHome} />
          } />
          <Route path="/onboarding" element={
            <Onboarding
              key={userDoc ? 'ready' : 'loading'}
              onStartQuiz={handleStartQuiz}
              onGoHome={handleLogout}
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
              onGoHome={handleLogout}
              onQuizFinished={handleQuizFinished}
            />
          } />
          <Route path="/dashboard" element={
            requireProfile(<Dashboard profile={studentProfile} analysis={quizAnalysis} onRestart={handleRestartAssessment} />)
          } />
          <Route path="/opportunities" element={<Opportunities profile={studentProfile} analysis={quizAnalysis} />} />
          {/* Base roadmap (uses the student's own year) and the four "By Year"
              deep links share the same Roadmap component — it reads :yearSlug
              via useParams and reuses the identical fetch/render logic. */}
          <Route path="/roadmap" element={
            requireProfile(<Roadmap profile={studentProfile} analysis={quizAnalysis} authToken={authToken} />)
          } />
          <Route path="/roadmap/:yearSlug" element={
            requireProfile(<Roadmap profile={studentProfile} analysis={quizAnalysis} authToken={authToken} />)
          } />
          <Route path="/dsa" element={
            requireProfile(<DSA profile={studentProfile} analysis={quizAnalysis} authToken={authToken} />)
          } />
          <Route path="/courses" element={
            requireProfile(<Courses profile={studentProfile} analysis={quizAnalysis} authToken={authToken} />)
          } />
          <Route path="/resume" element={
            requireProfile(<Resume />)
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
