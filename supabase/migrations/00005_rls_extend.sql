-- ============================================================
-- 00005_rls_extend.sql
-- Row Level Security für neue Tabellen
-- ============================================================

-- ============================================================
-- employee_settings
-- ============================================================
ALTER TABLE public.employee_settings ENABLE ROW LEVEL SECURITY;

-- Mitarbeiter liest und schreibt nur eigene Einstellungen
CREATE POLICY "employee_settings: eigene lesen"
  ON public.employee_settings FOR SELECT
  USING (employee_id = public.get_my_employee_id());

CREATE POLICY "employee_settings: Admin liest alle"
  ON public.employee_settings FOR SELECT
  USING (public.is_admin());

CREATE POLICY "employee_settings: eigene einfügen"
  ON public.employee_settings FOR INSERT
  WITH CHECK (employee_id = public.get_my_employee_id());

CREATE POLICY "employee_settings: eigene aktualisieren"
  ON public.employee_settings FOR UPDATE
  USING (employee_id = public.get_my_employee_id());

CREATE POLICY "employee_settings: Admin schreibt alle"
  ON public.employee_settings FOR ALL
  USING (public.is_admin());

-- ============================================================
-- request_deadlines
-- ============================================================
ALTER TABLE public.request_deadlines ENABLE ROW LEVEL SECURITY;

-- Alle authentifizierten Nutzer dürfen Fristen lesen
-- (Mitarbeiter müssen wissen, bis wann sie Wünsche einreichen können)
CREATE POLICY "request_deadlines: alle lesen"
  ON public.request_deadlines FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "request_deadlines: Admin fügt ein"
  ON public.request_deadlines FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "request_deadlines: Admin aktualisiert"
  ON public.request_deadlines FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "request_deadlines: Admin löscht"
  ON public.request_deadlines FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- admin_events
-- ============================================================
ALTER TABLE public.admin_events ENABLE ROW LEVEL SECURITY;

-- Mitarbeiter sehen nur für sie sichtbare Termine
CREATE POLICY "admin_events: sichtbare für Mitarbeiter"
  ON public.admin_events FOR SELECT
  USING (
    public.is_admin()
    OR is_visible_to_employees = true
  );

CREATE POLICY "admin_events: Admin fügt ein"
  ON public.admin_events FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_events: Admin aktualisiert"
  ON public.admin_events FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "admin_events: Admin löscht"
  ON public.admin_events FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- notifications
-- ============================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Mitarbeiter liest nur eigene Benachrichtigungen
CREATE POLICY "notifications: eigene lesen"
  ON public.notifications FOR SELECT
  USING (employee_id = public.get_my_employee_id());

CREATE POLICY "notifications: Admin liest alle"
  ON public.notifications FOR SELECT
  USING (public.is_admin());

-- Kein direkter Insert – läuft über Service-Role / create_notification()
CREATE POLICY "notifications: kein direkter Insert"
  ON public.notifications FOR INSERT
  WITH CHECK (false);

-- Mitarbeiter kann nur eigene als gelesen markieren (UPDATE is_read)
CREATE POLICY "notifications: eigene als gelesen markieren"
  ON public.notifications FOR UPDATE
  USING (employee_id = public.get_my_employee_id())
  WITH CHECK (employee_id = public.get_my_employee_id());

CREATE POLICY "notifications: Admin alle Operationen"
  ON public.notifications FOR ALL
  USING (public.is_admin());
