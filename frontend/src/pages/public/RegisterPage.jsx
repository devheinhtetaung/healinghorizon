import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Heart, Users, MessageSquareHeart, CheckCircle2, ShieldCheck } from 'lucide-react';
import Logo from '../../components/brand/Logo';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import useToast from '../../components/ui/useToast';
import useAuth from '../../hooks/useAuth';
import './Register.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const GENDER_OPTIONS = [
  { value: '', label: 'Select gender', disabled: true },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
];

const SUPPORT_OPTIONS = [
  { value: '', label: 'Select a preference', disabled: true },
  { value: 'Anxiety', label: 'Anxiety' },
  { value: 'Depression', label: 'Depression' },
  { value: 'Stress', label: 'Stress' },
  { value: 'Overthinking', label: 'Overthinking' },
  { value: 'General Support', label: 'General Support' },
];

const INITIAL = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  gender: '',
  dob: '',
  address: '',
  supportPreference: '',
  emailNotification: true,
};

function validate(values) {
  const errors = {};
  if (!values.name.trim()) errors.name = 'Full name is required';
  if (!values.email.trim()) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(values.email)) errors.email = 'Enter a valid email address';
  if (!values.password) errors.password = 'Password is required';
  else if (values.password.length < 8) errors.password = 'Password must be at least 8 characters';
  if (!values.confirmPassword) errors.confirmPassword = 'Please confirm your password';
  else if (values.password !== values.confirmPassword) errors.confirmPassword = 'Passwords do not match';
  if (!values.gender) errors.gender = 'Please select your gender';
  if (!values.dob) errors.dob = 'Date of birth is required';
  else {
    const d = new Date(values.dob);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d > today) errors.dob = 'Date of birth cannot be in the future';
    else {
      const age = today.getFullYear() - d.getFullYear();
      const m = today.getMonth() - d.getMonth();
      const adj = (m < 0 || (m === 0 && today.getDate() < d.getDate())) ? age - 1 : age;
      if (adj < 16) errors.dob = 'You must be at least 16 years old';
      else if (adj > 120) errors.dob = 'Please enter a valid date of birth';
    }
  }
  if (!values.address.trim()) errors.address = 'Address is required';
  if (!values.supportPreference) errors.supportPreference = 'Please select a support preference';
  return errors;
}

export default function RegisterPage() {
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setValues((prev) => ({ ...prev, [field]: val }));
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
    const v = validate(values);
    if (Object.keys(v).length > 0) {
      setErrors(v);
      return;
    }

    setLoading(true);
    try {
      await register({
        name: values.name,
        email: values.email,
        password: values.password,
        gender: values.gender,
        dob: values.dob,
        address: values.address,
        supportPreference: values.supportPreference,
        emailNotification: values.emailNotification,
      });
      addToast({
        type: 'success',
        title: 'Account created',
        message: 'Welcome to Healing Horizon!',
      });
      navigate('/patient/dashboard');
    } catch (err) {
      if (!err.status || err.status === 0) {
        addToast({
          type: 'error',
          title: 'Network error',
          message: 'Unable to reach the server. Check your connection and try again.',
        });
      } else if (err.status === 409) {
        addToast({
          type: 'error',
          title: 'Email already registered',
          message: 'An account with this email already exists. Try signing in instead.',
        });
      } else if (err.status === 422) {
        const apiErrors = err.data?.error;
        if (apiErrors && typeof apiErrors === 'object') {
          const mapped = {};
          Object.keys(apiErrors).forEach((k) => {
            mapped[k] = apiErrors[k];
          });
          setErrors(mapped);
        } else {
          addToast({ type: 'error', title: 'Validation failed', message: err.message });
        }
      } else {
        addToast({ type: 'error', title: 'Registration failed', message: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="auth-split auth-split--register">
        {/* Left Side: Brand & Value Prop Panel */}
        <aside className="auth-brand-panel auth-brand-panel--register" aria-label="Why join Healing Horizon">
          <div className="auth-brand-panel__inner">
            <div className="auth-brand-panel__top">
              <Link to="/" aria-label="Healing Horizon home" className="auth-brand-panel__logo">
                <Logo variant="light" size="lg" />
              </Link>
            </div>

            <div className="auth-brand-panel__center">
              <div className="auth-brand-badge">
                <Heart className="auth-brand-badge__icon" aria-hidden="true" />
                <span>Begin Your Journey</span>
              </div>

              <h2 className="auth-register-pitch__headline">
                Join 2,400+ members finding compassionate, accessible mental health support every day.
              </h2>

              <div className="auth-features">
                <div className="auth-feature-item">
                  <div className="auth-feature-item__icon">
                    <Users aria-hidden="true" />
                  </div>
                  <div className="auth-feature-item__text">
                    <p className="auth-feature-item__title">Licensed Consultants</p>
                    <p className="auth-feature-item__desc">
                      Book 1-on-1 private video and in-person consultations with accredited specialists.
                    </p>
                  </div>
                </div>

                <div className="auth-feature-item">
                  <div className="auth-feature-item__icon">
                    <MessageSquareHeart aria-hidden="true" />
                  </div>
                  <div className="auth-feature-item__text">
                    <p className="auth-feature-item__title">Safe Peer Community</p>
                    <p className="auth-feature-item__desc">
                      Share experiences, ask questions, and connect in a moderated environment.
                    </p>
                  </div>
                </div>

                <div className="auth-feature-item">
                  <div className="auth-feature-item__icon">
                    <CheckCircle2 aria-hidden="true" />
                  </div>
                  <div className="auth-feature-item__text">
                    <p className="auth-feature-item__title">Self-Guided Progress Tools</p>
                    <p className="auth-feature-item__desc">
                      Take regular self-assessments and track your personal wellness goals.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="auth-brand-trust">
              <div className="auth-brand-trust__icon">
                <ShieldCheck aria-hidden="true" />
              </div>
              <div className="auth-brand-trust__content">
                <span className="auth-brand-trust__title">Free & Confidential Account</span>
                <span className="auth-brand-trust__desc">
                  No credit card required. Access self-care assessments and community resources immediately.
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Side: Form Panel */}
        <section className="auth-form-panel auth-form-panel--register" aria-label="Create account form">
          <div className="auth-form-wrapper auth-form-wrapper--register">
            <div className="auth-mobile-header">
              <Link to="/" aria-label="Healing Horizon home">
                <Logo variant="dark" size="md" />
              </Link>
            </div>

            <div className="auth-form-header">
              <h1 className="auth-form-title">Create your account</h1>
              <p className="auth-form-subtitle">
                Fill in your details below to start your personalized mental wellness journey.
              </p>
            </div>

            <form className="register-form" onSubmit={handleSubmit} noValidate>
              <div className="register-form__grid">
                <Input
                  label="Full Name"
                  placeholder="Jane Smith"
                  value={values.name}
                  onChange={handleChange('name')}
                  error={errors.name}
                  autoComplete="name"
                />

                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={values.email}
                  onChange={handleChange('email')}
                  error={errors.email}
                  autoComplete="email"
                />

                <div className="register-form__password-field">
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={values.password}
                    onChange={handleChange('password')}
                    error={errors.password}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="register-form__password-toggle"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                  </button>
                </div>

                <div className="register-form__password-field">
                  <Input
                    label="Confirm Password"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={values.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    error={errors.confirmPassword}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="register-form__password-toggle"
                    onClick={() => setShowConfirm((p) => !p)}
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  >
                    {showConfirm ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                  </button>
                </div>

                <Select
                  label="Gender"
                  options={GENDER_OPTIONS}
                  value={values.gender}
                  onChange={handleChange('gender')}
                  error={errors.gender}
                />

                <Input
                  label="Date of Birth"
                  type="date"
                  value={values.dob}
                  onChange={handleChange('dob')}
                  error={errors.dob}
                />

                <Input
                  label="Address"
                  placeholder="Your address"
                  value={values.address}
                  onChange={handleChange('address')}
                  error={errors.address}
                  autoComplete="street-address"
                />

                <Select
                  label="Support Preference"
                  options={SUPPORT_OPTIONS}
                  value={values.supportPreference}
                  onChange={handleChange('supportPreference')}
                  error={errors.supportPreference}
                />
              </div>

              <label className="register-form__checkbox">
                <input
                  type="checkbox"
                  checked={values.emailNotification}
                  onChange={handleChange('emailNotification')}
                />
                <span className="register-form__checkbox-cue" />
                <span className="register-form__checkbox-label">
                  Send me email notifications about appointments and community updates
                </span>
              </label>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="register-form__submit"
              >
                Create Account
              </Button>
            </form>

            <p className="auth-switch">
              Already have an account?{' '}
              <Link to="/login" className="auth-switch-link">
                Log In
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
