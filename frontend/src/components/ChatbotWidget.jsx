import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, User, Sparkles } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function ChatbotWidget({ summary, skillProfile, profile }) {
  const isAuthenticated = !!(profile || skillProfile)

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'bot',
      text: isAuthenticated
        ? `Hi! I'm your AI career assistant. I see you are at the ${skillProfile?.level || 'Beginner'} level. Ask me anything about DSA, projects, internships, or your career plan!`
        : "Hi! I'm your AI career assistant. Ask me about CareerAgent — features, roadmaps, DSA practice, assessments, and more!"
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  const buildStudentContext = () => {
    if (!isAuthenticated) return null
    return {
      name: profile?.name || profile?.profile?.name || '',
      year: profile?.year || profile?.profile?.year || '',
      domain: profile?.domain_interest?.[0] || profile?.profile?.domain_interest?.[0] || '',
      career_goal: profile?.career_goal || profile?.profile?.career_goal || '',
      level: skillProfile?.level || '',
      college_tier: profile?.college_tier || profile?.profile?.college_tier || '',
      hours_per_day: profile?.time_and_style?.hours_per_day || profile?.hours_per_day || '',
      category_scores: skillProfile?.category_scores || {},
      weak_areas: skillProfile?.weak_areas || [],
      recommended_next_step: summary?.recommended_next_step || ''
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMsg = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: input
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    const conversationHistory = [...messages, userMsg].map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text
    }))

    try {
      const res = await fetch(`${API_BASE}/api/agents/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          conversation_history: conversationHistory.slice(0, -1),
          student_context: buildStudentContext()
        })
      })

      if (!res.ok) throw new Error('Chat request failed')

      const data = await res.json()

      setMessages((prev) => [
        ...prev,
        { id: 'bot-' + Date.now(), sender: 'bot', text: data.reply }
      ])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-' + Date.now(),
          sender: 'bot',
          text: "Sorry, I'm having trouble connecting right now. Please try again in a moment."
        }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans text-ink">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-signal to-indigo-600 text-white shadow-lg transition-all duration-300 hover:scale-110 cursor-pointer chatbot-breathe"
        >
          {/* Glow ring */}
          <div className="absolute inset-0 rounded-full bg-signal/40 blur-xl transition-all duration-500 group-hover:blur-2xl group-hover:bg-signal/60 chatbot-glow-pulse" />

          {/* Robot icon */}
          <Bot className="h-7 w-7 relative z-10 drop-shadow-sm" />

          {/* Notification badge */}
          <div className="absolute -top-1 -right-1 flex items-center justify-center">
            <span className="absolute inline-flex h-5 w-5 rounded-full bg-emerald-400 opacity-60 chatbot-ping" />
            <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 shadow-sm">
              <Sparkles className="h-3 w-3 text-white" />
            </span>
          </div>
        </button>
      )}

      {isOpen && (
        <div className="w-[380px] h-[520px] bg-paper border border-gray-200/80 rounded-2xl flex flex-col overflow-hidden shadow-2xl chatbot-panel-in">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-mist bg-gradient-to-r from-signal-tint via-paper to-signal-tint">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-signal to-indigo-600 flex items-center justify-center text-white shadow-md shadow-signal/20">
                  <Bot className="h-5 w-5" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-paper" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink leading-none">Career Assistant</h4>
                <span className="text-[10px] text-emerald-600 font-bold mt-1 inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                  {isAuthenticated ? 'Personalized' : 'Public Mode'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate hover:text-ink p-1.5 rounded-lg hover:bg-mist transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-paper">
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot'
              return (
                <div key={msg.id} className={`flex gap-2.5 max-w-[85%] ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}>
                  <div className={`h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isBot
                      ? 'bg-gradient-to-br from-signal to-indigo-600 text-white shadow-sm'
                      : 'bg-mist text-slate'
                  }`}>
                    {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed border ${
                    isBot
                      ? 'bg-white border-gray-200/60 text-ink rounded-tl-sm shadow-sm font-medium'
                      : 'bg-gradient-to-br from-signal to-indigo-600 border-signal/20 text-white rounded-tr-sm font-semibold'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              )
            })}
            {isLoading && (
              <div className="flex gap-2.5 mr-auto">
                <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-signal to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm bg-white border border-gray-200/60 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-signal/40 chatbot-dot-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-signal/60 chatbot-dot-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-signal/80 chatbot-dot-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-mist bg-white/50 flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isAuthenticated ? "Ask about DSA, projects, timeline..." : "Ask about features, roadmaps..."}
              className="flex-1 px-3 py-2 text-xs theme-input !h-9"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="p-2 rounded-xl bg-gradient-to-br from-signal to-indigo-600 text-white transition-all cursor-pointer disabled:opacity-50 hover:shadow-md hover:shadow-signal/20"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatbotWidget
