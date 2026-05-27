import { useState, useRef } from 'react'
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002'

export default function VideoAI() {
  const [video, setVideo] = useState<File | null>(null)
  const [videoId, setVideoId] = useState('')
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [data, setData] = useState<any>(null)
  const [question, setQuestion] = useState('')
  const [qaResult, setQaResult] = useState('')
  const [activeTab, setActiveTab] = useState<'summary' | 'chapters' | 'moments' | 'qa'>('summary')
  const fileRef = useRef<HTMLInputElement>(null)

  const uploadVideo = async () => {
    if (!video) return
    setLoading(true)
    const formData = new FormData()
    formData.append('file', video)
    try {
      const res = await axios.post(`${API_URL}/upload`, formData)
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
      const res = await axios.post(`${API_URL}/process/${id}`)
      setData(res.data)
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message)
    }
    setProcessing(false)
  }

  const askQuestion = async () => {
    if (!question.trim() || !videoId) return
    try {
      const res = await axios.post(`${API_URL}/ask`, { video_id: videoId, question })
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
            <div className="border-2 border-dashed border-white/20 rounded-xl p-12 text-center"
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); setVideo(e.dataTransfer.files[0]) }}>
              {video ? (
                <div>
                  <p className="text-lg font-medium text-purple-300">{video.name}</p>
                  <p className="text-sm text-gray-400">{(video.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              ) : (
                <div>
                  <p className="text-4xl mb-4">&#127916;</p>
                  <p className="text-gray-300">Drop video here or click to browse</p>
                  <p className="text-sm text-gray-500 mt-2">MP4, MOV, MKV supported</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept=".mp4,.mov,.mkv,.avi" className="hidden"
                onChange={e => setVideo(e.target.files?.[0] || null)} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => fileRef.current?.click()} className="flex-1 px-4 py-3 bg-white/10 rounded-xl hover:bg-white/20">
                Browse
              </button>
              <button onClick={uploadVideo} disabled={!video || loading || processing}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold disabled:opacity-50">
                {loading ? 'Uploading...' : processing ? 'Processing...' : 'Upload & Process'}
              </button>
            </div>
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
