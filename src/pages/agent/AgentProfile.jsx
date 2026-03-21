// src/pages/agent/AgentProfile.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { agentService } from '../../api/agentApi';
import { toast } from 'sonner';
import Swal from 'sweetalert2';
import {
  FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaCity,
  FaGlobe, FaMapPin, FaPercent, FaWallet, FaMoneyBillWave,
  FaCamera, FaSave, FaSync, FaArrowLeft, FaCheckCircle,
  FaTimes, FaEdit, FaIdCard, FaBuilding, FaStar,
  FaShieldAlt, FaCreditCard, FaHistory
} from 'react-icons/fa';
import {
  User, Mail, Phone, MapPin, Globe, Lock, Upload,
  Calendar, Clock, Award, Shield, CreditCard
} from 'lucide-react';

// ─────────────────────────────────────────────
// Stat Card Component
// ─────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, bgColor }) => (
  <div className={`bg-gradient-to-br ${bgColor} rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1`}>
    <div className="flex items-center justify-between mb-3">
      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
        <Icon size={18} className="text-white" />
      </div>
    </div>
    <p className="text-3xl font-bold mb-1">{value}</p>
    <p className="text-xs text-white/80 uppercase tracking-wider">{label}</p>
  </div>
);

// ─────────────────────────────────────────────
// Info Row Component
// ─────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value, isEdit, children }) => (
  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 transition-all">
    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
      <Icon size={16} />
    </div>
    <div className="flex-1">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      {isEdit ? children : <p className="text-sm font-semibold text-gray-900 mt-1">{value || '—'}</p>}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// Main AgentProfile Component
// ─────────────────────────────────────────────
export default function AgentProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Fetch agent profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await agentService.getProfile();
      const agentData = data?.agent || data || {};

      setAgent(agentData);

      // Set form values
      setName(agentData.name || '');
      setPhone(agentData.phone || '');
      setAddress(agentData.address || '');
      setCity(agentData.city || '');
      setState(agentData.state || '');
      setPincode(agentData.pincode || '');
      setImagePreview(agentData.image ? `http://localhost:5000/uploads/${agentData.image}` : null);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate password if provided
    if (password && password !== confirmPassword) {
      return toast.error('Passwords do not match!');
    }

    setUpdating(true);
    try {
      const formData = new FormData();

      // Append text fields
      if (name !== agent?.name) formData.append('name', name);
      if (phone !== agent?.phone) formData.append('phone', phone);
      if (address !== agent?.address) formData.append('address', address);
      if (city !== agent?.city) formData.append('city', city);
      if (state !== agent?.state) formData.append('state', state);
      if (pincode !== agent?.pincode) formData.append('pincode', pincode);
      if (password) formData.append('password', password);

      // Append image file if selected
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      const res = await agentService.updateProfile(formData);

      if (res.success) {
        toast.success(res.message || 'Profile updated successfully!');
        setEditMode(false);
        setPassword('');
        setConfirmPassword('');
        setSelectedFile(null);
        fetchProfile(); // Refresh data
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setPassword('');
    setConfirmPassword('');
    setSelectedFile(null);
    // Reset form to original values
    setName(agent?.name || '');
    setPhone(agent?.phone || '');
    setAddress(agent?.address || '');
    setCity(agent?.city || '');
    setState(agent?.state || '');
    setPincode(agent?.pincode || '');
    setImagePreview(agent?.image ? `http://localhost:5000/uploads/${agent.image}` : null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-blue-600 border-t-transparent mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <FaUser className="text-blue-600 opacity-50" size={24} />
            </div>
          </div>
          <p className="text-gray-600 mt-4 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 px-4 sm:px-6">

      {/* Header */}
      <div className="max-w-8xl mx-auto mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-8 bg-blue-600 rounded-full" />
                Agent Profile
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 ml-3">
                Manage your personal information and settings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 text-sm font-medium shadow-lg shadow-blue-200"
              >
                <FaEdit size={14} />
                Edit Profile
              </button>
            ) : (
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 text-sm font-medium"
              >
                <FaTimes size={14} />
                Cancel
              </button>
            )}
            <button
              onClick={fetchProfile}
              className="w-10 h-10 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:shadow-md transition-all flex items-center justify-center"
              title="Refresh"
            >
              <FaSync size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-8xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden sticky top-6">

              {/* Cover Photo */}
              <div className="relative h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                <div className="absolute inset-0 bg-black/10" />
              </div>

              {/* Profile Image */}
              <div className="relative px-6 pb-6">
                <div className="flex justify-center">
                  <div className="relative -mt-16">
                    <div className="w-28 h-28 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt={agent?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                          <FaUser size={40} className="text-blue-600" />
                        </div>
                      )}
                    </div>
                    {editMode && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-1 -right-1 w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:bg-blue-700 hover:scale-110 transition-all border-2 border-white"
                      >
                        <FaCamera size={14} />
                      </button>
                    )}
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </div>
                </div>

                {/* Profile Info */}
                <div className="text-center mt-4">
                  <h2 className="text-xl font-bold text-gray-900">{agent?.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{agent?.email}</p>
                  <p className="text-sm text-gray-500">{agent?.phone}</p>

                  {/* Status Badge */}
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-medium text-green-700">
                      {agent?.isActive ? 'Active Account' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                    <FaPercent className="text-blue-600 mx-auto mb-2" size={20} />
                    <p className="text-xs text-gray-500">Commission</p>
                    <p className="text-xl font-bold text-gray-900">{agent?.commissionPercentage || 0}%</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                    <FaWallet className="text-green-600 mx-auto mb-2" size={20} />
                    <p className="text-xs text-gray-500">Wallet</p>
                    <p className="text-xl font-bold text-green-600">₹{agent?.walletBalance?.toLocaleString() || 0}</p>
                  </div>
                </div>

                {/* Total Earnings */}
                <div className="mt-3 bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaMoneyBillWave className="text-purple-600" size={20} />
                      <span className="text-xs text-gray-500">Total Earnings</span>
                    </div>
                    <p className="text-lg font-bold text-purple-600">₹{agent?.totalEarnings?.toLocaleString() || 0}</p>
                  </div>
                </div>

                {/* Member Since */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1">
                      <Calendar size={14} />
                      Member since
                    </span>
                    <span className="font-medium text-gray-900">
                      {agent?.createdAt ? new Date(agent.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6">

              {/* Section Header */}
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FaIdCard className="text-blue-600" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Update your personal details</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Name */}
                <InfoRow icon={User} label="Full Name" value={name} isEdit={editMode}>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full mt-2 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    placeholder="Enter your name"
                    required
                  />
                </InfoRow>

                {/* Phone */}
                <InfoRow icon={Phone} label="Phone Number" value={phone} isEdit={editMode}>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full mt-2 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    placeholder="Enter phone number"
                    required
                  />
                </InfoRow>

                {/* Email (Read-only) */}
                <InfoRow icon={Mail} label="Email Address" value={agent?.email} />

                {/* Address */}
                <InfoRow icon={MapPin} label="Address" value={address} isEdit={editMode}>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full mt-2 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                    placeholder="Enter your address"
                  />
                </InfoRow>

                {/* City, State, Pincode Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* City */}
                  <InfoRow icon={Globe} label="City" value={city} isEdit={editMode}>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full mt-2 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                      placeholder="City"
                    />
                  </InfoRow>

                  {/* State */}
                  <InfoRow icon={MapPin} label="State" value={state} isEdit={editMode}>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full mt-2 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                      placeholder="State"
                    />
                  </InfoRow>

                  {/* Pincode */}
                  <InfoRow icon={MapPin} label="Pincode" value={pincode} isEdit={editMode}>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full mt-2 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                      placeholder="Pincode"
                    />
                  </InfoRow>
                </div>

                {/* Password Change Section - Only in edit mode */}
                {editMode && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Lock size={16} className="text-orange-600" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900">Change Password (Optional)</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* New Password */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                          placeholder="••••••••"
                        />
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-2">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons - Only in edit mode */}
                {editMode && (
                  <div className="flex gap-4 pt-6 mt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium flex items-center justify-center gap-2 text-sm"
                    >
                      <FaTimes size={14} />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 font-medium flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-200"
                    >
                      {updating ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaSave size={14} />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>

              {/* Account Information Footer */}
              <div className="mt-8 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={16} className="text-blue-600" />
                  <h4 className="text-sm font-semibold text-gray-700">Account Information</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    <span className="text-gray-600">Member since:</span>
                    <span className="font-medium text-gray-900">
                      {agent?.createdAt ? new Date(agent.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    <span className="text-gray-600">Last updated:</span>
                    <span className="font-medium text-gray-900">
                      {agent?.updatedAt ? new Date(agent.updatedAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}