'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  CalendarDays,
  LayoutDashboard,
  MessageSquare,
  User,
  LogOut,
  Umbrella,
  BanIcon,
  Bell,
} from 'lucide-react'
import { signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'

const navGroups = [
  {
    label: 'Übersicht',
    items: [
      { href: '/dashboard', label: 'Meine Übersicht', icon: LayoutDashboard, exact: true },
      { href: '/calendar', label: 'Mein Kalender', icon: CalendarDays },
    ],
  },
  {
    label: 'Meine Anträge',
    items: [
      { href: '/requests', label: 'Wünsche & Anträge', icon: MessageSquare },
      { href: '/leave', label: 'Mein Urlaub', icon: Umbrella },
      { href: '/unavailability', label: 'Sperrtage', icon: BanIcon },
    ],
  },
  {
    label: 'Einstellungen',
    items: [
      { href: '/notifications', label: 'Benachrichtigungen', icon: Bell },
      { href: '/profile', label: 'Mein Profil', icon: User },
    ],
  },
]

export function EmployeeSidebar() {
  const pathname = usePathname()

  function isActive(href: string, exact = false): boolean {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-60 bg-white border-r border-slate-200 flex flex-col">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <CalendarDays className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-slate-900 text-sm">Dienstplan</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon, exact }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive(href, exact)
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-100">
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            className="w-full justify-start text-slate-500 hover:text-slate-900 px-3 py-2.5 h-auto text-sm"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Abmelden
          </Button>
        </form>
      </div>
    </aside>
  )
}
