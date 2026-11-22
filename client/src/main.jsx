// Base styles must be imported first: every component stylesheet builds on them,
// and Vite emits CSS in import order.
import './styles/base.css';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { initLenis } from './lib/scroll';

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

// smooth scroll exists before any component mounts; held until the preloader finishes
initLenis().stop();

createRoot(document.getElementById('root')).render(<App />);
