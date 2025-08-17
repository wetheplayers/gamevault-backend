'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Mock chart component - Replace with actual chart library (recharts, chart.js, etc.)
function Chart({ data, type }: { data: unknown; type: string }) {
  return (
    <div className="flex h-[300px] items-center justify-center rounded-lg border-2 border-dashed">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Chart: {type}</p>
        <p className="text-xs text-muted-foreground mt-2">Install a charting library to display data</p>
        <pre className="mt-4 text-xs text-left max-w-xs overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  )
}

type StatusDatum = { name: string; value: number; percentage: number }
type TimelineDatum = { month: string; releases: number }
type GenreDatum = { genre: string; count: number }
type PlatformDatum = { platform: string; value: number; percentage: number }

export function ChartsSection() {
  const [gamesByStatus, setGamesByStatus] = useState<StatusDatum[]>([])
  const [releasesTimeline, setReleasesTimeline] = useState<TimelineDatum[]>([])
  const [popularGenres, setPopularGenres] = useState<GenreDatum[]>([])
  const [platformDistribution, setPlatformDistribution] = useState<PlatformDatum[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient() // reserved for future data fetches

      try {
        // Fetch games by status (mock data for now)
        setGamesByStatus([
          { name: 'Released', value: 450, percentage: 45 },
          { name: 'In Development', value: 230, percentage: 23 },
          { name: 'Announced', value: 180, percentage: 18 },
          { name: 'Cancelled', value: 80, percentage: 8 },
          { name: 'Delisted', value: 60, percentage: 6 }
        ])

        // Fetch releases timeline (mock data)
        setReleasesTimeline([
          { month: 'Jan', releases: 45 },
          { month: 'Feb', releases: 52 },
          { month: 'Mar', releases: 48 },
          { month: 'Apr', releases: 70 },
          { month: 'May', releases: 65 },
          { month: 'Jun', releases: 80 }
        ])

        // Fetch popular genres (mock data)
        setPopularGenres([
          { genre: 'Action', count: 320 },
          { genre: 'RPG', count: 280 },
          { genre: 'Adventure', count: 240 },
          { genre: 'Strategy', count: 180 },
          { genre: 'Simulation', count: 150 },
          { genre: 'Sports', count: 120 }
        ])

        // Fetch platform distribution (mock data)
        setPlatformDistribution([
          { platform: 'PC', value: 380, percentage: 38 },
          { platform: 'PlayStation 5', value: 250, percentage: 25 },
          { platform: 'Xbox Series X/S', value: 200, percentage: 20 },
          { platform: 'Nintendo Switch', value: 170, percentage: 17 }
        ])
      } catch (error) {
        console.error('Error fetching chart data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="animate-pulse">
          <div className="h-[400px] bg-muted"></div>
        </Card>
        <Card className="animate-pulse">
          <div className="h-[400px] bg-muted"></div>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Games by Status / Platform Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribution Overview</CardTitle>
          <CardDescription>
            Game status and platform distribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="status" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="status">By Status</TabsTrigger>
              <TabsTrigger value="platform">By Platform</TabsTrigger>
            </TabsList>
            <TabsContent value="status" className="mt-4">
              <Chart data={gamesByStatus} type="Pie Chart" />
              <div className="mt-4 space-y-2">
                {gamesByStatus.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-primary" />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value} ({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="platform" className="mt-4">
              <Chart data={platformDistribution} type="Donut Chart" />
              <div className="mt-4 space-y-2">
                {platformDistribution.map((item) => (
                  <div key={item.platform} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-primary" />
                      <span>{item.platform}</span>
                    </div>
                    <span className="font-medium">{item.value} ({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Releases Timeline / Popular Genres */}
      <Card>
        <CardHeader>
          <CardTitle>Trends & Analytics</CardTitle>
          <CardDescription>
            Release trends and genre popularity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="timeline">Release Timeline</TabsTrigger>
              <TabsTrigger value="genres">Popular Genres</TabsTrigger>
            </TabsList>
            <TabsContent value="timeline" className="mt-4">
              <Chart data={releasesTimeline} type="Line Chart" />
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">372</p>
                  <p className="text-xs text-muted-foreground">Total Releases</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">62</p>
                  <p className="text-xs text-muted-foreground">Avg per Month</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">+15%</p>
                  <p className="text-xs text-muted-foreground">Growth</p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="genres" className="mt-4">
              <Chart data={popularGenres} type="Bar Chart" />
              <div className="mt-4 space-y-2">
                {popularGenres.slice(0, 3).map((item, index) => (
                  <div key={item.genre} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        {index + 1}
                      </span>
                      <span>{item.genre}</span>
                    </div>
                    <span className="font-medium">{item.count} games</span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
