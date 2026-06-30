'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DrawingCanvas } from '@/components/drawing-canvas'
import { ThemeToggle } from '@/components/ThemeToggle'
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
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/store'
import { getCurrentUser, logoutAction } from '@/app/actions/auth'

const navigation = [
  { name: 'Nova Simulação', href: '/dashboard/simulacao', icon: Calculator },
  { name: 'Alavancagem Financeira', href: '/dashboard/alavancagem-financeira', icon: Wallet },
  { name: 'Aquisição Patrimonial', href: '/dashboard/alavancagem-patrimonial', icon: Building2 },
  { name: 'Aposentadoria', href: '/dashboard/aposentadoria', icon: PiggyBank },
  { name: 'Minhas Simulações', href: '/dashboard/simulacoes', icon: FileText },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  const user = useAuthStore(state => state.user)
  const setUser = useAuthStore(state => state.setUser)
  const logout = useAuthStore(state => state.logout)

  // Sync session on mount: if cookie expired, clear store and redirect to login
  useEffect(() => {
    getCurrentUser().then(serverUser => {
      if (!serverUser) {
        logout()
        router.replace('/login')
      } else {
        setUser(serverUser)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogout = async () => {
    try {
      await logoutAction()
    } finally {
      logout()
      router.replace('/login')
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-card border-b border-border px-4 md:px-6 py-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Mobile/Tablet menu button */}
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

          {/* Logo */}
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

        {/* Horizontal Menu (only visible on desktop/xl screens) */}
        <nav className="hidden xl:flex flex-wrap justify-center items-center gap-2 bg-accent/50 p-1.5 rounded-xl border border-border shadow-inner">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2",
                  isActive
                    ? "text-white bg-blue-600 shadow-md"
                    : "text-muted-foreground hover:text-foreground hover:bg-background"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Right side controls */}
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
          <div className="hidden xl:flex items-center gap-3 text-sm text-muted-foreground ml-2">
            <span className="bg-accent px-3 py-1.5 rounded-full text-xs font-bold text-blue-600 border border-border">ONLINE</span>
            {user && (
              <span className="font-medium text-foreground max-w-[160px] truncate">
                {user.name}
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Sair do sistema"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Mobile/Tablet dropdown menu */}
      <div
        className={cn(
          "bg-card border-b border-border px-4 xl:hidden overflow-hidden transition-all duration-300 ease-in-out",
          mobileMenuOpen ? "max-h-96 py-3 opacity-100" : "max-h-0 py-0 opacity-0"
        )}
      >
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
          {/* Logout no menu mobile */}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            Sair do sistema
          </button>
        </nav>
      </div>

      {/* Page content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
    </div>
  )
}
