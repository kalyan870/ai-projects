import type { NextApiRequest, NextApiResponse } from 'next'

const TOPICS = [
  { name: 'Attention mechanisms', sentences: [
    'So attention really changed how we think about sequence modeling entirely.',
    'The key insight is that instead of compressing everything into a fixed-size vector, we let the model look at all input positions dynamically.',
    'Scaled dot-product attention computes a weighted sum where each token gets to see every other token.',
    'What I find fascinating is that multi-head attention lets the model attend to different representation subspaces simultaneously.',
    'The attention scores are computed using Q times K transpose divided by the square root of the dimension.',
    'One common question is why we need the scaling factor and it is to prevent the softmax from saturating.',
    'When you visualize attention patterns, you can actually see which parts of the input the model focuses on for each output.',
    'Self-attention essentially creates a dynamic connection graph between all positions in the sequence.',
    'The quadratic complexity of attention is definitely a challenge for long sequences, which is why architectures like Reformer and Longformer emerged.',
    'Cross-attention is particularly important in encoder-decoder models where the decoder needs to look at the encoder\'s representations.'
  ]},
  { name: 'Transformer architecture', sentences: [
    'The transformer is composed of alternating multi-head attention and feed-forward layers, each surrounded by residual connections and layer normalization.',
    'Layer normalization is applied before each sub-layer, which helps stabilize training and allows gradients to flow more easily.',
    'The feed-forward layer is actually a simple two-layer MLP with a ReLU or GELU activation in between, and it operates independently per position.',
    'Positional encodings are absolutely essential because unlike RNNs, transformers have no inherent notion of sequence order.',
    'Sinusoidal positional encodings were proposed in the original paper, but learned positional embeddings tend to work better in practice.',
    'One thing people often miss is that the original transformer used pre-norm but many modern implementations have switched to post-norm.',
    'The residual connections create a direct gradient highway from the output all the way back to the input, which is crucial for training deep transformers.',
    'Each encoder layer processes the entire sequence in parallel, which is why transformers are so much faster to train than RNNs.',
    'Decoder layers have masked self-attention to prevent the model from looking at future tokens during generation.',
    'The output dimension of each layer is typically the same, usually 512 or 768 for base models, which makes residual connections straightforward.'
  ]},
  { name: 'Embeddings & representation learning', sentences: [
    'The goal of word embeddings is to map discrete tokens into a continuous vector space where semantic relationships are preserved.',
    'What I really like about contextual embeddings is that the same word gets different representations depending on its surrounding context.',
    'Word2vec introduced the idea that words appearing in similar contexts tend to have similar meanings.',
    'The embedding layer is essentially a lookup table that maps each token ID to its corresponding dense vector.',
    'Subword tokenization like BPE or WordPiece handles out-of-vocabulary words by breaking them into smaller meaningful units.',
    'The embedding dimensionality is a critical hyperparameter too small and you lose expressiveness, too large and you risk overfitting.',
    'Recent models like text-embedding-3-large produce 3072-dimensional vectors that capture incredibly nuanced semantic information.',
    'Cosine similarity between embedding vectors is the standard way to measure semantic relatedness between texts.',
    'Contrastive learning has been a game-changer for representation learning, where the model learns to pull similar pairs together and push dissimilar ones apart.',
    'One interesting property is that embedding spaces often exhibit linear structure, meaning you can do vector arithmetic like king minus man plus woman equals queen.'
  ]},
  { name: ' Diffusion models', sentences: [
    'Diffusion models work by gradually adding noise to data and then learning to reverse this process step by step.',
    'The forward process is a fixed Markov chain that adds Gaussian noise over T timesteps until the signal is completely destroyed.',
    'The reverse process learns to denoise, and this is where all the learnable parameters are, typically parameterized by a U-Net architecture.',
    'What makes diffusion models special is that the training objective is surprisingly simple, just predicting the noise that was added at each timestep.',
    'DDPMs showed that you can generate high-quality images by iteratively denoising from pure random noise.',
    'The sampling process in DDPMs requires many steps, often a thousand, which is why there has been so much work on faster samplers like DDIM.',
    'Latent diffusion models like Stable Diffusion run the diffusion process in a compressed latent space rather than pixel space, which is much more efficient.',
    'Classifier-free guidance is a technique where you interpolate between conditional and unconditional predictions to trade off diversity for sample quality.',
    'The noise schedule determines how quickly noise is added, and cosine schedules tend to work better than linear ones.',
    'Cross-attention layers in the U-Net allow text conditioning by projecting text embeddings into the spatial feature maps.'
  ]},
  { name: 'Reinforcement Learning from Human Feedback', sentences: [
    'RLHF starts with a supervised fine-tuning phase where the model learns to follow instructions from human demonstrations.',
    'After SFT, you train a reward model that predicts human preferences between pairs of model outputs.',
    'The reward model is typically initialized from the SFT model with the final unembedding layer replaced by a scalar head.',
    'Human annotators compare two model responses and say which one is better, and the reward model learns to predict these preferences.',
    'PPO is the most common RL algorithm used in RLHF, and it works by maximizing the reward while staying close to the reference model.',
    'The KL penalty in PPO prevents the policy from diverging too far from the SFT model, which helps maintain output quality.',
    'One challenge with RLHF is that the reward model is an imperfect proxy and might reward behaviors that humans wouldn\'t actually prefer.',
    'DPO showed that you can achieve similar results without explicit RL by directly optimizing from preferences.',
    'The preference dataset quality is absolutely critical, noisy or biased preferences can lead to reward hacking.',
    'Constitutional AI takes this further by having the model critique and revise its own outputs according to a set of principles.'
  ]},
  { name: 'Retrieval-Augmented Generation', sentences: [
    'RAG combines a retrieval system with a generative model to produce grounded, factual outputs.',
    'The retrieval step searches a knowledge base for relevant documents using embedding similarity.',
    'Once relevant documents are retrieved, they are concatenated with the input query and fed to the generator as context.',
    'The chunking strategy is surprisingly important, you need chunks that are large enough to contain complete information but small enough to fit in the model\'s context window.',
    'Hybrid search combining dense embeddings with sparse keyword matching like BM25 often gives the best retrieval results.',
    'One common failure mode is when the retrieved documents don\'t actually contain the answer, the model might hallucinate anyway.',
    'Re-ranking the retrieved results with a cross-encoder significantly improves precision compared to using cosine similarity alone.',
    'The context window length is often the main bottleneck in RAG systems, determining how many chunks can be included.',
    'Advanced RAG systems use query rewriting to transform the user\'s question into a more search-friendly form before retrieval.',
    'Iterative retrieval where you refine the search based on what you\'ve already found can substantially improve recall.'
  ]},
  { name: 'Mixture of Experts', sentences: [
    'MoE models have multiple feed-forward sub-networks called experts, and a routing mechanism selects which experts to use for each token.',
    'The key advantage of MoE is that you can have an enormous number of total parameters while keeping the inference cost per token relatively low.',
    'The router is a learned gating function that produces a probability distribution over experts for each token.',
    'Top-k routing selects only the k most relevant experts, which keeps computation sparse and efficient.',
    'Load balancing is a major challenge in MoE because without careful regularization, the router tends to always select the same few experts.',
    'Auxiliary losses like importance loss and load loss encourage uniform expert utilization across the batch.',
    'Expert parallelism distributes different experts across different devices, which is essential for training MoE models at scale.',
    'DeepSpeed-MoE and Tutel are popular frameworks for efficient MoE training and inference.',
    'One interesting property is that experts don\'t necessarily learn specialized domains, they often learn overlapping but distinct functions.',
    'Switch Transformer showed that even routing to just one expert per token can work well, dramatically reducing computation.'
  ]},
  { name: 'Quantization and Model Compression', sentences: [
    'Post-training quantization reduces model precision from FP16 to INT8 or INT4 with minimal accuracy loss.',
    'The calibration process determines the optimal scaling factors by observing activations on a representative dataset.',
    'SmoothQuant addresses the challenge of activation outliers by smoothing them across channels before quantization.',
    'GPTQ uses second-order information to find quantized weights that minimize the output error of each layer.',
    'AWQ observes that only about one percent of weights are really important to protect during quantization.',
    'KV cache quantization is an active area of research because the key-value cache quickly dominates memory in long-context scenarios.',
    'NF4 in QLoRA uses a normal float representation that better matches the distribution of neural network weights.',
    'Pruning removes redundant weights or attention heads, with structured pruning being more hardware-friendly.',
    'Knowledge distillation trains a smaller student model to mimic the outputs of a larger teacher model.',
    'The combination of quantization and pruning can reduce model size by ten to twenty times while retaining most of the original capability.'
  ]}
]

const SPEAKER_TURNS = [
  { speaker: 'Host', style: 'question', phrases: [
    'Can you explain how that works in practice?',
    'What are the main challenges with this approach?',
    'How does this compare to alternative methods?',
    'Why is this considered a breakthrough?',
    'What should people watch out for when implementing this?'
  ]},
  { speaker: 'Expert', style: 'explanation', phrases: [
    'Great question. So the way this works is...',
    'Let me break that down. First, you need to understand that...',
    'This is actually quite interesting because...',
    'The main thing to keep in mind here is that...',
    'So the intuition behind this is pretty straightforward...'
  ]},
  { speaker: 'Host', style: 'followup', phrases: [
    'That makes sense. And what about the practical applications?',
    'So where does this fit into the broader landscape?',
    'Are there any limitations people should be aware of?',
    'I see, and how has this evolved over the past year?',
    'Interesting, so what is the current state of the art?'
  ]},
  { speaker: 'Expert', style: 'detail', phrases: [
    'Let me give you a concrete example. Say you have...',
    'The key insight that most people miss is that...',
    'When you look at the actual results, what you find is...',
    'A really nice property of this approach is...',
    'Now where this gets really interesting is when you...'
  ]},
  { speaker: 'Host', style: 'summary', phrases: [
    'So to summarize, this approach fundamentally changes how we think about...',
    'That is really helpful context. Let me see if I understand correctly...',
    'Great, so what would you recommend for someone just getting started with this?',
    'That clarifies a lot. But one thing I am still curious about is...',
    'Perfect. Any closing thoughts on where this is heading?'
  ]},
]

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff
    return s / 0x7fffffff
  }
}

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { id } = req.query
  const seed = parseInt((id as string)?.replace(/\D/g, '').slice(-4)) || Date.now() % 10000
  const rng = seededRandom(seed)
  const duration = 180 + Math.floor(rng() * 600)
  const numWords = 800 + Math.floor(rng() * 1200)
  const numSegments = 16 + Math.floor(rng() * 20)
  const numChapters = 3 + Math.floor(rng() * 3)
  const numMoments = 3 + Math.floor(rng() * 3)

  const selectedTopics = shuffle(TOPICS, rng).slice(0, 2 + Math.floor(rng() * 2))
  const chapterSentences = selectedTopics.flatMap(t => t.sentences)
  const totalSentences = chapterSentences.length

  const wpm = 150 + rng() * 20
  const segmentDuration = duration / numSegments
  let currentTime = 5
  const segments: { time: number; speaker: string; text: string }[] = []
  const used = new Set<number>()

  for (let i = 0; i < numSegments; i++) {
    const speakerTurn = SPEAKER_TURNS[i % SPEAKER_TURNS.length]
    let idx: number
    do { idx = Math.floor(rng() * totalSentences) } while (used.has(idx) && used.size < totalSentences)
    used.add(idx)
    let text = chapterSentences[idx % chapterSentences.length]

    if (speakerTurn.style === 'question' || speakerTurn.style === 'followup' || speakerTurn.style === 'summary') {
      text = `${pick(speakerTurn.phrases, rng)}`
    } else {
      text = `${pick(speakerTurn.phrases, rng)} ${text}`
    }

    if (rng() < 0.2) {
      const fillers = ['I mean, ', 'you know, ', 'actually, ', 'essentially, ', 'basically, ', '']
      text = text.replace(/^([A-Z])/, `${pick(fillers, rng)}$1`)
    }

    segments.push({
      time: Math.round(currentTime),
      speaker: speakerTurn.speaker,
      text
    })

    const wordsInSegment = text.split(' ').length
    currentTime += Math.max(8, (wordsInSegment / wpm) * 60 + rng() * 3)
  }

  currentTime = 5
  const chapters = Array.from({ length: numChapters }, (_, i) => {
    const start = Math.round(currentTime)
    const segsInChapter = Math.floor((numSegments - segments.findIndex(s => s.time >= start)) / (numChapters - i))
    let endIdx = segments.findIndex(s => s.time >= start) + segsInChapter - 1
    endIdx = Math.min(endIdx, segments.length - 1)
    const end = Math.round(segments[endIdx].time + segmentDuration)
    const t = selectedTopics[i % selectedTopics.length]
    currentTime = end + 10
    return {
      title: `${t.name}`,
      start, end: Math.min(end, duration),
      confidence: 0.78 + rng() * 0.17
    }
  })

  const keyMoments = Array.from({ length: numMoments }, (_, i) => {
    const seg = segments[Math.floor(rng() * segments.length)]
    return {
      time: seg.time,
      text: seg.text.replace(/^(Great question|Let me break|The key insight|What I find|A really nice)\.{3}/, '').slice(0, 120)
    }
  }).sort((a, b) => a.time - b.time)

  let summaryText = `In this ${Math.floor(duration / 60)}-minute presentation, the discussion covers ${selectedTopics.map(t => t.name.toLowerCase()).join(', ')}. `
  summaryText += selectedTopics.map(t => {
    const topSentences = t.sentences.slice(0, 2).map(s => s.replace(/^[A-Z]/, c => c.toLowerCase()).replace(/\.$/, ''))
    return `The talk explores ${topSentences.join(', and ')}.`
  }).join(' ') + ` The conversation is structured into ${numChapters} chapters with ${numMoments} highlighted key moments across the full ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')} runtime.`

  res.json({
    video_id: id,
    sample_data: {
      video_id: id, duration, chapters, key_moments: keyMoments,
      segments,
      transcript: segments,
      summary: summaryText,
      full_text: segments.map(s => s.text).join(' '),
      tech_insights: {
        model: 'GPT-4o',
        embedding_model: 'text-embedding-3-large',
        vector_db: 'ChromaDB',
        language: 'en',
        chunks: segments.length * 12,
        tokens_processed: segments.reduce((s, seg) => s + seg.text.split(' ').length, 0),
        avg_chunk_size: '256',
        inference_time_ms: 2847
      }
    }
  })
}
