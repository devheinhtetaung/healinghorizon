import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Video,
  Calendar,
  Clock,
  ChevronRight,
  Plus,
  VideoOff,
  Sparkles,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import useToast from '../../components/ui/useToast';
import { appointmentService } from '../../services/appointmentService';
import './VideoSessions.css';

const STATUS_MAP = {
  confirmed: { variant: 'success', icon: CheckCircle, label: 'Confirmed' },
  pending: { variant: 'warning', icon: AlertCircle, label: 'Pending' },
  completed: { variant: 'default', icon: CheckCircle, label: 'Completed' },
  cancelled: { variant: 'error', icon: XCircle, label: 'Cancelled' },
};

function formatDateDisplay(dStr) {
  if (!dStr) return '';
  try {
    const [year, month, day] = dStr.split('-');
    const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
    return dateObj.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dStr;
  }
}

export default function VideoSessionsPage() {
  const { addToast } = useToast();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await appointmentService.list();
      setAppointments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load video sessions');
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Partition appointments into Upcoming and Past
  const upcoming = appointments.filter(
    (s) => s.status === 'confirmed' || s.status === 'pending'
  );
  const past = appointments.filter(
    (s) => s.status === 'completed' || s.status === 'cancelled'
  );

  return (
    <div className="videos">
      {/* 1. Page Header */}
      <div className="videos__header">
        <div>
          <h1 className="videos__title">Video Sessions</h1>
          <p className="videos__subtitle">
            Manage your scheduled 1-on-1 private video consultations and access past clinical summaries.
          </p>
        </div>
        <Link to="/patient/appointments/book">
          <Button variant="primary" leftIcon={Plus} className="videos__book-btn">
            Book Consultation
          </Button>
        </Link>
      </div>

      {/* 2. Loading State */}
      {loading && (
        <div className="videos__grid" aria-busy="true">
          {[1, 2, 3].map((n) => (
            <div key={n} className="videos__skeleton">
              <div className="videos__skeleton-line videos__skeleton-line--s" />
              <div className="videos__skeleton-line videos__skeleton-line--m" />
              <div className="videos__skeleton-line videos__skeleton-line--l" />
            </div>
          ))}
        </div>
      )}

      {/* 3. Error State */}
      {!loading && error && (
        <div className="videos__state">
          <p className="videos__state-text">Couldn&rsquo;t load video sessions.</p>
          <Button variant="secondary" onClick={fetchAppointments}>
            Retry
          </Button>
        </div>
      )}

      {/* 4. Global Empty State (no sessions at all) */}
      {!loading && !error && appointments.length === 0 && (
        <div className="videos__empty-card">
          <div className="videos__empty-icon" aria-hidden="true">
            <VideoOff />
          </div>
          <h2 className="videos__empty-title">No Video Sessions Scheduled</h2>
          <p className="videos__empty-desc">
            You haven't scheduled any video consultations yet. Connect with a licensed mental health specialist
            to begin your care plan.
          </p>
          <Link to="/patient/appointments/book">
            <Button variant="primary" size="lg" leftIcon={Plus}>
              Book Your First Consultation
            </Button>
          </Link>
        </div>
      )}

      {/* 5. Section: Upcoming Consultations */}
      {!loading && !error && upcoming.length > 0 && (
        <section className="videos__section" aria-labelledby="upcoming-sessions-heading">
          <div className="videos__section-head">
            <div className="videos__section-title-wrap">
              <span className="videos__section-indicator videos__section-indicator--upcoming" />
              <h2 id="upcoming-sessions-heading" className="videos__section-title">
                Upcoming Consultations
              </h2>
            </div>
            <span className="videos__section-count">
              {upcoming.length} {upcoming.length === 1 ? 'session' : 'sessions'}
            </span>
          </div>

          <div className="videos__grid">
            {upcoming.map((s) => {
              const st = STATUS_MAP[s.status] || { variant: 'default', label: s.status };
              return (
                <Card key={s.appointmentId} hover className="videos__card videos__card--upcoming">
                  <div className="videos__card-top">
                    <div className="videos__card-consultant">
                      <Avatar name={s.consultantName || 'Consultant'} size="md" />
                      <div>
                        <span className="videos__card-name">{s.consultantName || 'Specialist'}</span>
                        <span className="videos__card-role">Licensed Consultant</span>
                      </div>
                    </div>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>

                  <div className="videos__card-meta">
                    <div className="videos__card-row">
                      <span className="videos__card-key">
                        <Calendar aria-hidden="true" /> Date
                      </span>
                      <span className="videos__card-val">{formatDateDisplay(s.appointmentDate)}</span>
                    </div>
                    <div className="videos__card-row">
                      <span className="videos__card-key">
                        <Clock aria-hidden="true" /> Time
                      </span>
                      <span className="videos__card-val">{s.appointmentTime}</span>
                    </div>
                    <div className="videos__card-row">
                      <span className="videos__card-key">
                        <Video aria-hidden="true" /> Format
                      </span>
                      <span className="videos__card-val">Encrypted Video</span>
                    </div>
                  </div>

                  <div className="videos__card-actions">
                    <Link
                      to={`/patient/video-session/${s.appointmentId}`}
                      className="videos__action-link-primary"
                    >
                      <Button variant="primary" size="sm" leftIcon={Video} className="videos__card-join">
                        Join Session
                      </Button>
                    </Link>
                    <Link
                      to={`/patient/video-sessions/${s.appointmentId}`}
                      className="videos__action-link-sub"
                    >
                      <Button variant="ghost" size="sm">
                        View Details <ChevronRight aria-hidden="true" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. Section: Past & Completed Consultations */}
      {!loading && !error && past.length > 0 && (
        <section className="videos__section" aria-labelledby="past-sessions-heading">
          <div className="videos__section-head">
            <div className="videos__section-title-wrap">
              <span className="videos__section-indicator videos__section-indicator--past" />
              <h2 id="past-sessions-heading" className="videos__section-title">
                Past Consultations & Clinical Summaries
              </h2>
            </div>
            <span className="videos__section-count">
              {past.length} {past.length === 1 ? 'session' : 'sessions'}
            </span>
          </div>

          <div className="videos__grid">
            {past.map((s) => {
              const st = STATUS_MAP[s.status] || { variant: 'default', label: s.status };
              const isCompleted = s.status === 'completed';
              return (
                <Card key={s.appointmentId} hover className="videos__card videos__card--past">
                  <div className="videos__card-top">
                    <div className="videos__card-consultant">
                      <Avatar name={s.consultantName || 'Consultant'} size="md" />
                      <div>
                        <span className="videos__card-name">{s.consultantName || 'Specialist'}</span>
                        <span className="videos__card-role">Session #{s.appointmentId}</span>
                      </div>
                    </div>
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </div>

                  <div className="videos__card-meta">
                    <div className="videos__card-row">
                      <span className="videos__card-key">
                        <Calendar aria-hidden="true" /> Date
                      </span>
                      <span className="videos__card-val">{formatDateDisplay(s.appointmentDate)}</span>
                    </div>
                    <div className="videos__card-row">
                      <span className="videos__card-key">
                        <Clock aria-hidden="true" /> Time
                      </span>
                      <span className="videos__card-val">{s.appointmentTime}</span>
                    </div>
                  </div>

                  <div className="videos__card-foot">
                    <Link
                      to={`/patient/video-sessions/${s.appointmentId}`}
                      className="videos__card-nav-link"
                    >
                      <span className="videos__card-nav-text">
                        <FileText className="videos__card-nav-icon" aria-hidden="true" />
                        {isCompleted ? 'View Clinical Summary & Notes' : 'View Session Details'}
                      </span>
                      <ChevronRight className="videos__card-chevron" aria-hidden="true" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
