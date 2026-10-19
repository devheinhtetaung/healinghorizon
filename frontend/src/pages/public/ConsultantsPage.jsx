import { useState, useEffect } from 'react';
import { Search, Star, BadgeCheck } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import useToast from '../../components/ui/useToast';
import { consultantService } from '../../services/consultantService';
import './InfoPage.css';
import './ConsultantsPage.css';

export default function ConsultantsPage() {
  const { addToast } = useToast();
  const [consultants, setConsultants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

  const fetchConsultants = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await consultantService.list();
      setConsultants(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load consultants');
      setConsultants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConsultants(); }, []);

  const filtered = consultants.filter((c) =>
    (c.name || '').toLowerCase().includes(query.toLowerCase()) ||
    (c.biography || '').toLowerCase().includes(query.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const paginatedConsultants = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="info-page">
      <div className="info-page__header">
        <h1 className="info-page__title">Our Consultants</h1>
        <p className="info-page__subtitle">
          Licensed mental health professionals dedicated to supporting your mental health and wellbeing.
        </p>
      </div>

      <div className="consultants-search">
        <Input
          leftIcon={Search}
          placeholder="Search by name or specialty"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          aria-label="Search consultants"
        />
      </div>

      {/* --- loading skeletons --- */}
      {loading && (
        <div className="consultants-skeleton" aria-busy="true" aria-label="Loading consultants">
          {[1, 2, 3].map((n) => (
            <div key={n} className="consultants-skeleton__card">
              <div className="consultants-skeleton__row">
                <div className="consultants-skeleton__avatar" />
                <div className="consultants-skeleton__lines">
                  <div className="consultants-skeleton__line consultants-skeleton__line--short" />
                  <div className="consultants-skeleton__line consultants-skeleton__line--long" />
                </div>
              </div>
              <div className="consultants-skeleton__block" />
            </div>
          ))}
        </div>
      )}

      {/* --- error state --- */}
      {!loading && error && (
        <div className="consultants-state">
          <h2 className="consultants-state__title">Couldn&rsquo;t load consultants</h2>
          <p className="consultants-state__text">
            Something went wrong while fetching the consultant directory.
            Check your connection and try again.
          </p>
          <Button variant="secondary" onClick={fetchConsultants}>
            Retry
          </Button>
        </div>
      )}

      {/* --- empty state --- */}
      {!loading && !error && filtered.length === 0 && (
        <div className="consultants-state">
          <h2 className="consultants-state__title">
            {query ? 'No consultants match your search' : 'No consultants available right now'}
          </h2>
          <p className="consultants-state__text">
            {query
              ? 'Try a different name or specialty.'
              : 'New consultants join regularly — check back soon.'}
          </p>
          {query && (
            <Button variant="ghost" onClick={() => setQuery('')}>
              Clear search
            </Button>
          )}
        </div>
      )}

      {/* --- results --- */}
      {!loading && !error && filtered.length > 0 && (
        <>
          <div className="consultants-grid">
            {paginatedConsultants.map((c) => (
              <Card key={c.consultantId} hover className="consultants-card">
                <div className="consultants-card__top">
                  <Avatar name={c.name} src={c.avatarUrl} size="md" />
                  {c.isVerified && (
                    <span className="consultants-card__verified">
                      <BadgeCheck aria-hidden="true" /> Verified
                    </span>
                  )}
                </div>
                <div className="consultants-card__body">
                  <p className="consultants-card__name">{c.name}</p>
                  <p className="consultants-card__bio">
                    {c.biography || 'Licensed mental health consultant'}
                  </p>
                </div>
                <div className="consultants-card__foot">
                  <Badge variant="success" className="consultants-card__rating">
                    <Star aria-hidden="true" />
                    {Number(c.rating).toFixed(1)}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>

          <Card style={{ marginTop: 'var(--space-4)', overflow: 'hidden' }}>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </Card>
        </>
      )}
    </div>
  );
}
