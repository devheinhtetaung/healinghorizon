import { useState } from 'react';
import { Flag } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Select from '../ui/Select';
import useToast from '../ui/useToast';
import { forumService } from '../../services/forumService';
import './ReportPostModal.css';

const REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harmful', label: 'Harmful content' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'other', label: 'Other' },
];

export default function ReportPostModal({ post, onClose, onReported }) {
  const { addToast } = useToast();
  const [reason, setReason] = useState('spam');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!post) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await forumService.report(post.postId, reason);
      addToast({
        type: 'success',
        title: 'Report submitted',
        message: 'Thank you — our moderators will review this post.',
      });
      onReported?.(post.postId);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={!!post} onClose={onClose} title="Report this post">
      <form className="report-post" onSubmit={handleSubmit} noValidate>
        <div className="report-post__intro">
          <Flag aria-hidden="true" className="report-post__intro-icon" />
          <p>
            Reported posts are reviewed by our moderators. The post stays visible
            until a moderator takes action.
          </p>
        </div>

        <Select
          label="Reason"
          options={REASONS}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError('');
          }}
          helperText="Choose the closest match."
        />

        {error && <p className="report-post__error" role="alert">{error}</p>}

        <div className="report-post__actions">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting} disabled={submitting}>
            Submit Report
          </Button>
        </div>
      </form>
    </Modal>
  );
}
