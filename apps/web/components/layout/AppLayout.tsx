import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

interface AppLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      <Sidebar />
      <Topbar title={title} subtitle={subtitle} />
      <main className="ml-[220px] pt-[58px] min-h-screen">
        {children}
      </main>
    </div>
  )
}
