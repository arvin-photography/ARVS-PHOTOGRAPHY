/* global __EDITOR_REPO__ */
// Where the portfolio content lives. The repository is filled in at build time from
// Vercel's git info (see vite.config.js), so it keeps working if the repo moves again.
export const REPO = typeof __EDITOR_REPO__ !== 'undefined' && __EDITOR_REPO__ ? __EDITOR_REPO__ : 'arvin-photography/ARVS-PHOTOGRAPHY';
export const BRANCH = 'main';

// one JSON file per part of the site (read by client/src/data/content.js)
export const FILES = {
  profile: 'client/src/content/profile.json',
  projects: 'client/src/content/projects.json',
  sheet: 'client/src/content/contact-sheet.json',
  services: 'client/src/content/services.json',
  videos: 'client/src/content/videos.json',
};

export const UPLOAD_URL = '/images/uploads/'; // how pages refer to uploaded photos
export const UPLOAD_DIR = 'client/public/images/uploads/'; // where they live in the repo

// On your own computer (npm run dev) the editor saves straight to the files instead.
const host = window.location.hostname;
export const IS_LOCAL = host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
