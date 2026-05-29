'use client'

import { useState, useEffect, useRef } from 'react'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8004'
const API = BASE ? `${BASE}/api` : '/api'

export default function Home() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [memories, setMemories] = useState<string[]>([])
  const [showMemories, setShowMemories] = useState(false)
  const [status, setStatus] = useState('Ready')
  const chatEnd = useRef<HTMLDivElement>(null)

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    fetch(`${API}/health`).then(r => r.json()).then(d => setStatus(d.status === 'ok' ? 'Connected' : 'Offline')).catch(() => setStatus('Offline (start backend)'))
  }, [])

  const addMsg = (role: string, text: string) => setMessages(m => [...m, { role, text }])

  const send = async () => {
    if (!input.trim() || loading) return
    const text = input
    setInput('')
    addMsg('user', text)
    setLoading(true)
    setStatus('Thinking...')
    try {
      const res = await fetch(`${API}/ask`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) })
      const data = await res.json()
      addMsg('assistant', data.response)
      setStatus('Ready')
    } catch { addMsg('assistant', 'Backend not running. Start with: python backend/app.py'); setStatus('Error') }
    setLoading(false)
  }

  const toggleRecord = async () => {
    if (recording) return
    setRecording(true)
    setStatus('Recording...')
    try {
      const res = await fetch(`${API}/record`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ duration: 5 }) })
      const data = await res.json()
      if (data.text) addMsg('user', data.text)
      addMsg('assistant', data.response)
      setStatus('Ready')
    } catch { addMsg('assistant', 'Recording failed. Check microphone and backend.'); setStatus('Error') }
    setRecording(false)
  }

  const loadMemories = async () => {
    try {
      const res = await fetch(`${API}/memory/default`)
      const data = await res.json()
      setMemories(data.memories || [])
      setShowMemories(!showMemories)
    } catch { setMemories(['Could not load memories']) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <header style={{ textAlign: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Voice Assistant</h1>
        <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Local • Offline • Private • {status}</p>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#475569', paddingTop: 60 }}>
            <p style={{ fontSize: 32, margin: '0 0 8px' }}>🎙️</p>
            <p>Type a message or tap the mic to speak</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '80%', padding: '10px 16px', borderRadius: 16, background: m.role === 'user' ? '#3b82f6' : '#1e293b', border: m.role === 'assistant' ? '1px solid #334155' : 'none', fontSize: 14, lineHeight: 1.5, color: '#f1f5f9' }}>{m.text}</div>
          </div>
        ))}
        {loading && <div style={{ alignSelf: 'flex-start', color: '#64748b', fontSize: 13, padding: '8px 16px' }}>Thinking...</div>}
        <div ref={chatEnd} />
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={toggleRecord} disabled={recording} style={{ width: 48, height: 48, borderRadius: '50%', background: recording ? '#ef4444' : '#1e293b', color: '#e2e8f0', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155', transition: 'all 0.2s', opacity: recording ? 0.8 : 1 }}>
          🎤
        </button>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Type a message..." style={{ flex: 1, padding: '10px 16px', borderRadius: 24, border: '1px solid #334155', background: '#1e293b', color: '#e2e8f0', fontSize: 14, outline: 'none' }} />
        <button onClick={send} disabled={!input.trim() || loading} style={{ padding: '10px 20px', borderRadius: 24, border: 'none', background: '#3b82f6', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: !input.trim() || loading ? 0.5 : 1 }}>Send</button>
        <button onClick={loadMemories} style={{ padding: '10px 14px', borderRadius: 24, border: '1px solid #334155', background: '#1e293b', color: '#94a3b8', fontSize: 12, cursor: 'pointer', whiteSpace: 'nowrap' }}>{showMemories ? 'Hide' : '🧠 Memory'}</button>
      </div>

      {showMemories && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '12px 0', maxHeight: 150, overflowY: 'auto' }}>
          <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 8px' }}>Stored Memories</p>
          {memories.length === 0 && <p style={{ fontSize: 13, color: '#475569' }}>No memories yet. Say something like "Remember that I love Python"</p>}
          {memories.map((m, i) => <p key={i} style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0', padding: '6px 10px', background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>{m}</p>)}
        </div>
      )}
    </div>
  )
}
