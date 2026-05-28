import type { NextApiRequest, NextApiResponse } from 'next'
import { createHmac, randomUUID } from 'crypto'

const STORE_ID = process.env.BLOB_STORE_ID || 'wiPO3SuGPCYYU9fI'
const RW_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || ''

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { filename, contentType } = req.body || {}
  const ext = filename?.includes('.') ? filename.split('.').pop() : 'mp4'
  const pathname = `videos/${randomUUID()}.${ext}`
  const validUntil = Date.now() + 600000
  const payload = JSON.stringify({ pathname, access: 'public', validUntil })
  const payloadB64 = Buffer.from(payload).toString('base64')
  const signature = createHmac('sha256', RW_TOKEN).update(payloadB64).digest('hex')
  const combined = Buffer.from(`${signature}.${payloadB64}`).toString('base64')
  const clientToken = `vercel_blob_client_${STORE_ID}_${combined}`
  res.json({ clientToken, pathname })
}
