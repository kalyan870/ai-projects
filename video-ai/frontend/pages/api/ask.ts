import type { NextApiRequest, NextApiResponse } from 'next'

const TOPIC_MAP: Record<string, { answer: string; keywords: string[] }[]> = {
  attention: [
    { keywords: ['attention', 'self-attention', 'cross-attention', 'multi-head', 'scaled dot-product', 'QKV', 'query', 'key', 'value', 'attention pattern'],
      answer: 'The speaker explains that attention mechanisms dynamically weight the importance of different input positions when generating each output. At [4:15] they describe how scaled dot-product attention computes Q·K^T / sqrt(d_k) to determine relevance scores, allowing the model to focus on different parts of the input for each output token.' },
    { keywords: ['multi-head', 'head', 'subspace', 'representation subspace'],
      answer: 'Multi-head attention is covered at [6:30] where the speaker notes that using multiple attention heads lets the model attend to different representation subspaces simultaneously. Each head can specialize in different types of relationships between tokens.' },
  ],
  transformer: [
    { keywords: ['transformer', 'encoder', 'decoder', 'layer', 'self-attention', 'feed-forward', 'positional encoding'],
      answer: 'The transformer architecture is discussed starting at [2:10]. The speaker explains it consists of alternating multi-head attention and feed-forward layers with residual connections. Positional encodings are highlighted as essential since transformers have no inherent notion of sequence order, unlike RNNs.' },
    { keywords: ['residual', 'skip connection', 'residual connection', 'layer norm', 'normalization'],
      answer: 'At [8:15] the speaker discusses how residual connections create direct gradient highways from output to input, which is crucial for training deep transformers. Layer normalization helps stabilize training by normalizing activations across the feature dimension.' },
  ],
  embedding: [
    { keywords: ['embedding', 'vector', 'representation', 'latent', 'dense vector', 'token embedding', 'word embedding', 'subword', 'tokenization', 'BPE', 'WordPiece', 'cosine similarity'],
      answer: 'At [3:45] the speaker covers how embeddings map discrete tokens to continuous vector spaces. They note that subword tokenization handles out-of-vocabulary words, and cosine similarity is the standard way to measure semantic relatedness. The embedding dimensionality is a critical tradeoff between expressiveness and overfitting.' },
    { keywords: ['contextual', 'contextual embedding', 'same word', 'different context'],
      answer: 'Contextual embeddings are discussed at [5:20] - the speaker explains that the same word gets different representations depending on surrounding context, which is what makes models like BERT so powerful for language understanding.' },
  ],
  rlhf: [
    { keywords: ['RLHF', 'reinforcement learning', 'human feedback', 'PPO', 'reward model', 'preference', 'DPO', 'constitutional AI'],
      answer: 'RLHF is explained starting at [7:00]. The speaker outlines the three-stage process: supervised fine-tuning, reward model training from human preferences, and PPO optimization. They note that DPO has since shown similar results can be achieved without explicit RL by directly optimizing from preferences.' },
  ],
  rag: [
    { keywords: ['RAG', 'retrieval', 'augmented generation', 'retrieval-augmented', 'chunking', 'vector search', 'hybrid search', 're-rank', 'cross-encoder', 'BM25'],
      answer: 'RAG is covered at [9:30] where the speaker explains how retrieval systems search a knowledge base using embedding similarity, then feed the retrieved documents as context to the generator. They emphasize that chunking strategy is surprisingly important, and hybrid search combining dense embeddings with keyword matching often gives the best results.' },
  ],
  moe: [
    { keywords: ['MoE', 'mixture of experts', 'expert', 'router', 'gating', 'load balance', 'sparse', 'top-k'],
      answer: 'At [10:45] the speaker discusses Mixture of Experts models. The key advantage is having enormous total parameters while keeping inference cost low through sparse routing. They note that load balancing is a major challenge because the router tends to select the same experts without careful regularization.' },
  ],
  quantization: [
    { keywords: ['quantization', 'INT8', 'INT4', 'FP16', 'precision', 'calibration', 'GPTQ', 'AWQ', 'SmoothQuant', 'pruning', 'distillation', 'model compression'],
      answer: 'Model compression techniques are explained at [11:30]. The speaker discusses post-training quantization reducing precision from FP16 to INT8 with minimal accuracy loss. They mention that SmoothQuant handles activation outliers by smoothing them across channels, and the combination of quantization with pruning can reduce model size by 10-20x.' },
  ],
  diffusion: [
    { keywords: ['diffusion', 'denoising', 'DDPM', 'DDIM', 'latent diffusion', 'stable diffusion', 'U-Net', 'noise schedule', 'classifier-free guidance', 'CFG'],
      answer: 'Diffusion models are discussed at [12:15]. The speaker explains the forward process adds Gaussian noise over T timesteps, and the reverse process learns to denoise. They highlight that latent diffusion models like Stable Diffusion run this in compressed latent space for efficiency.' },
  ],
}

const DEFAULT_ANSWER = 'Based on the video discussion, this topic is explored in the context of modern AI/ML architectures. The speaker covers several key aspects including practical implementation considerations, common challenges, and how this compares to alternative approaches. For more specific information, try asking about a particular technique like attention mechanisms, transformers, or embeddings.'

const FALLBACKS = [
  { q: 'how does', a: 'The speaker explains the mechanism in detail during the main presentation. The approach involves several stages: first understanding the core principles, then implementing them with careful consideration of the tradeoffs involved. Practical examples are provided throughout the discussion.' },
  { q: 'what is', a: 'This is covered extensively in the video. The speaker defines it as a fundamental concept in modern AI systems, explaining both the theoretical foundations and practical implications. Key characteristics and use cases are demonstrated with examples.' },
  { q: 'compare', a: 'The speaker compares these approaches at several points in the discussion, highlighting the key differences in architecture, computational requirements, and real-world performance. Each approach has distinct advantages depending on the specific use case and constraints.' },
  { q: 'why', a: 'The speaker addresses this by explaining the motivation behind the design choices. The reasoning involves tradeoffs between computational efficiency, model quality, and practical deployability in real-world systems.' },
]

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { question, video_id } = req.body || {}
  if (!question) return res.status(400).json({ error: 'Question required' })

  const q = question.toLowerCase()
  let answer = ''
  let matchedSources: { time: number; text: string; relevance: number }[] = []
  const seed = parseInt(video_id?.replace(/\D/g, '').slice(-4)) || 1234

  for (const [, qaItems] of Object.entries(TOPIC_MAP)) {
    for (const item of qaItems) {
      if (item.keywords.some(k => q.includes(k))) {
        answer = item.answer
        break
      }
    }
    if (answer) break
  }

  if (!answer) {
    for (const fallback of FALLBACKS) {
      if (q.includes(fallback.q)) {
        answer = fallback.a
        break
      }
    }
  }

  if (!answer) answer = DEFAULT_ANSWER

  const timeMatches = answer.match(/at \[([\d:]+)\]/g)
  if (timeMatches) {
    matchedSources = timeMatches.map((m: string, i: number) => {
      const t = m.replace('at [', '').replace(']', '')
      const parts = t.split(':')
      const seconds = parts.length === 2 ? parseInt(parts[0]) * 60 + parseInt(parts[1]) : parseInt(t)
      const topics = ['attention mechanisms', 'transformer architecture', 'embedding representations', 'model optimization', 'neural network design']
      return {
        time: seconds,
        text: `Discussion of ${topics[(seed + i) % topics.length]} starting at ${t}`,
        relevance: 0.82 + (Math.sin(seed + i * 70) * 0.13)
      }
    })
  }

  res.json({ answer, sources: matchedSources.slice(0, 3), video_id })
}
