import { Info } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import './InfoPage.css';

const FUTURE_ROLES = [
  { title: 'Licensed Mental Health Consultant', type: 'Full-time', location: 'Remote', desc: 'Provide one-on-one video sessions and support members through their wellbeing journeys. Requires a valid clinical licence and a warm, person-centred approach.' },
  { title: 'Community Moderator', type: 'Part-time', location: 'Remote', desc: 'Help maintain a safe, supportive forum by guiding conversations, enforcing community guidelines, and escalating concerns with care and discretion.' },
];

export default function CareersPage() {
  return (
    <div className="info-page">
      <div className="info-page__header">
        <h1 className="info-page__title">Careers at Healing Horizon</h1>
        <p className="info-page__subtitle">
          Join a team working to make mental health support reachable for everyone.
        </p>
      </div>

      <Card className="info-page__card">
        <div className="careers-notice">
          <Info className="careers-notice__icon" aria-hidden="true" />
          <p className="careers-notice__text">
            We are not actively hiring right now, but we are always growing.
            The roles below are examples of positions we expect to open soon —
            check back or reach out to express your interest.
          </p>
        </div>

        <div className="careers-roles">
          {FUTURE_ROLES.map(({ title, type, location, desc }) => (
            <Card key={title} className="careers-role">
              <div className="careers-role__top">
                <h2 className="careers-role__title">{title}</h2>
                <div className="careers-role__meta">
                  <Badge variant="accent">{type}</Badge>
                  <Badge variant="default">{location}</Badge>
                </div>
              </div>
              <p className="careers-role__desc">{desc}</p>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}
