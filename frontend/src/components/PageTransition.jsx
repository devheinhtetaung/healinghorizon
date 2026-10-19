import { Outlet, useLocation } from 'react-router-dom';

export default function PageTransition({ className = '' }) {
  const { pathname } = useLocation();

  return (
    <div key={pathname} className={`page-enter ${className}`.trim()}>
      <Outlet />
    </div>
  );
}
