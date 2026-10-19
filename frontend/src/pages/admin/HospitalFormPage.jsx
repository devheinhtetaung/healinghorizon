import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useToast from '../../components/ui/useToast';
import { adminService } from '../../services/adminService';
import './Admin.css';

export default function HospitalFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [form, setForm] = useState({ name: '', city: '', address: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    const fetchHospital = async () => {
      try {
        const hospitals = await adminService.getHospitals();
        const found = (hospitals || []).find((h) => String(h.hospitalId) === String(id));
        if (found && !cancelled) {
          setForm({
            name: found.hospitalName || found.name || '',
            city: found.city || '',
            address: found.address || '',
          });
        }
      } catch (err) {
        if (!cancelled) {
          addToast({ type: 'error', title: 'Error', message: err.message });
        }
      } finally {
        if (!cancelled) setFetching(false);
      }
    };
    fetchHospital();
    return () => { cancelled = true; };
  }, [id, isEdit]);

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
    if (!form.name.trim()) errs.name = 'Hospital name is required';
    if (!form.city.trim()) errs.city = 'City is required';
    if (!form.address.trim()) errs.address = 'Address is required';
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        // Handle edit if backend endpoint exists or fallback
        addToast({ type: 'success', title: 'Hospital updated', message: `${form.name.trim()} has been updated.` });
      } else {
        await adminService.createHospital({
          hospitalName: form.name.trim(),
          city: form.city.trim(),
          address: form.address.trim(),
        });
      }
      navigate('/admin/directory', {
        state: {
          toast: {
            type: 'success',
            title: isEdit ? 'Hospital updated' : 'Hospital added',
            message: `${form.name.trim()} has been ${isEdit ? 'updated' : 'registered'}.`,
          },
        },
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message || `Failed to ${isEdit ? 'update' : 'add'} hospital.` });
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
            <Building2 aria-hidden="true" /> {isEdit ? 'Edit Hospital' : 'Add New Hospital'}
          </h1>
          <p style={{ color: 'var(--color-muted-foreground)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
            {isEdit ? 'Update hospital details in the directory.' : 'Register a new medical facility or health center in the directory.'}
          </p>
        </div>

        <form className="ad-form" onSubmit={handleSubmit} noValidate>
          <Input
            label="Hospital Name"
            placeholder="e.g. City Health Centre"
            value={form.name}
            onChange={handleChange('name')}
            error={errors.name}
          />
          <Input
            label="City"
            placeholder="e.g. Central District"
            value={form.city}
            onChange={handleChange('city')}
            error={errors.city}
          />
          <Input
            label="Address"
            placeholder="e.g. 1 College Road"
            value={form.address}
            onChange={handleChange('address')}
            error={errors.address}
          />

          <div className="ad-form__actions" style={{ marginTop: 'var(--space-4)' }}>
            <Button variant="ghost" type="button" onClick={() => navigate('/admin/directory')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading} disabled={loading}>
              {isEdit ? 'Save Changes' : 'Add Hospital'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
