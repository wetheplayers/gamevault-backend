import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/server'
import {
  Gamepad2,
  Edit,
  UserPlus,
  Bell,
  Shield,
  Image,
  Building2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface RecentActivityProps {
  userRole?: string
}

export async function RecentActivity({ userRole }: RecentActivityProps) {
  const supabase = await createClient()

  // Fetch recent audit logs
  let query = supabase
    .from('audit_logs')
    .select(`
      *,
      user:user_profiles(username, display_name, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  // Filter based on user role
  if (userRole === 'user') {
    // Users only see their own activity
    const { data: { user } } = await supabase.auth.getUser()
    query = query.eq('user_id', user?.id)
  }

  const { data: activities } = await query

  // Mock additional activity data for demonstration
  const mockActivities = [
    {
      id: '1',
      type: 'game_added',
      title: 'New game added',
      description: 'The Legend of Zelda: Tears of the Kingdom',
      user: { display_name: 'John Doe', avatar_url: null },
      icon: Gamepad2,
      iconColor: 'text-green-600',
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    },
    {
      id: '2',
      type: 'game_edited',
      title: 'Game updated',
      description: 'Elden Ring - Added DLC information',
      user: { display_name: 'Jane Smith', avatar_url: null },
      icon: Edit,
      iconColor: 'text-blue-600',
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    },
    {
      id: '3',
      type: 'media_uploaded',
      title: 'Media uploaded',
      description: '5 screenshots added to Baldur\'s Gate 3',
      user: { display_name: 'Mike Johnson', avatar_url: null },
      icon: Image,
      iconColor: 'text-purple-600',
      timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    },
    {
      id: '4',
      type: 'moderation_approved',
      title: 'Change approved',
      description: 'Edit to Cyberpunk 2077 was approved',
      user: { display_name: 'Admin User', avatar_url: null },
      icon: Shield,
      iconColor: 'text-green-600',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: '5',
      type: 'company_added',
      title: 'Company added',
      description: 'FromSoftware added to database',
      user: { display_name: 'Sarah Wilson', avatar_url: null },
      icon: Building2,
      iconColor: 'text-orange-600',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    },
    {
      id: '6',
      type: 'user_joined',
      title: 'New user registered',
      description: 'alex_gamer joined the platform',
      user: { display_name: 'System', avatar_url: null },
      icon: UserPlus,
      iconColor: 'text-indigo-600',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    },
    {
      id: '7',
      type: 'notification',
      title: 'System notification',
      description: 'Database backup completed successfully',
      user: { display_name: 'System', avatar_url: null },
      icon: Bell,
      iconColor: 'text-gray-600',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    },
    {
      id: '8',
      type: 'game_added',
      title: 'New game added',
      description: 'Starfield added with complete information',
      user: { display_name: 'Tom Anderson', avatar_url: null },
      icon: Gamepad2,
      iconColor: 'text-green-600',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    }
  ]

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'game_added':
        return <Badge variant="default" className="text-xs">New</Badge>
      case 'game_edited':
        return <Badge variant="secondary" className="text-xs">Edit</Badge>
      case 'moderation_approved':
        return <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Approved</Badge>
      case 'user_joined':
        return <Badge variant="outline" className="text-xs">User</Badge>
      default:
        return null
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest changes and updates in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {mockActivities.map((activity) => {
              const Icon = activity.icon
              return (
                <div key={activity.id} className="flex gap-3">
                  {/* Icon */}
                  <div className={`mt-1 rounded-full p-2 ${activity.iconColor} bg-muted`}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{activity.title}</p>
                      {getActivityBadge(activity.type)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={activity.user.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {getInitials(activity.user.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{activity.user.display_name}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(activity.timestamp, { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
