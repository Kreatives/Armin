-- =====================================================================
--  Media-beheer: tabel + opslag-bucket + rechten.
--  Plak dit in de Supabase SQL Editor en klik Run. Veilig om te herhalen.
-- =====================================================================

-- 1. Tabel met media-overrides (key -> publieke URL in de bucket).
create table if not exists public.site_media (
  key        text primary key,
  url        text,
  updated_at timestamptz not null default now()
);

grant select on public.site_media to anon, authenticated;
grant insert, update, delete on public.site_media to authenticated;

alter table public.site_media enable row level security;
drop policy if exists site_media_read  on public.site_media;
drop policy if exists site_media_write on public.site_media;
create policy site_media_read  on public.site_media for select to anon, authenticated using (true);
create policy site_media_write on public.site_media for all    to authenticated using (true) with check (true);

-- 2. Opslag-bucket (publiek leesbaar) voor geüploade foto's.
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

-- 3. Opslag-rechten: iedereen mag lezen, ingelogde gebruikers mogen schrijven.
drop policy if exists "site-media read"   on storage.objects;
drop policy if exists "site-media insert" on storage.objects;
drop policy if exists "site-media update" on storage.objects;
drop policy if exists "site-media delete" on storage.objects;
create policy "site-media read"   on storage.objects for select to anon, authenticated using (bucket_id = 'site-media');
create policy "site-media insert" on storage.objects for insert to authenticated with check (bucket_id = 'site-media');
create policy "site-media update" on storage.objects for update to authenticated using (bucket_id = 'site-media');
create policy "site-media delete" on storage.objects for delete to authenticated using (bucket_id = 'site-media');
