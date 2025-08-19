import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { GamesDataTable, type GameRow } from '@/components/games-data-table'
import { Button } from '@/components/ui/button'

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('games')
    .select('id, canonical_title, status, first_release_date')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const games: GameRow[] = (data || []).map((g: any) => ({
    id: g.id,
    canonical_title: g.canonical_title,
    status: g.status,
    first_release_date: g.first_release_date,
  }))

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": 'calc(var(--spacing) * 72)',
        "--header-height": 'calc(var(--spacing) * 12)'
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="mb-4 flex items-center justify-between">
                  <h1 className="text-xl font-semibold">Games</h1>
                  <Button asChild>
                    <Link href="/dashboard/games/new">Add Game</Link>
                  </Button>
                </div>
                <GamesDataTable games={games} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}


