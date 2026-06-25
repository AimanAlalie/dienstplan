import { getSupabaseServerClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { NotificationBell } from './NotificationBell'
import { getMyUnreadCount } from '@/lib/actions/notifications'

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export async function TopBar({ title, subtitle, actions }: TopBarProps) {
  const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL

  let fullName: string | null = null
  let role: string | null = null
  let initials = '?'
  let unreadCount = 0

  if (isDemoMode) {
    fullName = 'Demo Nutzer'
    role = 'admin'
    initials = 'DN'
  } else {
    const supabase = await getSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = user
      ? await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()
      : { data: null }

    fullName = profile?.full_name ?? user?.email ?? null
    role = profile?.role ?? null
    initials = profile?.full_name
      ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
      : user?.email?.[0].toUpperCase() ?? '?'

    // Benachrichtigungen nur für Mitarbeiter
    if (role === 'employee') {
      unreadCount = await getMyUnreadCount().catch(() => 0)
    }
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <h1 className="text-base font-semibold text-slate-900 leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {actions}

        {/* Notification Bell (nur für Mitarbeiter) */}
        {role === 'employee' && (
          <NotificationBell unreadCount={unreadCount} />
        )}

        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-900 leading-tight">{fullName}</p>
            <p className="text-xs text-slate-500">
              {role === 'admin' ? 'Administrator' : 'Mitarbeiter'}
            </p>
          </div>
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
