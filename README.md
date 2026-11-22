# Arv’s Photography — Arvin’s portfolio

A scroll-driven portfolio for a photographer. A 3D DSLR orbits as you scroll, the view flies **into its viewfinder**, focus pulls, the shutter fires, and the shot "develops" from a negative into a print of the photographer. The project showcase follows.

```
Look  →  Focus  →  Capture  →  Develop  →  Work  →  Contact sheet  →  Commissions  →  Contact
```

## Stack

| Layer | Tools |
| --- | --- |
| UI | React 18 + Vite |
| 3D | three.js, @react-three/fiber, @react-three/drei (GLB with meshopt/WebP, Lightformer env, contact shadows) |
| Motion | GSAP 3 + ScrollTrigger (pinning, scrub, containerAnimation), Lenis smooth scroll |
| Server | Node + Express: `/api/contact` (validation, honeypot, rate limit; saves to `server/data/messages.json`), and serves the production build |

## Run it

```bash
npm run install:all   # installs root, client and server deps
npm run dev           # client → http://localhost:5173 , API → http://localhost:8787
```

Production:

```bash
npm run build         # builds client/dist
npm start             # Express serves the site + API on http://localhost:8787 (set PORT to change)
```

## Project structure

```
.
├── assets/
│   └── models/dslr_camera.web.glb     original 3D model (source; the site serves the copy in client/public)
├── client/                            the website (React + Vite)
│   ├── index.html
│   ├── public/                        served as-is
│   │   ├── images/                    photos (.webp) + thumbs/ (640px) + portrait-blur/-neg (generated)
│   │   └── models/                    3D model used by the site
│   └── src/
│       ├── main.jsx                   entry: base styles, smooth scroll, renders <App>
│       ├── App.jsx                    page layout: sections in scroll order + global overlays
│       ├── components/                reusable UI, one folder each (Component.jsx + Component.css)
│       │   ├── Nav/  Footer/  Preloader/  Cursor/  Lightbox/  Iris/
│       │   └── Line/                  masked text line for slide-up reveals
│       ├── sections/                  page sections, in scroll order
│       │   ├── Hero/                  pinned 3D story: Hero.jsx (timeline) + Masthead, Viewfinder,
│       │   │                          DevelopedPrint, SceneBoundary (no-WebGL fallback), Hero.css
│       │   ├── About/  Works/  ContactSheet/  Services/  Contact/
│       ├── three/                     WebGL camera
│       │   ├── CameraScene.jsx        canvas, lights, environment, 60fps driver
│       │   ├── CameraModel.jsx        the DSLR (materials, float, lens rings, click-to-shoot)
│       │   ├── CameraRig.jsx          scroll-driven camera that reads the shared `rig` state
│       │   └── mergeStaticMeshes.js   merges static parts into few draw calls
│       ├── lib/                       shared logic: scroll (Lenis), rig, fx (shutter/flash), sound, support
│       ├── data/content.js            ALL copy, projects, photos, name & brand
│       └── styles/                    base.css (tokens, reset, shared helpers) · effects.css
├── server/                            Node + Express
│   ├── index.js                       entry: starts the server
│   ├── src/
│   │   ├── app.js                     express app: API + serves client/dist
│   │   ├── config.js                  port, paths
│   │   ├── routes/contact.js          POST /api/contact (validation + saving)
│   │   └── middleware/rateLimit.js
│   └── data/                          messages.json (contact submissions, git-ignored)
└── tools/images.py                    regenerate thumbnails + portrait effects
```

**Styling convention:** each component imports its own stylesheet next to it. `styles/base.css` loads first (from `main.jsx`) and holds design tokens (`--ink`, `--paper`, `--red`, fonts), the reset and shared helpers (`.line`, `.btn`, `.sec-head`, `.sr-only`).

## Make it yours

- **Text, projects, stats, socials, name & brand** (`name`, `brand`, `brandShort`): `client/src/data/content.js`
- **Photos:** drop `.webp` files in `client/public/images/` and reference them by name in `content.js`.
  `portrait.webp` is the photographer shot shown in the viewfinder and on the print (3:2 landscape works best).
  The current images are Unsplash samples, used as placeholders.
  Then run **`npm run images`** (needs Python + `pip install pillow`). It rebuilds the 640px thumbnails and the portrait's blurred/negative versions used by the story.
- **3D model:** `client/public/models/dslr_camera.web.glb` (original kept in `assets/models/`).
  The viewfinder target point is set in `client/src/lib/rig.js` (`VIEWFINDER`).
- **Contact form:** messages are appended to `server/data/messages.json`. To email them instead, hook up a mail provider in `server/src/routes/contact.js`.

## Where the magic lives

- `client/src/sections/Hero/Hero.jsx`: the pinned scroll timeline (camera orbit, dolly into the eyepiece, viewfinder HUD, shutter, negative → print).
- `client/src/three/`: the 3D camera, lighting and the scroll-driven camera rig.
- `client/src/components/Iris/Iris.jsx`: SVG aperture blades used by the preloader and the desktop shutter.
- `client/src/sections/ContactSheet/ContactSheet.jsx`: film contact sheet with a magnifying loupe.

## Devices & browsers

Built and tested for iOS Safari, Android Chrome, and Windows/macOS desktop browsers, from 280px-wide phones (folded foldables) up to 3440px ultrawide monitors, in portrait and landscape:

- **Safe areas:** content stays clear of the iPhone notch, Dynamic Island and home indicator (`viewport-fit=cover` + `env(safe-area-inset-*)`).
- **No WebGL?** (iOS Lockdown Mode, managed devices, old GPUs) The 3D camera is skipped and the rest of the site works normally.
- **Touch devices:** native scrolling, a shorter story, a swipe carousel for the work, curtain-style shutter, no hover-only effects. Form inputs are 16px so iOS doesn't zoom in on focus.
- **Phones in landscape** and very short phones (iPhone SE) get compact layouts.

### Try it on your own phone

1. Connect the phone to the same Wi-Fi as this computer.
2. Run `npm run dev --prefix server` in one terminal and `npm run dev --prefix client -- --host` in another.
3. Vite prints a `Network:` address (e.g. `http://192.168.1.20:5173`). Open it on the phone.
   If it doesn't load, allow Node.js through the Windows firewall when prompted.
