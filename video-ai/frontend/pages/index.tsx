import { useState, useRef } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002'
const MAX_SIZE = 4 * 1024 * 1024

export default function VideoAI() {
  const [video, setVideo] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [inputMode, setInputMode] = useState<'file' | 'url'>('url')
  const [videoId, setVideoId] = useState('')
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [data, setData] = useState<any>(null)
  const [question, setQuestion] = useState('')
  const [qaResult, setQaResult] = useState('')
  const [activeTab, setActiveTab] = useState<'summary' | 'chapters' | 'moments' | 'qa'>('summary')
  const fileRef = useRef<HTMLInputElement>(null)

  const submitVideo = async () => {
    setLoading(true)
    try {
      let url = videoUrl
      if (inputMode === 'file' && video) {
        if (video.size > MAX_SIZE) {
          alert('Vercel serverless limit is 4MB. Paste a video URL instead, or deploy the full backend on Railway.')
          setLoading(false)
          return
        }
        url = URL.createObjectURL(video)
      }
      if (!url) { setLoading(false); return }
      const res = await axios.post(`${API_URL}/api/upload`, { url, filename: video?.name || url.split('/').pop() })
      setVideoId(res.data.video_id)
      await processVideo(res.data.video_id)
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message)
    }
    setLoading(false)
  }

  const processVideo = async (id: string) => {
    setProcessing(true)
    try {
      const res = await axios.post(`${API_URL}/api/process/${id}`)
      setData({ video_id: id, ...res.data.sample_data })
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message)
    }
    setProcessing(false)
  }

  const askQuestion = async () => {
    if (!question.trim() || !videoId) return
    try {
      const res = await axios.post(`${API_URL}/api/ask`, { video_id: videoId, question })
      setQaResult(res.data.answer)
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message)
    }
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60); const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="max-w-6xl mx-auto p-6">
        <header className="text-center mb-12 pt-8">
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">
            Video AI Summariser
          </h1>
          <p className="text-purple-200/70 text-lg">Upload, transcribe, summarize and ask questions about any video</p>
        </header>

        {!data && (
          <div className="max-w-xl mx-auto bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
            <div className="flex gap-2 mb-6 bg-white/5 rounded-xl p-1">
              <button onClick={() => setInputMode('url')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${inputMode === 'url' ? 'bg-purple-500/30 text-purple-200' : 'text-gray-400'}`}>
                Video URL
              </button>
              <button onClick={() => setInputMode('file')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${inputMode === 'file' ? 'bg-purple-500/30 text-purple-200' : 'text-gray-400'}`}>
                Upload File
              </button>
            </div>

            {inputMode === 'url' ? (
              <div className="space-y-4">
                <div className="border-2 border-white/10 rounded-xl p-4 bg-white/[0.02]">
                  <label className="block text-sm text-gray-400 mb-2">Paste a video URL (YouTube, direct MP4, etc.)</label>
                  <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500" />
                </div>
                <p className="text-xs text-gray-500 text-center">Vercel has a 4MB upload limit — use URL mode for large videos</p>
              </div>
            ) : (
              <div>
                <div className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f.size > MAX_SIZE) { alert('File too large. Vercel limit is 4MB. Use URL mode.'); return }; setVideo(f) }}>
                  {video ? (
                    <div>
                      <p className="text-lg font-medium text-purple-300">{video.name}</p>
                      <p className="text-sm text-gray-400">{(video.size / 1024 / 1024).toFixed(1)} MB</p>
                      {video.size > MAX_SIZE && <p className="text-xs text-red-400 mt-1">Exceeds 4MB — will fail on Vercel. Use URL mode.</p>}
                    </div>
                  ) : (
                    <div>
                      <p className="text-4xl mb-4">&#127916;</p>
                      <p className="text-gray-300">Drop video here or click to browse</p>
                      <p className="text-sm text-gray-500 mt-2">Max 4MB (Vercel limit). Use URL mode for larger files.</p>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept=".mp4,.mov,.mkv,.avi" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f && f.size > MAX_SIZE) { alert('File too large. Vercel limit is 4MB. Use URL mode.'); return }; setVideo(f || null) }} />
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => fileRef.current?.click()} className="flex-1 px-4 py-3 bg-white/10 rounded-xl hover:bg-white/20">
                    Browse
                  </button>
                </div>
              </div>
            )}

            <button onClick={submitVideo} disabled={loading || processing || (inputMode === 'url' ? !videoUrl : !video)}
              className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold disabled:opacity-50">
              {loading ? 'Analyzing...' : processing ? 'Processing...' : 'Analyze Video'}
            </button>
            <p className="text-xs text-gray-500 text-center mt-3">For full FFmpeg + Whisper processing, deploy backend on Railway</p>
          </div>
        )}

        {data && (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
            <div className="flex border-b border-white/10">
              {['summary', 'chapters', 'moments', 'qa'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-3 capitalize font-medium text-sm transition-colors ${
                    activeTab === tab ? 'bg-purple-500/20 text-purple-300 border-b-2 border-purple-400' : 'text-purple-200/50'
                  }`}>{tab}</button>
              ))}
            </div>
            <div className="p-8">
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-purple-300">Duration: {formatTime(data.duration)}</h3>
                  <p className="text-gray-300 leading-relaxed">{data.summary}</p>
                </div>
              )}
              {activeTab === 'chapters' && (
                <div className="space-y-3">
                  {data.chapters?.map((ch: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
                      <span className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center text-sm font-bold">{i+1}</span>
                      <span className="text-purple-300 font-mono text-sm">{formatTime(ch.start)} - {formatTime(ch.end)}</span>
                      <span className="text-gray-200">{ch.title}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'moments' && (
                <div className="space-y-3">
                  {data.key_moments?.map((m: any, i: number) => (
                    <div key={i} className="flex items-start gap-4 p-3 bg-white/5 rounded-xl">
                      <span className="text-pink-300 font-mono text-sm whitespace-nowrap">[{formatTime(m.time || m.start)}]</span>
                      <span className="text-gray-200">{m.text || m.description}</span>
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
                      className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400" />
                    <button onClick={askQuestion} className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold">Ask</button>
                  </div>
                  {qaResult && (
                    <div className="p-4 bg-white/5 rounded-xl text-gray-200 leading-relaxed">{qaResult}</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
