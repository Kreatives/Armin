-- =====================================================================
--  Armin Shah — CMS schema
--  Plak dit ÉÉN keer in de Supabase SQL Editor (SQL > New query > Run).
--  Veilig om opnieuw te draaien (idempotent): bestaande data blijft staan.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. site_texts  — tekst-overrides per pagina/sectie/veld.
--    key      = stabiele sleutel uit cms/manifest.js (bv. "home.hero.body")
--    value    = de nieuwe tekst ("wat het moet worden").
--               Leeg/NULL  => de site gebruikt de originele HTML-tekst.
-- ---------------------------------------------------------------------
create table if not exists public.site_texts (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. cases  — de case-CMS (alleen tekst + metadata; media blijft op schijf).
--    slug koppelt aan de media-mappen in assets/cases/<slug>/.
-- ---------------------------------------------------------------------
create table if not exists public.cases (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  brand       text,
  title       text,
  sub         text,
  tags        text[]  not null default '{}',
  client      text,
  date        text,
  role        text,
  services    text,
  summary     text,
  sort_order  int     not null default 0,
  highlighted boolean not null default true,   -- toont op de homepage-ring
  published   boolean not null default true,   -- zichtbaar op de site
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists cases_sort_idx on public.cases (sort_order);

-- ---------------------------------------------------------------------
-- 3. updated_at automatisch bijwerken
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists site_texts_updated on public.site_texts;
create trigger site_texts_updated before update on public.site_texts
  for each row execute function public.set_updated_at();

drop trigger if exists cases_updated on public.cases;
create trigger cases_updated before update on public.cases
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 4. Row Level Security
--    - iedereen (anon) mag LEZEN  -> de live site kan teksten/cases ophalen.
--    - alleen ingelogde gebruikers mogen SCHRIJVEN -> de editor.
-- ---------------------------------------------------------------------
alter table public.site_texts enable row level security;
alter table public.cases      enable row level security;

-- site_texts
drop policy if exists site_texts_read  on public.site_texts;
drop policy if exists site_texts_write on public.site_texts;
create policy site_texts_read  on public.site_texts for select to anon, authenticated using (true);
create policy site_texts_write on public.site_texts for all    to authenticated using (true) with check (true);

-- cases
drop policy if exists cases_read  on public.cases;
drop policy if exists cases_write on public.cases;
create policy cases_read  on public.cases for select to anon, authenticated using (true);
create policy cases_write on public.cases for all    to authenticated using (true) with check (true);

-- =====================================================================
--  5. Seed: je 16 bestaande cases (uit generate-cases.js).
--     on conflict (slug) do nothing => draait veilig opnieuw zonder
--     bestaande, in de editor aangepaste cases te overschrijven.
-- =====================================================================
insert into public.cases (slug, brand, title, sub, tags, client, date, role, services, summary, sort_order) values
  ('kick-t-met',          'KICK ''T MET',         'Kick ''t Met',            'Ziggo Sport talkshow',   array['Presentatie','Format'],          'Ziggo Sport', '2024', 'Host & Concept',             'Format & IP',                               'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Een campagne waar voetbal, hiphop en cultuur samenkomen, gebouwd rond een format dat blijft hangen. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',  1),
  ('kick-t-met-on-tour',  'KICK ''T MET ON TOUR', 'Kick ''t Met — On Tour',  'Ziggo Sport op locatie', array['Presentatie','Football'],        'Ziggo Sport', '2024', 'Host & Concept',             'Format & IP',                               'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Een campagne waar voetbal, hiphop en cultuur samenkomen, gebouwd rond een format dat blijft hangen. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',  2),
  ('kick-t-net',          'KICK ''T NET',         'Kick ''t Net',            'Voetbalinterviews',      array['Host','Content'],                'Ziggo Sport', '2024', 'Host & Concept',             'Format & IP',                               'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Een campagne waar voetbal, hiphop en cultuur samenkomen, gebouwd rond een format dat blijft hangen. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',  3),
  ('convo',               'CONVO',                'CONVO',                   'Gesprekken over cultuur',array['Host','Format'],                 'CONVO',       '2024', 'Founder, Creator & Host',    'Format & IP',                               'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Een campagne waar voetbal, hiphop en cultuur samenkomen, gebouwd rond een format dat blijft hangen. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',  4),
  ('rabobank',            'RABOBANK',             'Rabobank',                'Merkcampagne',           array['Content','Video'],               'Rabobank',    '2024', 'Creative & Host',            'Creative Direction & Production',           'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Een campagne waar voetbal, hiphop en cultuur samenkomen, gebouwd rond een format dat blijft hangen. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',  5),
  ('complex-puma',        'COMPLEX × PUMA',       'Complex × Puma',          'Merkcampagne',           array['Creative Direction','Video'],    'Puma',        '2023', 'Creative Director',          'Creative Direction & Production',           'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Een campagne waar voetbal, hiphop en cultuur samenkomen, gebouwd rond een format dat blijft hangen. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',  6),
  ('red-bull-rap-champs', 'RED BULL',             'Red Bull Rap Champs',     'Hiphop-competitie',      array['Host','Content'],                'Red Bull',    '2023', 'Host & Concept',             'Format & IP',                               'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Een campagne waar voetbal, hiphop en cultuur samenkomen, gebouwd rond een format dat blijft hangen. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',  7),
  ('hot-ones',            'HOT ONES',             'Hot Ones — KFC × Sprite', 'Branded format',         array['Host','Format'],                 'KFC × Sprite','2024', 'Host',                       'Creative Direction & Production',           'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Een campagne waar voetbal, hiphop en cultuur samenkomen, gebouwd rond een format dat blijft hangen. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',  8),
  ('g-shock',             'G-SHOCK',              'Sneaker Shopping',        'G-Shock branded serie',  array['Host','Content'],                'G-Shock',     '2023', 'Host & Concept',             'Format & IP',                               'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Een campagne waar voetbal, hiphop en cultuur samenkomen, gebouwd rond een format dat blijft hangen. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',  9),
  ('puma-creative-camp',  'PUMA',                 'Puma Creative Camp',      'Community-event',        array['Host','Direction'],              'Puma',        '2023', 'Host & Curator',             'Partnerships & Cultural Connections',       'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Een campagne waar voetbal, hiphop en cultuur samenkomen, gebouwd rond een format dat blijft hangen. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', 10),
  ('reebok',              'REEBOK',               'Back to Classics',        'Reebok-campagne',        array['Creative Direction','Video'],    'Reebok',      '2022', 'Creative Director',          'Creative Direction & Production',           'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Een campagne waar voetbal, hiphop en cultuur samenkomen, gebouwd rond een format dat blijft hangen. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', 11),
  ('zalando',             'ZALANDO',              'Zalando',                 'Fashion & cultuur',      array['Host','Content'],                'Zalando',     '2024', 'Host',                       'Partnerships & Cultural Connections',       'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Een campagne waar voetbal, hiphop en cultuur samenkomen, gebouwd rond een format dat blijft hangen. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', 12),
  ('adidas',              'ADIDAS',               'adidas',                  'Social-serie',           array['Content','Social'],              'adidas',      '2024', 'Creative & Host',            'Creative Direction & Production',           'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Een campagne waar voetbal, hiphop en cultuur samenkomen, gebouwd rond een format dat blijft hangen. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', 13),
  ('telfaz11',            'TELFAZ11',             'Telfaz11',                'Content-samenwerking',   array['Format','Video'],                'Telfaz11',    '2024', 'Creative Consultant',        'Football & Culture Consultancy',            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Een campagne waar voetbal, hiphop en cultuur samenkomen, gebouwd rond een format dat blijft hangen. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', 14),
  ('afcon',               'AFCON',                'AFCON',                   'Voetbaltoernooi-content',array['Host','Football'],               'Complex',     '2024', 'Host & Analyst',             'Football & Culture Consultancy',            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Een campagne waar voetbal, hiphop en cultuur samenkomen, gebouwd rond een format dat blijft hangen. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', 15),
  ('fifa',                'FIFA',                 'FIFA',                    'Gaming & voetbal',       array['Host','Content'],                'FIFA',        '2023', 'Host',                       'Football & Culture Consultancy',            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Een campagne waar voetbal, hiphop en cultuur samenkomen, gebouwd rond een format dat blijft hangen. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.', 16)
on conflict (slug) do nothing;
