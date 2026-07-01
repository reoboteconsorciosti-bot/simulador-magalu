import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import { COOKIE_NAME, createSessionToken, verifySessionToken, verifySharedAuthJwt } from '@/lib/session'
import type { User } from '@/lib/types'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7,
  path: '/',
}

type PrismaUserRecord = {
  id: string
  email: string
  name: string
  role: string
}

type SessionPayload = {
  userId?: unknown
  email?: unknown
  role?: unknown
  name?: unknown
  active?: unknown
}

export type CentralAuthValidationResult =
  | { ok: true; user: User; userId: string; payload: Record<string, unknown> }
  | {
      ok: false
      reason:
        | 'missing-session-secret'
        | 'invalid-token'
        | 'missing-user-id'
        | 'user-not-found'
    }

function mapPrismaUser(user: PrismaUserRecord): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    active: true,
  }
}

function getPayloadString(
  payload: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = payload[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }

  return null
}

function buildDisplayName(email: string): string {
  const localPart = email.split('@')[0] ?? email
  const normalized = localPart.replace(/[._-]+/g, ' ').trim()
  if (!normalized) return email

  return normalized
    .split(/\s+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function buildSessionUser(
  payload: Record<string, unknown>,
  databaseUser: User | null,
  userId: string
): User {
  const email = getPayloadString(payload, 'email') ?? databaseUser?.email ?? ''
  const role = getPayloadString(payload, 'role') ?? databaseUser?.role ?? 'Consultor'
  const payloadName =
    getPayloadString(payload, 'name', 'fullName') ??
    (payload.user && typeof payload.user === 'object' && !Array.isArray(payload.user)
      ? getPayloadString(payload.user as Record<string, unknown>, 'name', 'fullName')
      : null)

  return {
    id: userId,
    email,
    role,
    name: payloadName ?? databaseUser?.name ?? buildDisplayName(email || userId),
    active: databaseUser?.active ?? true,
  }
}

function extractUserId(payload: Record<string, unknown>): string | null {
  const directCandidates = [payload.uid, payload.userId, payload.sub, payload.id]

  for (const candidate of directCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate
  }

  const nestedUser = payload.user
  if (nestedUser && typeof nestedUser === 'object' && !Array.isArray(nestedUser)) {
    const nestedId = (nestedUser as { id?: unknown }).id
    if (typeof nestedId === 'string' && nestedId.trim()) return nestedId
  }

  return null
}

async function findUserById(userId: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  })

  if (!user) return null
  return mapPrismaUser(user)
}

export function getSessionCookieOptions() {
  return COOKIE_OPTS
}

export async function createAuthSession(user: User): Promise<string | null> {
  if (!process.env.SESSION_SECRET) return null

  return createSessionToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    active: user.active,
  })
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null

  const payload = await verifySessionToken(token) as SessionPayload | null
  if (!payload || typeof payload.userId !== 'string' || !payload.userId) return null

  const sessionUser: User = {
    id: payload.userId,
    email: typeof payload.email === 'string' ? payload.email : '',
    role: typeof payload.role === 'string' ? payload.role : 'Consultor',
    name:
      typeof payload.name === 'string' && payload.name.trim()
        ? payload.name
        : buildDisplayName(typeof payload.email === 'string' ? payload.email : payload.userId),
    active: payload.active !== false,
  }

  const databaseUser = await findUserById(payload.userId)
  if (!databaseUser) return sessionUser

  return {
    ...databaseUser,
    ...sessionUser,
    name: sessionUser.name || databaseUser.name,
    email: sessionUser.email || databaseUser.email,
    role: sessionUser.role || databaseUser.role,
  }
}

export async function requireCurrentUser(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) notFound()
  return user
}

export async function clearCurrentSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function validateCentralAuthToken(token: string): Promise<User | null> {
  const result = await validateCentralAuthTokenDetailed(token)
  return result.ok ? result.user : null
}

export async function validateCentralAuthTokenDetailed(
  token: string
): Promise<CentralAuthValidationResult> {
  const payload = await verifySharedAuthJwt(token)
  if (!payload) {
    return { ok: false, reason: 'invalid-token' }
  }

  const userId = extractUserId(payload)
  if (!userId) {
    return { ok: false, reason: 'missing-user-id' }
  }

  const databaseUser = await findUserById(userId)
  if (!databaseUser) {
    return { ok: false, reason: 'user-not-found' }
  }

  const user = buildSessionUser(payload, databaseUser, userId)

  return { ok: true, user, userId, payload }
}
