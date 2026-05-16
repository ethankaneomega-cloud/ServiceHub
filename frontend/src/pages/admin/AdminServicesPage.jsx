import { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { EmptyState, Spinner } from '../../components/common/UI';
import { Plus, Pencil, Trash2, X, Save, Search, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '',
  description: '',
  icon: '🛠️',
  avgRate: '',
  isActive: true,
};

const AdminServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/services/admin/all');
      setServices(data.services || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const filteredServices = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return services;

    return services.filter((service) =>
      service.name?.toLowerCase().includes(term) ||
      service.description?.toLowerCase().includes(term) ||
      service.id?.toLowerCase().includes(term)
    );
  }, [services, search]);

  const openCreateModal = () => {
    setEditingService(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (service) => {
    setEditingService(service);
    setForm({
      name: service.name || '',
      description: service.description || '',
      icon: service.icon || '🛠️',
      avgRate: service.avgRate ?? '',
      isActive: service.isActive ?? true,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingService(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.description.trim()) {
      toast.error('Service name and description are required.');
      return;
    }

    if (Number(form.avgRate) < 0) {
      toast.error('Average rate cannot be negative.');
      return;
    }

    const payload = {
      ...form,
      avgRate: Number(form.avgRate || 0),
    };

    setSaving(true);
    try {
      if (editingService) {
        await api.put(`/services/${editingService._id}`, payload);
        toast.success('Service updated successfully.');
      } else {
        await api.post('/services', payload);
        toast.success('Service created successfully.');
      }
      closeModal();
      fetchServices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save service.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (service) => {
    const confirmed = window.confirm(
      `Delete ${service.name}? Services already used by workers or bookings cannot be deleted.`
    );

    if (!confirmed) return;

    setDeleting(service._id);
    try {
      await api.delete(`/services/${service._id}`);
      toast.success('Service deleted successfully.');
      fetchServices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete service.');
    } finally {
      setDeleting('');
    }
  };

  const toggleStatus = async (service) => {
    try {
      await api.put(`/services/${service._id}`, { isActive: !service.isActive });
      toast.success(`Service ${service.isActive ? 'deactivated' : 'activated'} successfully.`);
      fetchServices();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update service status.');
    }
  };

  return (
    <div>
      <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">Services Management</h1>
          <p className="page-subtitle">Create, edit, deactivate, or delete the services available in ServiceHub.</p>
        </div>
        <button onClick={openCreateModal} className="btn-primary w-fit">
          <Plus size={16} />
          Add Service
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Service List</h2>
            <p className="text-sm text-gray-500">{services.length} service{services.length === 1 ? '' : 's'} registered</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
        ) : filteredServices.length === 0 ? (
          <EmptyState
            title="No services found"
            description={search ? 'No services matched your search.' : 'Create your first service to make it available to users and workers.'}
            action={<button onClick={openCreateModal} className="btn-primary"><Plus size={16} />Add Service</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">Service</th>
                  <th className="px-5 py-3 text-left font-semibold">Service ID</th>
                  <th className="px-5 py-3 text-left font-semibold">Average Rate</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredServices.map((service) => (
                  <tr key={service._id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl flex-shrink-0">
                          {service.icon || '🛠️'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{service.name}</p>
                          <p className="text-gray-500 max-w-md line-clamp-2">{service.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-gray-500">{service.id}</td>
                    <td className="px-5 py-4 font-medium text-gray-900">₱{Number(service.avgRate || 0).toLocaleString()}/hr</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleStatus(service)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${service.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}
                      >
                        {service.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                        {service.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(service)}
                          className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(service)}
                          disabled={deleting === service._id}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === service._id
                            ? <span className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin inline-block" />
                            : <Trash2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{editingService ? 'Edit Service' : 'Create Service'}</h2>
                <p className="text-sm text-gray-500">
                  {editingService ? 'Update the service details.' : 'Add a new service category for users and workers.'}
                </p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {editingService && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                  <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Service ID</p>
                  <p className="font-mono text-sm text-blue-900 mt-0.5">{editingService.id}</p>
                  <p className="text-xs text-blue-700 mt-1">The ID is kept stable because workers and bookings use it internally.</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Icon</label>
                  <input
                    type="text"
                    className="input-field text-center text-xl"
                    maxLength={4}
                    value={form.icon}
                    onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="label">Service Name *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Roofing"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Description *</label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Describe what this service covers."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Average Rate (₱/hr)</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    placeholder="0"
                    value={form.avgRate}
                    onChange={(e) => setForm({ ...form, avgRate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select
                    className="input-field"
                    value={form.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setForm({ ...form, isActive: e.target.value === 'active' })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                  {editingService ? 'Save Changes' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServicesPage;
