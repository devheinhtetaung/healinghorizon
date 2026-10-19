import { useEffect, useRef } from 'react';

export default function Reveal({
  as: Tag = 'div',
  children,
  className = '',
  delay = 0,
  ...props
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('reveal--visible');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('reveal--visible');
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      {...props}
      className={`reveal ${className}`.trim()}
      style={delay ? { ...props.style, transitionDelay: `${delay}ms` } : props.style}
    >
      {children}
    </Tag>
  );
}
