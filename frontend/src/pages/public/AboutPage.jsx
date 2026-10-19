import { Heart, Shield, Users } from 'lucide-react';
import Card from '../../components/ui/Card';
import './InfoPage.css';

const VALUES = [
  { icon: Heart, title: 'Compassion First', text: 'Every feature we build starts with empathy for the person who will use it during a difficult moment.' },
  { icon: Shield, title: 'Privacy Always', text: 'Mental health is deeply personal. We protect your data and give you control over what you share.' },
  { icon: Users, title: 'Genuine Community', text: 'Healing happens in connection. We foster supportive spaces where people never feel alone.' },
];

export default function AboutPage() {
  return (
    <div className="info-page">
      <div className="info-page__header">
        <h1 className="info-page__title">About Healing Horizon</h1>
        <p className="info-page__subtitle">
          We are on a mission to make mental health support accessible,
          affordable, and genuinely human for everyone, everywhere.
        </p>
      </div>

      <Card className="info-page__card">
        <section className="info-page__section">
          <h2 className="info-page__section-title">Our Story</h2>
          <p className="info-page__text">
            Healing Horizon began with a simple observation: people everywhere
            face enormous daily pressures, yet mental health support is often
            hard to reach, expensive, or stigmatised. Long waitlists and fragmented
            care mean too many individuals struggle in silence.
          </p>
          <p className="info-page__text">
            We set out to change that. By combining licensed consultants,
            AI-assisted support, a peer community, and secure video sessions into
            one welcoming platform, we make it easy to take the first step —
            whenever and wherever someone needs help.
          </p>
        </section>

        <section className="info-page__section">
          <h2 className="info-page__section-title">Our Mission</h2>
          <p className="info-page__text">
            To ensure no one is ever turned away from mental health support
            because of cost, location, or stigma. We believe wellbeing is a
            fundamental human right, not a luxury.
          </p>
        </section>

        <section className="info-page__section">
          <h2 className="info-page__section-title">What We Value</h2>
          <div className="about-values">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <Card key={title} className="about-value">
                <div className="about-value__badge">
                  <Icon aria-hidden="true" />
                </div>
                <h3 className="about-value__title">{title}</h3>
                <p className="about-value__text">{text}</p>
              </Card>
            ))}
          </div>
        </section>
      </Card>
    </div>
  );
}
