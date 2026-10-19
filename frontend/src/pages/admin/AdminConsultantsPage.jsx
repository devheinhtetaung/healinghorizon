import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, Star, CheckCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import useToast from '../../components/ui/useToast';
import { adminService } from '../../services/adminService';
import './Admin.css';

export default function AdminConsultantsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const [removeTarget, setRemoveTarget] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(null);
  const [createdModalData, setCreatedModalData] = useState(null);

  const fetchConsultants = async () => {
    setLoading(true);
    try {
      const data = await adminService.getConsultants();
      setConsultants(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultants();
  }, []);

  useEffect(() => {
    if (location.state?.showSuccessModal && location.state?.createdConsultant) {
      setCreatedModalData(location.state.createdConsultant);
      window.history.replaceState({}, document.title);
    } else if (location.state?.toast) {
      addToast(location.state.toast);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, addToast]);

  const filtered = consultants.filter(
    (c) =>
      (c.name || '').toLowerCase().includes(query.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(query.toLowerCase()) ||
      (c.specialty || '').toLowerCase().includes(query.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginatedConsultants = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleVerify = async (consultant) => {
    setVerifyLoading(consultant.consultantId);
    try {
      await adminService.verifyConsultant(consultant.consultantId);
      await fetchConsultants();
      addToast({ type: 'success', title: 'Verified', message: `${consultant.name} is now verified.` });
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setVerifyLoading(null);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoveLoading(true);
    try {
      await adminService.removeConsultant(removeTarget.consultantId);
      await fetchConsultants();
      addToast({ type: 'success', title: 'Removed', message: `${removeTarget.name} has been removed.` });
      setRemoveTarget(null);
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setRemoveLoading(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'isVerified',
      label: 'Verification',
      render: (val) => (
        <Badge variant={val ? 'success' : 'warning'}>
          {val ? 'Verified' : 'Pending'}
        </Badge>
      ),
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (val) => (
        <span className="ad-list__rating">
          <Star className="ad-list__star" aria-hidden="true" />
          {val > 0 ? val.toFixed(1) : '—'}
        </span>
      ),
    },
    {
      key: 'consultantId',
      label: 'Actions',
      render: (_val, row) => (
        <div className="ad-list__actions">
          {!row.isVerified && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleVerify(row)}
              disabled={verifyLoading === row.consultantId}
            >
              {verifyLoading === row.consultantId ? 'Verifying...' : 'Verify'}
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={() => setRemoveTarget(row)}>
            Remove
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="ad-list">
      <h1 className="page-title">Consultants</h1>
      <div className="ad-list__toolbar">
        <div className="ad-list__search">
          <Input
            leftIcon={Search}
            placeholder="Search by name, email, or specialty"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            aria-label="Search consultants"
          />
        </div>
        <Button
          variant="primary"
          leftIcon={Plus}
          onClick={() => navigate('/admin/consultants/new')}
        >
          Add Consultant
        </Button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--color-muted-foreground)', padding: 'var(--space-5)' }}>
          Loading consultants...
        </p>
      ) : (
        <Card style={{ overflow: 'hidden' }}>
          <Table columns={columns} data={paginatedConsultants} />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </Card>
      )}

      {/* Success confirmation modal */}
      <Modal
        isOpen={!!createdModalData}
        onClose={() => setCreatedModalData(null)}
        title="Consultant Account Created"
      >
        <div className="ad-form" style={{ textAlign: 'center', alignItems: 'center' }}>
          <div style={{ color: 'var(--color-success)', marginBottom: 'var(--space-2)' }}>
            <CheckCircle style={{ width: '3rem', height: '3rem' }} aria-hidden="true" />
          </div>
          <p className="ad-form__info" style={{ textAlign: 'center' }}>
            Account for <strong>{createdModalData?.name}</strong> ({createdModalData?.email}) has been successfully created.
          </p>
          <div className="ad-form__actions" style={{ justifyContent: 'center', marginTop: 'var(--space-3)' }}>
            <Button variant="primary" onClick={() => setCreatedModalData(null)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Destructive confirmation modal */}
      <Modal
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title={`Remove ${removeTarget?.name || ''}`}
      >
        <div className="ad-form">
          <p className="ad-form__info">
            Are you sure you want to remove <strong>{removeTarget?.name || 'this consultant'}</strong> from the platform? This action cannot be undone.
          </p>
          <div className="ad-form__actions">
            <Button variant="ghost" onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" loading={removeLoading} onClick={handleRemove}>
              Remove Consultant
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
