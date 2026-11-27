// ─────────────────────────────────────────────────────────────
//  All portfolio copy + imagery comes from the JSON files in
//  src/content/. The owner edits them at /admin (client/admin); this
//  file only shapes that data for the components.
// ─────────────────────────────────────────────────────────────
import profileData from '../content/profile.json';
import projectsData from '../content/projects.json';
import sheetData from '../content/contact-sheet.json';
import servicesData from '../content/services.json';
import videosData from '../content/videos.json';

const UPLOADS = '/images/uploads/';

// Photos uploaded at /admin land in /images/uploads/ at any size and format. The build
// (scripts/prepare.mjs) makes a web-sized WebP of each in /images/gen/, so pages use that.
export const web = (src = '') => (src.startsWith(UPLOADS) ? `/images/gen/${src.slice(UPLOADS.length)}.webp` : src);

// 640px versions (public/images/thumbs) for small frames — far cheaper to decode
export const thumb = (src) => src.replace('/images/', '/images/thumbs/');

const slug = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const profile = {
  greeting: 'Hi, I’m',
  ...profileData,
  portrait: web(profileData.portrait),
  // blurred + negative versions for the viewfinder / "develop" effect, generated at build
  portraitBlur: '/images/gen/portrait-blur.webp',
  portraitNeg: '/images/gen/portrait-neg.webp',
  aboutImage: web(profileData.aboutImage),
  socials: profileData.socials || [],
  stats: profileData.stats || [],
  kit: (profileData.kit || []).map((k) => [k.label, k.detail]),
};

export const projects = (projectsData.projects || []).map((p, i) => {
  const cover = web(p.cover);
  const gallery = (p.gallery || []).map(web);
  return { ...p, id: `${i}-${slug(p.title)}`, year: String(p.year ?? ''), cover, gallery: gallery.length ? gallery : [cover] };
});

// Section headings (editable at /admin). `accent` is the red italic part.
export const worksHeading = { line1: 'Stories told', start: 'in', accent: '1/250th', end: 'of a second', ...projectsData.heading };
export const sheetHeading = { line1: 'The contact', accent: 'sheet.', ...sheetData.heading };

// Films: video cards that look like a player. YouTube / Vimeo links play right on the site
// (in a viewer); other links (OneDrive, Google Drive …) open in a new tab. The section
// hides itself when the list is empty.

// youtube.com/watch?v=ID · youtu.be/ID · youtube.com/shorts|embed|live/ID
export const youtubeId = (link = '') => {
  const m = link.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/i);
  return m ? m[1] : '';
};
// vimeo.com/ID · vimeo.com/ID/HASH (unlisted) · player.vimeo.com/video/ID?h=HASH
const vimeoInfo = (link = '') => {
  const m = link.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/([\da-f]+))?/i);
  if (!m) return null;
  const h = m[2] || (link.match(/[?&]h=([\da-f]+)/i) || [])[1] || '';
  return { id: m[1], h };
};

const videoSource = (link) => {
  if (!link) return '';
  if (/onedrive|1drv\.ms|sharepoint\.com/i.test(link)) return 'OneDrive';
  if (/youtube|youtu\.be/i.test(link)) return 'YouTube';
  if (/vimeo\.com/i.test(link)) return 'Vimeo';
  if (/drive\.google\.com/i.test(link)) return 'Google Drive';
  return 'Watch';
};

// the player URL used inside the site's video viewer (null = open the link in a new tab)
const videoEmbed = (link) => {
  const yt = youtubeId(link);
  // privacy-enhanced YouTube: no YouTube cookies until the visitor presses play
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
  const vm = vimeoInfo(link);
  if (vm) return `https://player.vimeo.com/video/${vm.id}?autoplay=1&dnt=1&title=0&byline=0&portrait=0${vm.h ? `&h=${vm.h}` : ''}`;
  return null;
};

export const videosSection = {
  heading: { line1: 'Moving', accent: 'pictures.', ...videosData.heading },
  intro: videosData.intro ?? '',
};
export const videos = (videosData.videos || []).map((v) => {
  const link = (v.link || '').trim();
  const yt = youtubeId(link);
  return {
    ...v,
    link,
    source: videoSource(link),
    embed: videoEmbed(link),
    // no poster uploaded? YouTube videos fall back to their own thumbnail
    poster: v.poster ? web(v.poster) : yt ? `https://i.ytimg.com/vi/${yt}/maxresdefault.jpg` : '',
    posterFallback: yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : '',
  };
});

// The contact sheet: frames numbered from 12, like a roll already partly shot.
export const sheet = (sheetData.frames || []).map((src, i) => ({
  src: web(src),
  thumb: thumb(web(src)),
  n: 12 + i,
}));

export const services = (servicesData.services || []).map((s) => ({ ...s, image: web(s.image) }));

export const disciplines = servicesData.disciplines || [];
