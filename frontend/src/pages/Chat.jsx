import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import { tripService } from '../api'; 

export default function Chat() {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleMicClick = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      alert("Dostęp do mikrofonu przyznany! (Funkcja w przygotowaniu)");
      stream.getTracks().forEach(track => track.stop());
    } catch {
      alert("Odmówiono dostępu do mikrofonu lub urządzenie nie jest obsługiwane.");
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const now = new Date();
    const timeString = `Today, ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

    // 1. Zapisujemy wiadomość użytkownika
    const newUserMsg = { id: Date.now(), sender: 'user', text: inputValue, timestamp: timeString };
    setMessages((prev) => [...prev, newUserMsg]);
    const userText = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      // 2. Wysłanie zapytania do backendu i OpenAI
      const response = await tripService.createTrip({ 
        origin: userText, 
        destination: "Auto-detect", 
        preferences: "Standard" 
      });
      
      const aiData = response.ai_recommendation || {};

      // 3. Dodajemy CZYSTĄ, tekstową kartę od AI (bez mapy)
      const newAiMsg = {
        id: Date.now() + 1,
        sender: 'ai-card',
        title: aiData.title || "Znaleziono najlepszą trasę",
        desc: aiData.desc || "Oto optymalne rozwiązanie dla Twojej podróży.",
        time: aiData.time || "18",
        co2: aiData.co2 || "0.8 kg CO2 Saved",
        timestamp: "WayFinder AI · Just now",
        isError: false
      };
      
      setMessages((prev) => [...prev, newAiMsg]);
    } catch {
      // Obsługa błędu połączenia (wyświetli się jako tekst)
      setMessages((prev) => [...prev, { 
        id: Date.now() + 1, 
        sender: 'ai-card', 
        title: "Brak połączenia z serwerem", 
        desc: "Upewnij się, że serwer backendu (node server.js) jest włączony i klucz OpenAI działa poprawnie.",
        time: "-",
        co2: "-",
        timestamp: "System Error",
        isError: true
      }]);
    } finally {
      setIsTyping(false);
    }
  };

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

        /* --- Zmiana koloru tła na dokładnie ten z polecenia --- */
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
        
        .msg-time-center {
          text-align: center;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin: 16px 0;
          font-weight: 500;
        }

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

        /* Pusty stan i wskaźnik pisania */
        .empty-state, .typing-indicator {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          color: var(--text-muted);
          font-size: 0.95rem;
          font-style: italic;
          text-align: center;
          padding: 0 20px;
          line-height: 1.5;
        }
        .typing-indicator { flex: none; justify-content: flex-start; margin-bottom: 20px; font-style: normal; }

        /* KARTA ODPOWIEDZI AI (teraz bez mapy) */
        .msg-ai-wrapper {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          margin-bottom: 16px;
          animation: slideUp 0.4s ease-out;
        }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        .msg-ai-card {
          background-color: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 4px 24px 24px 24px;
          padding: 20px;
          max-width: 95%;
          box-shadow: var(--shadow);
        }
        .msg-ai-card h3 { margin: 0 0 8px 0; font-size: 1.1rem; font-weight: 800; color: var(--text-main); }
        .msg-ai-card > p { 
          margin: 0 0 16px 0; 
          font-size: 0.9rem; 
          color: var(--text-muted); 
          line-height: 1.5;
          white-space: pre-wrap; /* Pozwala AI formatować tekst wielolinijkowy */
        }
        
        /* Pigułka z czasem i typem transportu */
        .route-snippet {
          background: rgba(0,0,0,0.1);
          border-radius: 16px;
          padding: 12px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .route-info { display: flex; gap: 12px; align-items: center; }
        .route-icon { color: var(--primary); }
        .route-texts strong { display: block; font-size: 0.95rem; color: var(--text-main); font-weight: 700; margin-bottom: 2px; }
        .route-texts span { font-size: 0.8rem; color: var(--text-muted); }
        .route-time { text-align: right; }
        .route-time strong { display: block; font-size: 1.6rem; font-weight: 800; color: var(--text-main); line-height: 1; }
        .route-time span { font-size: 0.75rem; color: var(--text-muted); }
        
        /* Pigułka ekologiczna */
        .eco-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(96, 223, 172, 0.15);
          color: var(--primary);
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 700;
          margin-bottom: 16px;
        }
        
        .view-route-btn {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          background: transparent;
          border: none;
          border-top: 1px solid var(--border);
          padding: 16px 0 0 0;
          color: var(--primary);
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
        }
        .ai-timestamp { font-size: 0.7rem; color: var(--text-muted); margin-top: 6px; margin-left: 8px; }

        /* Obszar wpisywania (bez zmian) */
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
          transition: transform 0.2s, background-color 0.2s;
        }
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
            {t('chat_greeting')}
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.sender === 'user') {
              return (
                <div key={msg.id}>
                  {msg.timestamp && <div className="msg-time-center">{msg.timestamp}</div>}
                  <div className="msg-user-wrapper">
                    <div className="msg-user">{msg.text}</div>
                  </div>
                </div>
              );
            }
            if (msg.sender === 'ai-card') {
              return (
                <div key={msg.id} className="msg-ai-wrapper">
                  <div className="msg-ai-card">
                    <h3>{msg.title}</h3>
                    {/* Tekst od AI opisujący trasę */}
                    <p>{msg.desc}</p>
                    
                    {/* Skrót informacji o czasie wyświetla się tylko jeśli to nie jest błąd */}
                    {!msg.isError && (
                      <>
                        <div className="route-snippet">
                          <div className="route-info">
                            <div className="route-icon">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="16" rx="2"></rect><path d="M4 11h16"></path><path d="M12 3v8"></path><circle cx="8" cy="16" r="1"></circle><circle cx="16" cy="16" r="1"></circle></svg>
                            </div>
                            <div className="route-texts">
                              <strong>{msg.title}</strong>
                              <span>Optimal route</span>
                            </div>
                          </div>
                          <div className="route-time">
                            <strong>{msg.time}</strong>
                            <span>min</span>
                          </div>
                        </div>
                        
                        <div className="eco-pill">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 1 8.3A9.24 9.24 0 0 1 11 20Z"></path><path d="M15 8.5C14 12 11.5 16 11 20"></path></svg>
                          {msg.co2}
                        </div>
                      </>
                    )}

                    <button className="view-route-btn">
                      View route
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </button>
                  </div>
                  <div className="ai-timestamp">{msg.timestamp}</div>
                </div>
              );
            }
          })
        )}
        
        {isTyping && (
          <div className="typing-indicator">
            WayFinder AI is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="chat-footer">
        <form className="input-wrapper" onSubmit={handleSendMessage}>
          <input 
            type="text" 
            placeholder={t('chat_placeholder')} 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isTyping}
          />
          <button type="button" className="mic-btn" onClick={handleMicClick}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>
          </button>
          <button type="submit" className="send-btn" disabled={isTyping}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
          </button>
        </form>
      </footer>
    </div>
  );
}