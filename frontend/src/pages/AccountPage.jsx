import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { userAPI } from '../api';
import toast from 'react-hot-toast';
import BottomNav from '../components/BottomNav';
import { User, Mail, Phone, Shield, Bell, LogOut, Camera } from 'lucide-react';

export default function AccountPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
  });

  const updateProfile = useMutation({
    mutationFn: async (data) => {
      const { data: response } = await userAPI.updateProfile(data);
      return response;
    },
    onSuccess: (res) => {
      toast.success('Profile updated successfully');
      setIsEditing(false);
      localStorage.setItem('user', JSON.stringify(res.data));
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    },
  });

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-4">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-3 md:px-4 py-3 sticky top-0 z-10 safe-area-top">
        <h1 className="text-lg md:text-xl font-bold text-gray-900">Account</h1>
      </div>

      <div className="p-3 md:p-4 space-y-4">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <User size={32} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-bold">{user?.fullName || 'Demo Trader'}</h2>
                <p className="text-sm opacity-90 capitalize">{user?.role || 'user'}</p>
              </div>
            </div>
          </div>

          {/* Profile Stats */}
          <div className="grid grid-cols-3 border-b border-gray-200">
            <div className="p-4 text-center border-r border-gray-200">
              <div className="text-xs text-gray-500 mb-1">KYC Status</div>
              <div className={`text-sm font-semibold ${
                user?.kycStatus === 'approved' ? 'text-green-600' : 
                user?.kycStatus === 'pending' ? 'text-orange-600' : 'text-gray-600'
              }`}>
                {user?.kycStatus?.toUpperCase() || 'PENDING'}
              </div>
            </div>
            <div className="p-4 text-center border-r border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Trading</div>
              <div className={`text-sm font-semibold ${user?.tradingEnabled ? 'text-green-600' : 'text-red-600'}`}>
                {user?.tradingEnabled ? 'ENABLED' : 'DISABLED'}
              </div>
            </div>
            <div className="p-4 text-center">
              <div className="text-xs text-gray-500 mb-1">Segment</div>
              <div className="text-sm font-semibold text-gray-900">
                {user?.segment?.join(', ') || 'EQ'}
              </div>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base md:text-lg text-gray-900">
              Account Details
            </h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  disabled={!isEditing}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={updateProfile.isPending}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-all active:scale-95 disabled:bg-blue-300"
                >
                  {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold transition-all active:scale-95"
                >
                  Cancel
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Settings Menu */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <h3 className="font-semibold text-base md:text-lg text-gray-900 p-4 md:p-5 border-b border-gray-200">
            Settings
          </h3>
          
          <div className="divide-y divide-gray-200">
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Shield size={20} className="text-gray-400" />
                <span className="text-sm font-medium">Security & Password</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
            
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Bell size={20} className="text-gray-400" />
                <span className="text-sm font-medium">Notifications</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
            
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <Camera size={20} className="text-gray-400" />
                <span className="text-sm font-medium">Upload Documents</span>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-4 rounded-xl font-semibold transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <LogOut size={20} />
          Logout
        </button>

        {/* App Version */}
        <div className="text-center text-xs text-gray-400 py-4">
          TradeX India v1.0.0
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
