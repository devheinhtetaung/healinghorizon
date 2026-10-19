import { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Calendar,
  MapPin,
  Heart,
  Bell,
  Shield,
  AlertTriangle,
  BadgeCheck,
  Lock,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import AvatarUpload from '../../components/ui/AvatarUpload';
import useToast from '../../components/ui/useToast';
import useAuth from '../../hooks/useAuth';
import { userService } from '../../services/userService';
import './Profile.css';

const GENDER_OPTIONS = [
  { value: '', label: 'Select gender', disabled: true },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Non-binary', label: 'Non-binary' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
];

const SUPPORT_OPTIONS = [
  { value: '', label: 'Select a primary preference', disabled: true },
  { value: 'Anxiety', label: 'Anxiety' },
  { value: 'Depression', label: 'Depression' },
  { value: 'Stress', label: 'Stress' },
  { value: 'Overthinking', label: 'Overthinking' },
  { value: 'General Support', label: 'General Support' },
];

const SUPPORT_CHIPS = [
  'Anxiety',
  'Depression',
  'Stress',
  'Overthinking',
  'General Support',
];

export default function PatientProfilePage() {
  const { addToast } = useToast();
  const { user, refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    gender: '',
    dob: '',
    address: '',
    supportPreference: '',
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [emailNotification, setEmailNotification] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await userService.me();
        setProfile({
          name: data.user?.name || '',
          email: data.user?.email || '',
          gender: data.user?.gender || '',
          dob: data.user?.dob || '',
          address: data.user?.address || '',
          supportPreference: data.profile?.supportPreference || '',
        });
        setEmailNotification(data.profile?.emailNotification ? true : false);
      } catch (err) {
        addToast({ type: 'error', title: 'Failed to load profile', message: err.message });
      } finally {
        setLoading(false);
      }
    })();
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

  const handleSupportChipSelect = (val) => {
    setProfile((prev) => ({ ...prev, supportPreference: val }));
    if (profileErrors.supportPreference) {
      setProfileErrors((prev) => {
        const n = { ...prev };
        delete n.supportPreference;
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
    if (!profile.gender) errs.gender = 'Please select your gender';
    if (!profile.dob) errs.dob = 'Date of birth is required';
    if (!profile.address.trim()) errs.address = 'Address is required';
    if (!profile.supportPreference) errs.supportPreference = 'Please select a preference';
    if (Object.keys(errs).length > 0) {
      setProfileErrors(errs);
      return;
    }

    setSavingProfile(true);
    try {
      await userService.updateProfile(profile);
      addToast({
        type: 'success',
        title: 'Profile updated',
        message: 'Your personal details have been saved.',
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Update failed', message: err.message });
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
      addToast({ type: 'error', title: 'Password change failed', message: err.message });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleToggleNotification = async () => {
    const next = !emailNotification;
    setEmailNotification(next);
    setSavingNotif(true);
    try {
      await userService.updateProfile({ emailNotification: next });
      addToast({
        type: 'info',
        title: 'Notification preference saved',
        message: next ? 'Email notifications are now enabled.' : 'Email notifications are now disabled.',
      });
    } catch (err) {
      setEmailNotification(!next);
      addToast({ type: 'error', title: 'Update failed', message: err.message });
    } finally {
      setSavingNotif(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-profile pt-profile--loading" aria-busy="true">
        <Card className="pt-profile__card">
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
    <div className="pt-profile">
      <h1 className="page-title">Profile &amp; Settings</h1>
      {/* 2-Column Structured Layout */}
      <div className="pt-profile__layout">
        {/* ========================================
            LEFT COLUMN: Overview & Summary Card
           ======================================== */}
        <aside className="pt-profile__sidebar-col" aria-label="Profile Summary">
          <Card className="pt-profile__overview-card">
            <div className="pt-profile__avatar-wrapper">
              <AvatarUpload name={profile.name || 'User'} src={user?.avatarUrl || ''} onUploaded={refreshUser} size="lg" className="pt-profile__avatar-large" />
              <div className="pt-profile__avatar-meta">
                <h2 className="pt-profile__user-name">{profile.name || 'Patient'}</h2>
                <p className="pt-profile__user-email">{profile.email}</p>
                <div className="pt-profile__role-badge-row">
                  <Badge variant="success">
                    <BadgeCheck className="pt-profile__badge-icon" aria-hidden="true" />
                    <span>Verified Patient</span>
                  </Badge>
                </div>
              </div>
            </div>

            <hr className="pt-profile__divider" />

            {/* Quick Profile Summary Metrics */}
            <div className="pt-profile__summary-items">
              <div className="pt-profile__summary-item">
                <div className="pt-profile__summary-item-label">
                  <Heart className="pt-profile__summary-icon" aria-hidden="true" />
                  <span>Support Focus</span>
                </div>
                <span className="pt-profile__summary-item-val">
                  {profile.supportPreference || 'Not set'}
                </span>
              </div>

              <div className="pt-profile__summary-item">
                <div className="pt-profile__summary-item-label">
                  <Bell className="pt-profile__summary-icon" aria-hidden="true" />
                  <span>Email Alerts</span>
                </div>
                <span className="pt-profile__summary-item-val">
                  {emailNotification ? 'Enabled' : 'Disabled'}
                </span>
              </div>

              <div className="pt-profile__summary-item">
                <div className="pt-profile__summary-item-label">
                  <Shield className="pt-profile__summary-icon" aria-hidden="true" />
                  <span>Account Privacy</span>
                </div>
                <span className="pt-profile__summary-item-val">Encrypted & HIPAA-Safe</span>
              </div>
            </div>

            <hr className="pt-profile__divider" />

            <div className="pt-profile__sidebar-tip">
              <p className="pt-profile__tip-title">Care Coordination Note</p>
              <p className="pt-profile__tip-text">
                Your support preference helps match you with licensed specialists and tailor your mental wellbeing tools.
              </p>
            </div>
          </Card>
        </aside>

        {/* ========================================
            RIGHT COLUMN: Form Cards & Settings
           ======================================== */}
        <main className="pt-profile__main-col">
          {/* Card 1: Personal Details */}
          <Card className="pt-profile__card">
            <div className="pt-profile__head">
              <div className="pt-profile__head-icon-row">
                <div className="pt-profile__card-icon" aria-hidden="true">
                  <User />
                </div>
                <div>
                  <h2 className="pt-profile__title">Personal Information</h2>
                  <p className="pt-profile__subtitle">
                    Update your demographic details and primary support preference.
                  </p>
                </div>
              </div>
            </div>

            <form className="pt-profile__form" onSubmit={handleProfileSubmit} noValidate>
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
                <Select
                  label="Gender"
                  options={GENDER_OPTIONS}
                  value={profile.gender}
                  onChange={handleProfileChange('gender')}
                  error={profileErrors.gender}
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  leftIcon={Calendar}
                  value={profile.dob}
                  onChange={handleProfileChange('dob')}
                  error={profileErrors.dob}
                />
                <div className="pt-profile__grid-full">
                  <Input
                    label="Residential Address"
                    leftIcon={MapPin}
                    value={profile.address}
                    onChange={handleProfileChange('address')}
                    error={profileErrors.address}
                    autoComplete="street-address"
                  />
                </div>
              </div>

              {/* Interactive Support Preference Chip Selector */}
              <div className="pt-profile__chips-section">
                <label className="pt-profile__chips-label" id="support-pref-label">
                  Support Focus Preference
                </label>
                <p className="pt-profile__chips-help">
                  Select the primary area of care you would like to focus on with your consultant:
                </p>
                <div
                  className="pt-profile__chips-grid"
                  role="radiogroup"
                  aria-labelledby="support-pref-label"
                >
                  {SUPPORT_CHIPS.map((chip) => {
                    const isSelected = profile.supportPreference === chip;
                    return (
                      <button
                        key={chip}
                        type="button"
                        className={`pt-profile__chip${isSelected ? ' pt-profile__chip--active' : ''}`}
                        onClick={() => handleSupportChipSelect(chip)}
                        role="radio"
                        aria-checked={isSelected}
                      >
                        {chip}
                      </button>
                    );
                  })}
                </div>
                {profileErrors.supportPreference && (
                  <p className="pt-profile__field-error" role="alert">
                    {profileErrors.supportPreference}
                  </p>
                )}
              </div>

              <div className="pt-profile__actions">
                <Button type="submit" variant="primary" loading={savingProfile}>
                  Save Profile Details
                </Button>
              </div>
            </form>
          </Card>

          {/* Card 2: Security & Password */}
          <Card className="pt-profile__card">
            <div className="pt-profile__head">
              <div className="pt-profile__head-icon-row">
                <div className="pt-profile__card-icon" aria-hidden="true">
                  <Lock />
                </div>
                <div>
                  <h2 className="pt-profile__title">Security & Password</h2>
                  <p className="pt-profile__subtitle">
                    Ensure your account is protected with a secure, unique password.
                  </p>
                </div>
              </div>
            </div>

            <form className="pt-profile__form" onSubmit={handlePasswordSubmit} noValidate>
              <div className="pt-profile__password-head">
                <button
                  type="button"
                  className="pt-profile__password-reveal"
                  onClick={() => setShowPasswords((p) => !p)}
                  aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                >
                  {showPasswords ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                  <span>{showPasswords ? 'Hide Passwords' : 'Show Passwords'}</span>
                </button>
              </div>

              <div className="pt-profile__grid">
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

              <div className="pt-profile__actions">
                <Button type="submit" variant="primary" loading={savingPassword}>
                  Update Password
                </Button>
              </div>
            </form>
          </Card>

          {/* Card 3: Notification Preferences */}
          <Card className="pt-profile__card">
            <div className="pt-profile__head">
              <div className="pt-profile__head-icon-row">
                <div className="pt-profile__card-icon" aria-hidden="true">
                  <Bell />
                </div>
                <div>
                  <h2 className="pt-profile__title">Notification Preferences</h2>
                  <p className="pt-profile__subtitle">
                    Control how and when Healing Horizon delivers care updates.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-profile__pref-box">
              <div className="pt-profile__pref">
                <div className="pt-profile__pref-text">
                  <p className="pt-profile__pref-label">Email Notifications & Care Alerts</p>
                  <p className="pt-profile__pref-desc">
                    Receive session confirmations, upcoming appointment reminders, and community replies directly to your inbox.
                  </p>
                </div>
                <button
                  type="button"
                  className={`pt-profile__switch${emailNotification ? ' pt-profile__switch--on' : ''}`}
                  onClick={handleToggleNotification}
                  disabled={savingNotif}
                  role="switch"
                  aria-checked={emailNotification}
                  aria-label="Toggle email notifications"
                >
                  <span className="pt-profile__switch-knob" />
                </button>
              </div>
            </div>
          </Card>

          {/* Card 4: Danger Zone (Compliant Deactivation Notice) */}
          <Card className="pt-profile__card pt-profile__danger-card">
            <div className="pt-profile__head">
              <div className="pt-profile__head-icon-row">
                <div className="pt-profile__danger-icon" aria-hidden="true">
                  <AlertTriangle />
                </div>
                <div>
                  <h2 className="pt-profile__danger-title">Danger Zone</h2>
                  <p className="pt-profile__danger-subtitle">
                    Account deactivation and medical record retention options.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-profile__danger-body">
              <div className="pt-profile__danger-info">
                <p className="pt-profile__danger-item-title">Account Deactivation Request</p>
                <p className="pt-profile__danger-item-desc">
                  To comply with clinical healthcare data retention laws and protect ongoing appointment records, account deactivation is processed via support verification.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() =>
                  addToast({
                    type: 'info',
                    title: 'Account deactivation request',
                    message:
                      'To deactivate your account, please submit a request to support@healinghorizon.org with your account email.',
                  })
                }
              >
                Request Deactivation
              </Button>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
