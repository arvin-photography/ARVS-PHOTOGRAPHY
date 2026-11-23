// Minimal line icons for the editor (24px grid, currentColor).
const PATHS = {
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  image: 'M4 5h16v14H4zM4 15l4.5-4.5 4 4L15 12l5 5M15.5 9.5h.01',
  swap: 'M4 8h12l-3-3M20 16H8l3 3',
  left: 'M15 6l-6 6 6 6',
  right: 'M9 6l6 6-6 6',
  up: 'M6 15l6-6 6 6',
  down: 'M6 9l6 6 6-6',
  undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 010 12h-3',
  redo: 'M15 14l5-5-5-5M20 9H10a6 6 0 000 12h3',
  external: 'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  check: 'M5 12.5l4.5 4.5L19 7',
  logout: 'M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11',
  github:
    'M12 3a9 9 0 00-2.85 17.54c.45.08.62-.2.62-.44v-1.6c-2.5.55-3.03-1.06-3.03-1.06-.41-1.04-1-1.32-1-1.32-.82-.56.06-.55.06-.55.9.07 1.38.93 1.38.93.8 1.38 2.11.98 2.62.75.08-.58.31-.98.57-1.2-2-.23-4.1-1-4.1-4.44 0-.98.35-1.78.93-2.41-.1-.23-.4-1.14.08-2.38 0 0 .76-.24 2.48.92a8.6 8.6 0 014.5 0c1.72-1.16 2.48-.92 2.48-.92.49 1.24.18 2.15.09 2.38.58.63.92 1.43.92 2.41 0 3.45-2.1 4.2-4.1 4.43.32.28.61.82.61 1.66v2.46c0 .24.16.53.62.44A9 9 0 0012 3z',
  star: 'M12 4l2.4 5 5.6.6-4.2 3.8 1.2 5.6L12 16.3 7 19l1.2-5.6L4 9.6 9.6 9z',
  link: 'M10 14a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1 1M14 10a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1-1',
  info: 'M12 8h.01M11 12h1v5h1M12 21a9 9 0 110-18 9 9 0 010 18z',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
  close: 'M6 6l12 12M18 6L6 18',
  grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
};

export default function Icon({ name, size = 18 }) {
  const filled = name === 'github';
  return (
    <svg
      className="ed-icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name] || ''} />
    </svg>
  );
}
