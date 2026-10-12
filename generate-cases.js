// Bouwt cases.js: metadata (handmatig) + media-lijsten (van schijf, gesorteerd).
// Draai met: node generate-cases.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Oriëntatie van een media-bestand bepalen (portret = hoger dan breed).
function orient(rel) {
  const abs = path.join(__dirname, rel);
  if (!fs.existsSync(abs)) return { src: rel, portrait: false };
  try {
    const out = execSync(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${abs}"`).toString().trim();
    const [w, h] = out.split('x').map(Number);
    return { src: rel, portrait: (h || 9) > (w || 16) };
  } catch { return { src: rel, portrait: false }; }
}

const CASES_DIR = path.join(__dirname, 'assets', 'cases');
const FALLBACK_COVER = 'assets/video/showreel.mp4';

// Volgorde op de homepage + alle metadata. Media wordt automatisch aangevuld.
const META = [
  { slug: 'kick-t-met', brand: "KICK 'T MET", title: "Kick 't Met", sub: 'Ziggo Sport talkshow',
    tags: ['Presentatie', 'Format'], client: 'Ziggo Sport', date: '2024', role: 'Host & Concept', services: 'Format & IP' },
  { slug: 'kick-t-met-on-tour', brand: "KICK 'T MET ON TOUR", title: "Kick 't Met — On Tour", sub: 'Ziggo Sport op locatie',
    tags: ['Presentatie', 'Football'], client: 'Ziggo Sport', date: '2024', role: 'Host & Concept', services: 'Format & IP' },
  { slug: 'kick-t-net', brand: "KICK 'T NET", title: "Kick 't Net", sub: 'Voetbalinterviews',
    tags: ['Host', 'Content'], client: 'Ziggo Sport', date: '2024', role: 'Host & Concept', services: 'Format & IP' },
  { slug: 'convo', brand: 'CONVO', title: 'CONVO', sub: 'Gesprekken over cultuur',
    tags: ['Host', 'Format'], client: 'CONVO', date: '2024', role: 'Founder, Creator & Host', services: 'Format & IP' },
  { slug: 'rabobank', brand: 'RABOBANK', title: 'Rabobank', sub: 'Merkcampagne',
    tags: ['Content', 'Video'], client: 'Rabobank', date: '2024', role: 'Creative & Host', services: 'Creative Direction & Production' },
  { slug: 'complex-puma', brand: 'COMPLEX × PUMA', title: 'Complex × Puma', sub: 'Merkcampagne',
    tags: ['Creative Direction', 'Video'], client: 'Puma', date: '2023', role: 'Creative Director', services: 'Creative Direction & Production' },
  { slug: 'red-bull-rap-champs', brand: 'RED BULL', title: 'Red Bull Rap Champs', sub: 'Hiphop-competitie',
    tags: ['Host', 'Content'], client: 'Red Bull', date: '2023', role: 'Host & Concept', services: 'Format & IP' },
  { slug: 'hot-ones', brand: 'HOT ONES', title: 'Hot Ones — KFC × Sprite', sub: 'Branded format',
    tags: ['Host', 'Format'], client: 'KFC × Sprite', date: '2024', role: 'Host', services: 'Creative Direction & Production' },
  { slug: 'g-shock', brand: 'G-SHOCK', title: 'Sneaker Shopping', sub: 'G-Shock branded serie',
    tags: ['Host', 'Content'], client: 'G-Shock', date: '2023', role: 'Host & Concept', services: 'Format & IP' },
  { slug: 'puma-creative-camp', brand: 'PUMA', title: 'Puma Creative Camp', sub: 'Community-event',
    tags: ['Host', 'Direction'], client: 'Puma', date: '2023', role: 'Host & Curator', services: 'Partnerships & Cultural Connections' },
  { slug: 'reebok', brand: 'REEBOK', title: 'Back to Classics', sub: 'Reebok-campagne',
    tags: ['Creative Direction', 'Video'], client: 'Reebok', date: '2022', role: 'Creative Director', services: 'Creative Direction & Production' },
  { slug: 'zalando', brand: 'ZALANDO', title: 'Zalando', sub: 'Fashion & cultuur',
    tags: ['Host', 'Content'], client: 'Zalando', date: '2024', role: 'Host', services: 'Partnerships & Cultural Connections' },
  { slug: 'adidas', brand: 'ADIDAS', title: 'adidas', sub: 'Social-serie',
    tags: ['Content', 'Social'], client: 'adidas', date: '2024', role: 'Creative & Host', services: 'Creative Direction & Production' },
  { slug: 'telfaz11', brand: 'TELFAZ11', title: 'Telfaz11', sub: 'Content-samenwerking',
    tags: ['Format', 'Video'], client: 'Telfaz11', date: '2024', role: 'Creative Consultant', services: 'Football & Culture Consultancy' },
  { slug: 'afcon', brand: 'AFCON', title: 'AFCON', sub: 'Voetbaltoernooi-content',
    tags: ['Host', 'Football'], client: 'Complex', date: '2024', role: 'Host & Analyst', services: 'Football & Culture Consultancy' },
  { slug: 'fifa', brand: 'FIFA', title: 'FIFA', sub: 'Gaming & voetbal',
    tags: ['Host', 'Content'], client: 'FIFA', date: '2023', role: 'Host', services: 'Football & Culture Consultancy' },
];

const SUMMARY = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Een campagne waar voetbal, hiphop en cultuur samenkomen, gebouwd rond een format dat blijft hangen. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

function mediaFor(slug) {
  const dir = path.join(CASES_DIR, slug);
  let images = [], videos = [];
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir).sort();
    images = files.filter(f => /\.webp$/i.test(f) && f !== 'poster.webp').map(f => `assets/cases/${slug}/${f}`);
    videos = files.filter(f => /\.mp4$/i.test(f)).map(f => `assets/cases/${slug}/${f}`);
  }
  return { images, videos };
}

const FALLBACK_POSTER = 'assets/video/showreel-poster.webp';
const isImg = s => /\.(webp|jpe?g|png)$/i.test(s);

function thumbFor(slug, cover) {
  if (isImg(cover)) return cover;                    // afbeelding-cover = thumb
  const poster = path.join(CASES_DIR, slug, 'poster.webp');
  if (fs.existsSync(poster)) return `assets/cases/${slug}/poster.webp`;
  return FALLBACK_POSTER;                             // video-cover zonder eigen poster
}

const out = META.map(m => {
  const { images, videos } = mediaFor(m.slug);
  const ordered = [...videos, ...images];            // VIDEO eerst -> cover speelt af op de kaart
  const coverSrc = ordered[0] || FALLBACK_COVER;     // eerste media = cover
  const cover = orient(coverSrc);                    // {src, portrait}
  const media = ordered.slice(1).map(orient);        // rest = body-media, met oriëntatie
  const thumb = thumbFor(m.slug, coverSrc);          // poster/afbeelding voor before-play
  const logoAbs = path.join(CASES_DIR, m.slug, 'logo.png');
  const logo = fs.existsSync(logoAbs) ? `assets/cases/${m.slug}/logo.png` : null;  // merk-logo (optioneel)
  return { ...m, summary: SUMMARY, cover, thumb, logo, media };
});

const banner = '/* AUTO-GEGENEREERD door generate-cases.js — niet handmatig bewerken. */\n';
fs.writeFileSync(
  path.join(__dirname, 'cases.js'),
  banner + 'window.CASES = ' + JSON.stringify(out, null, 2) + ';\n'
);
console.log('cases.js geschreven —', out.length, 'cases');
out.forEach(c => console.log(`  ${c.slug}: cover=${path.basename(c.cover.src)}${c.cover.portrait ? '(P)' : ''} +${c.media.length} media (${c.media.filter(m => m.portrait).length} portret)`));
