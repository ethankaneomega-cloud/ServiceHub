import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Layout
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import RegisterWorkerPage from './pages/auth/RegisterWorkerPage';
import NotFoundPage from './pages/NotFoundPage';

// User pages
import UserDashboard from './pages/user/UserDashboard';
import ServicesPage from './pages/user/ServicesPage';
import WorkersPage from './pages/user/WorkersPage';
import BookingPage from './pages/user/BookingPage';
import MyBookingsPage from './pages/user/MyBookingsPage';
import ProfilePage from './pages/user/ProfilePage';
import ReportsPage from './pages/common/ReportsPage';

// Worker pages
import WorkerDashboard from './pages/worker/WorkerDashboard';
import WorkerBookingsPage from './pages/worker/WorkerBookingsPage';
import WorkerAnalyticsPage from './pages/worker/WorkerAnalyticsPage';
import WorkerProfilePage from './pages/worker/WorkerProfilePage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminWorkersPage from './pages/admin/AdminWorkersPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import AdminServicesPage from './pages/admin/AdminServicesPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';

// Redirect root by role
const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'worker') return <Navigate to="/worker" replace />;
  return <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={user ? <RootRedirect /> : <HomePage />} />
      <Route path="/login" element={user ? <RootRedirect /> : <LoginPage />} />
      <Route path="/register" element={user ? <RootRedirect /> : <RegisterPage />} />
      <Route path="/register-worker" element={user ? <RootRedirect /> : <RegisterWorkerPage />} />

      {/* User routes */}
      <Route element={<ProtectedRoute roles={['user']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/workers" element={<WorkersPage />} />
        <Route path="/book/:workerId" element={<BookingPage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/reports" element={<ReportsPage role="user" />} />
      </Route>

      {/* Worker routes */}
      <Route element={<ProtectedRoute roles={['worker']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/worker" element={<WorkerDashboard />} />
        <Route path="/worker/bookings" element={<WorkerBookingsPage />} />
        <Route path="/worker/analytics" element={<WorkerAnalyticsPage />} />
        <Route path="/worker/profile" element={<WorkerProfilePage />} />
        <Route path="/worker/reports" element={<ReportsPage role="worker" />} />
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute roles={['admin']}><DashboardLayout /></ProtectedRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/workers" element={<AdminWorkersPage />} />
        <Route path="/admin/bookings" element={<AdminBookingsPage />} />
        <Route path="/admin/services" element={<AdminServicesPage />} />
        <Route path="/admin/reports" element={<AdminReportsPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e3a8a',
                color: '#fff',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: { iconTheme: { primary: '#34d399', secondary: '#fff' } },
              error: {
                style: { background: '#b91c1c' },
                iconTheme: { primary: '#fca5a5', secondary: '#fff' },
              },
            }}
          />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
