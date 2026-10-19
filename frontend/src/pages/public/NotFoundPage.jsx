import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import './InfoPage.css';

export default function NotFoundPage() {
  return (
    <div className="info-page">
      <div className="info-page__header">
        <h1 className="info-page__title">Page not found</h1>
        <p className="info-page__subtitle">
          The page you are looking for does not exist or has been moved.
        </p>
      </div>
      <div className="info-page__cta">
        <Link to="/">
          <Button variant="primary" size="lg">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
