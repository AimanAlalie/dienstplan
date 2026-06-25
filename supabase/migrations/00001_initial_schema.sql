-- ============================================================
-- 00001_initial_schema.sql
-- Dienstplan-System: Vollständiges Datenbankschema
-- ============================================================

-- ---- Hilfsfunktionen ----------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---- Tabelle: profiles -------------------------------------

CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'employee'
              CHECK (role IN ('admin', 'employee')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role  ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- Tabelle: employees ------------------------------------

CREATE TABLE public.employees (
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

CREATE INDEX idx_employees_profile_id  ON public.employees(profile_id);
CREATE INDEX idx_employees_status      ON public.employees(status);
CREATE INDEX idx_employees_abbreviation ON public.employees(abbreviation);

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- Tabelle: monthly_plans --------------------------------

CREATE TABLE public.monthly_plans (
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

CREATE INDEX idx_monthly_plans_status     ON public.monthly_plans(status);
CREATE INDEX idx_monthly_plans_year_month ON public.monthly_plans(year, month);

CREATE TRIGGER trg_monthly_plans_updated_at
  BEFORE UPDATE ON public.monthly_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- Tabelle: shift_types ----------------------------------

CREATE TABLE public.shift_types (
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

CREATE TRIGGER trg_shift_types_updated_at
  BEFORE UPDATE ON public.shift_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- Tabelle: shifts ---------------------------------------

CREATE TABLE public.shifts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_plan_id UUID NOT NULL REFERENCES public.monthly_plans(id) ON DELETE CASCADE,
  employee_id     UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  shift_type_id   UUID REFERENCES public.shift_types(id) ON DELETE SET NULL,
  shift_date      DATE NOT NULL,
  start_time      TIMESTAMPTZ NOT NULL,
  end_time        TIMESTAMPTZ NOT NULL,
  break_minutes   SMALLINT NOT NULL DEFAULT 0,
  location        TEXT,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'scheduled'
                  CHECK (status IN ('scheduled','cancelled','completed')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by      UUID REFERENCES public.profiles(id),
  updated_by      UUID REFERENCES public.profiles(id),
  CONSTRAINT chk_shifts_end_after_start   CHECK (end_time > start_time),
  CONSTRAINT chk_shifts_break_non_negative CHECK (break_minutes >= 0)
);

CREATE INDEX idx_shifts_monthly_plan_id ON public.shifts(monthly_plan_id);
CREATE INDEX idx_shifts_employee_id     ON public.shifts(employee_id);
CREATE INDEX idx_shifts_shift_date      ON public.shifts(shift_date);
CREATE INDEX idx_shifts_employee_date   ON public.shifts(employee_id, shift_date);
CREATE INDEX idx_shifts_date_range      ON public.shifts(start_time, end_time);

CREATE TRIGGER trg_shifts_updated_at
  BEFORE UPDATE ON public.shifts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- Tabelle: shift_requests --------------------------------

CREATE TABLE public.shift_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id     UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  monthly_plan_id UUID REFERENCES public.monthly_plans(id) ON DELETE SET NULL,
  request_type    TEXT NOT NULL
                  CHECK (request_type IN (
                    'availability',
                    'unavailability',
                    'vacation',
                    'preference',
                    'block_shift'
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

CREATE INDEX idx_shift_requests_employee_id     ON public.shift_requests(employee_id);
CREATE INDEX idx_shift_requests_monthly_plan_id ON public.shift_requests(monthly_plan_id);
CREATE INDEX idx_shift_requests_request_date    ON public.shift_requests(request_date);
CREATE INDEX idx_shift_requests_status          ON public.shift_requests(status);

CREATE TRIGGER trg_shift_requests_updated_at
  BEFORE UPDATE ON public.shift_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---- Tabelle: audit_logs -----------------------------------

CREATE TABLE public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  old_data    JSONB,
  new_data    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_actor_id  ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity    ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ---- Trigger: Profil bei Registrierung erstellen -----------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
