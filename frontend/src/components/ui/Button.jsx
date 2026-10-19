import Spinner from './Spinner';
import './Button.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  type = 'button',
  disabled = false,
  loading = false,
  className = '',
  ...props
}) {
  const resolvedVariant = variant === 'outline' ? 'secondary' : variant;
  const isDisabled = disabled || loading;

  const classes = [
    'btn',
    `btn--${resolvedVariant}`,
    `btn--${size}`,
    loading && 'btn--loading',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={isDisabled}
      aria-busy={loading ? true : undefined}
      {...props}
    >
      {loading && <Spinner size="sm" className="btn__spinner" />}
      {!loading && LeftIcon && <LeftIcon className="btn__icon btn__icon--left" />}
      {children}
      {!loading && RightIcon && <RightIcon className="btn__icon btn__icon--right" />}
    </button>
  );
}
