import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Sparkles, ShieldCheck } from 'lucide-react';
import Logo from '../../components/brand/Logo';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useToast from '../../components/ui/useToast';
import useAuth from '../../hooks/useAuth';
import './Login.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INITIAL = { email: '', password: '', remember: false };

function validate(values) {
  const errors = {};
  if (!values.email.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_RE.test(values.email)) {
    errors.email = 'Enter a valid email address';
  }
  if (!values.password) {
    errors.password = 'Password is required';
  }
  return errors;
}

export default function LoginPage() {
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const { login } = useAuth();
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
      const user = await login(values.email, values.password);
      addToast({
        type: 'success',
        title: 'Signed in',
        message: 'Welcome back — redirecting to your dashboard.',
      });
      const dash = {
        patient: '/patient/dashboard',
        consultant: '/consultant/dashboard',
        admin: '/admin/dashboard',
      };
      navigate(dash[user.role] || '/');
    } catch (err) {
      if (!err.status || err.status === 0) {
        addToast({
          type: 'error',
          title: 'Network error',
          message: 'Unable to reach the server. Check your connection and try again.',
        });
      } else if (err.status === 401) {
        addToast({
          type: 'error',
          title: 'Invalid credentials',
          message: 'The email or password you entered is incorrect.',
        });
      } else if (err.status === 403) {
        addToast({ type: 'error', title: 'Account suspended', message: err.message });
      } else if (err.status === 422) {
        setErrors({ email: err.message, password: err.message });
      } else {
        addToast({ type: 'error', title: 'Sign in failed', message: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="auth-split">
        {/* Left Side: Brand & Quote Panel */}
        <aside className="auth-brand-panel" aria-label="Brand and mission statement">
          <div className="auth-brand-panel__inner">
            <div className="auth-brand-panel__top">
              <Link to="/" aria-label="Healing Horizon home" className="auth-brand-panel__logo">
                <Logo variant="light" size="lg" />
              </Link>
            </div>

            <div className="auth-brand-panel__center">
              <div className="auth-brand-badge">
                <Sparkles className="auth-brand-badge__icon" aria-hidden="true" />
                <span>Safe & Confidential Care</span>
              </div>

              <blockquote className="auth-quote">
                <p className="auth-quote__text">
                  &ldquo;Healing takes time, and asking for help is a courageous step.&rdquo;
                </p>
                <footer className="auth-quote__author">— Dr. Marsha Linehan</footer>
              </blockquote>
            </div>

            <div className="auth-brand-trust">
              <div className="auth-brand-trust__icon">
                <ShieldCheck aria-hidden="true" />
              </div>
              <div className="auth-brand-trust__content">
                <span className="auth-brand-trust__title">Private & Secure Portal</span>
                <span className="auth-brand-trust__desc">
                  End-to-end encrypted consultations and secure medical records.
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Side: Form Panel */}
        <section className="auth-form-panel" aria-label="Sign in form">
          <div className="auth-form-wrapper">
            <div className="auth-mobile-header">
              <Link to="/" aria-label="Healing Horizon home">
                <Logo variant="dark" size="md" />
              </Link>
            </div>

            <div className="auth-form-header">
              <h1 className="auth-form-title">Welcome back</h1>
              <p className="auth-form-subtitle">
                Sign in to your account to access your consultations and wellness plan.
              </p>
            </div>

            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={values.email}
                onChange={handleChange('email')}
                error={errors.email}
                autoComplete="email"
              />

              <div className="login-form__password-field">
                <Input
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={values.password}
                  onChange={handleChange('password')}
                  error={errors.password}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-form__password-toggle"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                </button>
              </div>

              <div className="login-form__row">
                <label className="login-form__checkbox">
                  <input
                    type="checkbox"
                    checked={values.remember}
                    onChange={handleChange('remember')}
                  />
                  <span className="login-form__checkbox-cue" />
                  <span className="login-form__checkbox-label">Remember me</span>
                </label>
                <Link to="/help" className="login-form__forgot">
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="login-form__submit"
              >
                Sign In
              </Button>
            </form>

            <p className="auth-switch">
              Don&rsquo;t have an account?{' '}
              <Link to="/register" className="auth-switch-link">
                Register
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
