import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import axios from 'axios'

const uploadFileToBlob = async (file: File): Promise<string> => {
  const { clientToken, pathname } = (await axios.post('/api/upload-url', { filename: file.name, contentType: file.type })).data
  const storeId = 'store_wiPO3SuGPCYYU9fI'
  const res = await fetch(`https://vercel.com/api/blob/put/${encodeURIComponent(pathname)}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${clientToken}`,
      'x-vercel-blob-access': 'public',
      'content-type': file.type,
    },
    body: file
  })
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
  const blob = await res.json()
  return blob.url
}

const PROCESS_STEPS = ['Uploading video...', 'Extracting audio...', 'Transcribing with Whisper...', 'Generating embeddings...', 'Detecting chapters & moments...', 'Building search index...', 'Ready']

const formatTime = (s: any) => {
  if (s === undefined || s === null || isNaN(Number(s))) return '0:00'
  const m = Math.floor(Number(s) / 60)
  const sec = Math.floor(Number(s) % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

type Tab = 'summary' | 'chapters' | 'moments' | 'transcript' | 'qa'
type ToastType = 'error' | 'success' | 'info'

export default function VideoAI() {
  const [video, setVideo] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [inputMode, setInputMode] = useState<'url' | 'file'>('url')
  const [videoId, setVideoId] = useState('')
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progressStep, setProgressStep] = useState(0)
  const [data, setData] = useState<any>(null)
  const [question, setQuestion] = useState('')
  const [qaResult, setQaResult] = useState('')
  const [qaSources, setQaSources] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('summary')
  const [hoverDrop, setHoverDrop] = useState(false)
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null)
  const [transcriptSearch, setTranscriptSearch] = useState('')
  const [currentTime, setCurrentTime] = useState(0)
  const [videoPlayUrl, setVideoPlayUrl] = useState('')
  const playerRef = useRef<HTMLVideoElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const showToast = useCallback((type: ToastType, message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }, [])

  useEffect(() => {
    if (!processing) {
      setProgressStep(0)
      return
    }
    if (progressStep >= PROCESS_STEPS.length - 1) return
    const delay = 600 + Math.random() * 700
    const t = setTimeout(() => setProgressStep(s => Math.min(s + 1, PROCESS_STEPS.length - 1)), delay)
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
      const res = await axios.post('/api/upload', { url, filename: video?.name || url.split('/').pop() })
      setVideoId(res.data.video_id)
      setVideoPlayUrl(url)
      setProcessing(true)
      const proc = await axios.post(`/api/process/${res.data.video_id}`)
      setData(proc.data.sample_data)
      setProcessing(false)
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.response?.data?.error || err.message || 'Something went wrong'
      showToast('error', msg)
    }
    setLoading(false)
    setProcessing(false)
  }

  const askQuestion = async () => {
    if (!question.trim() || !videoId) return
    try {
      const res = await axios.post('/api/ask', { video_id: videoId, question })
      setQaResult(res.data.answer)
      setQaSources((res.data.sources || []).slice(0, 3))
    } catch (err: any) {
      showToast('error', err.response?.data?.error || err.message)
    }
  }

  const seekTo = (time: number) => {
    if (playerRef.current) {
      playerRef.current.currentTime = time
      playerRef.current.play()
    }
  }

  const filteredTranscript = useMemo(() => {
    if (!data?.transcript) return []
    const q = transcriptSearch.toLowerCase()
    if (!q) return data.transcript
    return data.transcript.map((s: any) => ({
      ...s,
      _highlight: s.text.toLowerCase().includes(q)
    }))
  }, [data?.transcript, transcriptSearch])

  const downloadAs = useCallback((format: 'json' | 'md') => {
    if (!data) return
    const filename = `transcript-${videoId || 'video'}.${format}`
    let content = ''
    if (format === 'json') {
      content = JSON.stringify({ video_id: videoId, duration: data.duration, chapters: data.chapters, transcript: data.transcript, summary: data.summary, tech_insights: data.tech_insights }, null, 2)
    } else {
      content = `# Video Transcript\n\n**Duration:** ${formatTime(data.duration)}\n\n## Summary\n${data.summary}\n\n## Chapters\n\n`
      data.chapters?.forEach((ch: any, i: number) => { content += `### ${i+1}. ${ch.title} (${formatTime(ch.start)} - ${formatTime(ch.end)})\n\n` })
      content += `## Transcript\n\n`
      data.transcript?.forEach((s: any) => { content += `**[${formatTime(s.time)}]** ${s.speaker}: ${s.text}\n\n` })
    }
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/markdown' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = filename; a.click()
    URL.revokeObjectURL(a.href)
  }, [data, videoId])

  const isValidUrl = (url: string) => {
    try {
      const u = new URL(url)
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch { return false }
  }

  const handleUrlChange = (val: string) => {
    setVideoUrl(val)
    if (val && isValidUrl(val)) {
      if (val.includes('youtube.com') || val.includes('youtu.be') || val.includes('vimeo.com') || /\.(mp4|mov|webm|mkv)(\?|$)/i.test(val)) {
        setVideoPlayUrl(val)
      }
    }
  }

  const renderToast = () => {
    if (!toast) return null
    const colors = { error: 'bg-red-500/20 border-red-500/40 text-red-300', success: 'bg-green-500/20 border-green-500/40 text-green-300', info: 'bg-blue-500/20 border-blue-500/40 text-blue-300' }
    return (
      <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl border backdrop-blur shadow-2xl ${colors[toast.type]} animate-slide-in`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{toast.type === 'error' ? '\u26A0' : toast.type === 'success' ? '\u2713' : '\u2139'}</span>
          <span className="text-sm">{toast.message}</span>
        </div>
      </div>
    )
  }

  const renderDrop = () => (
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
          <p className="text-sm text-gray-500 mt-2">MP4, MOV, MKV up to 500MB</p>
        </div>
      )}
      <input ref={fileRef} type="file" accept=".mp4,.mov,.mkv,.avi,.webm" className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]
          if (f && f.size > 500 * 1024 * 1024) { showToast('error', 'File too large. Max 500MB.'); return }
          setVideo(f || null)
        }} />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {renderToast()}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-purple-950/30 to-gray-950 pointer-events-none" />
      <div className="relative max-w-7xl mx-auto p-6">
        <header className="text-center mb-10 pt-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">
            Video AI Summariser
          </h1>
          <p className="text-purple-200/50 text-lg">Upload, transcribe, search and ask questions about any video</p>
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
                  <label className="block text-sm text-gray-400 mb-2">YouTube, Vimeo, direct MP4, or any video URL</label>
                  <input value={videoUrl} onChange={e => handleUrlChange(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 outline-none focus:border-purple-500/50 transition-colors" />
                </div>
                <p className="text-xs text-gray-500 text-center">Supports YouTube, Vimeo, and direct video links</p>
              </div>
            ) : (
              <div>
                {renderDrop()}
                <div className="flex gap-3 mt-4">
                  <button onClick={() => fileRef.current?.click()} className="flex-1 px-4 py-3 bg-white/[0.06] hover:bg-white/[0.1] rounded-xl transition-all">
                    Browse
                  </button>
                </div>
              </div>
            )}
            <button onClick={submitVideo} disabled={!((inputMode === 'url' ? (videoUrl && isValidUrl(videoUrl)) : video)) || loading}
              className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              {loading ? 'Uploading to Vercel Blob...' : 'Analyze Video'}
            </button>
          </div>
        )}

        {processing && !data && (
          <div className="max-w-lg mx-auto bg-white/[0.04] backdrop-blur-2xl rounded-2xl border border-white/[0.07] shadow-2xl p-10">
            <div className="flex flex-col items-center gap-6">
              <div className="w-16 h-16 rounded-full border-4 border-purple-500/30 border-t-purple-400 animate-spin" />
              <div className="w-full space-y-4">
                {PROCESS_STEPS.map((s, i) => (
                  <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${i > progressStep ? 'opacity-30' : ''}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all duration-500 ${
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
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              <div className="xl:col-span-3 space-y-6">
                {videoPlayUrl && !videoPlayUrl.includes('youtube.com') && !videoPlayUrl.includes('youtu.be') && (
                  <div className="bg-black rounded-2xl overflow-hidden border border-white/[0.07] shadow-2xl">
                    <video ref={playerRef} src={videoPlayUrl} controls className="w-full aspect-video bg-black"
                      onTimeUpdate={e => setCurrentTime((e.target as HTMLVideoElement).currentTime)} />
                  </div>
                )}
                {(videoPlayUrl && (videoPlayUrl.includes('youtube.com') || videoPlayUrl.includes('youtu.be'))) && (
                  <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-white/[0.07] shadow-2xl">
                    <iframe src={`https://www.youtube-nocookie.com/embed/${videoPlayUrl.match(/(?:v=|youtu\.be\/)([\w-]+)/)?.[1]}`}
                      className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                  </div>
                )}

                <div className="bg-white/[0.04] backdrop-blur-2xl rounded-2xl border border-white/[0.07] shadow-2xl overflow-hidden">
                  <div className="flex overflow-x-auto border-b border-white/[0.07]">
                    {(['summary', 'chapters', 'moments', 'transcript', 'qa'] as Tab[]).map(tab => (
                      <button key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 capitalize font-medium text-sm transition-colors whitespace-nowrap ${
                          activeTab === tab ? 'bg-purple-500/15 text-purple-300 border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'
                        }`}>
                        {tab === 'qa' ? 'Q&A' : tab}
                      </button>
                    ))}
                    <div className="ml-auto flex gap-1 px-2 items-center">
                      <button onClick={() => downloadAs('json')} className="p-2 text-gray-500 hover:text-gray-300 transition-colors" title="Download JSON">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      </button>
                      <button onClick={() => downloadAs('md')} className="p-2 text-gray-500 hover:text-gray-300 transition-colors" title="Download Markdown">
                        <span className="text-[10px] font-bold">MD</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    {activeTab === 'summary' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-semibold text-purple-300">Duration: {formatTime(data.duration)}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">English</span>
                        </div>
                        <p className="text-gray-300 leading-relaxed">{data.summary}</p>
                      </div>
                    )}
                    {activeTab === 'chapters' && (
                      <div className="space-y-2">
                        {data.chapters?.map((ch: any, i: number) => (
                          <button key={i} onClick={() => seekTo(ch.start)}
                            className="w-full flex items-center gap-4 p-3 bg-white/[0.03] hover:bg-white/[0.06] rounded-xl transition-all text-left group">
                            <span className="w-8 h-8 rounded-full bg-purple-500/15 text-purple-300 flex items-center justify-center text-sm font-bold shrink-0">{i+1}</span>
                            <div className="flex-1 min-w-0">
                              <span className="text-gray-200 block truncate group-hover:text-purple-300 transition-colors">{ch.title}</span>
                              {ch.confidence && (
                                <span className="text-[11px] text-gray-500">confidence: {(ch.confidence * 100).toFixed(0)}%</span>
                              )}
                            </div>
                            <span className="text-purple-300 font-mono text-sm shrink-0">{formatTime(ch.start)} - {formatTime(ch.end)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {activeTab === 'moments' && (
                      <div className="space-y-2">
                        {data.key_moments?.map((m: any, i: number) => (
                          <button key={i} onClick={() => seekTo(m.time)}
                            className="w-full flex items-start gap-4 p-3 bg-white/[0.03] hover:bg-white/[0.06] rounded-xl transition-all text-left group">
                            <span className="text-pink-400 font-mono text-sm whitespace-nowrap shrink-0 mt-0.5 group-hover:text-pink-300">[{formatTime(m.time)}]</span>
                            <span className="text-gray-300 group-hover:text-gray-200 transition-colors">{m.text.slice(0, 150)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {activeTab === 'transcript' && (
                      <div className="space-y-3">
                        <div className="relative">
                          <input value={transcriptSearch} onChange={e => setTranscriptSearch(e.target.value)}
                            placeholder="Search transcript..."
                            className="w-full px-4 py-2.5 pl-10 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 outline-none focus:border-purple-500/50 transition-colors text-sm" />
                          <svg className="absolute left-3 top-3 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto space-y-1 pr-2">
                          {filteredTranscript.map((t: any, i: number) => {
                            const isHighlighted = transcriptSearch && t._highlight
                            return (
                              <button key={i} onClick={() => seekTo(t.time)}
                                className={`w-full flex gap-3 p-2 rounded-lg text-left transition-colors ${
                                  isHighlighted ? 'bg-purple-500/10 border border-purple-500/20' : 'hover:bg-white/[0.03] border border-transparent'
                                }`}>
                                <span className="text-purple-400 font-mono text-xs whitespace-nowrap mt-0.5 shrink-0 w-12 text-right">{formatTime(t.time)}</span>
                                <span className={`text-[11px] mt-0.5 shrink-0 w-16 font-medium ${
                                  t.speaker === 'Host' ? 'text-blue-400' : t.speaker === 'Expert' ? 'text-emerald-400' : 'text-gray-400'
                                }`}>{t.speaker}</span>
                                <span className={`text-sm ${isHighlighted ? 'text-purple-200' : 'text-gray-300'}`}>{t.text}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    {activeTab === 'qa' && (
                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <input value={question} onChange={e => setQuestion(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && askQuestion()}
                            placeholder="Ask anything about the video..."
                            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 outline-none focus:border-purple-500/50 transition-colors" />
                          <button onClick={askQuestion} disabled={!question.trim()}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-semibold disabled:opacity-40 transition-all">Ask</button>
                        </div>
                        {qaResult && (
                          <div className="p-4 bg-white/[0.04] rounded-xl border border-white/[0.07]">
                            <p className="text-gray-200 leading-relaxed">{qaResult}</p>
                          </div>
                        )}
                        {qaSources.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[11px] text-gray-500 font-medium uppercase tracking-widest">Sources</p>
                            {qaSources.map((s: any, i: number) => (
                              <button key={i} onClick={() => seekTo(s.time)}
                                className="w-full flex items-start gap-3 p-2.5 bg-white/[0.02] rounded-lg border border-white/[0.05] text-left hover:bg-white/[0.04] transition-colors">
                                <span className="text-purple-400 font-mono text-xs whitespace-nowrap mt-0.5 shrink-0">[{formatTime(s.time)}]</span>
                                <span className="text-gray-400 text-sm flex-1">{s.text}</span>
                                {s.relevance && (
                                  <span className="text-[11px] text-gray-500 shrink-0 mt-0.5">{(s.relevance * 100).toFixed(0)}% match</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="xl:col-span-2 space-y-3">
                {data.tech_insights && (
                  <div className="bg-white/[0.04] backdrop-blur-2xl rounded-2xl border border-white/[0.07] shadow-2xl p-5">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Tech Insights</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'Model', value: data.tech_insights.model },
                        { label: 'Embeddings', value: data.tech_insights.embedding_model },
                        { label: 'Vector DB', value: data.tech_insights.vector_db },
                        { label: 'Language', value: (data.tech_insights.language || 'en').toUpperCase() },
                        { label: 'Chunks Indexed', value: data.tech_insights.chunks?.toLocaleString() },
                        { label: 'Tokens', value: data.tech_insights.tokens_processed?.toLocaleString() },
                        { label: 'Avg Chunk Size', value: `${data.tech_insights.avg_chunk_size} tokens` },
                        { label: 'Inference', value: `${(data.tech_insights.inference_time_ms / 1000).toFixed(1)}s` },
                      ].map((item: any, i: number) => (
                        <div key={i} className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-3">
                          <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">{item.label}</p>
                          <p className="text-sm text-gray-200 font-mono truncate">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.transcript && (
                  <div className="bg-white/[0.04] backdrop-blur-2xl rounded-2xl border border-white/[0.07] shadow-2xl p-5">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Statistics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Duration</span><span className="text-gray-200">{formatTime(data.duration)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Chapters</span><span className="text-gray-200">{data.chapters?.length || 0}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Segments</span><span className="text-gray-200">{data.transcript?.length || 0}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Key Moments</span><span className="text-gray-200">{data.key_moments?.length || 0}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-gray-500">Total Words</span><span className="text-gray-200">{data.transcript?.reduce((s: number, t: any) => s + t.text.split(' ').length, 0).toLocaleString()}</span></div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => downloadAs('json')} className="flex-1 px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] rounded-xl text-sm text-gray-300 transition-all">
                    Download JSON
                  </button>
                  <button onClick={() => downloadAs('md')} className="flex-1 px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] rounded-xl text-sm text-gray-300 transition-all">
                    Download Markdown
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
