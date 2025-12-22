import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import SchoolSelectionModal from '../components/SchoolSelectionModal';

/**
 * Extract subdomain from window location
 */
const extractSubdomain = () => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0]; // e.g., dav.campusgrid.com -> dav
  }
  return null;
};

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [loginData, setLoginData] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_BASE_URL = 'http://localhost:4001';
      const tenant = extractSubdomain(); // Extract from subdomain
      
      const response = await fetch(`${API_BASE_URL}/api/school-auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Subdomain': tenant || ''
        },
        body: JSON.stringify({
          ...formData,
          tenant: tenant
        })
      });

      // Parse response JSON
      let data = null;
      let token = null;
      
      try {
        const responseText = await response.text();
        
        // Check if response is ok
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        // Parse JSON
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
        }
        
        // Validate data is an object
        if (!data || typeof data !== 'object' || data === null) {
          throw new Error('Invalid response format from server');
        }

        // Check if login was successful
        if (data.success !== true) {
          const errorMsg = data.message || 'Login failed';
          throw new Error(errorMsg);
        }

        // Extract token
        if (!data.token || typeof data.token !== 'string' || data.token.length === 0) {
          throw new Error('No valid token received from server');
        }
        
        token = data.token;
        
      } catch (error) {
        console.error('Login error:', error.message);
        throw error;
      }
      
      // Store token
      localStorage.setItem('schoolAdmin_token', token);
      
      // Store admin info
      const adminInfo = {
        id: data.user_id || null,
        name: data.admin?.name || 'Admin',
        email: data.admin?.email || '',
        role: data.admin?.role || 'admin',
        groupId: data.group_id || null,
        tenant: data.tenant || null,
        schoolId: data.school_id || null,
        schoolName: data.school_name || null,
        mustChangePassword: data.admin?.mustChangePassword || false,
        availableSchools: data.available_schools || []
      };
      
      localStorage.setItem('schoolAdmin_info', JSON.stringify(adminInfo));

      // Store available schools
      if (data.available_schools && data.available_schools.length > 0) {
        localStorage.setItem('available_schools', JSON.stringify(data.available_schools));
      }

      // If multiple schools and requires selection, show modal
      if (data.available_schools && data.available_schools.length > 1 && data.requiresSchoolSelection) {
        setLoginData(data);
        setShowSchoolModal(true);
        setLoading(false);
        return;
      }

      // If only one school or school already selected
      const selectedSchool = data.school_id 
        ? data.available_schools?.find(s => s.school_id === data.school_id) 
        : data.available_schools?.[0];

      if (selectedSchool) {
        // Store selected school
        localStorage.setItem('currentSchool', JSON.stringify({
          school_id: selectedSchool.school_id,
          school_name: selectedSchool.school_name,
          school_code: selectedSchool.school_code,
          role: selectedSchool.role
        }));
        localStorage.setItem('lastSelectedSchoolId', selectedSchool.school_id);
      }

      // Redirect to dashboard or change-password
      setTimeout(() => {
        setLoading(false);
        if (data.admin && data.admin.mustChangePassword) {
          navigate('/change-password', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }, 100);
    } catch (err) {
      console.error('Login error:', err.message);
      setError(err.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolSelect = async (selectedSchool) => {
    setLoading(true);
    try {
      const API_BASE_URL = 'http://localhost:4001';
      const token = localStorage.getItem('schoolAdmin_token');

      // Call switch-school endpoint
      const response = await fetch(`${API_BASE_URL}/api/school-auth/switch-school`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          school_id: selectedSchool.school_id
        })
      });

      const data = await response.json();

      if (data && data.success && data.token && typeof data.token === 'string') {
        // Update stored token and info
        localStorage.setItem('schoolAdmin_token', data.token);
        
        // Update user info with selected school
        const userInfo = JSON.parse(localStorage.getItem('schoolAdmin_info') || '{}');
        userInfo.schoolId = data.school_id;
        userInfo.schoolName = data.school.school_name;
        userInfo.schoolCode = data.school.school_code;
        userInfo.role = data.role;
        localStorage.setItem('schoolAdmin_info', JSON.stringify(userInfo));

        // Store selected school
        localStorage.setItem('currentSchool', JSON.stringify({
          school_id: data.school_id,
          school_name: data.school.school_name,
          school_code: data.school.school_code,
          role: data.role
        }));
        localStorage.setItem('lastSelectedSchoolId', data.school_id);

        // Close modal and navigate
        setShowSchoolModal(false);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Failed to select school');
      }
    } catch (err) {
      console.error('School selection error:', err);
      setError('Failed to select school. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl shadow-lg mb-4">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">School Portal</h1>
          <p className="text-gray-600">Sign in to manage your school</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Login Failed</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="principal@school.edu"
                  required
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-gray-900"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  required
                  className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need help? Contact your school group administrator
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            © 2025 CampusGrid. All rights reserved.
          </p>
        </div>
      </div>

      {/* School Selection Modal */}
      {showSchoolModal && loginData && (
        <SchoolSelectionModal
          schools={loginData.available_schools || []}
          onSelect={handleSchoolSelect}
          onClose={() => {
            setShowSchoolModal(false);
            localStorage.removeItem('schoolAdmin_token');
            localStorage.removeItem('schoolAdmin_info');
          }}
          loading={loading}
        />
      )}
    </div>
  );
};

export default Login;

