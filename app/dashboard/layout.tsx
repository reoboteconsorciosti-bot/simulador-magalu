'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  Moon,
  Sun,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
            <Menu className="h-5 w-5" />
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

        {/* Right side controls - always on the far right */}
        <div className="flex items-center gap-4 ml-auto">
          <DrawingCanvas />
          <ThemeToggle />
          <div className="hidden xl:flex items-center gap-3 text-sm text-muted-foreground">
            <span className="bg-accent px-3 py-1.5 rounded-full text-xs font-bold text-blue-600 border border-border">ONLINE</span>
            <span>Reobote Consórcios</span>
          </div>
        </div>
      </header>

      {/* Mobile/Tablet dropdown menu */}
      {mobileMenuOpen && (
        <div className="bg-card border-b border-border px-4 py-3 xl:hidden">
          <nav className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
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
          </nav>
        </div>
      )}

      {/* Page content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
    </div>
  )
}
