-- ============================================================
-- 00002_rls_policies.sql
-- Row Level Security für alle Tabellen
-- ============================================================

-- ---- Hilfsfunktionen (SECURITY DEFINER = kein RLS-Loop) ----

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_my_employee_id()
RETURNS UUID AS $$
  SELECT id FROM public.employees WHERE profile_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- profiles
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: eigenes Profil lesen"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: Admin liest alle"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "profiles: Admin aktualisiert alle"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "profiles: eigenes Profil aktualisieren (ohne Rolle)"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

-- ============================================================
-- employees
-- ============================================================
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "employees: eigenen Datensatz lesen"
  ON public.employees FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "employees: Admin liest alle"
  ON public.employees FOR SELECT
  USING (public.is_admin());

CREATE POLICY "employees: Admin fügt ein"
  ON public.employees FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "employees: Admin aktualisiert"
  ON public.employees FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "employees: Admin löscht"
  ON public.employees FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- monthly_plans
-- ============================================================
ALTER TABLE public.monthly_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "monthly_plans: veröffentlichte sehen"
  ON public.monthly_plans FOR SELECT
  USING (status = 'published' OR public.is_admin());

CREATE POLICY "monthly_plans: Admin fügt ein"
  ON public.monthly_plans FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "monthly_plans: Admin aktualisiert"
  ON public.monthly_plans FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "monthly_plans: Admin löscht"
  ON public.monthly_plans FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- shift_types
-- ============================================================
ALTER TABLE public.shift_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shift_types: alle authentifizierten lesen"
  ON public.shift_types FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "shift_types: Admin schreibt"
  ON public.shift_types FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "shift_types: Admin aktualisiert"
  ON public.shift_types FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "shift_types: Admin löscht"
  ON public.shift_types FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- shifts
-- ============================================================
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Mitarbeiter sehen eigene Dienste in veröffentlichten Plänen
CREATE POLICY "shifts: Mitarbeiter sieht eigene (veröffentlicht)"
  ON public.shifts FOR SELECT
  USING (
    (
      employee_id = public.get_my_employee_id()
      AND EXISTS (
        SELECT 1 FROM public.monthly_plans mp
        WHERE mp.id = monthly_plan_id AND mp.status = 'published'
      )
    )
    OR public.is_admin()
  );

CREATE POLICY "shifts: Admin fügt ein"
  ON public.shifts FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "shifts: Admin aktualisiert"
  ON public.shifts FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "shifts: Admin löscht"
  ON public.shifts FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- shift_requests
-- ============================================================
ALTER TABLE public.shift_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shift_requests: eigene Wünsche lesen"
  ON public.shift_requests FOR SELECT
  USING (employee_id = public.get_my_employee_id());

CREATE POLICY "shift_requests: Admin liest alle"
  ON public.shift_requests FOR SELECT
  USING (public.is_admin());

CREATE POLICY "shift_requests: eigene Wünsche eintragen"
  ON public.shift_requests FOR INSERT
  WITH CHECK (employee_id = public.get_my_employee_id());

-- Mitarbeiter kann nur eigene PENDING-Wünsche ändern
CREATE POLICY "shift_requests: eigene pending ändern"
  ON public.shift_requests FOR UPDATE
  USING (
    employee_id = public.get_my_employee_id()
    AND status = 'pending'
  );

CREATE POLICY "shift_requests: eigene pending löschen"
  ON public.shift_requests FOR DELETE
  USING (
    employee_id = public.get_my_employee_id()
    AND status = 'pending'
  );

CREATE POLICY "shift_requests: Admin alle Operationen"
  ON public.shift_requests FOR ALL
  USING (public.is_admin());

-- ============================================================
-- audit_logs
-- ============================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs: Admin liest alle"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin());

-- Direkte Inserts geblockt; läuft über Service-Role in Server Actions
CREATE POLICY "audit_logs: kein direkter Insert"
  ON public.audit_logs FOR INSERT
  WITH CHECK (false);
