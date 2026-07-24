import React, { useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth } from '../firebase'
import {
  GraduationCap, LogIn, UserPlus, Loader2, Eye, EyeOff, Mail,
  MessageSquare, Star, HelpCircle, Bot, Apple, ArrowLeft, CheckCircle2,
} from 'lucide-react'

// Minimal inline "G" mark for the Google button (kept as a raw SVG the same
// way the footer already draws the GitHub/LinkedIn glyphs in Home.jsx).
function GoogleGlyph(props) {
  return (
    <svg viewBox="0 0 48 48" className={props.className}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 35.1 26.9 36 24 36c-5.2 0-9.6-3.1-11.3-7.5l-6.6 5.1C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.6 5.6C40.8 36.5 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </svg>
  )
}

// Reusable floating "sticker" bubble for the illustration side.
function FloatBubble({ icon: Icon, className, delay }) {
  return (
    <div
      className={`absolute h-11 w-11 md:h-12 md:w-12 rounded-2xl flex items-center justify-center shadow-lg shape-float ${className}`}
      style={delay ? { animationDelay: delay } : undefined}
    >
      <Icon className="h-5 w-5 text-white" />
    </div>
  )
}

const PARTNERS = ['LeetCode', 'GeeksforGeeks', 'Udemy', 'Coursera', 'YouTube']

function Login({ onLogin, onGoHome }) {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [appleLoading, setAppleLoading] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const friendlyError = (err) => {
    if (err.code === 'auth/operation-not-allowed') {
      return 'This sign-in method is not enabled yet. Go to Firebase Console → Authentication → Sign-in method → enable it.'
    }
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      return mode === 'login'
        ? 'No account found with this email. Please sign up.'
        : 'Registration failed. This email may already be in use.'
    }
    if (err.code === 'auth/email-already-in-use') return 'An account with this email already exists. Please log in.'
    if (err.code === 'auth/weak-password') return 'Password should be at least 6 characters.'
    if (err.code === 'auth/invalid-email') return 'Invalid email address.'
    if (err.code === 'auth/popup-closed-by-user') return 'Sign-in popup was closed before completing.'
    return err.message
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      const userCredential = mode === 'login'
        ? await signInWithEmailAndPassword(auth, email, password)
        : await createUserWithEmailAndPassword(auth, email, password)
      onLogin(userCredential.user)
    } catch (err) {
      console.error(err)
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      onLogin(result.user)
    } catch (err) {
      console.error(err)
      setError(friendlyError(err))
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleAppleSignIn = async () => {
    setError('')
    setAppleLoading(true)
    try {
      const provider = new OAuthProvider('apple.com')
      const result = await signInWithPopup(auth, provider)
      onLogin(result.user)
    } catch (err) {
      console.error(err)
      setError(friendlyError(err))
    } finally {
      setAppleLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setError('')
    if (!email) {
      setError('Enter your email above first, then tap "Forgot password?"')
      return
    }
    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
      setResetSent(true)
    } catch (err) {
      console.error(err)
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row font-sans relative overflow-hidden bg-[#03040f]">

      {/* ============ LEFT: Illustration / brand side ============ */}
      <div className="hidden md:flex md:w-1/2 relative flex-col justify-between overflow-hidden bg-gradient-to-br from-[#050818] via-[#0b1130] to-[#000000]">
        {/* Ambient glow blobs */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-signal/30 blur-3xl blob-drift" />
        <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-ember/25 blur-3xl blob-drift-slow" />
        <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-ember/10 blur-3xl blob-drift-delay" />

        <div
          onClick={onGoHome}
          className="relative z-10 flex items-center gap-2 px-10 pt-8 cursor-pointer hover:opacity-85 transition-opacity w-fit"
        >
          <GraduationCap className="h-6.5 w-6.5 text-white" />
          <span className="font-display font-extrabold text-lg text-white tracking-tight">CareerAgent</span>
        </div>

        {/* Illustration */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-10">
          <div className="relative">
            {/* glow ring behind laptop */}
            <div className="absolute inset-0 -m-8 rounded-full bg-gradient-to-r from-signal via-ember to-signal blur-3xl opacity-20" />

            {/* Laptop */}
            <div className="relative w-64 md:w-72 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-3 shadow-2xl">
              <div className="rounded-xl bg-gradient-to-br from-signal/20 via-ember/10 to-transparent border border-white/10 aspect-[4/3] flex items-center justify-center">
                <div className="relative flex items-center justify-center h-20 w-20 rounded-2xl bg-gradient-to-br from-signal to-ember shadow-lg shadow-signal/40">
                  <Bot className="h-10 w-10 text-white" />
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-emerald-400 border-2 border-[#0b1130] animate-pulse" />
                </div>
              </div>
              {/* laptop base */}
              <div className="h-2.5 mt-3 rounded-full bg-white/10" />
            </div>

            {/* Floating stickers around the laptop */}
            <FloatBubble icon={Mail} className="bg-gradient-to-br from-ember to-signal -top-6 -left-10" />
            <FloatBubble icon={MessageSquare} className="bg-gradient-to-br from-signal to-ember top-4 -right-12" delay="-2s" />
            <FloatBubble icon={HelpCircle} className="bg-gradient-to-br from-signal to-ember bottom-8 -left-14" delay="-4s" />
            <FloatBubble icon={Star} className="bg-gradient-to-br from-ember to-signal -bottom-4 right-0" delay="-1s" />
          </div>

          <h2 className="relative z-10 mt-14 text-2xl md:text-3xl font-display font-extrabold text-white text-center leading-tight max-w-sm">
            Your personal{' '}
            <span className="bg-gradient-to-r from-signal via-ember to-signal bg-clip-text text-transparent">
              AI career tutor
            </span>
          </h2>
          <p className="relative z-10 mt-3 text-sm text-white/50 text-center max-w-xs">
            Adaptive roadmaps, DSA tracking and course guidance — tailored to you.
          </p>
        </div>

        {/* Trusted-content logo strip */}
        <div className="relative z-10 border-t border-white/10 bg-black/30 backdrop-blur-sm py-6 px-10">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-3 text-center">
            Content curated from
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {PARTNERS.map((p) => (
              <span
                key={p}
                className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-[11px] font-semibold text-white/70"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ============ RIGHT: Auth form side ============ */}
      <div className="flex-1 md:w-1/2 relative flex items-center justify-center px-6 py-12 bg-gradient-to-br from-[#03040f] via-[#070a1e] to-[#000000] overflow-hidden">
        <div className="absolute top-0 right-0 h-72 w-72 rounded-full bg-signal/20 blur-3xl blob-drift" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-ember/15 blur-3xl blob-drift-slow" />

        {/* Mobile-only logo */}
        <div
          onClick={onGoHome}
          className="md:hidden absolute top-6 left-6 z-10 flex items-center gap-2 cursor-pointer"
        >
          <GraduationCap className="h-6 w-6 text-white" />
          <span className="font-display font-extrabold text-base text-white tracking-tight">CareerAgent</span>
        </div>

        <div className="relative z-10 w-full max-w-sm">
          <div className="relative rounded-3xl p-8 bg-white/[0.04] backdrop-blur-2xl border border-white/10 shadow-[0_0_60px_-10px_rgba(79,70,229,0.35)]">

            {forgotMode ? (
              <>
                <button
                  onClick={() => { setForgotMode(false); setResetSent(false); setError('') }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition-colors mb-6 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to login
                </button>

                <h1 className="text-2xl font-display font-extrabold text-white mb-1">Reset password</h1>
                <p className="text-xs text-white/50 mb-6">
                  Enter your account email and we'll send you a reset link.
                </p>

                {resetSent ? (
                  <div className="flex items-start gap-2.5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-emerald-300">
                      Reset link sent to <span className="font-semibold">{email}</span>. Check your inbox.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-white/60 mb-1.5">Email address</label>
                      <div className="relative">
                        <Mail className="h-4 w-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-signal focus:bg-white/[0.07] text-sm text-white placeholder:text-white/30 transition-all"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>
                    {error && <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">{error}</div>}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-full bg-gradient-to-r from-signal to-ember hover:from-signal/90 hover:to-ember/90 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-signal/30 hover:shadow-xl hover:shadow-signal/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send reset link'}
                    </button>
                  </form>
                )}
              </>
            ) : (
              <>
                <span className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">
                  {mode === 'login' ? 'Login your account' : 'Create your account'}
                </span>
                <h1 className="text-3xl font-display font-extrabold text-white mt-1 mb-6">
                  {mode === 'login' ? 'Welcome Back!' : 'Get Started'}
                </h1>

                {/* Sign up / Log in segmented toggle */}
                <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-white/5 border border-white/10 mb-6">
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setError('') }}
                    className={`py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      mode === 'signup'
                        ? 'bg-gradient-to-r from-signal to-ember text-white shadow-md'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    SIGN UP
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setError('') }}
                    className={`py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      mode === 'login'
                        ? 'bg-gradient-to-r from-signal to-ember text-white shadow-md'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    LOG IN
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-white/60 mb-1.5">Email address</label>
                    <div className="relative">
                      <Mail className="h-4 w-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-signal focus:bg-white/[0.07] text-sm text-white placeholder:text-white/30 transition-all"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-white/60 mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:outline-none focus:border-signal focus:bg-white/[0.07] text-sm text-white placeholder:text-white/30 pr-10 transition-all"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {mode === 'login' && (
                    <div className="text-right -mt-1">
                      <button
                        type="button"
                        onClick={() => { setForgotMode(true); setError('') }}
                        className="text-[11px] font-semibold text-white/40 hover:text-white transition-colors cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}

                  {error && <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">{error}</div>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3.5 rounded-full bg-gradient-to-r from-signal to-ember hover:from-signal/90 hover:to-ember/90 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-signal/30 hover:shadow-xl hover:shadow-signal/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                      </>
                    ) : (
                      <>
                        {mode === 'login' ? 'Sign In' : 'Create Account'}
                        {mode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                      </>
                    )}
                  </button>
                </form>

                <div className="flex items-center gap-3 my-6">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Or</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                    className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-white flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-60"
                  >
                    {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleGlyph className="h-4 w-4" />}
                    Continue with Google
                  </button>
                  <button
                    type="button"
                    onClick={handleAppleSignIn}
                    disabled={appleLoading}
                    className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-semibold text-white flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-60"
                  >
                    {appleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Apple className="h-4 w-4" />}
                    Continue with Apple
                  </button>
                </div>

                <p className="text-center text-xs text-white/40 mt-6">
                  {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    type="button"
                    onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
                    className="text-white font-bold hover:text-signal-tint transition-colors cursor-pointer"
                  >
                    {mode === 'login' ? 'Sign Up' : 'Log In'}
                  </button>
                </p>
              </>
            )}
          </div>

          <p className="text-center text-[10px] text-white/25 font-medium mt-6">
            AI Career Agent v1.0
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
