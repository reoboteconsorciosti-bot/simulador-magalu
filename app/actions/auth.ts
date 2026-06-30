'use server'

import { cookies } from 'next/headers'
import { createSessionToken, verifySessionToken, COOKIE_NAME } from '@/lib/session'
import type { User } from '@/lib/types'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 dias
  path: '/',
}

function getAdminUser(): User {
  return {
    id: '1',
    name: 'Reobote Consórcios',
    email: process.env.ADMIN_EMAIL ?? 'admin@reobote.com.br',
    role: 'ADMIN',
    office: 'Matriz',
    phone: '',
    socialMedia: '@reobote',
    active: true,
  }
}

export type LoginResult =
  | { success: true; user: User }
  | { success: false; error: string }

export async function loginAction(email: string, password: string): Promise<LoginResult> {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    return { success: false, error: 'Servidor mal configurado. Contate o suporte.' }
  }

  if (email.trim() !== adminEmail || password !== adminPassword) {
    return { success: false, error: 'E-mail ou senha incorretos.' }
  }

  const adminUser = getAdminUser()
  const token = await createSessionToken({
    userId: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
  })

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, COOKIE_OPTS)

  return { success: true, user: adminUser }
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    const payload = await verifySessionToken(token)
    if (!payload || payload.role !== 'ADMIN') return null
    return getAdminUser()
  } catch {
    return null
  }
}
