export function Header() {
  return (
    <header className="app-header">
      <div className="brand-mark" aria-hidden="true">
        AI
      </div>
      <div className="header-copy">
        <div className="title-row">
          <h1>Local AI Chat</h1>
          <span className="tech-badge">Ollama &middot; qwen3.5:9b</span>
        </div>
        <p>Private conversations powered by a model running on this computer.</p>
      </div>
    </header>
  );
}
