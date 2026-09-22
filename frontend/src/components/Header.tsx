export function Header() {
  return (
    <header className="app-header">
      <div className="brand-mark" aria-hidden="true">
        AI
      </div>
      <div className="header-copy">
        <div className="title-row">
          <h1>AI Task Extractor</h1>
          <span className="tech-badge">Java + Spring AI</span>
        </div>
        <p>Turn natural-language tasks into structured data using Spring AI.</p>
      </div>
    </header>
  );
}
