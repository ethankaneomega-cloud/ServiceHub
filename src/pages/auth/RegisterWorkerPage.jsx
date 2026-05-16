import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../../services/api';

import {
  Eye,
  EyeOff,
  Upload,
  HardHat,
  ArrowLeft
} from 'lucide-react';


const RegisterWorkerPage = () => {
  const { registerWorker } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    serviceType: '',
    bio: '',
    experience: '',
    hourlyRate: '',
    phone: '',
    location: '',
  });

  const [file, setFile] = useState(null);
  const [services, setServices] = useState([]);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(true);

  useEffect(() => {
    setForm({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      serviceType: '',
      bio: '',
      experience: '',
      hourlyRate: '',
      phone: '',
      location: '',
    });

    setFile(null);

    api.get('/services')
      .then(({ data }) => setServices(data.services || []))
      .catch(() => toast.error('Failed to load service options.'))
      .finally(() => setLoadingServices(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.email ||
      !form.password ||
      !form.serviceType
    ) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$/;

    if (!passwordRegex.test(form.password)) {
      toast.error(
        'Password must contain at least 1 uppercase letter and 1 special character.'
      );
      return;
    }

    if (!file) {
      toast.error(
        'Please upload your credentials/requirements file.'
      );
      return;
    }

    const formData = new FormData();

    Object.entries(form).forEach(([k, v]) => {
      if (k !== 'confirmPassword') {
        formData.append(k, v);
      }
    });

    formData.append('requirementsFile', file);

    setLoading(true);

    try {
      await registerWorker(formData);

      toast.success(
        'Worker application submitted! Pending admin approval.'
      );

      navigate('/worker');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center p-4 py-10 relative">

      {/* Back Button */}
      <button
        onClick={() => navigate('/')}
        className="fixed top-5 left-5 z-50 flex items-center gap-2 bg-white/10 backdrop-blur-md text-white px-4 py-2 rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-300 shadow-lg"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">

          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-400 rounded-2xl mb-4">
            <HardHat size={28} className="text-white" />
          </div>

          <h1 className="text-3xl font-bold text-white">
            Register as Worker
          </h1>

          <p className="text-blue-300 mt-1">
            Join our platform and start accepting jobs
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
              name="fake-worker-email"
              className="hidden"
            />

            <input
              type="password"
              name="fake-worker-password"
              className="hidden"
            />

            {/* Name + Phone */}
            <div className="grid grid-cols-2 gap-3">

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

              <div>
                <label className="label">
                  Phone *
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
            </div>

            {/* Email */}
            <div>
              <label className="label">
                Email Address *
              </label>

              <input
                type="email"
                name="worker-register-email"
                autoComplete="new-email"
                className="input-field"
                placeholder="worker@example.com"
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
                    name="worker-register-password"
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
                  name="worker-confirm-password"
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

            {/* Service Type */}
            <div>
              <label className="label">
                Service Type *
              </label>

              <select
                className="input-field"
                disabled={loadingServices}
                value={form.serviceType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    serviceType: e.target.value
                  })
                }
              >
                <option value="">
                  {loadingServices ? 'Loading services...' : 'Select your service...'}
                </option>

                {services.map((service) => (
                  <option key={service._id || service.id} value={service.id}>
                    {service.icon ? `${service.icon} ` : ''}{service.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Experience + Rate */}
            <div className="grid grid-cols-2 gap-3">

              <div>
                <label className="label">
                  Experience (years)
                </label>

                <input
                  type="number"
                  min="0"
                  className="input-field"
                  placeholder="0"
                  value={form.experience}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      experience: e.target.value
                    })
                  }
                />
              </div>

              <div>
                <label className="label">
                  Hourly Rate (₱)
                </label>

                <input
                  type="number"
                  min="0"
                  className="input-field"
                  placeholder="500"
                  value={form.hourlyRate}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      hourlyRate: e.target.value
                    })
                  }
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="label">
                Location / Area
              </label>

              <input
                type="text"
                className="input-field"
                placeholder="e.g. Cebu City, Visayas"
                value={form.location}
                onChange={(e) =>
                  setForm({
                    ...form,
                    location: e.target.value
                  })
                }
              />
            </div>

            {/* Bio */}
            <div>
              <label className="label">
                Bio / Description
              </label>

              <textarea
                className="input-field resize-none"
                rows={3}
                placeholder="Describe your skills and experience..."
                value={form.bio}
                onChange={(e) =>
                  setForm({
                    ...form,
                    bio: e.target.value
                  })
                }
              />
            </div>

            {/* Upload */}
            <div>
              <label className="label">
                Requirements / Credentials *
              </label>

              <div
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  file
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 hover:border-blue-400'
                }`}
              >
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="hidden"
                  id="file-upload"
                  onChange={(e) =>
                    setFile(e.target.files[0])
                  }
                />

                <label
                  htmlFor="file-upload"
                  className="cursor-pointer"
                >
                  <Upload
                    size={24}
                    className={`mx-auto mb-2 ${
                      file
                        ? 'text-green-500'
                        : 'text-gray-400'
                    }`}
                  />

                  {file ? (
                    <p className="text-sm text-green-700 font-medium">
                      {file.name}
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600">
                        Click to upload credentials
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        PDF, JPG, PNG up to 5MB
                      </p>
                    </>
                  )}
                </label>
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
                  <HardHat size={18} />
                  Submit Application
                </>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="mt-5 text-center">
            <p className="text-gray-500 text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-blue-700 font-medium hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>

          {/* Note */}
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
            <strong>Note:</strong> Your application will
            be reviewed by an admin. You'll be able to
            accept jobs once approved.
          </div>

        </div>
      </div>
    </div>
  );
};

export default RegisterWorkerPage;