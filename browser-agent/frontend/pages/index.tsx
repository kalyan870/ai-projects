import { useState } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function Home() {
  const [goal, setGoal] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'plan' | 'execution' | 'summary'>('summary')

  const runAgent = async () => {
    if (!goal.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await axios.post(`${API_URL}/api/run`, { goal, user_id: 'default' })
      setResult(res.data)
    } catch (err: any) {
      setResult({ error: err.response?.data?.detail || err.message })
    }
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-6xl mx-auto p-6">
        <header className="text-center mb-12 pt-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              Autonomous Browser Agent
            </span>
          </h1>
          <p className="text-blue-200/70 text-lg">AI-powered web automation at your command</p>
        </header>

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8 mb-8">
          <div className="flex gap-4">
            <input
              value={goal}
              onChange={e => setGoal(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runAgent()}
              placeholder='e.g. "Find top AI internships under ₹20k stipend and export to CSV"'
              className="flex-1 px-6 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/40 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={runAgent}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {loading ? (
                <><span className="animate-spin">&#9696;</span> Running...</>
              ) : (
                <><span>&#9654;</span> Run Agent</>
              )}
            </button>
          </div>
        </div>

        {loading && (
          <div className="animate-pulse bg-white/5 rounded-2xl border border-white/10 p-8 mb-8">
            <div className="h-4 bg-white/10 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-white/10 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-white/10 rounded w-2/3"></div>
          </div>
        )}

        {result && !loading && (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
            <div className="flex border-b border-white/10">
              {['summary', 'plan', 'execution'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-3 capitalize font-medium text-sm transition-colors ${
                    activeTab === tab ? 'bg-blue-500/20 text-blue-300 border-b-2 border-blue-400' : 'text-blue-200/50 hover:text-blue-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
              <div className="ml-auto flex gap-2 p-2">
                <button onClick={exportCSV} className="px-4 py-2 text-sm bg-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/30">Export CSV</button>
              </div>
            </div>

            <div className="p-8">
              {result.error ? (
                <div className="text-red-400 bg-red-500/10 rounded-xl p-4">{result.error}</div>
              ) : activeTab === 'summary' ? (
                <div className="text-white space-y-4">
                  <h3 className="text-xl font-semibold text-blue-300">Goal</h3>
                  <p className="text-lg">{result.goal}</p>
                  <h3 className="text-xl font-semibold text-blue-300 mt-6">Summary</h3>
                  <p className="text-gray-300">{result.summary}</p>
                </div>
              ) : activeTab === 'plan' ? (
                <div className="space-y-3">
                  {result.plan?.map((step: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                      <span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center text-sm font-bold">{i + 1}</span>
                      <span className="text-cyan-300 font-mono">{step.action}</span>
                      <span className="text-gray-400 text-sm">{JSON.stringify(step.params)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {result.execution?.map((step: any, i: number) => (
                    <div key={i} className="p-4 bg-white/5 rounded-xl">
                      <div className="flex gap-3 items-start">
                        <span className={`px-2 py-0.5 rounded text-xs font-mono ${
                          step.result?.startsWith('ERROR') ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>{step.action}</span>
                        <div className="flex-1">
                          <p className="text-gray-300 text-sm font-mono">{JSON.stringify(step.params)}</p>
                          <p className="text-gray-400 text-xs mt-1">{String(step.result).slice(0, 200)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
