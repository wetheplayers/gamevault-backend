import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    // Create profile if it doesn't exist
    await supabase
      .from('user_profiles')
      .insert({
        id: user.id,
        username: user.email?.split('@')[0] || 'user',
        display_name: user.user_metadata?.display_name || user.email?.split('@')[0],
        role: 'user'
      })
  }

  // Let the shadcn dashboard-01 page render its own sidebar and header
  return children
}
