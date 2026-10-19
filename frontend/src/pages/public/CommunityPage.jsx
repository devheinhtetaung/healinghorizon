import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, MessageCircle, Eye } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import { forumService } from '../../services/forumService';
import './InfoPage.css';

export default function CommunityPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 4;

  const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await forumService.list('recent', 1);
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch (err) {
      setError(err.message || 'Failed to load posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const totalPages = Math.ceil(posts.length / PAGE_SIZE) || 1;
  const paginatedPosts = posts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="info-page">
      <div className="info-page__header">
        <h1 className="info-page__title">Wellness Community</h1>
        <p className="info-page__subtitle">
          A safe space to share experiences, ask questions, and support one another.
        </p>
      </div>

      {/* --- loading --- */}
      {loading && (
        <div className="community-skeleton" aria-busy="true">
          {[1, 2].map((n) => (
            <div key={n} className="community-skeleton__card">
              <div className="community-skeleton__line community-skeleton__line--short" />
              <div className="community-skeleton__line community-skeleton__line--long" />
              <div className="community-skeleton__line community-skeleton__line--long" />
              <div className="community-skeleton__block" />
            </div>
          ))}
        </div>
      )}

      {/* --- error --- */}
      {!loading && error && (
        <div className="consultants-state">
          <h2 className="consultants-state__title">Couldn&rsquo;t load community posts</h2>
          <p className="consultants-state__text">
            Something went wrong. Check your connection and try again.
          </p>
          <Button variant="secondary" onClick={fetchPosts}>
            Retry
          </Button>
        </div>
      )}

      {/* --- empty --- */}
      {!loading && !error && posts.length === 0 && (
        <div className="consultants-state">
          <h2 className="consultants-state__title">No posts yet</h2>
          <p className="consultants-state__text">
            Register and log in to start a conversation with the community.
          </p>
          <Link to="/register">
            <Button variant="primary">Join the Community</Button>
          </Link>
        </div>
      )}

      {/* --- results --- */}
      {!loading && !error && posts.length > 0 && (
        <>
          <div className="community-grid">
            {paginatedPosts.map((p) => {
              const preview = p.content
                ? p.content.length > 150
                  ? p.content.slice(0, 150) + '...'
                  : p.content
                : 'No preview available.';

              return (
                <Link
                  key={p.postId}
                  to={`/community/${p.postId}`}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                >
                  <Card hover className="community-post">
                    <div className="community-post__meta">
                      <span className="community-post__author">{p.authorName || 'Anonymous'}</span>
                      <span className="community-post__dot" aria-hidden="true" />
                      <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="community-post__title">{p.postTitle}</h3>
                    <p className="community-post__preview">{preview}</p>
                    <div className="community-post__stats">
                      <span className="community-post__stat">
                        <ThumbsUp aria-hidden="true" /> {p.upVoteCount}
                      </span>
                      <span className="community-post__stat">
                        <MessageCircle aria-hidden="true" /> {p.commentCount}
                      </span>
                      <span className="community-post__stat">
                        <Eye aria-hidden="true" /> {p.viewCount}
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          <Card style={{ marginTop: 'var(--space-4)', overflow: 'hidden' }}>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={posts.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </Card>

          <div className="community-action">
            <Link to="/register">
              <Button variant="primary" size="lg">
                Join the Community
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
