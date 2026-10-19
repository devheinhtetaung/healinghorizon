import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flag, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import Pagination from '../../components/ui/Pagination';
import useToast from '../../components/ui/useToast';
import { adminService } from '../../services/adminService';
import './Admin.css';

const REASON_LABELS = {
  spam: 'Spam',
  harmful: 'Harmful content',
  harassment: 'Harassment',
  other: 'Other',
};

const STATUS_META = {
  open: { variant: 'warning', icon: AlertCircle, label: 'Open' },
  resolved: { variant: 'success', icon: CheckCircle, label: 'Resolved' },
  dismissed: { variant: 'error', icon: XCircle, label: 'Dismissed' },
};

const STATUS_FILTERS = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

export default function AdminReportsPage() {
  const { addToast } = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);
  const PAGE_SIZE = 10;

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await adminService.getReports(filterStatus);
      setReports(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    setPage(1);
  }, [filterStatus]);

  const handleStatus = async (report, status) => {
    setUpdatingId(report.postReportId);
    try {
      await adminService.updateReportStatus(report.postReportId, status);
      await fetchReports();
      addToast({
        type: 'success',
        title: status === 'resolved' ? 'Report resolved' : 'Report dismissed',
        message: 'The report status has been updated.',
      });
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setUpdatingId(null);
    }
  };

  const totalPages = Math.ceil(reports.length / PAGE_SIZE) || 1;
  const paginated = reports.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = [
    {
      key: 'postTitle',
      label: 'Post',
      render: (val, row) => (
        <div className="ad-list__report-post">
          <Link to={`/community/${row.postId}`} className="ad-list__report-link">
            {val || 'Untitled post'}
          </Link>
          <span className="ad-list__report-by">by {row.postAuthorName || 'Unknown'}</span>
        </div>
      ),
    },
    { key: 'reporterName', label: 'Reported by', render: (val) => val || 'Unknown' },
    {
      key: 'reason',
      label: 'Reason',
      render: (val) => <Badge variant="default">{REASON_LABELS[val] || val}</Badge>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => {
        const meta = STATUS_META[val] || STATUS_META.open;
        const Icon = meta.icon;
        return (
          <Badge variant={meta.variant}>
            <Icon aria-hidden="true" style={{ width: '0.75rem', height: '0.75rem' }} /> {meta.label}
          </Badge>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (val) => (val ? new Date(val).toLocaleDateString() : '—'),
    },
    {
      key: 'postReportId',
      label: 'Actions',
      render: (_val, row) => {
        if (row.status !== 'open') return <span className="ad-list__muted">—</span>;
        const busy = updatingId === row.postReportId;
        return (
          <div className="ad-list__actions">
            <Button
              variant="primary"
              size="sm"
              leftIcon={CheckCircle}
              loading={busy}
              disabled={updatingId !== null && !busy}
              onClick={() => handleStatus(row, 'resolved')}
            >
              Resolve
            </Button>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={XCircle}
              disabled={busy || (updatingId !== null && !busy)}
              onClick={() => handleStatus(row, 'dismissed')}
            >
              Dismiss
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="ad-list">
      <h1 className="page-title">Flagged Posts</h1>
      <p className="ad-list__subtitle">
        Community posts reported by members. Posts remain visible until you act.
      </p>

      <div className="ad-list__toolbar">
        <div className="ad-list__filters">
          <Select
            options={STATUS_FILTERS}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filter reports by status"
          />
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--color-muted-foreground)', padding: 'var(--space-5)' }}>
          Loading flagged posts...
        </p>
      ) : reports.length === 0 ? (
        <Card className="ad-list__empty-card">
          <Flag aria-hidden="true" />
          <p>No flagged posts to review.</p>
        </Card>
      ) : (
        <Card style={{ overflow: 'hidden' }}>
          <Table columns={columns} data={paginated} />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={reports.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </Card>
      )}
    </div>
  );
}
