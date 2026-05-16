import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, ArrowLeft } from 'lucide-react';

const NotFoundPage = () => {
  const { user } = useAuth();
  const dashboardMap = { admin: '/admin', worker: '/worker', user: '/dashboard' };
  const home = user ? (dashboardMap[user.role] || '/') : '/';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-blue-900/10 mb-4 select-none">404</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Page Not Found</h1>
        <p className="text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex justify-center gap-3">
          <Link to={home} className="btn-primary">
            <Home size={16} /> Go Home
          </Link>
          <button onClick={() => window.history.back()} className="btn-secondary">
            <ArrowLeft size={16} /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
