import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, Trash2, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import useToast from '../../components/ui/useToast';
import { adminService } from '../../services/adminService';
import SurveyResults from './SurveyResults';
import './Admin.css';

export default function SurveysPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  const [expandedId, setExpandedId] = useState(null);
  const [responses, setResponses] = useState(null);
  const [responsesLoading, setResponsesLoading] = useState(false);

  const [createdSurveyData, setCreatedSurveyData] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const data = await adminService.getSurveys();
      setSurveys(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, []);

  useEffect(() => {
    if (location.state?.showSuccessModal && location.state?.createdSurvey) {
      setCreatedSurveyData(location.state.createdSurvey);
      window.history.replaceState({}, document.title);
    } else if (location.state?.toast) {
      addToast(location.state.toast);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, addToast]);

  useEffect(() => {
    if (expandedId === null) {
      setResponses(null);
      return;
    }
    let cancelled = false;
    const fetchResponses = async () => {
      setResponsesLoading(true);
      try {
        const data = await adminService.getSurveyResponses(expandedId);
        if (!cancelled) setResponses(data);
      } catch (err) {
        if (!cancelled)
          addToast({ type: 'error', title: 'Error', message: err.message });
      } finally {
        if (!cancelled) setResponsesLoading(false);
      }
    };
    fetchResponses();
    return () => {
      cancelled = true;
    };
  }, [expandedId, addToast]);

  const filtered = surveys.filter((s) =>
    (s.title || '').toLowerCase().includes(query.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginatedSurveys = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDeleteSurvey = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      setSurveys((prev) => prev.filter((s) => s.surveyId !== deleteTarget.surveyId));
      addToast({
        type: 'success',
        title: 'Survey deleted',
        message: `${deleteTarget.title} has been deleted.`,
      });
      setDeleteTarget(null);
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Title',
    },
    {
      key: 'questionCount',
      label: 'Questions',
      render: (val) => <Badge variant="default">{val}</Badge>,
    },
    {
      key: 'responseCount',
      label: 'Responses',
      render: (val) => <Badge variant={val > 0 ? 'success' : 'warning'}>{val}</Badge>,
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_v, row) => (
        <Button
          variant="destructive"
          size="sm"
          leftIcon={Trash2}
          onClick={() => setDeleteTarget(row)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div className="ad-list">
      <h1 className="page-title">Surveys</h1>
      <div className="ad-list__toolbar">
        <div className="ad-list__search">
          <Input
            leftIcon={Search}
            placeholder="Search surveys..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            aria-label="Search surveys"
          />
        </div>
        <Button
          variant="primary"
          leftIcon={Plus}
          onClick={() => navigate('/admin/surveys/new')}
        >
          Create Survey
        </Button>
      </div>

      {expandedId !== null && (
        <Card className="ad-surveys__responses">
          <div className="ad-dash__section-head">
            <h2 className="ad-dash__section-title">
              Responses: {surveys.find((s) => s.surveyId === expandedId)?.title || ''}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => setExpandedId(null)}>
              Close
            </Button>
          </div>
          {responsesLoading ? (
            <Spinner />
          ) : responses ? (
            <SurveyResults
              responseCount={surveys.find((s) => s.surveyId === expandedId)?.responseCount || 0}
              questions={responses}
            />
          ) : null}
        </Card>
      )}

      {loading ? (
        <p style={{ color: 'var(--color-muted-foreground)', padding: 'var(--space-5)' }}>
          Loading surveys...
        </p>
      ) : (
        <Card style={{ overflow: 'hidden' }}>
          <Table
            columns={columns}
            data={paginatedSurveys.map((s) => ({
              ...s,
              title: (
                <button
                  type="button"
                  className="ad-surveys__title-btn"
                  onClick={() => setExpandedId(expandedId === s.surveyId ? null : s.surveyId)}
                  aria-expanded={expandedId === s.surveyId}
                >
                  <span>{s.title}</span>
                  {expandedId === s.surveyId ? (
                    <ChevronUp aria-hidden="true" />
                  ) : (
                    <ChevronDown aria-hidden="true" />
                  )}
                </button>
              ),
            }))}
          />
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
        isOpen={!!createdSurveyData}
        onClose={() => setCreatedSurveyData(null)}
        title="Survey Created"
      >
        <div className="ad-form" style={{ textAlign: 'center', alignItems: 'center' }}>
          <div style={{ color: 'var(--color-success)', marginBottom: 'var(--space-2)' }}>
            <CheckCircle style={{ width: '3rem', height: '3rem' }} aria-hidden="true" />
          </div>
          <p className="ad-form__info" style={{ textAlign: 'center' }}>
            Survey &ldquo;<strong>{createdSurveyData?.title}</strong>&rdquo; has been created and is now live.
          </p>
          <div className="ad-form__actions" style={{ justifyContent: 'center', marginTop: 'var(--space-3)' }}>
            <Button variant="primary" onClick={() => setCreatedSurveyData(null)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Destructive confirmation modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Survey"
      >
        <div className="ad-form">
          <p className="ad-form__info">
            Are you sure you want to delete &ldquo;<strong>{deleteTarget?.title}</strong>&rdquo;? This action cannot be undone.
          </p>
          <div className="ad-form__actions">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" loading={deleteLoading} onClick={handleDeleteSurvey}>
              Delete Survey
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
