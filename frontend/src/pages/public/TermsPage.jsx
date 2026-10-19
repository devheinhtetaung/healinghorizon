import Card from '../../components/ui/Card';
import './InfoPage.css';

export default function TermsPage() {
  return (
    <div className="info-page">
      <div className="info-page__header">
        <h1 className="info-page__title">Terms of Service</h1>
        <p className="info-page__subtitle">
          Please read these terms carefully. By using Healing Horizon, you agree
          to the guidelines outlined below.
        </p>
      </div>

      <Card className="info-page__card">
        <section className="info-page__section">
          <h2 className="info-page__section-title">Acceptance of Terms</h2>
          <p className="info-page__text">
            By creating an account or using any part of the Healing Horizon
            platform, you agree to be bound by these terms. If you do not agree,
            please do not use the service.
          </p>
        </section>

        <section className="info-page__section">
          <h2 className="info-page__section-title">Use of the Service</h2>
          <p className="info-page__text">
            Healing Horizon provides mental health resources, consultant
            appointments, and community features. The platform is intended to
            support wellbeing but is not a substitute for emergency care. If you
            are in crisis, contact local emergency services immediately.
          </p>
        </section>

        <section className="info-page__section">
          <h2 className="info-page__section-title">User Responsibilities</h2>
          <p className="info-page__text">
            You agree to provide accurate information, keep your login credentials
            secure, and treat other members of the community with respect.
          </p>
          <div className="info-page__list">
            <p className="info-page__list-item">Provide truthful account information</p>
            <p className="info-page__list-item">Respect the privacy of other users</p>
            <p className="info-page__list-item">Refrain from harmful or abusive behaviour</p>
          </div>
        </section>

        <section className="info-page__section">
          <h2 className="info-page__section-title">Consultant Sessions</h2>
          <p className="info-page__text">
            Appointments and video sessions are provided by licensed consultants.
            Cancellations, rescheduling, and session conduct are governed by the
            guidelines shown when you book.
          </p>
        </section>

        <section className="info-page__section">
          <h2 className="info-page__section-title">Changes to These Terms</h2>
          <p className="info-page__text">
            We may update these terms from time to time. Continued use of the
            platform after changes take effect constitutes acceptance of the
            revised terms.
          </p>
        </section>

        <p className="info-page__meta">
          This is placeholder terms content for demonstration purposes and does not
          constitute a legally binding agreement. Last updated: 2026.
        </p>
      </Card>
    </div>
  );
}
