import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Plus,
  ArrowLeft,
  FileText,
  TrendingUp,
  Check,
  Edit3,
  Calendar,
  Clock,
  MessageSquareQuote,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Textarea from '../../components/ui/Textarea';
import Pagination from '../../components/ui/Pagination';
import useToast from '../../components/ui/useToast';
import { progressService } from '../../services/progressService';
import { appointmentService } from '../../services/appointmentService';
import { sessionSummaryService } from '../../services/sessionSummaryService';
import './PatientProgress.css';

const METRICS = [
  { key: 'anxietyScore', label: 'Anxiety' },
  { key: 'depressionScore', label: 'Depression' },
  { key: 'overthinkingScore', label: 'Overthinking' },
  { key: 'overallScore', label: 'Overall' },
];

function getTone(score) {
  if (score >= 80) return 'success';
  if (score >= 50) return 'warning';
  return 'error';
}

function getToneColor(tone) {
  if (tone === 'success') return 'var(--color-success)';
  if (tone === 'warning') return 'var(--color-warning)';
  return 'var(--color-destructive)';
}

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

export default function PatientProgressPage() {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('summaries'); // 'summaries' | 'logs'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 3;

  // Session Summary Composer state
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [summaryForm, setSummaryForm] = useState({
    focus: '',
    takeaways: '',
    nextSteps: '',
  });
  const [summaryErrors, setSummaryErrors] = useState({});
  const [savingSummary, setSavingSummary] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [logsData, apptData] = await Promise.all([
        progressService.getByPatient(patientId).catch(() => []),
        appointmentService.list().catch(() => []),
      ]);

      setLogs(Array.isArray(logsData) ? logsData : []);

      // Filter appointments for this patient, then hydrate each with its
      // real session summary (if one has been recorded).
      const allAppts = Array.isArray(apptData) ? apptData : [];
      const patientAppts = allAppts.filter(
        (a) => String(a.patientId) === String(patientId)
      );

      const enriched = await Promise.all(
        patientAppts.map(async (appt) => {
          const summary = await sessionSummaryService
            .getByAppointment(appt.appointmentId)
            .catch(() => null);
          return { ...appt, summary };
        })
      );

      setSessions(enriched);
    } catch (err) {
      setError(err.message || 'Failed to load patient records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [patientId]);

  useEffect(() => {
    if (location.state?.toast) {
      addToast(location.state.toast);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, addToast]);

  const handleStartCompose = (session) => {
    setEditingSessionId(session.appointmentId);
    if (session.summary) {
      setSummaryForm({
        focus: session.summary.focus || '',
        takeaways: session.summary.takeaways || '',
        nextSteps: session.summary.nextSteps || '',
      });
    } else {
      setSummaryForm({
        focus: '',
        takeaways: '',
        nextSteps: '',
      });
    }
    setSummaryErrors({});
  };

  const handleCancelCompose = () => {
    setEditingSessionId(null);
    setSummaryForm({ focus: '', takeaways: '', nextSteps: '' });
    setSummaryErrors({});
  };

  const handleSaveSummary = async (sessionId) => {
    const errs = {};
    if (!summaryForm.focus.trim()) {
      errs.focus = 'Please provide the clinical focus and discussion summary';
    }
    if (Object.keys(errs).length > 0) {
      setSummaryErrors(errs);
      return;
    }

    setSavingSummary(true);
    try {
      const saved = await sessionSummaryService.save(sessionId, {
        focus: summaryForm.focus.trim(),
        takeaways: summaryForm.takeaways.trim(),
        nextSteps: summaryForm.nextSteps.trim(),
      });

      setSessions((prev) =>
        prev.map((s) =>
          s.appointmentId === sessionId ? { ...s, summary: saved } : s
        )
      );

      setEditingSessionId(null);
      setSummaryErrors({});
      addToast({
        type: 'success',
        title: 'Summary Published',
        message: 'Session summary saved and published to patient medical record.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Save failed',
        message: err.message || 'Unable to save session summary',
      });
    } finally {
      setSavingSummary(false);
    }
  };

  const totalPages = Math.ceil(logs.length / PAGE_SIZE) || 1;
  const paginatedLogs = logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const summariesAddedCount = sessions.filter((s) => s.summary).length;

  return (
    <div className="con-prog">
      {/* Back Link */}
      <Link to="/consultant/patients" className="con-prog__back">
        <ArrowLeft aria-hidden="true" /> Back to Patient Roster
      </Link>

      {/* Patient Profile Header Card */}
      <Card className="con-prog__summary">
        <div className="con-prog__summary-top">
          <Avatar name={`Patient ${patientId}`} size="lg" className="con-prog__avatar" />
          <div>
            <h1 className="con-prog__summary-name">Patient #{patientId}</h1>
            <p className="con-prog__summary-email">Clinical Record & Treatment History</p>
          </div>
        </div>

        <div className="con-prog__summary-meta">
          <div className="con-prog__meta-item">
            <span className="con-prog__meta-label">Total Sessions</span>
            <span className="con-prog__meta-value">{sessions.length}</span>
          </div>
          <div className="con-prog__meta-item">
            <span className="con-prog__meta-label">Summaries Added</span>
            <span className="con-prog__meta-value">
              {summariesAddedCount} / {completedSessions.length || 1}
            </span>
          </div>
          <div className="con-prog__meta-item">
            <span className="con-prog__meta-label">Progress Logs</span>
            <span className="con-prog__meta-value">{logs.length}</span>
          </div>
        </div>
      </Card>

      {/* View Segment Tabs */}
      <div className="con-prog__tabs" role="tablist" aria-label="Patient record sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'summaries'}
          className={`con-prog__tab${activeTab === 'summaries' ? ' con-prog__tab--active' : ''}`}
          onClick={() => setActiveTab('summaries')}
        >
          <FileText className="con-prog__tab-icon" aria-hidden="true" />
          <span>Session Summaries ({sessions.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'logs'}
          className={`con-prog__tab${activeTab === 'logs' ? ' con-prog__tab--active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <TrendingUp className="con-prog__tab-icon" aria-hidden="true" />
          <span>Progress Logs ({logs.length})</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: CLINICAL SESSION SUMMARIES & INLINE COMPOSER
          ========================================================================= */}
      {activeTab === 'summaries' && (
        <section className="con-prog__section" aria-label="Session Summaries">
          <div className="con-prog__toolbar">
            <div>
              <h2 className="con-prog__section-title">Clinical Session Summaries</h2>
              <p className="con-prog__section-sub">
                Record post-session clinical notes, coping strategies, and follow-up plans visible to the patient.
              </p>
            </div>
          </div>

          {loading && <p className="con-prog__empty">Loading session records...</p>}

          {!loading && error && (
            <div className="con-prog__state">
              <p className="con-prog__state-text">Couldn&rsquo;t load session history.</p>
              <Button variant="secondary" onClick={fetchData}>
                Retry
              </Button>
            </div>
          )}

          {!loading && !error && sessions.length === 0 && (
            <div className="con-prog__state">
              <p className="con-prog__state-text">
                No completed sessions found for this patient yet. Summaries can be added after holding a consultation.
              </p>
            </div>
          )}

          {!loading && !error && sessions.length > 0 && (
            <div className="con-summary__list">
              {sessions.map((session) => {
                const isEditing = editingSessionId === session.appointmentId;
                const hasSummary = Boolean(session.summary);

                return (
                  <Card key={session.appointmentId} className="con-summary__card">
                    {/* Session Row Header */}
                    <div className="con-summary__card-head">
                      <div className="con-summary__session-meta">
                        <div className="con-summary__date-chip">
                          <Calendar className="con-summary__date-icon" aria-hidden="true" />
                          <span className="con-summary__date-val">
                            {formatDateDisplay(session.appointmentDate)}
                          </span>
                        </div>
                        <div className="con-summary__time-chip">
                          <Clock className="con-summary__date-icon" aria-hidden="true" />
                          <span>{session.appointmentTime}</span>
                        </div>
                        <span className="con-summary__id-tag">Session #{session.appointmentId}</span>
                      </div>

                      {/* Status Indicator Badges */}
                      <div className="con-summary__status-wrap">
                        {hasSummary ? (
                          <Badge variant="success" className="con-summary__badge">
                            <Check className="con-summary__badge-icon" aria-hidden="true" />
                            <span>Summary Added</span>
                          </Badge>
                        ) : (
                          <Badge variant="default" className="con-summary__badge con-summary__badge--neutral">
                            <span>No Summary Added</span>
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Content View or Inline Expand Composer */}
                    {!isEditing ? (
                      <div className="con-summary__content-preview">
                        {hasSummary ? (
                          <div className="con-summary__preview-blocks">
                            <div className="con-summary__block">
                              <span className="con-summary__block-label">
                                <MessageSquareQuote className="con-summary__block-icon" aria-hidden="true" />
                                Session Focus & Clinical Discussion:
                              </span>
                              <p className="con-summary__block-body">{session.summary.focus}</p>
                            </div>

                            {session.summary.takeaways && (
                              <div className="con-summary__block">
                                <span className="con-summary__block-label">
                                  <Sparkles className="con-summary__block-icon" aria-hidden="true" />
                                  Key Coping Strategies & Takeaways:
                                </span>
                                <p className="con-summary__block-body con-summary__block-body--multiline">
                                  {session.summary.takeaways}
                                </p>
                              </div>
                            )}

                            {session.summary.nextSteps && (
                              <div className="con-summary__block">
                                <span className="con-summary__block-label">
                                  <RotateCcw className="con-summary__block-icon" aria-hidden="true" />
                                  Recommended Next Steps:
                                </span>
                                <p className="con-summary__block-body">{session.summary.nextSteps}</p>
                              </div>
                            )}

                            <div className="con-summary__actions">
                              <Button
                                variant="secondary"
                                size="sm"
                                leftIcon={Edit3}
                                onClick={() => handleStartCompose(session)}
                              >
                                Edit Summary
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="con-summary__empty-block">
                            <p className="con-summary__empty-note">
                              No clinical summary recorded for this session yet. You can add notes, key takeaways, and
                              recommended action plans at any time.
                            </p>
                            <Button
                              variant="primary"
                              size="sm"
                              leftIcon={Plus}
                              onClick={() => handleStartCompose(session)}
                            >
                              Write Session Summary
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* ========================================
                         INLINE COMPOSER PANEL
                         ======================================== */
                      <div className="con-summary__composer-panel">
                        <div className="con-summary__composer-header">
                          <h3 className="con-summary__composer-title">
                            {hasSummary ? 'Edit Clinical Summary' : 'Write Clinical Session Summary'}
                          </h3>
                          <p className="con-summary__composer-sub">
                            This summary will be visible to Patient #{patientId} in their session detail view.
                          </p>
                        </div>

                        <div className="con-summary__form">
                          <Textarea
                            label="Session Focus & Exploration"
                            placeholder="Describe the clinical topics covered, cognitive patterns explored, or acute triggers addressed..."
                            rows={4}
                            value={summaryForm.focus}
                            onChange={(e) =>
                              setSummaryForm((prev) => ({ ...prev, focus: e.target.value }))
                            }
                            error={summaryErrors.focus}
                            helperText="High-level overview of therapeutic discussion"
                          />

                          <Textarea
                            label="Key Coping Strategies & Takeaways"
                            placeholder="List specific coping tools, mindfulness exercises, or cognitive reframing practices (e.g. 4-7-8 breathing, daily thought journaling)..."
                            rows={3}
                            value={summaryForm.takeaways}
                            onChange={(e) =>
                              setSummaryForm((prev) => ({ ...prev, takeaways: e.target.value }))
                            }
                            helperText="Actionable strategies the patient can practice between sessions"
                          />

                          <Textarea
                            label="Recommended Next Steps & Follow-Up Plan"
                            placeholder="e.g. Continue evening wind-down routine; schedule follow-up session in 2 weeks..."
                            rows={2}
                            value={summaryForm.nextSteps}
                            onChange={(e) =>
                              setSummaryForm((prev) => ({ ...prev, nextSteps: e.target.value }))
                            }
                            helperText="Recommended homework or follow-up schedule"
                          />

                          <div className="con-summary__composer-actions">
                            <Button
                              variant="ghost"
                              onClick={handleCancelCompose}
                              disabled={savingSummary}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="primary"
                              loading={savingSummary}
                              onClick={() => handleSaveSummary(session.appointmentId)}
                            >
                              {hasSummary ? 'Update Summary' : 'Save & Publish Summary'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          TAB 2: PROGRESS LOGS
          ========================================================================= */}
      {activeTab === 'logs' && (
        <section className="con-prog__section" aria-label="Progress Logs">
          <div className="con-prog__toolbar">
            <div>
              <h2 className="con-prog__section-title">Progress History</h2>
              <p className="con-prog__section-sub">
                Historical scores recorded across clinical anxiety, depression, and wellbeing metrics.
              </p>
            </div>
            <Button
              variant="primary"
              leftIcon={Plus}
              onClick={() => navigate(`/consultant/patients/${patientId}/progress/new`)}
            >
              Add Log Entry
            </Button>
          </div>

          {/* --- loading --- */}
          {loading && <p className="con-prog__empty">Loading progress data...</p>}

          {/* --- error --- */}
          {!loading && error && (
            <div className="con-prog__state">
              <p className="con-prog__state-text">Couldn&rsquo;t load progress logs.</p>
              <Button variant="secondary" onClick={fetchData}>
                Retry
              </Button>
            </div>
          )}

          {/* --- empty --- */}
          {!loading && !error && logs.length === 0 && (
            <div className="con-prog__state">
              <p className="con-prog__state-text">
                No progress logs recorded yet. Add an entry to begin tracking clinical metrics.
              </p>
            </div>
          )}

          {/* --- data --- */}
          {!loading && !error && logs.length > 0 && (
            <>
              <div className="con-prog__logs">
                {paginatedLogs.map((log) => {
                  const scores = METRICS.map(({ key, label }) => {
                    const raw = log[key] ?? 0;
                    const val = Number(raw) || 0;
                    return {
                      key,
                      label,
                      value: val,
                      tone: getTone(val),
                      color: getToneColor(getTone(val)),
                    };
                  });
                  const summaryText = scores.map((s) => `${s.label}: ${s.value}%`).join(', ');

                  return (
                    <Card
                      key={log.progressId || log.id || log.createdAt}
                      className="con-prog__log"
                    >
                      <div className="con-prog__log-head">
                        <span className="con-prog__log-date">
                          {log.createdAt
                            ? new Date(log.createdAt).toLocaleDateString()
                            : 'Unknown date'}
                        </span>
                      </div>

                      <div
                        className="con-prog__bars"
                        role="list"
                        aria-label={`Progress scores for ${
                          log.createdAt
                            ? new Date(log.createdAt).toLocaleDateString()
                            : 'this entry'
                        }`}
                      >
                        {scores.map(({ key, label, value, color }) => (
                          <div key={key} className="con-prog__bar-item" role="listitem">
                            <div className="con-prog__bar-label-row">
                              <span className="con-prog__bar-label">{label}</span>
                              <span className="con-prog__bar-score">{value}%</span>
                            </div>
                            <div
                              className="con-prog__bar-track"
                              role="progressbar"
                              aria-valuenow={value}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`${label}: ${value} out of 100`}
                            >
                              <div
                                className="con-prog__bar-fill"
                                style={{ width: `${value}%`, backgroundColor: color }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <p className="con-prog__bar-summary" aria-hidden="true">
                        {summaryText}
                      </p>

                      {log.note && <p className="con-prog__log-note">{log.note}</p>}
                    </Card>
                  );
                })}
              </div>

              <Card style={{ overflow: 'hidden' }}>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={logs.length}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPage}
                />
              </Card>
            </>
          )}
        </section>
      )}
    </div>
  );
}
