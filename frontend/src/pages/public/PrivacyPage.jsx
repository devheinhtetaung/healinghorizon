import Card from '../../components/ui/Card';
import './InfoPage.css';

export default function PrivacyPage() {
  return (
    <div className="info-page">
      <div className="info-page__header">
        <h1 className="info-page__title">Privacy Policy</h1>
        <p className="info-page__subtitle">
          Your trust matters to us. This policy explains what we collect, how we
          use it, and the rights you have over your information.
        </p>
      </div>

      <Card className="info-page__card">
        <section className="info-page__section">
          <h2 className="info-page__section-title">Data We Collect</h2>
          <p className="info-page__text">
            We collect the information you provide when you create an account,
            such as your name, email, date of birth, and support preferences. We
            also collect activity data — like appointments booked and community
            posts — so the platform can function properly.
          </p>
          <div className="info-page__list">
            <p className="info-page__list-item">Account details you provide at registration</p>
            <p className="info-page__list-item">Session and appointment records</p>
            <p className="info-page__list-item">Messages and posts you choose to share</p>
          </div>
        </section>

        <section className="info-page__section">
          <h2 className="info-page__section-title">How We Use It</h2>
          <p className="info-page__text">
            Your information is used to match you with consultants, deliver
            sessions, personalise your experience, and keep you informed about
            your appointments. We never sell your personal data to third parties.
          </p>
        </section>

        <section className="info-page__section">
          <h2 className="info-page__section-title">Your Rights</h2>
          <p className="info-page__text">
            You have the right to access, correct, or delete your personal data
            at any time. You can also opt out of non-essential communications and
            request a copy of the information we hold about you.
          </p>
          <div className="info-page__list">
            <p className="info-page__list-item">Access and download your data</p>
            <p className="info-page__list-item">Correct inaccurate information</p>
            <p className="info-page__list-item">Request deletion of your account</p>
          </div>
        </section>

        <section className="info-page__section">
          <h2 className="info-page__section-title">Contact</h2>
          <p className="info-page__text">
            If you have questions about this policy or how your data is handled,
            reach out to our privacy team at privacy@healinghorizon.org.
          </p>
        </section>

        <p className="info-page__meta">
          This is placeholder policy content for demonstration purposes and does
          not constitute a legally binding privacy policy. Last updated: 2026.
        </p>
      </Card>
    </div>
  );
}
