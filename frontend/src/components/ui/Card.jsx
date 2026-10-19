import './Card.css';

/*
 * Empty-state note for consuming pages:
 * When rendering a list of Cards with no items, render an empty-state
 * placeholder using `--color-muted-foreground` text + `--color-muted` bg,
 * centered inside a Card body. Do not render zero-height Card wrappers.
 */
export default function Card({ children, hover = false, raised = false, className = '', ...props }) {
  const classes = [
    'card',
    hover && 'card--hover',
    raised && 'card--raised',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
