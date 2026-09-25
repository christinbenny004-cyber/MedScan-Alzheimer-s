import { useState, useEffect } from 'react';
import { checkHealth } from '../api';

/**
 * Header — Top navigation bar with MedScan branding, navigation links,
 * backend status indicator, and quick CTA button.
 */
export default function Header({ onLaunchStudio, onNavigateWorks }) {
  const [status, setStatus] = useState('checking'); // 'connected' | 'disconnected' | 'checking'
  const [modelInfo, setModelInfo] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const check = async () => {
      try {
        const data = await checkHealth();
        if (isMounted) {
          setStatus('connected');
          setModelInfo(data);
        }
      } catch {
        if (isMounted) {
          setStatus('disconnected');
        }
      }
    };

    check();
    const interval = setInterval(check, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="header">
      <div className="header__logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <span className="header__icon">🧠</span>
        <div>
          <div className="header__title">MedScan</div>
          <div className="header__subtitle">Alzheimer's Diagnostic Studio</div>
        </div>
      </div>

      <nav className="header__nav-links">
        <a
          href="#overview"
          className="header__nav-link"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          Overview
        </a>
        <a
          href="#how-it-works"
          className="header__nav-link"
          onClick={(e) => {
            e.preventDefault();
            onNavigateWorks?.();
          }}
        >
          Clinical Pipeline
        </a>
        <a
          href="#upload-studio"
          className="header__nav-link"
          onClick={(e) => {
            e.preventDefault();
            onLaunchStudio?.();
          }}
        >
          Diagnostic Studio
        </a>
      </nav>

      <div className="header__actions">
        <div className="header__status">
          <span
            className={`header__status-dot ${
              status === 'connected'
                ? 'header__status-dot--connected'
                : 'header__status-dot--disconnected'
            }`}
          />
          <span>
            {status === 'connected'
              ? `Model Online · ${modelInfo?.num_classes || 2} Classes`
              : status === 'checking'
              ? 'Connecting...'
              : 'Backend Offline'}
          </span>
        </div>

        <button className="header__cta-btn" onClick={onLaunchStudio}>
          Try Scan ↓
        </button>
      </div>
    </header>
  );
}
