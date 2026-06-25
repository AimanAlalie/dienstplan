# Edge Function: daily-shift-reminder

Sendet täglich in-app Benachrichtigungen für Mitarbeiter, die am nächsten Tag einen Dienst oder eine Bereitschaft haben.

## Aufruf

```
POST https://<project-ref>.supabase.co/functions/v1/daily-shift-reminder
Authorization: Bearer <SERVICE_ROLE_KEY>
```

## Zeitplan

Der Cron-Job läuft täglich um **17:00 UTC** (= 18:00 MEZ / 19:00 MESZ) über `pg_cron`.

Die DB-Funktion `public.send_daily_shift_reminders()` wird dabei direkt aus der Datenbank heraus aufgerufen — kein HTTP-Request nötig.

Diese Edge Function dient als zusätzlicher HTTP-Einstiegspunkt für:
- Manuelle Ausführung (z. B. beim Testen)
- Externe Cron-Dienste (GitHub Actions, Vercel Cron, etc.)

## Einrichtung

### 1. Migration ausführen

```bash
supabase db push
```

Dies führt `00006_cron_setup.sql` aus und:
- aktiviert die `pg_cron`-Extension
- erstellt `public.send_daily_shift_reminders()`
- legt den täglichen Cron-Job an

### 2. Edge Function deployen (optional)

```bash
supabase functions deploy daily-shift-reminder --no-verify-jwt
```

> **Hinweis:** `--no-verify-jwt` ist hier korrekt, da die Funktion den
> Service-Role-Key im Authorization-Header selbst prüft.

### 3. Cron-Job prüfen

Im Supabase Dashboard unter **Database → Extensions → pg_cron**:

```sql
SELECT * FROM cron.job;
```

Manueller Test:
```sql
SELECT public.send_daily_shift_reminders();
```

## Benachrichtigungseinstellungen

Mitarbeiter können die Erinnerung unter **Einstellungen → Benachrichtigungen** deaktivieren.

Der Default ist **aktiv** — auch ohne Eintrag in `employee_settings` werden Erinnerungen gesendet.

## Beispiel-Rückgabe

```json
{ "sent": 3, "skipped": 1, "date": "2026-04-12" }
```
