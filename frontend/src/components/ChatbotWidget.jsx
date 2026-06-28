import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Bot, User } from 'lucide-react'

function ChatbotWidget({ summary, skillProfile }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 'm1',
      sender: 'bot',
      text: `Hi! I'm your career guidance chatbot. I see you are at the ${skillProfile?.level || 'Beginner'} level. How can I help you achieve your goals today?`
    }
  ])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen])

  const handleSend = () => {
    if (!input.trim()) return

    const userMsg = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: input
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')

    setTimeout(() => {
      let botResponse = ""
      const lowerInput = input.toLowerCase()

      if (lowerInput.includes('dsa') || lowerInput.includes('algorithm') || lowerInput.includes('structure')) {
        botResponse = `Since your DSA readiness is classified at ${skillProfile?.category_scores?.dsa || 30}%, I highly recommend following a structured practice roadmap. Focus on ${skillProfile?.weak_areas?.slice(0, 2).join(', ') || 'Arrays and Stack'} topics immediately.`
      } else if (lowerInput.includes('risk') || lowerInput.includes('gap') || lowerInput.includes('timeline')) {
        botResponse = `Your timeline assessment suggests you have a placement readiness window of ${summary?.estimated_placement_readiness || '12 months'}. Focus on the immediate next action: "${summary?.recommended_next_step || 'Start practice sheets'}".`
      } else if (lowerInput.includes('project') || lowerInput.includes('github')) {
        botResponse = `Build 1 or 2 high-quality full-stack applications. Push your work to GitHub with detailed README descriptions. Let's make this one of your quick wins!`
      } else {
        botResponse = `To transition from ${skillProfile?.level} to the next tier, your recommended next step is: "${summary?.recommended_next_step}". Let's start by committing ${summary?.focus_areas?.[0] || 'daily practice'} to your calendar.`
      }

      setMessages((prev) => [
        ...prev,
        {
          id: 'bot-' + Date.now(),
          sender: 'bot',
          text: botResponse
        }
      ])
    }, 800)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans text-ink">
      {/* Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-signal hover:bg-signal/90 text-white shadow-lg shadow-signal/20 transition-all hover:scale-105 cursor-pointer"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Floating Chat Panel */}
      {isOpen && (
        <div className="w-80 sm:w-96 h-[480px] bg-paper border border-gray-200/80 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
          {/* Header */}
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

          {/* Messages list */}
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
            <div ref={messagesEndRef} />
          </div>

          {/* Input field */}
          <div className="p-3 border-t border-mist bg-mist/30 flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about DSA sheets, timeline risks..."
              className="flex-1 px-3 py-2 text-xs theme-input"
              style={{ height: '36px' }}
            />
            <button
              onClick={handleSend}
              className="p-2 rounded-lg bg-signal hover:bg-signal/90 text-white transition-all cursor-pointer"
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
