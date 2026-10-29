-- =====================================================================
--  Cases uitbreiden: rijkere velden + jouw 14 projecten (uit de brief).
--  Plak in de Supabase SQL Editor en klik Run. Verwijdert NIETS.
-- =====================================================================

-- 1. Nieuwe kolommen (bestaande kolommen blijven staan).
alter table public.cases add column if not exists logo            text;
alter table public.cases add column if not exists intro           text;
alter table public.cases add column if not exists body            text;
alter table public.cases add column if not exists publisher       text;
alter table public.cases add column if not exists agency_partner  text;
alter table public.cases add column if not exists project_type    text;
alter table public.cases add column if not exists service_category text[] not null default '{}';
alter table public.cases add column if not exists services_list   text[] not null default '{}';
alter table public.cases add column if not exists in_popup        boolean not null default true;

-- 2. Jouw 14 projecten. Upsert op slug: bestaande worden bijgewerkt,
--    nieuwe toegevoegd. Media/logo vul je zelf in het dashboard.
insert into public.cases
  (slug, title, intro, client, publisher, agency_partner, project_type, role, services, service_category, services_list, sort_order, highlighted, in_popup, published)
values
  ('fifa-research', 'FIFA Research',
   $$A research and editorial project developed with PROVOKE for FIFA, documenting past projects, ongoing initiatives and strategic insights shaping the organization’s future direction. My involvement covered research, writing and editorial structuring, helping shape the content and development of the publications.$$,
   'FIFA', null, 'PROVOKE', 'Research & Editorial', 'Strategist & Writer',
   'Creative Strategy', array['Creative Strategy'], array['Research','Editorial Strategy','Writing'], 1, true, true, true),

  ('adidas-x-speedportal', 'adidas X Speedportal',
   $$Developed a creative campaign for the adidas X Speedportal football boot, featuring players from Ajax and Feyenoord. The concept translated the boot’s core attributes of speed, quick thinking and technique into an entertaining, challenge-based vertical video format designed to drive awareness and engage football audiences.$$,
   'adidas', 'Complex', null, 'Branded Content Campaign', 'Strategist, Director & Host',
   'Creative Direction', array['Creative Direction'], array['Creative Strategy','Concept Development','Creative Direction','Hosting'], 2, true, true, true),

  ('telfaz11', 'Telfaz11 — Consultancy',
   $$Contributed to building the digital media division of Telfaz11, a pioneering film and entertainment studio in Saudi Arabia. Worked on-site to mentor a new generation of creatives in digital media strategy, media brand building and original format development, while helping establish a strategic blueprint for the studio’s digital media expansion.$$,
   'Telfaz11', null, null, 'Media Consultancy', 'Media Strategist & Consultant',
   'Football & Culture', array['Football & Culture'], array['Digital Media Strategy','Brand Development','Format Creation','Creative Mentorship'], 3, true, true, true),

  ('complex-sneaker-shopping', 'Complex’ Sneaker Shopping',
   $$Led the launch of Complex’s iconic Sneaker Shopping format in the Netherlands as Creative Director. Successfully pitched and sold the format to G-SHOCK as its commercial sponsor, overseeing the creative strategy, local adaptation and production. Responsible for recruitment and developing the social media strategy to introduce the format to Dutch audiences.$$,
   'G-SHOCK', 'Complex', null, 'Branded Entertainment & Format Development', 'Creative Director',
   'Format & IP', array['Format & IP'], array['Creative Strategy','Format Development','Sponsorship Sales','Talent Recruitment','Social Media Strategy'], 4, true, true, true),

  ('afcon-trophy-tour', 'AFCON — Trophy Tour',
   $$Developed the creative strategy and experience concepts for the AFCON Trophy Tour alongside PROVOKE Agency, building anticipation for one of the tournament’s most commercially significant editions. Designed fan experiences in London and Paris, bringing the trophy closer to audiences through culturally relevant activations.$$,
   'AFCON', null, 'PROVOKE Agency', 'Experiential Marketing & Brand Activation', 'Creative Strategist',
   'Partnerships', array['Partnerships'], array['Creative Strategy','Experience Design','Concept Development'], 5, true, true, true),

  ('reebok', 'Reebok — Back to Classics',
   $$Created and developed an original branded entertainment format for Complex, sponsored by Reebok. Collaborated with the Complex team to successfully pitch and sell the concept to Reebok, leading the format development and creative direction. The series was produced and published across Complex’s platforms.$$,
   'Reebok', 'Complex', null, 'Branded Entertainment & Original Format', 'Creative Director',
   'Creative Direction', array['Creative Direction'], array['Concept Development','Format Creation','Creative Direction','Sponsorship Sales'], 6, true, true, true),

  ('kick-t-met', 'Kick ’t Met — Ziggo Sport',
   $$Created and developed Kick ’t Met, an original football entertainment franchise for VodafoneZiggo, consisting of two formats: Kick ’t Met, an interview-driven talk show, and Kick ’t Met On Tour, a football travel series exploring clubs, players and football culture. Responsible for concept development, creative direction, production and hosting, with both formats published on Ziggo Sport.$$,
   'VodafoneZiggo', 'Ziggo Sport', null, 'Original IP & Entertainment Formats', 'Creator, Director, Producer & Host',
   'Format & IP', array['Format & IP'], array['IP Development','Format Creation','Creative Direction','Production','Hosting'], 7, true, true, true),

  ('zalando', 'Zalando',
   $$Conceived and developed an original branded entertainment format for Complex, successfully pitching and selling the concept to Zalando. Led the creative direction and format development, bringing the campaign to life through content published on Complex’s platforms.$$,
   'Zalando', 'Complex', null, 'Branded Entertainment & Original Format', 'Creative Director',
   'Creative Direction', array['Creative Direction'], array['Concept Development','Format Creation','Creative Direction','Sponsorship Sales'], 8, true, true, true),

  ('hot-ones', 'Hot Ones — European Launch',
   $$Brought the iconic American Hot Ones format to Europe for the first time under the Complex brand, with Sprite and KFC as commercial partners. Led the creative direction, editorial strategy and local adaptation of the format, introducing the series to European audiences through Complex’s platforms.$$,
   'Sprite & KFC', 'Complex', null, 'Branded Entertainment & Format Localization', 'Creative Director',
   'Creative Direction', array['Creative Direction'], array['Creative Direction','Editorial Strategy','Format Adaptation','Content Strategy'], 9, true, true, true),

  ('puma-creative-camp', 'PUMA Creative Camp',
   $$Co-created and developed a two-day creative experience from scratch with PUMA to celebrate the PUMA Slipstream. The event brought together creators for hands-on creative workshops, panel discussions, networking and immersive brand experiences. Developed as a platform for creative expression and community engagement, with Complex as the publishing partner.$$,
   'PUMA', 'Complex', null, 'Experiential Marketing & Brand Activation', 'Creative Strategist & Concept Developer',
   'Partnerships', array['Partnerships'], array['Creative Strategy','Concept Development','Experience Design','Event Programming'], 10, true, true, true),

  ('red-bull-rap-champs', 'Red Bull Rap Champs',
   $$Developed the editorial strategy and format structure for Red Bull Rap Champs under the Complex brand. Responsible for shaping the creative concept, defining the editorial direction and developing the format for Complex’s audience.$$,
   'Red Bull', 'Complex', null, 'Branded Entertainment & Format Development', 'Editorial Director & Strategist',
   'Format & IP', array['Format & IP'], array['Editorial Strategy','Editorial Direction','Format Development'], 11, true, true, true),

  ('convo', 'CONVO Talkshow',
   $$Founded and hosted CONVO Talkshow, one of the Netherlands’ pioneering youth-focused podcasts and one of the longest-running platforms within Dutch urban culture. Built an independent media platform connecting music, culture and conversation, collaborating with global brands including Red Bull, Zalando, SNIPES, Foot Locker, PUMA and Jack Daniel’s.$$,
   'Independent Media Platform', null, null, 'Original IP & Media Platform', 'Founder & Host',
   'Format & IP', array['Format & IP'], array['Media Brand Development','Content Strategy','Editorial Direction','Brand Partnerships','Hosting'], 12, true, true, true),

  ('puma-complex-next', 'PUMA — Complex Next',
   $$Created and developed Complex Next, an original music-driven entertainment format spotlighting emerging female artists shaping the sound of the future. Successfully pitched and sold the concept to PUMA, integrating the brand’s footwear into the storytelling. Led the creative strategy and direction, with the series published on Complex.$$,
   'PUMA', 'Complex', null, 'Original IP & Branded Entertainment', 'Creator & Creative Director',
   'Format & IP', array['Format & IP'], array['IP Development','Creative Strategy','Format Creation','Creative Direction','Talent Curation','Sponsorship Sales'], 13, true, true, true),

  ('rabobank', 'Rabobank — Financial Awareness Special',
   $$Developed a branded podcast special for Rabobank in collaboration with Geur & Kleuren Agency, focused on financial awareness among young people. The format brought together financial experts and relatable conversations to explore money management, financial literacy and building a strong financial foundation. Published on CONVO Talkshow.$$,
   'Rabobank', 'CONVO Talkshow', 'Geur & Kleuren Agency', 'Branded Podcast & Educational Content', 'Format Creator & Creative Strategist',
   'Creative Direction', array['Creative Direction'], array['Concept Development','Format Creation','Creative Strategy','Branded Content'], 14, true, true, true)
on conflict (slug) do update set
  title          = excluded.title,
  intro          = excluded.intro,
  client         = excluded.client,
  publisher      = excluded.publisher,
  agency_partner = excluded.agency_partner,
  project_type   = excluded.project_type,
  role           = excluded.role,
  services       = excluded.services,
  service_category = excluded.service_category,
  services_list  = excluded.services_list,
  sort_order     = excluded.sort_order;
