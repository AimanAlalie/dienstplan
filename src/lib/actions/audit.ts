'use server'

import { getSupabaseAdminClient } from '@/lib/supabase/admin'

interface AuditEntry {
  actorId: string | null
  action: string
  entityType: string
  entityId?: string | null
  oldData?: Record<string, unknown> | null
  newData?: Record<string, unknown> | null
}

export async function insertAuditLog(entry: AuditEntry) {
  const supabase = getSupabaseAdminClient()
  await supabase.from('audit_logs').insert({
    actor_id: entry.actorId,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    old_data: entry.oldData ?? null,
    new_data: entry.newData ?? null,
  })
}
