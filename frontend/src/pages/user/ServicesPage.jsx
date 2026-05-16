import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Spinner } from '../../components/common/UI';
import { Search, ChevronRight } from 'lucide-react';

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/services').then(({ data }) => {
      setServices(data.services);
      setLoading(false);
    });
  }, []);

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Our Services</h1>
        <p className="page-subtitle">Find the right professional for your home needs.</p>
      </div>

      <div className="mb-6 max-w-md">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="input-field pl-10"
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((service) => (
            <button
              key={service.id}
              onClick={() => navigate(`/workers?serviceType=${service.id}`)}
              className="card p-6 text-left hover:shadow-card-hover transition-all duration-200 group hover:-translate-y-0.5"
            >
              <div className="text-4xl mb-3">{service.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                {service.name}
              </h3>
              <p className="text-gray-500 text-sm mt-1.5">{service.description}</p>
              <div className="flex items-center justify-between mt-4">
                <span className="text-sm font-medium text-blue-700">
                  Avg. ₱{service.avgRate.toLocaleString()}/hr
                </span>
                <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
