/* =========================================================
   CMS-manifest — de tekstkaart van de hele site.

   Elke tekst op de site heeft een stabiele `key`. De editor én de
   runtime-loader gebruiken de `selector` om de bijbehorende HTML te
   vinden. De ORIGINELE tekst ("wat het nu is") staat NIET hier: die
   leest de editor live uit de pagina zelf.

   Veld-opties:
     mode: 'text'(default) | 'firstText' | 'lastText' | 'html' | 'placeholder' | 'virtual'
     group / groupLabel : bundel korte velden in één compacte kaart
     wide : dit veld in een groep is lang -> volle breedte
     default : baseline-tekst voor 'virtual'-velden
   ========================================================= */
(function () {
  const f = (key, label, selector, opts = {}) => ({ key, label, selector, mode: 'text', ...opts });
  // Bundel velden in een groep; eerste veld draagt de kop.
  const grp = (gid, title, fields) => {
    fields.forEach((x, i) => { x.group = gid; if (i === 0) x.groupLabel = title; });
    return fields;
  };

  // ---- Home: ervaring-rijen ----
  const homeExp = [];
  for (let i = 1; i <= 4; i++) {
    const row = `.about__inner > .about__info:nth-child(2) .about__row:nth-of-type(${i})`;
    homeExp.push(...grp(`home-exp-${i}`, `Werkervaring — rij ${i}`, [
      f(`home.about.exp${i}.role`,   'Rol',          `${row} h3:nth-of-type(1)`),
      f(`home.about.exp${i}.org`,    'Organisatie',  `${row} h3:nth-of-type(2)`),
      f(`home.about.exp${i}.period`, 'Periode',      `${row} h3:nth-of-type(3)`),
    ]));
  }
  // ---- Home: highlight-rijen ----
  const homeHl = [];
  for (let i = 1; i <= 4; i++) {
    const row = `.about__inner > .about__info:nth-child(3) .about__row:nth-of-type(${i})`;
    homeHl.push(...grp(`home-hl-${i}`, `Highlight — rij ${i}`, [
      f(`home.about.hl${i}.label`, 'Label',  `${row} h3:nth-of-type(1)`),
      f(`home.about.hl${i}.value`, 'Waarde', `${row} h3:nth-of-type(2)`),
    ]));
  }

  // ---- About: story-kaarten (kaart 2 en 4 hebben geen jaartal) ----
  const storyHasYear = { 1: true, 2: false, 3: true, 4: false, 5: true, 6: true, 7: true, 8: true };
  const storyFields = [];
  for (let i = 1; i <= 8; i++) {
    const card = `.ab-story__track > .ab-story__card:nth-of-type(${i})`;
    const fields = [];
    if (storyHasYear[i]) fields.push(f(`about.story.c${i}.year`, 'Jaar', `${card} .ab-story__year`));
    fields.push(
      f(`about.story.c${i}.phase`,   'Fase',         `${card} .ab-story__phase`),
      f(`about.story.c${i}.company`, 'Organisatie',  `${card} .ab-story__company`),
      f(`about.story.c${i}.role`,    'Rol',          `${card} .ab-story__role`),
      f(`about.story.c${i}.text`,    'Tekst',        `${card} .ab-story__text`, { wide: true }),
    );
    if (i === 3) fields.push(f('about.story.c3.text2', 'Tweede alinea', `${card} .ab-story__text + .ab-story__text`, { wide: true }));
    storyFields.push(...grp(`about-story-${i}`, `Story-kaart ${i}`, fields));
  }

  // ---- About: diensten (04) ----
  const serviceFields = [];
  for (let i = 1; i <= 5; i++) {
    const s = `.ab-services .ab-service:nth-of-type(${i})`;
    serviceFields.push(...grp(`about-serv-${i}`, `Dienst ${i}`, [
      f(`about.services.s${i}.title`, 'Titel', `${s} .ab-service__title`),
      f(`about.services.s${i}.text`,  'Tekst', `${s} .ab-service__text`, { wide: true }),
    ]));
  }

  // ---- About: ervaring (07) ----
  const aboutExp = [];
  for (let i = 1; i <= 8; i++) {
    const row = `[aria-label="Experience"] .ab-row:nth-of-type(${i})`;
    aboutExp.push(...grp(`about-exp-${i}`, `Werkervaring — rij ${i}`, [
      f(`about.exp.r${i}.year`,    'Jaar',         `${row} .ab-row__year`),
      f(`about.exp.r${i}.company`, 'Organisatie',  `${row} .ab-row__company`),
      f(`about.exp.r${i}.role`,    'Rol',          `${row} .ab-row__role`),
    ]));
  }
  // ---- About: erkenning (08) ----
  const aboutRec = [];
  for (let i = 1; i <= 2; i++) {
    const row = `[aria-label="Selected recognition"] .ab-row:nth-of-type(${i})`;
    aboutRec.push(...grp(`about-rec-${i}`, `Erkenning — rij ${i}`, [
      f(`about.rec.r${i}.year`,    'Jaar',  `${row} .ab-row__year`),
      f(`about.rec.r${i}.company`, 'Bron',  `${row} .ab-row__company`),
      f(`about.rec.r${i}.role`,    'Tekst', `${row} .ab-row__role`),
    ]));
  }
  // ---- About: featured & interviews (09) ----
  const featFields = [];
  for (let i = 1; i <= 9; i++) {
    const slide = `.ab-feat__track > .ab-feat__slide:nth-of-type(${i})`;
    featFields.push(...grp(`about-feat-${i}`, `Featured ${i}`, [
      f(`about.feat.s${i}.outlet`, 'Bron',        `${slide} .ab-feat__outlet`),
      f(`about.feat.s${i}.title`,  'Titel',       `${slide} .ab-feat__title`, { wide: true }),
      f(`about.feat.s${i}.desc`,   'Omschrijving',`${slide} .ab-feat__desc`, { wide: true }),
      f(`about.feat.s${i}.cta`,    'Knoptekst',   `${slide} .ab-feat__cta`, { href: true }),
    ]));
  }
  // ---- About: at a glance (10) ----
  const glanceFields = [];
  for (let i = 1; i <= 8; i++) {
    const stat = `.ab-glance .ab-stat:nth-of-type(${i})`;
    glanceFields.push(...grp(`about-glance-${i}`, `Blok ${i}`, [
      f(`about.glance.g${i}.big`,   'Cijfer / woord', `${stat} .ab-stat__big`),
      f(`about.glance.g${i}.label`, 'Label',          `${stat} .ab-stat__label`),
    ]));
  }
  // ---- About: FAQ (11) ----
  const faqFields = [];
  for (let i = 1; i <= 7; i++) {
    const item = `.ab-faq .ab-faq__item:nth-of-type(${i})`;
    faqFields.push(...grp(`about-faq-${i}`, `Vraag ${i}`, [
      f(`about.faq.q${i}.q`, 'Vraag',    `${item} .ab-faq__q`, { mode: 'firstText', wide: true }),
      f(`about.faq.q${i}.a`, 'Antwoord', `${item} .ab-faq__a`, { wide: true }),
    ]));
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
            f('home.aboutShort.label',     'Label',             '.about-v1__label'),
            f('home.aboutShort.highlight', 'Highlight-tekst',   '.about-v1__hl'),
            f('home.aboutShort.text',      'Paragraaf',         '.about-v1__text'),
            f('home.aboutShort.caption',   'Bijschrift foto’s', '.about-v1__caption'),
            f('home.aboutShort.cta',       'Knop',              '.about-v1__btm .btn-primary', { href: true }),
          ]},
          { label: 'Cases', fields: [
            f('home.work.title', 'Titel', '.work__title'),
            f('home.work.cta',   'Knop',  '.work [data-open-diensten]'),
          ]},
          { label: 'Over Armin (uitgebreid)', fields: [
            f('home.about.label', 'Label',              '.about__lead .about__label'),
            f('home.about.title', 'Highlight-statement','.about__title'),
            f('home.about.metaRole', 'Meta-regel', '.about__meta .about__meta-item:nth-of-type(1)', { mode: 'lastText' }),
            f('home.about.expLabel', 'Kop werkervaring', '.about__inner > .about__info:nth-child(2) .about__label'),
            ...homeExp,
            f('home.about.hlLabel', 'Kop highlights', '.about__inner > .about__info:nth-child(3) .about__label'),
            ...homeHl,
          ]},
          { label: 'Nieuwsbrief', fields: [
            f('home.newsletter.title',       'Titel',              '.newsletter__title'),
            f('home.newsletter.body',        'Tekst',              '.newsletter__body'),
            f('home.newsletter.placeholder', 'Placeholder invoer', '.newsletter__input', { mode: 'placeholder' }),
            f('home.newsletter.button',      'Knop',               '.newsletter__btn'),
          ]},
          { label: 'Cases-overlay', fields: [
            f('home.diensten.back', 'Terug-knop',  '.diensten__back'),
            f('home.diensten.hint', 'Scroll-hint', '.diensten__hint'),
          ]},
        ],
      },
      {
        id: 'about', label: 'About', file: 'about.html',
        sections: [
          { label: '01 — Opening', fields: [
            f('about.nav.back',     'Terug-link (bovenaan)', '.ab-header__back', { href: true }),
            f('about.hero.eyebrow', 'Label',        '.ab-hero__top .ab-eyebrow'),
            f('about.hero.title',   'Grote titel (gebruik <br> voor nieuwe regel)', '.ab-hero__big', { mode: 'html' }),
            f('about.hero.meta1', 'Meta', '.ab-hero__meta span:nth-of-type(1)'),
            ...grp('about-hero-intro', 'Intro', [
              f('about.hero.intro1', 'Alinea 1', '.ab-hero__intro .ab-copy:nth-of-type(1)', { wide: true }),
              f('about.hero.intro2', 'Alinea 2', '.ab-hero__intro .ab-copy:nth-of-type(2)', { wide: true }),
            ]),
          ]},
          { label: '02 — The story', fields: [
            f('about.story.eyebrow', 'Label', '.ab-story__head .ab-eyebrow'),
            ...storyFields,
          ]},
          { label: '03 — Conclusie', fields: [
            f('about.concl.statement', 'Statement', '[aria-label="What those worlds taught me"] .ab-statement'),
            ...grp('about-concl', 'Alinea’s', [
              f('about.concl.copy1', 'Alinea 1', '[aria-label="What those worlds taught me"] .ab-statement-copy .ab-copy:nth-of-type(1)', { wide: true }),
              f('about.concl.copy2', 'Alinea 2', '[aria-label="What those worlds taught me"] .ab-statement-copy .ab-copy:nth-of-type(2)', { wide: true }),
              f('about.concl.copy3', 'Alinea 3', '[aria-label="What those worlds taught me"] .ab-statement-copy .ab-copy:nth-of-type(3)', { wide: true }),
            ]),
          ]},
          { label: '04 — What I do', fields: [
            f('about.services.eyebrow', 'Label', '[data-services-sec] .ab-eyebrow'),
            f('about.services.intro',   'Intro', '[data-services-sec] .ab-wrap > .ab-copy'),
            ...serviceFields,
          ]},
          { label: '05 — Culture first', fields: [
            f('about.culture.statement', 'Statement', '[aria-label="Culture first"] .ab-statement'),
            ...grp('about-culture', 'Alinea’s', [
              f('about.culture.copy1', 'Alinea 1', '[aria-label="Culture first"] .ab-statement-copy .ab-copy:nth-of-type(1)', { wide: true }),
              f('about.culture.copy2', 'Alinea 2', '[aria-label="Culture first"] .ab-statement-copy .ab-copy:nth-of-type(2)', { wide: true }),
            ]),
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
            f('about.contact.cta',       'Knop',      '.ab-contact__cta', { href: true }),
          ]},
        ],
      },
      {
        id: 'case', label: 'Case-detail (labels)', file: 'case.html',
        note: 'De inhoud per case (naam, intro, tekst, metadata, media) beheer je bij Cases. Hier staan alleen de vaste labels die op elke case-pagina gelijk zijn.',
        sections: [
          { label: 'Vaste labels', fields: [
            ...grp('case-labels', 'Labels', [
              f('case.hero.label',   'Label boven titel',     null, { mode: 'virtual', default: 'Case' }),
              f('case.next.eyebrow', 'Label "volgende case"', null, { mode: 'virtual', default: 'Next case' }),
            ]),
          ]},
        ],
      },
      {
        id: 'footer', label: 'Footer (op alle pagina’s)', file: 'index.html',
        sections: [
          { label: 'Contact', fields: [
            f('footer.contactLabel', 'Kop',             '.contact__col:nth-of-type(1) .contact__label'),
            ...grp('footer-contact', 'Gegevens', [
              f('footer.email', 'E-mail (tekst)',  '.contact__col:nth-of-type(1) a:nth-of-type(1)', { href: true }),
              f('footer.phone', 'Telefoon (tekst)','.contact__col:nth-of-type(1) a:nth-of-type(2)', { href: true }),
            ]),
          ]},
          { label: 'Pagina’s', fields: [
            f('footer.pagesLabel', 'Kop', '.contact__col:nth-of-type(2) .contact__label'),
            ...grp('footer-nav', 'Links', [
              f('footer.nav1', 'Link 1', '.contact__col:nth-of-type(2) a:nth-of-type(1)', { href: true }),
              f('footer.nav2', 'Link 2', '.contact__col:nth-of-type(2) a:nth-of-type(2)', { href: true }),
              f('footer.nav3', 'Link 3', '.contact__col:nth-of-type(2) a:nth-of-type(3)', { href: true }),
              f('footer.nav4', 'Link 4', '.contact__col:nth-of-type(2) a:nth-of-type(4)', { href: true }),
            ]),
          ]},
          { label: 'Socials', fields: [
            f('footer.socialsLabel', 'Kop', '.contact__col:nth-of-type(3) .contact__label'),
            ...grp('footer-social', 'Links', [
              f('footer.social1', 'Social 1', '.contact__col:nth-of-type(3) a:nth-of-type(1)', { href: true }),
              f('footer.social2', 'Social 2', '.contact__col:nth-of-type(3) a:nth-of-type(2)', { href: true }),
              f('footer.social3', 'Social 3', '.contact__col:nth-of-type(3) a:nth-of-type(3)', { href: true }),
            ]),
          ]},
          { label: 'Gevestigd in', fields: [
            f('footer.basedLabel', 'Kop', '.contact__col:nth-of-type(4) .contact__label'),
            f('footer.basedName', 'Naam', '.contact__col:nth-of-type(4) p.contact__link:nth-of-type(2)'),
          ]},
          { label: 'Onderkant', fields: [
            ...grp('footer-bottom', 'Onderkant', [
              f('footer.copy',     'Copyright', '.contact__copy'),
              f('footer.wordmark', 'Woordmerk', '.contact__wordmark'),
            ]),
          ]},
        ],
      },
    ],
  };

  window.CMS_MANIFEST.allFields = window.CMS_MANIFEST.pages.flatMap(
    (p) => p.sections.flatMap((s) => s.fields.map((fld) => ({ ...fld, page: p.id })))
  );
})();
