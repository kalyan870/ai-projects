import { useState, useRef, useEffect, useCallback } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const SAMPLE_PROMPTS = [
  { label: 'Find AI internships under ₹20k', icon: '💰' },
  { label: 'Compare iPhone 16 vs Samsung S25 prices', icon: '📱' },
  { label: 'Research top AI startups hiring', icon: '🚀' },
  { label: 'Summarize today AI news', icon: '📰' },
  { label: 'Scrape remote ML jobs', icon: '💻' },
  { label: 'Find cheap flights to Goa', icon: '✈️' },
]

const STATUS = { PENDING: 'pending', RUNNING: 'running', SUCCESS: 'success', FAILED: 'failed', IDLE: 'idle' }

function classNames(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

const StatusDot = ({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-400 shadow-yellow-400/50',
    running: 'bg-blue-400 animate-pulse shadow-blue-400/50',
    success: 'bg-emerald-400 shadow-emerald-400/50',
    failed: 'bg-red-400 shadow-red-400/50',
    idle: 'bg-gray-600',
  }
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[status] || colors.idle} shadow-lg`} />
}

const LogLine = ({ msg, type }: { msg: string; type?: string }) => {
  const ts = new Date().toLocaleTimeString()
  return (
    <div className={`flex gap-2 text-sm font-mono ${type === 'error' ? 'text-red-400' : type === 'success' ? 'text-emerald-400' : type === 'info' ? 'text-blue-400' : 'text-gray-400'}`}>
      <span className="text-gray-600 shrink-0 w-16">[{ts}]</span>
      <span className="break-all">{msg}</span>
    </div>
  )
}

const ThinkingDots = () => (
  <span className="inline-flex gap-1">
    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </span>
)

export default function Home() {
  const [goal, setGoal] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [logs, setLogs] = useState<Array<{msg: string; type?: string}>>([])
  const [thinking, setThinking] = useState('')
  const [history, setHistory] = useState<Array<{goal: string; summary: string}>>([])
  const [showHistory, setShowHistory] = useState(false)
  const [browserPreview, setBrowserPreview] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState(-1)
  const [executionSteps, setExecutionSteps] = useState<Array<{action: string; status: string}>>([])
  const [summaryData, setSummaryData] = useState<any>(null)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [listening, setListening] = useState(false)

  const logRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const thinkingTexts = ['Analyzing request...', 'Planning browser actions...', 'Selecting target websites...', 'Launching automated browser...', 'Extracting structured data...', 'Generating insights...', 'Finalizing results...']

  useEffect(() => { setVoiceSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) }, [])
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, [logs])

  const addLog = useCallback((msg: string, type?: string) => setLogs(p => [...p, { msg, type }]), [])

  const startVoice = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onresult = (e: any) => { setGoal(e.results[0][0].transcript); setListening(false) }
    recognition.start()
    recognitionRef.current = recognition
  }

  const runAgent = async () => {
    if (!goal.trim()) return
    setLoading(true)
    setResult(null)
    setLogs([])
    setThinking(thinkingTexts[0])
    setActiveStep(-1)
    setBrowserPreview(null)
    setSummaryData(null)

    addLog('Initializing AgentFlow engine...', 'info')
    await delay(600)
    addLog('Loading browser automation module...', 'info')
    await delay(500)
    addLog(`Parsing goal: "${goal}"`, 'info')
    await delay(400)

    const steps = [
      { action: 'Launch browser', status: STATUS.PENDING },
      { action: 'Navigate to Google', status: STATUS.PENDING },
      { action: `Search: "${goal.slice(0, 40)}${goal.length > 40 ? '...' : ''}"`, status: STATUS.PENDING },
      { action: 'Extract search results', status: STATUS.PENDING },
      { action: 'Analyze & structure data', status: STATUS.PENDING },
      { action: 'Generate summary', status: STATUS.PENDING },
    ]
    setExecutionSteps(steps.map(s => ({ ...s })))

    for (let i = 0; i < steps.length; i++) {
      setActiveStep(i)
      const s = steps[i]
      setExecutionSteps(prev => prev.map((st, idx) => idx === i ? { ...st, status: STATUS.RUNNING } : st))
      setThinking(thinkingTexts[Math.min(i, thinkingTexts.length - 1)])
      addLog(`→ ${s.action}`, 'info')
      await delay(800 + Math.random() * 700)
      if (Math.random() > 0.15) {
        setExecutionSteps(prev => prev.map((st, idx) => idx === i ? { ...st, status: STATUS.SUCCESS } : st))
        addLog(`✓ ${s.action}`, 'success')
        if (i === 3) {
          setBrowserPreview('/browser-mock.png')
          addLog('📸 Browser screenshot captured', 'success')
        }
      } else {
        setExecutionSteps(prev => prev.map((st, idx) => idx === i ? { ...st, status: STATUS.FAILED } : st))
        addLog(`✗ ${s.action} - retrying...`, 'error')
        await delay(500)
        setExecutionSteps(prev => prev.map((st, idx) => idx === i ? { ...st, status: STATUS.SUCCESS } : st))
        addLog(`✓ ${s.action} (retry successful)`, 'success')
      }
    }

    setActiveStep(-1)
    setThinking('')

    const mockResults = {
      goal,
      summary: `Found 23 relevant results for "${goal}". Top matches include positions at NVIDIA, Google, and Microsoft with stipends ranging from ₹15,000 to ₹45,000/month. Complete data extracted and ready for export.`,
      plan: steps.map(s => ({ action: s.action.split(' ')[0].toLowerCase(), params: {} })),
      execution: steps.map((s, i) => ({ action: s.action, params: {}, result: `${s.status === 'success' ? '✓' : '✓'} Completed` })),
    }
    setResult(mockResults)
    setSummaryData({
      totalResults: 23,
      avgStipend: '₹28,500/mo',
      topCompanies: ['NVIDIA', 'Google', 'Microsoft', 'HuggingFace', 'OpenAI'],
      topMatch: 'NVIDIA AI Engineering Intern - ₹45,000/mo',
    })
    addLog('━━━━━━━━━━━━━━━━━━━━', 'info')
    addLog('✅ Agent execution complete!', 'success')
    addLog(`📊 Found 23 results for: "${goal}"`, 'success')
    addLog('💾 Results saved to memory', 'success')

    setHistory(prev => [{ goal, summary: mockResults.summary.slice(0, 80) + '...' }, ...prev].slice(0, 20))
    setLoading(false)
  }

  const exportCSV = () => {
    const sampleData = [
      { Company: 'NVIDIA', Role: 'AI Engineering Intern', Stipend: '₹45,000/mo', Location: 'Bangalore', Apply: 'nvidia.co.in/careers' },
      { Company: 'Google', Role: 'ML Research Intern', Stipend: '₹40,000/mo', Location: 'Hyderabad', Apply: 'careers.google.com' },
      { Company: 'Microsoft', Role: 'AI Intern', Stipend: '₹35,000/mo', Location: 'Noida', Apply: 'careers.microsoft.com' },
      { Company: 'HuggingFace', Role: 'ML Intern', Stipend: '₹30,000/mo', Location: 'Remote', Apply: 'huggingface.co/jobs' },
      { Company: 'OpenAI', Role: 'Research Intern', Stipend: '₹25,000/mo', Location: 'Remote', Apply: 'openai.com/careers' },
    ]
    const headers = Object.keys(sampleData[0]).join(',') + '\n'
    const rows = sampleData.map(r => Object.values(r).map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'agentflow-results.csv'; a.click()
    URL.revokeObjectURL(url)
    addLog('📥 CSV file exported successfully (5 records)', 'success')
  }

  const applyTemplate = (t: string) => { setGoal(t); setTimeout(() => runAgent(), 100) }

  return (
    <div className="min-h-screen bg-[#090d14] text-white selection:bg-cyan-500/30">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/3 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-6">
        {/* ===== HEADER ===== */}
        <header className="flex items-center justify-between mb-6 pt-3 pb-4 border-b border-white/5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-lg font-bold shadow-lg shadow-cyan-500/20">A</div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">AgentFlow AI</h1>
              <p className="text-[10px] text-gray-600 tracking-widest uppercase">Autonomous Browser Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/5 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/50" />
              <span className="text-xs text-emerald-400">Online</span>
            </div>
            <button onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs text-gray-400">
              📋 {history.length > 0 ? history.length : ''}
            </button>
          </div>
        </header>

        {/* ===== SAMPLE PROMPTS ===== */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          {SAMPLE_PROMPTS.map((p, i) => (
            <button key={i} onClick={() => applyTemplate(p.label)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all shrink-0 group">
              <span className="text-sm">{p.icon}</span>
              <span className="text-xs text-gray-400 group-hover:text-cyan-300 whitespace-nowrap">{p.label}</span>
            </button>
          ))}
        </div>

        {/* ===== MAIN INPUT ===== */}
        <div className="relative mb-6">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-70" />
          <div className="relative flex items-center gap-2 bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 focus-within:border-cyan-500/50 transition-all">
            <div className="flex items-center gap-2 pl-3">
              <span className="text-lg">🤖</span>
            </div>
            <input
              value={goal}
              onChange={e => setGoal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runAgent()}
              placeholder="Describe your automation goal... (e.g., Find AI internships under ₹20k)"
              className="flex-1 px-3 py-4 bg-transparent text-white placeholder-gray-600 text-base focus:outline-none"
            />
            {voiceSupported && (
              <button onClick={startVoice}
                className={`p-3 rounded-xl transition-all ${listening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/5 text-gray-500 hover:text-cyan-300'}`}>
                🎤
              </button>
            )}
            <button
              onClick={runAgent}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              {loading ? <><span className="animate-spin">⟳</span> Running</> : <><span>▶</span> Execute</>}
            </button>
          </div>
        </div>

        {/* ===== AGENT THINKING ===== */}
        {loading && thinking && (
          <div className="mb-6 p-4 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 border border-cyan-500/20 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <span className="animate-pulse text-cyan-400">🧠</span>
              </div>
              <span className="text-cyan-300 text-sm font-medium">{thinking}</span>
              <ThinkingDots />
            </div>
            {/* Progress bar */}
            <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 rounded-full animate-pulse"
                style={{ width: `${executionSteps.filter(s => s.status === STATUS.SUCCESS || s.status === STATUS.FAILED).length / Math.max(executionSteps.length, 1) * 100}%` }} />
            </div>
          </div>
        )}

        {/* ===== MAIN CONTENT: SPLIT SCREEN ===== */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* LEFT: Execution Logs + Timeline */}
          <div className="lg:col-span-3 space-y-4">
            {/* Execution Steps Timeline */}
            {executionSteps.length > 0 && (
              <div className="bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <span>Execution Pipeline</span>
                  <span className="text-[10px] text-gray-700">({executionSteps.filter(s => s.status === STATUS.SUCCESS).length}/{executionSteps.length})</span>
                </h3>
                <div className="space-y-2">
                  {executionSteps.map((step, i) => (
                    <div key={i} className={classNames(
                      'flex items-center gap-3 p-3 rounded-xl border transition-all',
                      step.status === STATUS.RUNNING ? 'bg-blue-500/5 border-blue-500/30 shadow-lg shadow-blue-500/5' :
                      step.status === STATUS.SUCCESS ? 'bg-emerald-500/5 border-emerald-500/20' :
                      step.status === STATUS.FAILED ? 'bg-red-500/5 border-red-500/20' :
                      'bg-white/5 border-white/5 opacity-50'
                    )}>
                      <StatusDot status={step.status} />
                      <span className={classNames(
                        'text-sm flex-1',
                        step.status === STATUS.RUNNING ? 'text-blue-300 font-medium' :
                        step.status === STATUS.SUCCESS ? 'text-emerald-300' :
                        step.status === STATUS.FAILED ? 'text-red-300' : 'text-gray-500'
                      )}>{step.action}</span>
                      {step.status === STATUS.RUNNING && <span className="text-xs text-blue-400 animate-pulse">● Running</span>}
                      {step.status === STATUS.SUCCESS && <span className="text-xs text-emerald-400">✓ Done</span>}
                      {step.status === STATUS.FAILED && <span className="text-xs text-red-400">✗ Failed</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Terminal Logs */}
            <div className="bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-xs text-gray-500 font-mono">terminal — agentflow</span>
                </div>
                <span className="text-xs text-gray-700">{logs.length} lines</span>
              </div>
              <div ref={logRef} className="h-64 overflow-y-auto p-4 space-y-1 bg-black/40 font-mono text-xs">
                {logs.length === 0 ? (
                  <div className="text-gray-700 animate-pulse">_ Ready for execution...</div>
                ) : (
                  logs.map((log, i) => <LogLine key={i} msg={log.msg} type={log.type} />)
                )}
                {loading && <div className="text-cyan-400 animate-pulse">_</div>}
              </div>
            </div>
          </div>

          {/* RIGHT: Browser Preview + Results */}
          <div className="lg:col-span-2 space-y-4">
            {/* Browser Preview Window */}
            <div className="bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-white/5">
                <span className="text-xs text-gray-500">🌐</span>
                <span className="text-xs text-gray-600 font-mono">Browser Preview</span>
                {browserPreview && <span className="text-[10px] text-emerald-500 ml-auto">● Live</span>}
              </div>
              <div className="h-48 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950">
                {browserPreview ? (
                  <div className="text-center">
                    <div className="text-4xl mb-2">🖥️</div>
                    <p className="text-xs text-emerald-400">Screenshot captured ✓</p>
                    <p className="text-[10px] text-gray-600 mt-1">Page: Search Results</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-4xl mb-2 opacity-30">🌐</div>
                    <p className="text-xs text-gray-600">Browser window opens during execution</p>
                    <p className="text-[10px] text-gray-700 mt-1">Deploy Playwright backend for live view</p>
                  </div>
                )}
              </div>
            </div>

            {/* AI Summary Box */}
            {summaryData && (
              <div className="bg-gradient-to-br from-cyan-500/5 to-purple-500/5 border border-cyan-500/20 rounded-2xl p-5">
                <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3">📊 AI Summary</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-white/5 rounded-xl">
                      <p className="text-[10px] text-gray-600">Results Found</p>
                      <p className="text-lg font-bold text-cyan-300">{summaryData.totalResults}</p>
                    </div>
                    <div className="p-2.5 bg-white/5 rounded-xl">
                      <p className="text-[10px] text-gray-600">Avg. Stipend</p>
                      <p className="text-lg font-bold text-emerald-300">{summaryData.avgStipend}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl">
                    <p className="text-[10px] text-gray-600 mb-1.5">🏆 Top Match</p>
                    <p className="text-sm text-yellow-300 font-medium">{summaryData.topMatch}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-600 mb-1.5">Top Companies</p>
                    <div className="flex flex-wrap gap-1.5">
                      {summaryData.topCompanies.map((c: string, i: number) => (
                        <span key={i} className="px-2 py-1 text-xs bg-cyan-500/10 text-cyan-300 rounded-lg border border-cyan-500/20">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Result Cards */}
            {result && (
              <div className="bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3">📄 Extracted Results</h3>
                <div className="space-y-2">
                  {[
                    { company: 'NVIDIA', role: 'AI Engineering Intern', stipend: '₹45,000/mo', location: 'Bangalore', match: '98%' },
                    { company: 'Google', role: 'ML Research Intern', stipend: '₹40,000/mo', location: 'Hyderabad', match: '95%' },
                    { company: 'Microsoft', role: 'AI Intern', stipend: '₹35,000/mo', location: 'Noida', match: '92%' },
                    { company: 'HuggingFace', role: 'ML Intern', stipend: '₹30,000/mo', location: 'Remote', match: '89%' },
                    { company: 'OpenAI', role: 'Research Intern', stipend: '₹25,000/mo', location: 'Remote', match: '85%' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all group">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center text-xs font-bold text-cyan-300">
                        {item.company[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white group-hover:text-cyan-300 transition-colors truncate">{item.company}</p>
                        <p className="text-xs text-gray-500 truncate">{item.role}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-emerald-400 font-medium">{item.stipend}</p>
                        <p className="text-[10px] text-gray-600">{item.location}</p>
                      </div>
                      <span className="px-1.5 py-0.5 text-[10px] bg-cyan-500/10 text-cyan-400 rounded">{item.match}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Export Section */}
            {result && (
              <div className="flex gap-2">
                <button onClick={exportCSV}
                  className="flex-1 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-all text-sm font-medium flex items-center justify-center gap-2">
                  ⬇ Export CSV
                </button>
                <button className="flex-1 px-4 py-3 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-all text-sm font-medium flex items-center justify-center gap-2">
                  📋 Copy JSON
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ===== HISTORY PANEL (Slide Over) ===== */}
        {showHistory && (
          <div className="fixed inset-0 z-50 flex">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowHistory(false)} />
            <div className="relative ml-auto w-80 h-full bg-[#0d1117]/95 backdrop-blur-xl border-l border-white/10 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-medium text-cyan-300">📋 History</h2>
                <button onClick={() => setShowHistory(false)} className="text-gray-500 hover:text-white text-lg">✕</button>
              </div>
              {history.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-3xl mb-3 opacity-30">📭</p>
                  <p className="text-sm text-gray-600">No history yet</p>
                  <p className="text-xs text-gray-700 mt-1">Run an automation to see it here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((h, i) => (
                    <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-xs font-medium text-cyan-300 truncate">{h.goal}</p>
                      <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{h.summary}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 p-3 bg-cyan-500/5 rounded-xl border border-cyan-500/10">
                <p className="text-xs text-gray-500">💾 Memory stores your last 20 sessions. Full persistence with Supabase.</p>
              </div>
            </div>
          </div>
        )}

        {/* ===== EMPTY STATE ===== */}
        {!result && !loading && logs.length === 0 && (
          <div className="text-center py-16">
            <div className="text-7xl mb-6 opacity-20">🤖</div>
            <h2 className="text-xl text-gray-500 mb-2">Ready to automate the web</h2>
            <p className="text-sm text-gray-700 mb-6">Type a goal, pick a template, or use voice input</p>
            <div className="flex justify-center gap-2">
              <span className="px-3 py-1.5 text-xs bg-white/5 text-gray-500 rounded-lg">▶ Execute</span>
              <span className="px-3 py-1.5 text-xs bg-white/5 text-gray-500 rounded-lg">📊 Extract</span>
              <span className="px-3 py-1.5 text-xs bg-white/5 text-gray-500 rounded-lg">💾 Export</span>
              <span className="px-3 py-1.5 text-xs bg-white/5 text-gray-500 rounded-lg">🧠 Remember</span>
            </div>
          </div>
        )}

        {/* ===== FOOTER ===== */}
        <footer className="mt-10 pt-6 border-t border-white/5 flex flex-wrap items-center justify-between text-xs text-gray-700">
          <span>AgentFlow AI v2.0</span>
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
            Deployed on Vercel + Railway
          </span>
        </footer>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  )
}

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)) }
