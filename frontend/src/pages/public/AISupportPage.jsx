import { Link } from 'react-router-dom';
import { MessageSquareText, Shield, Clock, ArrowRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import './InfoPage.css';

const FEATURES = [
  { icon: MessageSquareText, title: 'Always Available', text: 'Our AI companion is here 24 hours a day, seven days a week. No appointment needed — start a conversation whenever you need someone to talk to.' },
  { icon: Shield, title: 'Confidential & Safe', text: 'Every conversation is private. Your messages are encrypted and never shared. The AI is designed to listen without judgment.' },
  { icon: Clock, title: 'Immediate Support', text: 'No waitlists, no scheduling. When you need to talk, the AI chatbot responds instantly, helping you process your thoughts in real time.' },
];

export default function AISupportPage() {
  return (
    <div className="info-page">
      <div className="info-page__header">
        <h1 className="info-page__title">AI Support</h1>
        <p className="info-page__subtitle">
          A compassionate AI companion for those moments when you need to talk right now.
        </p>
      </div>

      <Card className="info-page__card">
        <section className="info-page__section">
          <h2 className="info-page__section-title">What is the AI Chatbot?</h2>
          <p className="info-page__text">
            The Healing Horizon AI chatbot is a supportive companion designed to listen, reflect,
            and guide you through your thoughts. It is not a replacement for a human consultant,
            but it is available immediately — any time you feel anxious, stressed, overwhelmed,
            or just need to process something out loud.
          </p>
        </section>

        <section className="info-page__section">
          <h2 className="info-page__section-title">How It Helps</h2>
          <div className="about-values">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <Card key={title} className="about-value">
                <div className="about-value__badge"><Icon aria-hidden="true" /></div>
                <h3 className="about-value__title">{title}</h3>
                <p className="about-value__text">{text}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="info-page__section">
          <h2 className="info-page__section-title">Important Note</h2>
          <p className="info-page__text">
            The AI chatbot is a supportive tool, not a substitute for professional care or
            emergency services. If you are in crisis, please contact your local emergency
            services immediately. For ongoing support, consider booking an appointment with
            one of our licensed consultants.
          </p>
        </section>

        <div className="info-page__cta">
          <Link to="/register">
            <Button variant="primary" size="lg" rightIcon={ArrowRight}>Get Started</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
