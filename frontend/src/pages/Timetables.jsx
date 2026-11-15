import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { tripService } from '../api';

const normalizeText = (str = '') =>
  str
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l');

export default function Timetables() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'light'
  );
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'tram' | 'bus' | 'metro' | 'train'
  const [searchQuery, setSearchQuery] = useState('');
  const [allStops, setAllStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatedTime, setUpdatedTime] = useState(() => {
    const now = new Date();
    return `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

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

  useEffect(() => {
    let isMounted = true;

    const fetchLiveDepartures = async () => {
      try {
        const data = await tripService.getTimetables(activeFilter, searchQuery);
        if (isMounted && data?.stops) {
          setAllStops(data.stops);
          if (data.updated_at) setUpdatedTime(data.updated_at);
        }
      } catch (err) {
        console.error('Timetables API error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(fetchLiveDepartures, 180);
    const interval = setInterval(fetchLiveDepartures, 30000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [activeFilter, searchQuery]);

  const filteredStops = useMemo(() => {
    const q = normalizeText(searchQuery.trim());

    return allStops
      .filter((stop) => activeFilter === 'all' || stop.transport_type === activeFilter)
      .map((stop) => {
        if (!q) {
          return {
            ...stop,
            departures: stop.departures.slice(0, 3)
          };
        }

        const stopMatches = normalizeText(stop.stop_name).includes(q);
        const matchingDeps = stop.departures.filter(
          (d) =>
            normalizeText(d.line).includes(q) ||
            normalizeText(d.direction).includes(q)
        );

        if (stopMatches) {
          return stop;
        }
        if (matchingDeps.length > 0) {
          return {
            ...stop,
            departures: matchingDeps
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [allStops, activeFilter, searchQuery]);

  const renderTransportIcon = (type) => {
    if (type === 'bus') {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 6v6"></path><path d="M15 6v6"></path><path d="M2 12h19.6"></path>
          <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"></path>
          <circle cx="7" cy="18" r="2"></circle><path d="M9 18h5"></path><circle cx="16" cy="18" r="2"></circle>
        </svg>
      );
    }
    if (type === 'metro') {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="3" width="16" height="16" rx="4"></rect>
          <path d="M8 15l4-8 4 8"></path>
          <path d="M9.5 12h5"></path>
          <path d="M8 19l-2 3"></path><path d="M16 19l2 3"></path>
        </svg>
      );
    }
    if (type === 'train') {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="3" width="16" height="15" rx="3"></rect>
          <path d="M4 11h16"></path>
          <path d="M8 18l-2 3"></path><path d="M16 18l2 3"></path>
          <circle cx="8.5" cy="14.5" r="1"></circle><circle cx="15.5" cy="14.5" r="1"></circle>
        </svg>
      );
    }
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="16" rx="2"></rect>
        <path d="M4 11h16"></path><path d="M12 3v8"></path>
        <circle cx="8" cy="16" r="1"></circle><circle cx="16" cy="16" r="1"></circle>
      </svg>
    );
  };

  const isDark = theme === 'dark';
  const currentLang = (i18n.language || 'en').toLowerCase();

  return (
    <div className="timetables-page">
      <style>{`
        .timetables-page {
          display: flex;
          flex-direction: column;
          height: 100%;
          background-color: var(--bg-color);
          overflow-y: auto;
          scrollbar-width: none;
          padding: 16px 22px 28px 22px;
          color: var(--text-main);
          transition: background-color 0.3s;
        }
        .timetables-page::-webkit-scrollbar { display: none; }

        [data-theme='dark'] .timetables-page {
          --bg-color: #112019;
          --card-bg: #1B3126;
          --search-bg: #1B3126;
          --pill-inactive-bg: #1E382B;
          --pill-inactive-text: #D6E6DEC9;
          --pill-active-bg: #60DFAC;
          --pill-active-text: #112019;
          --accent-green: #60DFAC;
          --badge-bg: #233E31;
          --badge-text: #60DFAC;
          --text-main: #F1F7F4;
          --text-muted: #A0B4AA;
          --border: #2B4437;
          --lang-pill-bg: #1B3126;
          --lang-active-bg: #2B4437;
        }

        [data-theme='light'] .timetables-page {
          --search-bg: #FFFFFF;
          --pill-inactive-bg: #E8F2EC;
          --pill-inactive-text: #2C4438;
          --pill-active-bg: #087D56;
          --pill-active-text: #FFFFFF;
          --accent-green: #087D56;
          --badge-bg: #E6F4EE;
          --badge-text: #087D56;
          --lang-pill-bg: #E8F2EC;
          --lang-active-bg: #FFFFFF;
        }

        /* --- TOP BAR --- */
        .tt-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-shrink: 0;
        }
        .tt-topbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .tt-topbar-right {
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

        /* --- PIGUŁKA JĘZYKOWA PL / EN --- */
        .tt-lang-switch {
          display: flex;
          align-items: center;
          background: var(--lang-pill-bg);
          border: 1px solid var(--border);
          border-radius: 999px;
          padding: 3px;
          gap: 2px;
        }
        .tt-lang-btn {
          border: none;
          background: transparent;
          padding: 5px 10px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        .tt-lang-btn.active {
          background: var(--lang-active-bg);
          color: var(--text-main);
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }

        /* --- HERO TITLE & LOCATION --- */
        .tt-title {
          font-size: 1.85rem;
          font-weight: 800;
          color: var(--text-main);
          margin: 0 0 6px 0;
          letter-spacing: -0.02em;
          flex-shrink: 0;
        }
        .tt-location {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 18px;
          font-weight: 500;
          flex-shrink: 0;
        }
        .tt-location svg {
          color: var(--accent-green);
          flex-shrink: 0;
        }

        /* --- STAŁA, DUŻA PIGUŁKA WYSZUKIWARKI (ZERO SKAKANIA PRZY PISANIU) --- */
        .tt-search-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
          background: var(--search-bg);
          border: 1.5px solid var(--border);
          border-radius: 999px;
          padding: 0 18px;
          height: 56px;
          min-height: 56px;
          max-height: 56px;
          box-sizing: border-box;
          flex-shrink: 0;
          margin-bottom: 16px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .tt-search-wrapper:focus-within {
          border-color: var(--accent-green);
          box-shadow: 0 4px 14px rgba(8, 125, 86, 0.12);
        }
        .tt-search-wrapper svg {
          color: var(--text-muted);
          flex-shrink: 0;
        }
        .tt-search-wrapper input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-main);
          outline: none;
          height: 100%;
          padding: 0;
          margin: 0;
          line-height: 56px;
        }
        .tt-search-wrapper input::placeholder {
          color: var(--text-muted);
          font-weight: 400;
        }
        .tt-clear-btn {
          background: var(--pill-inactive-bg);
          border: none;
          color: var(--text-main);
          font-size: 0.75rem;
          width: 26px;
          height: 26px;
          min-width: 26px;
          min-height: 26px;
          padding: 0;
          margin: 0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: opacity 0.15s ease;
        }
        .tt-clear-btn.hidden {
          opacity: 0;
          pointer-events: none;
        }
        .tt-clear-btn.visible {
          opacity: 1;
          cursor: pointer;
        }

        /* --- FILTER PILLS --- */
        .tt-filters {
          display: flex;
          gap: 8px;
          margin-bottom: 18px;
          overflow-x: auto;
          scrollbar-width: none;
          flex-shrink: 0;
          padding-bottom: 2px;
        }
        .tt-filters::-webkit-scrollbar { display: none; }

        .tt-filter-pill {
          height: 42px;
          padding: 0 16px;
          border-radius: 21px;
          border: none;
          background-color: var(--pill-inactive-bg);
          color: var(--pill-inactive-text);
          font-size: 0.84rem;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .tt-filter-pill.active {
          background-color: var(--pill-active-bg);
          color: var(--pill-active-text);
        }

        /* --- LIVE DEPARTURES STATUS ROW --- */
        .tt-status-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding: 0 2px;
          flex-shrink: 0;
        }
        .tt-live-indicator {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: var(--accent-green);
          text-transform: uppercase;
        }
        .live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background-color: var(--accent-green);
          animation: pulseDot 1.8s infinite ease-in-out;
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        .tt-updated-text {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        /* --- STOP CARDS --- */
        .tt-stops-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          padding-bottom: 12px;
        }
        .tt-stop-card {
          background-color: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 22px;
          padding: 16px 18px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.02);
        }
        .tt-stop-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-bottom: 12px;
          margin-bottom: 10px;
          border-bottom: 1px solid var(--border);
        }
        .tt-stop-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background-color: var(--badge-bg);
          color: var(--badge-text);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .tt-stop-title-group strong {
          display: block;
          font-size: 1rem;
          font-weight: 800;
          color: var(--text-main);
        }
        .tt-stop-title-group span {
          display: block;
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-top: 2px;
        }

        /* --- DEPARTURE ROWS INSIDE CARD --- */
        .tt-departure-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 0;
        }
        .tt-dep-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .tt-line-badge {
          min-width: 40px;
          height: 30px;
          padding: 0 8px;
          border-radius: 9px;
          background-color: var(--badge-bg);
          color: var(--badge-text);
          font-size: 0.82rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tt-dep-direction strong {
          display: block;
          font-size: 0.92rem;
          font-weight: 700;
          color: var(--text-main);
        }
        .tt-dep-direction span {
          display: block;
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 1px;
        }
        .tt-dep-time {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }
        .tt-dep-time strong {
          font-size: 1.55rem;
          font-weight: 800;
          color: var(--accent-green);
          line-height: 1;
        }
        .tt-dep-time span {
          font-size: 0.78rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .tt-empty {
          text-align: center;
          padding: 36px 16px;
          color: var(--text-muted);
          font-size: 0.9rem;
        }
      `}</style>

      {/* Topbar */}
      <div className="tt-topbar">
        <div className="tt-topbar-left">
          <button className="circle-icon-btn" onClick={() => navigate('/')} aria-label="Back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <span className="topbar-title">{t('tt_header')}</span>
        </div>

        <div className="tt-topbar-right">
          <button className="circle-icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {isDark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            )}
          </button>

          <div className="tt-lang-switch">
            <button
              type="button"
              className={`tt-lang-btn ${currentLang.startsWith('pl') ? 'active' : ''}`}
              onClick={() => changeLanguage('pl')}
            >
              PL
            </button>
            <button
              type="button"
              className={`tt-lang-btn ${currentLang.startsWith('en') ? 'active' : ''}`}
              onClick={() => changeLanguage('en')}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* Nagłówek i lokalizacja */}
      <h1 className="tt-title">{t('tt_title')}</h1>
      <div className="tt-location">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        <span>{t('tt_near_you')}</span>
      </div>

      {/* Stała, duża pigułka wyszukiwarki (56px, nie skacze przy pisaniu) */}
      <div className="tt-search-wrapper">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input
          type="text"
          placeholder={t('tt_search_ph')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          type="button"
          className={`tt-clear-btn ${searchQuery ? 'visible' : 'hidden'}`}
          onClick={() => setSearchQuery('')}
          aria-label="Clear search"
        >
          ✕
        </button>
      </div>

      {/* Pigułki filtrów: All / Trams / Buses / Metro / Trains */}
      <div className="tt-filters">
        <button
          type="button"
          className={`tt-filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          {t('tt_filter_all')}
        </button>
        <button
          type="button"
          className={`tt-filter-pill ${activeFilter === 'tram' ? 'active' : ''}`}
          onClick={() => setActiveFilter('tram')}
        >
          {t('tt_filter_trams')}
        </button>
        <button
          type="button"
          className={`tt-filter-pill ${activeFilter === 'bus' ? 'active' : ''}`}
          onClick={() => setActiveFilter('bus')}
        >
          {t('tt_filter_buses')}
        </button>
        <button
          type="button"
          className={`tt-filter-pill ${activeFilter === 'metro' ? 'active' : ''}`}
          onClick={() => setActiveFilter('metro')}
        >
          {t('tt_filter_metro')}
        </button>
        <button
          type="button"
          className={`tt-filter-pill ${activeFilter === 'train' ? 'active' : ''}`}
          onClick={() => setActiveFilter('train')}
        >
          {t('tt_filter_trains')}
        </button>
      </div>

      {/* Pasek LIVE DEPARTURES */}
      <div className="tt-status-row">
        <div className="tt-live-indicator">
          <span className="live-dot" />
          <span>{t('tt_live')}</span>
        </div>
        <span className="tt-updated-text">
          {t('tt_updated')} {updatedTime}
        </span>
      </div>

      {/* Lista kart przystanków i stacji */}
      <div className="tt-stops-list">
        {loading ? (
          <div className="tt-empty">Loading live ZTM Warsaw departures...</div>
        ) : filteredStops.length === 0 ? (
          <div className="tt-empty">{t('tt_empty')}</div>
        ) : (
          filteredStops.map((stop) => (
            <div key={stop.id} className="tt-stop-card">
              <div className="tt-stop-header">
                <div className="tt-stop-icon">
                  {renderTransportIcon(stop.transport_type)}
                </div>
                <div className="tt-stop-title-group">
                  <strong>{stop.stop_name}</strong>
                  <span>{stop.walk_time} {t('tt_min_walk')} · {stop.distance_m} m</span>
                </div>
              </div>

              {stop.departures.map((dep, idx) => (
                <div key={`${stop.id}-${dep.line}-${idx}`} className="tt-departure-row">
                  <div className="tt-dep-left">
                    <div className="tt-line-badge">{dep.line}</div>
                    <div className="tt-dep-direction">
                      <strong>{dep.direction}</strong>
                      <span>{t('tt_then')} {dep.next_min} {t('tt_min')}</span>
                    </div>
                  </div>
                  <div className="tt-dep-time">
                    <strong>{dep.in_min}</strong>
                    <span>{t('tt_min')}</span>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}