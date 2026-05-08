import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Get embedding from HuggingFace
async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(
    'https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text }),
    }
  )
  const data = await response.json()
  if (Array.isArray(data) && Array.isArray(data[0])) return data[0]
  if (Array.isArray(data)) return data
  throw new Error('Embedding failed: ' + JSON.stringify(data))
}

// Ask Groq
async function askGroq(prompt: string): Promise<string> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.7,
    }),
  })
  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'Sorry, I could not get a response.'
}

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()
    if (!message) return NextResponse.json({ error: 'No message' }, { status: 400 })

    // Step 1: Get embedding for user message
    let embedding: number[]
    try {
      embedding = await getEmbedding(message)
    } catch (e) {
      // If HF fails, still answer with Groq using all products
      const { data: allProducts } = await supabase.from('products').select('name, description, price, discount_price, category').limit(10)
      const productList = allProducts?.map(p => `${p.name} (${p.category}) - ₹${p.discount_price ?? p.price}`).join('\n') || ''
      const reply = await askGroq(`You are a helpful shopping assistant for Omgea Shop, an Indian e-commerce store. 
Products available:\n${productList}\n\nCustomer says: "${message}"\n\nGive a helpful, friendly reply in 2-3 sentences. Always mention a relevant product. Use ₹ for prices.`)
      return NextResponse.json({ reply })
    }

    // Step 2: Search similar products using pgvector
    const { data: matchedProducts, error } = await supabase.rpc('match_products', {
      query_embedding: embedding,
      match_threshold: 0.3,
      match_count: 3,
    })

    let productContext = ''
    let hasMatches = false

    if (!error && matchedProducts && matchedProducts.length > 0) {
      hasMatches = true
      productContext = matchedProducts.map((p: any) =>
        `- ${p.name} (${p.category}): ₹${p.discount_price ?? p.price} — ${p.description}`
      ).join('\n')
    } else {
      // No vector match — get bestsellers to promote
      const { data: bestsellers } = await supabase
        .from('products')
        .select('name, description, price, discount_price, category')
        .eq('is_active', true)
        .limit(3)
      productContext = bestsellers?.map(p =>
        `- ${p.name} (${p.category}): ₹${p.discount_price ?? p.price} — ${p.description}`
      ).join('\n') || ''
    }

    // Step 3: Build smart prompt for Groq
    const prompt = hasMatches
      ? `You are a friendly shopping assistant for Omgea Shop, an Indian e-commerce store.
The customer asked: "${message}"

Relevant products found:
${productContext}

Reply in 2-3 sentences. Be helpful and enthusiastic. Mention the product name and price using ₹. Keep it short and natural.`
      : `You are a friendly shopping assistant for Omgea Shop, an Indian e-commerce store.
The customer said something off-topic: "${message}"

Our current products:
${productContext}

Reply in 2-3 sentences. First briefly address what they said (be fun/creative), then smoothly promote one of our products as a suggestion. Use ₹ for prices.`

    const reply = await askGroq(prompt)
    return NextResponse.json({ reply, products: matchedProducts || [] })

  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json({ reply: 'Sorry, something went wrong. Please try again!' })
  }
}