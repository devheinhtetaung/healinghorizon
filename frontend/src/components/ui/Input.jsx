import { AlertCircle } from 'lucide-react';
import './Input.css';

export default function Input({
  label,
  helperText,
  error,
  leftIcon: LeftIcon,
  type = 'text',
  id,
  className = '',
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText && !error ? `${inputId}-helper` : undefined;
  const describedBy = errorId || helperId || undefined;

  const classes = [
    'input-wrapper',
    error && 'input-wrapper--error',
    LeftIcon && 'input-wrapper--with-icon',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {label && (
        <label className="input-label" htmlFor={inputId}>
          {label}
        </label>
      )}
      <div className="input-field-row">
        {LeftIcon && <LeftIcon className="input-icon-left" aria-hidden="true" />}
        <input
          id={inputId}
          type={type}
          className="input"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          {...props}
        />
        {error && <AlertCircle className="input-icon-error" aria-hidden="true" />}
      </div>
      {error && (
        <p className="input-message input-message--error" id={errorId} role="alert">
          <AlertCircle className="input-message-icon" aria-hidden="true" />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="input-message input-message--helper" id={helperId}>
          {helperText}
        </p>
      )}
    </div>
  );
}
