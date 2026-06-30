export const COOKIE_NAME = 'reobote_session'

const ALG = { name: 'HMAC', hash: 'SHA-256' } as const

async function getHmacKey(secret: string): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    ALG,
    false,
    ['sign', 'verify']
  )
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBuf(hex: string): Uint8Array {
  return new Uint8Array((hex.match(/.{2}/g) ?? []).map(b => parseInt(b, 16)))
}

function encodePayload(data: object): string {
  const json = JSON.stringify(data)
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  bytes.forEach(b => { binary += String.fromCharCode(b) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function decodePayload(b64url: string): object {
  const padded = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded + '='.repeat((4 - padded.length % 4) % 4))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return JSON.parse(new TextDecoder().decode(bytes))
}

export async function createSessionToken(data: object): Promise<string> {
  const secret = process.env.SESSION_SECRET!
  const payload = encodePayload(data)
  const key = await getHmacKey(secret)
  const sig = bufToHex(
    await globalThis.crypto.subtle.sign(ALG, key, new TextEncoder().encode(payload))
  )
  return `${payload}.${sig}`
}

export async function verifySessionToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const secret = process.env.SESSION_SECRET
    if (!secret) return null
    const dot = token.lastIndexOf('.')
    if (dot <= 0) return null
    const payload = token.slice(0, dot)
    const sig = token.slice(dot + 1)
    if (!payload || !sig) return null
    const key = await getHmacKey(secret)
    const valid = await globalThis.crypto.subtle.verify(
      ALG,
      key,
      hexToBuf(sig),
      new TextEncoder().encode(payload)
    )
    if (!valid) return null
    return decodePayload(payload) as Record<string, unknown>
  } catch {
    return null
  }
}
