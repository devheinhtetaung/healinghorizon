import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Activity } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import useToast from '../../components/ui/useToast';
import { progressService } from '../../services/progressService';
import './PatientProgress.css';

const METRICS = [
  { key: 'anxietyScore', label: 'Anxiety' },
  { key: 'depressionScore', label: 'Depression' },
  { key: 'overthinkingScore', label: 'Overthinking' },
  { key: 'overallScore', label: 'Overall' },
];

const INITIAL_NEW = { anxietyScore: '', depressionScore: '', overthinkingScore: '', overallScore: '', note: '' };

export default function CreateProgressLogPage() {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [form, setForm] = useState(INITIAL_NEW);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

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
    METRICS.forEach(({ key, label }) => {
      const val = Number(form[key]);
      if (form[key] === '' || Number.isNaN(val) || val < 0 || val > 100) {
        errs[key] = `${label} must be 0–100`;
      }
    });
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      await progressService.create(patientId, {
        anxietyScore: Number(form.anxietyScore),
        depressionScore: Number(form.depressionScore),
        overthinkingScore: Number(form.overthinkingScore),
        overallScore: Number(form.overallScore),
        note: form.note.trim(),
      });
      navigate(`/consultant/patients/${patientId}/progress`, {
        state: {
          toast: {
            type: 'success',
            title: 'Log entry added',
            message: 'Progress record saved successfully.',
          },
        },
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to save entry', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="con-prog" style={{ maxWidth: '44rem', margin: '0 auto', width: '100%' }}>
      <Link to={`/consultant/patients/${patientId}/progress`} className="con-prog__back" style={{ textDecoration: 'none', marginBottom: 'var(--space-2)' }}>
        <ArrowLeft aria-hidden="true" /> Back to Patient Progress
      </Link>

      <Card style={{ padding: 'var(--space-6)' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h1 className="con-prog__section-title" style={{ fontSize: 'var(--text-2xl)' }}>
            <Activity aria-hidden="true" /> Add Progress Log Entry
          </h1>
          <p style={{ color: 'var(--color-muted-foreground)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
            Record clinical wellbeing scores and progress notes for Patient #{patientId}.
          </p>
        </div>

        <form className="con-prog__form" onSubmit={handleSubmit} noValidate>
          <div className="con-prog__form-grid">
            {METRICS.map(({ key, label }) => (
              <Input
                key={key}
                label={label}
                type="number"
                min={0}
                max={100}
                placeholder="0–100"
                value={form[key]}
                onChange={handleChange(key)}
                error={errors[key]}
              />
            ))}
          </div>
          <Textarea
            label="Notes (optional)"
            placeholder="Clinical observations, recommendations..."
            rows={4}
            value={form.note}
            onChange={handleChange('note')}
          />
          <div className="con-prog__form-actions" style={{ marginTop: 'var(--space-4)' }}>
            <Button variant="ghost" type="button" onClick={() => navigate(`/consultant/patients/${patientId}/progress`)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={submitting} disabled={submitting}>
              Save Entry
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
