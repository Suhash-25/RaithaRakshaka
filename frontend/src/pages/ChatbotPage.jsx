/**
 * ChatbotPage.jsx — /chatbot
 * Integrated from Awaaz ChatPage.jsx into PrernaVasthara design system.
 *
 * Auth: uses useAuthSessionCtx() — real JWT token from backend.
 * Backend: POST /agent/chat (requires Authorization: Bearer <token>)
 * Offline-first: queues messages when offline.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Bot, Trash2, AlertCircle } from 'lucide-react'
import { useStudent } from '@/context/StudentContext'
import useOnlineStatus from '@/hooks/useOnlineStatus'
import { useAuthSessionCtx } from '@/context/AuthSessionContext'
import AgentPipeline from './chatbot/AgentPipeline'
import ChatInput from './chatbot/ChatInput'

// ─── Config ───────────────────────────────────────────────────────────────────
const CHAT_ENDPOINT = '/agent/chat'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name = '') {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 animate-fade-in">
      <div className="w-8 h-8 rounded-full bg-primary-500/20 border border-primary-500/30 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-primary-500" />
      </div>
      <div className="bg-surface-card border border-surface-border rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-surface-muted animate-bounce"
              style={{ animationDelay: `${i * 150}ms`, animationDuration: '0.9s' }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function MessageBubble({ message, studentInitials }) {
  const isUser = message.role === 'user'
  const hasAgentFlow = message.agent_flow?.length > 0

  return (
    <div className={`flex items-end gap-2 animate-fade-in ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`
        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
        ${isUser
          ? 'bg-primary-500 text-white'
          : 'bg-primary-500/20 border border-primary-500/30 text-primary-500'
        }
      `}>
        {isUser ? studentInitials : <Bot className="w-4 h-4" />}
      </div>

      {/* Bubble + Pipeline */}
      <div className={`flex flex-col gap-1 max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Agent pipeline (AI messages only) */}
        {!isUser && hasAgentFlow && (
          <AgentPipeline
            steps={message.agent_flow}
            done={message.pipeline_done ?? true}
            error={message.pipeline_error ?? null}
          />
        )}

        {/* Text bubble */}
        {message.text && (
          <div className={`
            px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
            ${isUser
              ? 'bg-primary-500 text-white rounded-br-sm'
              : 'bg-surface-card border border-surface-border text-surface-text rounded-bl-sm'
            }
          `}>
            {message.text}
          </div>
        )}

        {/* Attached image preview */}
        {message.imagePreview && (
          <img
            src={message.imagePreview}
            alt="Attached"
            className="max-w-[200px] rounded-xl border border-surface-border object-cover"
          />
        )}

        {/* File chip */}
        {message.fileName && !message.imagePreview && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card border border-surface-border text-xs text-surface-muted">
            📎 {message.fileName}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-surface-muted px-1">
          {message.time}
        </span>
      </div>
    </div>
  )
}

// ─── Offline queue helpers ─────────────────────────────────────────────────────
const QUEUE_KEY = 'pv_chat_queue'
function loadQueue() {
  try { return JSON.parse(sessionStorage.getItem(QUEUE_KEY) || '[]') } catch { return [] }
}
function saveQueue(q) {
  sessionStorage.setItem(QUEUE_KEY, JSON.stringify(q))
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ChatbotPage() {
  const { currentStudent } = useStudent()
  const isOnline = useOnlineStatus()
  const { token, isAuthenticated, isInitialising, adkSession } = useAuthSessionCtx()

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [currentFile, setCurrentFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [listening, setListening] = useState(false)
  const [offlineQueue, setOfflineQueue] = useState(loadQueue)

  const bottomRef = useRef(null)
  const recognitionRef = useRef(null)

  const studentInitials = getInitials(currentStudent?.name)

  // Auto-scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, loading])

  // Replay offline queue when back online and authenticated
  useEffect(() => {
    if (isOnline && isAuthenticated && offlineQueue.length > 0) {
      const queue = [...offlineQueue]
      setOfflineQueue([])
      saveQueue([])
      queue.forEach(text => sendMessage(text, null, true))
    }
  }, [isOnline, isAuthenticated]) // eslint-disable-line

  // Welcome message
  useEffect(() => {
    const authNote = isInitialising
      ? ' (Setting up your session…)'
      : !isAuthenticated && isOnline
        ? ' (Authenticating with backend…)'
        : ''
    setMessages([{
      role: 'assistant',
      text: `Hi${currentStudent?.name ? ` ${currentStudent.name}` : ''}! 👋 I'm your AI learning assistant.${authNote} Ask me anything about your studies!`,
      agent_flow: [],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }])
  }, [currentStudent?.name, isAuthenticated]) // eslint-disable-line

  // ─── Voice Input ───────────────────────────────────────────────────────────
  const startVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      setErrorMsg('Voice input is not supported in this browser.')
      return
    }
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      return
    }
    const rec = new SR()
    rec.lang = 'en-IN'
    rec.continuous = false
    rec.interimResults = false
    rec.onstart = () => setListening(true)
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript
      setInput(prev => prev ? `${prev} ${text}` : text)
      setListening(false)
    }
    rec.onerror = () => setListening(false)
    rec.onend = () => setListening(false)
    rec.start()
    recognitionRef.current = rec
  }, [listening])

  // ─── File handling ─────────────────────────────────────────────────────────
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCurrentFile(file)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (ev) => setFilePreview({ name: file.name, src: ev.target.result })
      reader.readAsDataURL(file)
    } else {
      setFilePreview({ name: file.name })
    }
    e.target.value = ''
  }

  const clearFile = () => {
    setCurrentFile(null)
    setFilePreview(null)
  }

  // ─── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text, file, isReplay = false) => {
    if (!text?.trim() && !file) return
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    // Add user bubble
    const userMsg = {
      role: 'user',
      text: text || '',
      imagePreview: file?.type?.startsWith('image/') ? filePreview?.src : null,
      fileName: file && !file.type?.startsWith('image/') ? file.name : null,
      time: now,
    }
    setMessages(prev => [...prev, userMsg])

    // Offline: queue and bail
    if (!isOnline) {
      const newQueue = [...loadQueue(), text]
      saveQueue(newQueue)
      setOfflineQueue(newQueue)
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: '📶 You\'re offline. Your message has been queued and will be sent when you\'re back online.',
        agent_flow: [],
        pipeline_done: true,
        time: now,
      }])
      return
    }

    setLoading(true)
    setErrorMsg('')

    // Show live pipeline "running" state
    setMessages(prev => [...prev, {
      role: 'assistant',
      text: '',
      agent_flow: [
        { agent: 'Validation Agent', status: 'running', message: 'Checking query relevance…' },
      ],
      pipeline_done: false,
      time: now,
    }])

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      }

      const payload = {
        appName: "agent",
        newMessage: { role: "user", parts: [{ text: text || '' }] },
        sessionId: adkSession?.sessionId,
        stateDelta: null,
        streaming: false,
        userId: "user",
      }

      const res = await fetch('/run_sse', { method: 'POST', headers, body: JSON.stringify(payload) })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || errData.message || `Server error ${res.status}`)
      }

      if (!res.body) {
        throw new Error("Streaming not supported in this browser.")
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      const textParts = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        let newlineIndex
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex)
          buffer = buffer.slice(newlineIndex + 1)

          line = line.trim()
          if (!line) continue

          const jsonPart = line.startsWith("data:") ? line.slice(5).trim() : line

          try {
            const parsed = JSON.parse(jsonPart)
            // ADK SSE: each chunk has content.parts[].text
            if (parsed?.content?.parts) {
              parsed.content.parts.forEach(p => {
                if (p.text) textParts.push(p.text)
              })
            }
          } catch {
            console.warn("Failed to parse SSE chunk:", line)
          }
        }
      }

      const responseText = textParts.join("") || "No response received."

      setMessages(prev => {
        const copy = [...prev]
        const lastIdx = copy.findLastIndex(m => m.role === 'assistant' && m.pipeline_done === false)
        if (lastIdx !== -1) {
          copy[lastIdx] = {
            role: 'assistant',
            text: responseText,
            agent_flow: [],
            pipeline_done: true,
            time: now,
          }
        }
        return copy
      })
    } catch (err) {
      console.error('Chat error:', err)
      const errText = err.message?.includes('401')
        ? '🔐 Session expired. Please refresh the page to re-authenticate.'
        : `❌ ${err.message || 'Something went wrong. Please try again.'}`

      setMessages(prev => {
        const copy = [...prev]
        const lastIdx = copy.findLastIndex(m => m.role === 'assistant' && m.pipeline_done === false)
        if (lastIdx !== -1) {
          copy[lastIdx] = {
            role: 'assistant',
            text: errText,
            agent_flow: [
              { agent: 'Validation Agent', status: 'error', message: 'Request failed.' },
            ],
            pipeline_done: true,
            time: now,
          }
        }
        return copy
      })
    } finally {
      setLoading(false)
    }
  }, [isOnline, currentStudent, filePreview, token, adkSession])

  const handleSubmit = (e) => {
    e?.preventDefault()
    const text = input.trim()
    if (!text && !currentFile) return
    setInput('')
    sendMessage(text, currentFile)
    clearFile()
  }

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      text: `Chat cleared! How can I help you, ${currentStudent?.name || 'there'}?`,
      agent_flow: [],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }])
  }

  return (
    <div className="container-page max-w-3xl mx-auto px-4 sm:px-6 py-4 flex flex-col h-[calc(100vh-4rem)] sm:h-[calc(100vh-5rem)]">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-500" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-surface-text">AI Learning Assistant</h1>
            <p className="text-xs text-surface-muted">
              {!isOnline
                ? <span className="flex items-center gap-1 text-accent-amber">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-amber inline-block" />
                    Offline — messages will be queued
                  </span>
                : isInitialising
                  ? <span className="flex items-center gap-1 text-surface-muted">
                      <span className="w-1.5 h-1.5 rounded-full bg-surface-muted inline-block animate-pulse" />
                      Setting up session…
                    </span>
                  : isAuthenticated
                    ? <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-teal inline-block animate-pulse-slow" />
                        Online · Session active
                      </span>
                    : <span className="flex items-center gap-1 text-accent-amber">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-amber inline-block" />
                        Authenticating…
                      </span>
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Offline queue badge */}
          {offlineQueue.length > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-accent-amber/10 text-accent-amber border border-accent-amber/30">
              {offlineQueue.length} queued
            </span>
          )}
          <button
            onClick={clearChat}
            title="Clear chat"
            id="chat-clear-btn"
            className="p-2 rounded-lg text-surface-muted hover:text-accent-rose hover:bg-accent-rose/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Error bar ── */}
      {errorMsg && (
        <div className="mb-3 p-3 rounded-xl bg-accent-rose/10 border border-accent-rose/30 flex items-center gap-2 text-sm text-accent-rose flex-shrink-0">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorMsg}
          <button onClick={() => setErrorMsg('')} className="ml-auto text-accent-rose hover:opacity-70">
            ×
          </button>
        </div>
      )}

      {/* ── Messages area ── */}
      <div
        id="chat-messages-area"
        className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 scroll-smooth"
      >
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} studentInitials={studentInitials} />
        ))}

        {/* Typing indicator */}
        {loading && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="flex-shrink-0 pb-2">
        <ChatInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onSubmit={handleSubmit}
          onMic={startVoice}
          micActive={listening}
          loading={loading}
          disabled={loading || isInitialising}
          filePreview={filePreview}
          onClearFile={clearFile}
          onFileSelect={handleFileSelect}
          placeholder={
            !isOnline
              ? 'Offline — message will be queued'
              : isInitialising
                ? 'Setting up session…'
                : 'Ask anything about your studies…'
          }
        />
        <p className="text-center text-[10px] text-surface-muted mt-2">
          AI responses are for learning support only. Always verify with your teacher.
        </p>
      </div>
    </div>
  )
}
