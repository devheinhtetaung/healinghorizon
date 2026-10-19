import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Textarea from '../../components/ui/Textarea';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import useToast from '../../components/ui/useToast';
import { adminService } from '../../services/adminService';
import './Admin.css';

export default function UsersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const [banTarget, setBanTarget] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [banLoading, setBanLoading] = useState(false);
  const [unbanTarget, setUnbanTarget] = useState(null);
  const [unbanLoading, setUnbanLoading] = useState(false);

  const fetchUsers = async (search) => {
    try {
      setLoading(true);
      const data = await adminService.getUsers(search || undefined);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(query);
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (location.state?.toast) {
      addToast(location.state.toast);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, addToast]);

  const filtered = users.filter((u) => {
    const matchesQuery =
      (u.name || '').toLowerCase().includes(query.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(query.toLowerCase());
    const status = u.isBanned ? 'banned' : 'active';
    const matchesFilter = filter === 'all' || status === filter;
    return matchesQuery && matchesFilter;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginatedUsers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleBan = async () => {
    if (!banTarget) return;
    try {
      setBanLoading(true);
      await adminService.banUser(banTarget.userId, banReason);
      await fetchUsers(query);
      addToast({ type: 'success', title: 'User banned', message: `${banTarget.name} has been banned.` });
      setBanTarget(null);
      setBanReason('');
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setBanLoading(false);
    }
  };

  const handleUnban = async () => {
    if (!unbanTarget) return;
    try {
      setUnbanLoading(true);
      await adminService.unbanUser(unbanTarget.userId);
      await fetchUsers(query);
      addToast({ type: 'success', title: 'User unbanned', message: `${unbanTarget.name} has been unbanned.` });
      setUnbanTarget(null);
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setUnbanLoading(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'createdAt',
      label: 'Registered',
      render: (val) => (val ? new Date(val).toLocaleDateString() : '—'),
    },
    {
      key: 'isBanned',
      label: 'Status',
      render: (val) => (
        <Badge variant={val ? 'error' : 'success'}>
          {val ? 'Banned' : 'Active'}
        </Badge>
      ),
    },
    {
      key: 'userId',
      label: 'Actions',
      render: (_val, row) => (
        <div className="ad-list__actions">
          {!row.isBanned ? (
            <Button variant="destructive" size="sm" onClick={() => setBanTarget(row)}>
              Ban
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setUnbanTarget(row)}>
              Unban
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="ad-list">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="ad-list">
      <h1 className="page-title">Users</h1>
      <div className="ad-list__toolbar">
        <div className="ad-list__search">
          <Input
            leftIcon={Search}
            placeholder="Search by name or email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search users"
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <div className="ad-list__filter">
            <button
              type="button"
              className={`ad-list__filter-btn${filter === 'all' ? ' ad-list__filter-btn--active' : ''}`}
              onClick={() => { setFilter('all'); setPage(1); }}
            >
              All
            </button>
            <button
              type="button"
              className={`ad-list__filter-btn${filter === 'active' ? ' ad-list__filter-btn--active' : ''}`}
              onClick={() => { setFilter('active'); setPage(1); }}
            >
              Active
            </button>
            <button
              type="button"
              className={`ad-list__filter-btn${filter === 'banned' ? ' ad-list__filter-btn--active' : ''}`}
              onClick={() => { setFilter('banned'); setPage(1); }}
            >
              Banned
            </button>
          </div>

          <Button
            variant="primary"
            leftIcon={Plus}
            onClick={() => navigate('/admin/users/new')}
          >
            Add User
          </Button>
        </div>
      </div>

      <Card style={{ overflow: 'hidden' }}>
        <Table columns={columns} data={paginatedUsers} />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </Card>

      {/* KeepAsModal Allowed Modal: Destructive confirmation for banning user */}
      <Modal isOpen={!!banTarget} onClose={() => setBanTarget(null)} title={`Ban ${banTarget?.name || ''}`}>
        <div className="ad-form">
          <p className="ad-form__info">
            This will prevent the user from logging in or accessing any platform
            features. Please provide a reason for the ban.
          </p>
          <Textarea
            label="Reason"
            placeholder="Explain why this user is being banned..."
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            rows={3}
          />
          <div className="ad-form__actions">
            <Button variant="ghost" onClick={() => setBanTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBan} disabled={!banReason.trim() || banLoading}>
              {banLoading ? 'Banning...' : 'Confirm Ban'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Action confirmation for unbanning user */}
      <Modal isOpen={!!unbanTarget} onClose={() => setUnbanTarget(null)} title={`Unban ${unbanTarget?.name || ''}`}>
        <div className="ad-form">
          <p className="ad-form__info">
            This will restore full access for {unbanTarget?.name || 'this user'}.
          </p>
          <div className="ad-form__actions">
            <Button variant="ghost" onClick={() => setUnbanTarget(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleUnban} disabled={unbanLoading}>
              {unbanLoading ? 'Unbanning...' : 'Confirm Unban'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
