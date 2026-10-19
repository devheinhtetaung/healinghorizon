import { Link } from 'react-router-dom';
import { UserPlus, Users, Heart, ArrowRight } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import './InfoPage.css';

const STEPS = [
  { number: 1, icon: UserPlus, title: 'Create an Account', description: 'Sign up in under two minutes. Choose your support preferences and tell us a little about what brings you here.' },
  { number: 2, icon: Users, title: 'Match with a Consultant', description: 'Browse our network of licensed consultants. Pick the one who feels right — based on specialty, approach, and availability.' },
  { number: 3, icon: Heart, title: 'Begin Your Journey', description: 'Attend sessions, track your progress, connect with the community, and take each step at your own pace.' },
];

export default function HowItWorksPage() {
  return (
    <div className="info-page">
      <div className="info-page__header">
        <Badge variant="accent">How It Works</Badge>
        <h1 className="info-page__title">Your path to better mental health</h1>
        <p className="info-page__subtitle">
          Three simple steps to access the support you deserve — no waitlists, no stigma.
        </p>
      </div>

      <Card className="info-page__card">
        <div className="info-page__card-steps">
          {STEPS.map(({ number, icon: Icon, title, description }) => (
            <div key={number} className="info-steps__item">
              <div className="info-steps__badge">
                <span className="info-steps__number">{number}</span>
                <Icon className="info-steps__icon" aria-hidden="true" />
              </div>
              <h2 className="info-steps__title">{title}</h2>
              <p className="info-steps__desc">{description}</p>
            </div>
          ))}
        </div>

        <div className="info-page__section info-page__section--centered">
          <p className="info-page__text">
            Every journey starts with a single step. Create your free account today and take yours.
          </p>
          <div className="info-page__cta">
            <Link to="/register">
              <Button variant="primary" size="lg" rightIcon={ArrowRight}>Get Started</Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
