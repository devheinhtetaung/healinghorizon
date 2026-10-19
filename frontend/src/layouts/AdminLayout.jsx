import {
  LayoutDashboard,
  Users,
  UserCheck,
  Building2,
  ClipboardList,
  MessageSquareText,
  Flag,
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import TopNav from '../components/layout/TopNav';
import Footer from '../components/layout/Footer';
import ToastProvider from '../components/ui/ToastContext';
import './dashboard.css';

const ADMIN_NAV_ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/consultants', label: 'Consultants', icon: UserCheck },
  { to: '/admin/directory', label: 'Directory', icon: Building2 },
  { to: '/admin/surveys', label: 'Surveys', icon: ClipboardList },
  { to: '/admin/feedback', label: 'Feedback', icon: MessageSquareText },
  { to: '/admin/reports', label: 'Reports', icon: Flag },
];

export default function AdminLayout() {
  return (
    <ToastProvider>
      <div className="dashboard-layout">
        <TopNav navItems={ADMIN_NAV_ITEMS} basePath="/admin" />
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
