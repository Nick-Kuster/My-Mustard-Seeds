alter table public.shape_overlay_presets
  add column if not exists stroke_width numeric not null default 5;
