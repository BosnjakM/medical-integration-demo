export default function SourceCallout({ title = 'Mock-Daten & Technik', children }) {
  return (
    <aside className="source-callout" aria-label={title}>
      <h3 className="source-callout__title">{title}</h3>
      <div className="source-callout__body">{children}</div>
    </aside>
  );
}
