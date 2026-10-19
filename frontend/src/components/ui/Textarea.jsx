import { AlertCircle } from 'lucide-react';
import './Textarea.css';

export default function Textarea({
  label,
  helperText,
  error,
  id,
  className = '',
  ...props
}) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = error ? `${textareaId}-error` : undefined;
  const helperId = helperText && !error ? `${textareaId}-helper` : undefined;
  const describedBy = errorId || helperId || undefined;

  const classes = [
    'textarea-wrapper',
    error && 'textarea-wrapper--error',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {label && (
        <label className="textarea-label" htmlFor={textareaId}>
          {label}
        </label>
      )}
      <div className="textarea-field-row">
        <textarea
          id={textareaId}
          className="textarea"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy}
          {...props}
        />
        {error && <AlertCircle className="textarea-icon-error" aria-hidden="true" />}
      </div>
      {error && (
        <p className="textarea-message textarea-message--error" id={errorId} role="alert">
          <AlertCircle className="textarea-message-icon" aria-hidden="true" />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="textarea-message textarea-message--helper" id={helperId}>
          {helperText}
        </p>
      )}
    </div>
  );
}
