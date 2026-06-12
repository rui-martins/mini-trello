import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './pages/Dashboard';
import { getCurrentUser } from './lib/auth-store';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());

  useEffect(() => {
    function onSession() {
      setCurrentUser(getCurrentUser());
    }

    window.addEventListener('sessionChanged', onSession);
    return () => window.removeEventListener('sessionChanged', onSession);
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<AuthForm mode="login" />} />
      <Route path="/register" element={<AuthForm mode="register" />} />
      <Route path="/dashboard" element={currentUser ? <Dashboard /> : <Navigate to="/login" replace />} />
      <Route path="/" element={<Navigate to={currentUser ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}
