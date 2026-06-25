'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  MessageSquare,
  Settings,
  LogOut,
  AlertTriangle,
  Umbrella,
  CalendarClock,
  Clock,
} from 'lucide-react'
import { signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'

const navGroups = [
  {
    label: 'Planung',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/admin/planning', label: 'Monatsplanung', icon: CalendarDays },
      { href: '/admin/conflicts', label: 'Konflikte', icon: AlertTriangle },
    ],
  },
  {
    label: 'Mitarbeiter',
    items: [
      { href: '/admin/requests', label: 'Wünsche & Anträge', icon: MessageSquare },
      { href: '/admin/leaves', label: 'Urlaubsübersicht', icon: Umbrella },
      { href: '/admin/employees', label: 'Mitarbeiterverwaltung', icon: Users },
    ],
  },
  {
    label: 'Administration',
    items: [
      { href: '/admin/events', label: 'Admin-Termine', icon: CalendarClock },
      { href: '/admin/settings', label: 'Einstellungen & Fristen', icon: Settings },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()

  function isActive(href: string, exact = false): boolean {
    if (exact) return pathname === href
    if (href === '/admin/planning') return pathname.startsWith('/admin/planning')
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700/50">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <CalendarDays className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-semibold text-white text-sm">Dienstplan</span>
          <p className="text-xs text-slate-400">Administration</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon, exact }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                    isActive(href, exact)
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-700/50">
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 px-3 py-2.5 h-auto text-sm"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Abmelden
          </Button>
        </form>
      </div>
    </aside>
  )
}
