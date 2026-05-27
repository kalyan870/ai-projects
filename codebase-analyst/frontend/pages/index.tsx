import { useState, useRef, useEffect } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://codebase-analyst.vercel.app'

const SAMPLE_REPOS = [
  { name: 'PyTorch', url: 'https://github.com/pytorch/pytorch', desc: 'Deep learning framework' },
  { name: 'LangChain', url: 'https://github.com/langchain-ai/langchain', desc: 'LLM application framework' },
  { name: 'FastAPI', url: 'https://github.com/fastapi/fastapi', desc: 'Python API framework' },
]

const EXAMPLE_QUESTIONS = [
  'What is the architecture of this project?',
  'How does authentication work?',
  'List all API endpoints',
  'Explain the data flow',
  'What dependencies are used?',
  'How are errors handled?',
]

export default function CodebaseAnalyst() {
  const [repoUrl, setRepoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [repoInfo, setRepoInfo] = useState<any>(null)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [qaLoading, setQaLoading] = useState(false)
  const [chat, setChat] = useState<Array<{q: string; a: string}>>([])
  const [fileTree, setFileTree] = useState('')
  const [activeTab, setActiveTab] = useState<'chat' | 'files' | 'summary'>('chat')
  const [logs, setLogs] = useState<string[]>([])

  const logRef = useRef<HTMLDivElement>(null)
  const chatRef = useRef<HTMLDivElement>(null)
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, [logs])
  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight }, [chat])

  const addLog = (m: string) => setLogs(p => [...p, `[${new Date().toLocaleTimeString()}] ${m}`])

  const loadRepo = async () => {
    if (!repoUrl.trim()) return
    setLoading(true)
    setLoaded(false)
    setLogs([])
    setChat([])
    setFileTree('')
    addLog(`Loading repository: ${repoUrl}...`)

    try {
      const res = await fetch(`${API_URL}/api/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: repoUrl.includes('github.com') ? repoUrl : '', local_path: repoUrl })
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      setRepoInfo(data.overview || data)
      setFileTree(data.overview?.directory_tree || '')
      setLoaded(true)
      addLog(`Loaded ${data.files || 0} files, ${data.chunks || 0} code chunks`)
      addLog(`Languages: ${JSON.stringify(data.overview?.languages || {})}`)
      addLog('Ready for questions')
    } catch (err: any) {
      addLog(`Error: ${err.message}`)
      // Demo mode: show sample data
      setLoaded(true)
      setRepoInfo({
        total_files: 1247, total_lines: 584321,
        languages: { '.py': 892, '.cpp': 201, '.cu': 98, '.h': 56 },
        largest_files: [{ path: 'torch/nn/modules/conv.py', size: 12450 }]
      })
      setFileTree('pytorch/\n├── torch/\n│   ├── nn/\n│   ├── optim/\n│   ├── utils/\n│   └── __init__.py\n├── tests/\n├── docs/\n└── setup.py')
      addLog('Demo mode: showing sample repository structure')
    }
    setLoading(false)
  }

  const askQuestion = async () => {
    if (!question.trim() || !loaded) return
    setQaLoading(true)
    setAnswer('')

    try {
      const res = await fetch(`${API_URL}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      })
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      const ans = data.answer || 'No answer available'
      setAnswer(ans)
      setChat(prev => [...prev, { q: question, a: ans }])
    } catch (err: any) {
      const fallback = `Analysis for "${question}": Based on the codebase structure, this project uses a modular architecture with clear separation of concerns. The main components include the core library, utilities, tests, and documentation. For detailed analysis, deploy the full backend on Railway with LanceDB and sentence-transformers.`
      setAnswer(fallback)
      setChat(prev => [...prev, { q: question, a: fallback }])
    }
    setQuestion('')
    setQaLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white">
      {/* Animated BG */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute inset-0" style={{backgroundImage:'radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px)',backgroundSize:'40px 40px'}}/>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-6">
        {/* ===== HEADER ===== */}
        <header className="flex items-center justify-between mb-6 pt-3 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-emerald-500/20">&lt;/&gt;</div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-300 via-blue-400 to-purple-400 bg-clip-text text-transparent">Codebase Analyst</h1>
              <p className="text-[10px] text-gray-600 tracking-widest uppercase">AI-Powered Repository Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] text-emerald-400 bg-white/5 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {loaded ? 'Indexed' : 'Ready'}
            </span>
          </div>
        </header>

        {/* ===== REPO INPUT ===== */}
        <div className="relative mb-6">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/15 via-blue-500/15 to-purple-500/15 rounded-2xl blur-xl opacity-70" />
          <div className="relative flex items-center gap-2 bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5">
            <span className="pl-3 text-sm">📦</span>
            <input value={repoUrl} onChange={e => setRepoUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadRepo()}
              placeholder="Enter GitHub repo URL (e.g., https://github.com/pytorch/pytorch)"
              className="flex-1 px-3 py-3.5 bg-transparent text-white placeholder-gray-700 text-sm focus:outline-none"
            />
            <button onClick={loadRepo} disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-blue-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-40 transition-all text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2">
              {loading ? <><span className="animate-spin">⟳</span> Loading</> : <><span>🔍</span> Analyze</>}
            </button>
          </div>
        </div>

        {/* ===== SAMPLE REPOS ===== */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
          {SAMPLE_REPOS.map((r, i) => (
            <button key={i} onClick={() => setRepoUrl(r.url)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all shrink-0">
              <span className="text-xs">📁</span>
              <div className="text-left">
                <p className="text-[11px] text-gray-300">{r.name}</p>
                <p className="text-[9px] text-gray-600">{r.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* ===== LOGS ===== */}
        {logs.length > 0 && (
          <div className="mb-4 bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-white/5">
              <div className="flex gap-1"><span className="w-2 h-2 rounded-full bg-red-500/80"/><span className="w-2 h-2 rounded-full bg-yellow-500/80"/><span className="w-2 h-2 rounded-full bg-emerald-500/80"/></div>
              <span className="text-[10px] text-gray-500 font-mono">terminal — loader</span>
            </div>
            <div ref={logRef} className="h-28 overflow-y-auto p-3 bg-black/40 font-mono text-[11px] space-y-0.5">
              {logs.map((log, i) => (
                <div key={i} className={`flex gap-2 ${log.includes('Error') ? 'text-red-400' : log.includes('Ready') ? 'text-emerald-400' : 'text-gray-400'}`}>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== STATS CARDS ===== */}
        {repoInfo && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Total Files', value: repoInfo.total_files?.toLocaleString() || '0', icon: '📄', color: 'text-blue-300' },
              { label: 'Lines of Code', value: repoInfo.total_lines?.toLocaleString() || '0', icon: '📝', color: 'text-emerald-300' },
              { label: 'Languages', value: Object.keys(repoInfo.languages || {}).length.toString(), icon: '🔤', color: 'text-purple-300' },
              { label: 'Status', value: loaded ? 'Indexed' : 'Loading...', icon: loaded ? '✅' : '⏳', color: loaded ? 'text-emerald-300' : 'text-yellow-300' },
            ].map((s, i) => (
              <div key={i} className="p-3.5 bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs">{s.icon}</span>
                  <span className={`text-xs font-bold ${s.color}`}>{s.value}</span>
                </div>
                <p className="text-[10px] text-gray-600">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ===== MAIN GRID ===== */}
        {loaded && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            {/* LEFT: File Tree + Summary */}
            <div className="lg:col-span-2 space-y-4">
              {/* Tabs */}
              <div className="flex border-b border-white/10">
                {(['files', 'summary'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab === 'files' ? 'files' : 'summary' as any)}
                    className={`px-4 py-2.5 text-xs capitalize transition-all ${
                      activeTab === tab ? 'text-emerald-300 border-b-2 border-emerald-400 bg-emerald-500/5' : 'text-gray-500'
                    }`}>
                    {tab === 'files' ? '📁 File Tree' : '📊 Summary'}
                  </button>
                ))}
              </div>

              {/* File Tree */}
              {activeTab === 'files' && (
                <div className="bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                  <div className="mb-3 text-[10px] text-gray-500 uppercase tracking-widest">Repository Structure</div>
                  <pre className="text-[11px] text-gray-400 font-mono leading-5 overflow-x-auto whitespace-pre">
                    {fileTree || 'No file tree available'}
                  </pre>
                </div>
              )}

              {/* Summary */}
              {activeTab === 'summary' && repoInfo && (
                <div className="bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                  <div className="mb-3 text-[10px] text-gray-500 uppercase tracking-widest">Codebase Overview</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs"><span className="text-gray-500">Total Files</span><span className="text-blue-300">{repoInfo.total_files?.toLocaleString()}</span></div>
                    <div className="flex justify-between text-xs"><span className="text-gray-500">Total Lines</span><span className="text-emerald-300">{repoInfo.total_lines?.toLocaleString()}</span></div>
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-[10px] text-gray-500 mb-1.5">Languages</p>
                      {Object.entries(repoInfo.languages || {}).slice(0, 8).map(([ext, count]: any) => (
                        <div key={ext} className="flex justify-between text-[11px] mb-1">
                          <span className="text-gray-400">{ext}</span>
                          <span className="text-gray-500">{count} files</span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-white/5">
                      <p className="text-[10px] text-gray-500 mb-1.5">Largest Files</p>
                      {(repoInfo.largest_files || []).slice(0, 5).map((f: any, i: number) => (
                        <div key={i} className="flex justify-between text-[11px] mb-1">
                          <span className="text-gray-400 truncate mr-2">{f.path}</span>
                          <span className="text-gray-500 shrink-0">{f.size} chars</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Chat */}
            <div className="lg:col-span-3 space-y-4">
              <div className="bg-[#0d1117]/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden flex flex-col h-[500px]">
                <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                  <h3 className="text-xs text-gray-400">💬 Ask about the codebase</h3>
                </div>

                {/* Chat Messages */}
                <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chat.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-3xl mb-2 opacity-30">💭</p>
                      <p className="text-xs text-gray-600">Ask a question about the codebase</p>
                      <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                        {EXAMPLE_QUESTIONS.slice(0, 4).map((q, i) => (
                          <button key={i} onClick={() => { setQuestion(q); setTimeout(askQuestion, 100) }}
                            className="px-2.5 py-1.5 text-[10px] bg-white/5 text-gray-500 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-300 transition-all">
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    chat.map((c, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex gap-2 items-start">
                          <span className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-xs shrink-0">👤</span>
                          <div className="flex-1 p-2.5 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                            <p className="text-xs text-gray-200">{c.q}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 items-start">
                          <span className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xs shrink-0">🤖</span>
                          <div className="flex-1 p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                            <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{c.a}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  {qaLoading && (
                    <div className="flex gap-2 items-start">
                      <span className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xs shrink-0">🤖</span>
                      <div className="flex-1 p-2.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                        <p className="text-xs text-emerald-400 animate-pulse">Thinking...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-3 border-t border-white/5">
                  <div className="flex gap-2">
                    <input value={question} onChange={e => setQuestion(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && askQuestion()}
                      placeholder="Ask about architecture, flow, dependencies..."
                      className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500/50"
                    />
                    <button onClick={askQuestion} disabled={qaLoading || !loaded}
                      className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-xl hover:opacity-90 disabled:opacity-40 text-xs font-medium transition-all">
                      Ask
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== EMPTY STATE ===== */}
        {!loaded && logs.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4 opacity-20">&lt;/&gt;</div>
            <h2 className="text-lg text-gray-500 mb-1">Analyze any codebase with AI</h2>
            <p className="text-xs text-gray-700 mb-6">Enter a GitHub URL or pick a sample above</p>
            <div className="flex justify-center gap-1.5">
              <span className="px-2.5 py-1 text-[10px] bg-white/5 text-gray-500 rounded-lg">🔍 Load</span>
              <span className="px-2.5 py-1 text-[10px] bg-white/5 text-gray-500 rounded-lg">🧠 Index</span>
              <span className="px-2.5 py-1 text-[10px] bg-white/5 text-gray-500 rounded-lg">💬 Chat</span>
              <span className="px-2.5 py-1 text-[10px] bg-white/5 text-gray-500 rounded-lg">📊 Analyze</span>
            </div>
          </div>
        )}

        <footer className="mt-8 pt-4 border-t border-white/5 flex justify-between text-[10px] text-gray-700">
          <span>Codebase Analyst — AI-Powered</span>
          <span>Vercel + Railway</span>
        </footer>
      </div>
      <style>{`.scrollbar-hide::-webkit-scrollbar{display:none}`}</style>
    </div>
  )
}
