import {
  LayoutDashboard,
  Users,
  UserCheck,
  CalendarClock,
  MessageSquareText,
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import TopNav from '../components/layout/TopNav';
import Footer from '../components/layout/Footer';
import ToastProvider from '../components/ui/ToastContext';
import './dashboard.css';

const CONSULTANT_NAV_ITEMS = [
  { to: '/consultant/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/consultant/patients', label: 'Patients & Progress', icon: Users },
  { to: '/consultant/referrals', label: 'Referrals', icon: UserCheck },
  { to: '/consultant/availability', label: 'My Availability', icon: CalendarClock, end: true },
  { to: '/consultant/forum', label: 'Community Forum', icon: MessageSquareText },
];

export default function ConsultantLayout() {
  return (
    <ToastProvider>
      <div className="dashboard-layout">
        <TopNav navItems={CONSULTANT_NAV_ITEMS} basePath="/consultant" />
        <div className="dashboard-layout__body">
          <main className="dashboard-layout__content">
            <PageTransition />
          </main>
        </div>
        <Footer variant="compact" />
      </div>
    </ToastProvider>
  );
}
