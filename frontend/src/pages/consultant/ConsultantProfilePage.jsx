import { useState, useEffect } from 'react';
import { Eye, EyeOff, Star, BadgeCheck, Shield, User, Lock, Award, Mail } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import AvatarUpload from '../../components/ui/AvatarUpload';
import useToast from '../../components/ui/useToast';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import '../patient/Profile.css';

export default function ConsultantProfilePage() {
  const { addToast } = useToast();
  const { user, refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [accountInfo, setAccountInfo] = useState({ rating: 0, verified: false, totalSessions: 0 });
  const [profile, setProfile] = useState({ name: '', email: '', biography: '' });
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await userService.me();
        if (cancelled) return;
        const u = data.user || data;
        const p = data.profile || {};
        setProfile({ name: u.name || '', email: u.email || '', biography: p.biography || '' });
        setAccountInfo({
          rating: p.rating ?? 0,
          verified: p.isVerified ?? false,
          totalSessions: p.totalSessions ?? 0,
        });
      } catch (err) {
        if (!cancelled) addToast({ type: 'error', title: 'Failed to load profile', message: err.message });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleProfileChange = (field) => (e) => {
    setProfile((prev) => ({ ...prev, [field]: e.target.value }));
    if (profileErrors[field]) {
      setProfileErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
  };

  const handlePasswordChange = (field) => (e) => {
    setPasswords((prev) => ({ ...prev, [field]: e.target.value }));
    if (passwordErrors[field]) {
      setPasswordErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!profile.name.trim()) errs.name = 'Name is required';
    if (Object.keys(errs).length > 0) {
      setProfileErrors(errs);
      return;
    }

    setSavingProfile(true);
    try {
      await userService.updateProfile({
        name: profile.name.trim(),
        biography: profile.biography.trim(),
      });
      addToast({
        type: 'success',
        title: 'Profile updated',
        message: 'Your specialist details have been saved.',
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to update profile', message: err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!passwords.current) errs.current = 'Enter your current password';
    if (!passwords.next) errs.next = 'Enter a new password';
    else if (passwords.next.length < 8) errs.next = 'Password must be at least 8 characters';
    if (!passwords.confirm) errs.confirm = 'Confirm your new password';
    else if (passwords.next !== passwords.confirm) errs.confirm = 'Passwords do not match';
    if (Object.keys(errs).length > 0) {
      setPasswordErrors(errs);
      return;
    }

    setSavingPassword(true);
    try {
      await userService.changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.next,
      });
      setPasswords({ current: '', next: '', confirm: '' });
      addToast({
        type: 'success',
        title: 'Password changed',
        message: 'Your password has been updated successfully.',
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to change password', message: err.message });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="con-profile con-profile--loading" aria-busy="true">
        <Card className="con-profile__card">
          <div className="pt-dash__skeleton">
            <div className="pt-dash__skeleton-line pt-dash__skeleton-line--title" />
            <div className="pt-dash__skeleton-line pt-dash__skeleton-line--body" />
            <div className="pt-dash__skeleton-line pt-dash__skeleton-line--body" />
            <div className="pt-dash__skeleton-block" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="con-profile">
      <h1 className="page-title">Profile &amp; Settings</h1>
      <div className="con-profile__layout">
        {/* Left Column: Consultant Overview Sidebar */}
        <aside className="con-profile__sidebar-col" aria-label="Consultant Standing">
          <Card className="con-profile__overview-card">
            <div className="con-profile__avatar-wrapper">
              <AvatarUpload name={profile.name || 'Consultant'} src={user?.avatarUrl || ''} onUploaded={refreshUser} size="lg" className="pt-profile__avatar-large" />
              <div className="con-profile__avatar-meta">
                <h2 className="pt-profile__user-name">{profile.name || 'Consultant'}</h2>
                <p className="pt-profile__user-email">{profile.email}</p>
                <div className="pt-profile__role-badge-row">
                  <Badge variant={accountInfo.verified ? 'success' : 'default'}>
                    <BadgeCheck className="pt-profile__badge-icon" aria-hidden="true" />
                    <span>{accountInfo.verified ? 'Verified Consultant' : 'Pending Verification'}</span>
                  </Badge>
                </div>
              </div>
            </div>

            <hr className="con-profile__divider" />

            <div className="pt-profile__summary-items">
              <div className="pt-profile__summary-item">
                <div className="pt-profile__summary-item-label">
                  <Star className="pt-profile__summary-icon" aria-hidden="true" />
                  <span>Public Rating</span>
                </div>
                <span className="pt-profile__summary-item-val">
                  {(Number(accountInfo.rating) || 0).toFixed(1)} / 5.0
                </span>
              </div>

              <div className="pt-profile__summary-item">
                <div className="pt-profile__summary-item-label">
                  <Shield className="pt-profile__summary-icon" aria-hidden="true" />
                  <span>Completed Sessions</span>
                </div>
                <span className="pt-profile__summary-item-val">
                  {accountInfo.totalSessions.toLocaleString()}
                </span>
              </div>

              <div className="pt-profile__summary-item">
                <div className="pt-profile__summary-item-label">
                  <Award className="pt-profile__summary-icon" aria-hidden="true" />
                  <span>Platform Standing</span>
                </div>
                <span className="pt-profile__summary-item-val">Accredited Practitioner</span>
              </div>
            </div>

            <hr className="con-profile__divider" />

            <div className="pt-profile__sidebar-tip">
              <p className="pt-profile__tip-title">Public Directory Info</p>
              <p className="pt-profile__tip-text">
                Your profile information and clinical biography are displayed directly to patients booking consultations.
              </p>
            </div>
          </Card>
        </aside>

        {/* Right Column: Setting Cards */}
        <main className="con-profile__main-col">
          {/* Card 1: Consultant Details */}
          <Card className="con-profile__card">
            <div className="con-profile__head">
              <div className="pt-profile__head-icon-row">
                <div className="pt-profile__card-icon" aria-hidden="true">
                  <User />
                </div>
                <div>
                  <h2 className="con-profile__title">Specialist Profile Details</h2>
                  <p className="con-profile__subtitle">
                    Update your professional name and biography shown to patients.
                  </p>
                </div>
              </div>
            </div>

            <form className="con-profile__form" onSubmit={handleProfileSubmit} noValidate>
              <div className="pt-profile__grid">
                <Input
                  label="Full Name"
                  leftIcon={User}
                  value={profile.name}
                  onChange={handleProfileChange('name')}
                  error={profileErrors.name}
                  autoComplete="name"
                />
                <div className="pt-profile__grid-full">
                  <Input
                    label="Email Address"
                    type="email"
                    leftIcon={Mail}
                    value={profile.email}
                    readOnly
                    title={profile.email}
                    helperText="Primary email cannot be changed"
                  />
                </div>
                <div className="pt-profile__grid-full">
                  <Textarea
                    label="Professional Biography & Approach"
                    placeholder="Share your clinical background, therapeutic modality (e.g. CBT, DBT, Mindfulness), and what patients can expect..."
                    rows={5}
                    value={profile.biography}
                    onChange={handleProfileChange('biography')}
                    error={profileErrors.biography}
                    helperText="Visible in the consultant directory and patient booking flow"
                  />
                </div>
              </div>
              <div className="con-profile__actions">
                <Button type="submit" variant="primary" loading={savingProfile}>
                  Save Specialist Details
                </Button>
              </div>
            </form>
          </Card>

          {/* Card 2: Security & Password */}
          <Card className="con-profile__card">
            <div className="con-profile__head">
              <div className="pt-profile__head-icon-row">
                <div className="pt-profile__card-icon" aria-hidden="true">
                  <Lock />
                </div>
                <div>
                  <h2 className="con-profile__title">Security & Password</h2>
                  <p className="con-profile__subtitle">
                    Keep your consultant account protected with a strong, unique password.
                  </p>
                </div>
              </div>
            </div>

            <form className="con-profile__form" onSubmit={handlePasswordSubmit} noValidate>
              <div className="con-profile__password-head">
                <button
                  type="button"
                  className="con-profile__password-reveal"
                  onClick={() => setShowPasswords((p) => !p)}
                  aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                >
                  {showPasswords ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}{' '}
                  <span>{showPasswords ? 'Hide Passwords' : 'Show Passwords'}</span>
                </button>
              </div>
              <div className="con-profile__grid">
                <div className="pt-profile__grid-full">
                  <Input
                    label="Current Password"
                    type={showPasswords ? 'text' : 'password'}
                    value={passwords.current}
                    onChange={handlePasswordChange('current')}
                    error={passwordErrors.current}
                    autoComplete="current-password"
                  />
                </div>
                <Input
                  label="New Password"
                  type={showPasswords ? 'text' : 'password'}
                  value={passwords.next}
                  onChange={handlePasswordChange('next')}
                  error={passwordErrors.next}
                  autoComplete="new-password"
                  helperText="Minimum 8 characters"
                />
                <Input
                  label="Confirm New Password"
                  type={showPasswords ? 'text' : 'password'}
                  value={passwords.confirm}
                  onChange={handlePasswordChange('confirm')}
                  error={passwordErrors.confirm}
                  autoComplete="new-password"
                />
              </div>
              <div className="con-profile__actions">
                <Button type="submit" variant="primary" loading={savingPassword}>
                  Update Password
                </Button>
              </div>
            </form>
          </Card>
        </main>
      </div>
    </div>
  );
}
