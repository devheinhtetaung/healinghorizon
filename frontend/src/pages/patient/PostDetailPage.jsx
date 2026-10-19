import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowBigUp, MessageCircle, Eye, Share2, Send, FileQuestion, MessageSquareDashed, Flag } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Input from '../../components/ui/Input';
import useToast from '../../components/ui/useToast';
import ReportPostModal from '../../components/forum/ReportPostModal';
import { forumService } from '../../services/forumService';
import { userService } from '../../services/userService';
import { forumBasePath } from '../../utils/forum';
import './PostDetail.css';

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

export default function PostDetailPage() {
  const { id } = useParams();
  const { addToast } = useToast();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  const [commentText, setCommentText] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [commentError, setCommentError] = useState('');

  const [reportOpen, setReportOpen] = useState(false);

  const forumBase = forumBasePath(currentUser?.role);

  const fetchPostDetails = async () => {
    setLoading(true);
    setNotFound(false);
    setError(null);
    try {
      const [postData, commentsData, userData] = await Promise.all([
        forumService.getPost(id),
        forumService.getComments(id).catch(() => []),
        userService.me().catch(() => ({ user: null })),
      ]);

      setPost(postData);
      setComments(Array.isArray(commentsData) ? commentsData : []);
      setCurrentUser(userData.user);
    } catch (err) {
      if (err.status === 404 || /not found/i.test(err.message)) {
        setNotFound(true);
      } else {
        setError(err.message || 'Failed to load post');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostDetails();
  }, [id]);

  const handleUpvote = async () => {
    if (!post) return;
    try {
      const result = await forumService.upvote(post.postId);
      setPost((prev) => ({
        ...prev,
        upvoted: result.upvoted,
        upVoteCount: result.upVoteCount,
      }));
    } catch (err) {
      addToast({ type: 'error', title: 'Upvote failed', message: err.message });
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    addToast({ type: 'info', title: 'Link copied', message: 'Post link copied to clipboard.' });
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) {
      setCommentError('Please enter a comment.');
      return;
    }
    setCommenting(true);
    setCommentError('');
    try {
      const result = await forumService.addComment(id, trimmed);
      setComments((prev) => [
        ...prev,
        {
          commentId: result.commentId,
          commentBy: currentUser?.name || 'You',
          comment: trimmed,
          createdAt: new Date().toISOString(),
        },
      ]);
      setPost((prev) => (prev ? { ...prev, commentCount: (prev.commentCount || 0) + 1 } : prev));
      setCommentText('');
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to add comment', message: err.message });
    } finally {
      setCommenting(false);
    }
  };

  /* ─── State 1: Loading Skeleton ─── */
  if (loading) {
    return (
      <div className="post-detail" aria-busy="true">
        <Link to={forumBase} className="post-detail__back">
          <ArrowLeft aria-hidden="true" /> Back to forum
        </Link>
        <Card className="post-detail__post">
          <div className="post-detail__skeleton">
            <div className="post-detail__skeleton-line post-detail__skeleton-line--s" />
            <div className="post-detail__skeleton-line post-detail__skeleton-line--title" />
            <div className="post-detail__skeleton-line post-detail__skeleton-line--l" />
            <div className="post-detail__skeleton-line post-detail__skeleton-line--l" />
          </div>
        </Card>
        <div className="post-detail__comments">
          <div className="post-detail__skeleton-line post-detail__skeleton-line--s" />
        </div>
      </div>
    );
  }

  /* ─── State 2: Not Found (404) ─── */
  if (notFound) {
    return (
      <div className="post-detail">
        <Link to={forumBase} className="post-detail__back">
          <ArrowLeft aria-hidden="true" /> Back to forum
        </Link>
        <Card className="post-detail__empty">
          <div className="post-detail__empty-icon">
            <FileQuestion aria-hidden="true" />
          </div>
          <p className="post-detail__empty-title">Post Not Found</p>
          <p className="post-detail__empty-desc">
            This post does not exist, may have been removed, or the link you followed is invalid.
          </p>
          <Link to={forumBase}>
            <Button variant="primary">Return to Community Forum</Button>
          </Link>
        </Card>
      </div>
    );
  }

  /* ─── State 3: Network Error ─── */
  if (error) {
    return (
      <div className="post-detail">
        <Link to={forumBase} className="post-detail__back">
          <ArrowLeft aria-hidden="true" /> Back to forum
        </Link>
        <Card className="post-detail__empty">
          <div className="post-detail__empty-icon">
            <FileQuestion aria-hidden="true" />
          </div>
          <p className="post-detail__empty-title">Couldn&rsquo;t load this post</p>
          <p className="post-detail__empty-desc">Check your connection and try again.</p>
          <Button variant="secondary" onClick={fetchPostDetails}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  /* ─── State 4: Loaded with Comments ─── */
  return (
    <div className="post-detail">
      <Link to={forumBase} className="post-detail__back">
        <ArrowLeft aria-hidden="true" /> Back to forum
      </Link>

      <Card raised className="post-detail__post">
        <div className="post-detail__post-head">
          <Avatar name={post.anonymousPost ? 'A' : post.authorName || 'User'} size="md" />
          <div className="post-detail__post-head-text">
            <p className="post-detail__post-author">
              {post.authorName || (post.anonymousPost ? 'Anonymous' : 'User')}
            </p>
            <span className="post-detail__post-time">{timeAgo(post.createdAt)}</span>
          </div>
          {post.anonymousPost && <Badge variant="default">Anonymous</Badge>}
        </div>

        <h1 className="post-detail__post-title">
          {post.postTitle}
        </h1>

        <p className="post-detail__post-content">
          {post.content}
        </p>

        <div className="post-detail__post-stats">
          <button
            type="button"
            className={`post-detail__stat post-detail__stat--action${post.upvoted ? ' post-detail__stat--active' : ''}`}
            onClick={handleUpvote}
            aria-label="Upvote post"
            aria-pressed={post.upvoted}
          >
            <ArrowBigUp aria-hidden="true" /> {post.upVoteCount}
          </button>
          <span className="post-detail__stat">
            <MessageCircle aria-hidden="true" /> {comments.length}
          </span>
          <span className="post-detail__stat">
            <Eye aria-hidden="true" /> {post.viewCount}
          </span>
          <button
            type="button"
            className="post-detail__stat post-detail__stat--action"
            onClick={handleShare}
            aria-label="Share post"
          >
            <Share2 aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`post-detail__stat post-detail__stat--action${post.reported ? ' post-detail__stat--reported' : ''}`}
            onClick={() => setReportOpen(true)}
            aria-label={post.reported ? 'Post already reported' : 'Report post'}
            aria-pressed={post.reported}
            disabled={post.reported}
            title={post.reported ? 'Already reported' : 'Report post'}
          >
            <Flag aria-hidden="true" />
          </button>
        </div>
      </Card>

      <div className="post-detail__comments">
        <h2 className="post-detail__comments-title">
          Comments ({comments.length})
        </h2>

        <form className="post-detail__comment-form" onSubmit={handleAddComment}>
          <Input
            placeholder="Add a supportive comment..."
            value={commentText}
            onChange={(e) => {
              setCommentText(e.target.value);
              if (commentError) setCommentError('');
            }}
            error={commentError}
            aria-label="Add a comment"
          />
          <Button
            type="submit"
            variant="primary"
            disabled={!commentText.trim() || commenting}
            loading={commenting}
            className="post-detail__comment-btn"
            aria-label="Post comment"
          >
            <Send aria-hidden="true" />
          </Button>
        </form>

        <ul className="post-detail__comment-list">
          {comments.length === 0 ? (
            <li className="post-detail__comment post-detail__comment--empty">
              <div className="post-detail__empty-icon post-detail__empty-icon--sm">
                <MessageSquareDashed aria-hidden="true" />
              </div>
              <div>
                <p className="post-detail__empty-title">No comments yet</p>
                <p className="post-detail__empty-desc">
                  Be the first to respond with a supportive word.
                </p>
              </div>
            </li>
          ) : (
            comments.map((c) => (
              <li key={c.commentId || c.createdAt} className="post-detail__comment">
                <Avatar name={c.authorName || c.commentBy || 'User'} size="sm" />
                <div className="post-detail__comment-body">
                  <div className="post-detail__comment-meta">
                    <span className="post-detail__comment-author">{c.authorName || c.commentBy || 'User'}</span>
                    <span className="post-detail__comment-time">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="post-detail__comment-text">{c.comment}</p>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <ReportPostModal
        post={reportOpen ? post : null}
        onClose={() => setReportOpen(false)}
        onReported={() => setPost((prev) => (prev ? { ...prev, reported: true } : prev))}
      />
    </div>
  );
}
