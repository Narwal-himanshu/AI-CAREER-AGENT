import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Bot, User } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function ChatbotWidget({ summary, skillProfile, profile }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'bot',
      text: `Hi! I'm your AI career assistant. I see you are at the ${skillProfile?.level || 'Beginner'} level. Ask me anything about DSA, projects, internships, or your career plan!`
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  const buildStudentContext = () => {
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
          className="flex h-14 w-14 items-center justify-center rounded-full bg-signal hover:bg-signal/90 text-white shadow-lg shadow-signal/20 transition-all hover:scale-105 cursor-pointer"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <div className="w-80 sm:w-96 h-[480px] bg-paper border border-gray-200/80 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-mist bg-mist">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-signal-tint flex items-center justify-center text-signal">
                <Bot className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-ink leading-none">Career Assistant</h4>
                <span className="text-[9px] text-emerald-600 font-bold mt-1.5 inline-block">Online</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate hover:text-ink p-1 rounded-lg hover:bg-mist transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-paper">
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot'
              return (
                <div key={msg.id} className={`flex gap-2.5 max-w-[85%] ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}>
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isBot ? 'bg-signal-tint text-signal' : 'bg-mist text-slate'
                  }`}>
                    {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed border ${
                    isBot 
                      ? 'bg-mist border-mist text-ink rounded-tl-none font-medium' 
                      : 'bg-signal-tint border-signal/15 text-signal rounded-tr-none font-semibold'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              )
            })}
            {isLoading && (
              <div className="flex gap-2.5 mr-auto">
                <div className="h-7 w-7 rounded-full bg-signal-tint text-signal flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="px-4 py-2.5 rounded-2xl rounded-tl-none bg-mist border border-mist text-ink">
                  <span className="text-xs text-slate animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-mist bg-mist/30 flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about DSA, projects, timeline..."
              className="flex-1 px-3 py-2 text-xs theme-input"
              style={{ height: '36px' }}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="p-2 rounded-lg bg-signal hover:bg-signal/90 text-white transition-all cursor-pointer disabled:opacity-50"
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
