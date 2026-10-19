import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import useToast from '../../components/ui/useToast';
import { adminService } from '../../services/adminService';
import './Admin.css';

const INITIAL_FORM = { name: '', email: '', password: '', biography: '' };

export default function CreateConsultantPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    if (!form.password.trim() || form.password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      await adminService.createConsultant({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        biography: form.biography.trim(),
      });
      // Navigate back to consultants list and pass created consultant info for success feedback modal
      navigate('/admin/consultants', {
        state: {
          showSuccessModal: true,
          createdConsultant: {
            name: form.name.trim(),
            email: form.email.trim(),
          },
        },
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to create consultant account.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ad-list" style={{ maxWidth: '44rem', margin: '0 auto', width: '100%' }}>
      <Link to="/admin/consultants" className="ad-surveys__title-btn" style={{ textDecoration: 'none', marginBottom: 'var(--space-2)' }}>
        <ArrowLeft aria-hidden="true" /> Back to Consultants
      </Link>

      <Card style={{ padding: 'var(--space-6)' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h1 className="ad-dash__section-title" style={{ fontSize: 'var(--text-2xl)' }}>
            <UserPlus aria-hidden="true" /> Create Consultant Account
          </h1>
          <p style={{ color: 'var(--color-muted-foreground)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
            Register a new mental health consultant on Healing Horizon.
          </p>
        </div>

        <form className="ad-form" onSubmit={handleSubmit} noValidate>
          <Input
            label="Full Name"
            placeholder="Dr. Jane Smith"
            value={form.name}
            onChange={handleChange('name')}
            error={errors.name}
          />
          <Input
            label="Email"
            type="email"
            placeholder="dr.jane@healinghorizon.org"
            value={form.email}
            onChange={handleChange('email')}
            error={errors.email}
          />
          <Input
            label="Temporary Password"
            type="password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={handleChange('password')}
            error={errors.password}
            helperText="The consultant can change this after their first login."
          />
          <Textarea
            label="Biography (optional)"
            placeholder="Share their background and approach..."
            rows={4}
            value={form.biography}
            onChange={handleChange('biography')}
          />

          <div className="ad-form__actions" style={{ marginTop: 'var(--space-4)' }}>
            <Button variant="ghost" type="button" onClick={() => navigate('/admin/consultants')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading} disabled={loading}>
              Register Consultant
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
