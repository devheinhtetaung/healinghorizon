import { useState, useEffect } from 'react';
import { Search, Star, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import useToast from '../../components/ui/useToast';
import { adminService } from '../../services/adminService';
import './Admin.css';

const RATING_OPTIONS = [
  { value: '', label: 'All ratings' },
  { value: '5', label: '5 stars' },
  { value: '4', label: '4 stars' },
  { value: '3', label: '3 stars' },
  { value: '2', label: '2 stars' },
  { value: '1', label: '1 star' },
];

export default function AdminFeedbackPage() {
  const { addToast } = useToast();
  const [feedback, setFeedback] = useState([]);
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterConsultant, setFilterConsultant] = useState('');
  const [filterRating, setFilterRating] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const [removeTarget, setRemoveTarget] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterConsultant) params.consultantId = filterConsultant;
      if (filterRating) params.rating = filterRating;
      if (query) params.search = query;
      const data = await adminService.getFeedback(params);
      setFeedback(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeedback(); setPage(1); }, [query, filterConsultant, filterRating]);

  useEffect(() => {
    (async () => {
      try {
        const data = await adminService.getConsultants();
        setConsultants(Array.isArray(data) ? data : []);
      } catch { setConsultants([]); }
    })();
  }, []);

  const consultantOptions = [
    { value: '', label: 'All consultants' },
    ...consultants.map((c) => ({ value: c.consultantId, label: c.name })),
  ];

  const filtered = feedback.filter((f) => {
    const mQ = (f.patientName || '').toLowerCase().includes(query.toLowerCase()) ||
      (f.consultantName || '').toLowerCase().includes(query.toLowerCase()) ||
      (f.comment || '').toLowerCase().includes(query.toLowerCase());
    const mC = !filterConsultant || String(f.consultantId) === String(filterConsultant);
    const mR = !filterRating || String(f.rating) === filterRating;
    return mQ && mC && mR;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginatedFeedback = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleRemove = async () => {
    if (!removeTarget) return;
    setRemoveLoading(true);
    try {
      await adminService.removeFeedback(removeTarget.feedbackId);
      await fetchFeedback();
      addToast({ type: 'success', title: 'Removed', message: 'Feedback entry has been removed.' });
      setRemoveTarget(null);
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setRemoveLoading(false);
    }
  };

  const columns = [
    { key: 'patientName', label: 'Patient' },
    { key: 'consultantName', label: 'Consultant' },
    { key: 'rating', label: 'Rating', render: (val) => <span className="ad-list__rating"><Star className="ad-list__star" aria-hidden="true" />{val}</span> },
    { key: 'comment', label: 'Comment', render: (val) => <span className="ad-list__comment-cell">{val || '—'}</span> },
    { key: 'createdAt', label: 'Date', render: (val) => (val ? new Date(val).toLocaleDateString() : '—') },
    { key: 'feedbackId', label: 'Actions', render: (_val, row) => (
      <Button variant="destructive" size="sm" leftIcon={Trash2} onClick={() => setRemoveTarget(row)}>Remove</Button>
    )},
  ];

  return (
    <div className="ad-list">
      <h1 className="page-title">Feedback</h1>
      <div className="ad-list__toolbar">
        <div className="ad-list__search">
          <Input leftIcon={Search} placeholder="Search feedback..." value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search feedback" />
        </div>
        <div className="ad-list__filters">
          <Select options={consultantOptions} value={filterConsultant} onChange={(e) => setFilterConsultant(e.target.value)} aria-label="Filter by consultant" />
          <Select options={RATING_OPTIONS} value={filterRating} onChange={(e) => setFilterRating(e.target.value)} aria-label="Filter by rating" />
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--color-muted-foreground)', padding: 'var(--space-5)' }}>Loading feedback...</p>
      ) : (
        <Card style={{ overflow: 'hidden' }}>
          <Table columns={columns} data={paginatedFeedback} />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </Card>
      )}

      <Modal isOpen={!!removeTarget} onClose={() => setRemoveTarget(null)} title="Remove Feedback">
        <div className="ad-form">
          <p className="ad-form__info">Are you sure you want to remove this feedback entry from <strong>{removeTarget?.patientName || 'this patient'}</strong>? This cannot be undone.</p>
          <div className="ad-form__actions">
            <Button variant="ghost" onClick={() => setRemoveTarget(null)}>Cancel</Button>
            <Button variant="destructive" loading={removeLoading} onClick={handleRemove}>Remove Entry</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
