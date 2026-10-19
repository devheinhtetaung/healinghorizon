import { useState, useMemo, useEffect } from 'react';
import {
  CalendarDays,
  CalendarCheck,
  CalendarX,
  CalendarPlus,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  Info,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import useToast from '../../components/ui/useToast';
import { availabilityService } from '../../services/availabilityService';
import './Availability.css';

const DAYS = [
  { index: 1, key: 'mon', label: 'Monday', short: 'Mon' },
  { index: 2, key: 'tue', label: 'Tuesday', short: 'Tue' },
  { index: 3, key: 'wed', label: 'Wednesday', short: 'Wed' },
  { index: 4, key: 'thu', label: 'Thursday', short: 'Thu' },
  { index: 5, key: 'fri', label: 'Friday', short: 'Fri' },
  { index: 6, key: 'sat', label: 'Saturday', short: 'Sat' },
  { index: 0, key: 'sun', label: 'Sunday', short: 'Sun' },
];

const DEFAULT_WEEKLY = {
  mon: { available: true, start: '09:00', end: '17:00' },
  tue: { available: true, start: '09:00', end: '17:00' },
  wed: { available: true, start: '09:00', end: '17:00' },
  thu: { available: true, start: '09:00', end: '17:00' },
  fri: { available: true, start: '09:00', end: '17:00' },
  sat: { available: false, start: '09:00', end: '13:00' },
  sun: { available: false, start: '09:00', end: '13:00' },
};

const TIME_OPTIONS = Array.from({ length: 29 }, (_, i) => {
  const minutes = i * 30;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const label = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return { value: label, label: formatTimeLabel(label) };
});

function formatTimeLabel(t) {
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const WEEKDAY_BY_KEY = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 0 };
const KEY_BY_WEEKDAY = { 0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat' };

function resolveEffective(weekly, overrides, isoDate) {
  // An explicit override wins; otherwise the recurring weekly schedule applies.
  const d = new Date(`${isoDate}T00:00:00`);
  const day = DAYS.find((x) => x.index === d.getDay());
  const override = overrides[isoDate];
  if (override) return { ...override, source: 'override' };
  const week = weekly[day.key];
  return { ...week, source: 'recurring' };
}

export default function ConsultantAvailabilityPage() {
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [weekly, setWeekly] = useState(DEFAULT_WEEKLY);
  const [overrides, setOverrides] = useState({});
  const [savedOverrides, setSavedOverrides] = useState({});
  const [monthOffset, setMonthOffset] = useState(0);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Override editor state: which date is open in the modal
  const [editingDate, setEditingDate] = useState(null);
  const [draftMode, setDraftMode] = useState('closed');
  const [draftStart, setDraftStart] = useState('09:00');
  const [draftEnd, setDraftEnd] = useState('17:00');

  // Load the consultant's saved availability (recurring + overrides).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await availabilityService.getMine();
        if (cancelled) return;

        const nextWeekly = { ...DEFAULT_WEEKLY };
        if (data?.weekly) {
          Object.entries(data.weekly).forEach(([dow, day]) => {
            const key = KEY_BY_WEEKDAY[Number(dow)];
            if (key) {
              nextWeekly[key] = {
                available: !!day.available,
                start: day.start || DEFAULT_WEEKLY[key].start,
                end: day.end || DEFAULT_WEEKLY[key].end,
              };
            }
          });
        }
        setWeekly(nextWeekly);

        const nextOverrides = {};
        if (data?.overrides) {
          Object.values(data.overrides).forEach((o) => {
            nextOverrides[o.date] = {
              available: !!o.available,
              start: o.start || null,
              end: o.end || null,
            };
          });
        }
        setOverrides(nextOverrides);
        setSavedOverrides(nextOverrides);
      } catch (err) {
        if (!cancelled) {
          addToast({ type: 'error', title: 'Failed to load availability', message: err.message });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const viewDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  }, [monthOffset]);

  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [viewDate]);

  const todayIso = toISODate(new Date());

  const openDay = (date) => {
    const iso = toISODate(date);
    const effective = resolveEffective(weekly, overrides, iso);
    setEditingDate(iso);
    if (overrides[iso]) {
      setDraftMode(overrides[iso].available ? 'open' : 'closed');
      setDraftStart(overrides[iso].start || '09:00');
      setDraftEnd(overrides[iso].end || '17:00');
    } else {
      // Default draft: offer to close a normally-open day, or open extra hours
      // on a normally-closed day — whichever is the meaningful change.
      setDraftMode(effective.available ? 'closed' : 'open');
      setDraftStart(effective.start || '09:00');
      setDraftEnd(effective.end || '17:00');
    }
  };

  const applyDay = () => {
    if (!editingDate) return;
    if (draftMode === 'open' && draftStart >= draftEnd) {
      addToast({
        type: 'error',
        title: 'Invalid time range',
        message: 'The end time must be after the start time.',
      });
      return;
    }
    setOverrides((prev) => ({
      ...prev,
      [editingDate]:
        draftMode === 'open'
          ? { available: true, start: draftStart, end: draftEnd }
          : { available: false },
    }));
    setDirty(true);
    setEditingDate(null);
  };

  const clearDay = () => {
    if (!editingDate) return;
    setOverrides((prev) => {
      const next = { ...prev };
      delete next[editingDate];
      return next;
    });
    setDirty(true);
    setEditingDate(null);
  };

  const setDay = (key, patch) => {
    setWeekly((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
    setDirty(true);
  };

  const toggleDay = (key) => {
    setDay(key, { available: !weekly[key].available });
  };

  const copyWeekdayToAll = (sourceKey) => {
    const source = weekly[sourceKey];
    setWeekly((prev) => {
      const next = { ...prev };
      DAYS.forEach(({ key }) => {
        next[key] = { ...source };
      });
      return next;
    });
    setDirty(true);
    addToast({
      type: 'info',
      title: 'Schedule copied',
      message: `${DAYS.find((d) => d.key === sourceKey).label}'s hours were copied to every day.`,
    });
  };

  // Persist the recurring schedule + date overrides to the backend.
  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Recurring weekly hours
      const days = DAYS.map(({ key }) => {
        const d = weekly[key];
        return {
          dayOfWeek: WEEKDAY_BY_KEY[key],
          available: d.available,
          start: d.available ? d.start : null,
          end: d.available ? d.end : null,
        };
      });
      await availabilityService.saveWeekly(days);

      // 2. Date overrides: upsert current + delete any that were removed
      const savedDates = new Set(Object.keys(savedOverrides));
      for (const date of Object.keys(overrides)) {
        const o = overrides[date];
        await availabilityService.upsertOverride(date, {
          available: o.available,
          start: o.available ? o.start : null,
          end: o.available ? o.end : null,
        });
      }
      for (const date of savedDates) {
        if (!overrides[date]) {
          await availabilityService.deleteOverride(date);
        }
      }

      setSavedOverrides(overrides);
      setDirty(false);
      addToast({
        type: 'success',
        title: 'Availability saved',
        message: 'Your recurring hours and date overrides are now active.',
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Save failed', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  const overrideCount = Object.keys(overrides).length;

  if (loading) {
    return (
      <div className="avail" aria-busy="true">
        <div className="avail__loading">
          <Spinner label="Loading your availability" />
        </div>
      </div>
    );
  }

  return (
    <div className="avail">
      <header className="avail__header">
        <div>
          <h1 className="avail__title">My Availability</h1>
          <p className="avail__subtitle">
            Set the hours patients can book you, and block or open specific dates.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={Check}
          loading={saving}
          disabled={saving || !dirty}
          onClick={handleSave}
        >
          {dirty ? 'Save Changes' : 'Saved'}
        </Button>
      </header>

      <div className="avail__layout">
        {/* ───────── Weekly recurring hours editor ───────── */}
        <Card className="avail__weekly" aria-label="Weekly recurring hours">
          <div className="avail__section-head">
            <h2 className="avail__section-title">
              <Clock aria-hidden="true" /> Recurring Weekly Hours
            </h2>
            <span className="avail__section-hint">Repeats every week</span>
          </div>

          <ul className="avail__week-list">
            {DAYS.map(({ key, label }) => {
              const day = weekly[key];
              const invalid = day.available && day.start >= day.end;
              return (
                <li key={key} className={`avail__week-row${day.available ? '' : ' avail__week-row--off'}`}>
                  <label className="avail__day-toggle">
                    <input
                      type="checkbox"
                      checked={day.available}
                      onChange={() => toggleDay(key)}
                      aria-label={`Available on ${label}`}
                    />
                    <span className="avail__day-cue" aria-hidden="true">
                      {day.available && <Check aria-hidden="true" />}
                    </span>
                    <span className="avail__day-name">{label}</span>
                  </label>

                  {day.available ? (
                    <div className="avail__day-range">
                      <Select
                        options={TIME_OPTIONS}
                        value={day.start}
                        onChange={(e) => setDay(key, { start: e.target.value })}
                        aria-label={`${label} start time`}
                        className="avail__time-select"
                      />
                      <span className="avail__range-sep" aria-hidden="true">–</span>
                      <Select
                        options={TIME_OPTIONS}
                        value={day.end}
                        onChange={(e) => setDay(key, { end: e.target.value })}
                        aria-label={`${label} end time`}
                        className="avail__time-select"
                      />
                      {invalid && (
                        <Badge variant="error" className="avail__range-invalid">Invalid</Badge>
                      )}
                    </div>
                  ) : (
                    <span className="avail__day-off">Unavailable</span>
                  )}

                  <button
                    type="button"
                    className="avail__day-copy"
                    onClick={() => copyWeekdayToAll(key)}
                    aria-label={`Copy ${label}'s hours to all days`}
                    title="Copy to all days"
                  >
                    <CalendarCheck aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* ───────── Date override calendar ───────── */}
        <Card className="avail__calendar" aria-label="Date-specific overrides">
          <div className="avail__section-head">
            <h2 className="avail__section-title">
              <CalendarDays aria-hidden="true" /> Date Overrides
            </h2>
            <div className="avail__cal-nav">
              <button
                type="button"
                onClick={() => setMonthOffset((m) => m - 1)}
                aria-label="Previous month"
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              <span className="avail__cal-month">
                {viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </span>
              <button
                type="button"
                onClick={() => setMonthOffset((m) => m + 1)}
                aria-label="Next month"
              >
                <ChevronRight aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="avail__cal-grid" role="grid" aria-label="Override calendar">
            {DAYS.slice(5).concat(DAYS.slice(0, 5)).map(({ short }) => (
              <span key={short} className="avail__cal-weekday" role="columnheader">
                {short}
              </span>
            ))}
            {calendarDays.map((date, i) => {
              if (!date) return <span key={`pad-${i}`} className="avail__cal-cell avail__cal-cell--pad" />;
              const iso = toISODate(date);
              const override = overrides[iso];
              const weekdayKey = DAYS.find((x) => x.index === date.getDay()).key;
              const recurring = weekly[weekdayKey];
              const isPast = iso < todayIso;

              let stateClass = 'avail__cal-cell--closed-recurring';
              let stateLabel = 'Unavailable';
              if (override) {
                if (override.available) {
                  stateClass = 'avail__cal-cell--extra-open';
                  stateLabel = 'Extra hours';
                } else {
                  stateClass = 'avail__cal-cell--blocked';
                  stateLabel = 'Blocked';
                }
              } else if (recurring.available) {
                stateClass = 'avail__cal-cell--normal';
                stateLabel = `${recurring.start}–${recurring.end}`;
              }

              return (
                <button
                  key={iso}
                  type="button"
                  className={`avail__cal-cell ${stateClass}${isPast ? ' avail__cal-cell--past' : ''}`}
                  onClick={() => !isPast && openDay(date)}
                  disabled={isPast}
                  aria-label={`${date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}: ${stateLabel}`}
                >
                  <span className="avail__cal-day">{date.getDate()}</span>
                  <span className="avail__cal-cell-mark">
                    {override
                      ? override.available
                        ? <CalendarPlus aria-hidden="true" />
                        : <CalendarX aria-hidden="true" />
                      : recurring.available
                        ? <span className="avail__cal-dot" aria-hidden="true" />
                        : null}
                  </span>
                  {override && (
                    <span className="avail__cal-cell-detail">
                      {override.available ? `${override.start}–${override.end}` : 'Blocked'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <ul className="avail__legend" aria-label="Calendar legend">
            <li><span className="avail__legend-swatch avail__legend-swatch--normal" /> Normal recurring day</li>
            <li><span className="avail__legend-swatch avail__legend-swatch--blocked" /> Overridden — blocked</li>
            <li><span className="avail__legend-swatch avail__legend-swatch--extra" /> Overridden — extra hours</li>
          </ul>

          {overrideCount > 0 && (
            <div className="avail__override-summary">
              <Info aria-hidden="true" />
              <span>
                {overrideCount} date {overrideCount === 1 ? 'override' : 'overrides'} set
                {dirty ? ' — unsaved' : ''}.
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* ───────── Override editor modal ───────── */}
      <Modal
        isOpen={!!editingDate}
        onClose={() => setEditingDate(null)}
        title={editingDate ? new Date(`${editingDate}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
      >
        {editingDate && (
          <div className="avail__editor">
            {(() => {
              const weekdayKey = DAYS.find((x) => x.index === new Date(`${editingDate}T00:00:00`).getDay()).key;
              const recurring = weekly[weekdayKey];
              return (
                <p className="avail__editor-context">
                  Normally{' '}
                  <strong>
                    {recurring.available
                      ? `available ${recurring.start}–${recurring.end} on this weekday`
                      : 'unavailable on this weekday'}
                  </strong>
                  {overrides[editingDate] ? ' — an override is already set for this date.' : '.'}
                </p>
              );
            })()}

            <div className="avail__editor-modes" role="radiogroup" aria-label="Override type">
              <button
                type="button"
                role="radio"
                aria-checked={draftMode === 'closed'}
                className={`avail__mode${draftMode === 'closed' ? ' avail__mode--active' : ''}`}
                onClick={() => setDraftMode('closed')}
              >
                <CalendarX aria-hidden="true" />
                <span className="avail__mode-title">Block entire day</span>
                <span className="avail__mode-desc">Vacation, sick day, or personal leave</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={draftMode === 'open'}
                className={`avail__mode${draftMode === 'open' ? ' avail__mode--active' : ''}`}
                onClick={() => setDraftMode('open')}
              >
                <CalendarPlus aria-hidden="true" />
                <span className="avail__mode-title">Open extra hours</span>
                <span className="avail__mode-desc">Offer availability outside normal hours</span>
              </button>
            </div>

            {draftMode === 'open' && (
              <div className="avail__editor-range">
                <Select
                  label="Start"
                  options={TIME_OPTIONS}
                  value={draftStart}
                  onChange={(e) => setDraftStart(e.target.value)}
                  aria-label="Extra hours start time"
                />
                <span className="avail__range-sep" aria-hidden="true">–</span>
                <Select
                  label="End"
                  options={TIME_OPTIONS}
                  value={draftEnd}
                  onChange={(e) => setDraftEnd(e.target.value)}
                  aria-label="Extra hours end time"
                />
              </div>
            )}

            <div className="avail__editor-actions">
              {overrides[editingDate] && (
                <Button variant="ghost" onClick={clearDay}>
                  Remove Override
                </Button>
              )}
              <Button variant="ghost" onClick={() => setEditingDate(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={applyDay}>
                Apply to This Date
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
