import { useState, useEffect, useRef, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Star,
  BadgeCheck,
  Calendar,
  CalendarCheck,
  Clock,
  Check,
  Video,
  UserCheck,
  ChevronRight,
  ChevronLeft,
  Filter,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import useToast from '../../components/ui/useToast';
import { consultantService } from '../../services/consultantService';
import { appointmentService } from '../../services/appointmentService';
import './BookAppointment.css';

const SPECIALTY_OPTIONS = [
  { value: '', label: 'All specialties' },
  { value: 'Anxiety', label: 'Anxiety' },
  { value: 'Depression', label: 'Depression' },
  { value: 'Stress', label: 'Stress' },
  { value: 'Overthinking', label: 'Overthinking' },
  { value: 'General Support', label: 'General Support' },
];

const QUICK_FILTER_PILLS = [
  'All',
  'Anxiety',
  'Depression',
  'Stress',
  'Overthinking',
  'General Support',
];

const SPECIALTY_KEYWORDS = [
  'Anxiety',
  'Depression',
  'Stress',
  'Overthinking',
  'Trauma',
  'CBT',
  'Mindfulness',
  'General Support',
];

const STEP_LABELS = ['Select Specialist', 'Pick Date & Time', 'Confirm Booking'];

const today = new Date().toISOString().split('T')[0];

function extractSpecialties(bio) {
  if (!bio) return ['General Support'];
  const found = SPECIALTY_KEYWORDS.filter((k) =>
    bio.toLowerCase().includes(k.toLowerCase())
  );
  return found.length > 0 ? found.slice(0, 3) : ['General Support', 'Mental Wellness'];
}

function formatDateDisplay(dStr) {
  if (!dStr) return '';
  const [year, month, day] = dStr.split('-');
  const dateObj = new Date(Number(year), Number(month) - 1, Number(day));
  return dateObj.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function BookAppointmentPage() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [bookedAppointmentId, setBookedAppointmentId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(null);
  const searchId = useId();
  const stepsRef = useRef(null);
  const mountedRef = useRef(false);
  const submittingRef = useRef(false);
  const bookedRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await consultantService.list();
        setConsultants(Array.isArray(data) ? data : []);
      } catch (err) {
        addToast({ type: 'error', title: 'Failed to load consultants', message: err.message });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Fetch real availability for the selected consultant + date (recurring
  // hours minus overrides, minus already-booked times).
  useEffect(() => {
    if (!selectedId || !date) {
      setSlots([]);
      setSlotsLoading(false);
      setSlotsError(null);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    setSlotsError(null);
    (async () => {
      try {
        const data = await consultantService.getAvailability(selectedId, date);
        if (cancelled) return;
        setSlots(Array.isArray(data?.slots) ? data.slots : []);
      } catch (err) {
        if (!cancelled) setSlotsError(err.message || 'Failed to load availability');
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedId, date]);

  const filtered = consultants.filter((c) => {
    const mQ = (c.name || '').toLowerCase().includes(query.toLowerCase());
    const mS = !specialty || (c.biography || '').toLowerCase().includes(specialty.toLowerCase());
    return mQ && mS;
  });

  const selected = consultants.find((c) => c.consultantId === selectedId) || null;

  // Scroll the wizard back to the step indicator whenever the step changes
  // (skipped on initial mount) so each step starts at the top.
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    const el = stepsRef.current;
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [step]);

  const handleSelect = (id) => {
    setSelectedId(id);
    setDate('');
    setSlot('');
    setStep(2);
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));
  const goNext = () => setStep((s) => Math.min(3, s + 1));

  const handleConfirm = async () => {
    if (!selected || !date || !slot) return;
    // Synchronous duplicate-submission guard: a second click (double-click,
    // stale render) can never fire a second network request.
    if (submittingRef.current || bookedRef.current) return;
    submittingRef.current = true;
    setBooking(true);
    try {
      const created = await appointmentService.book({
        consultantId: selected.consultantId,
        appointmentDate: date,
        appointmentTime: slot,
      });
      bookedRef.current = true;
      setBooked(true);
      setBookedAppointmentId(created?.appointmentId ?? null);
      setShowConfirm(true);
    } catch (err) {
      if (err.status === 409 || (err.message && /already|conflict|taken/i.test(err.message))) {
        addToast({
          type: 'error',
          title: 'Slot no longer available',
          message: 'This time slot was just booked by someone else. Please choose a different time.',
        });
        // Return to the date & time step with the slot cleared; the date
        // and consultant selection are preserved for a quick re-pick.
        setSlot('');
        setStep(2);
      } else if (!err.status || err.status === 0) {
        addToast({
          type: 'error',
          title: 'Network error',
          message: 'Unable to reach the server. Check your connection and try again.',
        });
      } else {
        addToast({ type: 'error', title: 'Booking failed', message: err.message });
      }
    } finally {
      submittingRef.current = false;
      setBooking(false);
    }
  };

  // X / overlay / Escape: the booking is already complete, so the wizard
  // resets to a clean Step 1 — a stale, resubmittable Step 3 is unreachable.
  const handleCloseModal = () => {
    setShowConfirm(false);
    setSelectedId(null);
    setDate('');
    setSlot('');
    setStep(1);
    setBooked(false);
    setBookedAppointmentId(null);
    bookedRef.current = false;
  };

  const handleReturnToDashboard = () => navigate('/patient/dashboard');
  const handleViewAppointment = () =>
    navigate(`/patient/appointments/${bookedAppointmentId}`);

  const isAM = (t) => /AM\s*$/i.test(t);
  const morningSlots = slots.filter((s) => isAM(s.time));
  const afternoonSlots = slots.filter((s) => !isAM(s.time));

  const step1Blocked = !selected;
  const step2Blocked = !date || !slot;

  const renderSlotGroup = (periodTitle, slots, groupLabel) => (
    <div className="book__period-group">
      <span className="book__period-title">{periodTitle}</span>
      <div
        className="book__slots-grid"
        role="radiogroup"
        aria-label={groupLabel}
      >
        {slots.map(({ time, available }) => (
          <button
            key={time}
            type="button"
            className={`book__slot${slot === time ? ' book__slot--active' : ''}`}
            onClick={() => available && setSlot(time)}
            disabled={!available}
            aria-pressed={slot === time}
            aria-disabled={!available}
            role="radio"
            aria-checked={slot === time}
          >
            <span className="book__slot-time">{time}</span>
            {!available && <span className="book__slot-status">Booked</span>}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="book">
      <h1 className="page-title">Book Appointment</h1>
      {/* 1. Step Indicator Bar — completed steps link back without resetting.
          While the confirmation modal is open (booked), the whole wizard is
          inert: no pointer or keyboard interaction underneath the modal. */}
      <div className="book__steps-wrapper" ref={stepsRef} inert={booked}>
        <div className="book__steps" aria-label="Booking progress">
          {STEP_LABELS.map((label, i) => {
            const s = i + 1;
            const isDone = s < step;
            const isActive = s === step;
            const inner = (
              <>
                <span className="book__step-circle">
                  {isDone ? <Check aria-hidden="true" /> : s}
                </span>
                <span className="book__step-label">{`${s}. ${label}`}</span>
              </>
            );
            if (isDone) {
              return (
                <button
                  key={label}
                  type="button"
                  className="book__step book__step--done book__step--link"
                  onClick={() => setStep(s)}
                  disabled={booked}
                  aria-label={`Back to step ${s}: ${label}`}
                >
                  {inner}
                </button>
              );
            }
            return (
              <div
                key={label}
                className={`book__step${isActive ? ' book__step--active' : ''}`}
                aria-current={isActive ? 'step' : undefined}
              >
                {inner}
              </div>
            );
          })}
        </div>
      </div>

      {/* ============ STEP 1: SELECT SPECIALIST ============ */}
      {step === 1 && (
        <section className="book__step-panel" aria-label="Step 1 of 3: Select Specialist">
          {/* Search & Filter Bar with Quick Pills */}
          <div className="book__filters-card">
            <div className="book__filters-row">
              <div className="book__search">
                <Input
                  id={searchId}
                  leftIcon={Search}
                  placeholder="Search consultants by name..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search consultants"
                />
              </div>
              <div className="book__specialty">
                <Select
                  options={SPECIALTY_OPTIONS}
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  aria-label="Filter by specialty"
                />
              </div>
            </div>

            {/* Quick Filter Specialty Pills */}
            <div className="book__filter-pills" role="group" aria-label="Quick specialty filters">
              <span className="book__filter-pills-label">
                <Filter className="book__filter-icon" aria-hidden="true" /> Filter by:
              </span>
              {QUICK_FILTER_PILLS.map((p) => {
                const val = p === 'All' ? '' : p;
                const isSelected = specialty === val;
                return (
                  <button
                    key={p}
                    type="button"
                    className={`book__filter-pill${isSelected ? ' book__filter-pill--active' : ''}`}
                    onClick={() => setSpecialty(val)}
                    aria-pressed={isSelected}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Consultant Grid with Tags & Availability */}
          <section className="book__consultants-section" aria-label="Available Consultants">
            <div className="book__section-header">
              <h2 className="book__section-title">Choose a Specialist</h2>
              <span className="book__section-count">
                {filtered.length} {filtered.length === 1 ? 'specialist' : 'specialists'} available
              </span>
            </div>

            <div className="book__grid">
              {filtered.map((c) => {
                const isSelected = selectedId === c.consultantId;
                const tags = extractSpecialties(c.biography);
                const availabilityText = c.earliestAvailability || c.nextAvailable || 'Open Schedule';

                return (
                  <Card
                    key={c.consultantId}
                    hover
                    className={`book__consultant${isSelected ? ' book__consultant--selected' : ''}`}
                    onClick={() => handleSelect(c.consultantId)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelect(c.consultantId);
                      }
                    }}
                  >
                    <div className="book__consultant-top">
                      <Avatar name={c.name} src={c.avatarUrl} size="md" />
                      <div className="book__consultant-badges">
                        {c.isVerified && (
                          <span className="book__verified">
                            <BadgeCheck aria-hidden="true" /> Verified
                          </span>
                        )}
                        <Badge variant="success">
                          <Star className="book__star" aria-hidden="true" />
                          {(Number(c.rating) || 0).toFixed(1)}
                        </Badge>
                      </div>
                    </div>

                    <div className="book__consultant-body">
                      <p className="book__consultant-name">{c.name}</p>
                      <p className="book__consultant-bio">
                        {c.biography ? c.biography.slice(0, 110) + '...' : 'Licensed mental health consultant.'}
                      </p>

                      {/* Specialty Tags */}
                      <div className="book__consultant-tags" aria-label="Specialties">
                        {tags.map((t) => (
                          <Badge key={t} variant="accent" className="book__tag-badge">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="book__consultant-foot">
                      <span className="book__avail-indicator">
                        <Calendar className="book__avail-icon" aria-hidden="true" />
                        <span>{availabilityText}</span>
                      </span>

                      {isSelected ? (
                        <span className="book__selected-tag">
                          <UserCheck aria-hidden="true" /> Selected
                        </span>
                      ) : (
                        <span className="book__select-prompt">
                          Select <ChevronRight aria-hidden="true" />
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}

              {filtered.length === 0 && !loading && (
                <div className="book__empty-card">
                  <p className="book__empty">No consultants match your search criteria.</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setQuery('');
                      setSpecialty('');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Step 1 footer navigation */}
          <div className="book__step-footer">
            {step1Blocked ? (
              <span className="book__step-hint">Select a specialist to continue</span>
            ) : (
              <span className="book__step-hint book__step-hint--done">
                <Check aria-hidden="true" /> {selected.name} selected
              </span>
            )}
            <div className="book__step-actions">
              <Button
                variant="primary"
                onClick={goNext}
                disabled={step1Blocked}
                rightIcon={ChevronRight}
              >
                Next
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ============ STEP 2: PICK DATE & TIME ============ */}
      {step === 2 && selected && (
        <section className="book__step-panel" aria-label="Step 2 of 3: Pick Date and Time">
          <div className="book__section-header">
            <h2 className="book__section-title">Pick a Date & Time</h2>
            <span className="book__section-count">All times shown in your local timezone</span>
          </div>

          <Card className="book__schedule-card">
            {/* Compact summary of the Step 1 choice */}
            <div className="book__context-chip">
              <Avatar name={selected.name} src={selected.avatarUrl} size="sm" />
              <div className="book__context-meta">
                <span className="book__context-name">{selected.name}</span>
                <span className="book__context-sub">
                  {selected.isVerified ? (
                    <>
                      <BadgeCheck className="book__context-verified" aria-hidden="true" /> Verified
                      &bull;{' '}
                    </>
                  ) : null}
                  1-on-1 Secure Video Session
                </span>
              </div>
              <button
                type="button"
                className="book__context-change"
                onClick={() => setStep(1)}
              >
                Change
              </button>
            </div>

            <div className="book__schedule-body">
              <div className="book__date-picker">
                <Input
                  label="Select Date"
                  type="date"
                  min={today}
                  leftIcon={Calendar}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setSlot('');
                  }}
                  helperText="Select any upcoming weekday or weekend"
                />
              </div>

              {date && (
                <div className="book__slots-wrapper">
                  <div className="book__slots-header">
                    <Clock className="book__slots-header-icon" aria-hidden="true" />
                    <span className="book__slots-header-title">
                      Available Time Slots for {formatDateDisplay(date)}
                    </span>
                  </div>

                  {slotsLoading ? (
                    <p className="book__slots-empty">Checking availability…</p>
                  ) : slotsError ? (
                    <div className="book__slots-empty">
                      <p>{slotsError}</p>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setDate('')}
                      >
                        Pick another date
                      </Button>
                    </div>
                  ) : slots.length === 0 ? (
                    <p className="book__slots-empty">
                      No available times on this date. Try another day.
                    </p>
                  ) : (
                    <div className="book__slots-container">
                      {/* Morning Cluster */}
                      {morningSlots.length > 0 &&
                        renderSlotGroup('Morning Sessions', morningSlots, 'Morning time slots')}

                      {/* Afternoon Cluster */}
                      {afternoonSlots.length > 0 &&
                        renderSlotGroup('Afternoon Sessions', afternoonSlots, 'Afternoon time slots')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Step 2 footer navigation */}
          <div className="book__step-footer">
            {step2Blocked ? (
              <span className="book__step-hint">Choose a date and an available time to continue</span>
            ) : (
              <span className="book__step-hint book__step-hint--done">
                <Check aria-hidden="true" /> {formatDateDisplay(date)} at {slot}
              </span>
            )}
            <div className="book__step-actions">
              <Button variant="secondary" onClick={goBack} leftIcon={ChevronLeft}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={goNext}
                disabled={step2Blocked}
                rightIcon={ChevronRight}
              >
                Next
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* ============ STEP 3: CONFIRM BOOKING ============ */}
      {step === 3 && selected && date && slot && (
        <section className="book__step-panel" aria-label="Step 3 of 3: Confirm Booking" inert={booked}>
          <div className="book__section-header">
            <h2 className="book__section-title">Review & Confirm</h2>
            <span className="book__section-count">Step 3 of 3</span>
          </div>

          <Card className="book__review-card">
            <div className="book__review-list">
              <div className="book__confirm-row book__review-row--consultant">
                <span className="book__confirm-key">Consultant</span>
                <span className="book__review-consultant">
                  <Avatar name={selected.name} src={selected.avatarUrl} size="sm" />
                  <span className="book__confirm-val">{selected.name}</span>
                </span>
              </div>
              <div className="book__confirm-row">
                <span className="book__confirm-key">Date</span>
                <span className="book__confirm-val">{formatDateDisplay(date)}</span>
              </div>
              <div className="book__confirm-row">
                <span className="book__confirm-key">Time</span>
                <span className="book__confirm-val">{slot}</span>
              </div>
              <div className="book__confirm-row">
                <span className="book__confirm-key">Session Format</span>
                <span className="book__confirm-val">1-on-1 Secure Video</span>
              </div>
            </div>

            <div className="book__schedule-summary-callout">
              <Video className="book__callout-icon" aria-hidden="true" />
              <span>
                Your consultation will be held via secure video call on {formatDateDisplay(date)} at {slot}.
              </span>
            </div>
          </Card>

          {/* Step 3 footer navigation */}
          <div className="book__step-footer">
            <span className="book__step-hint">
              {booked
                ? 'Appointment reserved — see the confirmation for details'
                : 'Please review your details before reserving'}
            </span>
            <div className="book__step-actions">
              <Button variant="secondary" onClick={goBack} leftIcon={ChevronLeft} disabled={booked}>
                Back
              </Button>
              <Button
                variant="primary"
                size="lg"
                loading={booking}
                disabled={!selected || !date || !slot || booked}
                onClick={handleConfirm}
                className="book__confirm-btn"
              >
                Confirm & Reserve Appointment
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Success Modal */}
      <Modal isOpen={showConfirm} onClose={handleCloseModal} title="Appointment Confirmed">
        <div className="book__confirm">
          <div className="book__confirm-icon">
            <Check aria-hidden="true" />
          </div>
          <p className="book__confirm-lead">Your appointment is booked!</p>
          <p className="book__confirm-sub">
            A confirmation has been sent to your account. You can join the session directly from your dashboard.
          </p>

          {selected && (
            <div className="book__confirm-details">
              <div className="book__confirm-row">
                <span className="book__confirm-key">Consultant</span>
                <span className="book__confirm-val">{selected.name}</span>
              </div>
              <div className="book__confirm-row">
                <span className="book__confirm-key">Date</span>
                <span className="book__confirm-val">{formatDateDisplay(date)}</span>
              </div>
              <div className="book__confirm-row">
                <span className="book__confirm-key">Time</span>
                <span className="book__confirm-val">{slot}</span>
              </div>
              <div className="book__confirm-row">
                <span className="book__confirm-key">Session Format</span>
                <span className="book__confirm-val">1-on-1 Secure Video</span>
              </div>
            </div>
          )}

          <div className="book__modal-actions">
            {bookedAppointmentId != null && (
              <Button
                variant="secondary"
                size="lg"
                leftIcon={CalendarCheck}
                onClick={handleViewAppointment}
              >
                View Appointment
              </Button>
            )}
            <Button variant="primary" size="lg" onClick={handleReturnToDashboard} className="book__modal-done-btn">
              Return to Dashboard
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
