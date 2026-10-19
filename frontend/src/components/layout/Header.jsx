import { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, ChevronDown, LayoutDashboard, LogOut } from 'lucide-react';
import Logo from '../brand/Logo';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import Spinner from '../ui/Spinner';
import useAuth from '../../hooks/useAuth';
import './Header.css';

const NAV_LINKS = [
  { to: '/how-it-works', label: 'How it Works' },
  { to: '/consultants', label: 'Consultants' },
  { to: '/community', label: 'Community' },
  { to: '/donate', label: 'Donate' },
];

function dashboardPathForRole(role) {
  if (role === 'consultant') return '/consultant/dashboard';
  if (role === 'admin') return '/admin/dashboard';
  return '/patient/dashboard';
}

function roleLabel(role) {
  if (role === 'consultant') return 'Consultant';
  if (role === 'admin') return 'Administrator';
  return 'Patient';
}

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const toggleRef = useRef(null);
  const userBtnRef = useRef(null);
  const userMenuRef = useRef(null);

  const { user, isAuthenticated, role, loading, logout } = useAuth();

  useEffect(() => {
    if (!mobileOpen) return;

    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarW > 0) {
      document.body.style.paddingRight = `${scrollbarW}px`;
    }

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (e.key === 'Tab' && menuRef.current) {
        const focusable = menuRef.current.querySelectorAll(
          'a, button, [tabindex]:not([tabindex="-1"])'
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
    };

    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      document.removeEventListener('keydown', handleKey);
    };
  }, [mobileOpen]);

  // User dropdown: close on outside click and Escape (return focus to trigger)
  useEffect(() => {
    if (!userMenuOpen) return;

    const onPointerDown = (e) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target) &&
        userBtnRef.current &&
        !userBtnRef.current.contains(e.target)
      ) {
        setUserMenuOpen(false);
      }
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
        userBtnRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [userMenuOpen]);

  const closeMobile = () => {
    setMobileOpen(false);
    toggleRef.current?.focus();
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    if (mobileOpen) setMobileOpen(false);
    await logout();
  };

  const dashboardPath = dashboardPathForRole(role);

  const renderAuthActions = () => {
    if (loading) {
      return (
        <div className="header__auth-loading" data-testid="auth-loading">
          <Spinner size="sm" label="Checking sign-in status" />
        </div>
      );
    }

    if (isAuthenticated && user) {
      return (
        <div className="header__user-container">
          <button
            ref={userBtnRef}
            type="button"
            className={`header__user-btn${userMenuOpen ? ' header__user-btn--active' : ''}`}
            onClick={() => setUserMenuOpen((prev) => !prev)}
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
            aria-label={`Account menu for ${user.name || 'your account'}`}
          >
            <Avatar name={user.name || 'User'} size="sm" className="header__user-avatar" />
            <span className="header__user-meta">
              <span className="header__user-name">{user.name}</span>
              <span className="header__user-role">{roleLabel(user.role || role)}</span>
            </span>
            <ChevronDown
              className={`header__user-chevron${userMenuOpen ? ' header__user-chevron--open' : ''}`}
              aria-hidden="true"
            />
          </button>

          {userMenuOpen && (
            <div
              ref={userMenuRef}
              className="header__user-menu"
              role="menu"
              aria-label="Account options"
            >
              <div className="header__user-menu-header">
                <Avatar name={user.name || 'User'} size="md" />
                <div className="header__user-menu-info">
                  <p className="header__user-menu-name">{user.name}</p>
                  <p className="header__user-menu-email">{user.email || roleLabel(user.role || role)}</p>
                </div>
              </div>

              <div className="header__user-menu-divider" role="separator" />

              <div className="header__user-menu-items">
                <Link
                  to={dashboardPath}
                  className="header__user-menu-item"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <LayoutDashboard className="header__user-menu-icon" aria-hidden="true" />
                  <span>Go to Dashboard</span>
                </Link>

                <button
                  type="button"
                  className="header__user-menu-item header__user-menu-item--danger"
                  role="menuitem"
                  onClick={handleLogout}
                >
                  <LogOut className="header__user-menu-icon" aria-hidden="true" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <>
        <Link to="/login">
          <Button variant="ghost" size="sm">Log In</Button>
        </Link>
        <Link to="/register">
          <Button variant="primary" size="sm">Get Started</Button>
        </Link>
      </>
    );
  };

  const renderMobileAuthActions = () => {
    if (loading) {
      return (
        <div className="header__auth-loading" data-testid="auth-loading-mobile">
          <Spinner size="sm" label="Checking sign-in status" />
        </div>
      );
    }

    if (isAuthenticated && user) {
      return (
        <>
          <Link to={dashboardPath} onClick={closeMobile}>
            <Button variant="primary" size="lg">Go to Dashboard</Button>
          </Link>
          <Button variant="secondary" size="lg" onClick={handleLogout}>Log Out</Button>
        </>
      );
    }

    return (
      <>
        <Link to="/login" onClick={closeMobile}>
          <Button variant="secondary" size="lg">Log In</Button>
        </Link>
        <Link to="/register" onClick={closeMobile}>
          <Button variant="primary" size="lg">Get Started</Button>
        </Link>
      </>
    );
  };

  return (
    <>
      <header className="header">
        <div className="header__inner">
        <Link to="/" className="header__logo-link" aria-label="Healing Horizon home">
          <Logo variant="dark" size="md" />
        </Link>

        <nav className="header__nav" aria-label="Main navigation">
          {NAV_LINKS.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `header__nav-link${isActive ? ' header__nav-link--active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="header__actions">
          {renderAuthActions()}
        </div>

        <button
          ref={toggleRef}
          className="header__hamburger"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X /> : <Menu />}
        </button>
      </div>
      </header>

      <div
        ref={menuRef}
        className={`header__mobile-menu${mobileOpen ? ' header__mobile-menu--open' : ''}`}
        aria-hidden={!mobileOpen}
        inert={mobileOpen ? undefined : ''}
      >
        <div className="header__mobile-menu-inner">
          <nav className="header__mobile-nav" aria-label="Mobile navigation">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `header__mobile-link${isActive ? ' header__mobile-link--active' : ''}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="header__mobile-actions">
            {renderMobileAuthActions()}
          </div>
        </div>
      </div>
    </>
  );
}
