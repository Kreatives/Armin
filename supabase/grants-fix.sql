-- =====================================================================
--  FIX: tabel-rechten toekennen (de API gaf "permission denied for table").
--  Plak dit in de Supabase SQL Editor en klik Run. Veilig om te draaien.
-- =====================================================================
grant usage on schema public to anon, authenticated;
grant select on public.site_texts to anon, authenticated;
grant select on public.cases      to anon, authenticated;
grant insert, update, delete on public.site_texts to authenticated;
grant insert, update, delete on public.cases      to authenticated;
