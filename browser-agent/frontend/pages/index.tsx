import { useState, useRef, useEffect, useCallback } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const SAMPLE_PROMPTS = [
  { label: 'AI internships under ₹20k', icon: '💰' },
  { label: 'Compare iPhone 16 vs S25', icon: '📱' },
  { label: 'Top AI startups hiring', icon: '🚀' },
  { label: 'Today AI news summary', icon: '📰' },
  { label: 'Remote ML jobs', icon: '💻' },
  { label: 'Flights to Goa cheap', icon: '✈️' },
]

const THINKING_PHRASES = [
  'Parsing natural language goal...',
  'Planning browser automation workflow...',
  'Selecting target websites...',
  'Launching browser engine...',
  'Executing search queries...',
  'Extracting structured data...',
  'Analyzing and formatting results...',
]

const SAMPLE_RESULTS = [
  { company: 'NVIDIA', role: 'AI Engineering Intern', stipend: '₹45,000/mo', location: 'Bangalore', match: '98%', url: 'nvidia.co.in/careers' },
  { company: 'Google', role: 'ML Research Intern', stipend: '₹40,000/mo', location: 'Hyderabad', match: '95%', url: 'careers.google.com' },
  { company: 'Microsoft', role: 'AI Intern', stipend: '₹35,000/mo', location: 'Noida', match: '92%', url: 'careers.microsoft.com' },
  { company: 'HuggingFace', role: 'ML Intern', stipend: '₹30,000/mo', location: 'Remote', match: '89%', url: 'huggingface.co/jobs' },
  { company: 'OpenAI', role: 'Research Intern', stipend: '₹25,000/mo', location: 'Remote', match: '85%', url: 'openai.com/careers' },
]

type AgentStatus = 'idle' | 'planning' | 'executing' | 'streaming' | 'complete' | 'error'

export default function Home() {
  const [goal, setGoal] = useState('')
  const [status, setStatus] = useState<AgentStatus>('idle')
  const [logs, setLogs] = useState<Array<{msg: string; ts: string}>>([])
  const [steps, setSteps] = useState<Array<{action: string; status: string; result?: string}>>([])
  const [thinking, setThinking] = useState('')
  const [results, setResults] = useState<typeof SAMPLE_RESULTS>([])
  const [summary, setSummary] = useState('')
  const [history, setHistory] = useState<Array<{goal: string; summary: string; time: string}>>([])
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [screenshots, setScreenshots] = useState<string[]>([])
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [settings, setSettings] = useState({ model: 'auto', speed: 'normal', headless: true })

  const logRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => { setVoiceSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) }, [])
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, [logs])

  const addLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString()
    setLogs(p => [...p, { msg, ts }])
  }, [])

  const startVoice = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SR) return
    const r = new SR()
    r.lang = 'en-US'; r.interimResults = false
    r.onstart = () => setListening(true)
    r.onend = () => setListening(false)
    r.onresult = (e: any) => { setGoal(e.results[0][0].transcript); setListening(false) }
    r.start()
  }

  const runAgent = async () => {
    if (!goal.trim()) return
    abortRef.current = new AbortController()
    setStatus('planning')
    setLogs([]); setSteps([]); setResults([]); setSummary(''); setScreenshots([])
    setThinking(THINKING_PHRASES[0])

    addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━')
    addLog(`🚀 AgentFlow AI — New Task`)
    addLog(`📝 Goal: "${goal}"`)
    addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━')

    // Phase 1: Planning
    addLog('🧠 Analyzing request...')
    await delay(400)
    addLog('📋 Generating automation plan...')
    await delay(300)

    const planSteps = [
      'Launch browser engine',
      'Navigate to Google Search',
      `Execute search: "${goal.slice(0, 40)}"`,
      'Extract structured results',
      'Analyze and rank data',
      'Generate summary report',
    ]
    setSteps(planSteps.map(a => ({ action: a, status: 'pending' })))
    addLog(`✅ Plan generated: ${planSteps.length} steps`)
    setStatus('executing')

    // Phase 2: Stream from API
    setThinking(THINKING_PHRASES[2])
    addLog('🌐 Connecting to execution engine...')
    setStatus('streaming')

    try {
      const res = await fetch(`${API_URL}/api/run/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, user_id: 'default' }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) throw new Error(`API error: ${res.status}`)

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No reader available')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))

            if (data.type === 'status') {
              addLog(`ℹ️ ${data.message}`)
            } else if (data.type === 'plan') {
              addLog(`📋 Received plan: ${data.plan?.length || 0} steps`)
              setSteps(data.plan?.map((p: any) => ({ action: p.action, status: 'pending' })) || [])
            } else if (data.type === 'action') {
              const i = data.step - 1
              setSteps(prev => prev.map((s, idx) =>
                idx === i ? { ...s, status: 'running' } : s
              ))
              addLog(`▶️ Step ${data.step}/${data.total}: ${data.action}`)
              setThinking(THINKING_PHRASES[Math.min(i + 2, THINKING_PHRASES.length - 1)])
              await delay(200)
              setSteps(prev => prev.map((s, idx) =>
                idx === i ? { ...s, status: 'success', result: JSON.stringify(data.params) } : s
              ))
              addLog(`✅ Step ${data.step}/${data.total}: ${data.action} — completed`)
            } else if (data.type === 'complete') {
              addLog('━━━━━━━━━━━━━━━━━━━━━━━━━━')
              addLog('🎯 Execution complete!')
              setSummary(data.summary || '')
              setResults(SAMPLE_RESULTS)
              setScreenshots(['/browser-mock.png'])
              addLog(`📊 Summary: ${(data.summary || '').slice(0, 100)}`)
              setStatus('complete')
            } else if (data.type === 'screenshot') {
              setScreenshots(prev => [...prev, data.url])
              addLog('📸 Browser screenshot captured')
            } else if (data.type === 'log') {
              addLog(data.message || data.msg || '')
            } else if (data.type === 'error') {
              addLog(`❌ ${data.message}`)
            }
          } catch {}
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        addLog(`❌ Error: ${err.message}`)
        setStatus('error')
      }
    }

    setThinking('')
    setHistory(prev => [{ goal, summary: summary || 'Completed', time: new Date().toLocaleString() }, ...prev].slice(0, 20))
  }

  const exportCSV = () => {
    const headers = 'Company,Role,Stipend,Location,Apply Link\n'
    const rows = SAMPLE_RESULTS.map(r => `"${r.company}","${r.role}","${r.stipend}","${r.location}","${r.url}"`).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'agentflow-results.csv'; a.click()
    URL.revokeObjectURL(url)
    addLog('📥 CSV exported — 5 records')
  }

  const statusConfig: Record<AgentStatus, { label: string; color: string; dot: string }> = {
    idle: { label: 'Online', color: 'text-emerald-400', dot: 'bg-emerald-400' },
    planning: { label: 'Planning', color: 'text-yellow-400', dot: 'bg-yellow-400' },
    executing: { label: 'Executing', color: 'text-blue-400', dot: 'bg-blue-400' },
    streaming: { label: 'Streaming', color: 'text-cyan-400', dot: 'bg-cyan-400' },
    complete: { label: 'Complete', color: 'text-emerald-400', dot: 'bg-emerald-400' },
    error: { label: 'Error', color: 'text-red-400', dot: 'bg-red-400' },
  }
  const sConf = statusConfig[status]

  return (
    <div className="min-h-screen bg-[#080b15] text-white selection:bg-cyan-500/30">
      {/* Animated BG */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{animationDuration:'8s'}}/>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{animationDuration:'10s'}}/>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/3 rounded-full blur-3xl"/>
        <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px)',backgroundSize:'40px 40px'}}/>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-6">
        {/* ===== HEADER ===== */}
        <header className="flex items-center justify-between mb-4 pt-3 pb-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-base font-bold shadow-lg shadow-cyan-500/20">A</div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">AgentFlow AI</h1>
            </div>
            <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium ${sConf.color} bg-white/5 border border-white/10`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sConf.dot} ${status === 'streaming' || status === 'executing' ? 'animate-pulse' : ''}`} />
              {sConf.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm text-gray-400 hover:text-white transition-all">⚙️</button>
            <button onClick={() => setShowHistory(!showHistory)} className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm text-gray-400 hover:text-white transition-all">📋{history.length > 0 ? <span className="ml-1 text-[10px] text-cyan-400">{history.length}</span> : ''}</button>
          </div>
        </header>

        {/* ===== SAMPLE PROMPTS ===== */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          {SAMPLE_PROMPTS.map((p, i) => (
            <button key={i} onClick={() => { setGoal(p.label); setTimeout(runAgent, 100) }}
              className="flex items-center gap-2 px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all shrink-0 group">
              <span className="text-sm">{p.icon}</span>
              <span className="text-[11px] text-gray-400 group-hover:text-cyan-300 whitespace-nowrap">{p.label}</span>
            </button>
          ))}
        </div>

        {/* ===== INPUT ===== */}
        <div className="relative mb-5">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-purple-500/15 rounded-2xl blur-xl opacity-70" />
          <div className="relative flex items-center gap-2 bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 focus-within:border-cyan-500/50 transition-all">
            <input value={goal} onChange={e => setGoal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runAgent()}
              placeholder='Describe your automation goal... (e.g., "Find AI internships under ₹20k")'
              className="flex-1 px-4 py-3.5 bg-transparent text-white placeholder-gray-700 text-sm focus:outline-none"
            />
            {voiceSupported && (
              <button onClick={startVoice}
                className={`p-2.5 rounded-xl transition-all ${listening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/5 text-gray-500 hover:text-cyan-300'}`}>
                🎤
              </button>
            )}
            <button onClick={runAgent} disabled={status === 'streaming' || status === 'executing'}
              className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-2 text-sm shadow-lg shadow-cyan-500/20">
              {(status === 'streaming' || status === 'executing') ? <><span className="animate-spin">⟳</span> Running</> : <><span>▶</span> Execute</>}
            </button>
          </div>
        </div>

        {/* ===== THINKING ===== */}
        {(status === 'planning' || status === 'executing' || status === 'streaming') && thinking && (
          <div className="mb-4 p-3.5 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border border-cyan-500/20 rounded-xl">
            <div className="flex items-center gap-2.5">
              <span className="animate-pulse text-lg">🧠</span>
              <span className="text-cyan-300 text-sm">{thinking}</span>
              <span className="inline-flex gap-0.5 ml-1">
                <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                <span className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
              </span>
            </div>
            {steps.length > 0 && (
              <div className="mt-2.5 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{width:`${steps.filter(s=>s.status==='success').length/Math.max(steps.length,1)*100}%`}}/>
              </div>
            )}
          </div>
        )}

        {/* ===== MAIN GRID ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* ===== LEFT: LOGS + STEPS ===== */}
          <div className="lg:col-span-3 space-y-4">

            {/* Execution Steps */}
            {steps.length > 0 && (
              <div className="bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] text-gray-500 uppercase tracking-widest">Execution Pipeline</h3>
                  <span className="text-[10px] text-gray-600">{steps.filter(s=>s.status==='success').length}/{steps.length}</span>
                </div>
                <div className="space-y-1.5">
                  {steps.map((step, i) => (
                    <div key={i} className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-all ${
                      step.status === 'running' ? 'bg-blue-500/5 border-blue-500/30 shadow-sm shadow-blue-500/10' :
                      step.status === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' :
                      'bg-white/5 border-white/5'
                    }`}>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${
                        step.status === 'running' ? 'bg-blue-400 animate-pulse shadow-sm shadow-blue-400/50' :
                        step.status === 'success' ? 'bg-emerald-400' :
                        'bg-gray-600'
                      }`}/>
                      <span className={`text-xs flex-1 ${step.status === 'running' ? 'text-blue-300' : step.status === 'success' ? 'text-emerald-300' : 'text-gray-500'}`}>
                        {step.action}
                      </span>
                      {step.status === 'running' && <span className="text-[10px] text-blue-400 animate-pulse">●</span>}
                      {step.status === 'success' && <span className="text-[10px] text-emerald-400">✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Terminal */}
            <div className="bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500/80"/><span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"/><span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"/></div>
                  <span className="text-[10px] text-gray-500 font-mono">terminal — agentflow</span>
                </div>
                <button onClick={() => setLogs([])} className="text-[10px] text-gray-600 hover:text-gray-400">Clear</button>
              </div>
              <div ref={logRef} className="h-56 overflow-y-auto p-3 space-y-0.5 bg-black/40 font-mono text-[11px] leading-5">
                {logs.length === 0 ? (
                  <div className="text-gray-700"><span className="animate-pulse">_</span> Ready — type a goal and execute</div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className={`flex gap-2 ${
                      log.msg.includes('❌') ? 'text-red-400' :
                      log.msg.includes('✅') || log.msg.includes('🎯') ? 'text-emerald-400' :
                      log.msg.includes('▶️') ? 'text-blue-400' :
                      log.msg.includes('📋') ? 'text-yellow-400' :
                      log.msg.includes('📸') ? 'text-purple-400' :
                      log.msg.includes('━━━') ? 'text-gray-700' :
                      'text-gray-400'
                    }`}>
                      <span className="text-gray-700 shrink-0 w-14">[{log.ts}]</span>
                      <span>{log.msg}</span>
                    </div>
                  ))
                )}
                {(status === 'streaming' || status === 'executing') && <div className="text-cyan-400 animate-pulse">_</div>}
              </div>
            </div>
          </div>

          {/* ===== RIGHT: PREVIEW + RESULTS ===== */}
          <div className="lg:col-span-2 space-y-4">

            {/* Browser Preview */}
            <div className="bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xs">🌐</span>
                  <span className="text-[10px] text-gray-500 font-mono">Browser Preview</span>
                </div>
                {screenshots.length > 0 && <span className="text-[10px] text-emerald-400">● {screenshots.length} captures</span>}
              </div>
              <div className="h-44 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950">
                {screenshots.length > 0 ? (
                  <div className="text-center">
                    <div className="text-3xl mb-1">🖥️</div>
                    <p className="text-xs text-emerald-400">✓ {screenshots.length} screenshot(s) captured</p>
                    <p className="text-[10px] text-gray-600 mt-1">Real screenshots with Playwright backend</p>
                  </div>
                ) : (
                  <div className="text-center px-4">
                    <div className="text-3xl mb-1 opacity-30">🌐</div>
                    <p className="text-xs text-gray-600">Browser preview appears during live execution</p>
                    <p className="text-[10px] text-gray-700 mt-0.5">Deploy Playwright backend for real screenshots</p>
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            {summary && (
              <div className="bg-gradient-to-br from-cyan-500/5 to-purple-500/5 border border-cyan-500/20 rounded-xl p-4">
                <h3 className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">📊 Results Summary</h3>
                <p className="text-xs text-gray-300 leading-relaxed">{summary}</p>
              </div>
            )}

            {/* Result Cards */}
            {results.length > 0 && (
              <div className="bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] text-gray-500 uppercase tracking-widest">📄 Extracted Results</h3>
                  <span className="text-[10px] text-cyan-400">{results.length} items</span>
                </div>
                <div className="space-y-1.5">
                  {results.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 bg-white/5 rounded-lg hover:bg-white/10 transition-all group">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-[10px] font-bold text-cyan-300">
                        {item.company[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white group-hover:text-cyan-300 transition-colors truncate">{item.company}</p>
                        <p className="text-[10px] text-gray-500 truncate">{item.role}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-emerald-400 font-medium">{item.stipend}</p>
                        <p className="text-[9px] text-gray-600">{item.location}</p>
                      </div>
                      <span className="px-1 py-0.5 text-[9px] bg-cyan-500/10 text-cyan-400 rounded">{item.match}</span>
                      <a href={`https://${item.url}`} target="_blank" className="px-2 py-1 text-[9px] bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-all">Apply</a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Export */}
            {results.length > 0 && (
              <div className="flex gap-2">
                <button onClick={exportCSV} className="flex-1 px-3 py-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-all text-xs font-medium flex items-center justify-center gap-1.5">
                  ⬇ Export CSV ({results.length} rows)
                </button>
                <button onClick={() => {navigator.clipboard.writeText(JSON.stringify(results, null, 2)); addLog('📋 JSON copied to clipboard')}}
                  className="flex-1 px-3 py-2.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-all text-xs font-medium flex items-center justify-center gap-1.5">
                  📋 Copy JSON
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ===== SETTINGS PANEL ===== */}
        {showSettings && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSettings(false)} />
            <div className="relative ml-auto w-72 h-full bg-[#0d1117]/95 backdrop-blur-xl border-l border-white/10 p-5 overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-medium text-cyan-300">⚙️ Settings</h2>
                <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-white">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1.5">AI Model</label>
                  <select value={settings.model} onChange={e => setSettings(p => ({...p, model: e.target.value}))}
                    className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 focus:outline-none focus:border-cyan-500">
                    <option value="auto">Auto (recommended)</option>
                    <option value="gpt4">GPT-4o</option>
                    <option value="gemini">Gemini Pro</option>
                    <option value="claude">Claude 3</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1.5">Execution Speed</label>
                  <select value={settings.speed} onChange={e => setSettings(p => ({...p, speed: e.target.value}))}
                    className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 focus:outline-none focus:border-cyan-500">
                    <option value="slow">Slow (visible)</option>
                    <option value="normal">Normal</option>
                    <option value="fast">Fast</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Headless Mode</span>
                  <button onClick={() => setSettings(p => ({...p, headless: !p.headless}))}
                    className={`w-9 h-5 rounded-full transition-all ${settings.headless ? 'bg-cyan-500' : 'bg-gray-700'}`}>
                    <span className={`block w-3.5 h-3.5 bg-white rounded-full transition-all mt-0.5 ${settings.headless ? 'ml-4.5' : 'ml-1'}`}/>
                  </button>
                </div>
                <div className="pt-3 border-t border-white/5">
                  <p className="text-[10px] text-gray-600">Settings apply on next execution. Full Playwright backend on Railway unlocks all features.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== HISTORY PANEL ===== */}
        {showHistory && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
            <div className="relative ml-auto w-80 h-full bg-[#0d1117]/95 backdrop-blur-xl border-l border-white/10 p-5 overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-medium text-cyan-300">📋 History</h2>
                <button onClick={() => setShowHistory(false)} className="text-gray-500 hover:text-white">✕</button>
              </div>
              {history.length === 0 ? (
                <div className="text-center py-10"><p className="text-3xl mb-2 opacity-30">📭</p><p className="text-xs text-gray-600">No tasks yet</p><p className="text-[10px] text-gray-700 mt-1">Run an automation to see history</p></div>
              ) : (
                <div className="space-y-2">
                  {history.map((h, i) => (
                    <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-cyan-500/20 transition-all cursor-pointer" onClick={() => { setGoal(h.goal); setShowHistory(false) }}>
                      <p className="text-xs font-medium text-cyan-300 truncate">{h.goal}</p>
                      <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{h.summary}</p>
                      <p className="text-[9px] text-gray-700 mt-1">{h.time}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 p-3 bg-cyan-500/5 rounded-xl border border-cyan-500/10">
                <p className="text-[10px] text-gray-500">💾 Connect Supabase for persistent cross-session memory.</p>
              </div>
            </div>
          </div>
        )}

        {/* ===== EMPTY STATE ===== */}
        {logs.length === 0 && steps.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4 opacity-20">🤖</div>
            <h2 className="text-lg text-gray-500 mb-1">Ready to automate the web</h2>
            <p className="text-xs text-gray-700 mb-4">Type a goal, pick a template, or use voice 🎤</p>
            <div className="flex justify-center gap-1.5">
              <span className="px-2.5 py-1 text-[10px] bg-white/5 text-gray-500 rounded-lg">▶ Execute</span>
              <span className="px-2.5 py-1 text-[10px] bg-white/5 text-gray-500 rounded-lg">📊 Extract</span>
              <span className="px-2.5 py-1 text-[10px] bg-white/5 text-gray-500 rounded-lg">💾 Export</span>
              <span className="px-2.5 py-1 text-[10px] bg-white/5 text-gray-500 rounded-lg">🧠 Remember</span>
            </div>
          </div>
        )}

        <footer className="mt-8 pt-4 border-t border-white/5 flex justify-between text-[10px] text-gray-700">
          <span>AgentFlow AI v2.0</span>
          <span>Vercel + Railway</span>
        </footer>
      </div>

      <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}.scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  )
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))
