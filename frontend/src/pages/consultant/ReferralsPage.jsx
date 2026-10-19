import { useState, useEffect } from 'react';
import {
  Search,
  ArrowRight,
  Building2,
  MapPin,
  CheckCircle,
  AlertCircle,
  XCircle,
  UserCheck,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Pagination from '../../components/ui/Pagination';
import useToast from '../../components/ui/useToast';
import { referralService } from '../../services/referralService';
import { appointmentService } from '../../services/appointmentService';
import './Referrals.css';

const STATUS_MAP = {
  pending:  { variant: 'warning', icon: AlertCircle,  label: 'Pending' },
  accepted: { variant: 'success', icon: CheckCircle,   label: 'Accepted' },
  declined: { variant: 'error',   icon: XCircle,       label: 'Declined' },
};

export default function ReferralsPage() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [directory, setDirectory] = useState([]);
  const [pastReferrals, setPastReferrals] = useState([]);
  const [patients, setPatients] = useState([]);
  const [query, setQuery] = useState('');
  const [dirPage, setDirPage] = useState(1);
  const DIR_PAGE_SIZE = 4;

  // Per-card refer flow: the target is known from the clicked directory card,
  // so the modal only gathers the patient + case note.
  const [referTarget, setReferTarget] = useState(null);
  const [referForm, setReferForm] = useState({ patientId: '', note: '' });
  const [referErrors, setReferErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadDirectory = async () => {
      try {
        const hospitals = await referralService.getDirectory();
        const psychResults = await Promise.all(
          (hospitals || []).map(async (h) => {
            const psychiatrists = await referralService.getPsychiatrists(h.hospitalId);
            return (psychiatrists || []).map((p) => ({
              id: p.psychiatristId, name: p.psychiatristName,
              hospital: h.hospitalName, city: h.city, specialty: 'General',
            }));
          })
        );
        if (!cancelled) setDirectory(psychResults.flat());
      } catch (err) {
        if (!cancelled) addToast({ type: 'error', title: 'Failed to load directory', message: err.message });
      }
    };

    const loadReferrals = async () => {
      try {
        const data = await referralService.list();
        if (!cancelled) setPastReferrals(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) addToast({ type: 'error', title: 'Failed to load referrals', message: err.message });
      }
    };

    // The consultant's own patients — the people they can actually refer.
    const loadPatients = async () => {
      try {
        const data = await appointmentService.list();
        const apps = Array.isArray(data) ? data : [];
        const seen = new Map();
        apps.forEach((a) => {
          if (a.patientId != null && !seen.has(a.patientId)) {
            seen.set(a.patientId, {
              patientId: a.patientId,
              name: a.patientName || `Patient #${a.patientId}`,
            });
          }
        });
        if (!cancelled) setPatients(Array.from(seen.values()));
      } catch {
        // Non-fatal: the Refer modal will simply offer no patients.
      }
    };

    Promise.all([loadDirectory(), loadReferrals(), loadPatients()]).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [addToast]);

  const filtered = directory.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase()) ||
    d.hospital.toLowerCase().includes(query.toLowerCase()) ||
    (d.city || '').toLowerCase().includes(query.toLowerCase()) ||
    (d.specialty || '').toLowerCase().includes(query.toLowerCase())
  );

  const dirTotalPages = Math.ceil(filtered.length / DIR_PAGE_SIZE) || 1;
  const paginatedDir = filtered.slice((dirPage - 1) * DIR_PAGE_SIZE, dirPage * DIR_PAGE_SIZE);

  const openRefer = (entry) => {
    setReferTarget(entry);
    setReferForm({ patientId: '', note: '' });
    setReferErrors({});
  };

  const closeRefer = () => {
    setReferTarget(null);
    setReferErrors({});
  };

  const handleReferField = (field) => (e) => {
    setReferForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (referErrors[field]) {
      setReferErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleReferSubmit = async (e) => {
    e.preventDefault();
    if (!referTarget) return;

    const errs = {};
    if (!referForm.patientId) errs.patientId = 'Select a patient';
    if (!referForm.note.trim()) errs.note = 'Add case notes explaining the referral reason';
    if (Object.keys(errs).length > 0) {
      setReferErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      await referralService.create({
        patientId: referForm.patientId,
        caseOfReferral: referForm.note.trim(),
        referToPsychiatristId: referTarget.id,
      });
      setReferTarget(null);
      setReferForm({ patientId: '', note: '' });
      addToast({
        type: 'success',
        title: 'Referral sent',
        message: `The referral to ${referTarget.name} has been submitted successfully.`,
      });
      // Refresh so the new referral lands in Past Referrals immediately.
      try {
        const data = await referralService.list();
        setPastReferrals(Array.isArray(data) ? data : []);
      } catch { /* list refresh is best-effort */ }
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to send referral', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="referrals">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
          <p style={{ color: 'var(--color-muted-foreground)' }}>Loading directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="referrals">
      <Card className="referrals__card" style={{ overflow: 'hidden' }}>
        <div className="referrals__section-head">
          <h1 className="referrals__section-title"><Building2 aria-hidden="true" /> Consultant & Hospital Directory</h1>
        </div>

        <div className="referrals__search">
          <Input leftIcon={Search} placeholder="Search by name, hospital, city, or specialty..." value={query} onChange={(e) => { setQuery(e.target.value); setDirPage(1); }} aria-label="Search directory" />
        </div>

        <div className="referrals__directory">
          {paginatedDir.map((d) => (
            <Card key={d.id} className="referrals__dir-item">
              <div className="referrals__dir-top">
                <Avatar name={d.name} size="md" />
                <div>
                  <p className="referrals__dir-name">{d.name}</p>
                  <Badge variant="default">{d.specialty}</Badge>
                </div>
              </div>
              <div className="referrals__dir-meta">
                <span className="referrals__dir-hospital"><Building2 aria-hidden="true" /> {d.hospital}</span>
                <span className="referrals__dir-city"><MapPin aria-hidden="true" /> {d.city}</span>
              </div>
              <div className="referrals__dir-actions">
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={UserCheck}
                  onClick={() => openRefer(d)}
                >
                  Refer
                </Button>
              </div>
            </Card>
          ))}
          {filtered.length === 0 && <p className="referrals__empty">No consultants match your search.</p>}
        </div>

        <Pagination
          currentPage={dirPage}
          totalPages={dirTotalPages}
          totalItems={filtered.length}
          pageSize={DIR_PAGE_SIZE}
          onPageChange={setDirPage}
        />
      </Card>

      <Card className="referrals__card">
        <div className="referrals__section-head">
          <h2 className="referrals__section-title"><ArrowRight aria-hidden="true" /> Past Referrals</h2>
        </div>

        {pastReferrals.length === 0 ? (
          <p className="referrals__empty">No referrals made yet.</p>
        ) : (
          <div className="referrals__past-list">
            {pastReferrals.map((r) => {
              const patientName = r.patientName || r.patient?.name || r.patient || 'Patient';
              const referredToName = r.referredToName || r.referredTo?.name || r.referredTo || 'Unknown';
              const st = STATUS_MAP[r.status] || STATUS_MAP.pending;
              const StatusIcon = st.icon;

              return (
                <div key={r.referralId || r.id} className="referrals__past-item">
                  <div className="referrals__past-main">
                    <div className="referrals__past-names">
                      <strong className="referrals__past-patient">{patientName}</strong>
                      <span className="referrals__past-to"><ArrowRight aria-hidden="true" /> {referredToName}</span>
                    </div>
                    <p className="referrals__past-note">{r.note || r.caseOfReferral}</p>
                  </div>
                  <div className="referrals__past-meta">
                    <span className="referrals__past-date">{r.date || (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '')}</span>
                    <Badge variant={st.variant}>
                      <StatusIcon aria-hidden="true" style={{ width: '0.75rem', height: '0.75rem' }} /> {st.label}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Per-card refer flow: target comes from the clicked card, so only the
          patient + case note remain — a short, contextually-scoped action. */}
      <Modal
        isOpen={!!referTarget}
        onClose={closeRefer}
        title="Refer a patient"
      >
        {referTarget && (
          <form className="referrals__refer" onSubmit={handleReferSubmit} noValidate>
            <div className="referrals__refer-summary">
              <Avatar name={referTarget.name} size="md" />
              <div>
                <p className="referrals__refer-name">{referTarget.name}</p>
                <span className="referrals__refer-where">
                  <Building2 aria-hidden="true" /> {referTarget.hospital}
                  {referTarget.city ? <> &middot; <MapPin aria-hidden="true" /> {referTarget.city}</> : null}
                </span>
              </div>
            </div>

            <Select
              label="Patient"
              options={[
                { value: '', label: 'Select a patient', disabled: true },
                ...patients.map((p) => ({ value: String(p.patientId), label: p.name })),
              ]}
              value={referForm.patientId}
              onChange={handleReferField('patientId')}
              error={referErrors.patientId}
              helperText={patients.length === 0 ? 'Patients you have seen will appear here.' : undefined}
            />
            <Textarea
              label="Case Notes"
              placeholder="Explain why this referral is being made and what the receiving psychiatrist should know..."
              rows={4}
              value={referForm.note}
              onChange={handleReferField('note')}
              error={referErrors.note}
            />

            <div className="referrals__form-actions">
              <Button variant="ghost" type="button" onClick={closeRefer}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting} disabled={submitting}>
                Send Referral
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
