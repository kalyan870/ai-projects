import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { url, filename } = req.body || {}
  if (!url) return res.status(400).json({ error: 'URL required' })
  res.json({ video_id: `vid_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, filename: filename || 'video.mp4', url })
}
