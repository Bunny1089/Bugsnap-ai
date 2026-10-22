import React, { useEffect } from 'react';
import './Alert.css';

/**
 * Developer-Workbench Alert component (Watermelon UI inspired):
 * - Variants: error, warning, success, info
 * - Roles & A11y: role="alert" / "status", aria-live, dismissible
 * - Layout:
 *    - error / warning: inline banner positioned under the header
 *    - success / info: top-right fixed toast (.alert-toast)
 * - Auto-close progress bar when autoCloseMs is set
 */
export default function Alert({
  variant = 'info',
  title,
  message,
  action,
  onClose,
  autoCloseMs,
  className = '',
}) {
  useEffect(() => {
    if (!autoCloseMs || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, autoCloseMs);
    return () => clearTimeout(timer);
  }, [autoCloseMs, onClose]);

  const tagLabels = {
    error: 'ERR',
    warning: 'WARN',
    success: 'SUCCESS',
    info: 'INFO',
  };

  const icons = {
    error: (
      <svg className="alert-icon-svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="8" cy="8" r="6.5" />
        <line x1="8" y1="5" x2="8" y2="8.5" />
        <circle cx="8" cy="11" r="0.75" fill="currentColor" />
      </svg>
    ),
    warning: (
      <svg className="alert-icon-svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M8 2.5L14 13H2L8 2.5Z" strokeLinejoin="round" />
        <line x1="8" y1="6.5" x2="8" y2="9.5" />
        <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
      </svg>
    ),
    success: (
      <svg className="alert-icon-svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="8" cy="8" r="6.5" />
        <path d="M5.5 8.2L7.2 10L10.5 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    info: (
      <svg className="alert-icon-svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="8" cy="8" r="6.5" />
        <line x1="8" y1="7.5" x2="8" y2="11.5" />
        <circle cx="8" cy="5" r="0.75" fill="currentColor" />
      </svg>
    ),
  };

  const isAssertive = variant === 'error';
  const isToast = variant === 'success' || variant === 'info';

  return (
    <div
      role={isAssertive ? 'alert' : 'status'}
      aria-live={isAssertive ? 'assertive' : 'polite'}
      className={`workbench-alert alert-${variant} ${isToast ? 'alert-toast' : ''} ${className}`}
    >
      <div className="alert-accent-bar" />
      <div className="alert-icon-wrapper">
        {icons[variant] || icons.info}
      </div>

      <div className="alert-body">
        <div className="alert-title-row">
          <span className="alert-tag">{tagLabels[variant] || 'LOG'}</span>
          {title && <h4 className="alert-title">{title}</h4>}
        </div>
        <div className="alert-message">{message}</div>
        {action && <div className="alert-action">{action}</div>}
      </div>

      {onClose && (
        <button
          type="button"
          className="alert-close-btn"
          onClick={onClose}
          aria-label="Dismiss notification"
          title="Dismiss"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="close-svg">
            <line x1="12" y1="4" x2="4" y2="12" />
            <line x1="4" y1="4" x2="12" y2="12" />
          </svg>
        </button>
      )}

      {autoCloseMs && (
        <div className="alert-progress-track" aria-hidden="true">
          <div
            className="alert-progress-bar"
            style={{ animationDuration: `${autoCloseMs}ms` }}
          />
        </div>
      )}
    </div>
  );
}
