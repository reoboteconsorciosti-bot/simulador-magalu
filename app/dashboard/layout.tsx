import { DashboardShell } from '@/components/dashboard-shell'
import { requireCurrentUser } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireCurrentUser()
  return <DashboardShell initialUser={user}>{children}</DashboardShell>
}
