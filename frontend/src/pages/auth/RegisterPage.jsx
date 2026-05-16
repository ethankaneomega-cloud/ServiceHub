import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Wrench,
  Eye,
  EyeOff,
  UserPlus,
  ArrowLeft
} from 'lucide-react';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: ''
  });

  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setForm({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      address: ''
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      toast.error('Name, email, and password are required.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    // Strong password validation
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;

    if (!passwordRegex.test(form.password)) {
      toast.error(
        'Password must contain at least 1 uppercase letter and 1 special character.'
      );
      return;
    }

    setLoading(true);

    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        address: form.address
      });

      toast.success(
        'Registration successful! Welcome to ServiceHub.'
      );

      navigate('/dashboard');
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'Registration failed.'
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

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-400 rounded-2xl mb-4">
            <Wrench size={28} className="text-white" />
          </div>

          <h1 className="text-3xl font-bold text-white">
            Create Account
          </h1>

          <p className="text-blue-300 mt-1">
            Join ServiceHub as a customer
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
            className="space-y-4"
          >

            {/* Fake Autofill Blockers */}
            <input
              type="text"
              name="fake-register-user"
              className="hidden"
            />

            <input
              type="password"
              name="fake-register-password"
              className="hidden"
            />

            {/* Name */}
            <div>
              <label className="label">
                Full Name *
              </label>

              <input
                type="text"
                className="input-field"
                placeholder="Juan dela Cruz"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value
                  })
                }
              />
            </div>

            {/* Email */}
            <div>
              <label className="label">
                Email Address *
              </label>

              <input
                type="email"
                name="customer-register-email"
                autoComplete="new-email"
                className="input-field"
                placeholder="juan@example.com"
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
            <div className="grid grid-cols-2 gap-3">

              <div>
                <label className="label">
                  Password *
                </label>

                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="customer-register-password"
                    autoComplete="new-password"
                    className="input-field pr-10"
                    placeholder="••••••"
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
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPass ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="label">
                  Confirm Password *
                </label>

                <input
                  type="password"
                  name="customer-confirm-password"
                  autoComplete="new-password"
                  className="input-field"
                  placeholder="••••••"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      confirmPassword: e.target.value
                    })
                  }
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="label">
                Phone Number
              </label>

              <input
                type="tel"
                className="input-field"
                placeholder="09XX XXX XXXX"
                value={form.phone}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value
                  })
                }
              />
            </div>

            {/* Address */}
            <div>
              <label className="label">
                Address
              </label>

              <input
                type="text"
                className="input-field"
                placeholder="Your home address"
                value={form.address}
                onChange={(e) =>
                  setForm({
                    ...form,
                    address: e.target.value
                  })
                }
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus size={18} />
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-5 text-center space-y-2">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-blue-700 font-medium hover:underline"
              >
                Sign In
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

export default RegisterPage;