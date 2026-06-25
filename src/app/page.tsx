import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export default async function RootPage() {
  // Demo-Modus: ohne Supabase direkt zum Admin-Bereich
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    redirect('/admin/dashboard')
  }

  const supabase = await getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') {
    redirect('/admin/dashboard')
  }

  redirect('/dashboard')
}
