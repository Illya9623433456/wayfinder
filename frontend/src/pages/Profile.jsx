import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const API_BASE = 'http://localhost:8000';

// Wyciąga wartość liczbową z tekstu np. "0.8 kg CO₂" -> 0.8
const parseCo2Value = (co2Str) => {
  if (!co2Str) return 0.3;
  const match = String(co2Str).replace(',', '.').match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0.3;
};

export default function Profile() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // Wczytujemy użytkownika od razu przy inicjalizacji stanu
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

  // Stan danych Eco z API
  const [ecoStats, setEcoStats] = useState({ totalCo2: '0.0', count: 0 });
  const [loadingEco, setLoadingEco] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
    }
  }, [user, navigate]);

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
        const totalCo2Num = list.reduce((acc, item) => acc + parseCo2Value(item.ai_co2), 0);
        setEcoStats({
          totalCo2: totalCo2Num.toFixed(1),
          count: list.length,
        });
        setLoadingEco(false);
      })
      .catch((err) => {
        console.error('Błąd pobierania danych Eco z API:', err);
        if (isMounted) setLoadingEco(false);
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

  const handleLogout = () => {
    localStorage.removeItem('wayfinder_user');
    navigate('/login');
  };

  const formatNameFromEmail = (emailStr) => {
    if (!emailStr) return 'Maja Kowalska';
    const localPart = emailStr.split('@')[0];
    const parts = localPart.split(/[._-]/);
    if (parts.length >= 2) {
      return parts
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
    return localPart.charAt(0).toUpperCase() + localPart.slice(1);
  };

  if (!user) return null;

  const currentLang = (i18n.language || 'en').toLowerCase();
  const isPl = currentLang.startsWith('pl');

  const journeysLabel = isPl
    ? `${ecoStats.count} ekologicznych przejazdów`
    : `${ecoStats.count} greener journeys`;

  return (
    <div className="profile-page">
      <style>{`
        .profile-page {
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
        .profile-page::-webkit-scrollbar { display: none; }

        [data-theme='dark'] .profile-page {
          --bg-color: #112019;
          --card-bg: #1B3126;
          --primary: #087D56;
          --accent-text: #60DFAC;
          --text-main: #F1F7F4;
          --text-muted: #A0B4AA;
          --border: #2B4437;
          --co2-card-bg: #1E3B2D;
          --co2-card-border: #2D5742;
          --icon-box-bg: #233E31;
        }

        [data-theme='light'] .profile-page {
          --accent-text: #087D56;
          --co2-card-bg: #E6F4EE;
          --co2-card-border: #CDE9DC;
          --icon-box-bg: #EBF5F0;
        }

        /* --- TOP HEADER --- */
        .profile-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 22px;
        }
        .profile-topbar-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .profile-topbar-right {
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

        /* --- USER IDENTITY --- */
        .profile-name {
          font-size: 1.9rem;
          font-weight: 800;
          color: var(--text-main);
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
        }
        .profile-email {
          font-size: 1.05rem;
          color: var(--text-muted);
          margin: 0 0 26px 0;
          font-weight: 500;
        }

        /* --- IMPACT SECTION --- */
        .impact-heading {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-main);
          margin: 0 0 4px 0;
        }
        .impact-subheading {
          font-size: 0.82rem;
          color: var(--text-muted);
          margin: 0 0 16px 0;
        }

        /* --- CO2 CARD --- */
        .co2-card {
          background-color: var(--co2-card-bg);
          border: 1px solid var(--co2-card-border);
          border-radius: 22px;
          padding: 20px;
          margin-bottom: 26px;
        }
        .co2-card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4px;
        }
        .co2-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--accent-text);
        }
        .leaf-badge {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          background: var(--card-bg);
          color: var(--accent-text);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .co2-value-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 16px;
        }
        .co2-number {
          font-size: 2.75rem;
          font-weight: 800;
          color: var(--text-main);
          line-height: 1;
          letter-spacing: -0.03em;
        }
        .co2-unit {
          font-size: 1rem;
          font-weight: 700;
          color: var(--accent-text);
        }
        .co2-divider {
          height: 1px;
          background-color: var(--co2-card-border);
          margin-bottom: 12px;
        }
        .co2-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.82rem;
        }
        .co2-footer strong {
          color: var(--text-main);
          font-weight: 700;
        }
        .co2-footer span {
          color: var(--text-muted);
        }

        /* --- YOUR ACCOUNT LIST CARD --- */
        .section-caption {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--text-muted);
          text-transform: uppercase;
          margin: 0 0 10px 4px;
        }
        .account-card {
          background-color: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 22px;
          padding: 6px 16px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.02);
          margin-bottom: 22px;
        }
        .account-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 0;
          border-bottom: 1px solid var(--border);
          background: transparent;
          width: 100%;
          border-left: none;
          border-right: none;
          border-top: none;
          text-align: left;
          cursor: pointer;
          color: var(--text-main);
        }
        .account-row:last-child {
          border-bottom: none;
        }
        .account-row-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .row-icon-box {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background-color: var(--icon-box-bg);
          color: var(--accent-text);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .row-texts strong {
          display: block;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
        }
        .row-texts span {
          display: block;
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .chevron-icon {
          color: var(--text-muted);
        }

        /* --- LANGUAGE PILL SWITCH --- */
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

        /* --- BOTTOM MOTTO ("Small trips. Lasting impact.") --- */
        .bottom-motto {
          text-align: center;
          font-size: 0.82rem;
          font-weight: 500;
          color: var(--text-muted);
          margin-top: auto;
          padding: 8px 0 4px 0;
        }
      `}</style>

      {/* Górny pasek: Wstecz + Tytuł + Kółko motywu + Pigułka PL/EN */}
      <div className="profile-topbar">
        <div className="profile-topbar-left">
          <button className="circle-icon-btn" onClick={() => navigate('/')} aria-label="Back">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          <span className="topbar-title">{t('profile_header', isPl ? 'Twoje konto' : 'Your account')}</span>
        </div>

        <div className="profile-topbar-right">
          <button className="circle-icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? (
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

      {/* Imię i e-mail */}
      <h1 className="profile-name">{user.name || formatNameFromEmail(user.email)}</h1>
      <p className="profile-email">{user.email}</p>

      {/* Nagłówek sekcji Impact */}
      <h2 className="impact-heading">{t('profile_impact_title', isPl ? 'Twój wpływ ma znaczenie.' : 'Your impact adds up.')}</h2>
      <p className="impact-subheading">{t('profile_impact_sub', isPl ? 'Każda przemyślana podróż robi różnicę.' : 'Every thoughtful journey makes a difference.')}</p>

      {/* Karta CO2 */}
      <div className="co2-card">
        <div className="co2-card-top">
          <span className="co2-label">{t('profile_co2_title', isPl ? 'Zaoszczędzone CO2' : 'Total CO2 Saved')}</span>
          <div className="leaf-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 1 8.3A9.24 9.24 0 0 1 11 20Z"></path><path d="M15 8.5C14 12 11.5 16 11 20"></path></svg>
          </div>
        </div>

        <div className="co2-value-row">
          <span className="co2-number">
            {loadingEco ? '...' : ecoStats.totalCo2}
          </span>
          <span className="co2-unit">kg CO₂</span>
        </div>

        <div className="co2-divider"></div>

        <div className="co2-footer">
          <strong>{loadingEco ? '...' : journeysLabel}</strong>
          <span>{t('profile_since', isPl ? 'Od dołączenia' : 'Since joining')}</span>
        </div>
      </div>

      {/* Sekcja YOUR ACCOUNT */}
      <div className="section-caption">{t('profile_section_account', isPl ? 'TWOJE KONTO' : 'YOUR ACCOUNT')}</div>

      <div className="account-card">
        {/* 1. Settings */}
        <button type="button" className="account-row" onClick={() => navigate('/settings')}>
          <div className="account-row-left">
            <div className="row-icon-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </div>
            <div className="row-texts">
              <strong>{t('profile_settings', isPl ? 'Ustawienia' : 'Settings')}</strong>
              <span>{t('profile_settings_sub', isPl ? 'Wygląd i prywatność' : 'Appearance & privacy')}</span>
            </div>
          </div>
          <svg className="chevron-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>

        {/* 2. Language */}
        <div className="account-row" style={{ cursor: 'default' }}>
          <div className="account-row-left">
            <div className="row-icon-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
            </div>
            <div className="row-texts">
              <strong>{t('profile_language', isPl ? 'Język' : 'Language')}</strong>
            </div>
          </div>

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

        {/* 3. Ride history / Historia przejazdów -> przechodzi do /ride-history */}
        <button
          type="button"
          className="account-row"
          onClick={() => navigate('/ride-history')}
        >
          <div className="account-row-left">
            <div className="row-icon-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div className="row-texts">
              <strong>
                {isPl ? 'Historia przejazdów' : 'Ride history'}
              </strong>
              <span>
                {isPl
                  ? `${ecoStats.count} zapisanych tras · ${ecoStats.totalCo2} kg CO₂`
                  : `${ecoStats.count} saved trips · ${ecoStats.totalCo2} kg CO₂`}
              </span>
            </div>
          </div>
          <svg className="chevron-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>

        {/* 4. Log out */}
        <button type="button" className="account-row" onClick={handleLogout}>
          <div className="account-row-left">
            <div className="row-icon-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </div>
            <div className="row-texts">
              <strong>{t('profile_logout', isPl ? 'Wyloguj się' : 'Log out')}</strong>
            </div>
          </div>
          <svg className="chevron-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>

      {/* Napis na dole jak na Figmie */}
      <div className="bottom-motto">
        {isPl ? 'Małe podróże. Trwały wpływ.' : 'Small trips. Lasting impact.'}
      </div>
    </div>
  );
}