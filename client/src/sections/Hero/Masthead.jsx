import { profile } from '../../data/content';

/* Magazine-cover masthead ("ARV'S PHOTOGRAPHY"): one masked span per letter so the
   hero timeline can slide each letter in and out. The camera overlaps its lower edge. */
export default function Masthead() {
  return (
    <div className="hero-word" aria-hidden="true">
      {profile.brand
        .toUpperCase()
        .split(' ')
        .map((word, w) => (
          <span key={word} className={`hw hw-${w + 1}`}>
            {[...word].map((ch, i) => (
              <span key={i} className={w === 1 ? 'ch it' : 'ch'}>
                {ch}
              </span>
            ))}
          </span>
        ))}
    </div>
  );
}
