-- =========================================================
--  Opschoning dubbele cases — draai in de Supabase SQL Editor.
--
--  Doel: de `cases`-tabel laat exact de 14 projecten uit de content-brief
--  (Portfolio_Cases_Complete_14.docx) zien. De 7 oude "spook"-rijen zonder
--  brief-tekst worden verwijderd.
--
--  BELANGRIJK: dit verwijdert ALLEEN rijen uit de tabel `cases`.
--  Er wordt GEEN media verwijderd — de bestanden op schijf (assets/cases/…)
--  en in de storage-bucket blijven ongemoeid. De media van de dubbele rijen
--  is in cases.js al herkoppeld aan de juiste brief-case (via de slug).
-- =========================================================

begin;

-- 1) De 6 oude/dubbele rijen weg (leeg = geen brief-tekst).
--    kick-t-net blijft bewust staan (geen brief-case, maar wel gewenst).
delete from public.cases
where slug in (
  'fifa',                -- dubbel met  fifa-research
  'adidas',              -- dubbel met  adidas-x-speedportal
  'g-shock',             -- dubbel met  complex-sneaker-shopping
  'afcon',               -- dubbel met  afcon-trophy-tour
  'complex-puma',        -- dubbel met  puma-complex-next
  'kick-t-met-on-tour'   -- hoort in de brief bij  kick-t-met (media toegevoegd aan die case)
);

-- 2) Volgorde gelijktrekken aan de brief (01 → 14), kick-t-net erachter (15).
update public.cases set sort_order =  1 where slug = 'fifa-research';
update public.cases set sort_order =  2 where slug = 'adidas-x-speedportal';
update public.cases set sort_order =  3 where slug = 'telfaz11';
update public.cases set sort_order =  4 where slug = 'complex-sneaker-shopping';
update public.cases set sort_order =  5 where slug = 'afcon-trophy-tour';
update public.cases set sort_order =  6 where slug = 'reebok';
update public.cases set sort_order =  7 where slug = 'kick-t-met';
update public.cases set sort_order =  8 where slug = 'zalando';
update public.cases set sort_order =  9 where slug = 'hot-ones';
update public.cases set sort_order = 10 where slug = 'puma-creative-camp';
update public.cases set sort_order = 11 where slug = 'red-bull-rap-champs';
update public.cases set sort_order = 12 where slug = 'convo';
update public.cases set sort_order = 13 where slug = 'puma-complex-next';
update public.cases set sort_order = 14 where slug = 'rabobank';
update public.cases set sort_order = 15 where slug = 'kick-t-net';

-- Controle: moet 15 rijen tonen (14 brief + kick-t-net).
-- select sort_order, slug, title from public.cases order by sort_order;

commit;
