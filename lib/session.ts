import { createHmac, timingSafeEqual } from 'crypto'

export const COOKIE_NAME = 'reobote_session'

function normalizeSecret(secret: string | undefined): string | null {
  if (!secret) return null
  const trimmed = secret.trim()
  if (!trimmed) return null

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1)
  }

  return trimmed
}

function getSessionSecret(): string | null {
  return normalizeSecret(process.env.SESSION_SECRET)
}

function getLiteralEnvSecret(secret: string | undefined): string | null {
  if (typeof secret !== 'string') return null
  if (secret.length === 0) return null

  if (
    (secret.startsWith('"') && secret.endsWith('"')) ||
    (secret.startsWith("'") && secret.endsWith("'"))
  ) {
    return secret.slice(1, -1)
  }

  return secret
}

function getCentralAuthSecret(): string | null {
  return getLiteralEnvSecret(process.env.CENTRAL_AUTH_JWT_SECRET ?? process.env.AUTH_SECRET)
}

// Função de encode base64url igual ao Simulador Central
function base64UrlEncode(input: string | Buffer): string {
  const b64 = Buffer.isBuffer(input) ? input.toString('base64') : Buffer.from(input).toString('base64')
  return b64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function decodePayload<T extends object>(b64url: string): T {
  const payloadStr = Buffer.from(
    b64url.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64url.length + 3) % 4),
    'base64'
  ).toString('utf8')

  return JSON.parse(payloadStr) as T
}

export async function createSessionToken(data: object): Promise<string> {
  const secret = getSessionSecret()
  if (!secret) throw new Error('SESSION_SECRET não configurado')
  const payloadJson = JSON.stringify(data)
  const payload = base64UrlEncode(payloadJson)
  const sig = createHmac('sha256', secret).update(payload).digest('hex')
  return `${payload}.${sig}`
}

export async function verifySessionToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const secret = getSessionSecret()
    if (!secret) return null
    const dot = token.lastIndexOf('.')
    if (dot <= 0) return null
    const payload = token.slice(0, dot)
    const sig = token.slice(dot + 1)
    if (!payload || !sig) return null
    
    const expectedSig = createHmac('sha256', secret).update(payload).digest('hex')
    try {
      const a = Buffer.from(sig, 'hex')
      const b = Buffer.from(expectedSig, 'hex')
      if (a.length !== b.length) return null
      if (!timingSafeEqual(a, b)) return null
    } catch {
      return null
    }
    
    return decodePayload(payload) as Record<string, unknown>
  } catch {
    return null
  }
}

export async function verifySharedAuthJwt(token: string): Promise<Record<string, unknown> | null> {
  try {
    const secret = getCentralAuthSecret()
    if (!secret) return null

    const parts = token.split('.')
    if (parts.length !== 2) return null

    const [payloadB64, signatureB64] = parts

    const expectedSignature = createHmac('sha256', secret)
      .update(payloadB64)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')

    try {
      const a = Buffer.from(signatureB64)
      const b = Buffer.from(expectedSignature)
      if (a.length !== b.length) return null
      if (!timingSafeEqual(a, b)) return null

      const payload = decodePayload<Record<string, unknown>>(payloadB64)
      if (typeof payload.exp !== 'number') return null
      if (payload.exp < Math.floor(Date.now() / 1000)) return null

      return payload
    } catch {
      return null
    }
  } catch {
    return null
  }
}
