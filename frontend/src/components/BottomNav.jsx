import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <>
      <style>{`
        .bottom-nav {
          flex-shrink: 0;
          width: 100%;
          height: 85px;
          background: var(--nav-bg);
          backdrop-filter: blur(12px);
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding-bottom: 20px;
          z-index: 10;
          transition: background-color 0.3s, border-color 0.3s;
        }
        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          color: var(--text-muted);
          font-size: 0.75rem;
          font-weight: 500;
          flex: 1;
          transition: color 0.3s;
        }
        .nav-icon-wrapper {
          width: 60px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          transition: background-color 0.2s ease;
        }
        .nav-icon {
          width: 24px;
          height: 24px;
          stroke: var(--text-muted);
          transition: stroke 0.3s;
        }
        .nav-item.active {
          color: var(--primary);
          font-weight: 700;
        }
        .nav-item.active .nav-icon-wrapper {
          background-color: var(--primary-light);
        }
        .nav-item.active .nav-icon {
          stroke: var(--primary);
        }
      `}</style>

      <nav className="bottom-nav">
        <Link to="/" className={`nav-item ${isActive('/')}`}>
          <div className="nav-icon-wrapper">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
          <span className="nav-label">{t('nav_home')}</span>
        </Link>
        <Link to="/timetables" className={`nav-item ${isActive('/timetables')}`}>
          <div className="nav-icon-wrapper">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="3" width="16" height="16" rx="2" ry="2"></rect>
              <path d="M4 11h16"></path><path d="M12 3v8"></path>
              <path d="M8 19l-2 3"></path><path d="M16 19l2 3"></path>
              <path d="M8 15h.01"></path><path d="M16 15h.01"></path>
            </svg>
          </div>
          <span className="nav-label">{t('nav_timetables')}</span>
        </Link>
        <Link to="/chat" className={`nav-item ${isActive('/chat')}`}>
          <div className="nav-icon-wrapper">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              <path d="M12 8l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z"></path>
            </svg>
          </div>
          <span className="nav-label">{t('nav_chat')}</span>
        </Link>
        <Link to="/profile" className={`nav-item ${isActive('/profile')}`}>
          <div className="nav-icon-wrapper">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <span className="nav-label">{t('nav_profile')}</span>
        </Link>
      </nav>
    </>
  );
}