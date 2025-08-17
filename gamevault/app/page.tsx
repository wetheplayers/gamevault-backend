import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Gamepad2, Shield, Database, Users, BarChart3, Zap } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-6 w-6" />
            <span className="text-xl font-bold">GameVault</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          Professional Video Game
          <span className="text-primary"> Database Management</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          The comprehensive platform for managing, tracking, and analyzing video game data. 
          Built for researchers, archivists, and gaming industry professionals.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/sign-up">
            <Button size="lg" className="gap-2">
              <Gamepad2 className="h-5 w-5" />
              Start Free Trial
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button size="lg" variant="outline">
              Sign In to Dashboard
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything You Need to Manage Game Data
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Database className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Comprehensive Database</CardTitle>
              <CardDescription>
                Track games, editions, releases, companies, and people with detailed metadata
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Role-Based Access</CardTitle>
              <CardDescription>
                Four-tier permission system with granular control for teams of any size
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Analytics & Reports</CardTitle>
              <CardDescription>
                Generate insights with powerful analytics and customizable reports
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Moderation Workflow</CardTitle>
              <CardDescription>
                Built-in review system for maintaining data quality and accuracy
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Real-time Updates</CardTitle>
              <CardDescription>
                Live synchronization keeps your team on the same page instantly
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Gamepad2 className="h-10 w-10 text-primary mb-2" />
              <CardTitle>External Integrations</CardTitle>
              <CardDescription>
                Import data from Steam, IGDB, and other gaming platforms
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-secondary/30 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold">50,000+</p>
              <p className="text-muted-foreground">Games Tracked</p>
            </div>
            <div>
              <p className="text-4xl font-bold">100+</p>
              <p className="text-muted-foreground">Platforms</p>
            </div>
            <div>
              <p className="text-4xl font-bold">10,000+</p>
              <p className="text-muted-foreground">Companies</p>
            </div>
            <div>
              <p className="text-4xl font-bold">99.9%</p>
              <p className="text-muted-foreground">Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
            <CardDescription className="text-lg">
              Join professionals managing the world&apos;s most comprehensive game database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/sign-up">
              <Button size="lg" className="w-full sm:w-auto">
                Create Your Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 GameVault. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-4">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:underline">Terms of Service</Link>
            <Link href="/docs" className="hover:underline">Documentation</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}