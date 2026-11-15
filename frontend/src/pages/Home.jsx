/* eslint-disable */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { tripService } from '../api';
import Header from '../components/Header';

export default function Home() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [preferences, setPreferences] = useState('');
  const [matchedRoute, setMatchedRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Lokalizacja GPS użytkownika (domyślnie Warszawa Śródmieście, aktualizowana przez navigator.geolocation)
  const [userCoords, setUserCoords] = useState({
    lat: 52.2302,
    lon: 21.0104,
    nearestStop: 'Centrum',
    gpsActive: false,
  });

  const [activeDropdown, setActiveDropdown] = useState(null); // 'origin' | 'destination' | 'preferences' | null
  const [stopSuggestions, setStopSuggestions] = useState([]);
  const [livePrefOptions, setLivePrefOptions] = useState([]);

  const isPl = (i18n.language || 'en').toLowerCase().startsWith('pl');

  const detectUserGps = (fillOrigin = false) => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const nearby = await tripService.suggestStops('', latitude, longitude, 5);
          const closestName = nearby?.[0]?.name || 'Centrum';
          setUserCoords({
            lat: latitude,
            lon: longitude,
            nearestStop: closestName,
            gpsActive: true,
          });
          if (fillOrigin) {
            setOrigin(closestName);
            setActiveDropdown(null);
          }
        } catch {
          setUserCoords((prev) => ({
            ...prev,
            lat: latitude,
            lon: longitude,
            gpsActive: true,
          }));
        }
      },
      () => {
        if (fillOrigin) {
          setOrigin(userCoords.nearestStop || 'Centrum');
          setActiveDropdown(null);
        }
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const fetchHistory = async () => {
    try {
      const data = await tripService.getHistory(15);
      const list = Array.isArray(data) ? data : data?.data || [];
      const realUserHistory = list.filter(
        (item) =>
          !(
            item.origin === 'Home' &&
            (item.destination === 'Old Town' || item.destination === 'Chopin Airport')
          )
      );
      setHistory(realUserHistory);
    } catch (error) {
      console.error('Błąd pobierania historii:', error);
      setHistory([]);
    }
  };

  const fetchLiveContext = async () => {
    try {
      const ctx = await tripService.getContextPreferences();
      if (ctx?.options) {
        setLivePrefOptions(ctx.options);
      }
    } catch (err) {
      console.error('Context API error:', err);
    }
  };

  useEffect(() => {
    detectUserGps(false);
    fetchHistory();
    fetchLiveContext();
    const savedLastRoute = localStorage.getItem('wayfinder_active_route');
    if (savedLastRoute) {
      try {
        setMatchedRoute(JSON.parse(savedLastRoute));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (activeDropdown !== 'origin' && activeDropdown !== 'destination') {
      setStopSuggestions([]);
      return;
    }
    const queryText = activeDropdown === 'origin' ? origin : destination;
    const timer = setTimeout(async () => {
      try {
        const list = await tripService.suggestStops(
          queryText,
          userCoords.lat,
          userCoords.lon,
          30
        );
        setStopSuggestions(list || []);
      } catch {
        setStopSuggestions([]);
      }
    }, 140);

    return () => clearTimeout(timer);
  }, [origin, destination, activeDropdown, userCoords.lat, userCoords.lon]);

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const origVal = origin.trim() || userCoords.nearestStop || 'Centrum';
    const destVal = destination.trim();
    if (!destVal) return;

    setLoading(true);
    setActiveDropdown(null);
    try {
      const createdRoute = await tripService.searchRoute(
        origVal,
        destVal,
        preferences.trim()
      );
      setMatchedRoute(createdRoute);
      localStorage.setItem('wayfinder_active_route', JSON.stringify(createdRoute));
      await fetchHistory();
    } catch (error) {
      console.error('Błąd wyszukiwania trasy:', error);
    } finally {
      setLoading(false);
    }
  };

  const openRouteOnMap = async (routeObj) => {
    if (!routeObj) return;
    // Jeśli klikamy element z historii, który nie ma jeszcze zapisanych route_stops, dociągamy pełną trasę z API
    if (!routeObj.route_stops || routeObj.route_stops.length === 0) {
      try {
        const freshRoute = await tripService.searchRoute(
          routeObj.origin,
          routeObj.destination,
          routeObj.preferences || ''
        );
        localStorage.setItem('wayfinder_active_route', JSON.stringify(freshRoute));
        navigate('/route-map', { state: { route: freshRoute } });
        return;
      } catch {}
    }
    localStorage.setItem('wayfinder_active_route', JSON.stringify(routeObj));
    navigate('/route-map', { state: { route: routeObj } });
  };

  const handleDeleteHistoryItem = async (e, id) => {
    e.stopPropagation();
    try {
      await tripService.deleteRoute(id);
      await fetchHistory();
    } catch (err) {
      console.error('Delete route error:', err);
    }
  };

  const renderTransportIcon = (type) => {
    if (type === 'bus') {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="3" width="16" height="16" rx="2"></rect>
          <path d="M4 11h16"></path>
          <circle cx="8" cy="16" r="1"></circle>
          <circle cx="16" cy="16" r="1"></circle>
        </svg>
      );
    }
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="16" rx="2"></rect>
        <path d="M4 11h16"></path>
        <path d="M12 3v8"></path>
        <circle cx="8" cy="16" r="1"></circle>
        <circle cx="16" cy="16" r="1"></circle>
      </svg>
    );
  };

  const renderAiMatchCard = () => {
    if (!matchedRoute) return null;
    const rec = matchedRoute.ai_recommendation || {
      title: matchedRoute.ai_title || 'Take the tram',
      desc: matchedRoute.ai_desc || 'Line 17 · low-floor access',
      time: matchedRoute.ai_time || '18',
      co2: matchedRoute.ai_co2 || '0.2 kg CO₂',
    };

    const totalMin = parseInt(rec.time, 10) || 18;
    const walkMin = matchedRoute.walk_min || 3;
    const rideMin = matchedRoute.ride_min || Math.max(3, totalMin - walkMin);
    const lineNum = matchedRoute.line_number || '17';
    const stopsCount = matchedRoute.stops_count || 4;

    const mainTitle =
      matchedRoute.transport_icon === 'bus'
        ? isPl
          ? 'Wsiądź w autobus'
          : 'Take the bus'
        : matchedRoute.transport_icon === 'metro'
        ? isPl
          ? 'Wsiądź w metro'
          : 'Take the metro'
        : isPl
        ? 'Wsiądź w tramwaj'
        : 'Take the tram';

    const subLineText = isPl
      ? `Linia ${lineNum} · niska podłoga · ${stopsCount} przyst.`
      : `Line ${lineNum} · low-floor access · ${stopsCount} stops`;

    const weatherNote = isPl
      ? `Z: ${matchedRoute.origin} → Do: ${matchedRoute.destination}`
      : `${matchedRoute.origin} → ${matchedRoute.destination}`;

    return (
      <div className="ai-match-wrapper">
        <div className="ai-match-header-row">
          <div className="ai-match-title-left">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" />
            </svg>
            <span>{isPl ? 'DOPASOWANIE AI' : 'YOUR AI MATCH'}</span>
          </div>
          <span className="ai-match-made-for">
            {isPl ? 'Dobrane do tej trasy' : 'Made for this trip'}
          </span>
        </div>

        <div className="ai-match-card" onClick={() => openRouteOnMap(matchedRoute)}>
          <div className="ai-match-top-tags">
            <span className="best-balance-badge">
              {isPl ? 'NAJLEPSZY BALANS' : 'BEST BALANCE'}
            </span>
            <span className="fast-dry-text">
              {isPl ? 'Szybko. Sucho. Ekologicznie.' : 'Fast. Dry. Low-carbon.'}
            </span>
          </div>

          <div className="ai-match-main-row">
            <div className="ai-match-left-group">
              <div className="ai-match-icon-box">
                {renderTransportIcon(matchedRoute.transport_icon)}
              </div>
              <div className="ai-match-titles">
                <h4>{mainTitle}</h4>
                <p>{subLineText}</p>
              </div>
            </div>

            <button
              type="button"
              className="ai-match-go-btn"
              onClick={(e) => {
                e.stopPropagation();
                openRouteOnMap(matchedRoute);
              }}
              aria-label="Open route map"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"></path>
              </svg>
            </button>
          </div>

          <div className="ai-match-stats-row">
            <div className="ai-match-big-time">
              <strong>{totalMin}</strong>
              <span>min</span>
            </div>
            <div className="ai-match-stat-divider" />
            <div className="ai-match-breakdown">
              <strong>
                {walkMin} min {isPl ? 'pieszo' : 'walk'} · {rideMin} min{' '}
                {isPl ? 'jazdy' : 'ride'}
              </strong>
              <span>{weatherNote}</span>
            </div>
          </div>

          <div className="ai-match-co2-bar">
            <div className="ai-match-co2-left">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path>
              </svg>
              <span>{isPl ? 'Ślad węglowy' : 'Carbon Footprint'}</span>
            </div>
            <strong>{rec.co2.replace(' saved', '').replace(' Saved', '')}</strong>
          </div>
        </div>
      </div>
    );
  };

  const visibleHistory = showAllHistory ? history : history.slice(0, 3);

  return (
    <>
      <style>{`
        .main-content {
          padding: 0 20px 28px 20px;
        }
        .hero-text h2 {
          font-family: 'Inter', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: var(--text-main);
          line-height: 1.2;
          letter-spacing: -0.02em;
          margin: 2px 0 4px 0;
        }
        .hero-text p {
          color: var(--text-muted);
          font-size: 14.5px;
          font-weight: 400;
          margin: 0 0 10px 0;
        }

        /* Pasek bieżącej lokalizacji GPS użytkownika */
        .user-gps-banner {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 11px;
          border-radius: 999px;
          background: var(--primary-light);
          color: var(--primary);
          font-size: 0.74rem;
          font-weight: 700;
          margin-bottom: 14px;
          cursor: pointer;
          border: none;
        }
        .user-gps-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--primary);
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
        }

        .search-card {
          position: relative;
          background: var(--card-bg);
          border-radius: 22px;
          padding: 8px 18px;
          box-shadow: var(--shadow);
          border: 1px solid var(--border);
          margin-bottom: 10px;
        }
        .preferences-card {
          position: relative;
          background: var(--card-bg);
          border-radius: 18px;
          padding: 6px 18px;
          box-shadow: var(--shadow);
          border: 1px solid var(--border);
          margin-bottom: 14px;
        }
        .input-group {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 8px 0;
        }
        .input-icon {
          display: flex;
          justify-content: center;
          align-items: center;
          color: var(--primary);
          flex-shrink: 0;
        }
        .input-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .input-content label {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: 2px;
        }
        .input-content input {
          border: none;
          background: transparent;
          font-size: 0.96rem;
          font-weight: 600;
          color: var(--text-main);
          padding: 0;
          width: 100%;
          text-overflow: ellipsis;
        }
        .input-content input::placeholder {
          color: var(--text-muted);
          font-weight: 500;
          opacity: 0.65;
        }
        .input-content input:focus {
          outline: none;
        }
        .input-divider {
          height: 1px;
          background: var(--border);
          margin-left: 34px;
          margin-right: 52px;
        }
        .swap-btn {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: var(--primary-light);
          color: var(--primary);
          border: none;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          transition: transform 0.15s;
        }
        .swap-btn:active {
          transform: translateY(-50%) scale(0.92);
        }

        /* --- PRZEWIJANY DROPDOWN 30 PRZYSTANKÓW ZTM --- */
        .clean-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          z-index: 60;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 18px;
          box-shadow: 0 14px 32px rgba(0, 0, 0, 0.2);
          overflow: hidden;
        }
        .clean-dropdown-scroll {
          max-height: 245px;
          overflow-y: auto;
        }
        .clean-dropdown-header {
          padding: 8px 14px;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--primary);
          background: var(--primary-light);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .clean-dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 14px;
          border: none;
          border-bottom: 1px solid var(--border);
          background: transparent;
          color: var(--text-main);
          cursor: pointer;
          text-align: left;
          transition: background-color 0.15s;
        }
        .clean-dropdown-item:last-child {
          border-bottom: none;
        }
        .clean-dropdown-item:hover {
          background: var(--primary-light);
        }
        .cd-item-left {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }
        .cd-item-icon {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: var(--primary-light);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cd-item-text {
          min-width: 0;
        }
        .cd-item-text strong {
          display: block;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cd-item-text span {
          display: block;
          font-size: 0.72rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .cd-item-badge {
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--primary);
          background: var(--primary-light);
          padding: 3px 8px;
          border-radius: 999px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .primary-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          height: 52px;
          background-color: var(--primary);
          color: #FFFFFF;
          padding: 0 20px;
          border: none;
          border-radius: 16px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.15s;
        }
        [data-theme='dark'] .primary-btn {
          color: #112019;
        }
        .primary-btn-content {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0 auto;
        }
        .primary-btn:active {
          transform: scale(0.98);
        }

        .ai-match-wrapper {
          margin-top: 18px;
        }
        .ai-match-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          padding: 0 2px;
        }
        .ai-match-title-left {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: var(--primary);
          text-transform: uppercase;
        }
        .ai-match-made-for {
          font-size: 0.74rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .ai-match-card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 22px;
          padding: 16px;
          box-shadow: var(--shadow);
          cursor: pointer;
          transition: transform 0.15s, border-color 0.2s;
        }
        .ai-match-card:hover {
          border-color: var(--primary);
        }
        .ai-match-top-tags {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .best-balance-badge {
          background: var(--primary-light);
          color: var(--primary);
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          padding: 4px 10px;
          border-radius: 8px;
          text-transform: uppercase;
        }
        .fast-dry-text {
          font-size: 0.73rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .ai-match-main-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 14px;
        }
        .ai-match-left-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ai-match-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: var(--primary-light);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ai-match-titles h4 {
          margin: 0 0 2px 0;
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text-main);
        }
        .ai-match-titles p {
          margin: 0;
          font-size: 0.78rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .ai-match-go-btn {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          border: none;
          background: var(--primary-light);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
        }
        .ai-match-stats-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 14px;
        }
        .ai-match-big-time {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }
        .ai-match-big-time strong {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--text-main);
          line-height: 1;
        }
        .ai-match-big-time span {
          font-size: 0.82rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        .ai-match-stat-divider {
          width: 1px;
          height: 28px;
          background: var(--border);
        }
        .ai-match-breakdown strong {
          display: block;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-main);
        }
        .ai-match-breakdown span {
          display: block;
          font-size: 0.73rem;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .ai-match-co2-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--primary-light);
          color: var(--primary);
          padding: 9px 14px;
          border-radius: 12px;
          font-size: 0.78rem;
        }
        .ai-match-co2-left {
          display: flex;
          align-items: center;
          gap: 7px;
          font-weight: 600;
        }
        .ai-match-co2-bar strong {
          font-weight: 800;
        }

        .history-section {
          margin-top: 22px;
          margin-bottom: 16px;
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .section-header h3 {
          font-size: 1.05rem;
          font-weight: 800;
          margin: 0;
          color: var(--text-main);
        }
        .see-all-btn {
          background: none;
          border: none;
          color: var(--primary);
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
        }
        .history-list {
          display: flex;
          flex-direction: column;
        }
        .history-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 0;
          border-bottom: 1px solid var(--border);
          cursor: pointer;
        }
        .history-item:last-child {
          border-bottom: none;
        }
        .history-icon {
          width: 40px;
          height: 40px;
          background: var(--primary-light);
          border-radius: 13px;
          display: flex;
          justify-content: center;
          align-items: center;
          color: var(--primary);
          flex-shrink: 0;
        }
        .history-details {
          flex: 1;
          min-width: 0;
        }
        .history-details strong {
          display: block;
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .history-details p {
          margin: 0;
          font-size: 0.76rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .history-del-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          padding: 4px 6px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.75rem;
          opacity: 0.6;
        }
        .history-del-btn:hover {
          opacity: 1;
          color: #ef4444;
        }
        .history-arrow {
          color: var(--text-muted);
          display: flex;
          align-items: center;
        }
      `}</style>

      <div className="scrollable-content">
        <Header />
        <main className="main-content">
          <div className="hero-text">
            <h2>{t('hero_title')}</h2>
            <p>{t('hero_subtitle')}</p>
            <button
              type="button"
              className="user-gps-banner"
              onClick={() => detectUserGps(true)}
              title={isPl ? 'Kliknij, aby ustawić jako punkt startowy' : 'Click to set as Origin'}
            >
              <span className="user-gps-dot" />
              <span>
                {isPl
                  ? `Twoja lokalizacja: blisko ${userCoords.nearestStop} (${userCoords.lat.toFixed(3)}, ${userCoords.lon.toFixed(3)})`
                  : `Your location: near ${userCoords.nearestStop} (${userCoords.lat.toFixed(3)}, ${userCoords.lon.toFixed(3)})`}
              </span>
            </button>
          </div>

          <section className="search-card">
            <div className="input-group">
              <div className="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4"></circle>
                  <circle cx="12" cy="12" r="9"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                </svg>
              </div>
              <div className="input-content">
                <label>{t('origin')}</label>
                <input
                  type="text"
                  placeholder={
                    isPl
                      ? `Aktualna lokalizacja (${userCoords.nearestStop})`
                      : `Current location (${userCoords.nearestStop})`
                  }
                  value={origin}
                  onFocus={() => setActiveDropdown('origin')}
                  onBlur={() => setTimeout(() => setActiveDropdown(null), 200)}
                  onChange={(e) => setOrigin(e.target.value)}
                />
              </div>
            </div>

            <div className="input-divider"></div>

            <div className="input-group">
              <div className="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div className="input-content">
                <label>{t('destination')}</label>
                <input
                  type="text"
                  placeholder={isPl ? 'np. Warszawa Centralna, Bemowo...' : 'e.g. Warszawa Centralna, Bemowo...'}
                  value={destination}
                  onFocus={() => setActiveDropdown('destination')}
                  onBlur={() => setTimeout(() => setActiveDropdown(null), 200)}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
            </div>

            <button
              type="button"
              className="swap-btn"
              onClick={handleSwap}
              aria-label="Swap locations"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="17 4 17 20"></polyline>
                <polyline points="13 8 17 4 21 8"></polyline>
                <polyline points="7 20 7 4"></polyline>
                <polyline points="3 16 7 20 11 16"></polyline>
              </svg>
            </button>

            {/* Przewijana lista 30 przystanków ZTM + przycisk bieżącego GPS */}
            {(activeDropdown === 'origin' || activeDropdown === 'destination') && (
              <div className="clean-dropdown">
                <div className="clean-dropdown-header">
                  <span>{isPl ? 'Wybierz przystanek ZTM (6983 w bazie)' : 'Select ZTM Stop (6,983 live)'}</span>
                  <span>{stopSuggestions.length} {isPl ? 'wyników' : 'stops'}</span>
                </div>
                <div className="clean-dropdown-scroll">
                  {activeDropdown === 'origin' && (
                    <button
                      type="button"
                      className="clean-dropdown-item"
                      onMouseDown={() => detectUserGps(true)}
                    >
                      <div className="cd-item-left">
                        <div className="cd-item-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                            <circle cx="12" cy="12" r="4" />
                            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                          </svg>
                        </div>
                        <div className="cd-item-text">
                          <strong>{isPl ? 'Użyj mojej aktualnej lokalizacji GPS' : 'Use my current GPS location'}</strong>
                          <span>
                            {isPl ? `Najbliższy przystanek: ${userCoords.nearestStop}` : `Nearest stop: ${userCoords.nearestStop}`}
                          </span>
                        </div>
                      </div>
                      <span className="cd-item-badge">GPS</span>
                    </button>
                  )}

                  {stopSuggestions.map((s, idx) => (
                    <button
                      key={`${s.name}-${idx}`}
                      type="button"
                      className="clean-dropdown-item"
                      onMouseDown={() => {
                        if (activeDropdown === 'origin') setOrigin(s.name);
                        else setDestination(s.name);
                        setActiveDropdown(null);
                      }}
                    >
                      <div className="cd-item-left">
                        <div className="cd-item-icon">
                          {renderTransportIcon(s.type)}
                        </div>
                        <div className="cd-item-text">
                          <strong>{s.name}</strong>
                          <span>
                            {isPl ? 'Kierunek:' : 'Dir:'} {s.kierunek || 'Centrum'} · {s.type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <span className="cd-item-badge">
                        {s.distance_m >= 1000
                          ? `${(s.distance_m / 1000).toFixed(1)} km`
                          : `${s.distance_m} m`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="preferences-card">
            <div className="input-group">
              <div className="input-icon" style={{ color: 'var(--text-muted)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" y1="8" x2="20" y2="8"></line>
                  <circle cx="10" cy="8" r="3"></circle>
                  <line x1="4" y1="16" x2="20" y2="16"></line>
                  <circle cx="15" cy="16" r="3"></circle>
                </svg>
              </div>
              <div className="input-content">
                <label>{t('preferences')}</label>
                <input
                  type="text"
                  placeholder={t('preferences_ph')}
                  value={preferences}
                  onFocus={() => setActiveDropdown('preferences')}
                  onBlur={() => setTimeout(() => setActiveDropdown(null), 200)}
                  onChange={(e) => setPreferences(e.target.value)}
                />
              </div>
            </div>

            {activeDropdown === 'preferences' && livePrefOptions.length > 0 && (
              <div className="clean-dropdown">
                <div className="clean-dropdown-header">
                  <span>
                    {isPl
                      ? 'Warunki na żywo (dane.um.warszawa.pl)'
                      : 'Warsaw Live Conditions API'}
                  </span>
                  <span>Live</span>
                </div>
                {livePrefOptions.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className="clean-dropdown-item"
                    onMouseDown={() => {
                      setPreferences(isPl ? opt.value_pl : opt.value_en);
                      setActiveDropdown(null);
                    }}
                  >
                    <div className="cd-item-left">
                      <div className="cd-item-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" />
                        </svg>
                      </div>
                      <div className="cd-item-text">
                        <strong>{isPl ? opt.value_pl : opt.value_en}</strong>
                        <span>{isPl ? opt.label_pl : opt.label_en}</span>
                      </div>
                    </div>
                    <span className="cd-item-badge">{opt.badge}</span>
                  </button>
                ))}
              </div>
            )}
          </section>

          <button onClick={handleSubmit} disabled={loading} className="primary-btn">
            <span style={{ width: '20px' }}></span>
            <div className="primary-btn-content">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z"></path>
              </svg>
              <span>{loading ? t('analyzing') : t('find_route')}</span>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"></path>
            </svg>
          </button>

          {renderAiMatchCard()}

          <section className="history-section">
            <div className="section-header">
              <h3>{t('recent_searches')}</h3>
              {history.length > 3 && (
                <button
                  type="button"
                  className="see-all-btn"
                  onClick={() => setShowAllHistory((prev) => !prev)}
                >
                  {showAllHistory ? (isPl ? 'Mniej' : 'Show less') : t('see_all')}
                </button>
              )}
            </div>
            <div className="history-list">
              {visibleHistory.map((item, index) => (
                <div
                  key={item.id || index}
                  className="history-item"
                  onClick={() => openRouteOnMap(item)}
                >
                  <div className="history-icon">
                    {renderTransportIcon(item.transport_icon)}
                  </div>
                  <div className="history-details">
                    <strong>
                      {item.origin} → {item.destination}
                    </strong>
                    <p>{item.subtitle || item.preferences}</p>
                  </div>
                  {item.id && (
                    <button
                      type="button"
                      className="history-del-btn"
                      onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                      title="Remove"
                    >
                      ✕
                    </button>
                  )}
                  <div className="history-arrow">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', margin: '6px 0' }}>
                  {isPl
                    ? 'Brak ostatnich wyszukiwań. Wyznacz trasę powyżej!'
                    : 'No recent searches yet. Find your first route above!'}
                </p>
              )}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}