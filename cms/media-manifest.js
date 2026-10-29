/* =========================================================
   Media-manifest — de foto's die ín een pagina zitten en die de
   klant mag vervangen. (NIET de aan cases gekoppelde media.)

   Elk item:
     key      stabiele sleutel (bv. "home.media.about1")
     label    weergavenaam in de editor
     selector CSS-selector naar het element op de pagina
     attr     welk attribuut de afbeelding draagt:
              'src'    -> een <img>
              'data-bg'-> achtergrond die het pagina-script leest
   ========================================================= */
(function () {
  const m = (key, label, selector, attr = 'src') => ({ key, label, selector, attr });

  // ---- About: story-kaart achtergronden ----
  const storyBg = [];
  for (let i = 1; i <= 8; i++) {
    storyBg.push(m(`about.media.story${i}`, `Story-kaart ${i} — achtergrond`,
      `.ab-story__track > .ab-story__card:nth-of-type(${i})`, 'data-bg'));
  }
  // ---- About: featured foto's (sloten 5 & 6 zijn YouTube -> overslaan) ----
  const featImgs = [1, 2, 3, 4, 7, 8, 9].map((i) =>
    m(`about.media.feat${i}`, `Featured ${i} — foto`,
      `.ab-feat__track > .ab-feat__slide:nth-of-type(${i}) .ab-feat__bg`, 'src'));

  window.CMS_MEDIA = {
    pages: {
      home: {
        label: 'Home',
        items: [
          m('home.media.about1',   'Over Armin — foto links',  '.about-v1__imgs .about-v1__media:nth-of-type(1)'),
          m('home.media.about2',   'Over Armin — foto rechts', '.about-v1__imgs .about-v1__media:nth-of-type(2)'),
          m('home.media.portrait', 'Portret (uitgebreid blok)','.about__portrait img'),
        ],
      },
      about: {
        label: 'About',
        items: [
          m('about.media.hero', 'Hero — achtergrondfoto', '.ab-hero__bg img'),
          ...storyBg,
          ...featImgs,
        ],
      },
    },
  };

  // Platte lijst voor de runtime-loader.
  window.CMS_MEDIA.allItems = Object.entries(window.CMS_MEDIA.pages)
    .flatMap(([page, p]) => p.items.map((it) => ({ ...it, page })));
})();
