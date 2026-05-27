import { useState, useRef, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const TEMPLATES = [
  { icon: '💰', label: 'Find Internships', goal: 'Find top AI internships under ₹20k stipend in India' },
  { icon: '📊', label: 'Scrape Products', goal: 'Find the top 10 best selling laptops on Amazon with prices' },
  { icon: '🏢', label: 'Research Companies', goal: 'List top 5 AI companies hiring in Bangalore with salaries' },
  { icon: '📰', label: 'News Summary', goal: 'Get latest AI news headlines from TechCrunch' },
]

const ANIMATION_STEPS = [
  'Analyzing your request...',
  'Planning browser actions...',
  'Launching browser...',
  'Executing workflow...',
  'Extracting results...',
  'Finalizing...',
]

export default function Home() {
  const [goal, setGoal] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'result' | 'logs' | 'screenshots' | 'memory'>('result')
  const [logs, setLogs] = useState<string[]>([])
  const [animStep, setAnimStep] = useState(0)
  const [error, setError] = useState('')
  const logRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<any>(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])

  const runAgent = async () => {
    if (!goal.trim()) return
    setLoading(true)
    setResult(null)
    setLogs([])
    setError('')
    setAnimStep(0)

    addLog('Initializing agent...')
    let step = 0
    intervalRef.current = setInterval(() => {
      step = Math.min(step + 1, ANIMATION_STEPS.length - 1)
      setAnimStep(step)
    }, 1500)

    try {
      addLog('Connecting to agent API...')
      const res = await fetch(`${API_URL}/api/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, user_id: 'default' })
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      addLog('Agent execution completed')
      addLog(`Plan: ${data.plan?.length || 0} steps generated`)
      data.execution?.forEach((e: any) => addLog(`${e.result?.startsWith('ERROR') ? '✗' : '✓'} ${e.action}: ${String(e.result).slice(0, 100)}`))
      setResult(data)
    } catch (err: any) {
      setError(err.message)
      addLog(`✗ Error: ${err.message}`)
    }
    clearInterval(intervalRef.current)
    setAnimStep(ANIMATION_STEPS.length - 1)
    setLoading(false)
  }

  const exportCSV = () => {
    if (!result?.execution) return
    const headers = 'action,params,result\n'
    const rows = result.execution.map((r: any) =>
      `"${r.action}","${JSON.stringify(r.params).replace(/"/g, '""')}","${r.result.replace(/"/g, '""')}"`
    ).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'browser-agent-results.csv'; a.click()
    URL.revokeObjectURL(url)
    addLog('CSV exported successfully')
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white font-mono">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 pt-4 border-b border-cyan-500/20 pb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              AgentFlow AI
            </h1>
            <p className="text-cyan-400/60 text-sm mt-1">Autonomous Browser Intelligence</p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs border border-emerald-500/30">● Online</span>
          </div>
        </header>

        {/* Templates */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {TEMPLATES.map((t, i) => (
            <button key={i} onClick={() => setGoal(t.goal)}
              className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all text-left group">
              <span className="text-xl">{t.icon}</span>
              <span className="text-xs text-gray-400 group-hover:text-cyan-300 transition-colors">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl blur-xl" />
          <div className="relative flex gap-3 bg-[#0d1117] border border-cyan-500/30 rounded-2xl p-2">
            <input
              value={goal}
              onChange={e => setGoal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runAgent()}
              placeholder='e.g. "Find top AI internships under ₹20k stipend"'
              className="flex-1 px-5 py-4 bg-transparent text-cyan-100 placeholder-gray-600 text-lg focus:outline-none"
            />
            <button
              onClick={runAgent}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-2"
            >
              {loading ? (
                <><span className="animate-spin">⟳</span> Running...</>
              ) : (
                <><span>▶</span> Execute</>
              )}
            </button>
          </div>
        </div>

        {/* Loading Animation */}
        {loading && (
          <div className="mb-6 p-6 bg-[#0d1117] border border-cyan-500/20 rounded-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-cyan-300 font-medium">{ANIMATION_STEPS[animStep]}</span>
            </div>
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse" style={{ width: `${((animStep + 1) / ANIMATION_STEPS.length) * 100}%` }} />
            </div>
          </div>
        )}

        {/* Main Content */}
        {(result || error) && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left - Execution Timeline */}
            <div className="lg:col-span-2 bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden">
              <div className="flex border-b border-white/10 bg-white/5">
                {[
                  { id: 'result', label: 'Results', icon: '📊' },
                  { id: 'logs', label: 'Live Logs', icon: '📋' },
                  { id: 'screenshots', label: 'Screenshots', icon: '🖼' },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-5 py-3 text-sm transition-all ${
                      activeTab === tab.id ? 'bg-cyan-500/10 text-cyan-300 border-b-2 border-cyan-400' : 'text-gray-500 hover:text-gray-300'
                    }`}>
                    <span>{tab.icon}</span> {tab.label}
                  </button>
                ))}
                <div className="ml-auto flex items-center gap-2 p-2">
                  <button onClick={exportCSV} className="px-3 py-1.5 text-xs bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 border border-emerald-500/30">
                    ⬇ CSV
                  </button>
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'result' && result && (
                  <div className="space-y-6">
                    <div className="p-4 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-xl border border-cyan-500/20">
                      <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-2">Goal</h3>
                      <p className="text-cyan-300 text-lg">{result.goal}</p>
                    </div>

                    <div>
                      <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3">Execution Timeline</h3>
                      <div className="space-y-2">
                        {result.plan?.map((step: any, i: number) => (
                          <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-cyan-500/20">
                              {i + 1}
                            </div>
                            <div className="flex-1">
                              <span className="text-cyan-300 text-sm font-mono">{step.action}</span>
                              <span className="text-gray-600 text-xs ml-3">{JSON.stringify(step.params)}</span>
                            </div>
                            <span className="text-emerald-400 text-xs">✓</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {result.summary && (
                      <div className="p-4 bg-gradient-to-r from-purple-500/5 to-pink-500/5 rounded-xl border border-purple-500/20">
                        <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-2">AI Summary</h3>
                        <p className="text-gray-300 leading-relaxed">{result.summary}</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'logs' && (
                  <div ref={logRef} className="h-96 overflow-y-auto bg-black/50 rounded-xl p-4 space-y-1">
                    {logs.length === 0 ? (
                      <span className="text-gray-600">No logs yet</span>
                    ) : (
                      logs.map((log, i) => (
                        <div key={i} className={`text-sm ${log.includes('✗') ? 'text-red-400' : log.includes('✓') ? 'text-emerald-400' : 'text-gray-400'}`}>
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'screenshots' && (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">🖥</div>
                    <p className="text-gray-500">Screenshots appear here during live Playwright execution</p>
                    <p className="text-xs text-gray-600 mt-2">Deploy backend to Railway for real browser screenshots</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right - Sidebar */}
            <div className="space-y-4">
              {/* Memory Card */}
              <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-5">
                <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3">Agent Memory</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    Current session stored
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    Preferences: AI / India
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    0 previous searches
                  </div>
                </div>
              </div>

              {/* Error Card */}
              {error && (
                <div className="bg-red-500/5 border border-red-500/30 rounded-2xl p-5">
                  <h3 className="text-xs text-red-400 uppercase tracking-widest mb-2">Error</h3>
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Stats Card */}
              {result && (
                <div className="bg-[#0d1117] border border-white/10 rounded-2xl p-5">
                  <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3">Session Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Steps</span>
                      <span className="text-cyan-300">{result.plan?.length || 0}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Status</span>
                      <span className="text-emerald-400">Completed</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Data Points</span>
                      <span className="text-cyan-300">{result.execution?.length || 0}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!result && !loading && !error && (
          <div className="text-center py-20">
            <div className="text-6xl mb-6 opacity-30">🤖</div>
            <h2 className="text-xl text-gray-500 mb-2">Ready to automate</h2>
            <p className="text-gray-700 text-sm">Type a goal or pick a template above</p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-white/5 text-center text-xs text-gray-700">
          AgentFlow AI — Autonomous Browser Agent — Vercel + Railway
        </footer>
      </div>
    </div>
  )
}
