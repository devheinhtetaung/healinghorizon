import { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Calendar,
  MapPin,
  Shield,
  BadgeCheck,
  Lock,
  AlertTriangle,
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
import './AdminProfile.css';

const GENDER_OPTIONS = [
  { value: '', label: 'Select gender', disabled: true },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Non-binary', label: 'Non-binary' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
];

function formatMemberSince(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
    });
  } catch {
    return null;
  }
}

export default function AdminProfilePage() {
  const { addToast } = useToast();
  const { user, refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    gender: '',
    dob: '',
    address: '',
  });
  const [memberSince, setMemberSince] = useState(null);
  const [profileErrors, setProfileErrors] = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

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
        });
        setMemberSince(formatMemberSince(data.profile?.createdAt || data.user?.createdAt));
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

  if (loading) {
    return (
      <div className="ad-profile" aria-busy="true">
        <Card className="ad-profile__card">
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
    <div className="ad-profile">
      <h1 className="page-title">Profile &amp; Settings</h1>
      <div className="ad-profile__layout">
        {/* LEFT COLUMN: Overview */}
        <aside className="ad-profile__sidebar-col" aria-label="Profile Summary">
          <Card className="ad-profile__overview-card">
            <div className="ad-profile__avatar-wrapper">
              <AvatarUpload name={profile.name || 'User'} src={user?.avatarUrl || ''} onUploaded={refreshUser} size="lg" className="ad-profile__avatar-large" />
              <div className="ad-profile__avatar-meta">
                <h2 className="ad-profile__user-name">{profile.name || 'Administrator'}</h2>
                <p className="ad-profile__user-email">{profile.email}</p>
                <div className="ad-profile__role-badge-row">
                  <Badge variant="success">
                    <BadgeCheck className="ad-profile__badge-icon" aria-hidden="true" />
                    <span>Administrator</span>
                  </Badge>
                </div>
              </div>
            </div>

            <hr className="ad-profile__divider" />

            <div className="ad-profile__summary-items">
              <div className="ad-profile__summary-item">
                <div className="ad-profile__summary-item-label">
                  <Shield className="ad-profile__summary-icon" aria-hidden="true" />
                  <span>Access Level</span>
                </div>
                <span className="ad-profile__summary-item-val">Full platform administration</span>
              </div>

              <div className="ad-profile__summary-item">
                <div className="ad-profile__summary-item-label">
                  <Calendar className="ad-profile__summary-icon" aria-hidden="true" />
                  <span>Member Since</span>
                </div>
                <span className="ad-profile__summary-item-val">
                  {memberSince || '—'}
                </span>
              </div>

              <div className="ad-profile__summary-item">
                <div className="ad-profile__summary-item-label">
                  <Lock className="ad-profile__summary-icon" aria-hidden="true" />
                  <span>Account Security</span>
                </div>
                <span className="ad-profile__summary-item-val">Password protected</span>
              </div>
            </div>

            <hr className="ad-profile__divider" />

            <div className="ad-profile__sidebar-tip">
              <p className="ad-profile__tip-title">Administrator Note</p>
              <p className="ad-profile__tip-text">
                Your account manages users, consultants, surveys, and the hospital directory.
                Changes made here affect your sign-in across the admin portal.
              </p>
            </div>
          </Card>
        </aside>

        {/* RIGHT COLUMN: Form Cards */}
        <main className="ad-profile__main-col">
          {/* Card 1: Personal Information */}
          <Card className="ad-profile__card">
            <div className="ad-profile__head">
              <div className="ad-profile__card-icon" aria-hidden="true">
                <User />
              </div>
              <div>
                <h2 className="ad-profile__title">Personal Information</h2>
                <p className="ad-profile__subtitle">
                  Update the details tied to your administrator account.
                </p>
              </div>
            </div>

            <form className="ad-profile__form" onSubmit={handleProfileSubmit} noValidate>
              <div className="ad-profile__grid">
                <Input
                  label="Full Name"
                  leftIcon={User}
                  value={profile.name}
                  onChange={handleProfileChange('name')}
                  error={profileErrors.name}
                  autoComplete="name"
                />
                <div className="ad-profile__grid-full">
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
                <div className="ad-profile__grid-full">
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

              <div className="ad-profile__actions">
                <Button type="submit" variant="primary" loading={savingProfile}>
                  Save Profile Details
                </Button>
              </div>
            </form>
          </Card>

          {/* Card 2: Security & Password */}
          <Card className="ad-profile__card">
            <div className="ad-profile__head">
              <div className="ad-profile__card-icon" aria-hidden="true">
                <Lock />
              </div>
              <div>
                <h2 className="ad-profile__title">Security & Password</h2>
                <p className="ad-profile__subtitle">
                  Ensure your admin account is protected with a secure, unique password.
                </p>
              </div>
            </div>

            <form className="ad-profile__form" onSubmit={handlePasswordSubmit} noValidate>
              <div className="ad-profile__password-head">
                <button
                  type="button"
                  className="ad-profile__password-reveal"
                  onClick={() => setShowPasswords((p) => !p)}
                  aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'}
                >
                  {showPasswords ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                  <span>{showPasswords ? 'Hide Passwords' : 'Show Passwords'}</span>
                </button>
              </div>

              <div className="ad-profile__grid">
                <div className="ad-profile__grid-full">
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

              <div className="ad-profile__actions">
                <Button type="submit" variant="primary" loading={savingPassword}>
                  Update Password
                </Button>
              </div>
            </form>
          </Card>

          {/* Card 3: Account security notice */}
          <Card className="ad-profile__card ad-profile__notice-card">
            <div className="ad-profile__head">
              <div className="ad-profile__notice-icon" aria-hidden="true">
                <AlertTriangle />
              </div>
              <div>
                <h2 className="ad-profile__notice-title">Account & Access</h2>
                <p className="ad-profile__subtitle">
                  Administrator accounts have elevated platform access.
                </p>
              </div>
            </div>

            <div className="ad-profile__notice-body">
              <p>
                Admin accounts can only be created or removed by another administrator
                with database access. If you believe your account has been compromised,
                change your password immediately and contact the platform owner.
              </p>
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}
