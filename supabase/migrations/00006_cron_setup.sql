-- ============================================================
-- 00006_cron_setup.sql
-- Tägliche Dienst-Erinnerungen: DB-Funktion + pg_cron Schedule
-- ============================================================

-- ---- pg_cron & pg_net aktivieren ----------------------------
-- pg_cron: Cronjobs direkt in PostgreSQL
-- pg_net: HTTP-Requests aus PostgreSQL (optional, für Edge Function)

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net  WITH SCHEMA extensions;

GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL  ON ALL TABLES IN SCHEMA cron TO postgres;

-- ---- Funktion: tägliche Dienst-Erinnerungen ----------------
-- Sendet in-app Benachrichtigungen für Dienste des nächsten Tages.
-- Läuft täglich per pg_cron, respektiert employee_settings.notify_shift_reminder.
-- Gibt JSON zurück: { sent, skipped, date }

CREATE OR REPLACE FUNCTION public.send_daily_shift_reminders()
RETURNS JSON AS $$
DECLARE
  v_tomorrow      DATE;
  v_tomorrow_str  TEXT;
  v_shift         RECORD;
  v_should_notify BOOLEAN;
  v_start_berlin  TEXT;
  v_end_berlin    TEXT;
  v_category_label TEXT;
  v_title         TEXT;
  v_body          TEXT;
  v_sent          INTEGER := 0;
  v_skipped       INTEGER := 0;
BEGIN
  -- Morgen in Europe/Berlin Zeitzone
  v_tomorrow     := (now() AT TIME ZONE 'Europe/Berlin')::DATE + 1;
  v_tomorrow_str := TO_CHAR(v_tomorrow, 'DD.MM.YYYY');

  FOR v_shift IN
    SELECT
      s.id            AS shift_id,
      s.employee_id,
      s.start_time,
      s.end_time,
      s.category,
      e.first_name,
      e.last_name
    FROM   public.shifts s
    JOIN   public.employees     e  ON e.id  = s.employee_id
    JOIN   public.monthly_plans mp ON mp.id = s.monthly_plan_id
    WHERE  s.shift_date = v_tomorrow
      AND  mp.status    = 'published'
      AND  s.category  IN ('normal', 'standby')
      AND  s.status    != 'cancelled'
    ORDER BY s.employee_id, s.start_time
  LOOP
    -- Einstellung lesen – Standard: Erinnerung EIN wenn kein Eintrag vorhanden
    SELECT COALESCE(es.notify_shift_reminder, true)
    INTO   v_should_notify
    FROM   public.employee_settings es
    WHERE  es.employee_id = v_shift.employee_id;

    IF v_should_notify IS NULL THEN
      v_should_notify := true;
    END IF;

    IF NOT v_should_notify THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    -- Zeiten in Europe/Berlin konvertieren
    v_start_berlin := TO_CHAR(v_shift.start_time AT TIME ZONE 'Europe/Berlin', 'HH24:MI');
    v_end_berlin   := TO_CHAR(v_shift.end_time   AT TIME ZONE 'Europe/Berlin', 'HH24:MI');

    -- Dienstkategorie
    v_category_label := CASE v_shift.category
      WHEN 'standby' THEN 'Bereitschaft'
      ELSE 'Dienst'
    END;

    v_title := 'Morgen hast du ' || v_category_label;
    v_body  := v_category_label || ' am ' || v_tomorrow_str
               || ', ' || v_start_berlin || '–' || v_end_berlin || ' Uhr';

    PERFORM public.create_notification(
      p_employee_id         := v_shift.employee_id,
      p_type                := 'shift_reminder',
      p_title               := v_title,
      p_body                := v_body,
      p_related_entity_type := 'shift',
      p_related_entity_id   := v_shift.shift_id
    );

    v_sent := v_sent + 1;
  END LOOP;

  RETURN json_build_object(
    'sent',    v_sent,
    'skipped', v_skipped,
    'date',    v_tomorrow
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Kommentar
COMMENT ON FUNCTION public.send_daily_shift_reminders() IS
  'Sendet tägliche Dienst-Erinnerungen für den nächsten Tag. Wird per pg_cron um 17:00 UTC aufgerufen.';

-- ---- pg_cron Schedule: täglich 17:00 UTC -------------------
-- 17:00 UTC = 18:00 MEZ (Winter) / 19:00 MESZ (Sommer)
-- Mitarbeiter erhalten die Erinnerung am Abend für den nächsten Morgen.
--
-- Option A (Standard): DB-Funktion direkt aufrufen — kein HTTP nötig.

SELECT cron.schedule(
  'daily-shift-reminder',          -- Name des Jobs
  '0 17 * * *',                    -- täglich 17:00 UTC
  $$ SELECT public.send_daily_shift_reminders() $$
);

-- ---- Cron-Job verwalten (Referenz) --------------------------
--
-- Job prüfen:   SELECT * FROM cron.job;
-- Job löschen:  SELECT cron.unschedule('daily-shift-reminder');
-- Manuell:      SELECT public.send_daily_shift_reminders();
-- Logs:         SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
--
-- Option B (alternativ): Edge Function per pg_net aufrufen.
-- Erfordert SUPABASE_URL und SERVICE_ROLE_KEY als DB-Settings.
-- Nur aktivieren wenn pg_cron → Edge Function statt DB-Funktion gewünscht.
--
-- SELECT cron.unschedule('daily-shift-reminder');
-- SELECT cron.schedule(
--   'daily-shift-reminder',
--   '0 17 * * *',
--   $cron$
--   SELECT net.http_post(
--     url     := current_setting('app.supabase_url') || '/functions/v1/daily-shift-reminder',
--     headers := jsonb_build_object(
--       'Content-Type',  'application/json',
--       'Authorization', 'Bearer ' || current_setting('app.service_role_key')
--     ),
--     body    := '{}'::jsonb
--   )
--   $cron$
-- );
