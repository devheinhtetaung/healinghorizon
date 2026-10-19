import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, UserCheck } from 'lucide-react';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import useToast from '../../components/ui/useToast';
import { referralService } from '../../services/referralService';
import './Referrals.css';

const STATIC_PATIENTS = [
  { id: 1, name: 'Sarah Johnson' },
  { id: 2, name: 'James Okonkwo' },
  { id: 3, name: 'Emily Tran' },
];

export default function CreateReferralPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [directory, setDirectory] = useState([]);
  const [loadingDirectory, setLoadingDirectory] = useState(true);
  const [form, setForm] = useState({ patientId: '', toId: '', note: '' });
  const [errors, setErrors] = useState({});
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
              id: p.psychiatristId,
              name: p.psychiatristName,
              hospital: h.hospitalName,
              city: h.city,
            }));
          })
        );
        if (!cancelled) setDirectory(psychResults.flat());
      } catch (err) {
        if (!cancelled) {
          addToast({ type: 'error', title: 'Failed to load directory', message: err.message });
        }
      } finally {
        if (!cancelled) setLoadingDirectory(false);
      }
    };
    loadDirectory();
    return () => { cancelled = true; };
  }, []);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.patientId) errs.patientId = 'Select a patient';
    if (!form.toId) errs.toId = 'Select a consultant';
    if (!form.note.trim()) errs.note = 'Add case notes explaining the referral reason';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    const toEntry = directory.find((d) => String(d.id) === String(form.toId));

    setSubmitting(true);
    try {
      const data = { patientId: form.patientId, caseOfReferral: form.note.trim() };
      if (toEntry) data.referToConsultantId = toEntry.id;

      await referralService.create(data);
      navigate('/consultant/referrals', {
        state: {
          toast: {
            type: 'success',
            title: 'Referral sent',
            message: 'The referral has been submitted successfully.',
          },
        },
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to send referral', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingDirectory) {
    return (
      <div className="referrals">
        <p style={{ color: 'var(--color-muted-foreground)', padding: 'var(--space-5)' }}>Loading form options...</p>
      </div>
    );
  }

  return (
    <div className="referrals" style={{ maxWidth: '44rem', margin: '0 auto', width: '100%' }}>
      <Link to="/consultant/referrals" className="referrals__past-to" style={{ textDecoration: 'none', marginBottom: 'var(--space-2)' }}>
        <ArrowLeft aria-hidden="true" /> Back to Referrals
      </Link>

      <Card style={{ padding: 'var(--space-6)' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h1 className="referrals__section-title" style={{ fontSize: 'var(--text-2xl)' }}>
            <UserCheck aria-hidden="true" /> Refer a Patient
          </h1>
          <p style={{ color: 'var(--color-muted-foreground)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
            Submit a referral to an affiliated psychiatrist or consultant.
          </p>
        </div>

        <form className="referrals__form" onSubmit={handleSubmit} noValidate>
          <Select
            label="Patient"
            options={[
              { value: '', label: 'Select a patient', disabled: true },
              ...STATIC_PATIENTS.map((p) => ({ value: p.id.toString(), label: p.name })),
            ]}
            value={form.patientId}
            onChange={handleChange('patientId')}
            error={errors.patientId}
          />
          <Select
            label="Refer To"
            options={[
              { value: '', label: 'Select a consultant', disabled: true },
              ...directory.map((d) => ({ value: d.id.toString(), label: `${d.name} — ${d.hospital}` })),
            ]}
            value={form.toId}
            onChange={handleChange('toId')}
            error={errors.toId}
          />
          <Textarea
            label="Case Notes"
            placeholder="Explain why this referral is being made and what the receiving consultant should know..."
            rows={5}
            value={form.note}
            onChange={handleChange('note')}
            error={errors.note}
          />

          <div className="referrals__form-actions" style={{ marginTop: 'var(--space-4)' }}>
            <Button variant="ghost" type="button" onClick={() => navigate('/consultant/referrals')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting} disabled={submitting}>
              Send Referral
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
