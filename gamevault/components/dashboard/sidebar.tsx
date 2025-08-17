'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Gamepad2,
  Image,
  Building2,
  Users,
  Tags,
  Shield,
  // FileText,
  BarChart3,
  Settings,
  ChevronDown,
  Plus,
  Upload,
  // FileInput
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useState } from 'react'

interface SidebarProps {
  userRole?: string
}

export function Sidebar({ userRole = 'user' }: SidebarProps) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<string[]>(['main'])

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const navigation = [
    {
      section: 'main',
      title: 'Main',
      items: [
        {
          name: 'Dashboard',
          href: '/dashboard',
          icon: LayoutDashboard,
          children: [
            { name: 'Overview', href: '/dashboard' },
            { name: 'Personal', href: '/dashboard/personal' }
          ]
        },
        {
          name: 'Games',
          href: '/dashboard/games',
          icon: Gamepad2,
          children: [
            { name: 'Browse Games', href: '/dashboard/games' },
            { name: 'Add New Game', href: '/dashboard/games/new', roles: ['admin', 'moderator'] },
            { name: 'Import Games', href: '/dashboard/games/import', roles: ['admin'] }
          ]
        },
        {
          name: 'Media',
          href: '/dashboard/media',
          icon: Image,
          children: [
            { name: 'Gallery', href: '/dashboard/media' },
            { name: 'Upload Media', href: '/dashboard/media/upload', roles: ['admin', 'moderator'] }
          ]
        },
        {
          name: 'Companies & People',
          href: '/dashboard/companies',
          icon: Building2,
          children: [
            { name: 'Companies', href: '/dashboard/companies' },
            { name: 'People', href: '/dashboard/people' },
            { name: 'Credits', href: '/dashboard/credits', roles: ['admin', 'moderator'] }
          ]
        }
      ]
    },
    {
      section: 'admin',
      title: 'Administration',
      roles: ['admin', 'superadmin'],
      items: [
        {
          name: 'Lookups',
          href: '/dashboard/lookups',
          icon: Tags,
          roles: ['admin', 'superadmin'],
          children: [
            { name: 'Platforms', href: '/dashboard/lookups/platforms' },
            { name: 'Genres', href: '/dashboard/lookups/genres' },
            { name: 'Themes', href: '/dashboard/lookups/themes' },
            { name: 'Other Lookups', href: '/dashboard/lookups' }
          ]
        },
        {
          name: 'Moderation',
          href: '/dashboard/moderation',
          icon: Shield,
          roles: ['moderator', 'admin', 'superadmin'],
          children: [
            { name: 'Queue', href: '/dashboard/moderation' },
            { name: 'Change Requests', href: '/dashboard/moderation/changes' },
            { name: 'Reports', href: '/dashboard/moderation/reports' }
          ]
        },
        {
          name: 'Users',
          href: '/dashboard/users',
          icon: Users,
          roles: ['admin', 'superadmin'],
          children: [
            { name: 'All Users', href: '/dashboard/users' },
            { name: 'Roles & Permissions', href: '/dashboard/users/roles' }
          ]
        },
        {
          name: 'Reports',
          href: '/dashboard/reports',
          icon: BarChart3,
          roles: ['admin', 'superadmin'],
          children: [
            { name: 'Analytics', href: '/dashboard/reports' },
            { name: 'Audit Log', href: '/dashboard/reports/audit' }
          ]
        },
        {
          name: 'Settings',
          href: '/dashboard/settings',
          icon: Settings,
          roles: ['admin', 'superadmin'],
          children: [
            { name: 'System', href: '/dashboard/settings/system' },
            { name: 'Integrations', href: '/dashboard/settings/integrations' },
            { name: 'Email Templates', href: '/dashboard/settings/emails' }
          ]
        }
      ]
    }
  ]

  const hasAccess = (roles?: string[]) => {
    if (!roles) return true
    if (userRole === 'superadmin') return true
    return roles.includes(userRole)
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Gamepad2 className="h-6 w-6" />
          <span className="text-lg font-semibold">GameVault</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {navigation.map((section) => {
            if (!hasAccess(section.roles)) return null

            return (
              <div key={section.section}>
                {section.title && (
                  <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.title}
                  </h2>
                )}
                <div className="space-y-1">
                  {section.items.map((item: {
                    name: string
                    href: string
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    icon: any
                    children?: { name: string; href: string; roles?: string[] }[]
                    roles?: string[]
                  }) => {
                    if (!hasAccess((item as { roles?: string[] }).roles)) return null

                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    const isExpanded = expandedSections.includes(item.name)
                    const Icon = item.icon

                    return (
                      <div key={item.name}>
                        <Button
                          variant={isActive ? 'secondary' : 'ghost'}
                          className={cn(
                            'w-full justify-start',
                            isActive && 'bg-secondary'
                          )}
                          onClick={() => item.children ? toggleSection(item.name) : null}
                          asChild={!item.children}
                        >
                          {item.children ? (
                            <div className="flex w-full items-center">
                              <Icon className="mr-2 h-4 w-4" />
                              <span className="flex-1 text-left">{item.name}</span>
                              <ChevronDown
                                className={cn(
                                  'h-4 w-4 transition-transform',
                                  isExpanded && 'rotate-180'
                                )}
                              />
                            </div>
                          ) : (
                            <Link href={item.href}>
                              <Icon className="mr-2 h-4 w-4" />
                              {item.name}
                            </Link>
                          )}
                        </Button>

                        {/* Children items */}
                        {item.children && isExpanded && (
                          <div className="ml-6 mt-1 space-y-1">
                            {item.children.map((child: { name: string; href: string; roles?: string[] }) => {
                              if (!hasAccess(child.roles)) return null

                              const isChildActive = pathname === child.href

                              return (
                                <Button
                                  key={child.name}
                                  variant={isChildActive ? 'secondary' : 'ghost'}
                                  size="sm"
                                  className={cn(
                                    'w-full justify-start pl-6',
                                    isChildActive && 'bg-secondary'
                                  )}
                                  asChild
                                >
                                  <Link href={child.href}>
                                    {child.name}
                                  </Link>
                                </Button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Quick Actions (bottom) */}
      <div className="border-t p-4 space-y-2">
        <Button className="w-full" size="sm" asChild>
          <Link href="/dashboard/games/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Game
          </Link>
        </Button>
        {hasAccess(['admin', 'moderator']) && (
          <Button variant="outline" className="w-full" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Import Data
          </Button>
        )}
      </div>
    </div>
  )
}
