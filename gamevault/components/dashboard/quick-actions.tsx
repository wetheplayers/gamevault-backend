'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Plus,
  Upload,
  FileText,
  Search,
  Download,
  Settings,
  Users,
  Shield,
  BarChart3
} from 'lucide-react'

interface QuickActionsProps {
  userRole?: string
}

export function QuickActions({ userRole }: QuickActionsProps) {
  const router = useRouter()

  const actions = [
    {
      title: 'Add New Game',
      description: 'Create a new game entry',
      icon: Plus,
      onClick: () => router.push('/dashboard/games/new'),
      variant: 'default' as const,
      roles: ['admin', 'moderator', 'superadmin']
    },
    {
      title: 'Import Data',
      description: 'Import from external sources',
      icon: Upload,
      onClick: () => router.push('/dashboard/import'),
      variant: 'outline' as const,
      roles: ['admin', 'superadmin']
    },
    {
      title: 'Generate Report',
      description: 'Create custom reports',
      icon: FileText,
      onClick: () => router.push('/dashboard/reports/generate'),
      variant: 'outline' as const,
      roles: ['admin', 'superadmin']
    },
    {
      title: 'Search Database',
      description: 'Advanced search options',
      icon: Search,
      onClick: () => router.push('/dashboard/search'),
      variant: 'outline' as const,
      roles: ['user', 'moderator', 'admin', 'superadmin']
    },
    {
      title: 'Export Data',
      description: 'Export database content',
      icon: Download,
      onClick: () => router.push('/dashboard/export'),
      variant: 'outline' as const,
      roles: ['admin', 'superadmin']
    },
    {
      title: 'Moderation Queue',
      description: 'Review pending items',
      icon: Shield,
      onClick: () => router.push('/dashboard/moderation'),
      variant: 'outline' as const,
      roles: ['moderator', 'admin', 'superadmin']
    },
    {
      title: 'User Management',
      description: 'Manage system users',
      icon: Users,
      onClick: () => router.push('/dashboard/users'),
      variant: 'outline' as const,
      roles: ['admin', 'superadmin']
    },
    {
      title: 'View Analytics',
      description: 'System analytics dashboard',
      icon: BarChart3,
      onClick: () => router.push('/dashboard/reports'),
      variant: 'outline' as const,
      roles: ['admin', 'superadmin']
    },
    {
      title: 'System Settings',
      description: 'Configure system options',
      icon: Settings,
      onClick: () => router.push('/dashboard/settings'),
      variant: 'outline' as const,
      roles: ['superadmin']
    }
  ]

  const hasAccess = (roles?: string[]) => {
    if (!roles) return true
    if (!userRole) return roles.includes('user')
    if (userRole === 'superadmin') return true
    return roles.includes(userRole)
  }

  const visibleActions = actions.filter((action) => hasAccess(action.roles))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Common tasks and shortcuts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {visibleActions.slice(0, 6).map((action) => {
            const Icon = action.icon
            return (
              <Button
                key={action.title}
                variant={action.variant}
                className="justify-start"
                onClick={action.onClick}
              >
                <Icon className="mr-2 h-4 w-4" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">{action.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {action.description}
                  </span>
                </div>
              </Button>
            )
          })}
        </div>

        {/* Additional Information */}
        <div className="mt-6 rounded-lg bg-muted p-4">
          <h4 className="text-sm font-medium mb-2">Tips & Shortcuts</h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Press <kbd className="px-1 py-0.5 rounded bg-background">Ctrl</kbd> + <kbd className="px-1 py-0.5 rounded bg-background">K</kbd> to open command palette</li>
            <li>• Press <kbd className="px-1 py-0.5 rounded bg-background">Ctrl</kbd> + <kbd className="px-1 py-0.5 rounded bg-background">/</kbd> for quick search</li>
            <li>• Use <kbd className="px-1 py-0.5 rounded bg-background">J</kbd>/<kbd className="px-1 py-0.5 rounded bg-background">K</kbd> to navigate lists</li>
            <li>• Press <kbd className="px-1 py-0.5 rounded bg-background">Escape</kbd> to close dialogs</li>
          </ul>
        </div>

        {/* Role-specific information */}
        {userRole && (
          <div className="mt-4 text-xs text-muted-foreground">
            <p>
              Logged in as <span className="font-medium">{userRole}</span>
            </p>
            <p className="mt-1">
              {userRole === 'superadmin' && 'You have full system access'}
              {userRole === 'admin' && 'You can manage content and users'}
              {userRole === 'moderator' && 'You can review and edit content'}
              {userRole === 'user' && 'You can view content and submit changes'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
