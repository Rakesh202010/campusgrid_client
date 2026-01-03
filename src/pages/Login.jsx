import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  GraduationCap, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle,
  User, BookOpen, Users, Briefcase, ChevronRight, School, Sparkles, IdCard
} from 'lucide-react';
import SchoolSelectionModal from '../components/SchoolSelectionModal';

// User type definitions
const USER_TYPES = [
  { 
    id: 'admin', 
    label: 'Admin', 
    icon: User, 
    color: 'from-violet-500 to-purple-600',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30',
    textColor: 'text-violet-400',
    description: 'School Administrator',
    loginField: 'email',
    placeholder: 'admin@school.edu'
  },
  { 
    id: 'teacher', 
    label: 'Teacher', 
    icon: BookOpen, 
    color: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    textColor: 'text-emerald-400',
    description: 'Teaching Staff',
    loginField: 'email',
    placeholder: 'teacher@school.edu'
  },
  { 
    id: 'student', 
    label: 'Student', 
    icon: GraduationCap, 
    color: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400',
    description: 'Student Portal',
    loginField: 'admissionNumber',
    placeholder: 'ADM00001'
  },
  { 
    id: 'parent', 
    label: 'Parent', 
    icon: Users, 
    color: 'from-amber-500 to-orange-600',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    textColor: 'text-amber-400',
    description: 'Parent/Guardian',
    loginField: 'phone',
    placeholder: '+91 98765 43210'
  },
  { 
    id: 'staff', 
    label: 'Staff', 
    icon: Briefcase, 
    color: 'from-rose-500 to-pink-600',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    textColor: 'text-rose-400',
    description: 'Non-Teaching Staff',
    loginField: 'email',
    placeholder: 'staff@school.edu'
  },
];

/**
 * Extract subdomain from window location
 */
const extractSubdomain = () => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    return parts[0];
  }
  return null;
};

const Login = () => {
  const navigate = useNavigate();
  const [selectedUserType, setSelectedUserType] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [loginData, setLoginData] = useState(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    admissionNumber: '',
    phone: '',
    employeeId: ''
  });

  const selectedType = USER_TYPES.find(t => t.id === selectedUserType);

  const getLoginEndpoint = () => {
    switch (selectedUserType) {
      case 'admin': return '/api/school-auth/login';
      case 'teacher': return '/api/user-auth/teacher/login';
      case 'student': return '/api/user-auth/student/login';
      case 'parent': return '/api/user-auth/parent/login';
      case 'staff': return '/api/user-auth/staff/login';
      default: return '/api/school-auth/login';
    }
  };

  const getDashboardPath = (userType) => {
    switch (userType) {
      case 'admin': return '/dashboard';
      case 'teacher': return '/teacher';
      case 'student': return '/student';
      case 'parent': return '/parent';
      case 'staff': return '/dashboard'; // Staff uses admin dashboard with RBAC
      default: return '/dashboard';
    }
  };

  const getLoginPayload = () => {
    const tenant = extractSubdomain();
    const base = { password: formData.password, tenant };

    switch (selectedUserType) {
      case 'admin':
        return { ...base, email: formData.email };
      case 'teacher':
        return { ...base, email: formData.email, employeeId: formData.employeeId };
      case 'student':
        return { ...base, email: formData.email, admissionNumber: formData.admissionNumber };
      case 'parent':
        return { ...base, email: formData.email, phone: formData.phone };
      case 'staff':
        return { ...base, email: formData.email, employeeId: formData.employeeId };
      default:
        return { ...base, email: formData.email };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const API_BASE_URL = 'http://localhost:4001';
      const tenant = extractSubdomain();
      const endpoint = getLoginEndpoint();
      const payload = getLoginPayload();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Subdomain': tenant || ''
        },
        body: JSON.stringify(payload)
      });

      let data = null;
      
      try {
        const responseText = await response.text();
        
        if (!response.ok) {
          try {
            data = JSON.parse(responseText);
            throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
          } catch (e) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
        }
        
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}`);
        }
        
        if (!data || typeof data !== 'object' || data === null) {
          throw new Error('Invalid response format from server');
        }

        if (data.success !== true) {
          const errorMsg = data.message || 'Login failed';
          throw new Error(errorMsg);
        }

        if (!data.token || typeof data.token !== 'string' || data.token.length === 0) {
          throw new Error('No valid token received from server');
        }
        
      } catch (error) {
        console.error('Login error:', error.message);
        throw error;
      }
      
      // Store token
      localStorage.setItem('schoolAdmin_token', data.token);
      
      // Determine user type from response or selection
      const userType = data.userType || selectedUserType;
      
      // Store user info based on user type
      if (userType === 'admin') {
        // Admin login flow (existing)
        const adminInfo = {
          id: data.user_id || null,
          name: data.admin?.name || 'Admin',
          email: data.admin?.email || '',
          role: data.admin?.role || 'admin',
          userType: 'admin',
          groupId: data.group_id || null,
          tenant: data.tenant || null,
          schoolId: data.school_id || null,
          schoolName: data.school_name || null,
          mustChangePassword: data.admin?.mustChangePassword || false,
          availableSchools: data.available_schools || []
        };
        
        localStorage.setItem('schoolAdmin_info', JSON.stringify(adminInfo));

        if (data.available_schools && data.available_schools.length > 0) {
          localStorage.setItem('available_schools', JSON.stringify(data.available_schools));
        }

        if (data.available_schools && data.available_schools.length > 1 && data.requiresSchoolSelection) {
          setLoginData(data);
          setShowSchoolModal(true);
          setLoading(false);
          return;
        }

        const selectedSchool = data.school_id 
          ? data.available_schools?.find(s => s.school_id === data.school_id) 
          : data.available_schools?.[0];

        if (selectedSchool) {
          localStorage.setItem('currentSchool', JSON.stringify({
            school_id: selectedSchool.school_id,
            school_name: selectedSchool.school_name,
            school_code: selectedSchool.school_code,
            role: selectedSchool.role
          }));
          localStorage.setItem('lastSelectedSchoolId', selectedSchool.school_id);
        }

        setTimeout(() => {
          setLoading(false);
          if (data.admin && data.admin.mustChangePassword) {
            navigate('/change-password', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        }, 100);
      } else {
        // Other user types (student, parent, teacher, staff)
        const userInfo = {
          userType,
          user: data.user,
          school: data.school,
          groupId: data.groupId,
          tenant: data.tenant,
          ...(userType === 'parent' && { children: data.children })
        };
        
        localStorage.setItem('schoolAdmin_info', JSON.stringify(userInfo));

        if (data.school) {
          localStorage.setItem('currentSchool', JSON.stringify({
            school_id: data.school.id,
            school_name: data.school.name,
            school_code: data.school.code
          }));
        }

        setTimeout(() => {
          setLoading(false);
          navigate(getDashboardPath(userType), { replace: true });
        }, 100);
      }
    } catch (err) {
      console.error('Login error:', err.message);
      setError(err.message || 'Failed to login. Please try again.');
      setLoading(false);
    }
  };

  const handleSchoolSelect = async (selectedSchool) => {
    setLoading(true);
    try {
      const API_BASE_URL = 'http://localhost:4001';
      const token = localStorage.getItem('schoolAdmin_token');

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
        localStorage.setItem('schoolAdmin_token', data.token);
        
        const userInfo = JSON.parse(localStorage.getItem('schoolAdmin_info') || '{}');
        userInfo.schoolId = data.school_id;
        userInfo.schoolName = data.school.school_name;
        userInfo.schoolCode = data.school.school_code;
        userInfo.role = data.role;
        localStorage.setItem('schoolAdmin_info', JSON.stringify(userInfo));

        localStorage.setItem('currentSchool', JSON.stringify({
          school_id: data.school_id,
          school_name: data.school.school_name,
          school_code: data.school.school_code,
          role: data.role
        }));
        localStorage.setItem('lastSelectedSchoolId', data.school_id);

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

  const getInputIcon = () => {
    switch (selectedType?.loginField) {
      case 'admissionNumber': return IdCard;
      case 'phone': return Users;
      default: return Mail;
    }
  };

  const getInputLabel = () => {
    switch (selectedType?.loginField) {
      case 'admissionNumber': return 'Admission Number or Email';
      case 'phone': return 'Phone Number or Email';
      default: return 'Email Address';
    }
  };

  const getInputValue = () => {
    switch (selectedType?.loginField) {
      case 'admissionNumber': return formData.admissionNumber || formData.email;
      case 'phone': return formData.phone || formData.email;
      default: return formData.email;
    }
  };

  const handleInputChange = (value) => {
    switch (selectedType?.loginField) {
      case 'admissionNumber':
        // Check if it's an email or admission number
        if (value.includes('@')) {
          setFormData({ ...formData, email: value, admissionNumber: '' });
        } else {
          setFormData({ ...formData, admissionNumber: value, email: '' });
        }
        break;
      case 'phone':
        // Check if it's an email or phone
        if (value.includes('@')) {
          setFormData({ ...formData, email: value, phone: '' });
        } else {
          setFormData({ ...formData, phone: value, email: '' });
        }
        break;
      default:
        setFormData({ ...formData, email: value });
    }
  };

  const InputIcon = getInputIcon();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Gradient Orbs */}
        <div className="absolute top-0 -left-40 w-80 h-80 bg-purple-500/30 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-cyan-500/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Branding (Hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
          <div className="max-w-lg">
            {/* Logo */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <School className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">CampusGrid</h1>
                <p className="text-slate-400">School Management System</p>
              </div>
            </div>

            {/* Tagline */}
            <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
              Empowering Education,<br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                One School at a Time
              </span>
            </h2>

            <p className="text-slate-400 text-lg mb-8">
              A comprehensive platform for managing students, teachers, staff, 
              attendance, fees, and everything your school needs.
            </p>

            {/* Features */}
            <div className="space-y-4">
              {[
                'Complete Student Information System',
                'Attendance & Timetable Management',
                'Fee Collection & Financial Reports',
                'Parent Communication Portal'
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-slate-300">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <School className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">CampusGrid</span>
              </div>
            </div>

            {/* Login Card */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
                <p className="text-slate-400">Sign in to your school portal</p>
              </div>

              {/* User Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-400 mb-3">
                  I am a
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {USER_TYPES.map(type => {
                    const Icon = type.icon;
                    const isSelected = selectedUserType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => {
                          setSelectedUserType(type.id);
                          setError('');
                        }}
                        className={`relative flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-300 group ${
                          isSelected
                            ? `${type.bgColor} ${type.borderColor} scale-105`
                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1 transition-all ${
                          isSelected 
                            ? `bg-gradient-to-br ${type.color}` 
                            : 'bg-white/10 group-hover:bg-white/20'
                        }`}>
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                        </div>
                        <span className={`text-xs font-medium ${isSelected ? type.textColor : 'text-slate-400'}`}>
                          {type.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedType && (
                  <p className="text-xs text-slate-500 mt-2 text-center">
                    {selectedType.description}
                  </p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-400">Login Failed</p>
                      <p className="text-sm text-red-400/80 mt-0.5">{error}</p>
                    </div>
                  </div>
                )}

                {/* Email/ID Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    {getInputLabel()}
                  </label>
                  <div className="relative">
                    <InputIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      value={getInputValue()}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder={selectedType?.placeholder || 'you@school.edu'}
                      required
                      className="w-full pl-12 pr-4 py-3.5 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter your password"
                      required
                      className="w-full pl-12 pr-12 py-3.5 bg-white/5 border-2 border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-blue-500/50 focus:bg-white/10 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-0" 
                    />
                    <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                      Remember me
                    </span>
                  </label>
                  <Link 
                    to="/forgot-password" 
                    className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group ${
                    selectedType 
                      ? `bg-gradient-to-r ${selectedType.color} hover:shadow-lg hover:scale-[1.02]`
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-lg hover:shadow-blue-500/25'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-transparent text-slate-500">Need help?</span>
                </div>
              </div>

              {/* Help Text */}
              <p className="text-center text-sm text-slate-400">
                Contact your school administrator for access or{' '}
                <a href="mailto:support@campusgrid.com" className="text-blue-400 hover:text-blue-300 transition-colors">
                  email support
                </a>
              </p>
            </div>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-sm text-slate-500">
                © 2025 CampusGrid. All rights reserved.
              </p>
            </div>
          </div>
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
