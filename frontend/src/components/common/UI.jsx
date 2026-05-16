// Status badge component
export const StatusBadge = ({ status }) => {
  const config = {
    pending: 'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
    accepted: 'badge-accepted',
    in_progress: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800',
    suspended: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800',
    open: 'badge-pending',
    in_review: 'badge-accepted',
    resolved: 'badge-approved',
    dismissed: 'badge-cancelled',
  };
  return (
    <span className={config[status] || 'badge-pending'}>
      {status?.replace('_', ' ').charAt(0).toUpperCase() + status?.replace('_', ' ').slice(1)}
    </span>
  );
};

// Stat card component
export const StatCard = ({ label, value, icon: Icon, color = 'blue', trend }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && <p className="text-xs text-gray-500 mt-1">{trend}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
};

// Loading spinner
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`${sizes[size]} border-4 border-blue-600 border-t-transparent rounded-full animate-spin ${className}`} />
  );
};

// Empty state
export const EmptyState = ({ title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    <p className="text-gray-500 mt-1 max-w-sm">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// Service type label
const SERVICE_LABELS = {
  plumbing: '🔧 Plumbing',
  electrical: '⚡ Electrical',
  cleaning: '🧹 Cleaning',
  carpentry: '🪚 Carpentry',
  painting: '🎨 Painting',
  hvac: '❄️ HVAC',
  landscaping: '🌿 Landscaping',
  pest_control: '🐛 Pest Control',
  appliance_repair: '🔌 Appliance Repair',
  general_repair: '🏠 General Repair',
};

export const formatServiceType = (type = '') => {
  if (!type) return 'Service';
  return type
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const ServiceLabel = ({ type, name, icon }) => (
  <span>{name ? `${icon || '🛠️'} ${name}` : SERVICE_LABELS[type] || formatServiceType(type)}</span>
);

export const RatingStars = ({ rating = 0, count, label, className = '' }) => {
  const value = Number(rating) || 0;
  const filledStars = Math.round(value);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center" aria-label={`${value || 0} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-sm leading-none ${star <= filledStars ? 'text-amber-400' : 'text-gray-300'}`}
          >
            ★
          </span>
        ))}
      </div>
      <span className="text-sm text-gray-600">
        {value > 0 ? value.toFixed(value % 1 === 0 ? 0 : 1) : 'No ratings yet'}
        {typeof count === 'number' && count > 0 ? ` (${count})` : ''}
        {label ? ` ${label}` : ''}
      </span>
    </div>
  );
};

export const RatingInput = ({ value, onChange, disabled = false }) => (
  <div className="flex items-center gap-1" role="radiogroup" aria-label="Select rating">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        disabled={disabled}
        onClick={() => onChange(star)}
        className={`text-2xl leading-none transition-colors ${star <= value ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'} disabled:cursor-not-allowed`}
        aria-label={`${star} star${star > 1 ? 's' : ''}`}
      >
        ★
      </button>
    ))}
  </div>
);

export const SERVICE_OPTIONS = Object.entries(SERVICE_LABELS).map(([value, label]) => ({
  value,
  label,
}));
