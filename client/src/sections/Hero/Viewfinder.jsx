import { profile } from '../../data/content';

// AF point layout (diamond pattern like an optical viewfinder)
const AF = [
  [50, 50], [38, 50], [62, 50], [26, 50], [74, 50], [50, 36], [50, 64],
  [38, 38], [62, 38], [38, 62], [62, 62], [26, 40], [74, 40], [26, 60], [74, 60],
];

/* The optical-viewfinder view (focus pull + exposure readout). Animated by the Hero timeline. */
export default function Viewfinder() {
  return (
    <div className="vf" aria-hidden="true">
      <div className="vf-stage">
        <div className="vf-frame">
          <img className="vf-photo" src={profile.portrait} alt="" />
          <img className="vf-blur" src="/images/portrait-blur.webp" alt="" />
          <div className="vf-dim" />
          <div className="vf-vignette" />
          <div className="vf-thirds" />
          <svg className="vf-af" viewBox="0 0 100 100" preserveAspectRatio="none">
            {AF.map(([x, y], i) => (
              <rect key={i} className={i === 0 ? 'af af-main' : 'af'} x={x - 1.4} y={y - 2.1} width="2.8" height="4.2" />
            ))}
          </svg>
          <div className="vf-circle" />
        </div>
        <div className="vf-hud">
          <span>M</span>
          <span>1/250</span>
          <span>F2.8</span>
          <span className="vf-meter">
            <i className="scale">-3··2··1··0··1··2··3+</i>
            <i className="needle" />
          </span>
          <span>ISO 100</span>
          <span>[ 36 ]</span>
          <span className="vf-dot">●</span>
        </div>
        <p className="vf-status">
          <span className="s1">Hold steady… finding focus</span>
          <span className="s2">Focus locked — keep scrolling to shoot</span>
        </p>
      </div>
    </div>
  );
}
