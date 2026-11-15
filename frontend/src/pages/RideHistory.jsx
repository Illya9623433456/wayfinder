import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const API_BASE = 'http://localhost:8000';

// Wyciąga wartość liczbową z tekstu np. "0.8 kg CO₂" -> 0.8
const parseCo2Value = (co2Str) => {
  if (!co2Str) return 0.3;
  const match = String(co2Str).replace(',', '.').match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0.3;
};

// Ikona środka transportu (All / Tram / Bus / Metro / Train)
function TransportSmallIcon({ type }) {
  const t = (type || 'tram').toLowerCase();
  if (t === 'all') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="6" x2="20" y2="6"></line>
        <line x1="7" y1="12" x2="17" y2="12"></line>
        <line x1="10" y1="18" x2="14" y2="18"></line>
      </svg>
    );
  }
  if (t === 'bus') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="15" rx="3"></rect>
        <path d="M3 11h18"></path>
        <circle cx="7.5" cy="15.5" r="1"></circle>
        <circle cx="16.5" cy="15.5" r="1"></circle>
        <path d="M6 19v2"></path>
        <path d="M18 19v2"></path>
      </svg>
    );
  }
  if (t === 'metro') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="16" rx="4"></rect>
        <path d="M8 15l4-8 4 8"></path>
        <path d="M7 19l-2 3"></path>
        <path d="M17 19l2 3"></path>
      </svg>
    );
  }
  if (t === 'train') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="3" width="14" height="15" rx="3"></rect>
        <path d="M5 10h14"></path>
        <circle cx="9" cy="14.5" r="1"></circle>
        <circle cx="15" cy="14.5" r="1"></circle>
        <path d="M8 18l-2 3"></path>
        <path d="M16 18l2 3"></path>
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="4" width="14" height="15" rx="2.5"></rect>
      <path d="M5 11h14"></path>
      <path d="M9 4V2h6v2"></path>
      <circle cx="8.5" cy="15.5" r="1"></circle>
      <circle cx="15.5" cy="15.5" r="1"></circle>
      <path d="M8 19l-1.5 2.5"></path>
      <path d="M16 19l1.5 2.5"></path>
    </svg>
  );
}

export default function RideHistory() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const [user] = useState(() => {
    try {
      const savedUser = localStorage.getItem('wayfinder_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'light'
  );

  const [modeFilter, setModeFilter] = useState('all');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [routesHistory, setRoutesHistory] = useState([]);
  const [ecoStats, setEcoStats] = useState({ totalCo2: '0.0', count: 0 });

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

  // Zamykanie rozwijanego menu po kliknięciu poza nim
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const emailParam = encodeURIComponent(user.email || 'guest');

    fetch(`${API_BASE}/api/routes?user_email=${emailParam}&limit=100`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch routes');
        return res.json();
      })
      .then((json) => {
        if (!isMounted) return;
        const list = Array.isArray(json.data) ? json.data : [];
        setRoutesHistory(list);

        const totalCo2Num = list.reduce((acc, item) => acc + parseCo2Value(item.ai_co2), 0);
        setEcoStats({
          totalCo2: totalCo2Num.toFixed(1),
          count: list.length,
        });
      })
      .catch((err) => {
        console.error('Błąd pobierania historii przejazdów z API:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

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

  const formatFigmaDate = (dateStr, isPl) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    if (Number.isNaN(d.getTime())) return '10 Nov 2026 · 09:14';
    const day = d.getDate();
    const month = d.toLocaleDateString(isPl ? 'pl-PL' : 'en-GB', { month: 'short' }).replace('.', '');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year} · ${hours}:${mins}`;
  };

  const formatLineLabel = (item, isPl) => {
    const rawIcon = (item.transport_icon || 'tram').toLowerCase();
    let modeName = isPl ? 'Tramwaj' : 'Tram';
    if (rawIcon === 'bus') modeName = isPl ? 'Autobus' : 'Bus';
    else if (rawIcon === 'metro') modeName = 'Metro';
    else if (rawIcon === 'train') modeName = isPl ? 'Pociąg' : 'Train';

    let line = item.line_number;
    if (!line && item.ai_desc) {
      const m = item.ai_desc.match(/Line\s+([A-Za-z0-9]+)/i);
      if (m) line = m[1];
    }
    return `${modeName} ${line || '17'}`;
  };

  if (!user) return null;

  const currentLang = (i18n.language || 'en').toLowerCase();
  const isPl = currentLang.startsWith('pl');

  const modeOptions = [
    { value: 'all', label: isPl ? 'Wszystkie' : 'All modes' },
    { value: 'tram', label: isPl ? 'Tramwaj' : 'Tram' },
    { value: 'bus', label: isPl ? 'Autobus' : 'Bus' },
    { value: 'metro', label: 'Metro' },
    { value: 'train', label: isPl ? 'Kolej' : 'Train' },
  ];

  const activeModeObj = modeOptions.find((m) => m.value === modeFilter) || modeOptions[0];

  const filteredHistory = routesHistory.filter((item) => {
    if (modeFilter === 'all') return true;
    return (item.transport_icon || 'tram').toLowerCase() === modeFilter;
  });

  const firstDate = routesHistory[0]?.created_at ? new Date(routesHistory[0].created_at) : new Date();
  const monthHeaderRaw = firstDate.toLocaleDateString(isPl ? 'pl-PL' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });
  const monthHeader = monthHeaderRaw.charAt(0).toUpperCase() + monthHeaderRaw.slice(1);

  return (
    <div className="ride-history-page">
      <style>{`
        .ride-history-page {
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
        .ride-history-page::-webkit-scrollbar { display: none; }

        [data-theme='dark'] .ride-history-page {
          --bg-color: #112019;
          --card-bg: #182C22;
          --primary: #087D56;
          --accent-text: #5CE0A8;
          --text-main: #F1F7F4;
          --text-muted: #8FA69B;
          --border: #264033;
          --co2-card-bg: #1E3F30;
          --co2-card-border: #2C5943;
          --icon-box-bg: #213A2D;
          --saved-bar-bg: #1F4232;
          --dropdown-hover: #213B2E;
          --dropdown-active: #1E3F30;
          --dropdown-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
        }

        [data-theme='light'] .ride-history-page {
          --bg-color: #F6FAF8;
          --card-bg: #FFFFFF;
          --primary: #087D56;
          --accent-text: #087D56;
          --text-main: #12261E;
          --text-muted: #6E8279;
          --border: #E4EFE9;
          --co2-card-bg: #E6F4EE;
          --co2-card-border: #CDE9DC;
          --icon-box-bg: #EBF5F0;
          --saved-bar-bg: #E8F5EE;
          --dropdown-hover: #F2F9F5;
          --dropdown-active: #E6F4EE;
          --dropdown-shadow: 0 10px 28px rgba(8, 55, 38, 0.12);
        }

        /* --- TOP HEADER --- */
        .ride-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
        }
        .ride-topbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ride-topbar-right {
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
          font-size: 1.02rem;
          font-weight: 700;
          color: var(--text-main);
        }

        /* --- LANGUAGE PILL SWITCH (PL / EN) --- */
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
          padding: 6px 12px;
          border-radius: 11px;
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        .lang-btn.active {
          background-color: #087D56;
          color: #FFFFFF;
        }

        /* --- HERO & SUMMARY --- */
        .ride-hero-title {
          font-size: 1.65rem;
          font-weight: 800;
          color: var(--text-main);
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
        }
        .ride-hero-sub {
          font-size: 0.84rem;
          color: var(--text-muted);
          margin: 0 0 18px 0;
        }

        .ride-month-summary {
          background-color: var(--co2-card-bg);
          border: 1px solid var(--co2-card-border);
          border-radius: 20px;
          padding: 16px 18px;
          display: grid;
          grid-template-columns: 1fr 1px 1.25fr;
          align-items: center;
          gap: 16px;
          margin-bottom: 22px;
        }
        .ride-summary-left-label {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--accent-text);
          display: block;
          margin-bottom: 4px;
        }
        .ride-summary-left-count {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-main);
          line-height: 1.15;
        }
        .ride-summary-divider {
          width: 1px;
          height: 38px;
          background-color: var(--co2-card-border);
        }
        .ride-summary-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ride-summary-leaf {
          color: var(--accent-text);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ride-summary-co2-val {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--accent-text);
          line-height: 1.1;
          display: block;
        }
        .ride-summary-co2-sub {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--accent-text);
          opacity: 0.88;
          display: block;
          margin-top: 2px;
        }

        /* --- FILTER BAR & CUSTOM DROPDOWN --- */
        .ride-filter-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
          position: relative;
          z-index: 20;
        }
        .ride-month-title {
          font-size: 0.96rem;
          font-weight: 800;
          color: var(--text-main);
        }
        .custom-dropdown-wrap {
          position: relative;
        }
        .custom-dropdown-trigger {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          background-color: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 7px 14px;
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-main);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
          transition: all 0.2s ease;
        }
        .custom-dropdown-trigger:hover {
          border-color: var(--co2-card-border);
        }
        .custom-dropdown-trigger.open {
          border-color: var(--accent-text);
          box-shadow: 0 0 0 3px var(--co2-card-bg);
        }
        .trigger-icon {
          display: flex;
          align-items: center;
          color: var(--accent-text);
        }
        .trigger-chevron {
          color: var(--text-muted);
          transition: transform 0.2s ease;
        }
        .trigger-chevron.rotated {
          transform: rotate(180deg);
          color: var(--accent-text);
        }

        .custom-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          min-width: 168px;
          background-color: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 6px;
          box-shadow: var(--dropdown-shadow);
          display: flex;
          flex-direction: column;
          gap: 2px;
          animation: dropdownFadeIn 0.16s ease-out;
        }
        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-6px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .custom-dropdown-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          border: none;
          background: transparent;
          padding: 9px 12px;
          border-radius: 12px;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-main);
          cursor: pointer;
          text-align: left;
          transition: background-color 0.15s ease, color 0.15s ease;
        }
        .custom-dropdown-item:hover {
          background-color: var(--dropdown-hover);
        }
        .custom-dropdown-item.selected {
          background-color: var(--dropdown-active);
          color: var(--accent-text);
          font-weight: 800;
        }
        .dropdown-item-left {
          display: flex;
          align-items: center;
          gap: 9px;
        }
        .dropdown-item-icon {
          display: flex;
          align-items: center;
          color: var(--text-muted);
        }
        .custom-dropdown-item.selected .dropdown-item-icon {
          color: var(--accent-text);
        }
        .dropdown-check {
          color: var(--accent-text);
          display: flex;
          align-items: center;
        }

        /* --- RIDE CARDS (BEZ MAPEK) --- */
        .ride-cards-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 24px;
        }
        .ride-card {
          background-color: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 22px;
          padding: 15px 18px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.02);
        }
        .ride-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .ride-card-date {
          font-size: 0.74rem;
          font-weight: 600;
          color: var(--text-muted);
        }
        .ride-card-line {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.76rem;
          font-weight: 800;
          color: var(--text-main);
        }
        .ride-card-line svg {
          color: var(--accent-text);
        }

        .ride-card-details {
          display: flex;
          flex-direction: column;
          width: 100%;
        }

        /* Kropki trasy Origin -> Destination */
        .ride-stops-pair {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 12px;
          padding-left: 16px;
        }
        .ride-stops-pair::before {
          content: '';
          position: absolute;
          left: 3.5px;
          top: 7px;
          bottom: 7px;
          width: 1.5px;
          background-color: var(--co2-card-border);
        }
        .ride-stop-row {
          position: relative;
          display: flex;
          align-items: center;
        }
        .ride-stop-dot {
          position: absolute;
          left: -16px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--accent-text);
        }
        .ride-origin-text {
          font-size: 0.84rem;
          font-weight: 600;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .ride-dest-text {
          font-size: 1.02rem;
          font-weight: 800;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Zielona belka "0.8 kg CO2 saved" */
        .ride-saved-bar {
          background-color: var(--saved-bar-bg);
          border-radius: 10px;
          padding: 7px 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--accent-text);
          font-size: 0.78rem;
          font-weight: 800;
          margin-bottom: 8px;
        }
        .ride-completed-foot {
          font-size: 0.73rem;
          font-weight: 500;
          color: var(--text-muted);
        }

        .empty-history-box {
          background-color: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 32px 20px;
          text-align: center;
          color: var(--text-muted);
          margin-bottom: 24px;
        }
      `}</style>

      {/* Górny pasek: Wstecz + Tytuł + Kółko motywu po lewej + Pigułka PL/EN po prawej */}
      <div className="ride-topbar">
        <div className="ride-topbar-left">
          <button
            className="circle-icon-btn"
            onClick={() => navigate('/profile')}
            aria-label="Back to profile"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <span className="topbar-title">
            {isPl ? 'Historia przejazdów' : 'Ride history'}
          </span>
        </div>

        <div className="ride-topbar-right">
          {/* 1. Kółko motywu */}
          <button className="circle-icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            )}
          </button>

          {/* 2. Pigułka PL / EN */}
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

      {/* Nagłówek sekcji */}
      <h1 className="ride-hero-title">
        {isPl ? 'Każda podróż ma znaczenie.' : 'Every trip counts.'}
      </h1>
      <p className="ride-hero-sub">
        {isPl
          ? 'Twoje przejazdy. Trochę mniej śladu po sobie.'
          : 'Your journeys. A little less left behind.'}
      </p>

      {/* Zielony boks podsumowania miesiąca */}
      <div className="ride-month-summary">
        <div>
          <span className="ride-summary-left-label">
            {isPl ? 'TEN MIESIĄC' : 'THIS MONTH'}
          </span>
          <strong className="ride-summary-left-count">
            {ecoStats.count} {isPl ? 'przejazdów' : 'journeys'}
          </strong>
        </div>

        <div className="ride-summary-divider" />

        <div className="ride-summary-right">
          <div className="ride-summary-leaf">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 1 8.3A9.24 9.24 0 0 1 11 20Z"></path>
              <path d="M15 8.5C14 12 11.5 16 11 20"></path>
            </svg>
          </div>
          <div>
            <span className="ride-summary-co2-val">{ecoStats.totalCo2} kg CO₂</span>
            <span className="ride-summary-co2-sub">
              {isPl ? 'zaoszczędzono w tym miesiącu' : 'saved this month'}
            </span>
          </div>
        </div>
      </div>

      {/* Wiersz: Miesiąc + Nowoczesny Custom Dropdown */}
      <div className="ride-filter-bar">
        <span className="ride-month-title">{monthHeader}</span>

        <div className="custom-dropdown-wrap" ref={dropdownRef}>
          <button
            type="button"
            className={`custom-dropdown-trigger ${dropdownOpen ? 'open' : ''}`}
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
          >
            <span className="trigger-icon">
              <TransportSmallIcon type={activeModeObj.value} />
            </span>
            <span>{activeModeObj.label}</span>
            <svg
              className={`trigger-chevron ${dropdownOpen ? 'rotated' : ''}`}
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {dropdownOpen && (
            <div className="custom-dropdown-menu" role="listbox">
              {modeOptions.map((opt) => {
                const isSelected = modeFilter === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`custom-dropdown-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      setModeFilter(opt.value);
                      setDropdownOpen(false);
                    }}
                  >
                    <span className="dropdown-item-left">
                      <span className="dropdown-item-icon">
                        <TransportSmallIcon type={opt.value} />
                      </span>
                      <span>{opt.label}</span>
                    </span>

                    {isSelected && (
                      <span className="dropdown-check">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lista przejazdów */}
      {filteredHistory.length === 0 ? (
        <div className="empty-history-box">
          <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-main)' }}>
            {isPl ? 'Brak zapisanych przejazdów' : 'No journeys recorded yet'}
          </p>
          <p style={{ margin: '6px 0 0 0', fontSize: '0.82rem' }}>
            {isPl
              ? 'Zaplanuj trasę na ekranie głównym, aby zobaczyć swoją historię.'
              : 'Plan a route on the Home screen to see your ride history.'}
          </p>
        </div>
      ) : (
        <div className="ride-cards-list">
          {filteredHistory.map((item, idx) => {
            const co2Val = parseCo2Value(item.ai_co2).toFixed(1);
            const durationMin = String(item.ai_time || '18').replace(/[^0-9]/g, '') || '18';

            return (
              <div key={item.id || idx} className="ride-card">
                <div className="ride-card-header">
                  <span className="ride-card-date">
                    {formatFigmaDate(item.created_at, isPl)}
                  </span>
                  <span className="ride-card-line">
                    <TransportSmallIcon type={item.transport_icon} />
                    {formatLineLabel(item, isPl)}
                  </span>
                </div>

                <div className="ride-card-details">
                  <div className="ride-stops-pair">
                    <div className="ride-stop-row">
                      <span className="ride-stop-dot" />
                      <span className="ride-origin-text">{item.origin || 'Home'}</span>
                    </div>
                    <div className="ride-stop-row">
                      <span className="ride-stop-dot" />
                      <span className="ride-dest-text">{item.destination || 'Warszawa Centralna'}</span>
                    </div>
                  </div>

                  <div className="ride-saved-bar">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 1 8.3A9.24 9.24 0 0 1 11 20Z"></path>
                      <path d="M15 8.5C14 12 11.5 16 11 20"></path>
                    </svg>
                    <span>
                      {co2Val} kg CO₂ {isPl ? 'zaoszczędzone' : 'saved'}
                    </span>
                  </div>

                  <span className="ride-completed-foot">
                    {durationMin} min · {isPl ? 'Przejazd ukończony' : 'Journey completed'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}