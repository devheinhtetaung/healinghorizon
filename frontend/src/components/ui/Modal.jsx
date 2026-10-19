import { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

export default function Modal({ isOpen, onClose, title, children, className = '' }) {
  const overlayRef = useRef(null);
  const closeRef = useRef(null);
  const previousActiveRef = useRef(null);
  const scrollbarWidthRef = useRef(0);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onCloseRef.current();
      return;
    }
    if (e.key === 'Tab' && overlayRef.current) {
      const focusable = overlayRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveRef.current = document.activeElement;

    scrollbarWidthRef.current =
      window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidthRef.current > 0) {
      document.body.style.paddingRight = `${scrollbarWidthRef.current}px`;
    }

    requestAnimationFrame(() => {
      if (!overlayRef.current) return;
      const focusable = overlayRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = Array.from(focusable).find(
        (el) => el !== closeRef.current
      );
      (firstFocusable || closeRef.current)?.focus();
    });

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';

      if (previousActiveRef.current?.focus) {
        previousActiveRef.current.focus();
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Dialog'}
    >
      <div className={`modal-panel ${className}`}>
        <div className="modal-header">
          {title && <h3 className="modal-title">{title}</h3>}
          <button
            ref={closeRef}
            className="modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
