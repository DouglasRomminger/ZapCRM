'use client'

import { Bell, Search, ChevronDown } from 'lucide-react'

interface TopbarProps {
  title: string
  subtitle?: string
}

export function Topbar({ title, subtitle }: TopbarProps) {
  return (
    <header
      className="fixed top-0 left-[220px] right-0 h-[58px] z-30 flex items-center justify-between px-6 border-b"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Título */}
      <div>
        <h1 className="text-[17px] font-semibold" style={{ color: 'var(--color-text)' }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-[12px]" style={{ color: 'var(--color-text2)' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Ações */}
      <div className="flex items-center gap-3">
        {/* Busca */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-[13px] cursor-pointer transition-colors hover:bg-gray-50"
          style={{ border: '1px solid var(--color-border)', color: 'var(--color-text3)' }}
        >
          <Search size={14} />
          <span>Buscar...</span>
          <kbd className="text-[10px] px-1 rounded" style={{ background: 'var(--color-bg)', color: 'var(--color-text3)' }}>
            ⌘K
          </kbd>
        </div>

        {/* Notificações */}
        <button
          className="relative w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-gray-50"
          style={{ color: 'var(--color-text2)' }}
        >
          <Bell size={16} />
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: 'var(--color-red)' }}
          />
        </button>

        {/* Avatar */}
        <button className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            AC
          </div>
          <ChevronDown size={12} style={{ color: 'var(--color-text3)' }} />
        </button>
      </div>
    </header>
  )
}
