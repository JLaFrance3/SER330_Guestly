import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppNavbar from './components/AppNavbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import BookingPage from './pages/guest/BookingPage';
import MyReservationsPage from './pages/guest/MyReservationsPage';
import ReservationDetailPage from './pages/guest/ReservationDetailPage';
import EditReservationPage from './pages/guest/EditReservationPage';
import DashboardPage from './pages/host/DashboardPage';
import WalkInPage from './pages/host/WalkInPage';
import ManageReservationsPage from './pages/host/ManageReservationsPage';

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'host' ? '/host/dashboard' : '/guest/book'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppNavbar />
        <main>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />

            <Route
              path="/guest/book"
              element={<ProtectedRoute requiredRole="guest"><BookingPage /></ProtectedRoute>}
            />
            <Route
              path="/guest/reservations"
              element={<ProtectedRoute requiredRole="guest"><MyReservationsPage /></ProtectedRoute>}
            />
            <Route
              path="/guest/reservations/:id/edit"
              element={<ProtectedRoute requiredRole="guest"><EditReservationPage /></ProtectedRoute>}
            />
            <Route
              path="/guest/reservations/:id"
              element={<ProtectedRoute requiredRole="guest"><ReservationDetailPage /></ProtectedRoute>}
            />

            <Route
              path="/host/dashboard"
              element={<ProtectedRoute requiredRole="host"><DashboardPage /></ProtectedRoute>}
            />
            <Route
              path="/host/walkin"
              element={<ProtectedRoute requiredRole="host"><WalkInPage /></ProtectedRoute>}
            />
            <Route
              path="/host/reservations"
              element={<ProtectedRoute requiredRole="host"><ManageReservationsPage /></ProtectedRoute>}
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}
