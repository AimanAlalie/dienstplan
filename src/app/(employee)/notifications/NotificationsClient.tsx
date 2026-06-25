'use client'

import { useState } from 'react'
import { Notification, EmployeeSettings } from '@/types/database'
import { markNotificationRead, markAllNotificationsRead } from '@/lib/actions/notifications'
import { upsertEmployeeSettings } from '@/lib/actions/employee-settings'
import { NOTIFICATION_TYPE_LABELS } from '@/lib/constants/labels'
import { formatDateTime } from '@/lib/utils/date'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Bell, BellOff, Check, CheckCheck, CalendarDays, MessageSquare, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  initialNotifications: Notification[]
  initialSettings: EmployeeSettings | null
}

const typeIcons: Record<string, React.FC<{ className?: string }>> = {
  shift_reminder: CalendarDays,
  request_status: MessageSquare,
  plan_published: CalendarDays,
  conflict_warning: AlertTriangle,
  general: Bell,
}

export function NotificationsClient({ initialNotifications, initialSettings }: Props) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [settings, setSettings] = useState<EmployeeSettings | null>(initialSettings)
  const [savingSettings, setSavingSettings] = useState(false)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const handleMarkRead = async (id: string) => {
    const result = await markNotificationRead(id)
    if (!result.success) return
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
  }

  const handleMarkAllRead = async () => {
    const result = await markAllNotificationsRead()
    if (!result.success) { toast.error(result.error); return }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    toast.success('Alle als gelesen markiert')
  }

  const handleSettingChange = async (
    key: keyof Pick<EmployeeSettings, 'notify_shift_reminder' | 'notify_request_status' | 'notify_plan_published' | 'notify_via_email'>,
    value: boolean
  ) => {
    const current = settings ?? {
      notify_shift_reminder: true,
      notify_request_status: true,
      notify_plan_published: true,
      notify_via_email: false,
    }
    const updated = { ...current, [key]: value }
    setSavingSettings(true)
    const result = await upsertEmployeeSettings(updated)
    setSavingSettings(false)
    if (!result.success) { toast.error(result.error); return }
    if (result.data) setSettings(result.data)
    toast.success('Einstellungen gespeichert')
  }

  return (
    <div className="space-y-6">
      {/* Einstellungen */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-500" />
            Benachrichtigungseinstellungen
            {savingSettings && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            {
              key: 'notify_shift_reminder' as const,
              label: 'Dienst-Erinnerung',
              description: 'Benachrichtigung am Tag vor einem Dienst',
            },
            {
              key: 'notify_request_status' as const,
              label: 'Antrag-Status',
              description: 'Wenn ein Antrag genehmigt, geändert oder abgelehnt wird',
            },
            {
              key: 'notify_plan_published' as const,
              label: 'Plan veröffentlicht',
              description: 'Wenn ein neuer Dienstplan veröffentlicht wird',
            },
            {
              key: 'notify_via_email' as const,
              label: 'E-Mail-Benachrichtigungen',
              description: 'Benachrichtigungen zusätzlich per E-Mail erhalten',
            },
          ].map(({ key, label, description }) => (
            <div key={key} className="flex items-start justify-between gap-4 py-1">
              <div>
                <p className="text-sm font-medium text-slate-900">{label}</p>
                <p className="text-xs text-slate-500">{description}</p>
              </div>
              <button
                onClick={() => handleSettingChange(key, !(settings?.[key] ?? true))}
                className={cn(
                  'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none',
                  (settings?.[key] ?? true) ? 'bg-indigo-600' : 'bg-slate-200'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                    (settings?.[key] ?? true) ? 'translate-x-4' : 'translate-x-0'
                  )}
                />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Benachrichtigungs-Liste */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Mitteilungen
            {unreadCount > 0 && (
              <span className="ml-2 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </h2>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs gap-1.5">
              <CheckCheck className="w-3.5 h-3.5" />
              Alle lesen
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <BellOff className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Keine Benachrichtigungen</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const Icon = typeIcons[n.type] ?? Bell
              return (
                <div
                  key={n.id}
                  className={cn(
                    'flex items-start gap-3 p-3.5 rounded-xl border transition-colors',
                    n.is_read
                      ? 'bg-white border-slate-200'
                      : 'bg-indigo-50 border-indigo-200'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    n.is_read ? 'bg-slate-100' : 'bg-indigo-100'
                  )}>
                    <Icon className={cn('w-4 h-4', n.is_read ? 'text-slate-400' : 'text-indigo-600')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-semibold', n.is_read ? 'text-slate-700' : 'text-slate-900')}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.body}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(n.created_at)}</p>
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 hover:bg-indigo-200 flex items-center justify-center transition-colors"
                      title="Als gelesen markieren"
                    >
                      <Check className="w-3 h-3 text-indigo-600" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
