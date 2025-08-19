import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { GamesDataTable } from "@/components/games-data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { createClient } from "@/lib/supabase/server"

type GameRow = {
  id: string
  canonical_title: string
  status: string
  first_release_date: string | null
}

export default async function Page() {
  const supabase = await createClient()
  const { data: games, error } = await supabase
    .from("games")
    .select("id, canonical_title, status, first_release_date")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(25)

  // Games per day over last 120 days (server-side aggregate)
  const { data: perDay } = await supabase
    .from('games')
    .select('created_at')
    .is('deleted_at', null)
    .gte('created_at', new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: true })

  const countsMap = new Map<string, number>()
  ;(perDay || []).forEach((g: any) => {
    const d = new Date(g.created_at)
    d.setHours(0, 0, 0, 0)
    const key = d.toISOString().slice(0, 10)
    countsMap.set(key, (countsMap.get(key) || 0) + 1)
  })
  const today = new Date(); today.setHours(0,0,0,0)
  const start = new Date(today); start.setDate(start.getDate() - 120)
  const perDaySeries: { date: string; count: number }[] = []
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10)
    perDaySeries.push({ date: key, count: countsMap.get(key) || 0 })
  }

  const rows: GameRow[] = (games ?? []).map((g) => ({
    id: g.id as unknown as string,
    canonical_title: (g as any).canonical_title,
    status: (g as any).status,
    first_release_date: (g as any).first_release_date,
  }))

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive data={perDaySeries} />
              </div>
              <div className="px-4 lg:px-6">
                <GamesDataTable games={rows} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
