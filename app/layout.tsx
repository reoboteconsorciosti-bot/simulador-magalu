import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { VercelAnalytics } from '@/components/VercelAnalytics'
import './globals.css'

export const metadata: Metadata = {
  title: 'Reobote Consórcios - Simulador Magalu',
  description: 'Sistema de simulação e propostas para Magalu Consórcio',
  icons: {
    icon: '/favicon/reobote_favicon_v4.png',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="bg-background" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
          <Toaster />
          {process.env.NODE_ENV === 'production' && <VercelAnalytics />}
        </ThemeProvider>
      </body>
    </html>
  )
}
