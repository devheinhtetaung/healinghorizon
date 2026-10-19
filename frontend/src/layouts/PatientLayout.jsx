import {
  LayoutDashboard,
  CalendarPlus,
  Video,
  Users,
} from 'lucide-react';
import PageTransition from '../components/PageTransition';
import TopNav from '../components/layout/TopNav';
import Footer from '../components/layout/Footer';
import ToastProvider from '../components/ui/ToastContext';
import ChatbotWidget from '../components/chat/ChatbotWidget';
import './dashboard.css';

const PATIENT_NAV_ITEMS = [
  { to: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/patient/appointments/book', label: 'Book Appointment', icon: CalendarPlus, activePaths: ['/patient/appointments'] },
  { to: '/patient/video-sessions', label: 'Video Sessions', icon: Video, activePaths: ['/patient/video-session'] },
  { to: '/patient/forum', label: 'Community Forum', icon: Users },
];

export default function PatientLayout() {
  return (
    <ToastProvider>
      <div className="dashboard-layout">
        <TopNav navItems={PATIENT_NAV_ITEMS} basePath="/patient" />
        <div className="dashboard-layout__body">
          <main className="dashboard-layout__content">
            <PageTransition />
          </main>
        </div>
        <Footer variant="compact" />
        <ChatbotWidget />
      </div>
    </ToastProvider>
  );
}
