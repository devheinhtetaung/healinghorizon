import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Star, Check } from 'lucide-react';
import Card from '../../components/ui/Card';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Textarea from '../../components/ui/Textarea';
import Spinner from '../../components/ui/Spinner';
import useToast from '../../components/ui/useToast';
import { feedbackService } from '../../services/feedbackService';
import { appointmentService } from '../../services/appointmentService';
import './Feedback.css';

export default function FeedbackPage() {
  const { appointmentId } = useParams();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const appointments = await appointmentService.list();
        const found = Array.isArray(appointments) && appointments.find((a) => String(a.appointmentId || a.id) === String(appointmentId));
        if (found) {
          setAppointment(found);
        } else {
          setAppointment({
            consultantName: searchParams.get('consultant') || searchParams.get('consultantName') || '',
            appointmentDate: searchParams.get('date') || '',
            appointmentTime: searchParams.get('time') || '',
          });
        }
      } catch {
        setAppointment({
          consultantName: searchParams.get('consultant') || searchParams.get('consultantName') || '',
          appointmentDate: searchParams.get('date') || '',
          appointmentTime: searchParams.get('time') || '',
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await feedbackService.create({ appointmentId: Number(appointmentId), rating, comment });
      setSubmitted(true);
    } catch (err) {
      addToast({ type: 'error', title: 'Submission failed', message: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="feedback">
        <div className="forum__loading"><Spinner size="lg" label="Loading appointment details" /></div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="feedback">
        <Card className="feedback__success">
          <div className="feedback__success-icon"><Check aria-hidden="true" /></div>
          <h2 className="feedback__success-title">Thank you for your feedback!</h2>
          <p className="feedback__success-text">Your ratings help us improve the quality of care and match members with the right consultants.</p>
          <div className="feedback__success-rating" aria-label={`You rated ${rating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className={`feedback__star-preview${n <= rating ? ' feedback__star-preview--filled' : ''}`} aria-hidden="true" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="feedback">
      <h1 className="page-title">Feedback</h1>
      <div className="feedback__layout">
        <Card className="feedback__info-card">
          <p className="feedback__info-label">Appointment #{appointmentId}</p>
          <div className="feedback__consultant">
            <Avatar name={appointment?.consultantName || ''} size="lg" />
            <div>
              <p className="feedback__consultant-name">{appointment?.consultantName || 'N/A'}</p>
            </div>
          </div>
          <div className="feedback__meta">
            <div className="feedback__meta-row"><span className="feedback__meta-key">Date</span><span className="feedback__meta-val">{appointment?.appointmentDate || ''}</span></div>
            <div className="feedback__meta-row"><span className="feedback__meta-key">Time</span><span className="feedback__meta-val">{appointment?.appointmentTime || ''}</span></div>
          </div>
        </Card>

        <Card className="feedback__form-card">
          <h2 className="feedback__form-title">How was your session?</h2>
          <p className="feedback__form-sub">Your honest feedback helps both consultants and fellow members.</p>
          <form className="feedback__form" onSubmit={handleSubmit}>
            <fieldset className="feedback__stars" role="radiogroup" aria-label="Rating — select 1 to 5 stars">
              <legend className="sr-only">Rating</legend>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button"
                  className={`feedback__star-btn${n <= (hoverRating || rating) ? ' feedback__star-btn--active' : ''}`}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  onFocus={() => setHoverRating(n)}
                  onBlur={() => setHoverRating(0)}
                  aria-label={`${n} star${n > 1 ? 's' : ''} out of 5`}
                  aria-pressed={rating === n}
                  role="radio"
                  aria-checked={rating === n}
                >
                  <Star aria-hidden="true" />
                </button>
              ))}
            </fieldset>
            <p className="feedback__rating-label" aria-live="polite">
              {rating === 0 ? 'Tap a star to rate' : rating === 5 ? 'Excellent!' : rating >= 4 ? 'Great session!' : rating === 3 ? 'It was okay' : rating === 2 ? 'Could be better' : 'Not a good fit'}
            </p>

            <Textarea label="Additional comments (optional)" placeholder="Share anything helpful about your experience..." rows={4} value={comment} onChange={(e) => setComment(e.target.value)} />

            <Button type="submit" variant="primary" size="lg" loading={submitting} disabled={rating === 0} className="feedback__submit">
              Submit Feedback
            </Button>
            <p className="feedback__note">Feedback you leave helps improve the platform and is shared anonymously with consultants.</p>
          </form>
        </Card>
      </div>
    </div>
  );
}
