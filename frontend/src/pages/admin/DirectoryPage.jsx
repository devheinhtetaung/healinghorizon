import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, Building2, UserRound, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import useToast from '../../components/ui/useToast';
import { adminService } from '../../services/adminService';
import './Admin.css';

export default function DirectoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const [tab, setTab] = useState('hospitals');

  const [hospitals, setHospitals] = useState([]);
  const [hLoading, setHLoading] = useState(true);
  const [hQuery, setHQuery] = useState('');
  const [hPage, setHPage] = useState(1);
  const [removeHospital, setRemoveHospital] = useState(null);

  const [psychiatrists, setPsychiatrists] = useState([]);
  const [pLoading, setPLoading] = useState(true);
  const [pQuery, setPQuery] = useState('');
  const [pPage, setPPage] = useState(1);
  const [removePsychiatrist, setRemovePsychiatrist] = useState(null);

  const PAGE_SIZE = 5;

  const fetchHospitals = async () => {
    setHLoading(true);
    try {
      const data = await adminService.getHospitals();
      setHospitals(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setHLoading(false);
    }
  };

  const fetchPsychiatrists = async () => {
    setPLoading(true);
    try {
      const data = await adminService.getPsychiatrists();
      setPsychiatrists(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setPLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
    fetchPsychiatrists();
  }, []);

  useEffect(() => {
    if (location.state?.toast) {
      addToast(location.state.toast);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, addToast]);

  const filteredHospitals = hospitals.filter(
    (h) =>
      (h.hospitalName || h.name || '').toLowerCase().includes(hQuery.toLowerCase()) ||
      (h.city || '').toLowerCase().includes(hQuery.toLowerCase())
  );

  const totalHPages = Math.ceil(filteredHospitals.length / PAGE_SIZE) || 1;
  const paginatedHospitals = filteredHospitals.slice((hPage - 1) * PAGE_SIZE, hPage * PAGE_SIZE);

  const filteredPsychiatrists = psychiatrists.filter(
    (p) =>
      (p.psychiatristName || p.name || '').toLowerCase().includes(pQuery.toLowerCase()) ||
      (p.hospital || '').toLowerCase().includes(pQuery.toLowerCase())
  );

  const totalPPages = Math.ceil(filteredPsychiatrists.length / PAGE_SIZE) || 1;
  const paginatedPsychiatrists = filteredPsychiatrists.slice((pPage - 1) * PAGE_SIZE, pPage * PAGE_SIZE);

  const handleRemoveHospital = () => {
    if (!removeHospital) return;
    setHospitals((prev) => prev.filter((h) => h.hospitalId !== removeHospital.hospitalId));
    addToast({
      type: 'success',
      title: 'Removed',
      message: `${removeHospital.hospitalName || removeHospital.name} has been removed.`,
    });
    setRemoveHospital(null);
  };

  const handleRemovePsychiatrist = () => {
    if (!removePsychiatrist) return;
    setPsychiatrists((prev) => prev.filter((p) => p.psychiatristId !== removePsychiatrist.psychiatristId));
    addToast({
      type: 'success',
      title: 'Removed',
      message: `${removePsychiatrist.psychiatristName || removePsychiatrist.name} has been removed.`,
    });
    setRemovePsychiatrist(null);
  };

  const hospitalCols = [
    { key: 'name', label: 'Hospital', render: (_val, row) => row.hospitalName || row.name },
    { key: 'city', label: 'City' },
    { key: 'address', label: 'Address' },
    {
      key: 'id',
      label: 'Actions',
      render: (_v, row) => (
        <Button
          variant="destructive"
          size="sm"
          leftIcon={Trash2}
          onClick={() => setRemoveHospital(row)}
        >
          Remove
        </Button>
      ),
    },
  ];

  const psychiatristCols = [
    { key: 'name', label: 'Name', render: (_val, row) => row.psychiatristName || row.name },
    { key: 'hospital', label: 'Affiliated Hospital' },
    {
      key: 'id',
      label: 'Actions',
      render: (_v, row) => (
        <Button
          variant="destructive"
          size="sm"
          leftIcon={Trash2}
          onClick={() => setRemovePsychiatrist(row)}
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <div className="ad-list">
      <h1 className="page-title">Directory</h1>
      <div className="ad-dir__tabs">
        <button
          type="button"
          className={`ad-dir__tab${tab === 'hospitals' ? ' ad-dir__tab--active' : ''}`}
          onClick={() => setTab('hospitals')}
        >
          <Building2 aria-hidden="true" /> Hospitals
        </button>
        <button
          type="button"
          className={`ad-dir__tab${tab === 'psychiatrists' ? ' ad-dir__tab--active' : ''}`}
          onClick={() => setTab('psychiatrists')}
        >
          <UserRound aria-hidden="true" /> Psychiatrists
        </button>
      </div>

      {tab === 'hospitals' && (
        <>
          <div className="ad-list__toolbar">
            <div className="ad-list__search">
              <Input
                leftIcon={Search}
                placeholder="Search hospitals..."
                value={hQuery}
                onChange={(e) => { setHQuery(e.target.value); setHPage(1); }}
                aria-label="Search hospitals"
              />
            </div>
            <Button
              variant="primary"
              leftIcon={Plus}
              onClick={() => navigate('/admin/directory/hospitals/new')}
            >
              Add Hospital
            </Button>
          </div>
          {hLoading ? (
            <p style={{ color: 'var(--color-muted-foreground)', padding: 'var(--space-5)' }}>
              Loading hospitals...
            </p>
          ) : (
            <Card style={{ overflow: 'hidden' }}>
              <Table columns={hospitalCols} data={paginatedHospitals} />
              <Pagination
                currentPage={hPage}
                totalPages={totalHPages}
                totalItems={filteredHospitals.length}
                pageSize={PAGE_SIZE}
                onPageChange={setHPage}
              />
            </Card>
          )}
        </>
      )}

      {tab === 'psychiatrists' && (
        <>
          <div className="ad-list__toolbar">
            <div className="ad-list__search">
              <Input
                leftIcon={Search}
                placeholder="Search psychiatrists..."
                value={pQuery}
                onChange={(e) => { setPQuery(e.target.value); setPPage(1); }}
                aria-label="Search psychiatrists"
              />
            </div>
            <Button
              variant="primary"
              leftIcon={Plus}
              onClick={() => navigate('/admin/directory/psychiatrists/new')}
            >
              Add Psychiatrist
            </Button>
          </div>
          {pLoading ? (
            <p style={{ color: 'var(--color-muted-foreground)', padding: 'var(--space-5)' }}>
              Loading psychiatrists...
            </p>
          ) : (
            <Card style={{ overflow: 'hidden' }}>
              <Table columns={psychiatristCols} data={paginatedPsychiatrists} />
              <Pagination
                currentPage={pPage}
                totalPages={totalPPages}
                totalItems={filteredPsychiatrists.length}
                pageSize={PAGE_SIZE}
                onPageChange={setPPage}
              />
            </Card>
          )}
        </>
      )}

      {/* Destructive Confirmations */}
      <Modal
        isOpen={!!removeHospital}
        onClose={() => setRemoveHospital(null)}
        title="Remove Hospital"
      >
        <div className="ad-form">
          <p className="ad-form__info">
            Are you sure you want to remove{' '}
            <strong>{removeHospital?.hospitalName || removeHospital?.name || ''}</strong>?
          </p>
          <div className="ad-form__actions">
            <Button variant="ghost" onClick={() => setRemoveHospital(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveHospital}>
              Remove
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!removePsychiatrist}
        onClose={() => setRemovePsychiatrist(null)}
        title="Remove Psychiatrist"
      >
        <div className="ad-form">
          <p className="ad-form__info">
            Are you sure you want to remove{' '}
            <strong>{removePsychiatrist?.psychiatristName || removePsychiatrist?.name || ''}</strong>?
          </p>
          <div className="ad-form__actions">
            <Button variant="ghost" onClick={() => setRemovePsychiatrist(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemovePsychiatrist}>
              Remove
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
