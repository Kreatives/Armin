/* =========================================================
   Media-manifest — de foto's die ín een pagina zitten en die de
   klant mag vervangen. (NIET de aan cases gekoppelde media.)

   Elk item:
     key      stabiele sleutel (bv. "home.media.about1")
     label    weergavenaam in de editor
     selector CSS-selector naar het element op de pagina
     attr     'src' (<img>) of 'data-bg' (achtergrond die het script leest)
     section  sectie-label waar de foto bij hoort (voor inline weergave)
   ========================================================= */
(function () {
  const m = (key, label, selector, section, attr = 'src', group = null) => ({ key, label, selector, section, attr, group });

  // Story-achtergronden horen bij hun eigen story-kaart (groep about-story-N),
  // zodat de media in de editor naast de kaart staat i.p.v. onderaan de sectie.
  const storyBg = [];
  for (let i = 1; i <= 8; i++) {
    storyBg.push(m(`about.media.story${i}`, `Achtergrond`,
      `.ab-story__track > .ab-story__card:nth-of-type(${i})`, '02 — The story', 'data-bg', `about-story-${i}`));
  }
  const featImgs = [1, 2, 3, 4, 7, 8, 9].map((i) =>
    m(`about.media.feat${i}`, `Featured ${i}`,
      `.ab-feat__track > .ab-feat__slide:nth-of-type(${i}) .ab-feat__bg`, '09 — Featured & interviews', 'src'));

  window.CMS_MEDIA = {
    pages: {
      home: {
        label: 'Home',
        items: [
          m('home.media.about1',   'Foto links',   '.about-v1__imgs .about-v1__media:nth-of-type(1)', 'Over Armin (kort)'),
          m('home.media.about2',   'Foto rechts',  '.about-v1__imgs .about-v1__media:nth-of-type(2)', 'Over Armin (kort)'),
          m('home.media.portrait', 'Portret',      '.about__portrait img', 'Over Armin (uitgebreid)'),
        ],
      },
      about: {
        label: 'About',
        items: [
          m('about.media.hero', 'Hero-achtergrond', '.ab-hero__bg img', '01 — Opening'),
          ...storyBg,
          ...featImgs,
        ],
      },
    },
  };

  window.CMS_MEDIA.allItems = Object.entries(window.CMS_MEDIA.pages)
    .flatMap(([page, p]) => p.items.map((it) => ({ ...it, page })));
})();
