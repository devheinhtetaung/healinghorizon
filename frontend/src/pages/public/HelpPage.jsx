import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Card from '../../components/ui/Card';
import './InfoPage.css';

const FAQS = [
  { q: 'What is Healing Horizon?', a: 'Healing Horizon is a mental health platform built for everyone. It brings licensed consultants, AI chat support, a peer community, and secure video sessions together in one place, so getting help is simple and stigma-free.' },
  { q: 'Is it free to use?', a: 'Creating an account and accessing community features and AI chat support is free. Some consultant sessions may have a fee, but donations help us keep as much of the platform free as possible so no one is turned away because of cost.' },
  { q: 'How do I book an appointment with a consultant?', a: 'Once you are logged in, go to your dashboard and open the Appointments section. You can browse available consultants, pick a time that suits you, and confirm your booking in a few clicks.' },
  { q: 'Are my conversations private?', a: 'Yes. Your sessions and messages are confidential. We take privacy seriously and give you control over what you share. You can review the details in our Privacy Policy.' },
  { q: 'What happens during a video session?', a: 'Video sessions are one-on-one encrypted calls with your consultant. You can join from your dashboard at your scheduled time — no extra software required. Sessions are a safe space to talk through whatever is on your mind.' },
  { q: 'Can I post anonymously in the community?', a: 'Absolutely. When creating a community post, you can choose to remain anonymous. Your identity will not be shown to other members, so you can share and seek support comfortably.' },
  { q: 'What if I am in a crisis right now?', a: 'Healing Horizon supports ongoing wellbeing but is not an emergency service. If you are in immediate danger or crisis, please contact your local emergency services or a crisis hotline right away.' },
  { q: 'How can I support the platform?', a: 'You can make a donation from the Donate page — no account required. Every contribution helps us expand our consultant network and keep resources accessible to those who need them.' },
];

function FaqItem({ item, isOpen, onToggle, index }) {
  const panelId = `faq-panel-${index}`;
  const triggerId = `faq-trigger-${index}`;

  return (
    <div className={`faq-item${isOpen ? ' faq-item--open' : ''}`}>
      <h2>
        <button
          type="button"
          id={triggerId}
          className="faq-item__trigger"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
        >
          <span>{item.q}</span>
          <ChevronDown className="faq-item__chevron" aria-hidden="true" />
        </button>
      </h2>
      {isOpen && (
        <div className="faq-item__answer" id={panelId} role="region" aria-labelledby={triggerId}>
          {item.a}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggle = (index) => setOpenIndex((prev) => (prev === index ? -1 : index));

  return (
    <div className="info-page">
      <div className="info-page__header">
        <h1 className="info-page__title">Help Center</h1>
        <p className="info-page__subtitle">
          Answers to common questions about how Healing Horizon works. Still stuck? Reach out through our Contact page.
        </p>
      </div>

      <Card className="info-page__card">
        <div className="faq-list" role="list" aria-label="Frequently asked questions">
          {FAQS.map((item, index) => (
            <FaqItem key={index} item={item} index={index} isOpen={openIndex === index} onToggle={() => toggle(index)} />
          ))}
        </div>
      </Card>
    </div>
  );
}
