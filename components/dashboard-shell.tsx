'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DrawingCanvas } from '@/components/drawing-canvas'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuthStore } from '@/lib/store'
import type { User } from '@/lib/types'
import { logoutAction } from '@/lib/auth-actions'
import {
  Calculator,
  FileText,
  TrendingUp,
  Building2,
  PiggyBank,
  Menu,
  X,
  Wallet,
  LogOut,
  Maximize2,
  Minimize2,
  User2,
} from 'lucide-react'

const navigation = [
  { name: 'Nova Simulação', href: '/dashboard/simulacao', icon: Calculator },
  { name: 'Alavancagem Financeira', href: '/dashboard/alavancagem-financeira', icon: Wallet },
  { name: 'Aquisição Patrimonial', href: '/dashboard/alavancagem-patrimonial', icon: Building2 },
  { name: 'Aposentadoria', href: '/dashboard/aposentadoria', icon: PiggyBank },
  { name: 'Minhas Simulações', href: '/dashboard/simulacoes', icon: FileText },
]

type DashboardShellProps = {
  children: React.ReactNode
  initialUser: User
}

export function DashboardShell({ children, initialUser }: DashboardShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const user = useAuthStore(state => state.user)
  const setUser = useAuthStore(state => state.setUser)
  const logout = useAuthStore(state => state.logout)
  const currentUser = user ?? initialUser

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  useEffect(() => {
    setUser(initialUser)
  }, [initialUser, setUser])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  const handleLogout = async () => {
    try {
      await logoutAction()
    } finally {
      logout()
      router.replace('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <header className="sticky top-0 z-30 bg-card border-b border-border px-4 md:px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 transition-all duration-300 rotate-0" />
            ) : (
              <Menu className="h-5 w-5 transition-all duration-300 rotate-0" />
            )}
          </Button>

          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2.5 rounded-lg flex items-center justify-center text-white shadow-lg">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-widest font-extrabold text-blue-600">SISTEMA INTEGRADO</span>
            <h1 className="text-lg font-black tracking-tight flex items-center gap-1.5 text-foreground">
              REOBOTE <span className="font-light text-muted-foreground">CONSÓRCIOS</span>
            </h1>
          </div>
        </div>

        <nav className="hidden xl:flex flex-wrap justify-center items-center gap-2 bg-accent/50 p-1.5 rounded-xl border border-border shadow-inner">
          {navigation.map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2',
                  isActive
                    ? 'text-white bg-blue-600 shadow-md'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
          <DrawingCanvas />
          <ThemeToggle />
          <div className="hidden md:flex items-center gap-2 ml-1 rounded-full border border-border/70 bg-accent/40 px-2.5 py-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-background text-muted-foreground border border-border/70">
              <User2 className="h-3.5 w-3.5" />
            </div>
            <span className="max-w-[150px] truncate text-xs font-semibold text-foreground">
              {currentUser.name}
            </span>
          </div>
        </div>
      </header>

      <div
        className={cn(
          'bg-card border-b border-border px-4 xl:hidden overflow-hidden transition-all duration-300 ease-in-out',
          mobileMenuOpen ? 'max-h-96 py-3 opacity-100' : 'max-h-0 py-0 opacity-0'
        )}
      >
        <nav className="space-y-2">
          {navigation.map(item => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            Sair do sistema
          </button>
        </nav>
      </div>

      <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
    </div>
  )
}
