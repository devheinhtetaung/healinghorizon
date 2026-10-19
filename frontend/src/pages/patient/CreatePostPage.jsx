import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquarePlus, ShieldCheck } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import useToast from '../../components/ui/useToast';
import { forumService } from '../../services/forumService';
import { userService } from '../../services/userService';
import { forumBasePath } from '../../utils/forum';
import './Forum.css';

export default function CreatePostPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [currentRole, setCurrentRole] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const forumBase = forumBasePath(currentRole);

  useEffect(() => {
    (async () => {
      try {
        const data = await userService.me();
        setCurrentRole(data?.user?.role ?? null);
      } catch {
        setCurrentRole(null);
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setFormError('Please add a title and some content.');
      return;
    }

    setLoading(true);
    try {
      await forumService.create({
        postTitle: title.trim(),
        content: content.trim(),
        anonymousPost: anonymous,
      });

      navigate(forumBase, {
        state: {
          toast: {
            type: 'success',
            title: 'Post published',
            message: 'Your post is now live in the community.',
          },
        },
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Failed to publish',
        message: err.message || 'Could not publish post.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forum-page">
      <Link to={forumBase} className="forum__back">
        <ArrowLeft aria-hidden="true" /> Back to Forum
      </Link>

      <Card raised className="forum-page__card">
        <div>
          <h1 className="forum-page__title">
            <MessageSquarePlus aria-hidden="true" /> Compose Community Post
          </h1>
          <p className="forum-page__subtitle">
            Share your thoughts, experiences, or questions with fellow members in a supportive space.
          </p>
        </div>

        <form className="forum__new-form" onSubmit={handleSubmit} noValidate>
          <Input
            label="Title"
            placeholder="Give your post a clear title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (formError) setFormError('');
            }}
          />

          <Textarea
            label="Content"
            placeholder="Share your thoughts, experiences, or questions..."
            rows={6}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (formError) setFormError('');
            }}
          />

          <label className="forum__anon-toggle">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
            />
            <span className="forum__anon-cue" />
            <span className="forum__anon-label">Post anonymously</span>
          </label>

          {formError && (
            <p className="forum__form-error" role="alert">
              {formError}
            </p>
          )}

          <div className="forum__new-actions">
            <Button variant="ghost" type="button" onClick={() => navigate(forumBase)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading} disabled={loading}>
              Publish Post
            </Button>
          </div>
        </form>

        <p className="forum__guidelines-foot">
          <ShieldCheck aria-hidden="true" />
          Posts are moderated to keep the community safe and supportive.
        </p>
      </Card>
    </div>
  );
}
