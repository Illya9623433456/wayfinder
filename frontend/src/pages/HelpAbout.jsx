import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function HelpAbout() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'light'
  );

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const currentLang = (i18n.language || 'en').toLowerCase();
  const isPl = currentLang.startsWith('pl');
  const isDark = theme === 'dark';

  return (
    <div className="subpage-container">
      <style>{`
        .subpage-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background-color: var(--bg-color);
          overflow-y: auto;
          scrollbar-width: none;
          padding: 16px 22px 32px 22px;
          color: var(--text-main);
          transition: background-color 0.3s;
        }
        .subpage-container::-webkit-scrollbar { display: none; }

        [data-theme='dark'] .subpage-container {
          --bg-color: #112019;
          --card-bg: #1B3126;
          --primary: #087D56;
          --accent-text: #60DFAC;
          --text-main: #F1F7F4;
          --text-muted: #A0B4AA;
          --border: #2B4437;
          --icon-box-bg: #233E31;
          --lang-active-bg: #60DFAC;
          --lang-active-text: #112019;
        }

        [data-theme='light'] .subpage-container {
          --bg-color: #F6FAF8;
          --card-bg: #FFFFFF;
          --primary: #087D56;
          --accent-text: #087D56;
          --text-main: #12261E;
          --text-muted: #6E8279;
          --border: #E4EFE9;
          --icon-box-bg: #EBF5F0;
          --lang-active-bg: #087D56;
          --lang-active-text: #FFFFFF;
        }

        .subpage-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
        }
        .subpage-topbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .subpage-topbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .circle-icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--card-bg);
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-main);
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.03);
        }
        .topbar-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .lang-switch {
          display: flex;
          align-items: center;
          background-color: var(--icon-box-bg);
          padding: 3px;
          border-radius: 14px;
          gap: 2px;
          border: 1px solid var(--border);
        }
        .lang-btn {
          border: none;
          background: transparent;
          padding: 6px 11px;
          border-radius: 11px;
          font-size: 0.76rem;
          font-weight: 700;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        .lang-btn.active {
          background-color: var(--lang-active-bg);
          color: var(--lang-active-text);
        }

        .subpage-hero-title {
          font-size: 1.7rem;
          font-weight: 800;
          color: var(--text-main);
          margin: 0 0 6px 0;
          letter-spacing: -0.02em;
        }
        .subpage-hero-sub {
          font-size: 0.86rem;
          color: var(--text-muted);
          margin: 0 0 22px 0;
        }

        .placeholder-card {
          background-color: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 22px;
          padding: 20px;
          margin-bottom: 16px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.02);
        }
        .placeholder-card h3 {
          font-size: 1rem;
          font-weight: 800;
          color: var(--accent-text);
          margin: 0 0 8px 0;
        }
        .placeholder-card p {
          font-size: 0.86rem;
          line-height: 1.55;
          color: var(--text-muted);
          margin: 0;
        }
      `}</style>

      <div className="subpage-topbar">
        <div className="subpage-topbar-left">
          <button
            type="button"
            className="circle-icon-btn"
            onClick={() => navigate('/settings')}
            aria-label="Back to settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <span className="topbar-title">
            {isPl ? 'Pomoc i informacje' : 'Help & about'}
          </span>
        </div>

        <div className="subpage-topbar-right">
          <button type="button" className="circle-icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {isDark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            )}
          </button>

          <div className="lang-switch">
            <button
              type="button"
              className={`lang-btn ${isPl ? 'active' : ''}`}
              onClick={() => changeLanguage('pl')}
            >
              PL
            </button>
            <button
              type="button"
              className={`lang-btn ${!isPl ? 'active' : ''}`}
              onClick={() => changeLanguage('en')}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      <h1 className="subpage-hero-title">
        {isPl ? 'Pomoc i informacje' : 'Help & about'}
      </h1>
      <p className="subpage-hero-sub">
        {isPl
          ? 'Informacje o projekcie WayFinder oraz integracji z otwartymi danymi Warszawy.'
          : 'Information about the WayFinder project and Warsaw Open Data integration.'}
      </p>

      <div className="placeholder-card">
        <h3>{isPl ? 'O projekcie WayFinder' : 'About WayFinder Project'}</h3>
        <p>
          {isPl
            ? 'WayFinder to inteligentny asystent podróży miejskich łączący otwarte API Miasta Stołecznego Warszawy (ZTM, ZOM) z rekomendacjami AI oraz analizą śladu węglowego.'
            : 'WayFinder is an intelligent urban transit assistant combining City of Warsaw Open APIs (ZTM, ZOM) with AI route recommendations and carbon footprint tracking.'}
        </p>
      </div>

      <div className="placeholder-card">
        <h3>{isPl ? 'Wsparcie i FAQ' : 'Support & FAQ'}</h3>
        <p>
          {isPl
            ? 'Sekcja demonstracyjna przygotowana na potrzeby prezentacji projektu. W razie pytań dotyczących działania rozkładów jazdy lub asystenta AI skorzystaj z zakładki AI Chat.'
            : 'Demonstration section created for the project presentation. For questions regarding timetables or route planning, please use the AI Chat tab.'}
        </p>
      </div>
    </div>
  );
}