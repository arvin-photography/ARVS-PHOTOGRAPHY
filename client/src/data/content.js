// ─────────────────────────────────────────────────────────────
//  All portfolio copy + imagery comes from the JSON files in
//  src/content/. The owner edits them at /admin (client/admin); this
//  file only shapes that data for the components.
// ─────────────────────────────────────────────────────────────
import profileData from '../content/profile.json';
import projectsData from '../content/projects.json';
import sheetData from '../content/contact-sheet.json';
import servicesData from '../content/services.json';

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

// The contact sheet: frames numbered from 12, like a roll already partly shot.
export const sheet = (sheetData.frames || []).map((src, i) => ({
  src: web(src),
  thumb: thumb(web(src)),
  n: 12 + i,
}));

export const services = (servicesData.services || []).map((s) => ({ ...s, image: web(s.image) }));

export const disciplines = servicesData.disciplines || [];
