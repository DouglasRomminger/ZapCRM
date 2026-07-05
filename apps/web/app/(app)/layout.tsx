'use client'

// Layout da área autenticada — exige token; sem ele, redireciona pro /login.
// Topbar e título são definidos em cada página via AppLayout.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { obterToken } from '@/lib/auth'

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    if (!obterToken()) {
      router.replace('/login')
    } else {
      setPronto(true)
    }
  }, [router])

  if (!pronto) return null
  return <>{children}</>
}
