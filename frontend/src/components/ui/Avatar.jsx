import './Avatar.css';

export default function Avatar({ src, alt = '', name = '', size = 'md', className = '' }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const classes = [
    'avatar',
    `avatar--${size}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} aria-label={name || alt || 'Avatar'}>
      {src ? (
        <img className="avatar__image" src={src} alt={alt || name} />
      ) : (
        <span className="avatar__fallback">{initials || '?'}</span>
      )}
    </div>
  );
}
