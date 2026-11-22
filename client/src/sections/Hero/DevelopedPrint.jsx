import Line from '../../components/Line/Line';
import { profile } from '../../data/content';

/* After the shutter: the darkroom negative that develops into a print of the photographer. */
export default function DevelopedPrint() {
  return (
    <div className="dev">
      <div className="dev-grid">
        <figure className="print">
          <div className="paper" />
          <div className="print-img">
            <img className="dev-photo" src={profile.portrait} alt={`Portrait of ${profile.name}, the photographer`} />
            <img className="dev-neg" src="/images/portrait-neg.webp" alt="" aria-hidden="true" />
          </div>
          <figcaption className="dev-caption">{profile.portraitCaption}</figcaption>
        </figure>
        <div className="dev-copy">
          <p className="dev-kicker"><Line>( The one behind the lens )</Line></p>
          <h2 className="dev-name">
            <Line>Hi, I&rsquo;m</Line>
            <Line><em>{profile.name}.</em></Line>
          </h2>
          <p className="dev-lede">
            <Line>{profile.lede}</Line>
          </p>
          <p className="dev-scroll"><Line>Scroll ↓</Line></p>
        </div>
      </div>
    </div>
  );
}
