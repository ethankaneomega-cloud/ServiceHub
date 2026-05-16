import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getUploadUrl } from '../../services/api';
import { ServiceLabel, Spinner } from '../../components/common/UI';
import { Calendar, Clock, MapPin, FileText, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ADDRESS_DATA = {
  "Cebu City": ["Guadalupe", "Lahug", "Mabolo", "Banilad", "Talamban"],
  "Mandaue City": ["Tipolo", "Subangdaku", "Paknaan", "Bakilid"],
  "Lapu-Lapu City": ["Pajo", "Basak", "Maribago", "Mactan"]
};

// 12-hour format slots ONLY (8AM–5PM)
const TIME_SLOTS = [
  { value: "08:00", label: "8:00 AM" },
  { value: "09:00", label: "9:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "13:00", label: "1:00 PM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "15:00", label: "3:00 PM" },
  { value: "16:00", label: "4:00 PM" },
  { value: "17:00", label: "5:00 PM" },
];

const BookingPage = () => {
  const { workerId } = useParams();
  const navigate = useNavigate();

  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // ✅ LIVE TIME STATE
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000); // updates every minute

    return () => clearInterval(interval);
  }, []);

  const [form, setForm] = useState({
    scheduleDate: '',
    scheduleTime: '',
    city: '',
    barangay: '',
    street: '',
    landmark: '',
    description: '',
  });

  useEffect(() => {
    api.get(`/workers/${workerId}`)
      .then(({ data }) => {
        setWorker(data.worker);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Worker not found.');
        navigate('/workers');
      });
  }, [workerId, navigate]);

  // ✅ LIVE MIN DATE (TOMORROW ALWAYS UPDATED)
  const minDate = new Date(now.getTime() + 86400000)
    .toISOString()
    .split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.scheduleDate ||
      !form.scheduleTime ||
      !form.city ||
      !form.barangay ||
      !form.street
    ) {
      toast.error('Please fill in all required fields.');
      return;
    }

    // ✅ STRICT VALIDATION (tomorrow onwards only)
    const today = new Date(now);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const selectedDate = new Date(form.scheduleDate);

    if (selectedDate < tomorrow) {
      toast.error('You can only book starting tomorrow.');
      return;
    }

    const fullAddress =
      `${form.street}, ${form.barangay}, ${form.city}` +
      (form.landmark ? ` (${form.landmark})` : '');

    setSubmitting(true);
    try {
      await api.post('/bookings', {
        workerId: worker._id,
        serviceType: worker.serviceType,
        scheduleDate: form.scheduleDate,
        scheduleTime: form.scheduleTime,
        address: fullAddress,
        description: form.description,
      });

      setSuccess(true);
      toast.success('Booking submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} className="text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Booking Submitted!</h2>
        <p className="text-gray-500 mt-2">
          Your request has been sent to {worker?.userId?.name}. You'll be notified once they confirm.
        </p>

        <div className="flex gap-3 justify-center mt-6">
          <button onClick={() => navigate('/my-bookings')} className="btn-primary">
            View My Bookings
          </button>
          <button onClick={() => navigate('/workers')} className="btn-secondary">
            Book Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Book a Service</h1>
        <p className="page-subtitle">Fill in the details for your booking request.</p>
      </div>

      {/* Worker Info */}
      <div className="card p-5 mb-6">
        <div className="flex items-center gap-4">
          {getUploadUrl(worker?.userId?.profilePicture) ? (
            <img
              src={getUploadUrl(worker?.userId?.profilePicture)}
              alt={worker?.userId?.name || 'Worker'}
              className="w-14 h-14 rounded-full object-cover border border-gray-200 flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold flex-shrink-0">
              {worker?.userId?.name?.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-lg text-gray-900">
              {worker?.userId?.name}
            </h3>
            <p className="text-blue-700 text-sm font-medium">
              <ServiceLabel type={worker?.serviceType} />
            </p>
            <p className="text-gray-500 text-sm mt-0.5">
              ₱{worker?.hourlyRate?.toLocaleString() || '—'}/hr · {worker?.experience || 0} yrs experience
            </p>
          </div>
        </div>
      </div>

      {/* FORM */}
      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* DATE */}
          <div>
            <label className="label">
              <Calendar size={14} className="inline mr-1.5" />
              Schedule Date *
            </label>
            <input
              type="date"
              className="input-field"
              min={minDate}
              value={form.scheduleDate}
              onChange={(e) =>
                setForm({ ...form, scheduleDate: e.target.value })
              }
            />
          </div>

          {/* TIME */}
          <div>
            <label className="label">
              <Clock size={14} className="inline mr-1.5" />
              Preferred Time *
            </label>

            <select
              className="input-field"
              value={form.scheduleTime}
              onChange={(e) =>
                setForm({ ...form, scheduleTime: e.target.value })
              }
            >
              <option value="" disabled hidden>
                Select Time
              </option>

              {TIME_SLOTS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            <p className="text-xs text-gray-500 mt-1">
              Available: 8:00 AM – 5:00 PM only
            </p>
          </div>

          {/* CITY */}
          <div>
            <label className="label">City *</label>
            <select
              className="input-field"
              value={form.city}
              onChange={(e) =>
                setForm({
                  ...form,
                  city: e.target.value,
                  barangay: ''
                })
              }
            >
              <option value="" disabled hidden>
                Select City
              </option>
              {Object.keys(ADDRESS_DATA).map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          {/* BARANGAY */}
          <div>
            <label className="label">Barangay *</label>
            <select
              className="input-field"
              value={form.barangay}
              disabled={!form.city}
              onChange={(e) =>
                setForm({ ...form, barangay: e.target.value })
              }
            >
              <option value="" disabled hidden>
                Select Barangay
              </option>
              {form.city &&
                ADDRESS_DATA[form.city].map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
            </select>
          </div>

          {/* STREET */}
          <div>
            <label className="label">Purok / Street *</label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter street or purok"
              value={form.street}
              onChange={(e) =>
                setForm({ ...form, street: e.target.value })
              }
            />
          </div>

          {/* LANDMARK */}
          <div>
            <label className="label">Landmark (optional)</label>
            <input
              type="text"
              className="input-field"
              placeholder="Near church, store, etc."
              value={form.landmark}
              onChange={(e) =>
                setForm({ ...form, landmark: e.target.value })
              }
            />
          </div>

          {/* DESCRIPTION */}
          <div>
            <label className="label">
              <FileText size={14} className="inline mr-1.5" />
              Description / Notes
            </label>
            <textarea
              className="input-field resize-none"
              rows={4}
              placeholder="Describe your request..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          {/* BUTTONS */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex-1 justify-center py-3"
            >
              {submitting ? 'Processing...' : 'Confirm Booking'}
            </button>

            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary px-6"
            >
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default BookingPage;