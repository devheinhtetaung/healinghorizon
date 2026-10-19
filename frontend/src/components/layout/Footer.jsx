import { Link } from 'react-router-dom';
import Logo from '../brand/Logo';
import './Footer.css';

const PLATFORM_LINKS = [
  { to: '/consultants', label: 'Find a Consultant' },
  { to: '/ai-support', label: 'AI Support' },
  { to: '/community', label: 'Community' },
  { to: '/donate', label: 'Donate' },
];

const SUPPORT_LINKS = [
  { to: '/help', label: 'Help Center' },
  { to: '/contact', label: 'Contact Us' },
  { to: '/faq', label: 'FAQ' },
];

const COMPANY_LINKS = [
  { to: '/about', label: 'About Us' },
  { to: '/careers', label: 'Careers' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
];

const COMPACT_LINKS = [
  { to: '/help', label: 'Help Center' },
  { to: '/contact', label: 'Contact Us' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Service' },
];

function LinkColumn({ title, links }) {
  return (
    <div className="footer__column">
      <p className="footer__column-title">{title}</p>
      <ul className="footer__links">
        {links.map(({ to, label }) => (
          <li key={to}>
            <Link to={to} className="footer__link">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer({ variant = 'full' }) {
  if (variant === 'compact') {
    return (
      <footer className="footer footer--compact">
        <div className="footer__inner">
          <div className="footer__compact-row">
            <div className="footer__compact-brand">
              <Logo variant="light" size="sm" />
              <p className="footer__copyright">
                &copy; 2026 Healing Horizon. All rights reserved.
              </p>
            </div>
            <nav className="footer__compact-links" aria-label="Support and legal links">
              {COMPACT_LINKS.map(({ to, label }) => (
                <Link key={to} to={to} className="footer__legal-link">{label}</Link>
              ))}
            </nav>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__grid">
          <div className="footer__brand">
            <Logo variant="light" size="md" />
            <p className="footer__mission">
              Making mental health support accessible, compassionate, and empowering for everyone everywhere.
            </p>
          </div>

          <LinkColumn title="Platform" links={PLATFORM_LINKS} />
          <LinkColumn title="Support" links={SUPPORT_LINKS} />
          <LinkColumn title="Company" links={COMPANY_LINKS} />
        </div>

        <div className="footer__bottom">
          <p className="footer__copyright">
            &copy; 2026 Healing Horizon. All rights reserved.
          </p>
          <div className="footer__legal">
            <Link to="/privacy" className="footer__legal-link">Privacy Policy</Link>
            <Link to="/terms" className="footer__legal-link">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
