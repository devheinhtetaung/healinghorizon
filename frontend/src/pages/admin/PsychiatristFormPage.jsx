import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, UserRound } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import useToast from '../../components/ui/useToast';
import { adminService } from '../../services/adminService';
import './Admin.css';

export default function PsychiatristFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [hospitals, setHospitals] = useState([]);
  const [form, setForm] = useState({ name: '', hospitalId: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const initData = async () => {
      try {
        const hData = await adminService.getHospitals();
        if (!cancelled) setHospitals(Array.isArray(hData) ? hData : []);

        if (isEdit) {
          const pData = await adminService.getPsychiatrists();
          const found = (pData || []).find((p) => String(p.psychiatristId) === String(id));
          if (found && !cancelled) {
            setForm({
              name: found.psychiatristName || found.name || '',
              hospitalId: String(found.hospitalId || ''),
            });
          }
        }
      } catch (err) {
        if (!cancelled) {
          addToast({ type: 'error', title: 'Error', message: err.message });
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    };
    initData();
    return () => { cancelled = true; };
  }, [id, isEdit]);

  const hospitalOptions = [
    { value: '', label: 'Select a hospital', disabled: true },
    ...hospitals.map((h) => ({ value: String(h.hospitalId), label: h.hospitalName || h.name })),
  ];

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
    if (!form.hospitalId) errs.hospitalId = 'Select a hospital';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        addToast({ type: 'success', title: 'Psychiatrist updated', message: `${form.name.trim()} has been updated.` });
      } else {
        await adminService.createPsychiatrist({
          psychiatristName: form.name.trim(),
          hospitalId: form.hospitalId,
        });
      }
      navigate('/admin/directory', {
        state: {
          toast: {
            type: 'success',
            title: isEdit ? 'Psychiatrist updated' : 'Psychiatrist added',
            message: `${form.name.trim()} has been ${isEdit ? 'updated' : 'registered'}.`,
          },
        },
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message || `Failed to ${isEdit ? 'update' : 'add'} psychiatrist.` });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="ad-list">
        <p style={{ color: 'var(--color-muted-foreground)', padding: 'var(--space-5)' }}>Loading details...</p>
      </div>
    );
  }

  return (
    <div className="ad-list" style={{ maxWidth: '44rem', margin: '0 auto', width: '100%' }}>
      <Link to="/admin/directory" className="ad-surveys__title-btn" style={{ textDecoration: 'none', marginBottom: 'var(--space-2)' }}>
        <ArrowLeft aria-hidden="true" /> Back to Directory
      </Link>

      <Card style={{ padding: 'var(--space-6)' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h1 className="ad-dash__section-title" style={{ fontSize: 'var(--text-2xl)' }}>
            <UserRound aria-hidden="true" /> {isEdit ? 'Edit Psychiatrist' : 'Add New Psychiatrist'}
          </h1>
          <p style={{ color: 'var(--color-muted-foreground)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
            {isEdit ? 'Update psychiatrist affiliation and profile.' : 'Add a psychiatrist to an affiliated hospital directory.'}
          </p>
        </div>

        <form className="ad-form" onSubmit={handleSubmit} noValidate>
          <Input
            label="Full Name"
            placeholder="e.g. Dr. Jane Smith"
            value={form.name}
            onChange={handleChange('name')}
            error={errors.name}
          />
          <Select
            label="Affiliated Hospital"
            options={hospitalOptions}
            value={form.hospitalId}
            onChange={handleChange('hospitalId')}
            error={errors.hospitalId}
          />

          <div className="ad-form__actions" style={{ marginTop: 'var(--space-4)' }}>
            <Button variant="ghost" type="button" onClick={() => navigate('/admin/directory')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading} disabled={loading}>
              {isEdit ? 'Save Changes' : 'Add Psychiatrist'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
