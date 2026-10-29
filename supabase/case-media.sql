-- =====================================================================
--  Media per case (foto's/video's beheerbaar in het dashboard).
--  Plak in de Supabase SQL Editor en klik Run. Veilig om te herhalen.
-- =====================================================================
create table if not exists public.case_media (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null,                       -- koppelt aan cases.slug
  url        text not null,                       -- schijf-pad of storage-URL
  kind       text not null default 'image',       -- 'image' | 'video'
  portrait   boolean not null default false,      -- staand (9:16) of liggend
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists case_media_slug_idx on public.case_media (slug, sort_order);

grant select on public.case_media to anon, authenticated;
grant insert, update, delete on public.case_media to authenticated;

alter table public.case_media enable row level security;
drop policy if exists case_media_read  on public.case_media;
drop policy if exists case_media_write on public.case_media;
create policy case_media_read  on public.case_media for select to anon, authenticated using (true);
create policy case_media_write on public.case_media for all    to authenticated using (true) with check (true);
