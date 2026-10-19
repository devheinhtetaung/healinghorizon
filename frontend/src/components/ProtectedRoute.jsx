import { Navigate } from 'react-router-dom';
import Spinner from '../components/ui/Spinner';
import useAuth from '../hooks/useAuth';

/**
 * Wraps route elements to gate by authentication and role.
 *
 * @param {string[]} roles - Optional array of allowed roles. If omitted, any
 *   authenticated role is permitted.
 */
export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="placeholder-page">
        <Spinner size="lg" />
        <p className="placeholder-page__text">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && Array.isArray(roles) && !roles.includes(role)) {
    return (
      <div className="placeholder-page">
        <h1 className="placeholder-page__title">Unauthorised</h1>
        <p className="placeholder-page__text">
          You do not have the required permissions to access this page.
        </p>
      </div>
    );
  }

  return children;
}
