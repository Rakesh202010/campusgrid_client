import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from 'lucide-react';
import api from '../services/api';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const data = await api.auth.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      if (data?.success) {
        setSuccess(true);
        setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        
        // Update mustChangePassword flag in localStorage
        const userInfo = JSON.parse(localStorage.getItem('schoolAdmin_info') || '{}');
        userInfo.mustChangePassword = false;
        localStorage.setItem('schoolAdmin_info', JSON.stringify(userInfo));
        
        // Redirect to dashboard after 1 second
        setTimeout(() => {
          navigate('/dashboard', { replace: true });
        }, 1000);
      } else {
        setError(data?.message || 'Failed to change password');
      }
    } catch (err) {
      setError('Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Lock className="w-8 h-8" />
          Change Password
        </h1>
        <p className="text-blue-100">Update your password to keep your account secure</p>
      </div>

      <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-600 text-sm font-medium">Password changed successfully! Redirecting to dashboard...</p>
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={formData.currentPassword}
                onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                required
                className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                {showPasswords.current ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                required
                className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                {showPasswords.new ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="absolute right-4 top-1/2 -translate-y-1/2"
              >
                {showPasswords.confirm ? <EyeOff className="w-5 h-5 text-gray-400" /> : <Eye className="w-5 h-5 text-gray-400" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Password'
            )}
          </button>

          {/* Skip for now option (optional) */}
          {!success && (
            <button
              type="button"
              onClick={() => {
                // Update mustChangePassword flag temporarily
                const userInfo = JSON.parse(localStorage.getItem('schoolAdmin_info') || '{}');
                userInfo.mustChangePassword = false;
                localStorage.setItem('schoolAdmin_info', JSON.stringify(userInfo));
                navigate('/dashboard', { replace: true });
              }}
              className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              Skip for Now
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;

