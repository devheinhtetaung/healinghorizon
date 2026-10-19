import { useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import useToast from '../../components/ui/useToast';
import './InfoPage.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INITIAL = { name: '', email: '', message: '' };

export default function ContactPage() {
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleChange = (field) => (e) => {
    setValues((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!values.name.trim()) errs.name = 'Name is required';
    if (!values.email.trim()) errs.email = 'Email is required';
    else if (!EMAIL_RE.test(values.email)) errs.email = 'Enter a valid email address';
    if (!values.message.trim()) errs.message = 'Please enter a message';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      // TODO: connect to POST /api/contact
      await new Promise((r) => setTimeout(r, 800));
      addToast({ type: 'success', title: 'Message sent', message: 'Thank you for reaching out — we will get back to you soon.' });
      setValues(INITIAL);
      setErrors({});
    } catch (err) {
      addToast({ type: 'error', title: 'Failed to send', message: err.message || 'Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="info-page">
      <div className="info-page__header">
        <h1 className="info-page__title">Contact Us</h1>
        <p className="info-page__subtitle">
          Have a question or need help? Send us a message and our team will respond as soon as possible.
        </p>
      </div>

      <div className="contact-layout">
        <Card className="contact-form-card">
          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <Input
              label={<span>Name <span aria-hidden="true">*</span><span className="sr-only">required</span></span>}
              placeholder="Your name"
              value={values.name}
              onChange={handleChange('name')}
              error={errors.name}
              autoComplete="name"
            />
            <Input
              label={<span>Email <span aria-hidden="true">*</span><span className="sr-only">required</span></span>}
              type="email"
              placeholder="you@example.com"
              value={values.email}
              onChange={handleChange('email')}
              error={errors.email}
              autoComplete="email"
            />
            <Textarea
              label={<span>Message <span aria-hidden="true">*</span><span className="sr-only">required</span></span>}
              placeholder="How can we help?"
              rows={5}
              value={values.message}
              onChange={handleChange('message')}
              error={errors.message}
            />
            <Button type="submit" variant="primary" size="lg" loading={loading} className="contact-form__submit">
              Send Message
            </Button>
          </form>
        </Card>

        <Card className="contact-info-card">
          <h2 className="contact-info__title">Other ways to reach us</h2>

          <div className="contact-info__item">
            <div className="contact-info__icon"><Mail aria-hidden="true" /></div>
            <div>
              <p className="contact-info__label">Email</p>
              <p className="contact-info__value">support@healinghorizon.org</p>
            </div>
          </div>
          <div className="contact-info__item">
            <div className="contact-info__icon"><Phone aria-hidden="true" /></div>
            <div>
              <p className="contact-info__label">Phone</p>
              <p className="contact-info__value">+1 (800) 555-0142</p>
            </div>
          </div>
          <div className="contact-info__item">
            <div className="contact-info__icon"><MapPin aria-hidden="true" /></div>
            <div>
              <p className="contact-info__label">Office</p>
              <p className="contact-info__value">Healing Horizon Care Centre, Suite 400</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
