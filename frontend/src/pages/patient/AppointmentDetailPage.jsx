import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, Video, ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import useToast from '../../components/ui/useToast';
import { appointmentService } from '../../services/appointmentService';
import './AppointmentDetail.css';

const STATUS_MAP = {
  confirmed: { variant: 'success', icon: CheckCircle, label: 'Confirmed' },
  pending:   { variant: 'warning', icon: AlertCircle, label: 'Pending' },
  completed: { variant: 'default', icon: CheckCircle, label: 'Completed' },
  cancelled: { variant: 'error',   icon: XCircle,     label: 'Cancelled' },
};

export default function AppointmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await appointmentService.getById(id);
        setAppointment(data);
      } catch (err) {
        addToast({ type: 'error', title: 'Failed to load', message: err.message });
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
      addToast({ type: 'info', title: 'Cancelled', message: 'Your appointment has been cancelled.' });
    } catch (err) {
      addToast({ type: 'error', title: 'Cancel failed', message: err.message });
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="apt-detail">
        <div className="apt-detail__loading"><Spinner size="lg" label="Loading appointment details" /></div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="apt-detail">
        <button type="button" className="apt-detail__back" onClick={() => navigate('/patient/dashboard')}>
          <ArrowLeft aria-hidden="true" /> Back to dashboard
        </button>
        <Card className="apt-detail__card">
          <p style={{ textAlign: 'center', color: 'var(--color-muted-foreground)' }}>Appointment not found.</p>
        </Card>
      </div>
    );
  }

  const status = STATUS_MAP[appointment.status] || { variant: 'default', icon: AlertCircle, label: appointment.status };
  const StatusIcon = status.icon;
  const canCancel = appointment.status === 'confirmed' || appointment.status === 'pending';
  const canJoin = appointment.status === 'confirmed';

  return (
    <div className="apt-detail">
      <button type="button" className="apt-detail__back" onClick={() => navigate('/patient/dashboard')}>
        <ArrowLeft aria-hidden="true" /> Back to dashboard
      </button>

      <Card className="apt-detail__card">
        <div className="apt-detail__header">
          <h1 className="apt-detail__title">Appointment Details</h1>
          <Badge variant={status.variant}>
            <StatusIcon aria-hidden="true" style={{ width: '0.75rem', height: '0.75rem' }} />
            {status.label}
          </Badge>
        </div>

        <div className="apt-detail__consultant">
          <Avatar name={appointment.consultantName || 'Consultant'} size="lg" />
          <div>
            <p className="apt-detail__consultant-name">{appointment.consultantName}</p>
            {appointment.patientName && (
              <p className="apt-detail__consultant-sub">Patient: {appointment.patientName}</p>
            )}
          </div>
        </div>

        <div className="apt-detail__grid">
          <div className="apt-detail__field">
            <Calendar className="apt-detail__field-icon" aria-hidden="true" />
            <div>
              <p className="apt-detail__field-label">Date</p>
              <p className="apt-detail__field-value">{appointment.appointmentDate}</p>
            </div>
          </div>
          <div className="apt-detail__field">
            <Clock className="apt-detail__field-icon" aria-hidden="true" />
            <div>
              <p className="apt-detail__field-label">Time</p>
              <p className="apt-detail__field-value">{appointment.appointmentTime}</p>
            </div>
          </div>
          <div className="apt-detail__field">
            <Calendar className="apt-detail__field-icon" aria-hidden="true" />
            <div>
              <p className="apt-detail__field-label">Session ID</p>
              <p className="apt-detail__field-value">#{appointment.appointmentId}</p>
            </div>
          </div>
        </div>

        <div className="apt-detail__actions">
          {canJoin && (
            <Link to={`/patient/video-session/${appointment.appointmentId}`}>
              <Button variant="primary" size="lg" leftIcon={Video}>Join Session</Button>
            </Link>
          )}
          {canCancel && (
            <Button variant="destructive" size="lg" onClick={() => setShowCancelModal(true)}>
              Cancel Appointment
            </Button>
          )}
          {appointment.status === 'completed' && (
            <Link to={`/patient/feedback/${appointment.appointmentId}`}>
              <Button variant="primary" size="lg">Leave Feedback</Button>
            </Link>
          )}
        </div>
      </Card>

      {/* Cancel confirmation modal */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Cancel Appointment">
        <div className="apt-detail__cancel-modal">
          <p>Are you sure you want to cancel this appointment with <strong>{appointment.consultantName}</strong>? This action cannot be undone.</p>
          <div className="apt-detail__cancel-actions">
            <Button variant="ghost" onClick={() => setShowCancelModal(false)}>Keep It</Button>
            <Button variant="destructive" loading={cancelling} onClick={handleCancel}>
              Cancel Appointment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
