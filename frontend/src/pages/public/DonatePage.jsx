import { useState } from 'react';
import { Heart, TrendingUp, Lock, CreditCard } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import useToast from '../../components/ui/useToast';
import { donationService } from '../../services/donationService';
import './Donate.css';

const PRESETS = [5, 10, 25, 50, 100];

const STATS = [
  { value: '2,400+', label: 'People supported this year' },
  { value: '180+', label: 'Licensed consultants on our platform' },
  { value: '94%', label: 'Of donations go directly to member care' },
];

const INITIAL = { amount: 25, custom: '', anonymous: false, name: '', email: '' };
const INITIAL_CARD = { number: '', expiry: '', cvc: '', name: '' };

function formatCardNumber(value) {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

function formatCvc(value) {
  return value.replace(/\D/g, '').slice(0, 4);
}

const CARD_VALIDATORS = {
  number: (v) => v.replace(/\s/g, '').length === 16 || 'Card number must be 16 digits',
  expiry: (v) => /^(0[1-9]|1[0-2])\/\d{2}$/.test(v) || 'Enter a valid expiry date (MM/YY)',
  cvc: (v) => /^\d{3,4}$/.test(v) || 'CVC must be 3–4 digits',
  name: (v) => v.trim().length >= 2 || 'Enter the name printed on the card',
};

export default function DonatePage() {
  const [state, setState] = useState(INITIAL);
  const [card, setCard] = useState(INITIAL_CARD);
  const [cardErrors, setCardErrors] = useState({});
  const [showThanks, setShowThanks] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { addToast } = useToast();

  const activeAmount = state.custom !== '' ? state.custom : state.amount;
  const typedAmount = activeAmount !== '' ? Number(activeAmount) : 0;

  const setField = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setState((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const handlePreset = (val) => {
    setState((prev) => ({ ...prev, amount: val, custom: '' }));
    if (errors.amount) {
      setErrors((prev) => { const next = { ...prev }; delete next.amount; return next; });
    }
  };

  const setCardField = (field, format) => (e) => {
    const val = format ? format(e.target.value) : e.target.value;
    setCard((prev) => ({ ...prev, [field]: val }));
    if (cardErrors[field] && CARD_VALIDATORS[field](val) === true) {
      setCardErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const validateCardField = (field) => () => {
    const val = (card[field] || '').trim();
    if (val === '') {
      if (cardErrors[field]) {
        setCardErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
      }
      return;
    }
    const result = CARD_VALIDATORS[field](val);
    setCardErrors((prev) => {
      const next = { ...prev };
      if (result === true) delete next[field];
      else next[field] = result;
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    const num = Number(activeAmount);
    if (!activeAmount || Number.isNaN(num) || num <= 0) errs.amount = 'Please enter a valid donation amount';
    else if (num > 10000) errs.amount = 'Maximum donation is $10,000';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      await donationService.donate({
        amount: num,
        anonymousDonation: state.anonymous,
        donarName: state.anonymous ? undefined : (state.name || undefined),
        donarEmail: state.anonymous ? undefined : (state.email || undefined),
      });
      setShowThanks(true);
    } catch (err) {
      addToast({ type: 'error', title: 'Donation failed', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseThanks = () => {
    setShowThanks(false);
    setState(INITIAL);
    setCard(INITIAL_CARD);
    setCardErrors({});
  };

  return (
    <div className="donate-page">
      <section className="donate-section donate-header">
        <div className="donate-header__inner">
          <div className="donate-header__text">
            <Heart className="donate-header__icon" aria-hidden="true" />
            <h1 className="donate-header__heading">Support our mission</h1>
            <p className="donate-header__body">
              Every contribution helps us provide free mental health resources,
              expand our consultant network, and ensure no one is turned away
              because of cost. Your generosity makes a real difference.
            </p>
          </div>
          <div className="donate-header__stats">
            {STATS.map(({ value, label }) => (
              <div key={label} className="donate-header__stat">
                <span className="donate-header__stat-value">{value}</span>
                <span className="donate-header__stat-label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="donate-section donate-form-section">
        <form className="donate-form" onSubmit={handleSubmit} noValidate>
          <div className="donate-form__card">
            <h2 className="donate-form__heading">Choose your donation</h2>

            <div className="donate-form__presets" role="group" aria-label="Preset donation amounts">
              {PRESETS.map((val) => (
                <button
                  key={val} type="button"
                  className={`donate-preset${state.amount === val && state.custom === '' ? ' donate-preset--active' : ''}`}
                  onClick={() => handlePreset(val)}
                  aria-pressed={state.amount === val && state.custom === ''}
                >
                  ${val}
                </button>
              ))}
            </div>

            <div className="donate-form__custom">
              <Input
                label="Custom amount"
                type="number" placeholder="Enter any amount"
                min="1" max="10000"
                value={state.custom}
                onChange={(e) => { setField('custom')(e); if (e.target.value !== '') setState((prev) => ({ ...prev, amount: 0 })); }}
                helperText="Enter an amount between $1 and $10,000"
                error={errors.amount}
              />
            </div>

            <div className="donate-form__anonymous">
              <label className="donate-toggle">
                <input type="checkbox" checked={state.anonymous} onChange={setField('anonymous')} />
                <span className="donate-toggle__cue" />
                <span className="donate-toggle__label">Make this an anonymous donation</span>
              </label>
              <p className="donate-toggle__hint">
                {state.anonymous ? 'Your name will not appear publicly.' : 'Leave the fields below if you would like an acknowledgement.'}
              </p>
            </div>

            <div className="donate-payment">
              <h3 className="donate-payment__heading">Payment details</h3>

              <div className="donate-card-number">
                <Input
                  label="Card number"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="1234 5678 9012 3456"
                  value={card.number}
                  onChange={setCardField('number', formatCardNumber)}
                  onBlur={validateCardField('number')}
                  error={cardErrors.number}
                />
                {!cardErrors.number && (
                  <span className="donate-card-number__brands" aria-hidden="true">
                    <CreditCard />
                  </span>
                )}
              </div>

              <div className="donate-payment__row">
                <Input
                  label="Expiry"
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="MM/YY"
                  value={card.expiry}
                  onChange={setCardField('expiry', formatExpiry)}
                  onBlur={validateCardField('expiry')}
                  error={cardErrors.expiry}
                />
                <Input
                  label="CVC"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="123"
                  helperText="3–4 digits on the back of your card"
                  value={card.cvc}
                  onChange={setCardField('cvc', formatCvc)}
                  onBlur={validateCardField('cvc')}
                  error={cardErrors.cvc}
                />
              </div>

              <Input
                label="Cardholder name"
                autoComplete="cc-name"
                placeholder="Name printed on the card"
                value={card.name}
                onChange={setCardField('name')}
                onBlur={validateCardField('name')}
                error={cardErrors.name}
              />
            </div>

            {!state.anonymous && (
              <div className="donate-form__identity">
                <Input label="Your Name" placeholder="Optional" value={state.name} onChange={setField('name')} autoComplete="name" />
                <Input label="Your Email" type="email" placeholder="Optional" value={state.email} onChange={setField('email')} autoComplete="email" />
              </div>
            )}

            <div className="donate-form__security">
              <Lock aria-hidden="true" />
              <span>Secured by TLS encryption — your payment details are never stored on our servers.</span>
            </div>

            <Button type="submit" variant="primary" size="lg" loading={loading} rightIcon={TrendingUp} className="donate-form__submit">
              {loading ? 'Processing' : `Donate $${typedAmount || '—'}`}
            </Button>
          </div>
        </form>
      </section>

      <Modal isOpen={showThanks} onClose={handleCloseThanks} title="Thank you!">
        <div className="donate-thanks">
          <div className="donate-thanks__icon"><Heart aria-hidden="true" /></div>
          <p className="donate-thanks__message">
            {state.anonymous
              ? 'Your anonymous gift will help people access the mental health support they deserve.'
              : state.name
                ? `Thank you, ${state.name}! Your contribution will help people access the mental health support they deserve.`
                : 'Your contribution will help people access the mental health support they deserve.'}
          </p>
          <p className="donate-thanks__note">A confirmation has been sent to your email.</p>
          <Button variant="primary" onClick={handleCloseThanks}>Done</Button>
        </div>
      </Modal>
    </div>
  );
}
