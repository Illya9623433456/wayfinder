import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { tripService } from '../api';

// Rozmowa trzymana w sessionStorage – po wejściu na mapę i powrocie czat dalej tam jest.
const STORAGE_KEY = 'wayfinder_chat';

const loadMessages = () => {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

const formatTime = (date = new Date()) =>
  `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

const TransportIcon = ({ type }) => {
  if (type === 'bus') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="13" rx="2"></rect><path d="M3 11h18"></path><circle cx="7.5" cy="19.5" r="1.5"></circle><circle cx="16.5" cy="19.5" r="1.5"></circle></svg>
    );
  }
  if (type === 'metro') {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"></circle><path d="M8 16V8l4 5 4-5v8"></path></svg>
    );
  }
  // tram / train / domyślnie
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="16" rx="2"></rect><path d="M4 11h16"></path><path d="M12 3v8"></path><circle cx="8" cy="16" r="1"></circle><circle cx="16" cy="16" r="1"></circle></svg>
  );
};

export default function Chat() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState(loadMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [coords, setCoords] = useState({ lat: null, lon: null });
  const messagesEndRef = useRef(null);

  const language = (i18n.language || 'en').toLowerCase().startsWith('pl') ? 'pl' : 'en';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      /* brak miejsca / tryb prywatny – trudno */
    }
  }, [messages]);

  // GPS użytkownika – dzięki temu AI wie, skąd startujemy ("jak dojechać na ...").
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {}, // brak zgody – AI dopyta o punkt startowy
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120000 }
    );
  }, []);

  const handleMicClick = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      alert(t('chat_mic_soon'));
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      alert(t('chat_mic_denied'));
    }
  };

  const sendMessage = async (text) => {
    const userText = text.trim();
    if (!userText || isTyping) return;

  const userMsg = { id: messages.length + 1, role: 'user', text: userText, time: formatTime() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputValue('');
    setIsTyping(true);

    // Do backendu idzie tylko tekst rozmowy (bez błędów i kart).
    const history = nextMessages
      .filter((m) => !m.isError && m.text)
      .map((m) => ({ role: m.role, content: m.text }))
      .slice(-12);

    try {
      const data = await tripService.chat(history, { ...coords, language });
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          role: 'assistant',
          text: data.reply,
          routes: data.routes || [],
          mode: data.mode,
          time: formatTime(),
        },
      ]);
    } catch (err) {
      console.error('Błąd czatu AI:', err);
      setMessages((prev) => [
        ...prev,
               { id: prev.length + 1, role: 'assistant', text: t('chat_error'), isError: true, time: formatTime() },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const openRoute = (route) => {
    localStorage.setItem('wayfinder_active_route', JSON.stringify(route));
    navigate('/route-map', { state: { route } });
  };

  const clearChat = () => {
    setMessages([]);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const suggestions = [t('chat_suggestion_1'), t('chat_suggestion_2'), t('chat_suggestion_3')];

  return (
    <div className="chat-page">
      <style>{`
        .chat-page {
          display: flex;
          flex-direction: column;
          height: 100%;
          background-color: var(--bg-color);
          position: relative;
          transition: background-color 0.3s;
        }

        [data-theme='dark'] .chat-page {
          --bg-color: #112019;
          --card-bg: #2B3D34;
          --primary: #60DFAC;
          --user-bubble: #087D56;
          --text-main: #F1F7F4;
          --text-muted: #A0B4AA;
          --border: #334a3f;
        }
        [data-theme='light'] .chat-page {
          --user-bubble: var(--primary);
        }

        .chat-messages {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          scrollbar-width: none;
        }
        .chat-messages::-webkit-scrollbar { display: none; }

        /* Dymek użytkownika */
        .msg-user-wrapper {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 24px;
        }
        .msg-user {
          background-color: var(--user-bubble);
          color: #FFFFFF;
          padding: 14px 18px;
          border-radius: 20px 20px 4px 20px;
          font-size: 0.95rem;
          line-height: 1.4;
          font-weight: 500;
          max-width: 85%;
          white-space: pre-wrap;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        /* Pusty stan */
        .empty-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 20px;
          color: var(--text-muted);
          font-size: 0.95rem;
          text-align: center;
          padding: 0 20px;
          line-height: 1.5;
        }
        .empty-state p { font-style: italic; margin: 0; }
        .suggestions { display: flex; flex-direction: column; gap: 10px; width: 100%; }
        .suggestion-chip {
          background: var(--card-bg);
          border: 1px solid var(--border);
          color: var(--text-main);
          border-radius: 16px;
          padding: 12px 16px;
          font-size: 0.9rem;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          transition: transform 0.15s, border-color 0.15s;
        }
        .suggestion-chip:hover { border-color: var(--primary); }
        .suggestion-chip:active { transform: scale(0.98); }

        /* Wskaźnik "AI myśli" */
        .typing-indicator {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--text-muted);
          font-size: 0.85rem;
          margin-bottom: 20px;
        }
        .typing-dots { display: flex; gap: 4px; }
        .typing-dots span {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--primary);
          animation: blink 1.2s infinite ease-in-out;
        }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink { 0%, 80%, 100% { opacity: 0.25; } 40% { opacity: 1; } }

        /* Odpowiedź AI */
        .msg-ai-wrapper {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          margin-bottom: 20px;
          animation: slideUp 0.4s ease-out;
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .msg-ai-bubble {
          background-color: var(--card-bg);
          border: 1px solid var(--border);
          color: var(--text-main);
          border-radius: 4px 20px 20px 20px;
          padding: 14px 18px;
          font-size: 0.95rem;
          line-height: 1.5;
          max-width: 90%;
          white-space: pre-wrap;
          box-shadow: var(--shadow);
        }
        .msg-ai-bubble.error { border-color: #e5484d; color: #e5484d; }

        /* Karta trasy pod odpowiedzią AI */
        .msg-ai-card {
          background-color: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 16px 20px;
          margin-top: 10px;
          width: 90%;
          box-sizing: border-box;
          box-shadow: var(--shadow);
        }

        .route-snippet {
          background: rgba(0,0,0,0.05);
          border-radius: 16px;
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          gap: 12px;
        }
        .route-info { display: flex; gap: 12px; align-items: center; min-width: 0; }
        .route-icon { color: var(--primary); flex-shrink: 0; }
        .route-texts { min-width: 0; }
        .route-texts strong { display: block; font-size: 0.95rem; color: var(--text-main); font-weight: 700; margin-bottom: 2px; }
        .route-texts span { display: block; font-size: 0.8rem; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .route-time { text-align: right; flex-shrink: 0; }
        .route-time strong { display: block; font-size: 1.6rem; font-weight: 800; color: var(--text-main); line-height: 1; }
        .route-time span { font-size: 0.75rem; color: var(--text-muted); }

        .route-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
        .eco-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(96, 223, 172, 0.15);
          color: var(--primary);
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 700;
        }
        .meta-pill {
          display: inline-flex;
          align-items: center;
          background: rgba(0,0,0,0.05);
          color: var(--text-muted);
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .view-route-btn {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          background: transparent;
          border: none;
          border-top: 1px solid var(--border);
          padding: 12px 0 0 0;
          color: var(--primary);
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
        }
        .ai-timestamp { font-size: 0.7rem; color: var(--text-muted); margin-top: 6px; margin-left: 8px; }

        .new-chat-btn {
          align-self: center;
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-muted);
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 8px;
        }

        /* Pole wpisywania */
        .chat-footer {
          padding: 10px 20px 20px 20px;
          background: var(--bg-color);
          z-index: 10;
        }
        .input-wrapper {
          display: flex;
          align-items: center;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 8px 8px 8px 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }
        .input-wrapper input {
          flex: 1;
          min-width: 0;
          border: none;
          background: transparent;
          font-size: 1.05rem;
          color: var(--text-main);
          outline: none;
          font-weight: 500;
        }
        .input-wrapper input::placeholder { color: var(--text-muted); }
        .mic-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          padding: 8px 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .send-btn {
          background: var(--user-bubble);
          color: #fff;
          border: none;
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          margin-left: 4px;
          transition: transform 0.2s, background-color 0.2s, opacity 0.2s;
        }
        .send-btn:disabled { opacity: 0.5; cursor: default; }
        [data-theme='dark'] .send-btn {
          color: #172720;
          background: var(--primary);
        }
        .send-btn:active { transform: scale(0.92); }
      `}</style>

      <Header />

      <main className="chat-messages">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>{t('chat_greeting')}</p>
            <div className="suggestions">
              {suggestions.map((s) => (
                <button key={s} type="button" className="suggestion-chip" onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <button type="button" className="new-chat-btn" onClick={clearChat} disabled={isTyping}>
              {t('chat_new')}
            </button>

            {messages.map((msg) => {
              if (msg.role === 'user') {
                return (
                  <div key={msg.id} className="msg-user-wrapper">
                    <div className="msg-user">{msg.text}</div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="msg-ai-wrapper">
                  <div className={`msg-ai-bubble${msg.isError ? ' error' : ''}`}>{msg.text}</div>

                  {(msg.routes || []).map((route) => {
                    const rec = route.ai_recommendation || {};
                    const origin = route.origin_coords?.name || route.origin;
                    const destination = route.dest_coords?.name || route.destination;
                    return (
                      <div key={route.id} className="msg-ai-card">
                        <div className="route-snippet">
                          <div className="route-info">
                            <div className="route-icon">
                              <TransportIcon type={route.transport_icon} />
                            </div>
                            <div className="route-texts">
                              <strong>{rec.title} · {route.line_number}</strong>
                              <span>{origin} → {destination}</span>
                            </div>
                          </div>
                          <div className="route-time">
                            <strong>{rec.time}</strong>
                            <span>min</span>
                          </div>
                        </div>

                        <div className="route-meta">
                          <span className="meta-pill">{route.walk_min} {t('chat_walk')}</span>
                          {route.next_departure_in != null && (
                            <span className="meta-pill">{t('chat_next_dep', { min: route.next_departure_in })}</span>
                          )}
                          {rec.co2 && (
                            <span className="eco-pill">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 1 8.3A9.24 9.24 0 0 1 11 20Z"></path><path d="M15 8.5C14 12 11.5 16 11 20"></path></svg>
                              {rec.co2}
                            </span>
                          )}
                        </div>

                        <button type="button" className="view-route-btn" onClick={() => openRoute(route)}>
                          {t('chat_view_route')}
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </button>
                      </div>
                    );
                  })}

                  <div className="ai-timestamp">
                    WayFinder AI · {msg.time}
                    {msg.mode === 'fallback' && ` · ${t('chat_basic_mode')}`}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {isTyping && (
          <div className="typing-indicator">
            <div className="typing-dots"><span></span><span></span><span></span></div>
            {t('chat_typing')}
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="chat-footer">
        <form className="input-wrapper" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder={t('chat_placeholder')}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isTyping}
            maxLength={2000}
          />
          <button type="button" className="mic-btn" onClick={handleMicClick} aria-label="Mic">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
          </button>
          <button type="submit" className="send-btn" disabled={isTyping || !inputValue.trim()} aria-label={t('chat_send')}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
          </button>
        </form>
      </footer>
    </div>
  );
}