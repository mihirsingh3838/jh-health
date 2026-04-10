import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import Login from './pages/Login';
import TrackTicket from './pages/TrackTicket';
import AdminDashboard from './pages/AdminDashboard';
import EngineerDashboard from './pages/EngineerDashboard';
import './index.css';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex-center" style={{ height: '100vh' }}><span className="spinner spinner-dark" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin' : '/engineer'} replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex-center" style={{ height: '100vh' }}><span className="spinner spinner-dark" /></div>;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/engineer'} replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
      <Route path="/track" element={<PublicRoute><TrackTicket /></PublicRoute>} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/engineer" element={<ProtectedRoute role="engineer"><EngineerDashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 2800,
          style: { fontSize: '0.9rem' },
        }}
      />
    </AuthProvider>
  );
}
