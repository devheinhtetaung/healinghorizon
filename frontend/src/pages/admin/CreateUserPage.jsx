import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import useToast from '../../components/ui/useToast';
import { authService } from '../../services/authService';
import './Admin.css';

const ROLE_OPTIONS = [
  { value: 'patient', label: 'Member / Patient' },
  { value: 'admin', label: 'Administrator' },
];

const GENDER_OPTIONS = [
  { value: '', label: 'Select gender (optional)' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Non-binary', label: 'Non-binary' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
];

export default function CreateUserPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    dob: '',
    gender: '',
    role: 'patient',
  });
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
    if (!form.dob) errs.dob = 'Date of birth is required';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      await authService.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        dob: form.dob,
        gender: form.gender || undefined,
        role: form.role,
      });

      navigate('/admin/users', {
        state: {
          toast: {
            type: 'success',
            title: 'User created',
            message: `${form.name.trim()} (${form.role}) has been registered.`,
          },
        },
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to create user account.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ad-list" style={{ maxWidth: '44rem', margin: '0 auto', width: '100%' }}>
      <Link to="/admin/users" className="ad-surveys__title-btn" style={{ textDecoration: 'none', marginBottom: 'var(--space-2)' }}>
        <ArrowLeft aria-hidden="true" /> Back to Users
      </Link>

      <Card style={{ padding: 'var(--space-6)' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h1 className="ad-dash__section-title" style={{ fontSize: 'var(--text-2xl)' }}>
            <UserPlus aria-hidden="true" /> Create New User / Admin
          </h1>
          <p style={{ color: 'var(--color-muted-foreground)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
            Manually register a new member or administrator account.
          </p>
        </div>

        <form className="ad-form" onSubmit={handleSubmit} noValidate>
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={form.name}
            onChange={handleChange('name')}
            error={errors.name}
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="john@healinghorizon.org"
            value={form.email}
            onChange={handleChange('email')}
            error={errors.email}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={handleChange('password')}
            error={errors.password}
          />
          <Input
            label="Date of Birth"
            type="date"
            value={form.dob}
            onChange={handleChange('dob')}
            error={errors.dob}
          />
          <Select
            label="Gender"
            options={GENDER_OPTIONS}
            value={form.gender}
            onChange={handleChange('gender')}
          />
          <Select
            label="Account Role"
            options={ROLE_OPTIONS}
            value={form.role}
            onChange={handleChange('role')}
          />

          <div className="ad-form__actions" style={{ marginTop: 'var(--space-4)' }}>
            <Button variant="ghost" type="button" onClick={() => navigate('/admin/users')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading} disabled={loading}>
              Create User
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
