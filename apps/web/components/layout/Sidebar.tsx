'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  Columns2,
  TrendingUp,
  Users,
  Star,
  Megaphone,
  Bot,
  Settings,
  Zap,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { mockUsuarioLogado } from '@/src/mocks/usuarios'

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/inbox',      label: 'Inbox',       icon: MessageSquare,  badge: 5 },
  { href: '/kanban',     label: 'Kanban',      icon: Columns2 },
  { href: '/pipeline',   label: 'Pipeline',    icon: TrendingUp },
  { href: '/contatos',   label: 'Contatos',    icon: Users },
  { href: '/satisfacao', label: 'Satisfação',  icon: Star },
  { href: '/campanhas',  label: 'Campanhas',   icon: Megaphone },
  { href: '/automacao',  label: 'Automação',   icon: Bot },
  { href: '/settings/conexao', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const user = mockUsuarioLogado

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[220px] flex flex-col z-40"
      style={{ backgroundColor: 'var(--color-sidebar)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 h-[58px] border-b border-white/10 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)] flex items-center justify-center">
          <Zap size={14} className="text-white" />
        </div>
        <span className="text-white font-semibold text-[15px] tracking-tight">ZapCRM</span>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors relative',
                active
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span className="flex-1">{label}</span>
              {badge ? (
                <span className="bg-[var(--color-accent)] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {badge}
                </span>
              ) : null}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-[var(--color-accent)] rounded-r" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Usuário logado */}
      <div className="px-3 pb-4 shrink-0 border-t border-white/10 pt-3">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-md">
          <div className="w-7 h-7 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-[11px] font-semibold shrink-0">
            {user.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-[12px] font-medium truncate">{user.nome}</p>
            <p className="text-white/50 text-[10px] truncate capitalize">{user.role.toLowerCase()}</p>
          </div>
          <button className="text-white/40 hover:text-white/80 transition-colors">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
