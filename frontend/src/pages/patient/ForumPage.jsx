import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Plus,
  ArrowBigUp,
  MessageCircle,
  Eye,
  Share2,
  Users,
  Flame,
  Clock,
  Heart,
  ShieldCheck,
  Compass,
  MessageSquareDashed,
  PenLine,
  Tag,
  X,
  Flag,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Pagination from '../../components/ui/Pagination';
import useToast from '../../components/ui/useToast';
import ReportPostModal from '../../components/forum/ReportPostModal';
import { forumService } from '../../services/forumService';
import { userService } from '../../services/userService';
import { forumBasePath } from '../../utils/forum';
import './Forum.css';

const TABS = [
  { id: 'trending', label: 'Trending' },
  { id: 'latest', label: 'Latest' },
  { id: 'following', label: 'Following' },
  { id: 'my', label: 'My Posts' },
];

const STOPWORDS = new Set([
  'this', 'that', 'with', 'from', 'have', 'been', 'were', 'they', 'them',
  'your', 'mine', 'ours', 'about', 'after', 'before', 'while', 'would',
  'could', 'should', 'there', 'their', 'where', 'when', 'what', 'does',
  'into', 'over', 'just', 'like', 'some', 'more', 'very', 'much', 'here',
  'help', 'need', 'want', 'know', 'feel', 'feeling',
]);

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// Engagement score with time decay, computed from real post metrics.
// Inferred formula (not from the Figma spec): reactions and replies weigh
// more than views, and older posts decay gently so fresh activity surfaces.
function trendingScore(post) {
  const created = new Date(post.createdAt).getTime();
  const ageHours = Number.isFinite(created)
    ? Math.max(1, (Date.now() - created) / 3600000)
    : 24;
  const engagement =
    (post.upVoteCount ?? 0) * 3 + (post.commentCount ?? 0) * 2 + (post.viewCount ?? 0) * 0.5;
  return engagement / Math.pow(ageHours + 2, 1.2);
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

// Topics are derived from actual post titles in the current feed —
// real content, not a static list. Posts have no tag field yet.
function extractTopics(posts) {
  const counts = {};
  posts.forEach((p) => {
    const words = (p.postTitle || '')
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w));
    new Set(words).forEach((w) => {
      counts[w] = (counts[w] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word, count]) => ({ word, count }));
}

export default function ForumPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('trending');
  const [topic, setTopic] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);
  const [page, setPage] = useState(1);
  const [reportPost, setReportPost] = useState(null);
  const PAGE_SIZE = 5;

  const forumBase = forumBasePath(currentRole);

  const fetchPosts = async (apiSort) => {
    setLoading(true);
    setError(null);
    try {
      const data = await forumService.list(apiSort, 1);
      setPosts(Array.isArray(data.posts) ? data.posts : []);
    } catch (err) {
      setError(err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Trending pulls the popular feed then re-ranks client-side with time decay;
    // every other tab is served fine by the recency feed.
    fetchPosts(tab === 'trending' ? 'popular' : 'recent');
  }, [tab]);

  // Resolve the signed-in user's id once for the "My Posts" filter
  useEffect(() => {
    (async () => {
      try {
        const data = await userService.me();
        setCurrentUserId(data?.user?.userId ?? null);
        setCurrentRole(data?.user?.role ?? null);
      } catch {
        setCurrentUserId(null);
        setCurrentRole(null);
      }
    })();
  }, []);

  useEffect(() => {
    if (location.state?.toast) {
      addToast(location.state.toast);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, addToast]);

  const visiblePosts = useMemo(() => {
    let list = [...posts];
    if (tab === 'my') {
      list = list.filter((p) => Number(p.userId) === Number(currentUserId));
    }
    if (topic) {
      const t = topic.toLowerCase();
      list = list.filter(
        (p) =>
          (p.postTitle || '').toLowerCase().includes(t) ||
          (p.content || '').toLowerCase().includes(t)
      );
    }
    if (tab === 'trending') {
      list.sort((a, b) => trendingScore(b) - trendingScore(a));
    }
    return list;
  }, [posts, tab, topic, currentUserId]);

  const topics = useMemo(() => extractTopics(posts), [posts]);

  const stats = useMemo(
    () => ({
      feedPosts: posts.length,
      postsToday: posts.filter((p) => isToday(p.createdAt)).length,
      reactions: posts.reduce((sum, p) => sum + (p.upVoteCount ?? 0), 0),
    }),
    [posts]
  );

  const totalPages = Math.ceil(visiblePosts.length / PAGE_SIZE) || 1;
  const paginatedPosts = visiblePosts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleUpvote = async (id) => {
    try {
      const result = await forumService.upvote(id);
      setPosts((prev) =>
        prev.map((p) =>
          p.postId === id ? { ...p, upvoted: result.upvoted, upVoteCount: result.upVoteCount } : p
        )
      );
    } catch (err) {
      addToast({ type: 'error', title: 'Upvote failed', message: err.message });
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    addToast({ type: 'info', title: 'Link copied', message: 'Post link copied to clipboard.' });
  };

  const handleReported = (postId) => {
    setPosts((prev) =>
      prev.map((p) => (p.postId === postId ? { ...p, reported: true } : p))
    );
  };

  const renderPostCard = (post) => {
    const preview = post.content
      ? post.content.length > 150
        ? post.content.slice(0, 150) + '...'
        : post.content
      : '';

    return (
      <Link
        key={post.postId}
        to={`${forumBase}/${post.postId}`}
        className="forum__post-link"
      >
        <Card hover className="forum__post">
          <div className="forum__post-head">
            <Avatar name={post.anonymousPost ? 'A' : post.authorName || 'User'} size="sm" />
            <div className="forum__post-head-text">
              <span className="forum__post-author">
                {post.authorName || (post.anonymousPost ? 'Anonymous' : 'User')}
              </span>
              <span className="forum__post-time">{timeAgo(post.createdAt)}</span>
            </div>
            {post.anonymousPost && <Badge variant="default">Anonymous</Badge>}
            {tab === 'trending' && (
              <span className="forum__post-rank">
                <Flame aria-hidden="true" />
              </span>
            )}
          </div>
          <h3 className="forum__post-title">{post.postTitle}</h3>
          <p className="forum__post-excerpt">{preview}</p>
          <div className="forum__post-stats">
            <button
              type="button"
              className={`forum__stat forum__stat--action${post.upvoted ? ' forum__stat--active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleUpvote(post.postId);
              }}
              aria-label="Upvote post"
              aria-pressed={post.upvoted}
            >
              <ArrowBigUp aria-hidden="true" /> {post.upVoteCount}
            </button>
            <span className="forum__stat">
              <MessageCircle aria-hidden="true" /> {post.commentCount ?? 0}
            </span>
            <span className="forum__stat">
              <Eye aria-hidden="true" /> {post.viewCount}
            </span>
            <button
              type="button"
              className="forum__stat forum__stat--action"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleShare();
              }}
              aria-label="Share post"
            >
              <Share2 aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`forum__stat forum__stat--action${post.reported ? ' forum__stat--reported' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setReportPost(post);
              }}
              aria-label={post.reported ? 'Post already reported' : 'Report post'}
              aria-pressed={post.reported}
              disabled={post.reported}
              title={post.reported ? 'Already reported' : 'Report post'}
            >
              <Flag aria-hidden="true" />
            </button>
          </div>
        </Card>
      </Link>
    );
  };

  const renderFeed = () => {
    if (loading) {
      return (
        <div className="forum__feed" aria-busy="true">
          {[1, 2, 3].map((n) => (
            <div key={n} className="forum__skeleton">
              <div className="forum__skeleton-line forum__skeleton-line--s" />
              <div className="forum__skeleton-line forum__skeleton-line--m" />
              <div className="forum__skeleton-line forum__skeleton-line--l" />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Card className="forum__empty">
          <div className="forum__empty-icon">
            <Compass aria-hidden="true" />
          </div>
          <p className="forum__empty-title">Couldn&rsquo;t load posts</p>
          <p className="forum__empty-desc">Check your connection and try again.</p>
          <Button
            variant="secondary"
            onClick={() => fetchPosts(tab === 'trending' ? 'popular' : 'recent')}
          >
            Retry
          </Button>
        </Card>
      );
    }

    if (tab === 'following') {
      // No follow system exists in the backend yet — honest empty state
      // instead of fabricated content, per the no-fake-data rule.
      return (
        <Card className="forum__empty">
          <div className="forum__empty-icon">
            <Users aria-hidden="true" />
          </div>
          <p className="forum__empty-title">Following isn&rsquo;t available yet</p>
          <p className="forum__empty-desc">
            You&rsquo;ll be able to follow favourite members and see their posts here
            once member following launches.
          </p>
          <Button variant="secondary" onClick={() => setTab('trending')}>
            Browse Trending
          </Button>
        </Card>
      );
    }

    if (tab === 'my' && visiblePosts.length === 0) {
      return (
        <Card className="forum__empty">
          <div className="forum__empty-icon">
            <PenLine aria-hidden="true" />
          </div>
          <p className="forum__empty-title">You haven&rsquo;t posted yet</p>
          <p className="forum__empty-desc">
            Share an experience or question — your posts will appear here.
          </p>
          <Button variant="primary" leftIcon={Plus} onClick={() => navigate(`${forumBase}/new`)}>
            Create Your First Post
          </Button>
        </Card>
      );
    }

    if (posts.length === 0) {
      return (
        <Card className="forum__empty">
          <div className="forum__empty-icon">
            <MessageSquareDashed aria-hidden="true" />
          </div>
          <p className="forum__empty-title">No posts yet</p>
          <p className="forum__empty-desc">
            The community is just getting started. Be the first to share something.
          </p>
          <Button variant="primary" leftIcon={Plus} onClick={() => navigate(`${forumBase}/new`)}>
            Create a Post
          </Button>
        </Card>
      );
    }

    if (topic && visiblePosts.length === 0) {
      return (
        <Card className="forum__empty">
          <div className="forum__empty-icon">
            <Tag aria-hidden="true" />
          </div>
          <p className="forum__empty-title">No posts match this topic yet</p>
          <p className="forum__empty-desc">Try another topic, or clear the filter to see everything.</p>
          <Button variant="secondary" onClick={() => setTopic(null)}>
            Clear Topic Filter
          </Button>
        </Card>
      );
    }

    if (visiblePosts.length === 0) {
      return (
        <Card className="forum__empty">
          <div className="forum__empty-icon">
            <MessageSquareDashed aria-hidden="true" />
          </div>
          <p className="forum__empty-title">Nothing here right now</p>
          <p className="forum__empty-desc">Check back soon or start a conversation yourself.</p>
          <Button variant="primary" leftIcon={Plus} onClick={() => navigate(`${forumBase}/new`)}>
            Create a Post
          </Button>
        </Card>
      );
    }

    return (
      <>
        {topic && (
          <div className="forum__topic-filter">
            <Tag aria-hidden="true" />
            <span>Topic: <strong>{topic}</strong></span>
            <button
              type="button"
              onClick={() => setTopic(null)}
              aria-label="Clear topic filter"
            >
              <X aria-hidden="true" />
            </button>
          </div>
        )}
        <div className="forum__feed">{paginatedPosts.map(renderPostCard)}</div>
        <Card className="forum__pagination-card">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={visiblePosts.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </Card>
      </>
    );
  };

  return (
    <div className="forum">
      {/* Page header */}
      <header className="forum__header">
        <div className="forum__header-text">
          <h1 className="forum__header-title">Community Forum</h1>
          <p className="forum__header-subtitle">
            A moderated, supportive space to share experiences with people who understand.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={Plus}
          onClick={() => navigate(`${forumBase}/new`)}
          className="forum__header-new-btn"
        >
          New Post
        </Button>
      </header>

      <div className="forum__layout">
        {/* Main column: tabs + feed */}
        <div className="forum__main">
          <div className="forum__tabs" role="tablist" aria-label="Filter posts">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                className={`forum__tab${tab === id ? ' forum__tab--active' : ''}`}
                onClick={() => {
                  setTab(id);
                  setPage(1);
                }}
              >
                {id === 'trending' && <Flame aria-hidden="true" />}
                {id === 'latest' && <Clock aria-hidden="true" />}
                {id === 'following' && <Users aria-hidden="true" />}
                {id === 'my' && <PenLine aria-hidden="true" />}
                <span>{label}</span>
              </button>
            ))}
          </div>

          {renderFeed()}
        </div>

        {/* Sidebar: stats, topics, guidelines */}
        <aside className="forum__sidebar" aria-label="Community information">
          <Card className="forum__side-card forum__stats">
            <h2 className="forum__side-title">
              <Users aria-hidden="true" /> Community Stats
            </h2>
            <ul className="forum__stats-list">
              <li className="forum__stat-row">
                <span className="forum__stat-label">Posts in feed</span>
                <span className="forum__stat-value">{stats.feedPosts}</span>
              </li>
              <li className="forum__stat-row">
                <span className="forum__stat-label">Posts today</span>
                <span className="forum__stat-value">{stats.postsToday}</span>
              </li>
              <li className="forum__stat-row">
                <span className="forum__stat-label">Reactions</span>
                <span className="forum__stat-value">{stats.reactions}</span>
              </li>
              <li className="forum__stat-row forum__stat-row--pending">
                <span className="forum__stat-label">Members</span>
                <span className="forum__stat-value forum__stat-value--pending">
                  &mdash;
                </span>
              </li>
            </ul>
            <p className="forum__stats-note">
              Feed stats are computed from the posts shown. Community-wide figures
              (including member count) are pending backend support.
            </p>
          </Card>

          {topics.length > 0 && (
            <Card className="forum__side-card forum__topics">
              <h2 className="forum__side-title">
                <Flame aria-hidden="true" /> Trending Topics
              </h2>
              <p className="forum__side-sub">
                Derived from what members are posting about right now.
              </p>
              <div className="forum__topic-list">
                {topics.map(({ word, count }) => (
                  <button
                    key={word}
                    type="button"
                    className={`forum__topic-chip${topic === word ? ' forum__topic-chip--active' : ''}`}
                    onClick={() => setTopic(topic === word ? null : word)}
                    aria-pressed={topic === word}
                  >
                    #{word}
                    <span className="forum__topic-count">{count}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          <Card className="forum__side-card forum__guidelines">
            <h2 className="forum__side-title">
              <ShieldCheck aria-hidden="true" /> Safe Space Guidelines
            </h2>
            <ul className="forum__guidelines-list">
              <li>Be kind and respectful — everyone here is on their own journey.</li>
              <li>No judgment, diagnosis, or medical advice; share experience, not prescriptions.</li>
              <li>Keep others&rsquo; stories confidential, even if posts are public.</li>
              <li>If you see something harmful, report it so moderators can respond.</li>
              <li>In crisis, skip the forum and reach out to emergency services.</li>
            </ul>
            <p className="forum__guidelines-foot">
              <Heart aria-hidden="true" /> Moderated by the Healing Horizon care team.
            </p>
          </Card>
        </aside>
      </div>

      <ReportPostModal
        post={reportPost}
        onClose={() => setReportPost(null)}
        onReported={handleReported}
      />
    </div>
  );
}
