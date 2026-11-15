import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import { tripService } from '../api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('wayfinder_user');
    if (savedUser) {
      navigate('/profile', { replace: true });
    }
  }, [navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setErrorMsg(t('login_err_empty'));
      return;
    }

    try {
      const response = await tripService.login({ email: email.trim(), password });
      if (response.success) {
        const userWithFullName = {
          ...response.user,
          name: fullName.trim()
        };
        localStorage.setItem('wayfinder_user', JSON.stringify(userWithFullName));
        navigate('/profile');
      }
    } catch {
      setErrorMsg(t('login_err_invalid'));
    }
  };

  const handleGoogleRegister = () => {
    setErrorMsg('');

    if (!window.google?.accounts?.oauth2) {
      setErrorMsg("Skrypt Google OAuth jeszcze się ładuje. Odśwież stronę.");
      return;
    }

    if (!GOOGLE_CLIENT_ID) {
      setErrorMsg("Brak klucza VITE_GOOGLE_CLIENT_ID w pliku frontend/.env!");
      return;
    }

    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
      prompt: 'select_account',
      callback: async (tokenResponse) => {
        if (tokenResponse?.access_token) {
          try {
            const res = await tripService.googleLogin(tokenResponse.access_token);
            if (res.success) {
              localStorage.setItem('wayfinder_user', JSON.stringify(res.user));
              navigate('/profile');
            }
          } catch {
            setErrorMsg(t('login_err_invalid'));
          }
        }
      },
    });

    tokenClient.requestAccessToken();
  };

  return (
    <div className="register-page">
      <style>{`
        .register-page {
          display: flex;
          flex-direction: column;
          height: 100%;
          background-color: var(--bg-color);
          overflow-y: auto;
          scrollbar-width: none;
          position: relative;
        }
        .register-page::-webkit-scrollbar { display: none; }

        .register-content {
          padding: 20px 24px 40px 24px;
          display: flex;
          flex-direction: column;
        }

        .register-tagline {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--primary);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .register-title {
          font-size: 2rem;
          font-weight: 800;
          color: var(--text-main);
          margin: 0 0 8px 0;
          line-height: 1.15;
        }

        .register-subtitle {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-bottom: 22px;
          line-height: 1.4;
        }

        .error-banner {
          background-color: rgba(239, 68, 68, 0.12);
          color: #ef4444;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .input-group {
          margin-bottom: 16px;
        }

        .input-label {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-main);
          margin-bottom: 8px;
        }

        .input-field-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 0 16px;
          height: 52px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.02);
          transition: border-color 0.2s;
        }
        .input-field-wrapper:focus-within {
          border-color: var(--primary);
        }

        .input-field-wrapper > svg {
          color: var(--text-muted);
          margin-right: 12px;
          flex-shrink: 0;
        }

        .input-field-wrapper input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 0.95rem;
          color: var(--text-main);
          outline: none;
        }

        .input-field-wrapper input::placeholder {
          color: var(--text-muted);
        }

        .eye-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border-radius: 50%;
          transition: color 0.2s, background-color 0.2s, transform 0.15s;
        }
        .eye-btn:hover {
          color: var(--primary);
          background-color: rgba(8, 125, 86, 0.08);
        }
        .eye-btn:active {
          transform: scale(0.85);
        }
        .eye-icon-anim {
          animation: eyePop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes eyePop {
          0% { transform: scale(0.6) rotate(-12deg); opacity: 0.3; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        .submit-btn {
          width: 100%;
          height: 52px;
          background-color: var(--primary);
          color: #ffffff;
          border: none;
          border-radius: 16px;
          font-size: 1rem;
          font-weight: 700;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(5, 150, 105, 0.25);
          transition: transform 0.2s;
          margin-top: 8px;
          margin-bottom: 22px;
        }
        [data-theme='dark'] .submit-btn { color: #112019; }
        .submit-btn:active { transform: scale(0.98); }

        .divider-container {
          display: flex;
          align-items: center;
          text-align: center;
          margin-bottom: 22px;
          color: var(--text-muted);
          font-size: 0.8rem;
        }
        .divider-container::before, .divider-container::after {
          content: '';
          flex: 1;
          border-bottom: 1px solid var(--border);
        }
        .divider-container span {
          padding: 0 12px;
        }

        .google-btn {
          width: 100%;
          height: 52px;
          background-color: var(--card-bg);
          color: var(--text-main);
          border: 1px solid var(--border);
          border-radius: 16px;
          font-size: 0.95rem;
          font-weight: 600;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          margin-bottom: 24px;
          transition: transform 0.15s;
        }
        .google-btn:active { transform: scale(0.98); }

        .login-prompt {
          text-align: center;
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 18px;
        }
        .login-prompt a {
          color: var(--primary);
          font-weight: 700;
          text-decoration: none;
        }

        .terms-text {
          text-align: center;
          font-size: 0.75rem;
          color: var(--text-muted);
          line-height: 1.5;
        }
        .terms-text span {
          color: var(--primary);
          font-weight: 600;
        }
      `}</style>

      <Header />

      <div className="register-content">
        <div className="register-tagline">{t('register_tagline')}</div>
        <h1 className="register-title">{t('register_title')}</h1>
        <p className="register-subtitle">{t('register_subtitle')}</p>

        {errorMsg && <div className="error-banner">{errorMsg}</div>}

        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label className="input-label">{t('register_name_label')}</label>
            <div className="input-field-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <input 
                type="text" 
                name="name"
                autoComplete="name"
                placeholder={t('register_name_ph')}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">{t('login_email_label')}</label>
            <div className="input-field-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
              <input 
                type="email" 
                name="email"
                autoComplete="email"
                placeholder={t('login_email_ph')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">{t('login_password_label')}</label>
            <div className="input-field-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              <input 
                type={showPassword ? "text" : "password"} 
                name="password"
                autoComplete="new-password"
                placeholder={t('login_password_ph')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="eye-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg key="eye-off" className="eye-icon-anim" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
                    <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg key="eye-on" className="eye-icon-anim" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="submit-btn">
            {t('register_submit')}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </form>

        <div className="divider-container">
          <span>{t('login_or_google')}</span>
        </div>

        <button 
          type="button"
          className="google-btn"
          onClick={handleGoogleRegister}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.13 0-5.78-2.11-6.73-4.96H1.18v3.14C3.15 21.32 7.23 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.62H1.18C.43 8.14 0 9.87 0 12s.43 3.86 1.18 5.38l4.09-3.14z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.23 0 3.15 2.68 1.18 6.62l4.09 3.14c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
          Google
        </button>

        <div className="login-prompt">
          {t('register_already')} <Link to="/login">{t('register_signin')}</Link>
        </div>

        <p className="terms-text">
          {t('login_terms_1')}<br />
          <span>{t('login_terms_2')}</span>
        </p>
      </div>
    </div>
  );
}