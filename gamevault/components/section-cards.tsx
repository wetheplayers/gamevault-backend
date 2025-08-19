import { IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export async function SectionCards() {
  const supabase = await createClient()

  // Total games
  const { count: totalGames = 0 } = await supabase
    .from("games")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)

  // Data quality across selected fields
  const qualityFields = [
    "canonical_title",
    "sort_title",
    "status",
    "first_announced_date",
    "first_release_date",
    "primary_genre_id",
    "engine_id",
    "monetisation_model_id",
    "synopsis_short",
    "description_long",
    "official_site",
    "press_kit_url",
    "age_ratings_summary",
    "accessibility_summary",
    "tech_notes",
  ] as const

  const nonNullCounts = await Promise.all(
    qualityFields.map(async (field) => {
      const { count = 0 } = await supabase
        .from("games")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .not(field as string, "is", null)
      return count
    })
  )

  const totalPossible = totalGames * qualityFields.length
  const completed = nonNullCounts.reduce((a, b) => a + b, 0)
  const dataQuality = totalPossible === 0 ? 0 : Math.round((completed / totalPossible) * 100)

  // Platforms: distinct platforms that have releases
  const { data: platformRows = [] } = await supabase
    .from("releases")
    .select("platform_id")
    .not("platform_id", "is", null)
    .is("deleted_at", null)
  const platforms = new Set(platformRows.map((r: any) => r.platform_id)).size

  // Monthly updates: count of audit log entries in last 30 days
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { count: monthlyUpdates = 0 } = await supabase
    .from("audit_logs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since)

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Games</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalGames}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Live
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Current total <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Count of all active games
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Data Quality</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {dataQuality}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">Across key fields</Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Percentage of completed fields
          </div>
          <div className="text-muted-foreground">
            Based on {qualityFields.length} core fields
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Platforms</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {platforms}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Live
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Distinct platforms <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Based on releases</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Monthly Updates</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {monthlyUpdates}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              30 days
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Changes recorded <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">From audit logs</div>
        </CardFooter>
      </Card>
    </div>
  )
}
