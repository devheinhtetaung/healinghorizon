import { Heart } from 'lucide-react';
import './Logo.css';

export default function Logo({
  variant = 'dark',
  size = 'md',
  showWordmark = true,
  iconOnly = false,
  src = null,
  alt = 'Healing Horizon',
  className = '',
}) {
  const displayWordmark = showWordmark && !iconOnly;

  return (
    <div className={`logo logo--${variant} logo--${size}${className ? ` ${className}` : ''}`}>
      <div className="logo__badge">
        {src ? (
          <img src={src} alt={alt} className="logo__image" />
        ) : (
          <Heart className="logo__icon" aria-hidden="true" />
        )}
      </div>
      {displayWordmark && (
        <span className="logo__wordmark">Healing Horizon</span>
      )}
    </div>
  );
}
