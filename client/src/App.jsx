import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Preloader from './components/Preloader/Preloader';
import Cursor from './components/Cursor/Cursor';
import Nav from './components/Nav/Nav';
import Hero from './sections/Hero/Hero';
import About from './sections/About/About';
import Works from './sections/Works/Works';
import Films from './sections/Films/Films';
import ContactSheet from './sections/ContactSheet/ContactSheet';
import Services from './sections/Services/Services';
import Contact from './sections/Contact/Contact';
import Footer from './components/Footer/Footer';
import Lightbox from './components/Lightbox/Lightbox';
import Iris from './components/Iris/Iris';
import { fx } from './lib/fx';
import { getLenis } from './lib/scroll';
import './styles/effects.css';

export default function App() {
  const [intro, setIntro] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const shutterIris = useRef();
  const flash = useRef();
  const curtains = useRef();

  useEffect(() => {
    fx.iris = shutterIris.current;
    fx.flash = flash.current;
    fx.curtains = curtains.current;
    // layout may shift once webfonts arrive
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  const onDone = useCallback(() => {
    setLoaded(true);
    setTimeout(() => {
      getLenis()?.start();
      ScrollTrigger.refresh();
    }, 500);
  }, []);

  return (
    <>
      <Preloader onReveal={() => setIntro(true)} onDone={onDone} />
      <Cursor />
      <Nav />
      <main className={loaded ? 'is-loaded' : ''}>
        <Hero introPlay={intro} />
        <About />
        <Works onOpen={setLightbox} />
        <Films />
        <ContactSheet onOpen={setLightbox} />
        <Services />
        <Contact />
      </main>
      <Footer />
      {lightbox && <Lightbox data={lightbox} onClose={() => setLightbox(null)} />}
      <Iris ref={shutterIris} className="shutter-iris" id="sh-iris" initial={1} />
      <div className="shutter-curtains" ref={curtains} aria-hidden="true">
        <i />
        <i />
      </div>
      <div className="shot-flash" ref={flash} />
    </>
  );
}
