import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Video,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Shield,
  Sparkles,
  Check,
  RotateCcw,
  MessageSquareQuote,
  Clock3,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import useToast from '../../components/ui/useToast';
import { appointmentService } from '../../services/appointmentService';
import { sessionSummaryService } from '../../services/sessionSummaryService';
import './VideoSessions.css';

const STATUS_MAP = {
  confirmed: { variant: 'success', icon: CheckCircle, label: 'Confirmed / Upcoming' },
  pending: { variant: 'warning', icon: AlertCircle, label: 'Pending Confirmation' },
  completed: { variant: 'default', icon: CheckCircle, label: 'Completed' },
  cancelled: { variant: 'error', icon: XCircle, label: 'Cancelled' },
};

function formatDateDisplay(dStr) {
  if (!dStr) return '';
  try {
    const [year, month, day] = dStr.split('-');
    const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
    return dateObj.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dStr;
  }
}

export default function VideoSessionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [appointment, setAppointment] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [appt, summaryData] = await Promise.all([
          appointmentService.getById(id),
          sessionSummaryService.getByAppointment(id).catch(() => null),
        ]);
        setAppointment(appt);
        setSummary(summaryData);
      } catch (err) {
        addToast({ type: 'error', title: 'Failed to load session', message: err.message });
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleCancel = async () => {
    setShowCancelModal(false);
    setCancelling(true);
    try {
      await appointmentService.updateStatus(id, 'cancelled');
      setAppointment((prev) => ({ ...prev, status: 'cancelled' }));
      addToast({
        type: 'info',
        title: 'Appointment Cancelled',
        message: 'Your video consultation has been cancelled.',
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Cancellation failed', message: err.message });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="vs-detail">
        <div className="vs-detail__loading">
          <Spinner size="lg" label="Loading video session details..." />
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="vs-detail">
        <Link to="/patient/video-sessions" className="vs-detail__back-link">
          <ArrowLeft aria-hidden="true" /> Back to Video Sessions
        </Link>
        <Card className="vs-detail__empty-card">
          <p className="vs-detail__empty-text">Video session not found or access expired.</p>
          <Button variant="secondary" onClick={() => navigate('/patient/video-sessions')}>
            View All Sessions
          </Button>
        </Card>
      </div>
    );
  }

  const status = STATUS_MAP[appointment.status] || {
    variant: 'default',
    icon: AlertCircle,
    label: appointment.status,
  };
  const StatusIcon = status.icon;
  const isUpcoming = appointment.status === 'confirmed' || appointment.status === 'pending';
  const isCompleted = appointment.status === 'completed';
  const isCancelled = appointment.status === 'cancelled';

  // Determine Summary State from real data:
  // 1. Cancelled: 'no-summary-applicable'
  // 2. Has a recorded summary: 'has-summary'
  // 3. Otherwise (upcoming/pending or completed without notes): 'no-summary-yet'
  let summaryState = 'no-summary-yet';
  if (isCancelled) {
    summaryState = 'no-summary-applicable';
  } else if (summary) {
    summaryState = 'has-summary';
  }

  const takeaways = (summary?.takeaways || '')
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <div className="vs-detail">
      {/* Back Navigation Bar */}
      <div className="vs-detail__nav">
        <Link to="/patient/video-sessions" className="vs-detail__back-link">
          <ArrowLeft aria-hidden="true" /> Back to Video Sessions
        </Link>
      </div>

      {/* Main Metadata Card */}
      <Card className="vs-detail__meta-card">
        <div className="vs-detail__header">
          <div className="vs-detail__specialist">
            <Avatar name={appointment.consultantName || 'Consultant'} size="lg" className="vs-detail__avatar" />
            <div className="vs-detail__specialist-meta">
              <span className="vs-detail__session-tag">Session #{appointment.appointmentId}</span>
              <h1 className="vs-detail__title">{appointment.consultantName || 'Licensed Consultant'}</h1>
              <p className="vs-detail__subtitle">1-on-1 Private Video Consultation</p>
            </div>
          </div>

          <div className="vs-detail__badge-wrapper">
            <Badge variant={status.variant} className="vs-detail__status-badge">
              <StatusIcon aria-hidden="true" />
              <span>{status.label}</span>
            </Badge>
          </div>
        </div>

        <hr className="vs-detail__divider" />

        {/* Attribute Grid */}
        <div className="vs-detail__grid">
          <div className="vs-detail__field">
            <div className="vs-detail__field-icon">
              <Calendar aria-hidden="true" />
            </div>
            <div>
              <p className="vs-detail__field-label">Scheduled Date</p>
              <p className="vs-detail__field-value">{formatDateDisplay(appointment.appointmentDate)}</p>
            </div>
          </div>

          <div className="vs-detail__field">
            <div className="vs-detail__field-icon">
              <Clock aria-hidden="true" />
            </div>
            <div>
              <p className="vs-detail__field-label">Session Time</p>
              <p className="vs-detail__field-value">{appointment.appointmentTime}</p>
            </div>
          </div>

          <div className="vs-detail__field">
            <div className="vs-detail__field-icon">
              <Video aria-hidden="true" />
            </div>
            <div>
              <p className="vs-detail__field-label">Format</p>
              <p className="vs-detail__field-value">Encrypted WebRTC Video</p>
            </div>
          </div>

          <div className="vs-detail__field">
            <div className="vs-detail__field-icon">
              <Shield aria-hidden="true" />
            </div>
            <div>
              <p className="vs-detail__field-label">Privacy Status</p>
              <p className="vs-detail__field-value">HIPAA & GDPR Compliant</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="vs-detail__actions">
          {isUpcoming && (
            <>
              <Link to={`/patient/video-session/${appointment.appointmentId}`}>
                <Button variant="primary" size="lg" leftIcon={Video} className="vs-detail__join-btn">
                  Join Video Session
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setShowCancelModal(true)}
                className="vs-detail__cancel-btn"
              >
                Cancel Appointment
              </Button>
            </>
          )}

          {isCompleted && (
            <>
              <Link to={`/patient/feedback/${appointment.appointmentId}`}>
                <Button variant="primary" size="lg" leftIcon={Sparkles}>
                  Rate & Leave Feedback
                </Button>
              </Link>
              <Link to="/patient/appointments/book">
                <Button variant="secondary" size="lg" leftIcon={RotateCcw}>
                  Book Follow-Up
                </Button>
              </Link>
            </>
          )}

          {isCancelled && (
            <Link to="/patient/appointments/book">
              <Button variant="primary" size="lg">
                Book a New Consultation
              </Button>
            </Link>
          )}
        </div>
      </Card>

      {/* =========================================================================
          CONSULTANT SESSION SUMMARY SECTION (3 Distinct States)
          ========================================================================= */}

      {/* STATE 1: HAS SUMMARY (Completed session with clinical notes) */}
      {summaryState === 'has-summary' && (
        <Card className="vs-detail__summary-card">
          <div className="vs-detail__summary-header">
            <div className="vs-detail__summary-header-icon" aria-hidden="true">
              <FileText />
            </div>
            <div className="vs-detail__summary-header-text">
              <h2 className="vs-detail__summary-title">Consultant Session Summary</h2>
              <p className="vs-detail__summary-subtitle">
                Clinical notes and coping strategies provided by {appointment.consultantName || 'your consultant'}.
              </p>
            </div>
          </div>

          <div className="vs-detail__summary-body">
            {/* Focus / Narrative */}
            <div className="vs-detail__summary-block">
              <h3 className="vs-detail__block-title">
                <MessageSquareQuote className="vs-detail__block-icon" aria-hidden="true" />
                Session Focus & Exploration
              </h3>
              <p className="vs-detail__block-text">{summary.focus}</p>
            </div>

            {/* Key Takeaways */}
            {takeaways.length > 0 && (
              <div className="vs-detail__summary-block">
                <h3 className="vs-detail__block-title">
                  <Check className="vs-detail__block-icon" aria-hidden="true" />
                  Key Coping Strategies & Takeaways
                </h3>
                <ul className="vs-detail__takeaways-list">
                  {takeaways.map((item, idx) => (
                    <li key={idx} className="vs-detail__takeaway-item">
                      <span className="vs-detail__takeaway-bullet" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Next Steps */}
            {summary.nextSteps && (
              <div className="vs-detail__summary-block">
                <h3 className="vs-detail__block-title">
                  <Calendar className="vs-detail__block-icon" aria-hidden="true" />
                  Recommended Next Steps
                </h3>
                <p className="vs-detail__block-text">{summary.nextSteps}</p>
              </div>
            )}
          </div>

          <div className="vs-detail__summary-footer">
            <Shield className="vs-detail__footer-icon" aria-hidden="true" />
            <span>
              These notes are protected under medical confidentiality and stored securely in your health profile.
            </span>
          </div>
        </Card>
      )}

      {/* STATE 2: NO SUMMARY YET (Upcoming or recent session where notes are pending) */}
      {summaryState === 'no-summary-yet' && (
        <Card className="vs-detail__summary-card vs-detail__summary-card--pending">
          <div className="vs-detail__pending-state">
            <div className="vs-detail__pending-icon" aria-hidden="true">
              <Clock3 />
            </div>
            <h2 className="vs-detail__pending-title">Session Summary Pending</h2>
            <p className="vs-detail__pending-desc">
              Your consultant hasn't added a summary for this session yet. Clinical notes and recommended action plans
              will appear here after your session is completed.
            </p>
          </div>
        </Card>
      )}

      {/* STATE 3: NO SUMMARY APPLICABLE (Cancelled session) */}
      {summaryState === 'no-summary-applicable' && (
        <Card className="vs-detail__summary-card vs-detail__summary-card--cancelled">
          <div className="vs-detail__cancelled-state">
            <div className="vs-detail__cancelled-icon" aria-hidden="true">
              <XCircle />
            </div>
            <h2 className="vs-detail__cancelled-title">Session Was Cancelled</h2>
            <p className="vs-detail__cancelled-desc">
              This appointment was cancelled, so no clinical notes or summary were recorded. You can easily schedule a
              new session at your convenience.
            </p>
            <Link to="/patient/appointments/book">
              <Button variant="primary" size="sm">
                Schedule New Appointment
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Cancellation Confirmation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Video Consultation"
      >
        <div className="vs-detail__modal-content">
          <p>
            Are you sure you want to cancel your consultation with{' '}
            <strong>{appointment.consultantName}</strong> scheduled for{' '}
            <strong>{formatDateDisplay(appointment.appointmentDate)}</strong> at{' '}
            <strong>{appointment.appointmentTime}</strong>?
          </p>
          <div className="vs-detail__modal-actions">
            <Button variant="ghost" onClick={() => setShowCancelModal(false)}>
              Keep Appointment
            </Button>
            <Button variant="destructive" loading={cancelling} onClick={handleCancel}>
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
