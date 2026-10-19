import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CalendarPlus,
  CalendarX,
  Video,
  Clock,
  Sparkles,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import useToast from '../../components/ui/useToast';
import { userService } from '../../services/userService';
import { appointmentService } from '../../services/appointmentService';
import { progressService } from '../../services/progressService';
import './Dashboard.css';

function getProgressTone(score, label) {
  if (label.includes('Overall')) {
    if (score >= 70) return 'success';
    if (score >= 50) return 'primary';
    return 'warning';
  }
  if (score <= 30) return 'success';
  if (score <= 50) return 'accent';
  if (score <= 70) return 'warning';
  return 'destructive';
}

function getStatusLabel(score, label) {
  if (label.includes('Overall')) {
    if (score >= 70) return 'Optimal';
    if (score >= 50) return 'Good';
    return 'Building';
  }
  if (score <= 30) return 'Mild';
  if (score <= 50) return 'Moderate';
  if (score <= 70) return 'Elevated';
  return 'High';
}

function SkeletonCard() {
  return (
    <div className="pt-dash__skeleton" aria-hidden="true">
      <div className="pt-dash__skeleton-line pt-dash__skeleton-line--title" />
      <div className="pt-dash__skeleton-line pt-dash__skeleton-line--body" />
      <div className="pt-dash__skeleton-line pt-dash__skeleton-line--body" />
      <div className="pt-dash__skeleton-block" />
    </div>
  );
}

export default function PatientDashboardPage() {
  const { addToast } = useToast();
  const [user, setUser] = useState(null);
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [apptLoading, setApptLoading] = useState(true);
  const [apptError, setApptError] = useState(null);
  const [progress, setProgress] = useState(null);
  const [progressLoading, setProgressLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await userService.me();
        setUser(data.user);
      } catch (err) {
        addToast({ type: 'error', title: 'Failed to load profile', message: err.message });
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setApptLoading(true);
      try {
        const appointments = await appointmentService.list();
        const confirmed = Array.isArray(appointments) && appointments.find((a) => a.status === 'confirmed');
        setUpcomingAppointment(confirmed || null);
        setApptError(null);
      } catch (err) {
        setApptError(err.message);
      } finally {
        setApptLoading(false);
      }
    })();
  }, []);

  // Progress Snapshot: read the latest consultant-recorded progress log.
  useEffect(() => {
    (async () => {
      setProgressLoading(true);
      try {
        const latest = await progressService.getLatest();
        setProgress(latest || null);
      } catch {
        setProgress(null);
      } finally {
        setProgressLoading(false);
      }
    })();
  }, []);

  const progressItems = progress
    ? [
        { label: 'Anxiety', score: Math.round(Number(progress.anxietyScore) || 0) },
        { label: 'Depression', score: Math.round(Number(progress.depressionScore) || 0) },
        { label: 'Overthinking', score: Math.round(Number(progress.overthinkingScore) || 0) },
        { label: 'Overall Wellbeing', score: Math.round(Number(progress.overallScore) || 0) },
      ]
    : null;

  return (
    <div className="pt-dash">
      {/* 1. Hero / Greeting Banner */}
      <section className="pt-dash-hero" aria-label="Welcome banner">
        <div className="pt-dash-hero__content">
          <div className="pt-dash-hero__badge">
            <Sparkles className="pt-dash-hero__badge-icon" aria-hidden="true" />
            <span>Patient Wellbeing Portal</span>
          </div>
          <h1 className="pt-dash-hero__title">
            Welcome back, {user?.name?.split(' ')[0] || 'Member'}
          </h1>
          <p className="pt-dash-hero__subtitle">
            Here is a quick look at your wellbeing journey, upcoming consultations, and community updates today.
          </p>
        </div>

        <div className="pt-dash-hero__meta">
          <div className="pt-dash-hero__user-chip">
            <Avatar name={user?.name || 'User'} size="lg" className="pt-dash-hero__avatar" />
            <div className="pt-dash-hero__user-info">
              <span className="pt-dash-hero__user-name">{user?.name || 'Healing Horizon Member'}</span>
              <span className="pt-dash-hero__user-status">Active Wellness Plan</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Primary Hero Info Cards */}
      <div className="pt-dash__grid">
        {/* Card 1: Upcoming Appointment */}
        <Card className="pt-dash__card pt-dash__card--featured pt-dash__appointment">
          <div className="pt-dash__section-head">
            <div className="pt-dash__section-head-left">
              <h2 className="pt-dash__section-title">Upcoming Appointment</h2>
              <span className="pt-dash__section-subtitle">Your next scheduled consultation</span>
            </div>
            {upcomingAppointment && <Badge variant="success">Confirmed</Badge>}
          </div>

          {apptLoading ? (
            <SkeletonCard />
          ) : apptError ? (
            <div className="pt-dash__error">
              <p className="pt-dash__error-text">Couldn&rsquo;t load appointments.</p>
              <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : upcomingAppointment ? (
            <div className="pt-dash__appointment-body">
              <div className="pt-dash__appointment-info">
                <Avatar name={upcomingAppointment.consultantName || 'Consultant'} size="md" />
                <div>
                  <p className="pt-dash__appointment-name">{upcomingAppointment.consultantName}</p>
                  <p className="pt-dash__appointment-specialty">
                    Session #{upcomingAppointment.appointmentId} &bull; 1-on-1 Consultation
                  </p>
                </div>
              </div>
              <div className="pt-dash__appointment-when">
                <span className="pt-dash__appointment-when-item">
                  <Calendar aria-hidden="true" /> {upcomingAppointment.appointmentDate}
                </span>
                <span className="pt-dash__appointment-when-item">
                  <Clock aria-hidden="true" /> {upcomingAppointment.appointmentTime}
                </span>
              </div>
              <div className="pt-dash__appointment-actions">
                <Link to={`/patient/video-session/${upcomingAppointment.appointmentId}`}>
                  <Button variant="primary" leftIcon={Video}>
                    Join Video Session
                  </Button>
                </Link>
                <Link to={`/patient/appointments/${upcomingAppointment.appointmentId}`}>
                  <Button variant="secondary">View Details</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="pt-dash__empty-state">
              <div className="pt-dash__empty-icon">
                <CalendarX aria-hidden="true" />
              </div>
              <p className="pt-dash__empty-title">No upcoming appointments</p>
              <p className="pt-dash__empty-desc">
                You don&rsquo;t have any sessions scheduled right now. Book a 1-on-1 consultation with a licensed specialist whenever you&rsquo;re ready.
              </p>
              <Link to="/patient/appointments/book">
                <Button variant="primary" size="sm" leftIcon={CalendarPlus}>
                  Book Appointment
                </Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Card 2: Progress Snapshot */}
        <Card className="pt-dash__card pt-dash__card--featured pt-dash__progress">
          <div className="pt-dash__section-head">
            <div className="pt-dash__section-head-left">
              <h2 className="pt-dash__section-title">Progress Snapshot</h2>
              <span className="pt-dash__section-subtitle">Based on regular check-ins</span>
            </div>
            {progressItems && <Badge variant="default">Active Track</Badge>}
          </div>

          {progressLoading ? (
            <SkeletonCard />
          ) : progressItems ? (
            <>
              <div className="pt-dash__progress-list">
                {progressItems.map(({ label, score }) => {
                  const tone = getProgressTone(score, label);
                  const statusLabel = getStatusLabel(score, label);
                  return (
                    <div key={label} className="pt-dash__progress-item">
                      <div className="pt-dash__progress-label-row">
                        <span className="pt-dash__progress-label">{label}</span>
                        <div className="pt-dash__progress-metric">
                          <span className={`pt-dash__progress-tier pt-dash__progress-tier--${tone}`}>
                            {statusLabel}
                          </span>
                          <span className="pt-dash__progress-score">{score}%</span>
                        </div>
                      </div>
                      <div
                        className="pt-dash__bar"
                        role="progressbar"
                        aria-valuenow={score}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${label} progress: ${score}% (${statusLabel})`}
                      >
                        <div
                          className={`pt-dash__bar-fill pt-dash__bar-fill--${tone}`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="pt-dash__progress-note">
                {progress.loggedAt
                  ? `Updated ${new Date(progress.loggedAt).toLocaleDateString()}. `
                  : ''}
                Lower symptom percentages and higher overall index indicate steady recovery.
              </p>
            </>
          ) : (
            <div className="pt-dash__progress-empty">
              <p className="pt-dash__progress-empty-title">No assessment recorded yet</p>
              <p className="pt-dash__progress-empty-desc">
                Your care team will add progress scores after your first consultation.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
