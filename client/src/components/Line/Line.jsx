// One masked line of text for slide-up reveals (styled by `.line` in styles/base.css).
export default function Line({ children, className = '' }) {
  return (
    <span className={`line ${className}`}>
      <span>{children}</span>
    </span>
  );
}
