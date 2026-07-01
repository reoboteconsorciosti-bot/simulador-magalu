import { notFound } from 'next/navigation'
import { NextRequest, NextResponse } from 'next/server'
import {
  createAuthSession,
  getSessionCookieOptions,
  validateCentralAuthTokenDetailed,
} from '@/lib/auth'
import { COOKIE_NAME } from '@/lib/session'

function failAuth(message: string): never {
  console.error(`[magalu-auth] ${message}`)
  notFound()
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  console.log('[magalu-auth] Token recebido:', token ?? '(ausente)')

  if (!token) {
    failAuth('Token ausente na rota /auth.')
  }

  const validation = await validateCentralAuthTokenDetailed(token)
  console.log('[magalu-auth] Resultado da validação do JWT:', validation.ok ? 'valido' : validation.reason)

  if (!validation.ok) {
    failAuth(`Falha na validação do JWT: ${validation.reason}.`)
  }

  console.log('[magalu-auth] ID do usuário extraído do token:', validation.userId)
  console.log('[magalu-auth] Resultado da consulta ao banco:', {
    found: true,
    userId: validation.user.id,
    email: validation.user.email,
  })

  const sessionToken = await createAuthSession(validation.user)
  if (!sessionToken) {
    failAuth('Não foi possível criar a sessão local do Simulador Magalu.')
  }

  console.log('[magalu-auth] Sessão criada com sucesso.')

  const response = NextResponse.redirect(new URL('/', request.url))
  response.cookies.set(COOKIE_NAME, sessionToken, getSessionCookieOptions())
  console.log('[magalu-auth] Redirecionamento executado para /.')
  return response
}
