import { NextRequest, NextResponse } from 'next/server'

const R2_ACCOUNT_ID = '165dc1f10f462fd40aa81ee21c571dca'
const R2_ACCESS_KEY = 'f08c3fe89b80e14410ca3686d30588ad'
const R2_SECRET_KEY = 'f529deb1e497a3f54aabff96d70432ad554ea9ead7821293fa0f9a6ff5d21a17'
const R2_BUCKET = 'omgea-store'
const R2_PUBLIC_URL = 'https://pub-614271cfd871474aa8c091e415915dda.r2.dev'

async function hmacSha256(key: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data))
}

async function getSignatureKey(key: string, dateStamp: string, region: string, service: string): Promise<ArrayBuffer> {
  const kDate = await hmacSha256(new TextEncoder().encode('AWS4' + key), dateStamp)
  const kRegion = await hmacSha256(kDate, region)
  const kService = await hmacSha256(kRegion, service)
  return hmacSha256(kService, 'aws4_request')
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function sha256HashBuffer(data: Uint8Array): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', data))
}

async function sha256HashString(data: string): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data)))
}

export async function POST(request: NextRequest) {
  try {
    const { filename, contentType, data } = await request.json()

    if (!filename || !data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Missing or invalid data' }, { status: 400 })
    }

    const uint8Array = new Uint8Array(data)

    const now = new Date()
    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '')
    const amzDate = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const host = `${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

    const payloadHash = await sha256HashBuffer(uint8Array)

    const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`
    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date'

    const canonicalRequest = ['PUT', `/${R2_BUCKET}/${filename}`, '', canonicalHeaders, signedHeaders, payloadHash].join('\n')

    const credentialScope = `${dateStamp}/auto/s3/aws4_request`
    const canonicalRequestHash = await sha256HashString(canonicalRequest)
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`

    const signingKey = await getSignatureKey(R2_SECRET_KEY, dateStamp, 'auto', 's3')
    const signature = toHex(await hmacSha256(signingKey, stringToSign))
    const authorization = `AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

    const uploadRes = await fetch(`https://${host}/${R2_BUCKET}/${filename}`, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        'x-amz-content-sha256': payloadHash,
        'x-amz-date': amzDate,
        'Authorization': authorization,
      },
      body: uint8Array,
    })

    if (!uploadRes.ok) {
      const errText = await uploadRes.text()
      throw new Error(`R2 upload failed: ${uploadRes.status} — ${errText}`)
    }

    return NextResponse.json({ url: `${R2_PUBLIC_URL}/${filename}`, success: true })

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}