import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Lock, Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(Math.min(strength, 5));
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, newPassword: value });
    checkPasswordStrength(value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (!formData.email || !formData.newPassword || !formData.confirmPassword) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Call reset password API directly
      const response = await fetch('http://localhost:4001/api/school-auth/reset-password-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          newPassword: formData.newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to reset password');
      }

      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-orange-500';
    if (passwordStrength <= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Fair';
    if (passwordStrength <= 4) return 'Good';
    return 'Strong';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="p-3 bg-gradient-to-br from-indigo-600 to-cyan-600 rounded-2xl">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">CampusGrid</h1>
            <p className="text-sm text-gray-600">School Portal</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>

          {!success ? (
            <>
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
                <p className="text-gray-600">
                  Enter your email and create a new password
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        setError('');
                      }}
                      className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                      placeholder="admin@yourschool.com"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* New Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                      placeholder="Enter new password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {formData.newPassword && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-2 flex-1 rounded-full ${
                              level <= passwordStrength
                                ? getPasswordStrengthColor()
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className={`text-xs font-medium ${
                        passwordStrength <= 2 ? 'text-red-600' :
                        passwordStrength <= 3 ? 'text-orange-600' :
                        passwordStrength <= 4 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {getPasswordStrengthText()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Use at least 8 characters with a mix of letters, numbers, and symbols
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData({ ...formData, confirmPassword: e.target.value });
                        setError('');
                      }}
                      className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                      placeholder="Confirm new password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                    <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || formData.newPassword !== formData.confirmPassword || formData.newPassword.length < 8}
                  className="w-full bg-gradient-to-r from-indigo-600 to-cyan-600 text-white py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-cyan-700 focus:ring-4 focus:ring-indigo-200 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Reset Password
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Successful!</h2>
              <p className="text-gray-600 mb-6">
                Your password has been reset successfully. Redirecting to login page...
              </p>
              <Link
                to="/login"
                className="inline-block bg-gradient-to-r from-indigo-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-cyan-700 transition-all"
              >
                Go to Login
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Remember your password?{' '}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

