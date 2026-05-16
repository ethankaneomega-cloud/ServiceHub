import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { getUploadUrl } from '../../services/api';
import {
  Spinner,
  EmptyState,
  ServiceLabel,
  RatingStars
} from '../../components/common/UI';

import {
  Star,
  MapPin,
  Briefcase,
  Search
} from 'lucide-react';

const WorkersPage = () => {
  const [workers, setWorkers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();

  const [serviceFilter, setServiceFilter] = useState(
    searchParams.get('serviceType') || ''
  );

  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.get('/services')
      .then(({ data }) => setServices(data.services || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);

    const params = serviceFilter
      ? `?serviceType=${serviceFilter}`
      : '';

    api.get(`/workers${params}`)
      .then(({ data }) => {
        setWorkers(data.workers);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [serviceFilter]);

  const handleFilter = (val) => {
    setServiceFilter(val);

    if (val) {
      setSearchParams({ serviceType: val });
    } else {
      setSearchParams({});
    }
  };

  // SEARCH FILTER
  const filteredWorkers = workers.filter((worker) => {
    const name = worker.userId?.name?.toLowerCase() || '';
    const location = worker.location?.toLowerCase() || '';
    const bio = worker.bio?.toLowerCase() || '';
    const service = worker.serviceType?.toLowerCase() || '';

    return (
      name.includes(searchTerm.toLowerCase()) ||
      location.includes(searchTerm.toLowerCase()) ||
      bio.includes(searchTerm.toLowerCase()) ||
      service.includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Find Workers</h1>

        <p className="page-subtitle">
          Browse our approved service professionals.
        </p>
      </div>

      {/* SEARCH + FILTER */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 max-w-2xl">

        {/* SEARCH */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            className="input-field pl-10"
            placeholder="Search workers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* SERVICE FILTER */}
        <div className="relative sm:max-w-xs w-full">
          <select
            value={serviceFilter}
            onChange={(e) => handleFilter(e.target.value)}
            className="input-field w-full appearance-none cursor-pointer pr-10"
          >
            <option value="">All Services</option>

            {services.map((service) => (
              <option
                key={service._id || service.id}
                value={service.id}
              >
                {service.icon ? `${service.icon} ` : ''}
                {service.name}
              </option>
            ))}
          </select>

          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
            ▼
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : filteredWorkers.length === 0 ? (
        <EmptyState
          title="No workers found"
          description="No approved workers available for this search or service type yet."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWorkers.map((worker) => (
            <div
              key={worker._id}
              className="card p-5 hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-3 mb-4">

                {getUploadUrl(worker.userId?.profilePicture) ? (
                  <img
                    src={getUploadUrl(worker.userId?.profilePicture)}
                    alt={worker.userId?.name || 'Worker'}
                    className="w-12 h-12 rounded-full object-cover border border-gray-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-lg flex-shrink-0">
                    {worker.userId?.name?.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {worker.userId?.name}
                  </h3>

                  <p className="text-sm text-blue-700 font-medium">
                    <ServiceLabel type={worker.serviceType} />
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-4">

                {worker.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin size={14} />
                    <span>{worker.location}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Briefcase size={14} />
                  <span>{worker.experience || 0} years experience</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Star
                    size={14}
                    className="text-amber-400"
                  />

                  <RatingStars
                    rating={worker.rating}
                    count={worker.ratingCount || 0}
                  />

                  <span>· {worker.totalJobs} jobs</span>
                </div>
              </div>

              {worker.bio && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {worker.bio}
                </p>
              )}

              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">
                  ₱{worker.hourlyRate?.toLocaleString() || '—'}/hr
                </span>

                <Link
                  to={`/book/${worker._id}`}
                  className="btn-primary py-2 px-4 text-sm"
                >
                  Book Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkersPage; 

//FIX LIST BOX OF SERVICES   