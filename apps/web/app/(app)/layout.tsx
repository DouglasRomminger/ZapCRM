// Layout da área autenticada — envolve todas as rotas de (app)
// Topbar e título são definidos em cada página via AppLayout

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
