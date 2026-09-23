import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { sendChatMessage } from './api/chatApi';
import { isAbortError, normalizeApiError, type UiError } from './api/apiError';
import { Header } from './components/Header';
import type { ChatMessage } from './types/chat';
import './styles/chat.css';

interface DisplayMessage extends ChatMessage {
  id: number;
}

const MAX_MESSAGE_LENGTH = 4000;
const MAX_CONTEXT_MESSAGES = 20;

const suggestions = [
  'Bugungi sana haqida qisqacha aytib ber',
  'Spring Boot nima uchun ishlatiladi?',
  'Menga kunlik o\u2018qish rejasini tuzib ber',
];

export default function ChatApp() {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<UiError | null>(null);
  const nextId = useRef(1);
  const activeRequest = useRef<AbortController | null>(null);
  const messageList = useRef<HTMLDivElement | null>(null);

  useEffect(() => () => activeRequest.current?.abort(), []);

  useEffect(() => {
    messageList.current?.scrollTo({
      top: messageList.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isSending]);

  async function submitMessage(text: string) {
    const content = text.trim();
    if (!content || isSending) {
      return;
    }

    const userMessage: DisplayMessage = {
      id: nextId.current++,
      role: 'USER',
      content,
    };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setError(null);
    setIsSending(true);

    const controller = new AbortController();
    activeRequest.current = controller;

    try {
      const context = nextMessages.slice(-MAX_CONTEXT_MESSAGES).map(({ role, content: value }) => ({
        role,
        content: value,
      }));
      const response = await sendChatMessage(context, controller.signal);

      setMessages((current) => [
        ...current,
        {
          id: nextId.current++,
          role: 'ASSISTANT',
          content: response.message,
        },
      ]);
    } catch (requestError: unknown) {
      if (!isAbortError(requestError)) {
        setError(normalizeApiError(requestError, 'chat'));
      }
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setIsSending(false);
      }
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMessage(input);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submitMessage(input);
    }
  }

  function clearChat() {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setMessages([]);
    setInput('');
    setError(null);
    setIsSending(false);
  }

  return (
    <div className="app-shell chat-shell">
      <Header />

      <main className="chat-card" aria-label="Local AI chat">
        <div className="chat-toolbar">
          <div className="model-status">
            <span className="status-dot" aria-hidden="true" />
            Local model
          </div>
          {messages.length > 0 && (
            <button className="clear-chat" type="button" onClick={clearChat}>
              Suhbatni tozalash
            </button>
          )}
        </div>

        <div className="message-list" ref={messageList} aria-live="polite">
          {messages.length === 0 ? (
            <section className="chat-welcome">
              <div className="welcome-icon" aria-hidden="true">AI</div>
              <h2>Salom! Qanday yordam bera olaman?</h2>
              <p>Xabarlar Ollama orqali shu kompyuterning o‘zida qayta ishlanadi.</p>
              <div className="suggestion-grid">
                {suggestions.map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion}
                    onClick={() => void submitMessage(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </section>
          ) : (
            messages.map((message) => (
              <article
                className={`message-row ${message.role === 'USER' ? 'user-message' : 'assistant-message'}`}
                key={message.id}
              >
                <div className="message-avatar" aria-hidden="true">
                  {message.role === 'USER' ? 'Siz' : 'AI'}
                </div>
                <div className="message-bubble">
                  <span className="message-author">
                    {message.role === 'USER' ? 'Siz' : 'Ollama'}
                  </span>
                  <p>{message.content}</p>
                </div>
              </article>
            ))
          )}

          {isSending && (
            <article className="message-row assistant-message">
              <div className="message-avatar" aria-hidden="true">AI</div>
              <div className="message-bubble typing-bubble" aria-label="Ollama javob tayyorlamoqda">
                <span />
                <span />
                <span />
              </div>
            </article>
          )}
        </div>

        {error && (
          <div className="chat-error" role="alert">
            <div>
              <strong>{error.title}</strong>
              <p>{error.message}</p>
            </div>
            <button type="button" onClick={() => setError(null)} aria-label="Xatoni yopish">×</button>
          </div>
        )}

        <form className="chat-composer" onSubmit={handleSubmit}>
          <label className="visually-hidden" htmlFor="chat-input">Xabaringiz</label>
          <textarea
            id="chat-input"
            value={input}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={1}
            placeholder="Xabar yozing..."
            disabled={isSending}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="submit" disabled={isSending || input.trim().length === 0}>
            {isSending ? 'Kutilmoqda...' : 'Yuborish'}
          </button>
          <div className="composer-meta">
            <span>Enter — yuborish · Shift + Enter — yangi qator</span>
            <span>{input.length}/{MAX_MESSAGE_LENGTH}</span>
          </div>
        </form>
      </main>

      <footer className="app-footer">Local AI Chat · Spring Boot + React + Ollama</footer>
    </div>
  );
}
