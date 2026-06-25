-- ============================================================
-- 00003_seed_data.sql
-- Initialdaten: Diensttypen und Demo-Einträge
-- ============================================================

-- Diensttypen (Schichtvorlagen)
INSERT INTO public.shift_types (name, abbreviation, default_start, default_end, color, sort_order) VALUES
  ('Frühschicht',       'FS',  '06:00', '14:00', '#10b981', 1),
  ('Spätschicht',       'SS',  '14:00', '22:00', '#f59e0b', 2),
  ('Nachtschicht',      'NS',  '22:00', '06:00', '#6366f1', 3),
  ('24h-Dienst',        '24h', '08:00', '08:00', '#ef4444', 4),
  ('Bereitschaftsdienst','BD', '07:00', '19:00', '#8b5cf6', 5),
  ('Tagdienst',         'TD',  '08:00', '16:00', '#06b6d4', 6),
  ('Sonderdienst',      'SD',  '10:00', '18:00', '#f97316', 7);
