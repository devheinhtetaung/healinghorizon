import { AlertCircle, ChevronDown } from 'lucide-react';
import './Select.css';

export default function Select({
  label,
  helperText,
  error,
  options = [],
  id,
  className = '',
  ...props
}) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = error ? `${selectId}-error` : undefined;
  const helperId = helperText && !error ? `${selectId}-helper` : undefined;
  const describedBy = errorId || helperId || undefined;

  const classes = [
    'select-wrapper',
    error && 'select-wrapper--error',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {label && (
        <label className="select-label" htmlFor={selectId}>
          {label}
        </label>
      )}
      <div className="select-field-row">
        <select
          id={selectId}
          className="select"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="select-chevron" aria-hidden="true" />
        {error && <AlertCircle className="select-icon-error" aria-hidden="true" />}
      </div>
      {error && (
        <p className="select-message select-message--error" id={errorId} role="alert">
          <AlertCircle className="select-message-icon" aria-hidden="true" />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="select-message select-message--helper" id={helperId}>
          {helperText}
        </p>
      )}
    </div>
  );
}
