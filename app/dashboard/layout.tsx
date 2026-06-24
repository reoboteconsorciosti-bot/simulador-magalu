'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DrawingCanvas } from '@/components/drawing-canvas'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  LayoutDashboard,
  Calculator,
  FileText,
  TrendingUp,
  Building2,
  Settings,
  Menu,
  X,
  PiggyBank,
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Nova Simulação', href: '/dashboard/simulacao', icon: Calculator },
  { name: 'Alavancagem Financeira', href: '/dashboard/alavancagem-financeira', icon: TrendingUp },
  { name: 'Alavancagem Patrimonial', href: '/dashboard/alavancagem-patrimonial', icon: Building2 },
  { name: 'Previdência Aplicada', href: '/dashboard/previdencia-aplicada', icon: PiggyBank },
  { name: 'Minhas Simulações', href: '/dashboard/simulacoes', icon: FileText },
]

const bottomNavigation = [
  { name: 'Configurações', href: '/dashboard/configuracoes', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar backdrop for mobile/tablet */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 xl:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border text-foreground transform transition-transform duration-200 ease-in-out xl:translate-x-0 shadow-sm',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-2">
              <img 
                src="/images/LOGO-PRETA.png" 
                alt="Reobote Consórcios"
                className="w-24 h-auto dark:hidden"
              />
              <img 
                src="/images/reobote_logo_final.png" 
                alt="Reobote Consórcios"
                className="w-48 h-auto hidden dark:block"
              />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="xl:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Bottom navigation */}
          <div className="px-3 py-4 border-t border-border space-y-1">
            {bottomNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="xl:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-card border-b border-border flex items-center px-4 md:px-6 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <DrawingCanvas />
            <ThemeToggle />
            <div className="text-sm text-muted-foreground">
              Reobote Consórcios - Sistema de Simulação
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
