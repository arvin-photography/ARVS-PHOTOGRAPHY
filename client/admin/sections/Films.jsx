import Icon from '../components/Icon';
import { EditableImage, EditableText, ItemTools, SecHead, pad } from '../components/Editable';
import { moveItem, removeItem } from '../lib/store';

// "onedrive.live.com/…" → "https://onedrive.live.com/…"
const normalizeLink = (v) => (!v || /^https?:\/\//i.test(v) ? v : `https://${v}`);

// same rules as the site (client/src/data/content.js)
const youtubeId = (link = '') => {
  const m = link.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/i);
  return m ? m[1] : '';
};
const playsOnSite = (link = '') => Boolean(youtubeId(link)) || /vimeo\.com\/(?:video\/)?\d+/i.test(link);

const sourceOf = (link) => {
  if (!link) return '';
  if (/onedrive|1drv\.ms|sharepoint\.com/i.test(link)) return 'OneDrive';
  if (/youtube\.com|youtu\.be/i.test(link)) return 'YouTube';
  if (/vimeo\.com/i.test(link)) return 'Vimeo';
  if (/drive\.google\.com/i.test(link)) return 'Google Drive';
  return 'Link';
};

export default function Films({ data, set, update }) {
  const videos = data.videos?.videos || [];
  const heading = { line1: 'Moving', accent: 'pictures.', ...data.videos?.heading };
  const setHeading = (key, v) => set(['videos', 'heading'], { ...heading, [key]: v });
  const list = ['videos', 'videos'];

  return (
    <div className="ed-site ed-films">
      <SecHead n="03" title="Films">
        {pad(videos.length)} {videos.length === 1 ? 'reel' : 'reels'}
      </SecHead>
      <div className="ed-films-titlerow">
        <h2 className="ed-films-title">
          <EditableText value={heading.line1} onChange={(v) => setHeading('line1', v)} label="Heading, line 1" />
          <em>
            <EditableText value={heading.accent} onChange={(v) => setHeading('accent', v)} label="Heading, red italic line" />
          </em>
        </h2>
        <EditableText
          as="p"
          value={data.videos?.intro}
          onChange={(v) => set(['videos', 'intro'], v)}
          label="Intro text"
          multiline
          optional
          className="ed-films-intro"
          placeholder="A sentence about your films (optional)"
        />
      </div>

      <div className="ed-films-help">
        <Icon name="info" size={16} />
        <span>
          <b>Best: YouTube.</b> Upload the video to YouTube and set Visibility to <b>Unlisted</b> (it won't appear in search). Then press <b>Share → Copy</b> and paste the link under the video below. It then <b>plays right on your site</b>, and its YouTube thumbnail is used as the poster unless you upload your own. Vimeo links also play on the site (add a poster). A OneDrive share link (“Anyone with the link can view”) works too, but opens OneDrive in a new tab.
        </span>
      </div>

      <div className="ed-films-grid">
        {videos.map((v, i) => {
          const base = [...list, i];
          const f = (key) => ({ value: v[key], onChange: (val) => set([...base, key], val) });
          const src = sourceOf(v.link);
          const yt = youtubeId(v.link);
          const thumb = !v.poster && yt ? `https://i.ytimg.com/vi/${yt}/hqdefault.jpg` : '';
          return (
            <article className={`ed-reel ed-item${i === 0 ? ' is-feature' : ''}`} key={i}>
              <ItemTools
                index={i}
                count={videos.length}
                onMove={(to) => update(list, (a) => moveItem(a, i, to))}
                onRemove={() => update(list, (a) => removeItem(a, i))}
                removeLabel="Delete video"
                confirmText={`Delete the video “${v.title}”? (You can still Undo before publishing.)`}
              />
              <div className="ed-reel-screen">
                <EditableImage path={v.poster || thumb} onChange={(val) => set([...base, 'poster'], val)} onRemove={v.poster && yt ? () => set([...base, 'poster'], '') : undefined} label="poster (a still from the video)" ratio={i === 0 ? '21 / 9' : '16 / 9'} large={i === 0} />
                {thumb && <span className="ed-reel-auto">Using the YouTube thumbnail · Replace to use your own</span>}
                <span className="ed-reel-play" aria-hidden="true">
                  ▶
                </span>
                <span className="ed-reel-bar" aria-hidden="true">
                  <span>▶</span>
                  <span>
                    00:00 / <EditableText {...f('duration')} label="Duration (mm:ss)" placeholder="02:30" />
                  </span>
                  <i />
                </span>
              </div>
              <div className="ed-reel-info">
                <span className="ed-reel-no">{pad(i + 1)}</span>
                <EditableText as="h3" {...f('title')} label="Video title" />
                <EditableText as="p" {...f('meta')} label="Details (e.g. Wedding · Bali · 2025)" optional className="ed-reel-meta" placeholder="Details, e.g. Wedding · Bali · 2025" />
              </div>
              <div className={`ed-reel-link${v.link ? '' : ' is-missing'}`}>
                <Icon name="link" size={15} />
                <EditableText
                  value={v.link}
                  onChange={(val) => set([...base, 'link'], val)}
                  label="Video link (YouTube, Vimeo or OneDrive)"
                  placeholder="Paste the YouTube link here"
                  normalize={normalizeLink}
                />
                {v.link ? (
                  <a href={v.link} target="_blank" rel="noopener noreferrer" className="ed-chip-btn" title="Open the link to check it plays">
                    Test {src} link <Icon name="external" size={13} />
                  </a>
                ) : null}
                {v.link ? (
                  <span className={`ed-reel-mode${playsOnSite(v.link) ? ' is-on' : ''}`}>{playsOnSite(v.link) ? '▶ Plays on your site' : '↗ Opens in a new tab'}</span>
                ) : (
                  <span className="ed-reel-soon">Shows “Coming soon” until a link is added</span>
                )}
              </div>
            </article>
          );
        })}
        <button
          type="button"
          className="ed-add-card ed-films-add"
          onClick={() => update(list, (a = []) => [...a, { title: 'New film', meta: '', duration: '', poster: '', link: '' }])}
        >
          <Icon name="plus" size={26} />
          <span>Add a video</span>
          <small>Then paste its YouTube link</small>
        </button>
      </div>
    </div>
  );
}
