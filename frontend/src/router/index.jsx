import { Navigate } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import PatientLayout from '../layouts/PatientLayout';
import ConsultantLayout from '../layouts/ConsultantLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from '../components/ProtectedRoute';

import HomePage from '../pages/public/HomePage';
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';
import DonatePage from '../pages/public/DonatePage';
import AboutPage from '../pages/public/AboutPage';
import CareersPage from '../pages/public/CareersPage';
import ContactPage from '../pages/public/ContactPage';
import PrivacyPage from '../pages/public/PrivacyPage';
import TermsPage from '../pages/public/TermsPage';
import HelpPage from '../pages/public/HelpPage';
import FAQPage from '../pages/public/FAQPage';
import HowItWorksPage from '../pages/public/HowItWorksPage';
import ConsultantsPage from '../pages/public/ConsultantsPage';
import CommunityPage from '../pages/public/CommunityPage';
import AISupportPage from '../pages/public/AISupportPage';
import NotFoundPage from '../pages/public/NotFoundPage';

import PatientDashboardPage from '../pages/patient/PatientDashboardPage';
import ChatbotPage from '../pages/patient/ChatbotPage';
import BookAppointmentPage from '../pages/patient/BookAppointmentPage';
import VideoSessionsPage from '../pages/patient/VideoSessionsPage';
import VideoSessionPage from '../pages/patient/VideoSessionPage';
import VideoSessionDetailPage from '../pages/patient/VideoSessionDetailPage';
import ForumPage from '../pages/patient/ForumPage';
import CreatePostPage from '../pages/patient/CreatePostPage';
import PostDetailPage from '../pages/patient/PostDetailPage';
import PatientProfilePage from '../pages/patient/PatientProfilePage';
import FeedbackPage from '../pages/patient/FeedbackPage';
import AppointmentDetailPage from '../pages/patient/AppointmentDetailPage';

import ConsultantDashboardPage from '../pages/consultant/ConsultantDashboardPage';
import ConsultantAvailabilityPage from '../pages/consultant/ConsultantAvailabilityPage';
import PatientsPage from '../pages/consultant/PatientsPage';
import PatientProgressPage from '../pages/consultant/PatientProgressPage';
import CreateProgressLogPage from '../pages/consultant/CreateProgressLogPage';
import ReferralsPage from '../pages/consultant/ReferralsPage';
import ConsultantProfilePage from '../pages/consultant/ConsultantProfilePage';

import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminProfilePage from '../pages/admin/AdminProfilePage';
import UsersPage from '../pages/admin/UsersPage';
import CreateUserPage from '../pages/admin/CreateUserPage';
import AdminConsultantsPage from '../pages/admin/AdminConsultantsPage';
import CreateConsultantPage from '../pages/admin/CreateConsultantPage';
import AdminFeedbackPage from '../pages/admin/AdminFeedbackPage';
import AdminReportsPage from '../pages/admin/AdminReportsPage';
import SurveysPage from '../pages/admin/SurveysPage';
import CreateSurveyPage from '../pages/admin/CreateSurveyPage';
import DirectoryPage from '../pages/admin/DirectoryPage';
import HospitalFormPage from '../pages/admin/HospitalFormPage';
import PsychiatristFormPage from '../pages/admin/PsychiatristFormPage';

export const routes = [
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'donate', element: <DonatePage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'careers', element: <CareersPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'privacy', element: <PrivacyPage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: 'help', element: <HelpPage /> },
      { path: 'faq', element: <FAQPage /> },
      { path: 'how-it-works', element: <HowItWorksPage /> },
      { path: 'consultants', element: <ConsultantsPage /> },
      { path: 'community', element: <CommunityPage /> },
      { path: 'community/:id', element: <PostDetailPage /> },
      { path: 'ai-support', element: <AISupportPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: 'patient',
    element: (
      <ProtectedRoute roles={['patient']}>
        <PatientLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <PatientDashboardPage /> },
      { path: 'chatbot', element: <ChatbotPage /> },
      { path: 'chatbot/history', element: <Navigate to="/patient/chatbot" replace /> },
      { path: 'appointments/book', element: <BookAppointmentPage /> },
      { path: 'appointments/:id', element: <AppointmentDetailPage /> },
      { path: 'video-sessions', element: <VideoSessionsPage /> },
      { path: 'video-sessions/:id', element: <VideoSessionDetailPage /> },
      { path: 'video-session/:id', element: <VideoSessionPage /> },
      { path: 'forum', element: <ForumPage /> },
      { path: 'forum/new', element: <CreatePostPage /> },
      { path: 'forum/:id', element: <PostDetailPage /> },
      { path: 'profile', element: <PatientProfilePage /> },
      { path: 'feedback/:appointmentId', element: <FeedbackPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: 'consultant',
    element: (
      <ProtectedRoute roles={['consultant']}>
        <ConsultantLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <ConsultantDashboardPage /> },
      { path: 'patients', element: <PatientsPage /> },
      { path: 'patients/:id/progress', element: <PatientProgressPage /> },
      { path: 'patients/:id/progress/new', element: <CreateProgressLogPage /> },
      { path: 'referrals', element: <ReferralsPage /> },
      { path: 'availability', element: <ConsultantAvailabilityPage /> },
      { path: 'forum', element: <ForumPage /> },
      { path: 'forum/new', element: <CreatePostPage /> },
      { path: 'forum/:id', element: <PostDetailPage /> },
      { path: 'video-session/:id', element: <VideoSessionPage /> },
      { path: 'profile', element: <ConsultantProfilePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: 'admin',
    element: (
      <ProtectedRoute roles={['admin']}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: 'dashboard', element: <AdminDashboardPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: 'users/new', element: <CreateUserPage /> },
      { path: 'consultants', element: <AdminConsultantsPage /> },
      { path: 'consultants/new', element: <CreateConsultantPage /> },
      { path: 'feedback', element: <AdminFeedbackPage /> },
      { path: 'reports', element: <AdminReportsPage /> },
      { path: 'surveys', element: <SurveysPage /> },
      { path: 'surveys/new', element: <CreateSurveyPage /> },
      { path: 'directory', element: <DirectoryPage /> },
      { path: 'directory/hospitals/new', element: <HospitalFormPage /> },
      { path: 'directory/hospitals/:id/edit', element: <HospitalFormPage /> },
      { path: 'directory/psychiatrists/new', element: <PsychiatristFormPage /> },
      { path: 'directory/psychiatrists/:id/edit', element: <PsychiatristFormPage /> },
      { path: 'profile', element: <AdminProfilePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
