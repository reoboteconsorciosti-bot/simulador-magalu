import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validar credenciais usando variáveis de ambiente
    const isAdmin = email === process.env.EMAIL_ADRESS && password === process.env.PASSWORD
    const isVendedor = email === process.env.EMAIL_VENDEDOR && password === process.env.PASSWORD_VENDEDOR

    if (!isAdmin && !isVendedor) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      )
    }

    // Retornar dados do usuário
    const user = {
      id: isAdmin ? '1' : '2',
      name: isAdmin ? 'Administrador' : 'Vendedor',
      email: email,
      role: isAdmin ? 'ADMIN' as const : 'VENDEDOR' as const,
      office: isAdmin ? 'Matriz' : 'Filial SP',
      phone: isAdmin ? '(11) 99999-9999' : '(11) 98888-8888',
      socialMedia: isAdmin ? '@reobote' : '@vendedor.reobote',
      active: true
    }

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}