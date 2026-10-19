import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  BadgeCheck,
  Users as UsersIcon,
  TrendingUp,
  Calendar,
  Clock,
  Video,
  Check,
  X,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import useToast from '../../components/ui/useToast';
import { userService } from '../../services/userService';
import { appointmentService } from '../../services/appointmentService';
import './Dashboard.css';

const PENDING = 'pending';

/* ── date/time helpers ────────────────────────────────────────────────
   The API returns `appointmentDate` as "YYYY-MM-DD" and `appointmentTime`
   as a raw DB TIME ("14:30:00") — never parse the date with `new Date(str)`
   (UTC midnight shifts a day in negative-offset timezones). */

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseDateLocal(dateStr) {
  if (!dateStr) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr));
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysFrom(a, b) {
  return Math.round((startOfDay(a) - startOfDay(b)) / 86400000);
}

/** "14:30:00" / "09:00" → "2:30 PM" / "9:00 AM"; "2:30 PM" passes through. */
function formatTimeDisplay(raw) {
  if (!raw) return '';
  const ampm = /^(\d{1,2}):(\d{2})\s*(A\.?M\.?|P\.?M\.?)$/i.exec(String(raw));
  if (ampm) {
    return `${Number(ampm[1])}:${ampm[2]} ${ampm[3].replace(/\./g, '').toUpperCase()}`;
  }
  const hm = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(String(raw));
  if (hm) {
    const h24 = Number(hm[1]);
    const suffix = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 || 12;
    return `${h12}:${hm[2]} ${suffix}`;
  }
  return String(raw);
}

function timeToMinutes(raw) {
  if (!raw) return -1;
  const ampm = /^(\d{1,2}):(\d{2})\s*(A\.?M\.?|P\.?M\.?)$/i.exec(String(raw));
  if (ampm) {
    let h = Number(ampm[1]) % 12;
    if (/p\.?m\.?/i.test(ampm[3])) h += 12;
    return h * 60 + Number(ampm[2]);
  }
  const hm = /^(\d{1,2}):(\d{2})/.exec(String(raw));
  if (hm) return Number(hm[1]) * 60 + Number(hm[2]);
  return -1;
}

function dateLabel(d, today) {
  if (!d) return 'Unscheduled';
  const diff = daysFrom(d, today);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}

/* Mirrors the patient-facing status map so both portals read identically. */
const STATUS_MAP = {
  confirmed: { variant: 'success', label: 'Confirmed' },
  pending:   { variant: 'warning', label: 'Pending' },
  completed: { variant: 'default', label: 'Completed' },
  cancelled: { variant: 'error',   label: 'Cancelled' },
};

const SCOPES = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Next 7 Days' },
  { id: 'all', label: 'All' },
];

function SkeletonCard() {
  return (
    <div className="con-dash__skeleton" aria-hidden="true">
      <div className="con-dash__skeleton-line con-dash__skeleton-line--title" />
      <div className="con-dash__skeleton-line con-dash__skeleton-line--body" />
      <div className="con-dash__skeleton-line con-dash__skeleton-line--body" />
      <div className="con-dash__skeleton-block" />
    </div>
  );
}

export default function ConsultantDashboardPage() {
  const { addToast } = useToast();
  const [consultant, setConsultant] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(true);
  const [apptError, setApptError] = useState(null);
  const [loading, setLoading] = useState(true);
  // Default to the week view: a consultant's "glance" spans the next few days,
  // not just today (an empty Today view would be the common case otherwise).
  // Pending requests are always included regardless of scope.
  const [scope, setScope] = useState('week');

  // Pending-appointment action state (Accept / Decline)
  const [actionId, setActionId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [declineTarget, setDeclineTarget] = useState(null);
  const [declineReason, setDeclineReason] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [userData, appointmentData] = await Promise.all([userService.me(), appointmentService.list()]);
        if (cancelled) return;
        setConsultant(userData);
        setAppointments(Array.isArray(appointmentData) ? appointmentData : []);
        setApptError(null);
      } catch (err) {
        if (!cancelled) {
          setApptError(err.message);
          try {
            const userData = await userService.me();
            if (!cancelled) setConsultant(userData);
          } catch { /* user fetch also failed */ }
        }
      } finally {
        if (!cancelled) { setLoading(false); setApptLoading(false); }
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="con-dash" aria-busy="true">
        <div className="con-dash__stats">
          {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
        </div>
        <SkeletonCard />
      </div>
    );
  }

  if (!consultant) {
    return (
      <div className="con-dash">
        <Card style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-muted-foreground)', marginBottom: 'var(--space-4)' }}>Unable to load dashboard. Please try again.</p>
          <Button variant="secondary" onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  const profile = consultant.profile || {};
  const user = consultant.user || consultant;

  const today = new Date();
  const todayStart = startOfDay(today);

  const uniquePatients = new Set(appointments.map((a) => a.patientId)).size;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const sessionsThisWeek = appointments.filter((a) => {
    const d = parseDateLocal(a.appointmentDate || a.scheduledAt);
    return d && d >= weekStart;
  }).length;

  const STATS = [
    { icon: UsersIcon, label: 'Total Patients', value: String(uniquePatients) },
    { icon: Star, label: 'Average Rating', value: String(profile.rating ?? '—') },
    { icon: TrendingUp, label: 'Sessions This Week', value: String(sessionsThisWeek) },
  ];

  const pendingAppointments = appointments.filter((a) => a.status === PENDING);

  // Scope the schedule view — but pending requests are action items and stay
  // visible in every scope so a consultant never misses one.
  const scopedAppointments = appointments.filter((a) => {
    if (a.status === PENDING) return true;
    const d = parseDateLocal(a.appointmentDate || a.scheduledAt);
    if (!d) return scope === 'all';
    const diff = daysFrom(d, today);
    if (scope === 'today') return diff === 0;
    if (scope === 'week') return diff >= 0 && diff < 7;
    return true;
  });

  // Group by calendar day. Upcoming days read soonest-first; past days
  // (only visible under "All") read most-recent-first.
  const groupMap = new Map();
  for (const a of scopedAppointments) {
    const key = a.appointmentDate || a.scheduledAt || 'unknown';
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key).push(a);
  }
  const dateGroups = [...groupMap.entries()]
    .map(([key, items]) => ({
      key,
      date: parseDateLocal(key === 'unknown' ? null : key),
      items: [...items].sort(
        (x, y) => timeToMinutes(x.appointmentTime) - timeToMinutes(y.appointmentTime)
      ),
    }))
    .sort((a, b) => {
      const aUp = a.date && a.date >= todayStart;
      const bUp = b.date && b.date >= todayStart;
      if (aUp && bUp) return a.date - b.date;
      if (!aUp && !bUp) return b.date - a.date;
      return aUp ? -1 : 1;
    });

  // Persist an Accept/Decline decision against the real status endpoint.
  // Declining ('cancelled') sends the reason through so the server can store
  // it and surface it to the patient.
  const applyStatus = async (appointment, status, reason = '') => {
    setActionId(appointment.appointmentId);
    setActionLoading(true);
    try {
      await appointmentService.updateStatus(appointment.appointmentId, status, reason);
      setAppointments((prev) =>
        prev.map((a) =>
          a.appointmentId === appointment.appointmentId
            ? { ...a, status, declineReason: reason || a.declineReason }
            : a
        )
      );
      addToast({
        type: 'success',
        title: status === 'confirmed' ? 'Appointment confirmed' : 'Appointment declined',
        message:
          status === 'confirmed'
            ? `${appointment.patientName || 'The patient'} has been notified of the confirmed booking.`
            : reason
              ? `${appointment.patientName || 'The patient'} has been notified, including your reason.`
              : `${appointment.patientName || 'The patient'} has been notified of the declined booking.`,
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Action failed', message: err.message });
    } finally {
      setActionLoading(false);
      setActionId(null);
    }
  };

  const handleAccept = (appointment) => applyStatus(appointment, 'confirmed');

  const handleDeclineConfirm = async () => {
    if (!declineTarget) return;
    const target = declineTarget;
    setDeclineTarget(null);
    await applyStatus(target, 'cancelled', declineReason.trim());
    setDeclineReason('');
  };

  const statusBadge = (a) => {
    const s = STATUS_MAP[a.status] || { variant: 'default', label: a.status };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const appointmentRow = (a) => {
    const patientName = a.patientName || 'Patient';
    const timeText = formatTimeDisplay(a.appointmentTime);
    const isPending = a.status === PENDING;
    const isActing = actionId === a.appointmentId && actionLoading;

    return (
      <li key={a.appointmentId} className="con-dash__appointment-item">
        <div className="con-dash__appointment-when">
          {timeText && <span className="con-dash__appointment-clock">{timeText}</span>}
          <span className="con-dash__appointment-format">
            <Video aria-hidden="true" /> Video Session
          </span>
        </div>
        <div className="con-dash__appointment-info">
          <Avatar name={patientName} size="sm" />
          <p className="con-dash__appointment-patient">{patientName}</p>
        </div>
        <div className="con-dash__appointment-actions">
          {statusBadge(a)}
          {isPending && (
            <span className="con-dash__pending-controls" aria-label="Confirm or decline this request">
              <Button
                variant="primary"
                size="sm"
                leftIcon={Check}
                loading={isActing}
                disabled={isActing}
                onClick={() => handleAccept(a)}
              >
                Accept
              </Button>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={X}
                disabled={isActing}
                onClick={() => setDeclineTarget(a)}
              >
                Decline
              </Button>
            </span>
          )}
          {a.status === 'confirmed' && (
            <Link to={`/consultant/video-session/${a.appointmentId}`}>
              <Button variant="primary" size="sm" leftIcon={Video}>Join</Button>
            </Link>
          )}
        </div>
      </li>
    );
  };

  const getSpecialty = () => {
    if (profile.specialty) return profile.specialty;
    if (profile.biography) {
      const sentence = profile.biography.split('.')[0];
      return sentence.length > 60 ? sentence.slice(0, 60) + '...' : sentence;
    }
    return 'Consultant';
  };

  const emptyCopy =
    scope === 'today' ? 'No appointments today.'
    : scope === 'week' ? 'No appointments in the next 7 days.'
    : 'No appointments scheduled.';

  return (
    <div className="con-dash">
      <div className="con-dash__welcome">
        <Avatar name={user.name || ''} size="lg" />
        <div className="con-dash__welcome-text">
          <div className="con-dash__welcome-top">
            <h1 className="con-dash__welcome-title">Welcome back, {(user.name || '').split(' ').slice(1).join(' ') || user.name}</h1>
            {profile.isVerified && (
              <Badge variant="success"><BadgeCheck className="con-dash__verified-icon" aria-hidden="true" /> Verified</Badge>
            )}
          </div>
          <div className="con-dash__welcome-meta">
            <span className="con-dash__specialty">{getSpecialty()}</span>
            <span className="con-dash__welcome-dot" aria-hidden="true" />
            <span className="con-dash__rating">
              <Star className="con-dash__star-sm" aria-hidden="true" /> {profile.rating ?? '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="con-dash__stats">
        {STATS.map(({ icon: Icon, label, value }) => (
          <Card key={label} className="con-dash__stat">
            <div className="con-dash__stat-icon"><Icon aria-hidden="true" /></div>
            <div className="con-dash__stat-body">
              <p className="con-dash__stat-value">{value}</p>
              <p className="con-dash__stat-label">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="con-dash__appointments">
        <div className="con-dash__section-head">
          <div className="con-dash__section-head-left">
            <h2 className="con-dash__section-title"><Calendar aria-hidden="true" /> Appointments</h2>
            {pendingAppointments.length > 0 && (
              <Badge variant="warning">{pendingAppointments.length} pending</Badge>
            )}
          </div>
          <div className="con-dash__scope" role="group" aria-label="Filter appointments by time">
            {SCOPES.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                className={`con-dash__scope-btn${scope === id ? ' con-dash__scope-btn--active' : ''}`}
                aria-pressed={scope === id}
                onClick={() => setScope(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {apptLoading ? (
          <SkeletonCard />
        ) : apptError ? (
          <div className="con-dash__error">
            <p className="con-dash__error-text">Couldn&rsquo;t load appointments.</p>
            <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : dateGroups.length === 0 ? (
          <div className="con-dash__empty-block">
            <p className="con-dash__empty">{emptyCopy}</p>
            {scope !== 'all' && appointments.length > 0 && (
              <p className="con-dash__empty-hint">
                You have appointments outside this view — try Next 7 Days or All.
              </p>
            )}
          </div>
        ) : (
          <div className="con-dash__schedule">
            {dateGroups.map((g) => (
              <section key={g.key} className="con-dash__date-group">
                <h3 className="con-dash__date-label">
                  {dateLabel(g.date, today)}
                  <span className="con-dash__date-count">
                    {g.items.length} {g.items.length === 1 ? 'session' : 'sessions'}
                  </span>
                </h3>
                <ul className="con-dash__appointment-list">
                  {g.items.map(appointmentRow)}
                </ul>
              </section>
            ))}
          </div>
        )}
      </Card>

      {/* Decline confirmation — mirrors the destructive confirmation pattern */}
      <Modal
        isOpen={!!declineTarget}
        onClose={() => { setDeclineTarget(null); setDeclineReason(''); }}
        title="Decline this appointment?"
      >
        {declineTarget && (
          <div className="con-dash__decline">
            <div className="con-dash__decline-summary">
              <Avatar name={declineTarget.patientName || 'Patient'} size="md" />
              <div>
                <p className="con-dash__decline-patient">{declineTarget.patientName || 'Patient'}</p>
                <span className="con-dash__decline-when">
                  <Clock aria-hidden="true" />{' '}
                  {dateLabel(parseDateLocal(declineTarget.appointmentDate), today)}
                  {' \u00b7 '}
                  {formatTimeDisplay(declineTarget.appointmentTime)}
                </span>
              </div>
            </div>

            <p className="con-dash__decline-note">
              Declining cancels this booking and notifies the patient. Add a short reason
              so they know why and can rebook a better time.
            </p>

            <Textarea
              label="Reason (shared with the patient)"
              placeholder="e.g., I have a scheduling conflict that afternoon — the morning slots are open if you'd like to rebook."
              rows={3}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              helperText="Required — the patient will see this reason."
            />

            <div className="con-dash__decline-actions">
              <Button
                variant="ghost"
                onClick={() => { setDeclineTarget(null); setDeclineReason(''); }}
              >
                Keep Appointment
              </Button>
              <Button
                variant="destructive"
                loading={actionLoading}
                disabled={actionLoading || !declineReason.trim()}
                onClick={handleDeclineConfirm}
              >
                Decline Appointment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
