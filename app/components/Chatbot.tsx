'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Mic, MicOff, Volume2, VolumeX, ShoppingBag } from 'lucide-react'

type Message = {
  role: 'user' | 'bot'
  text: string
  products?: any[]
}

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: '👋 Hi! I\'m your Omgea Shop assistant. Ask me about any product or I can help you find the perfect item!' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [listening, setListening] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Speak text using Web Speech API
  const speak = (text: string) => {
    if (!voiceEnabled) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1
    utterance.pitch = 1
    utterance.volume = 1
    // Try to use a natural voice
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.lang === 'en-IN')
    if (preferred) utterance.voice = preferred
    window.speechSynthesis.speak(utterance)
  }

  // Voice input using Web Speech API
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return alert('Voice input not supported in this browser')
    recognitionRef.current = new SpeechRecognition()
    recognitionRef.current.lang = 'en-IN'
    recognitionRef.current.continuous = false
    recognitionRef.current.interimResults = false
    recognitionRef.current.onstart = () => setListening(true)
    recognitionRef.current.onend = () => setListening(false)
    recognitionRef.current.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript
      setInput(transcript)
    }
    recognitionRef.current.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setListening(false)
  }

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      })
      const data = await res.json()
      const reply = data.reply || 'Sorry, I could not get a response.'
      setMessages(prev => [...prev, { role: 'bot', text: reply, products: data.products }])
      speak(reply)
    } catch {
      const errMsg = 'Sorry, something went wrong. Please try again!'
      setMessages(prev => [...prev, { role: 'bot', text: errMsg }])
      speak(errMsg)
    }
    setLoading(false)
  }

  const QUICK_QUESTIONS = [
    '🎧 Show me electronics',
    '👕 Fashion under ₹500',
    '🎁 Best gifts',
    '🔥 What\'s on sale?',
  ]

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-36 right-4 z-50 w-80 md:w-96 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden"
          style={{ height: '500px' }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <ShoppingBag size={20} className="text-white" />
              </div>
              <div>
                <p className="text-white font-display font-700">Omgea Assistant</p>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <p className="text-white/80 text-xs">Always online</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => {
                setVoiceEnabled(v => !v)
                window.speechSynthesis.cancel()
              }} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                {voiceEnabled ? <Volume2 size={16} className="text-white" /> : <VolumeX size={16} className="text-white/50" />}
              </button>
              <button onClick={() => setOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={16} className="text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                  msg.role === 'user'
                    ? 'bg-orange-500 text-white rounded-br-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm'
                }`}>
                  {msg.text}
                  {/* Show matched products */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.products.slice(0, 2).map((p: any) => (
                        <a key={p.id} href={`/products/${p.id}`}
                          className="flex items-center gap-2 bg-white dark:bg-gray-700 rounded-xl p-2 hover:bg-orange-50 dark:hover:bg-gray-600 transition-colors">
                          <img src={p.images?.[0]} alt={p.name} className="w-8 h-8 object-cover rounded-lg" />
                          <div>
                            <p className="text-xs font-semibold text-gray-800 dark:text-white line-clamp-1">{p.name}</p>
                            <p className="text-xs text-orange-500 font-bold">₹{(p.discount_price ?? p.price).toLocaleString()}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
              {QUICK_QUESTIONS.map(q => (
                <button key={q} onClick={() => sendMessage(q)}
                  className="flex-shrink-0 text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 px-3 py-1.5 rounded-full hover:bg-orange-100 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <button
              onClick={listening ? stopListening : startListening}
              className={`p-2.5 rounded-full transition-colors flex-shrink-0 ${listening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200'}`}>
              {listening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about any product..."
              className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="p-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white rounded-full transition-colors flex-shrink-0">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}