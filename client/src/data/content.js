// ─────────────────────────────────────────────────────────────
//  All portfolio copy + imagery lives here. Swap the sample
//  photos in /public/images and edit text without touching UI.
// ─────────────────────────────────────────────────────────────

export const img = (name) => `/images/${name}.webp`;
// 640px versions (public/images/thumbs) for small frames — far cheaper to decode
export const thumb = (src) => src.replace('/images/', '/images/thumbs/');

export const profile = {
  name: 'Arvin', // the photographer
  brand: 'Arv’s Photography', // the studio name (masthead, nav, titles)
  brandShort: 'Arv’s',
  role: 'Photographer & Visual Storyteller',
  since: 2014,
  portrait: img('portrait'),
  portraitCaption: 'Frame 001 — Self-portrait, 2026 · 35mm · f/1.8 · 1/250s',
  lede: 'I photograph the quiet seconds between moments — people, places, and the light that ties them together.',
  statement:
    'For twelve years I have chased the same thing: the half-second where light, gesture and place line up and something true slips through the shutter. I work slowly, shoot fast and edit without mercy. Portraits, landscapes, editorial — honest frames, never staged to death.',
  email: 'hello@arv.studio',
  location: 'Available worldwide',
  availability: 'Booking commissions for 2027',
  socials: [
    { label: 'Instagram', href: '#' },
    { label: 'Behance', href: '#' },
    { label: 'LinkedIn', href: '#' },
    { label: 'Vimeo', href: '#' },
  ],
  stats: [
    { value: 12, suffix: '', label: 'Years behind the lens' },
    { value: 41, suffix: '', label: 'Countries photographed' },
    { value: 180, suffix: '+', label: 'Commissions delivered' },
    { value: 9, suffix: '', label: 'International awards' },
  ],
  kit: [
    ['Bodies', 'Full-frame mirrorless ×2 · 6×7 medium-format film'],
    ['Glass', '24–70 f/2.8 · 35 f/1.4 · 85 f/1.2 · 100–400'],
    ['Light', 'Two battery strobes, one big octa, a lot of patience'],
    ['Edit', 'Raw developer, colour-managed monitor, darkroom habits'],
  ],
};

export const projects = [
  {
    id: 'glass-lake',
    title: 'Glass Lake',
    category: 'Landscape',
    location: 'Dolomites, Italy',
    year: '2025',
    cover: img('glass-lake'),
    blurb: 'Four dawns waiting for zero wind. On the fifth, the lake held its breath.',
    gallery: ['glass-lake', 'moraine', 'yosemite', 'falls'],
  },
  {
    id: 'faces',
    title: 'Faces of Strangers',
    category: 'Portrait',
    location: 'Twelve cities',
    year: '2025',
    cover: img('stranger'),
    blurb: 'One question, one frame, no retakes. A year-long series of portraits made in under a minute.',
    gallery: ['stranger', 'noir', 'violet', 'hat', 'rose', 'red-dress', 'blue-wall'],
  },
  {
    id: 'steel-canyons',
    title: 'Steel Canyons',
    category: 'Urban',
    location: 'New York, USA',
    year: '2024',
    cover: img('steel-canyon'),
    blurb: 'Cities as landscapes — light falling down glass cliffs at seven in the morning.',
    gallery: ['steel-canyon', 'skyline', 'thames', 'westminster', 'paris'],
  },
  {
    id: 'night-ridge',
    title: 'Night Ridge',
    category: 'Astro',
    location: 'Southern Alps',
    year: '2024',
    cover: img('night-ridge'),
    blurb: 'Thirty-second exposures, minus twelve degrees, and a sky that does not care.',
    gallery: ['night-ridge', 'above-clouds', 'ridge-shooter'],
  },
  {
    id: 'mist-valley',
    title: 'Mist Valley',
    category: 'Landscape',
    location: 'Pacific Northwest',
    year: '2023',
    cover: img('mist-valley'),
    blurb: 'Rainforest in a cloud. Shot almost entirely in the blue hour, almost entirely soaked.',
    gallery: ['mist-valley', 'fog-pines', 'deep-woods', 'bridge'],
  },
  {
    id: 'green-spiral',
    title: 'The Green Spiral',
    category: 'Fine Art',
    location: 'Isle of Skye, UK',
    year: '2023',
    cover: img('fairy-glen'),
    blurb: 'Land art, low sun and a long walk back in the dark.',
    gallery: ['fairy-glen', 'valley', 'road', 'poppies'],
  },
].map((p) => ({ ...p, gallery: p.gallery.map(img) }));

// The contact sheet: 24 frames.
export const sheet = [
  'yosemite', 'falls', 'deep-woods', 'bridge', 'valley', 'skyline',
  'fog-pines', 'poppies', 'red-dress', 'paris', 'westminster', 'thames',
  'blue-wall', 'noir', 'rose', 'violet', 'hat', 'road',
  'tabby', 'ridge-shooter', 'above-clouds', 'moraine', 'portrait-alt', 'mist-valley',
].map((name, i) => ({
  src: img(name),
  thumb: thumb(img(name)),
  n: 12 + i,
}));

export const services = [
  {
    title: 'Portraiture',
    desc: 'Personal, author and executive portraits — on location or in studio.',
    meta: 'Half day / full day',
    image: img('violet'),
  },
  {
    title: 'Editorial & Brand',
    desc: 'Campaigns and stories for magazines, labels and hospitality.',
    meta: 'Per project',
    image: img('steel-canyon'),
  },
  {
    title: 'Landscape & Travel',
    desc: 'Commissioned expeditions, tourism boards and fine-art editions.',
    meta: 'Expedition rate',
    image: img('moraine'),
  },
  {
    title: 'Weddings & Events',
    desc: 'Documentary coverage for a small number of couples each year.',
    meta: 'Limited dates',
    image: img('red-dress'),
  },
];

export const disciplines = ['Portraits', 'Editorial', 'Landscapes', 'Weddings', 'Commercial', 'Travel', 'Astro', 'Fine Art'];
