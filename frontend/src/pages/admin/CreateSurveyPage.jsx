import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, FileText } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useToast from '../../components/ui/useToast';
import { adminService } from '../../services/adminService';
import './Admin.css';

export default function CreateSurveyPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [formTitle, setFormTitle] = useState('');
  const [formQuestions, setFormQuestions] = useState(['']);
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddQuestion = () => {
    setFormQuestions((prev) => [...prev, '']);
  };

  const handleRemoveQuestion = (idx) => {
    if (formQuestions.length <= 1) return;
    setFormQuestions((prev) => prev.filter((_, i) => i !== idx));
    setFormError('');
  };

  const handleQuestionChange = (idx, val) => {
    setFormQuestions((prev) => prev.map((q, i) => (i === idx ? val : q)));
    if (formError) setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Please enter a survey title.');
      return;
    }
    const filled = formQuestions.filter((q) => q.trim());
    if (filled.length === 0) {
      setFormError('Please add at least one question.');
      return;
    }

    setLoading(true);
    try {
      await adminService.createSurvey({
        title: formTitle.trim(),
        questions: filled,
      });
      navigate('/admin/surveys', {
        state: {
          showSuccessModal: true,
          createdSurvey: {
            title: formTitle.trim(),
            questionCount: filled.length,
          },
        },
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to create survey.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ad-list" style={{ maxWidth: '44rem', margin: '0 auto', width: '100%' }}>
      <Link to="/admin/surveys" className="ad-surveys__title-btn" style={{ textDecoration: 'none', marginBottom: 'var(--space-2)' }}>
        <ArrowLeft aria-hidden="true" /> Back to Surveys
      </Link>

      <Card style={{ padding: 'var(--space-6)' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h1 className="ad-dash__section-title" style={{ fontSize: 'var(--text-2xl)' }}>
            <FileText aria-hidden="true" /> Create New Survey
          </h1>
          <p style={{ color: 'var(--color-muted-foreground)', fontSize: 'var(--text-sm)', marginTop: 'var(--space-1)' }}>
            Build a wellbeing survey or check-in questionnaire for members.
          </p>
        </div>

        <form className="ad-form" onSubmit={handleSubmit} noValidate>
          <Input
            label="Survey Title"
            placeholder="e.g. Weekly Wellbeing Check-in"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
          />

          <div className="ad-surveys__questions-editor">
            <p className="ad-surveys__questions-label">Questions</p>
            {formQuestions.map((q, idx) => (
              <div key={idx} className="ad-surveys__question-row">
                <Input
                  placeholder={`Question ${idx + 1}`}
                  value={q}
                  onChange={(e) => handleQuestionChange(idx, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddQuestion();
                    }
                    if (e.key === 'Backspace' && !q && formQuestions.length > 1) {
                      e.preventDefault();
                      handleRemoveQuestion(idx);
                    }
                  }}
                />
                <button
                  type="button"
                  className="ad-surveys__question-remove"
                  onClick={() => handleRemoveQuestion(idx)}
                  disabled={formQuestions.length <= 1}
                  aria-label={`Remove question ${idx + 1}`}
                >
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
            ))}
            <Button type="button" variant="secondary" size="sm" onClick={handleAddQuestion}>
              <Plus aria-hidden="true" /> Add Question
            </Button>
          </div>

          {formError && (
            <p className="ad-surveys__form-error" role="alert">
              {formError}
            </p>
          )}

          <div className="ad-form__actions" style={{ marginTop: 'var(--space-4)' }}>
            <Button variant="ghost" type="button" onClick={() => navigate('/admin/surveys')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading} disabled={loading}>
              Create Survey
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
