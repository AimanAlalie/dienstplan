-- ============================================================
--  DIENSTPLAN — Vollständiges Setup-Skript
--  Supabase SQL Editor: alles in einem Durchlauf ausführen
--  Reihenfolge: Extensions → Trigger-Funktion → Tabellen →
--               Hilfsfunktionen → Business-Funktionen →
--               Trigger → RLS → Seed-Daten
-- ============================================================


-- ============================================================
-- 0. EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- 1. TRIGGER-FUNKTION (kein Tabellen-Bezug)
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 2. TABELLEN  (müssen vor den SQL-Funktionen existieren)
-- ============================================================

-- ---- profiles -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'employee'
              CHECK (role IN ('admin', 'employee')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role  ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ---- employees ----------------------------------------------
CREATE TABLE IF NOT EXISTS public.employees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id      UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  employee_number TEXT UNIQUE,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  abbreviation    TEXT NOT NULL,
  color           TEXT NOT NULL DEFAULT '#6366f1',
  position        TEXT,
  department      TEXT,
  employment_type TEXT NOT NULL DEFAULT 'full_time'
                  CHECK (employment_type IN ('full_time','part_time','mini_job','trainee')),
  weekly_hours    NUMERIC(4,2),
  phone           TEXT,
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','inactive','archived')),
  notes           TEXT,
  hired_at        DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by      UUID REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_employees_profile_id   ON public.employees(profile_id);
CREATE INDEX IF NOT EXISTS idx_employees_status       ON public.employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_abbreviation ON public.employees(abbreviation);

-- ---- monthly_plans ------------------------------------------
CREATE TABLE IF NOT EXISTS public.monthly_plans (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year         SMALLINT NOT NULL CHECK (year >= 2020 AND year <= 2100),
  month        SMALLINT NOT NULL CHECK (month >= 1 AND month <= 12),
  status       TEXT NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft','review','published','archived')),
  notes        TEXT,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES public.profiles(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   UUID REFERENCES public.profiles(id),
  UNIQUE (year, month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_plans_status     ON public.monthly_plans(status);
CREATE INDEX IF NOT EXISTS idx_monthly_plans_year_month ON public.monthly_plans(year, month);

-- ---- shift_types --------------------------------------------
CREATE TABLE IF NOT EXISTS public.shift_types (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  abbreviation  TEXT NOT NULL,
  default_start TIME NOT NULL,
  default_end   TIME NOT NULL,
  color         TEXT NOT NULL DEFAULT '#3b82f6',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    UUID REFERENCES public.profiles(id)
);

-- ---- shifts -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.shifts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_plan_id UUID NOT NULL REFERENCES public.monthly_plans(id) ON DELETE CASCADE,
  employee_id     UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  shift_type_id   UUID REFERENCES public.shift_types(id) ON DELETE SET NULL,
  shift_date      DATE NOT NULL,
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ NOT NULL,
  break_minutes   SMALLINT NOT NULL DEFAULT 0,
  category        TEXT NOT NULL DEFAULT 'normal'
                  CHECK (category IN ('normal','standby','vacation','sick','other')),
  location        TEXT,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled','cancelled','completed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by      UUID REFERENCES public.profiles(id),
  updated_by      UUID REFERENCES public.profiles(id),
  CONSTRAINT chk_shifts_break_non_negative CHECK (break_minutes >= 0)
);

CREATE INDEX IF NOT EXISTS idx_shifts_monthly_plan_id ON public.shifts(monthly_plan_id);
CREATE INDEX IF NOT EXISTS idx_shifts_employee_id     ON public.shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_shifts_shift_date      ON public.shifts(shift_date);
CREATE INDEX IF NOT EXISTS idx_shifts_employee_date   ON public.shifts(employee_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_shifts_category        ON public.shifts(category);

-- ---- shift_requests -----------------------------------------
CREATE TABLE IF NOT EXISTS public.shift_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  monthly_plan_id UUID REFERENCES public.monthly_plans(id) ON DELETE SET NULL,
  request_type    TEXT NOT NULL
                  CHECK (request_type IN (
                    'availability','unavailability','vacation','preference','block_shift'
                  )),
  request_date    DATE NOT NULL,
  end_date        DATE,
  start_time      TIME,
  end_time        TIME,
  priority        SMALLINT NOT NULL DEFAULT 1 CHECK (priority IN (1,2,3)),
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','modified','rejected')),
  reviewed_by     UUID REFERENCES public.profiles(id),
  reviewed_at     TIMESTAMPTZ,
  admin_notes     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shift_requests_employee_id     ON public.shift_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_shift_requests_monthly_plan_id ON public.shift_requests(monthly_plan_id);
CREATE INDEX IF NOT EXISTS idx_shift_requests_request_date    ON public.shift_requests(request_date);
CREATE INDEX IF NOT EXISTS idx_shift_requests_status          ON public.shift_requests(status);

-- ---- audit_logs ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id   ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity     ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ---- employee_settings --------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_settings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id           UUID NOT NULL UNIQUE REFERENCES public.employees(id) ON DELETE CASCADE,
  notify_shift_reminder BOOLEAN NOT NULL DEFAULT true,
  notify_request_status BOOLEAN NOT NULL DEFAULT true,
  notify_plan_published BOOLEAN NOT NULL DEFAULT true,
  notify_via_email      BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_settings_employee_id ON public.employee_settings(employee_id);

-- ---- request_deadlines --------------------------------------
CREATE TABLE IF NOT EXISTS public.request_deadlines (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year        SMALLINT NOT NULL CHECK (year >= 2020 AND year <= 2100),
  month       SMALLINT NOT NULL CHECK (month >= 1 AND month <= 12),
  deadline_at TIMESTAMPTZ NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  UUID REFERENCES public.profiles(id),
  UNIQUE (year, month)
);

CREATE INDEX IF NOT EXISTS idx_request_deadlines_year_month ON public.request_deadlines(year, month);

-- ---- admin_events -------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_events (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                   TEXT NOT NULL,
  event_date              DATE NOT NULL,
  end_date                DATE,
  start_time              TIME,
  end_time                TIME,
  event_type              TEXT NOT NULL DEFAULT 'internal'
                          CHECK (event_type IN ('internal','meeting','training','absence','other')),
  description             TEXT,
  is_visible_to_employees BOOLEAN NOT NULL DEFAULT false,
  monthly_plan_id         UUID REFERENCES public.monthly_plans(id) ON DELETE SET NULL,
  color                   TEXT NOT NULL DEFAULT '#64748b',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by              UUID REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_admin_events_event_date      ON public.admin_events(event_date);
CREATE INDEX IF NOT EXISTS idx_admin_events_monthly_plan_id ON public.admin_events(monthly_plan_id);

-- ---- notifications ------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id         UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  type                TEXT NOT NULL
                      CHECK (type IN (
                        'shift_reminder','request_status','plan_published',
                        'conflict_warning','general'
                      )),
  title               TEXT NOT NULL,
  body                TEXT NOT NULL,
  is_read             BOOLEAN NOT NULL DEFAULT false,
  related_entity_type TEXT,
  related_entity_id   UUID,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_employee_id ON public.notifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read     ON public.notifications(employee_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at  ON public.notifications(created_at DESC);


-- ============================================================
-- 3. ALLE TRIGGER (nach Tabellen)
-- ============================================================

DROP TRIGGER IF EXISTS trg_profiles_updated_at         ON public.profiles;
DROP TRIGGER IF EXISTS trg_employees_updated_at        ON public.employees;
DROP TRIGGER IF EXISTS trg_monthly_plans_updated_at    ON public.monthly_plans;
DROP TRIGGER IF EXISTS trg_shift_types_updated_at      ON public.shift_types;
DROP TRIGGER IF EXISTS trg_shifts_updated_at           ON public.shifts;
DROP TRIGGER IF EXISTS trg_shift_requests_updated_at   ON public.shift_requests;
DROP TRIGGER IF EXISTS trg_employee_settings_updated_at ON public.employee_settings;
DROP TRIGGER IF EXISTS trg_request_deadlines_updated_at ON public.request_deadlines;
DROP TRIGGER IF EXISTS trg_admin_events_updated_at     ON public.admin_events;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_monthly_plans_updated_at
  BEFORE UPDATE ON public.monthly_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_shift_types_updated_at
  BEFORE UPDATE ON public.shift_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_shifts_updated_at
  BEFORE UPDATE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_shift_requests_updated_at
  BEFORE UPDATE ON public.shift_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_employee_settings_updated_at
  BEFORE UPDATE ON public.employee_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_request_deadlines_updated_at
  BEFORE UPDATE ON public.request_deadlines
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_admin_events_updated_at
  BEFORE UPDATE ON public.admin_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auth-Trigger: Profil bei Registrierung automatisch anlegen
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 4. RLS-HILFSFUNKTIONEN (nach Tabellen definieren)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_employee_id()
RETURNS UUID AS $$
  SELECT id FROM public.employees WHERE profile_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ============================================================
-- 5. BUSINESS-FUNKTIONEN
-- ============================================================

-- Prüft anonym ob ein anderer Urlaubsantrag im Zeitraum existiert
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

-- Erstellt eine In-App-Benachrichtigung
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

-- Tägliche Dienst-Erinnerungen (per pg_cron aufrufbar)
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
  v_sent          INTEGER := 0;
  v_skipped       INTEGER := 0;
BEGIN
  v_tomorrow     := (now() AT TIME ZONE 'Europe/Berlin')::DATE + 1;
  v_tomorrow_str := TO_CHAR(v_tomorrow, 'DD.MM.YYYY');

  FOR v_shift IN
    SELECT s.id AS shift_id, s.employee_id, s.start_time, s.end_time, s.category
    FROM   public.shifts s
    JOIN   public.monthly_plans mp ON mp.id = s.monthly_plan_id
    WHERE  s.shift_date = v_tomorrow
      AND  mp.status    = 'published'
      AND  s.category  IN ('normal', 'standby')
      AND  s.status    != 'cancelled'
    ORDER BY s.employee_id, s.start_time
  LOOP
    SELECT COALESCE(es.notify_shift_reminder, true)
    INTO   v_should_notify
    FROM   public.employee_settings es
    WHERE  es.employee_id = v_shift.employee_id;

    IF v_should_notify IS NULL THEN v_should_notify := true; END IF;
    IF NOT v_should_notify THEN v_skipped := v_skipped + 1; CONTINUE; END IF;

    v_start_berlin   := TO_CHAR(v_shift.start_time AT TIME ZONE 'Europe/Berlin', 'HH24:MI');
    v_end_berlin     := TO_CHAR(v_shift.end_time   AT TIME ZONE 'Europe/Berlin', 'HH24:MI');
    v_category_label := CASE v_shift.category WHEN 'standby' THEN 'Bereitschaft' ELSE 'Dienst' END;

    PERFORM public.create_notification(
      p_employee_id         := v_shift.employee_id,
      p_type                := 'shift_reminder',
      p_title               := 'Morgen hast du ' || v_category_label,
      p_body                := v_category_label || ' am ' || v_tomorrow_str
                               || ', ' || v_start_berlin || '–' || v_end_berlin || ' Uhr',
      p_related_entity_type := 'shift',
      p_related_entity_id   := v_shift.shift_id
    );
    v_sent := v_sent + 1;
  END LOOP;

  RETURN json_build_object('sent', v_sent, 'skipped', v_skipped, 'date', v_tomorrow);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_plans     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_types       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications     ENABLE ROW LEVEL SECURITY;

-- ---- profiles -----------------------------------------------
DROP POLICY IF EXISTS "profiles: eigenes Profil lesen"         ON public.profiles;
DROP POLICY IF EXISTS "profiles: Admin liest alle"             ON public.profiles;
DROP POLICY IF EXISTS "profiles: Admin aktualisiert alle"      ON public.profiles;
DROP POLICY IF EXISTS "profiles: eigenes Profil aktualisieren" ON public.profiles;

CREATE POLICY "profiles: eigenes Profil lesen"
  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles: Admin liest alle"
  ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "profiles: Admin aktualisiert alle"
  ON public.profiles FOR UPDATE USING (public.is_admin());
CREATE POLICY "profiles: eigenes Profil aktualisieren"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- ---- employees ----------------------------------------------
DROP POLICY IF EXISTS "employees: eigenen Datensatz lesen" ON public.employees;
DROP POLICY IF EXISTS "employees: Admin liest alle"        ON public.employees;
DROP POLICY IF EXISTS "employees: Admin fügt ein"          ON public.employees;
DROP POLICY IF EXISTS "employees: Admin aktualisiert"      ON public.employees;
DROP POLICY IF EXISTS "employees: Admin löscht"            ON public.employees;

CREATE POLICY "employees: eigenen Datensatz lesen"
  ON public.employees FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "employees: Admin liest alle"
  ON public.employees FOR SELECT USING (public.is_admin());
CREATE POLICY "employees: Admin fügt ein"
  ON public.employees FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "employees: Admin aktualisiert"
  ON public.employees FOR UPDATE USING (public.is_admin());
CREATE POLICY "employees: Admin löscht"
  ON public.employees FOR DELETE USING (public.is_admin());

-- ---- monthly_plans ------------------------------------------
DROP POLICY IF EXISTS "monthly_plans: veröffentlichte sehen" ON public.monthly_plans;
DROP POLICY IF EXISTS "monthly_plans: Admin fügt ein"        ON public.monthly_plans;
DROP POLICY IF EXISTS "monthly_plans: Admin aktualisiert"    ON public.monthly_plans;
DROP POLICY IF EXISTS "monthly_plans: Admin löscht"          ON public.monthly_plans;

CREATE POLICY "monthly_plans: veröffentlichte sehen"
  ON public.monthly_plans FOR SELECT USING (status = 'published' OR public.is_admin());
CREATE POLICY "monthly_plans: Admin fügt ein"
  ON public.monthly_plans FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "monthly_plans: Admin aktualisiert"
  ON public.monthly_plans FOR UPDATE USING (public.is_admin());
CREATE POLICY "monthly_plans: Admin löscht"
  ON public.monthly_plans FOR DELETE USING (public.is_admin());

-- ---- shift_types --------------------------------------------
DROP POLICY IF EXISTS "shift_types: alle authentifizierten lesen" ON public.shift_types;
DROP POLICY IF EXISTS "shift_types: Admin schreibt"               ON public.shift_types;
DROP POLICY IF EXISTS "shift_types: Admin aktualisiert"           ON public.shift_types;
DROP POLICY IF EXISTS "shift_types: Admin löscht"                 ON public.shift_types;

CREATE POLICY "shift_types: alle authentifizierten lesen"
  ON public.shift_types FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "shift_types: Admin schreibt"
  ON public.shift_types FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "shift_types: Admin aktualisiert"
  ON public.shift_types FOR UPDATE USING (public.is_admin());
CREATE POLICY "shift_types: Admin löscht"
  ON public.shift_types FOR DELETE USING (public.is_admin());

-- ---- shifts -------------------------------------------------
DROP POLICY IF EXISTS "shifts: Mitarbeiter sieht eigene (veröffentlicht)" ON public.shifts;
DROP POLICY IF EXISTS "shifts: Admin fügt ein"                            ON public.shifts;
DROP POLICY IF EXISTS "shifts: Admin aktualisiert"                        ON public.shifts;
DROP POLICY IF EXISTS "shifts: Admin löscht"                              ON public.shifts;

CREATE POLICY "shifts: Mitarbeiter sieht eigene (veröffentlicht)"
  ON public.shifts FOR SELECT
  USING (
    (employee_id = public.get_my_employee_id()
     AND EXISTS (
       SELECT 1 FROM public.monthly_plans mp
       WHERE mp.id = monthly_plan_id AND mp.status = 'published'
     ))
    OR public.is_admin()
  );
CREATE POLICY "shifts: Admin fügt ein"
  ON public.shifts FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "shifts: Admin aktualisiert"
  ON public.shifts FOR UPDATE USING (public.is_admin());
CREATE POLICY "shifts: Admin löscht"
  ON public.shifts FOR DELETE USING (public.is_admin());

-- ---- shift_requests -----------------------------------------
DROP POLICY IF EXISTS "shift_requests: eigene Wünsche lesen"     ON public.shift_requests;
DROP POLICY IF EXISTS "shift_requests: Admin liest alle"         ON public.shift_requests;
DROP POLICY IF EXISTS "shift_requests: eigene Wünsche eintragen" ON public.shift_requests;
DROP POLICY IF EXISTS "shift_requests: eigene pending ändern"    ON public.shift_requests;
DROP POLICY IF EXISTS "shift_requests: eigene pending löschen"   ON public.shift_requests;
DROP POLICY IF EXISTS "shift_requests: Admin alle Operationen"   ON public.shift_requests;

CREATE POLICY "shift_requests: eigene Wünsche lesen"
  ON public.shift_requests FOR SELECT USING (employee_id = public.get_my_employee_id());
CREATE POLICY "shift_requests: Admin liest alle"
  ON public.shift_requests FOR SELECT USING (public.is_admin());
CREATE POLICY "shift_requests: eigene Wünsche eintragen"
  ON public.shift_requests FOR INSERT WITH CHECK (employee_id = public.get_my_employee_id());
CREATE POLICY "shift_requests: eigene pending ändern"
  ON public.shift_requests FOR UPDATE
  USING (employee_id = public.get_my_employee_id() AND status = 'pending');
CREATE POLICY "shift_requests: eigene pending löschen"
  ON public.shift_requests FOR DELETE
  USING (employee_id = public.get_my_employee_id() AND status = 'pending');
CREATE POLICY "shift_requests: Admin alle Operationen"
  ON public.shift_requests FOR ALL USING (public.is_admin());

-- ---- audit_logs ---------------------------------------------
DROP POLICY IF EXISTS "audit_logs: Admin liest alle"     ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs: kein direkter Insert" ON public.audit_logs;

CREATE POLICY "audit_logs: Admin liest alle"
  ON public.audit_logs FOR SELECT USING (public.is_admin());
CREATE POLICY "audit_logs: kein direkter Insert"
  ON public.audit_logs FOR INSERT WITH CHECK (false);

-- ---- employee_settings --------------------------------------
DROP POLICY IF EXISTS "employee_settings: eigene lesen"         ON public.employee_settings;
DROP POLICY IF EXISTS "employee_settings: Admin liest alle"     ON public.employee_settings;
DROP POLICY IF EXISTS "employee_settings: eigene einfügen"      ON public.employee_settings;
DROP POLICY IF EXISTS "employee_settings: eigene aktualisieren" ON public.employee_settings;
DROP POLICY IF EXISTS "employee_settings: Admin schreibt alle"  ON public.employee_settings;

CREATE POLICY "employee_settings: eigene lesen"
  ON public.employee_settings FOR SELECT USING (employee_id = public.get_my_employee_id());
CREATE POLICY "employee_settings: Admin liest alle"
  ON public.employee_settings FOR SELECT USING (public.is_admin());
CREATE POLICY "employee_settings: eigene einfügen"
  ON public.employee_settings FOR INSERT WITH CHECK (employee_id = public.get_my_employee_id());
CREATE POLICY "employee_settings: eigene aktualisieren"
  ON public.employee_settings FOR UPDATE USING (employee_id = public.get_my_employee_id());
CREATE POLICY "employee_settings: Admin schreibt alle"
  ON public.employee_settings FOR ALL USING (public.is_admin());

-- ---- request_deadlines --------------------------------------
DROP POLICY IF EXISTS "request_deadlines: alle lesen"        ON public.request_deadlines;
DROP POLICY IF EXISTS "request_deadlines: Admin fügt ein"    ON public.request_deadlines;
DROP POLICY IF EXISTS "request_deadlines: Admin aktualisiert" ON public.request_deadlines;
DROP POLICY IF EXISTS "request_deadlines: Admin löscht"      ON public.request_deadlines;

CREATE POLICY "request_deadlines: alle lesen"
  ON public.request_deadlines FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "request_deadlines: Admin fügt ein"
  ON public.request_deadlines FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "request_deadlines: Admin aktualisiert"
  ON public.request_deadlines FOR UPDATE USING (public.is_admin());
CREATE POLICY "request_deadlines: Admin löscht"
  ON public.request_deadlines FOR DELETE USING (public.is_admin());

-- ---- admin_events -------------------------------------------
DROP POLICY IF EXISTS "admin_events: sichtbare für Mitarbeiter" ON public.admin_events;
DROP POLICY IF EXISTS "admin_events: Admin fügt ein"            ON public.admin_events;
DROP POLICY IF EXISTS "admin_events: Admin aktualisiert"        ON public.admin_events;
DROP POLICY IF EXISTS "admin_events: Admin löscht"              ON public.admin_events;

CREATE POLICY "admin_events: sichtbare für Mitarbeiter"
  ON public.admin_events FOR SELECT
  USING (public.is_admin() OR is_visible_to_employees = true);
CREATE POLICY "admin_events: Admin fügt ein"
  ON public.admin_events FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "admin_events: Admin aktualisiert"
  ON public.admin_events FOR UPDATE USING (public.is_admin());
CREATE POLICY "admin_events: Admin löscht"
  ON public.admin_events FOR DELETE USING (public.is_admin());

-- ---- notifications ------------------------------------------
DROP POLICY IF EXISTS "notifications: eigene lesen"                 ON public.notifications;
DROP POLICY IF EXISTS "notifications: Admin liest alle"             ON public.notifications;
DROP POLICY IF EXISTS "notifications: kein direkter Insert"         ON public.notifications;
DROP POLICY IF EXISTS "notifications: eigene als gelesen markieren" ON public.notifications;
DROP POLICY IF EXISTS "notifications: Admin alle Operationen"       ON public.notifications;

CREATE POLICY "notifications: eigene lesen"
  ON public.notifications FOR SELECT USING (employee_id = public.get_my_employee_id());
CREATE POLICY "notifications: Admin liest alle"
  ON public.notifications FOR SELECT USING (public.is_admin());
CREATE POLICY "notifications: kein direkter Insert"
  ON public.notifications FOR INSERT WITH CHECK (false);
CREATE POLICY "notifications: eigene als gelesen markieren"
  ON public.notifications FOR UPDATE
  USING (employee_id = public.get_my_employee_id())
  WITH CHECK (employee_id = public.get_my_employee_id());
CREATE POLICY "notifications: Admin alle Operationen"
  ON public.notifications FOR ALL USING (public.is_admin());


-- ============================================================
-- 7. SEED-DATEN: Diensttypen
-- ============================================================

INSERT INTO public.shift_types (name, abbreviation, default_start, default_end, color, sort_order)
VALUES
  ('Frühschicht',        'FS',  '06:00', '14:00', '#10b981', 1),
  ('Spätschicht',        'SS',  '14:00', '22:00', '#f59e0b', 2),
  ('Nachtschicht',       'NS',  '22:00', '06:00', '#6366f1', 3),
  ('24h-Dienst',         '24h', '08:00', '08:00', '#ef4444', 4),
  ('Bereitschaftsdienst','BD',  '07:00', '19:00', '#8b5cf6', 5),
  ('Tagdienst',          'TD',  '08:00', '16:00', '#06b6d4', 6),
  ('Sonderdienst',       'SD',  '10:00', '18:00', '#f97316', 7)
ON CONFLICT DO NOTHING;


-- ============================================================
-- 8. NACH DEM ERSTEN LOGIN: ADMIN-ROLLE SETZEN
-- ============================================================
--
--   UPDATE public.profiles
--   SET role = 'admin'
--   WHERE email = 'deine-email@example.com';
--
-- ============================================================


-- ============================================================
-- 9. OPTIONAL: pg_cron (nur Supabase Pro)
-- ============================================================
--
-- CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
-- SELECT cron.schedule(
--   'daily-shift-reminder', '0 17 * * *',
--   $$ SELECT public.send_daily_shift_reminders() $$
-- );
--
-- ============================================================
-- FERTIG
-- ============================================================
