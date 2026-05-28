import type { NextApiRequest, NextApiResponse } from 'next'

const SEEDED = [
  'attention', 'transformer', 'embedding', 'token', 'layer', 'gradient',
  'backpropagation', 'loss', 'optimizer', 'encoder', 'decoder', 'latent',
  'convolution', 'pooling', 'dropout', 'batch', 'epoch', 'learning', 'weight', 'bias'
]
const LEN = SEEDED.length

function seeded(i: number): number {
  const x = Math.sin(i * 9301 + 49297) * 49297
  return x - Math.floor(x)
}

function pick(i: number, n: number): string[] {
  const items: string[] = []
  for (let j = 0; j < n; j++) {
    items.push(SEEDED[Math.floor(seeded(i * LEN + j * 7 + 13) * LEN)])
  }
  return [...new Set(items)]
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { id } = req.query
  const seed = parseInt((id as string)?.replace(/\D/g, '').slice(-4)) || Date.now() % 10000

  const duration = 30 + Math.floor(seeded(seed) * 570)
  const nChapters = 3 + Math.floor(seeded(seed + 1) * 5)
  const nMoments = 3 + Math.floor(seeded(seed + 2) * 4)
  const nSegments = 8 + Math.floor(seeded(seed + 3) * 15)

  const topics = pick(seed, 5)
  const features = pick(seed + 50, 4)
  const model = ['GPT-4o', 'Claude 3.5 Sonnet', 'Gemini Pro', 'DeepSeek R1'][Math.floor(seeded(seed + 4) * 4)]
  const embModel = ['text-embedding-3-large', 'gte-large', 'bge-base-en-v1.5', 'jina-embeddings-v3'][Math.floor(seeded(seed + 5) * 4)]

  const chapters = Array.from({ length: nChapters }, (_, i) => {
    const start = Math.floor(seeded(seed + 10 + i * 2) * duration * (1 - 1 / (nChapters + 1)))
    const end = i === nChapters - 1 ? duration : Math.min(start + 10 + Math.floor(seeded(seed + 11 + i * 2) * 180), duration)
    return {
      title: `Chapter ${i + 1}: ${topics[i % topics.length].charAt(0).toUpperCase() + topics[i % topics.length].slice(1)} ${['Architecture', 'Mechanisms', 'Pipeline', 'Optimization', 'Analysis'][i % 5]}`,
      start, end: Math.max(end, start + 5),
      confidence: 0.7 + seeded(seed + 20 + i) * 0.25
    }
  })

  const keyMoments = Array.from({ length: nMoments }, (_, i) => {
    const t = Math.floor(seeded(seed + 30 + i) * duration)
    return {
      time: t,
      text: `${features[i % features.length].charAt(0).toUpperCase() + features[i % features.length].slice(1)} ${['mechanism', 'layer', 'function', 'component', 'process'][i % 5]} demonstrated at ${Math.floor(t / 60)}:${(t % 60).toString().padStart(2, '0')}`
    }
  })

  const transcript = Array.from({ length: nSegments }, (_, i) => ({
    time: Math.floor(seeded(seed + 40 + i) * duration),
    speaker: ['Speaker A', 'Speaker B', 'Narrator'][Math.floor(seeded(seed + 50 + i) * 3)],
    text: `Segment ${i + 1}: ${features[i % features.length]} processing with ${Math.floor(seeded(seed + 60 + i) * 100)}% efficiency using ${model} architecture.`
  })).sort((a, b) => a.time - b.time)

  const qaSources = Array.from({ length: 3 }, (_, i) => ({
    time: transcript[i]?.time || 0,
    text: transcript[i]?.text || '',
    relevance: 0.75 + seeded(seed + 70 + i) * 0.2
  }))

  const summary = `This video covers ${topics.join(', ')} using a ${model} architecture with ${embModel} embeddings. ` +
    `The presentation demonstrates key ${features.join(' and ')} concepts across ${nChapters} chapters spanning ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}. ` +
    `Key highlights include ${keyMoments.length} important moments and ${nSegments} transcribed segments.`

  const sampleData = {
    video_id: id, duration, chapters, key_moments: keyMoments,
    transcript, summary, qa_sources: qaSources,
    tech_insights: {
      model, embedding_model: embModel, vector_db: 'ChromaDB',
      language: 'en', chunks: nSegments * 15,
      tokens_processed: nSegments * 128, avg_chunk_size: 256,
      inference_time_ms: 2847
    }
  }

  res.json({ video_id: id, sample_data: sampleData })
}
