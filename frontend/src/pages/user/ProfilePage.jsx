import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api, { getUploadUrl } from '../../services/api';
import { RatingStars } from '../../components/common/UI';
import toast from 'react-hot-toast';
import { Save, User, Mail, Phone, MapPin, Lock, Eye, EyeOff, Camera, Upload } from 'lucide-react';

const MAX_PROFILE_IMAGE_SIZE = 2 * 1024 * 1024;
const ALLOWED_PROFILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [selectedPicture, setSelectedPicture] = useState(null);
  const [picturePreview, setPicturePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);

  useEffect(() => {
    setForm({
      name: user?.name || '',
      phone: user?.phone || '',
      address: user?.address || '',
    });
  }, [user]);

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
      toast.success('Profile picture updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Profile picture upload failed.');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required.'); return; }
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', form);
      updateUser(data.user);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!pwForm.currentPassword || !pwForm.newPassword) { toast.error('All password fields are required.'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('New password must be at least 6 characters.'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match.'); return; }
    setSavingPw(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password change failed.');
    } finally {
      setSavingPw(false);
    }
  };

  const togglePw = (field) => setShowPw(prev => ({ ...prev, [field]: !prev[field] }));

  return (
    <div className="max-w-2xl">
      <div className="page-header">
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your personal information and security.</p>
      </div>

      {/* Avatar section */}
      <div className="card p-6 mb-6 flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="relative w-24 h-24 flex-shrink-0">
          {profilePictureUrl ? (
            <img
              src={profilePictureUrl}
              alt="Profile"
              className="w-24 h-24 rounded-2xl object-cover border border-gray-200 shadow-sm"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-4xl">
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
          <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
          <p className="text-gray-500 text-sm break-all">{user?.email}</p>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold mt-1 inline-block ${
            user?.role === 'admin' ? 'bg-red-100 text-red-700' :
            user?.role === 'worker' ? 'bg-amber-100 text-amber-700' :
            'bg-blue-100 text-blue-700'
          }`}>{user?.role?.toUpperCase()}</span>

          <RatingStars rating={user?.averageRating || 0} count={user?.ratingCount || 0} className="mt-3" label="as a client" />

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

      {/* Profile Form */}
      <div className="card p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <User size={18} className="text-blue-600" /> Personal Information
        </h3>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="input-field pl-9"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Your full name"
              />
            </div>
          </div>
          <div>
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                className="input-field pl-9 bg-gray-50 cursor-not-allowed"
                value={user?.email || ''}
                disabled
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
          </div>
          <div>
            <label className="label">Phone Number</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                className="input-field pl-9"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="09XX XXX XXXX"
              />
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3 top-3.5 text-gray-400" />
              <textarea
                className="input-field pl-9 resize-none"
                rows={2}
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="Your home address"
              />
            </div>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={16} /> Save Changes</>}
          </button>
        </form>
      </div>

      {/* Password Change */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
          <Lock size={18} className="text-blue-600" /> Change Password
        </h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {[
            { key: 'current', label: 'Current Password', field: 'currentPassword' },
            { key: 'new', label: 'New Password', field: 'newPassword' },
            { key: 'confirm', label: 'Confirm New Password', field: 'confirmPassword' },
          ].map(({ key, label, field }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw[key] ? 'text' : 'password'}
                  className="input-field pl-9 pr-11"
                  value={pwForm[field]}
                  onChange={e => setPwForm({ ...pwForm, [field]: e.target.value })}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => togglePw(key)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}
          <button type="submit" disabled={savingPw} className="btn-primary">
            {savingPw ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Lock size={16} /> Update Password</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
