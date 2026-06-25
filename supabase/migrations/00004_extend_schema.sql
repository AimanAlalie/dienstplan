-- ============================================================
-- 00004_extend_schema.sql
-- Erweiterungen: employee_settings, request_deadlines,
--                admin_events, notifications, shifts.category
-- ============================================================

-- ---- shifts: fachliche Kategorie ----------------------------

ALTER TABLE public.shifts
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'normal'
  CHECK (category IN ('normal', 'standby', 'vacation', 'sick', 'other'));

CREATE INDEX IF NOT EXISTS idx_shifts_category ON public.shifts(category);

-- ---- Tabelle: employee_settings ----------------------------
-- Benachrichtigungseinstellungen pro Mitarbeiter

CREATE TABLE IF NOT EXISTS public.employee_settings (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id               UUID NOT NULL UNIQUE REFERENCES public.employees(id) ON DELETE CASCADE,
  notify_shift_reminder     BOOLEAN NOT NULL DEFAULT true,
  notify_request_status     BOOLEAN NOT NULL DEFAULT true,
  notify_plan_published     BOOLEAN NOT NULL DEFAULT true,
  notify_via_email          BOOLEAN NOT NULL DEFAULT false,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_settings_employee_id ON public.employee_settings(employee_id);

CREATE TRIGGER trg_employee_settings_updated_at
  BEFORE UPDATE ON public.employee_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- Tabelle: request_deadlines ----------------------------
-- Wunschfrist pro Planungsmonat (Admin legt fest, bis wann
-- Mitarbeiter Wünsche einreichen dürfen)

CREATE TABLE IF NOT EXISTS public.request_deadlines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year          SMALLINT NOT NULL CHECK (year >= 2020 AND year <= 2100),
  month         SMALLINT NOT NULL CHECK (month >= 1 AND month <= 12),
  deadline_at   TIMESTAMPTZ NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    UUID REFERENCES public.profiles(id),
  UNIQUE (year, month)
);

CREATE INDEX IF NOT EXISTS idx_request_deadlines_year_month ON public.request_deadlines(year, month);

CREATE TRIGGER trg_request_deadlines_updated_at
  BEFORE UPDATE ON public.request_deadlines
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- Tabelle: admin_events ---------------------------------
-- Admin-interne Termine (getrennt von Diensten / shifts)

CREATE TABLE IF NOT EXISTS public.admin_events (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                     TEXT NOT NULL,
  event_date                DATE NOT NULL,
  end_date                  DATE,
  start_time                TIME,
  end_time                  TIME,
  event_type                TEXT NOT NULL DEFAULT 'internal'
                            CHECK (event_type IN ('internal', 'meeting', 'training', 'absence', 'other')),
  description               TEXT,
  is_visible_to_employees   BOOLEAN NOT NULL DEFAULT false,
  monthly_plan_id           UUID REFERENCES public.monthly_plans(id) ON DELETE SET NULL,
  color                     TEXT NOT NULL DEFAULT '#64748b',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by                UUID REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_admin_events_event_date ON public.admin_events(event_date);
CREATE INDEX IF NOT EXISTS idx_admin_events_monthly_plan_id ON public.admin_events(monthly_plan_id);

CREATE TRIGGER trg_admin_events_updated_at
  BEFORE UPDATE ON public.admin_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- Tabelle: notifications --------------------------------
-- In-App Benachrichtigungen für Mitarbeiter

CREATE TABLE IF NOT EXISTS public.notifications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id           UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  type                  TEXT NOT NULL
                        CHECK (type IN (
                          'shift_reminder',
                          'request_status',
                          'plan_published',
                          'conflict_warning',
                          'general'
                        )),
  title                 TEXT NOT NULL,
  body                  TEXT NOT NULL,
  is_read               BOOLEAN NOT NULL DEFAULT false,
  related_entity_type   TEXT,
  related_entity_id     UUID,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_employee_id ON public.notifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read     ON public.notifications(employee_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at  ON public.notifications(created_at DESC);

-- ---- Hilfsfunktion: anonyme Urlaubskonflikt-Prüfung --------
-- Prüft ob für einen Zeitraum bereits ein anderer (fremder)
-- Urlaubsantrag vorliegt – gibt NUR einen Boolean zurück,
-- NICHT den Namen oder die ID des anderen Mitarbeiters.

CREATE OR REPLACE FUNCTION public.has_conflicting_vacation_request(
  p_employee_id UUID,
  p_start_date  DATE,
  p_end_date    DATE
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shift_requests sr
    WHERE sr.employee_id != p_employee_id
      AND sr.request_type = 'vacation'
      AND sr.status NOT IN ('rejected')
      AND sr.request_date <= p_end_date
      AND COALESCE(sr.end_date, sr.request_date) >= p_start_date
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---- Hilfsfunktion: Benachrichtigung erstellen (Service) ---
-- Wird über Service-Role (Server Actions) aufgerufen

CREATE OR REPLACE FUNCTION public.create_notification(
  p_employee_id         UUID,
  p_type                TEXT,
  p_title               TEXT,
  p_body                TEXT,
  p_related_entity_type TEXT DEFAULT NULL,
  p_related_entity_id   UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.notifications (
    employee_id, type, title, body,
    related_entity_type, related_entity_id
  ) VALUES (
    p_employee_id, p_type, p_title, p_body,
    p_related_entity_type, p_related_entity_id
  ) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
