-- =====================================================================
--  Logo-marquee (homepage) beheerbaar maken.
--  Plak in de Supabase SQL Editor en klik Run. Veilig om te herhalen.
-- =====================================================================
create table if not exists public.site_marquee (
  id         uuid primary key default gen_random_uuid(),
  page       text not null default 'home',
  url        text not null,                 -- schijf-pad of storage-URL
  name       text,
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists site_marquee_idx on public.site_marquee (page, sort_order);

grant select on public.site_marquee to anon, authenticated;
grant insert, update, delete on public.site_marquee to authenticated;

alter table public.site_marquee enable row level security;
drop policy if exists site_marquee_read  on public.site_marquee;
drop policy if exists site_marquee_write on public.site_marquee;
create policy site_marquee_read  on public.site_marquee for select to anon, authenticated using (true);
create policy site_marquee_write on public.site_marquee for all    to authenticated using (true) with check (true);
