create table if not exists public.shape_overlay_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'symbol' check (type in ('symbol', 'drawing')),
  symbol text,
  color text,
  size numeric not null default 1.6,
  opacity numeric not null default 0.58,
  offset_y numeric not null default 0,
  stroke_width numeric not null default 5,
  drawing_path text,
  drawing_view_box text not null default '0 0 120 60',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shape_overlay_presets_user_id_idx
  on public.shape_overlay_presets(user_id);

create index if not exists shape_overlay_presets_user_name_idx
  on public.shape_overlay_presets(user_id, name);

alter table public.shape_overlay_presets enable row level security;

drop policy if exists "Users can read own shape overlay presets" on public.shape_overlay_presets;
create policy "Users can read own shape overlay presets"
  on public.shape_overlay_presets for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own shape overlay presets" on public.shape_overlay_presets;
create policy "Users can insert own shape overlay presets"
  on public.shape_overlay_presets for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own shape overlay presets" on public.shape_overlay_presets;
create policy "Users can update own shape overlay presets"
  on public.shape_overlay_presets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own shape overlay presets" on public.shape_overlay_presets;
create policy "Users can delete own shape overlay presets"
  on public.shape_overlay_presets for delete
  using (auth.uid() = user_id);
