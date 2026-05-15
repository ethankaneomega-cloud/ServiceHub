import { useState, useEffect } from 'react';
import {
  Link,
  useNavigate,
  useLocation
} from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

import {
  Wrench,
  Eye,
  EyeOff,
  LogIn,
  ArrowLeft
} from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname;

  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const dashboardMap = {
    admin: '/admin',
    worker: '/worker',
    user: '/dashboard'
  };

  // Clear autofill/cache issue
  useEffect(() => {
    setForm({
      email: '',
      password: ''
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      toast.error('Please fill in all fields.');
      return;
    }

    setLoading(true);

    try {
      const data = await login(
        form.email,
        form.password
      );

      toast.success(
        `Welcome back, ${data.user.name}!`
      );

      navigate(
        from ||
        dashboardMap[data.user.role] ||
        '/dashboard',
        { replace: true }
      );

    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'Login failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center p-4 relative">

      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-5 left-5 z-50 flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 shadow-lg"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="w-full max-w-md">

        {/* Logo/Header */}
        <div className="text-center mb-8">

          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-400 rounded-2xl mb-4 shadow-lg">
            <Wrench
              size={28}
              className="text-white"
            />
          </div>

          <h1 className="text-3xl font-bold text-white">
            ServiceHub
          </h1>

          <p className="text-blue-300 mt-1">
            Sign in to your account
          </p>

          <p className="text-sm text-blue-200 mt-3 italic">
            "Your all-in-one home service platform."
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">

          <form
            onSubmit={handleSubmit}
            autoComplete="off"
            className="space-y-5"
          >

            {/* Fake Autofill Blockers */}
            <input
              type="text"
              name="fake-login-user"
              className="hidden"
            />

            <input
              type="password"
              name="fake-login-password"
              className="hidden"
            />

            {/* Email */}
            <div>
              <label className="label">
                Email Address
              </label>

              <input
                type="email"
                name="servicehub-login-email"
                autoComplete="new-email"
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value
                  })
                }
              />
            </div>

            {/* Password */}
            <div>
              <label className="label">
                Password
              </label>

              <div className="relative">

                <input
                  type={
                    showPass
                      ? 'text'
                      : 'password'
                  }
                  name="servicehub-login-password"
                  autoComplete="new-password"
                  className="input-field pr-11"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      password: e.target.value
                    })
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPass(!showPass)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPass ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center space-y-2">

            <p className="text-gray-600 text-sm">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-blue-700 font-medium hover:underline"
              >
                Register as User
              </Link>
            </p>

            <p className="text-gray-600 text-sm">
              Want to offer services?{' '}
              <Link
                to="/register-worker"
                className="text-blue-700 font-medium hover:underline"
              >
                Register as Worker
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;