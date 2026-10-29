/* =========================================================
   CMS-manifest — de tekstkaart van de hele site.

   Elke tekst op de site heeft een stabiele `key`. De editor én de
   runtime-loader gebruiken de `selector` om de bijbehorende HTML te
   vinden. De ORIGINELE tekst ("wat het nu is") staat NIET hier: die
   leest de editor live uit de pagina zelf. Hier staat alleen waar elke
   tekst zit en hoe hij heet.

   Veld-opties:
     mode: 'text'       (default) — vervang de volledige tekst
           'firstText'  — vervang alleen het eerste tekst-deel (child-elementen blijven)
           'lastText'   — vervang alleen het laatste tekst-deel
           'html'       — tekst mag <br> bevatten (regel-einde)
           'placeholder'— het gaat om het placeholder-attribuut van een input
           'virtual'    — tekst wordt door JS gegenereerd (geen selector); `default` verplicht
     default: baseline-tekst voor 'virtual'-velden (case-detailpagina)
   ========================================================= */
(function () {
  const f = (key, label, selector, opts = {}) => ({ key, label, selector, mode: 'text', ...opts });

  // ---- Home: ervaring-rijen (rol / organisatie / periode) ----
  const homeExp = [];
  for (let i = 1; i <= 4; i++) {
    const row = `.about__inner > .about__info:nth-child(2) .about__row:nth-of-type(${i})`;
    homeExp.push(
      f(`home.about.exp${i}.role`,   `Rij ${i} — rol`,        `${row} h3:nth-of-type(1)`),
      f(`home.about.exp${i}.org`,    `Rij ${i} — organisatie`, `${row} h3:nth-of-type(2)`),
      f(`home.about.exp${i}.period`, `Rij ${i} — periode`,     `${row} h3:nth-of-type(3)`),
    );
  }
  // ---- Home: highlight-rijen (label / waarde) ----
  const homeHl = [];
  for (let i = 1; i <= 4; i++) {
    const row = `.about__inner > .about__info:nth-child(3) .about__row:nth-of-type(${i})`;
    homeHl.push(
      f(`home.about.hl${i}.label`, `Rij ${i} — label`,  `${row} h3:nth-of-type(1)`),
      f(`home.about.hl${i}.value`, `Rij ${i} — waarde`, `${row} h3:nth-of-type(2)`),
    );
  }

  // ---- About: story-kaarten (kaart 2 en 4 hebben geen jaartal) ----
  const storyHasYear = { 1: true, 2: false, 3: true, 4: false, 5: true, 6: true, 7: true, 8: true };
  const storyFields = [];
  for (let i = 1; i <= 8; i++) {
    const card = `.ab-story__track > .ab-story__card:nth-of-type(${i})`;
    if (storyHasYear[i]) storyFields.push(f(`about.story.c${i}.year`, `Kaart ${i} — jaar`, `${card} .ab-story__year`));
    storyFields.push(
      f(`about.story.c${i}.phase`,   `Kaart ${i} — fase`,        `${card} .ab-story__phase`),
      f(`about.story.c${i}.company`, `Kaart ${i} — organisatie`, `${card} .ab-story__company`),
      f(`about.story.c${i}.role`,    `Kaart ${i} — rol`,         `${card} .ab-story__role`),
      f(`about.story.c${i}.text`,    `Kaart ${i} — tekst`,       `${card} .ab-story__text`),
    );
  }
  storyFields.push(f('about.story.c3.text2', 'Kaart 3 — tweede alinea', '.ab-story__track > .ab-story__card:nth-of-type(3) .ab-story__text + .ab-story__text'));

  // ---- About: diensten (04) ----
  const serviceFields = [];
  for (let i = 1; i <= 5; i++) {
    const s = `.ab-services .ab-service:nth-of-type(${i})`;
    serviceFields.push(
      f(`about.services.s${i}.title`, `Dienst ${i} — titel`, `${s} .ab-service__title`),
      f(`about.services.s${i}.text`,  `Dienst ${i} — tekst`, `${s} .ab-service__text`),
    );
  }

  // ---- About: ervaring (07) ----
  const aboutExp = [];
  for (let i = 1; i <= 8; i++) {
    const row = `[aria-label="Experience"] .ab-row:nth-of-type(${i})`;
    aboutExp.push(
      f(`about.exp.r${i}.year`,    `Rij ${i} — jaar`,        `${row} .ab-row__year`),
      f(`about.exp.r${i}.company`, `Rij ${i} — organisatie`, `${row} .ab-row__company`),
      f(`about.exp.r${i}.role`,    `Rij ${i} — rol`,         `${row} .ab-row__role`),
    );
  }
  // ---- About: erkenning (08) ----
  const aboutRec = [];
  for (let i = 1; i <= 2; i++) {
    const row = `[aria-label="Selected recognition"] .ab-row:nth-of-type(${i})`;
    aboutRec.push(
      f(`about.rec.r${i}.year`,    `Rij ${i} — jaar`,   `${row} .ab-row__year`),
      f(`about.rec.r${i}.company`, `Rij ${i} — bron`,   `${row} .ab-row__company`),
      f(`about.rec.r${i}.role`,    `Rij ${i} — tekst`,  `${row} .ab-row__role`),
    );
  }
  // ---- About: featured & interviews (09) ----
  const featFields = [];
  for (let i = 1; i <= 9; i++) {
    const slide = `.ab-feat__track > .ab-feat__slide:nth-of-type(${i})`;
    featFields.push(
      f(`about.feat.s${i}.outlet`, `Item ${i} — bron`,        `${slide} .ab-feat__outlet`),
      f(`about.feat.s${i}.title`,  `Item ${i} — titel`,       `${slide} .ab-feat__title`),
      f(`about.feat.s${i}.desc`,   `Item ${i} — omschrijving`,`${slide} .ab-feat__desc`),
      f(`about.feat.s${i}.cta`,    `Item ${i} — knoptekst`,   `${slide} .ab-feat__cta`),
    );
  }
  // ---- About: at a glance (10) ----
  const glanceFields = [];
  for (let i = 1; i <= 8; i++) {
    const stat = `.ab-glance .ab-stat:nth-of-type(${i})`;
    glanceFields.push(
      f(`about.glance.g${i}.big`,   `Blok ${i} — cijfer/woord`, `${stat} .ab-stat__big`),
      f(`about.glance.g${i}.label`, `Blok ${i} — label`,        `${stat} .ab-stat__label`),
    );
  }
  // ---- About: FAQ (11) ----
  const faqFields = [];
  for (let i = 1; i <= 7; i++) {
    const item = `.ab-faq .ab-faq__item:nth-of-type(${i})`;
    faqFields.push(
      f(`about.faq.q${i}.q`, `Vraag ${i}`,     `${item} .ab-faq__q`, { mode: 'firstText' }),
      f(`about.faq.q${i}.a`, `Antwoord ${i}`,  `${item} .ab-faq__a`),
    );
  }

  const LOREM1 = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';
  const LOREM2 = 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt.';
  const LOREM3 = 'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.';
  const LOREM4 = 'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.';
  const LOREM5 = 'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.';
  const LOREM6 = 'Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat.';

  window.CMS_MANIFEST = {
    pages: [
      {
        id: 'home', label: 'Home', file: 'index.html',
        sections: [
          { label: 'Hero', fields: [
            f('home.hero.title', 'Grote titel', '.hero__title'),
            f('home.hero.body',  'Introzin',    '.hero__body'),
          ]},
          { label: 'Over Armin (kort)', fields: [
            f('home.aboutShort.label',     'Label',               '.about-v1__label'),
            f('home.aboutShort.highlight', 'Highlight-tekst',     '.about-v1__hl'),
            f('home.aboutShort.text',      'Paragraaf',           '.about-v1__text'),
            f('home.aboutShort.caption',   'Bijschrift foto’s',   '.about-v1__caption'),
            f('home.aboutShort.cta',       'Knop',                '.about-v1__btm .btn-primary'),
          ]},
          { label: 'Cases', fields: [
            f('home.work.title', 'Titel', '.work__title'),
            f('home.work.cta',   'Knop',  '.work [data-open-diensten]'),
          ]},
          { label: 'Over Armin (uitgebreid)', fields: [
            f('home.about.label',   'Label',             '.about__lead .about__label'),
            f('home.about.title',   'Highlight-statement','.about__title'),
            f('home.about.metaRole','Meta — rol',        '.about__meta .about__meta-item:nth-of-type(1)', { mode: 'lastText' }),
            f('home.about.metaLoc', 'Meta — locatie',    '.about__meta .about__meta-item:nth-of-type(2)'),
            f('home.about.expLabel','Kop ervaring',      '.about__inner > .about__info:nth-child(2) .about__label'),
            ...homeExp,
            f('home.about.hlLabel', 'Kop highlights',    '.about__inner > .about__info:nth-child(3) .about__label'),
            ...homeHl,
          ]},
          { label: 'Nieuwsbrief', fields: [
            f('home.newsletter.title',       'Titel',               '.newsletter__title'),
            f('home.newsletter.body',        'Tekst',               '.newsletter__body'),
            f('home.newsletter.placeholder', 'Placeholder invoer',  '.newsletter__input', { mode: 'placeholder' }),
            f('home.newsletter.button',      'Knop',                '.newsletter__btn'),
          ]},
          { label: 'Cases-overlay', fields: [
            f('home.diensten.back', 'Terug-knop', '.diensten__back'),
            f('home.diensten.hint', 'Scroll-hint','.diensten__hint'),
          ]},
        ],
      },
      {
        id: 'about', label: 'About', file: 'about.html',
        sections: [
          { label: '01 — Opening', fields: [
            f('about.hero.eyebrow', 'Label',        '.ab-hero__top .ab-eyebrow'),
            f('about.hero.title',   'Grote titel (gebruik <br> voor nieuwe regel)', '.ab-hero__big', { mode: 'html' }),
            f('about.hero.meta1',   'Meta links',   '.ab-hero__meta span:nth-of-type(1)'),
            f('about.hero.meta2',   'Meta rechts',  '.ab-hero__meta span:nth-of-type(2)'),
            f('about.hero.intro1',  'Intro alinea 1','.ab-hero__intro .ab-copy:nth-of-type(1)'),
            f('about.hero.intro2',  'Intro alinea 2','.ab-hero__intro .ab-copy:nth-of-type(2)'),
          ]},
          { label: '02 — The story', fields: [
            f('about.story.eyebrow', 'Label', '.ab-story__head .ab-eyebrow'),
            ...storyFields,
          ]},
          { label: '03 — Conclusie', fields: [
            f('about.concl.statement', 'Statement', '[aria-label="What those worlds taught me"] .ab-statement'),
            f('about.concl.copy1', 'Alinea 1', '[aria-label="What those worlds taught me"] .ab-statement-copy .ab-copy:nth-of-type(1)'),
            f('about.concl.copy2', 'Alinea 2', '[aria-label="What those worlds taught me"] .ab-statement-copy .ab-copy:nth-of-type(2)'),
            f('about.concl.copy3', 'Alinea 3', '[aria-label="What those worlds taught me"] .ab-statement-copy .ab-copy:nth-of-type(3)'),
          ]},
          { label: '04 — What I do', fields: [
            f('about.services.eyebrow', 'Label', '[data-services-sec] .ab-eyebrow'),
            f('about.services.intro',   'Intro', '[data-services-sec] .ab-wrap > .ab-copy'),
            ...serviceFields,
          ]},
          { label: '05 — Culture first', fields: [
            f('about.culture.statement', 'Statement', '[aria-label="Culture first"] .ab-statement'),
            f('about.culture.copy1', 'Alinea 1', '[aria-label="Culture first"] .ab-statement-copy .ab-copy:nth-of-type(1)'),
            f('about.culture.copy2', 'Alinea 2', '[aria-label="Culture first"] .ab-statement-copy .ab-copy:nth-of-type(2)'),
          ]},
          { label: '06 — Partners', fields: [
            f('about.partners.eyebrow', 'Label', '.ab-partners .ab-eyebrow'),
            f('about.partners.intro',   'Intro', '.ab-partners__intro'),
          ]},
          { label: '07 — Experience', fields: [
            f('about.exp.eyebrow', 'Label', '[aria-label="Experience"] .ab-eyebrow'),
            ...aboutExp,
          ]},
          { label: '08 — Recognition', fields: [
            f('about.rec.eyebrow', 'Label', '[aria-label="Selected recognition"] .ab-eyebrow'),
            ...aboutRec,
          ]},
          { label: '09 — Featured & interviews', fields: [
            f('about.feat.eyebrow', 'Label', '#featured .ab-eyebrow'),
            f('about.feat.intro',   'Intro', '#featured .ab-feat__head .ab-copy'),
            ...featFields,
          ]},
          { label: '10 — At a glance', fields: [
            f('about.glance.eyebrow', 'Label', '#glance .ab-eyebrow'),
            ...glanceFields,
          ]},
          { label: '11 — FAQ', fields: [
            f('about.faq.eyebrow', 'Label', '#faq .ab-eyebrow'),
            ...faqFields,
          ]},
          { label: '12 — Contact', fields: [
            f('about.contact.statement', 'Statement', '.ab-contact .ab-statement'),
            f('about.contact.cta',       'Knop',      '.ab-contact__cta'),
          ]},
        ],
      },
      {
        id: 'case', label: 'Case-detail (algemene teksten)', file: 'case.html',
        note: 'Deze teksten zijn gelijk op elke case-pagina. De titel, samenvatting en metadata per case beheer je bij Cases.',
        sections: [
          { label: 'Vaste onderdelen', fields: [
            f('case.hero.label',   'Label boven titel', null, { mode: 'virtual', default: 'Case' }),
            f('case.next.eyebrow', 'Label "volgende case"', null, { mode: 'virtual', default: 'Next case' }),
          ]},
          { label: 'Sectie 01', fields: [
            f('case.s1.title', 'Titel', null, { mode: 'virtual', default: 'The brief' }),
            f('case.s1.p1', 'Alinea 1', null, { mode: 'virtual', default: LOREM1 }),
            f('case.s1.p2', 'Alinea 2', null, { mode: 'virtual', default: LOREM2 }),
          ]},
          { label: 'Sectie 02', fields: [
            f('case.s2.title', 'Titel', null, { mode: 'virtual', default: 'The approach' }),
            f('case.s2.p1', 'Alinea 1', null, { mode: 'virtual', default: LOREM3 }),
            f('case.s2.p2', 'Alinea 2', null, { mode: 'virtual', default: LOREM4 }),
          ]},
          { label: 'Citaat', fields: [
            f('case.quote.text', 'Citaat', null, { mode: 'virtual', default: 'Football is the language, culture is the story' }),
            f('case.quote.cite', 'Bron',   null, { mode: 'virtual', default: '— Armin Shah' }),
          ]},
          { label: 'Sectie 03', fields: [
            f('case.s3.title', 'Titel', null, { mode: 'virtual', default: 'The result' }),
            f('case.s3.p1', 'Alinea 1', null, { mode: 'virtual', default: LOREM5 }),
            f('case.s3.p2', 'Alinea 2', null, { mode: 'virtual', default: LOREM6 }),
          ]},
        ],
      },
      {
        id: 'footer', label: 'Footer (op alle pagina’s)', file: 'index.html',
        sections: [
          { label: 'Contact', fields: [
            f('footer.contactLabel', 'Kop',            '.contact__col:nth-of-type(1) .contact__label'),
            f('footer.email',        'E-mail (tekst)', '.contact__col:nth-of-type(1) a:nth-of-type(1)'),
            f('footer.phone',        'Telefoon (tekst)','.contact__col:nth-of-type(1) a:nth-of-type(2)'),
          ]},
          { label: 'Pagina’s', fields: [
            f('footer.pagesLabel', 'Kop',  '.contact__col:nth-of-type(2) .contact__label'),
            f('footer.nav1', 'Link 1', '.contact__col:nth-of-type(2) a:nth-of-type(1)'),
            f('footer.nav2', 'Link 2', '.contact__col:nth-of-type(2) a:nth-of-type(2)'),
            f('footer.nav3', 'Link 3', '.contact__col:nth-of-type(2) a:nth-of-type(3)'),
            f('footer.nav4', 'Link 4', '.contact__col:nth-of-type(2) a:nth-of-type(4)'),
          ]},
          { label: 'Socials', fields: [
            f('footer.socialsLabel', 'Kop',  '.contact__col:nth-of-type(3) .contact__label'),
            f('footer.social1', 'Social 1', '.contact__col:nth-of-type(3) a:nth-of-type(1)'),
            f('footer.social2', 'Social 2', '.contact__col:nth-of-type(3) a:nth-of-type(2)'),
            f('footer.social3', 'Social 3', '.contact__col:nth-of-type(3) a:nth-of-type(3)'),
          ]},
          { label: 'Gevestigd in', fields: [
            f('footer.basedLabel', 'Kop',      '.contact__col:nth-of-type(4) .contact__label'),
            f('footer.basedName',  'Naam',     '.contact__col:nth-of-type(4) p.contact__link:nth-of-type(2)'),
            f('footer.basedLoc',   'Locatie',  '.contact__col:nth-of-type(4) p.contact__link:nth-of-type(3)'),
          ]},
          { label: 'Onderkant', fields: [
            f('footer.copy',     'Copyright', '.contact__copy'),
            f('footer.wordmark', 'Woordmerk', '.contact__wordmark'),
          ]},
        ],
      },
    ],
  };

  // Platte lijst van alle velden (handig voor de runtime-loader).
  window.CMS_MANIFEST.allFields = window.CMS_MANIFEST.pages.flatMap(
    p => p.sections.flatMap(s => s.fields.map(fld => ({ ...fld, page: p.id })))
  );
})();
