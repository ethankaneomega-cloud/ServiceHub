import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api, { getUploadUrl } from '../../services/api';
import { RatingStars, ServiceLabel } from '../../components/common/UI';
import toast from 'react-hot-toast';
import { Camera, Save, Upload } from 'lucide-react';

const MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_PROFILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const WorkerProfilePage = () => {
  const { user, workerProfile, updateUser, updateWorkerProfile } = useAuth();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({ bio: '', experience: '', hourlyRate: '', location: '' });
  const [selectedPicture, setSelectedPicture] = useState(null);
  const [picturePreview, setPicturePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  useEffect(() => {
    if (workerProfile) {
      setForm({
        bio: workerProfile.bio || '',
        experience: workerProfile.experience || '',
        hourlyRate: workerProfile.hourlyRate || '',
        location: workerProfile.location || '',
      });
    }
  }, [workerProfile]);

  useEffect(() => {
    return () => {
      if (picturePreview) URL.revokeObjectURL(picturePreview);
    };
  }, [picturePreview]);

  const profilePictureUrl = picturePreview || getUploadUrl(user?.profilePicture);

  const handlePictureSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_PROFILE_TYPES.includes(file.type)) {
      toast.error('Please select a JPG, PNG, or WEBP image.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      toast.error('Profile picture must be 2MB or smaller.');
      e.target.value = '';
      return;
    }

    if (picturePreview) URL.revokeObjectURL(picturePreview);
    setSelectedPicture(file);
    setPicturePreview(URL.createObjectURL(file));
  };

  const handlePictureUpload = async () => {
    if (!selectedPicture) {
      toast.error('Please choose a profile picture first.');
      return;
    }

    const formData = new FormData();
    formData.append('profilePicture', selectedPicture);
    setUploadingPicture(true);

    try {
      const { data } = await api.put('/auth/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(data.user);
      setSelectedPicture(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Profile picture updated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Profile picture upload failed.');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/workers/me/profile', form);
      updateWorkerProfile(data.worker);
      toast.success('Profile updated successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Update your professional information.</p>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Account Info</h2>
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="relative w-24 h-24 flex-shrink-0">
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt="Profile"
                className="w-24 h-24 rounded-2xl object-cover border border-gray-200 shadow-sm"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-white font-bold text-4xl">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
              title="Choose profile picture"
            >
              <Camera size={16} />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Full Name</p>
                <p className="font-medium text-gray-900 mt-0.5">{user?.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium text-gray-900 mt-0.5 break-all">{user?.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Service Type</p>
                <p className="font-medium text-gray-900 mt-0.5"><ServiceLabel type={workerProfile?.serviceType} /></p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p className={`font-medium mt-0.5 capitalize ${workerProfile?.isApproved ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {workerProfile?.status || 'pending'}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-gray-500">Worker Rating</p>
                <RatingStars rating={workerProfile?.rating || 0} count={workerProfile?.ratingCount || 0} className="mt-1" />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePictureSelect}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary text-sm"
              >
                <Camera size={15} /> Choose Photo
              </button>
              <button
                type="button"
                disabled={!selectedPicture || uploadingPicture}
                onClick={handlePictureUpload}
                className="btn-primary text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {uploadingPicture ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload size={15} />}
                Upload Photo
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">JPG, PNG, or WEBP only. Maximum file size: 2MB.</p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Professional Details</h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Experience (years)</label>
              <input type="number" min="0" className="input-field" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} />
            </div>
            <div>
              <label className="label">Hourly Rate (₱)</label>
              <input type="number" min="0" className="input-field" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Location / Service Area</label>
            <input type="text" className="input-field" placeholder="e.g. Cebu City" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea className="input-field resize-none" rows={4} placeholder="Describe your skills..." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={16} />Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default WorkerProfilePage;
