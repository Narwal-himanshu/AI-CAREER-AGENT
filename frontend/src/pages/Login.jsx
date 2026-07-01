import React, { useState } from 'react'
import { GraduationCap, UserPlus, LogIn, ArrowRight } from 'lucide-react'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase'

function Login({ onLogin, onGoHome }) {
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password)
        // Login success -> redirect to dashboard
        onLogin('dashboard')
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
        // Signup success -> redirect to onboarding
        onLogin('signup')
      }
    } catch (err) {
      console.error(err)
      // If user doesn't exist on login, recommend signup
      if (mode === 'login' && (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential')) {
        setError('User not found or invalid credentials. Please sign up if you do not have an account.')
      } else if (mode === 'signup' && err.code === 'auth/email-already-in-use') {
        setError('Email already in use. Please log in.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-mist flex flex-col font-sans text-ink">
      <header className="fixed top-0 inset-x-0 h-16 border-b border-mist bg-paper/95 backdrop-blur-md z-30 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
          <div onClick={onGoHome} className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity">
            <GraduationCap className="h-6.5 w-6.5 text-signal" />
            <span className="font-display font-extrabold text-lg text-ink tracking-tight">CareerAgent</span>
          </div>
        </div>
      </header>

      <div className="flex-1 pt-24 pb-12 flex items-center justify-center px-6">
        <div className="w-full max-w-md theme-card bg-paper p-8 relative shadow-sm border border-gray-200/60 text-center rounded-2xl">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-signal-tint border border-signal/10 mb-5">
            <GraduationCap className="h-7 w-7 text-signal" />
          </div>

          <h1 className="text-xl font-display font-bold text-ink mb-1">
            {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h1>
          <p className="text-xs text-slate mt-1 mb-6 max-w-xs mx-auto">
            {mode === 'login'
              ? 'Sign in to access your personalised career guidance.'
              : 'Join CareerAgent to get your personalised roadmap.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-mist focus:outline-none focus:border-signal text-sm transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-mist focus:outline-none focus:border-signal text-sm transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-xs text-red-500 bg-red-50 p-3 rounded-lg mt-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3.5 rounded-full bg-signal hover:bg-signal/90 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-signal/25 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (mode === 'login' ? 'Log In' : 'Sign Up')}
              {!loading && (mode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />)}
            </button>
          </form>

          <div className="mt-6 border-t border-mist pt-6">
            <p className="text-xs text-slate">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login')
                  setError('')
                }}
                className="text-signal font-bold hover:underline"
              >
                {mode === 'login' ? 'Sign up here' : 'Log in here'}
              </button>
            </p>
          </div>

          <p className="mt-6 text-[10px] text-slate font-medium">
            AI Career Agent v1.0
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
