import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function Header() {
  const { i18n } = useTranslation();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <>
      <style>{`
        .app-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
        }
        .header-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .header-logo {
          width: 32px;
          height: 32px;
          border-radius: 8px;
        }
        .header-title-wrapper {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .header-title {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          color: var(--text-main);
          letter-spacing: -0.5px;
          transition: color 0.3s;
        }
        .badge {
          background: var(--primary-light);
          color: var(--primary);
          font-size: 0.7rem;
          padding: 3px 6px;
          border-radius: 6px;
          font-weight: 800;
          transition: background 0.3s, color 0.3s;
        }
        .header-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .icon-btn {
          background: var(--card-bg);
          border: none;
          color: var(--text-main);
          width: 40px;
          height: 40px;
          border-radius: 13px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          transition: background-color 0.3s, color 0.3s, transform 0.2s;
        }
        .icon-btn:active {
          transform: scale(0.92);
        }

        /* --- NOWY, PŁYNNY PRZEŁĄCZNIK JĘZYKÓW --- */
        .lang-toggle {
          position: relative;
          display: flex;
          background: var(--primary-light);
          border-radius: 13px;
          padding: 4px;
          height: 40px;
          align-items: center;
          transition: background-color 0.3s;
        }
        
        /* Pływająca pigułka tła */
        .lang-slider {
          position: absolute;
          top: 4px;
          bottom: 4px;
          left: 4px;
          width: 44px; /* Szerokość pojedynczego przycisku */
          background: var(--card-bg);
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          /* Płynna, lekko elastyczna animacja przesunięcia */
          transition: transform 0.35s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.3s;
          z-index: 1;
        }
        
        /* Gdy aktywny jest EN (drugi język), przesuń pigułkę w prawo */
        .lang-slider.right {
          transform: translateX(44px);
        }

        .lang-btn {
          position: relative;
          z-index: 2; /* Przycisk musi być "nad" pigułką */
          background: transparent;
          border: none;
          width: 44px;
          height: 100%;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: color 0.3s ease;
        }
        .lang-btn.active {
          color: var(--text-main);
          font-weight: 700;
        }
      `}</style>

      <header className="app-header">
        <div className="header-brand">
          <img src="/logo.svg" alt="WayFinder Logo" className="header-logo" />
          <div className="header-title-wrapper">
            <h1 className="header-title">WayFinder</h1>
            <span className="badge">AI</span>
          </div>
        </div>
        <div className="header-controls">
           <button className="icon-btn moon-btn" aria-label="Toggle theme" onClick={toggleTheme}>
             {isDarkMode ? (
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <circle cx="12" cy="12" r="5"></circle>
                 <line x1="12" y1="1" x2="12" y2="3"></line>
                 <line x1="12" y1="21" x2="12" y2="23"></line>
                 <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                 <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                 <line x1="1" y1="12" x2="3" y2="12"></line>
                 <line x1="21" y1="12" x2="23" y2="12"></line>
                 <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                 <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
               </svg>
             ) : (
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
               </svg>
             )}
           </button>
           
           <div className="lang-toggle">
              {/* Element animowanego tła */}
              <div className={`lang-slider ${i18n.language === 'en' ? 'right' : ''}`}></div>
              
              <button 
                className={`lang-btn ${i18n.language === 'pl' ? 'active' : ''}`}
                onClick={() => changeLanguage('pl')}
              >
                PL
              </button>
              <button 
                className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
                onClick={() => changeLanguage('en')}
              >
                EN
              </button>
           </div>
        </div>
      </header>
    </>
  );
}