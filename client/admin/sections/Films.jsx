import Icon from '../components/Icon';
import { EditableImage, EditableText, ItemTools, SecHead, pad } from '../components/Editable';
import { moveItem, removeItem } from '../lib/store';

// "onedrive.live.com/…" → "https://onedrive.live.com/…"
const normalizeLink = (v) => (!v || /^https?:\/\//i.test(v) ? v : `https://${v}`);

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
          <b>How to get a video link:</b> in OneDrive, right-click the video → <b>Share</b> → set it to <b>“Anyone with the link can view”</b> → <b>Copy link</b>, then paste it under the video below. YouTube and Vimeo links work too. Visitors see a player; clicking it opens the video.
        </span>
      </div>

      <div className="ed-films-grid">
        {videos.map((v, i) => {
          const base = [...list, i];
          const f = (key) => ({ value: v[key], onChange: (val) => set([...base, key], val) });
          const src = sourceOf(v.link);
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
                <EditableImage path={v.poster} onChange={(val) => set([...base, 'poster'], val)} label="poster (a still from the video)" ratio={i === 0 ? '21 / 9' : '16 / 9'} large={i === 0} />
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
                  label="Video link (OneDrive share link)"
                  placeholder="Paste the OneDrive share link here"
                  normalize={normalizeLink}
                />
                {v.link ? (
                  <a href={v.link} target="_blank" rel="noopener noreferrer" className="ed-chip-btn" title="Open the link to check it plays">
                    Test {src} link <Icon name="external" size={13} />
                  </a>
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
          <small>Then paste its OneDrive link and add a poster</small>
        </button>
      </div>
    </div>
  );
}
