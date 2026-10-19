import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthProvider from './context/AuthContext';
import { routes } from './router/index.jsx';

function renderRoutes(routeList) {
  return routeList.map(({ path, index, element, children }) => {
    if (children) {
      return (
        <Route key={path || 'root'} path={path} element={element} index={index}>
          {renderRoutes(children)}
        </Route>
      );
    }
    return <Route key={path || 'index'} path={path} element={element} index={index} />;
  });
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {renderRoutes(routes)}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
