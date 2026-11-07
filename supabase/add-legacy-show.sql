-- =========================================================
--  The Legacy Show als case toevoegen — draai in de Supabase SQL Editor.
--
--  Tekst komt van de About-pagina (co-founded met Ryan Babel). Het logo staat
--  al in de repo (assets/logos/legacy-show.png). Media (foto/video) kun je er
--  daarna via /admin/ bij uploaden — tot die tijd toont de case de showreel.
--
--  Idempotent: nog een keer draaien werkt de rij bij i.p.v. een dubbele te maken.
-- =========================================================

insert into public.cases
  (slug, brand, title, sub, client, role, project_type, intro,
   service_category, services_list, logo, highlighted, in_popup, published, sort_order)
values
  ('the-legacy-show',
   'THE LEGACY SHOW',
   'The Legacy Show',
   'Football, business & culture',
   'Independent Media Platform',
   'Co-Founder & Creator',
   'Original IP & Media Platform',
   'An independent football media format co-founded with former Netherlands international Ryan Babel. The Legacy Show explores the business, creativity and culture surrounding football, bringing athletes, entrepreneurs and creatives together for conversations that go beyond the game.',
   array['Format & IP'],
   array['Concept Development', 'Creative Direction', 'Hosting'],
   'assets/logos/legacy-show.png',
   true, true, true, 16)
on conflict (slug) do update set
   brand            = excluded.brand,
   title            = excluded.title,
   sub              = excluded.sub,
   client           = excluded.client,
   role             = excluded.role,
   project_type     = excluded.project_type,
   intro            = excluded.intro,
   service_category = excluded.service_category,
   services_list    = excluded.services_list,
   logo             = excluded.logo,
   highlighted      = excluded.highlighted,
   in_popup         = excluded.in_popup,
   published        = excluded.published,
   sort_order       = excluded.sort_order;

-- Controle: moet nu 16 rijen tonen, met The Legacy Show op plek 16.
-- select sort_order, slug, title from public.cases order by sort_order;
