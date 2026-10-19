import './Spinner.css';

/*
 * Size conventions (enforced here — do not invent new spinner styles in pages):
 *   sm  1rem   – inline (buttons, badges, input adornments)
 *   md  1.5rem – section loads, card placeholders
 *   lg  2.5rem – full-page / overlay loads
 *
 * The spinner inherits `color` from its parent.  Wrap it in a container
 * that sets the desired colour if you need a specific tint.
 */
export default function Spinner({ size = 'md', className = '', label = 'Loading' }) {
  const classes = [
    'spinner',
    `spinner--${size}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} role="status" aria-label={label}>
      <svg className="spinner__ring" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle
          className="spinner__track"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="spinner__arc"
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
