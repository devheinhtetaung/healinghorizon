import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import './Toast.css';

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const ariaLiveMap = {
  error: 'assertive',
  default: 'polite',
};

export default function Toast({ id, type = 'info', title, message, duration = 4000, onDismiss }) {
  const Icon = iconMap[type] || Info;
  const [progress, setProgress] = useState(100);
  const timerRef = useRef(null);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (duration <= 0) return;
    startRef.current = Date.now();
    setProgress(100);

    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        timerRef.current = requestAnimationFrame(tick);
      }
    };
    timerRef.current = requestAnimationFrame(tick);

    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [duration, id]);

  return (
    <div
      className={`toast toast--${type}`}
      role="alert"
      aria-live={ariaLiveMap[type] || ariaLiveMap.default}
    >
      <div className="toast__body">
        <Icon className="toast__icon" aria-hidden="true" />
        <div className="toast__content">
          {title && <p className="toast__title">{title}</p>}
          {message && <p className="toast__message">{message}</p>}
        </div>
      </div>
      <button
        className="toast__dismiss"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
      >
        <X aria-hidden="true" />
      </button>
      {duration > 0 && (
        <div className="toast__progress-track" aria-hidden="true">
          <div
            className="toast__progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
