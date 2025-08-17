import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
// import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import {
  Gamepad2,
  TrendingUp,
  Clock,
  Users,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'

interface StatsCardsProps {
  userRole?: string
}

export async function StatsCards({ userRole }: StatsCardsProps) {
  const supabase = await createClient()

  // Fetch statistics
  const [
    { count: totalGames },
    { count: recentGames },
    { count: pendingModeration },
    { count: activeUsers }
  ] = await Promise.all([
    // Total games (only published for regular users)
    supabase
      .from('games')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .in(
        'status',
        userRole === 'user' ? ['released'] : ['announced', 'in_development', 'released']
      ),

    // Recent additions (last 7 days)
    supabase
      .from('games')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

    // Pending moderation (for moderators and above)
    userRole && ['moderator', 'admin', 'superadmin'].includes(userRole)
      ? supabase
          .from('moderation_queue')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
      : { count: 0 },

    // Active users (for admins only)
    userRole && ['admin', 'superadmin'].includes(userRole)
      ? supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .gte('last_activity_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      : { count: 0 }
  ])

  // Calculate week-over-week changes (mock data for now)
  const totalGamesChange = 12.5
  const recentGamesChange = -8.2
  const pendingModerationChange = 23.0
  const activeUsersChange = 5.4

  const cards = [
    {
      title: 'Total Games',
      value: totalGames?.toLocaleString() || '0',
      description: userRole === 'user' ? 'Released games' : 'All active games',
      icon: Gamepad2,
      change: totalGamesChange,
      visible: true
    },
    {
      title: 'Recent Additions',
      value: recentGames?.toLocaleString() || '0',
      description: 'Last 7 days',
      icon: TrendingUp,
      change: recentGamesChange,
      visible: true
    },
    {
      title: 'Pending Moderation',
      value: pendingModeration?.toLocaleString() || '0',
      description: 'Items awaiting review',
      icon: Clock,
      change: pendingModerationChange,
      visible: userRole && ['moderator', 'admin', 'superadmin'].includes(userRole)
    },
    {
      title: 'Active Users',
      value: activeUsers?.toLocaleString() || '0',
      description: 'Last 30 days',
      icon: Users,
      change: activeUsersChange,
      visible: userRole && ['admin', 'superadmin'].includes(userRole)
    }
  ]

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="h-4 w-4" />
    if (change < 0) return <ArrowDown className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400'
    if (change < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards
        .filter((card) => card.visible)
        .map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">
                    {card.description}
                  </p>
                  {card.change !== undefined && (
                    <div className={`flex items-center text-xs ${getChangeColor(card.change)}`}>
                      {getChangeIcon(card.change)}
                      <span className="ml-1">{Math.abs(card.change)}%</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
    </div>
  )
}
