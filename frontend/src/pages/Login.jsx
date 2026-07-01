import React from 'react'
import { GraduationCap, UserPlus, LogIn } from 'lucide-react'

function Login({ onLogin, onGoHome }) {
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
        <div className="w-full max-w-md theme-card bg-paper p-8 relative shadow-sm border border-gray-200/60 text-center">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-signal-tint border border-signal/10 mb-5">
            <GraduationCap className="h-7 w-7 text-signal" />
          </div>

          <h1 className="text-xl font-display font-bold text-ink">Welcome to CareerAgent</h1>
          <p className="text-xs text-slate mt-1 mb-8 max-w-xs mx-auto">
            Your personalised career guidance platform for BTech CS students.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => onLogin('signup')}
              className="w-full py-3.5 rounded-full bg-signal hover:bg-signal/90 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-signal/25"
            >
              <UserPlus className="h-4 w-4" />
              Sign Up
            </button>

            <button
              onClick={() => onLogin('login')}
              className="w-full py-3.5 rounded-full border border-signal text-signal hover:bg-signal-tint text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              Log In
            </button>
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
