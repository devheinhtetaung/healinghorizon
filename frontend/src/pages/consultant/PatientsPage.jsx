import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, FileText } from 'lucide-react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Avatar from '../../components/ui/Avatar';
import Pagination from '../../components/ui/Pagination';
import useToast from '../../components/ui/useToast';
import { appointmentService } from '../../services/appointmentService';

export default function PatientsPage() {
  const { addToast } = useToast();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await appointmentService.list();
      const apps = Array.isArray(data) ? data : [];
      const seen = new Map();
      apps.forEach((a) => {
        const pid = a.patientId;
        if (!seen.has(pid)) {
          seen.set(pid, { patientId: pid, name: a.patientName || `Patient #${pid}`, lastSession: a.appointmentDate || a.createdAt, status: a.status });
        }
      });
      setPatients(Array.from(seen.values()));
    } catch (err) {
      setError(err.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatients(); }, []);

  const filtered = patients.filter((p) => (p.name || '').toLowerCase().includes(query.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginatedPatients = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const columns = [
    { key: 'name', label: 'Patient', width: 'auto', render: (_, row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Avatar name={row.name} size="sm" />
        <span style={{ fontWeight: 500 }}>{row.name}</span>
      </div>
    )},
    { key: 'patientId', label: 'ID', width: '6rem', render: (val) => <span style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}>#{val}</span> },
    { key: 'lastSession', label: 'Last Session', width: '10rem', render: (val) => val ? new Date(val).toLocaleDateString() : '—' },
    { key: 'actions', label: 'Actions', width: '12rem', render: (_, row) => (
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <Link to={`/consultant/patients/${row.patientId}/progress`}>
          <Button variant="secondary" size="sm" leftIcon={FileText}>Progress & Summaries</Button>
        </Link>
      </div>
    )},
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-2xl)', color: 'var(--color-foreground)' }}>Patients</h1>
      </div>

      {!loading && !error && (
        <div style={{ maxWidth: '24rem' }}>
          <Input leftIcon={Search} placeholder="Search patients by name" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} aria-label="Search patients" />
        </div>
      )}

      {loading && <p style={{ color: 'var(--color-muted-foreground)', padding: 'var(--space-6)' }}>Loading patients...</p>}

      {!loading && error && (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <p style={{ color: 'var(--color-muted-foreground)', marginBottom: 'var(--space-4)' }}>Couldn't load patients.</p>
          <Button variant="secondary" onClick={fetchPatients}>Retry</Button>
        </div>
      )}

      {!loading && !error && (
        <Card style={{ overflow: 'hidden' }}>
          <Table columns={columns} data={paginatedPatients} />
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </Card>
      )}
    </div>
  );
}
