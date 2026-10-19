import { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, useNavigate, useLocation, matchPath } from 'react-router-dom';
import {
  Menu,
  X,
  Settings,
  LogOut,
  ChevronDown,
  Bell,
  BellOff,
} from 'lucide-react';
import Logo from '../brand/Logo';
import Avatar from '../ui/Avatar';
import useAuth from '../../hooks/useAuth';
import { notificationService } from '../../services/notificationService';
import './TopNav.css';

function isUnread(notification) {
  return !Number(notification.isRead ?? 0);
}

function formatNotifTime(createdAt) {
  if (!createdAt) return 'Recently';
  return new Date(createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TopNav({
  navItems = [],
  sections = [],
  basePath = '',
  user: userProp = null,
  logoSrc = null,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuthSafe();

  // Mobile navigation dropdown sheet open state
  const [mobileOpen, setMobileOpen] = useState(false);

  // User profile dropdown menu open state
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Notifications bell popover state
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifError, setNotifError] = useState(null);

  const topNavRef = useRef(null);
  const hamburgerRef = useRef(null);
  const userBtnRef = useRef(null);
  const userMenuRef = useRef(null);
  const mobileSheetRef = useRef(null);
  const notifBtnRef = useRef(null);
  const notifMenuRef = useRef(null);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    hamburgerRef.current?.focus();
  }, []);

  const closeUserMenu = useCallback(() => {
    setUserMenuOpen(false);
    userBtnRef.current?.focus();
  }, []);

  const closeNotifMenu = useCallback(() => {
    setNotifOpen(false);
    notifBtnRef.current?.focus();
  }, []);

  // Fetch notifications once on mount for the bell popover
  // (same call that previously fed the dashboard notifications card)
  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const notifs = await notificationService.list();
      setNotifications(Array.isArray(notifs) ? notifs : []);
      setNotifError(null);
    } catch {
      setNotifError('Couldn’t load notifications.');
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter(isUnread).length;

  // Global keyboard shortcuts (Escape and focus traps)
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        if (notifOpen) {
          closeNotifMenu();
          return;
        }
        if (userMenuOpen) {
          closeUserMenu();
          return;
        }
        if (mobileOpen) {
          closeMobile();
          return;
        }
      }

      // Focus trap for mobile navigation sheet
      if (mobileOpen && e.key === 'Tab' && mobileSheetRef.current) {
        const focusables = [
          hamburgerRef.current,
          ...mobileSheetRef.current.querySelectorAll(
            'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          ),
        ].filter(Boolean);

        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }

      // Keyboard navigation for user dropdown menu (Arrow keys)
      if (userMenuOpen && userMenuRef.current) {
        const menuItems = Array.from(
          userMenuRef.current.querySelectorAll(
            'a[href], button:not([disabled])'
          )
        );
        const currentIndex = menuItems.indexOf(document.activeElement);

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
          menuItems[nextIndex]?.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
          menuItems[prevIndex]?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mobileOpen, userMenuOpen, notifOpen, closeMobile, closeUserMenu, closeNotifMenu]);

  // Lock scroll on mobile when sheet is open
  useEffect(() => {
    if (!mobileOpen) return;
    const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    if (scrollbarW > 0) document.body.style.paddingRight = `${scrollbarW}px`;

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [mobileOpen]);

  // Close user dropdown when clicking outside
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleOutsideClick = (e) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target) &&
        userBtnRef.current &&
        !userBtnRef.current.contains(e.target)
      ) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [userMenuOpen]);

  // Close notifications popover when clicking outside
  useEffect(() => {
    if (!notifOpen) return;
    const handleOutsideClick = (e) => {
      if (
        notifMenuRef.current &&
        !notifMenuRef.current.contains(e.target) &&
        notifBtnRef.current &&
        !notifBtnRef.current.contains(e.target)
      ) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [notifOpen]);

  // Resolve user info from auth context, prop, or role fallback
  const activeUser = userProp || auth?.user || getRoleFallbackUser(basePath);

  // Normalize nav items: accept flat navItems or flatten grouped sections
  const rawItems = navItems.length > 0
    ? navItems
    : sections.flatMap((sec) => sec.items || []);

  // Filter out Profile & Settings from primary bar so it only exists in the user dropdown
  const primaryNavItems = rawItems.filter((item) => {
    const label = (item.label || '').toLowerCase();
    const to = (item.to || '').toLowerCase();
    return !label.includes('profile') && !label.includes('settings') && !to.endsWith('/profile');
  });

  const handleLogout = async () => {
    setUserMenuOpen(false);
    setNotifOpen(false);
    if (mobileOpen) setMobileOpen(false);
    if (auth?.logout) {
      await auth.logout();
    }
    navigate('/login');
  };

  return (
    <header className="topnav" ref={topNavRef}>
      <div className="topnav__inner">
        {/* Left Section: Mobile Toggle & Brand Logo */}
        <div className="topnav__left">
          <button
            ref={hamburgerRef}
            type="button"
            className="topnav__hamburger"
            onClick={() => {
              setUserMenuOpen(false);
              setNotifOpen(false);
              setMobileOpen((prev) => !prev);
            }}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            aria-controls="topnav-mobile-menu"
          >
            {mobileOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>

          <NavLink
            to={basePath || '/'}
            className="topnav__brand"
            onClick={() => {
              if (mobileOpen) setMobileOpen(false);
              if (userMenuOpen) setUserMenuOpen(false);
              if (notifOpen) setNotifOpen(false);
            }}
            title="Healing Horizon"
          >
            <Logo variant="dark" size="sm" src={logoSrc} />
          </NavLink>
        </div>

        {/* Center / Desktop Primary Navigation */}
        <nav className="topnav__nav" aria-label="Portal primary navigation">
          {primaryNavItems.map((item) => {
            const { to, label, icon: Icon, end = false } = item;
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `topnav__nav-link${isActive || isExtraActive(item, location.pathname) ? ' topnav__nav-link--active' : ''}`
                }
              >
                {Icon && <Icon className="topnav__nav-icon" aria-hidden="true" />}
                <span className="topnav__nav-label">{label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Right Section: Notifications & User Avatar Dropdown */}
        <div className="topnav__right">
          {/* Notifications Bell & Popover */}
          <div className="topnav__notif-container">
            <button
              ref={notifBtnRef}
              type="button"
              className={`topnav__bell-btn${notifOpen ? ' topnav__bell-btn--active' : ''}`}
              onClick={() => {
                if (mobileOpen) setMobileOpen(false);
                setUserMenuOpen(false);
                setNotifOpen((prev) => !prev);
              }}
              aria-expanded={notifOpen}
              aria-haspopup="true"
              aria-controls="topnav-notif-menu"
              aria-label={
                unreadCount > 0
                  ? `Notifications, ${unreadCount} unread`
                  : 'Notifications'
              }
            >
              <Bell className="topnav__bell-icon" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="topnav__bell-count" aria-hidden="true">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div
                id="topnav-notif-menu"
                ref={notifMenuRef}
                className="topnav__notif-menu"
                aria-label="Notifications"
              >
                <div className="topnav__notif-header">
                  <p className="topnav__notif-title">Notifications</p>
                  {unreadCount > 0 && (
                    <span className="topnav__notif-unread">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {notifLoading ? (
                  <p className="topnav__notif-hint">Loading notifications…</p>
                ) : notifError ? (
                  <div className="topnav__notif-hint-row">
                    <p className="topnav__notif-hint">{notifError}</p>
                    <button
                      type="button"
                      className="topnav__notif-retry"
                      onClick={fetchNotifications}
                    >
                      Retry
                    </button>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="topnav__notif-empty">
                    <BellOff className="topnav__notif-empty-icon" aria-hidden="true" />
                    <p className="topnav__notif-empty-title">You have no notifications yet</p>
                    <p className="topnav__notif-empty-desc">
                      We&rsquo;ll notify you here about appointment updates, consultant messages, and community replies.
                    </p>
                  </div>
                ) : (
                  <ul className="topnav__notif-list">
                    {notifications.map((n) => (
                      <li key={n.notificationId} className="topnav__notif-item">
                        <span
                          className={`topnav__notif-dot${isUnread(n) ? ' topnav__notif-dot--unread' : ''}`}
                          aria-hidden="true"
                        />
                        <div className="topnav__notif-item-body">
                          <p className="topnav__notif-text">{n.message}</p>
                          <span className="topnav__notif-time">
                            {formatNotifTime(n.createdAt)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="topnav__user-container">
            <button
              ref={userBtnRef}
              type="button"
              className={`topnav__user-btn${userMenuOpen ? ' topnav__user-btn--active' : ''}`}
              onClick={() => {
                if (mobileOpen) setMobileOpen(false);
                setNotifOpen(false);
                setUserMenuOpen((prev) => !prev);
              }}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              aria-controls="topnav-user-menu"
              aria-label={`User menu for ${activeUser.name || 'Account'}`}
            >
              <Avatar name={activeUser.name || 'User'} size="sm" src={activeUser.avatarUrl} className="topnav__user-avatar" />
              <div className="topnav__user-meta">
                <span className="topnav__user-name">{activeUser.name}</span>
                <span className="topnav__user-role">{formatRole(activeUser.role || basePath)}</span>
              </div>
              <ChevronDown
                className={`topnav__user-chevron${userMenuOpen ? ' topnav__user-chevron--open' : ''}`}
                aria-hidden="true"
              />
            </button>

            {/* User Dropdown Menu */}
            {userMenuOpen && (
              <div
                id="topnav-user-menu"
                ref={userMenuRef}
                className="topnav__user-menu"
                role="menu"
                aria-label="User account options"
              >
                <div className="topnav__user-menu-header">
                  <Avatar name={activeUser.name || 'User'} size="md" src={activeUser.avatarUrl} />
                  <div className="topnav__user-menu-info">
                    <p className="topnav__user-menu-name">{activeUser.name}</p>
                    <p className="topnav__user-menu-email">{activeUser.email || formatRole(activeUser.role || basePath)}</p>
                  </div>
                </div>

                <div className="topnav__user-menu-divider" role="separator" />

                <div className="topnav__user-menu-items">
                  <NavLink
                    to={`${basePath}/profile`}
                    className={({ isActive }) =>
                      `topnav__user-menu-item${isActive ? ' topnav__user-menu-item--active' : ''}`
                    }
                    onClick={() => setUserMenuOpen(false)}
                    role="menuitem"
                  >
                    <Settings className="topnav__user-menu-icon" aria-hidden="true" />
                    <span>Profile & Settings</span>
                  </NavLink>

                  <button
                    type="button"
                    className="topnav__user-menu-item topnav__user-menu-item--danger"
                    onClick={handleLogout}
                    role="menuitem"
                  >
                    <LogOut className="topnav__user-menu-icon" aria-hidden="true" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="topnav__mobile-overlay"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      {/* Mobile Navigation Dropdown Sheet */}
      <div
        id="topnav-mobile-menu"
        ref={mobileSheetRef}
        className={`topnav__mobile-sheet${mobileOpen ? ' topnav__mobile-sheet--open' : ''}`}
        aria-hidden={!mobileOpen}
        inert={mobileOpen ? undefined : ''}
      >
        <div className="topnav__mobile-sheet-inner">
          <nav className="topnav__mobile-nav" aria-label="Mobile navigation">
            {primaryNavItems.map((item) => {
              const { to, label, icon: Icon, end = false } = item;
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `topnav__mobile-link${isActive || isExtraActive(item, location.pathname) ? ' topnav__mobile-link--active' : ''}`
                  }
                >
                  {Icon && <Icon className="topnav__mobile-link-icon" aria-hidden="true" />}
                  <span className="topnav__mobile-link-label">{label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}

function useAuthSafe() {
  try {
    return useAuth();
  } catch {
    return null;
  }
}

function getRoleFallbackUser(basePath = '') {
  if (basePath.includes('consultant')) {
    return { name: 'Dr. Michael Chen', email: 'dr.chen@healinghorizon.org', role: 'consultant' };
  }
  if (basePath.includes('admin')) {
    return { name: 'Admin User', email: 'admin@healinghorizon.org', role: 'admin' };
  }
  return { name: 'Sarah Johnson', email: 'sarah.j@example.com', role: 'patient' };
}

function formatRole(roleOrPath = '') {
  const str = String(roleOrPath).toLowerCase();
  if (str.includes('consultant')) return 'Consultant';
  if (str.includes('admin')) return 'Administrator';
  return 'Patient';
}

function isExtraActive(item, pathname) {
  const paths = item?.activePaths || [];
  return paths.some((p) => matchPath({ path: p, end: false }, pathname));
}
