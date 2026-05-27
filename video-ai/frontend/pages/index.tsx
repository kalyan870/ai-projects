import { useState, useRef, useEffect } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002'

const uploadFileToBlob = async (file: File): Promise<string> => {
  const { clientToken, pathname } = (await axios.post(`${API_URL}/api/upload-url`, { filename: file.name, contentType: file.type })).data
  const storeId = 'store_wiPO3SuGPCYYU9fI'
  const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const res = await fetch(`https://vercel.com/api/blob/?pathname=${encodeURIComponent(pathname)}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${clientToken}`,
      'x-vercel-blob-access': 'public',
      'content-type': file.type,
      'x-api-version': '12',
      'x-vercel-blob-store-id': storeId,
      'x-api-blob-request-id': requestId,
      'x-api-blob-request-attempt': '0'
    },
    body: file
  })
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
  const blob = await res.json()
  return blob.url
}

const STEPS = ['Extracting audio...', 'Transcribing with Whisper...', 'Detecting chapters...', 'Generating embeddings...', 'Building semantic index...', 'Ready']

export default function VideoAI() {
  const [video, setVideo] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [inputMode, setInputMode] = useState<'file' | 'url'>('url')
  const [videoId, setVideoId] = useState('')
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progressStep, setProgressStep] = useState(0)
  const [data, setData] = useState<any>(null)
  const [question, setQuestion] = useState('')
  const [qaResult, setQaResult] = useState('')
  const [qaSources, setQaSources] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<string>('summary')
  const [hoverDrop, setHoverDrop] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!processing) return
    if (progressStep >= STEPS.length - 1) return
    const t = setTimeout(() => setProgressStep(s => Math.min(s + 1, STEPS.length - 1)), 800 + Math.random() * 900)
    return () => clearTimeout(t)
  }, [processing, progressStep])

  const submitVideo = async () => {
    setLoading(true)
    setProgressStep(0)
    try {
      let url = videoUrl
      if (inputMode === 'file' && video) {
        url = await uploadFileToBlob(video)
      }
      if (!url) { setLoading(false); return }
      const res = await axios.post(`${API_URL}/api/upload`, { url, filename: video?.name || url.split('/').pop() })
      setVideoId(res.data.video_id)
      setProcessing(true)
      await processVideo(res.data.video_id)
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message)
    }
    setLoading(false)
    setProcessing(false)
  }

  const processVideo = async (id: string) => {
    try {
      const res = await axios.post(`${API_URL}/api/process/${id}`)
      setData({ video_id: id, ...res.data.sample_data })
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message)
    }
  }

  const askQuestion = async () => {
    if (!question.trim() || !videoId) return
    try {
      const res = await axios.post(`${API_URL}/api/ask`, { video_id: videoId, question })
      setQaResult(res.data.answer)
      setQaSources((res.data.sources || []).slice(0, 3))
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message)
    }
  }

  const formatTime = (s: any) => {
    if (s === undefined || s === null || isNaN(Number(s))) return '0:00'
    const m = Math.floor(Number(s) / 60); const sec = Math.floor(Number(s) % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const renderDropZone = () => (
    <div className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
      hoverDrop ? 'border-purple-400 bg-purple-500/10 shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]' : 'border-white/10 bg-white/[0.02]'
    }`}
      onDragOver={e => { e.preventDefault(); setHoverDrop(true) }}
      onDragLeave={() => setHoverDrop(false)}
      onDrop={e => { e.preventDefault(); setHoverDrop(false); setVideo(e.dataTransfer.files[0]) }}
      onClick={() => fileRef.current?.click()}>
      {video ? (
        <div>
          <p className="text-lg font-medium text-purple-300">{video.name}</p>
          <p className="text-sm text-gray-400">{(video.size / 1024 / 1024).toFixed(1)} MB</p>
        </div>
      ) : (
        <div>
          <p className={`text-4xl mb-4 transition-transform duration-300 ${hoverDrop ? 'scale-110' : ''}`}>&#127916;</p>
          <p className="text-gray-300">Drop video here or click to browse</p>
          <p className="text-sm text-gray-500 mt-2">Uploads directly to Vercel Blob (up to 10GB)</p>
        </div>
      )}
      <input ref={fileRef} type="file" accept=".mp4,.mov,.mkv,.avi" className="hidden"
        onChange={e => setVideo(e.target.files?.[0] || null)} />
    </div>
  )

  const techInsights = data?.tech_insights

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-purple-950/30 to-gray-950 pointer-events-none" />
      <div className="relative max-w-6xl mx-auto p-6">
        <header className="text-center mb-12 pt-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">
            Video AI Summariser
          </h1>
          <p className="text-purple-200/50 text-lg">Upload, transcribe, summarize and ask questions about any video</p>
        </header>

        {!data && !processing && (
          <div className="max-w-xl mx-auto bg-white/[0.04] backdrop-blur-2xl rounded-2xl border border-white/[0.07] shadow-2xl p-8">
            <div className="flex gap-2 mb-6 bg-white/[0.04] rounded-xl p-1">
              <button onClick={() => setInputMode('url')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${inputMode === 'url' ? 'bg-purple-500/30 text-purple-200 shadow-sm' : 'text-gray-400 hover:text-gray-300'}`}>
                Video URL
              </button>
              <button onClick={() => setInputMode('file')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${inputMode === 'file' ? 'bg-purple-500/30 text-purple-200 shadow-sm' : 'text-gray-400 hover:text-gray-300'}`}>
                Upload File
              </button>
            </div>

            {inputMode === 'url' ? (
              <div className="space-y-4">
                <div className="rounded-xl p-4 bg-white/[0.02] border border-white/[0.07]">
                  <label className="block text-sm text-gray-400 mb-2">Paste a video URL (YouTube, direct MP4, etc.)</label>
                  <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 outline-none focus:border-purple-500/50 transition-colors" />
                </div>
                <p className="text-xs text-gray-500 text-center">Or paste a YouTube/direct video link for processing</p>
              </div>
            ) : (
              <div>
                {renderDropZone()}
                <div className="flex gap-3 mt-4">
                  <button onClick={() => fileRef.current?.click()} className="flex-1 px-4 py-3 bg-white/[0.06] hover:bg-white/[0.1] rounded-xl transition-all">
                    Browse
                  </button>
                </div>
              </div>
            )}

            <button onClick={submitVideo} disabled={!((inputMode === 'url' ? videoUrl : video)) || loading}
              className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              {loading ? 'Uploading...' : 'Analyze Video'}
            </button>
          </div>
        )}

        {processing && !data && (
          <div className="max-w-lg mx-auto bg-white/[0.04] backdrop-blur-2xl rounded-2xl border border-white/[0.07] shadow-2xl p-10">
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 rounded-full border-4 border-purple-500/30 border-t-purple-400 animate-spin" />
              <div className="w-full space-y-4">
                {STEPS.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500 ${
                      i < progressStep ? 'bg-green-500/30 text-green-400' :
                      i === progressStep ? 'bg-purple-500/30 text-purple-300 ring-2 ring-purple-400/50' :
                      'bg-white/[0.05] text-gray-500'
                    }`}>
                      {i < progressStep ? '\u2713' : i + 1}
                    </div>
                    <span className={`text-sm transition-colors duration-300 ${
                      i < progressStep ? 'text-green-400/70' :
                      i === progressStep ? 'text-purple-200' :
                      'text-gray-500'
                    }`}>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            <div className="bg-white/[0.04] backdrop-blur-2xl rounded-2xl border border-white/[0.07] shadow-2xl overflow-hidden">
              <div className="flex overflow-x-auto border-b border-white/[0.07]">
                {['summary', 'chapters', 'moments', 'qa', 'transcript'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-6 py-3 capitalize font-medium text-sm transition-colors whitespace-nowrap ${
                      activeTab === tab ? 'bg-purple-500/15 text-purple-300 border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'
                    }`}>{tab}</button>
                ))}
              </div>
              <div className="p-8">
                {activeTab === 'summary' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <h3 className="text-xl font-semibold text-purple-300">Duration: {formatTime(data.duration)}</h3>
                      {techInsights && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">{techInsights.language?.toUpperCase() === 'EN' ? 'English' : techInsights.language?.toUpperCase() || 'English'}</span>
                      )}
                    </div>
                    <p className="text-gray-300 leading-relaxed">{data.summary}</p>
                  </div>
                )}
                {activeTab === 'chapters' && (
                  <div className="space-y-2">
                    {data.chapters?.map((ch: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-3 bg-white/[0.03] hover:bg-white/[0.06] rounded-xl transition-colors">
                        <span className="w-8 h-8 rounded-full bg-purple-500/15 text-purple-300 flex items-center justify-center text-sm font-bold shrink-0">{i+1}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-gray-200 block truncate">{ch.title}</span>
                          {ch.confidence && (
                            <span className="text-[11px] text-gray-500">confidence: {(ch.confidence * 100).toFixed(0)}%</span>
                          )}
                        </div>
                        <span className="text-purple-300 font-mono text-sm shrink-0">{formatTime(ch.start)} - {formatTime(ch.end)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'moments' && (
                  <div className="space-y-2">
                    {data.key_moments?.map((m: any, i: number) => (
                      <div key={i} className="flex items-start gap-4 p-3 bg-white/[0.03] hover:bg-white/[0.06] rounded-xl transition-colors">
                        <span className="text-pink-400 font-mono text-sm whitespace-nowrap shrink-0 mt-0.5">[{formatTime(m.time || m.start)}]</span>
                        <span className="text-gray-300">{m.text || m.description}</span>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'qa' && (
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <input value={question} onChange={e => setQuestion(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && askQuestion()}
                        placeholder="Ask about the video..."
                        className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 outline-none focus:border-purple-500/50 transition-colors" />
                      <button onClick={askQuestion} className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-semibold transition-all">Ask</button>
                    </div>
                    {qaResult && (
                      <div className="p-4 bg-white/[0.04] rounded-xl border border-white/[0.07] text-gray-200 leading-relaxed">{qaResult}</div>
                    )}
                    {qaSources.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] text-gray-500 font-medium uppercase tracking-widest">Sources</p>
                        {qaSources.map((s: any, i: number) => (
                          <div key={i} className="flex items-start gap-3 p-2.5 bg-white/[0.02] rounded-lg border border-white/[0.05]">
                            <span className="text-purple-400 font-mono text-xs whitespace-nowrap mt-0.5 shrink-0">[{formatTime(s.time)}]</span>
                            <span className="text-gray-400 text-sm">{s.text}</span>
                            {s.relevance && (
                              <span className="text-[11px] text-gray-500 shrink-0 mt-0.5">{(s.relevance * 100).toFixed(0)}%</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'transcript' && (
                  <div className="max-h-[500px] overflow-y-auto space-y-1 pr-2">
                    {data.transcript?.slice(0, 80).map((t: any, i: number) => (
                      <div key={i} className="flex gap-3 p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                        <span className="text-purple-400 font-mono text-xs whitespace-nowrap mt-0.5 shrink-0 w-12 text-right">[{formatTime(t.time)}]</span>
                        <span className="text-gray-500 text-[11px] mt-0.5 shrink-0 w-16">{t.speaker}</span>
                        <span className="text-gray-300 text-sm">{t.text}</span>
                      </div>
                    ))}
                    {data.transcript?.length > 80 && (
                      <p className="text-center text-gray-500 text-xs pt-2">+{data.transcript.length - 80} more lines</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {techInsights && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Model', value: techInsights.model },
                  { label: 'Embeddings', value: techInsights.embedding_model },
                  { label: 'Vector DB', value: techInsights.vector_db },
                  { label: 'Language', value: (techInsights.language || 'en').toUpperCase() },
                  { label: 'Chunks Indexed', value: techInsights.chunks?.toLocaleString() },
                  { label: 'Tokens Processed', value: techInsights.tokens_processed?.toLocaleString() },
                  { label: 'Avg Chunk Size', value: `${techInsights.avg_chunk_size?.[0] || techInsights.avg_chunk_size} tokens` },
                  { label: 'Inference', value: `${(techInsights.inference_time_ms / 1000).toFixed(1)}s` },
                ].map((item: any, i: number) => (
                  <div key={i} className="bg-white/[0.03] backdrop-blur rounded-xl border border-white/[0.06] p-3">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="text-sm text-gray-200 font-mono truncate">{item.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
