import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  BookOpen, 
  Settings, 
  Menu, 
  X,
  Building2,
  Calendar,
  ClipboardCheck,
  IndianRupee,
  BarChart3,
  LogOut,
  ChevronDown,
  User,
  Bell
} from 'lucide-react';
import SchoolSwitcherDropdown from './SchoolSwitcherDropdown';
import AcademicSessionSwitcher from './AcademicSessionSwitcher';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const [userInfo, setUserInfo] = useState(() => {
    const stored = localStorage.getItem('schoolAdmin_info');
    return stored ? JSON.parse(stored) : { 
      name: 'Admin', 
      email: 'admin@school.edu', 
      schoolName: 'Your School' 
    };
  });

  const [availableSchools, setAvailableSchools] = useState(() => {
    const stored = localStorage.getItem('available_schools');
    return stored ? JSON.parse(stored) : [];
  });

  const [currentSchoolId, setCurrentSchoolId] = useState(() => {
    const stored = localStorage.getItem('lastSelectedSchoolId');
    const userInfo = JSON.parse(localStorage.getItem('schoolAdmin_info') || '{}');
    return stored || userInfo.schoolId || null;
  });

  // Update state when localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('schoolAdmin_info');
      if (stored) {
        setUserInfo(JSON.parse(stored));
      }
      const schools = localStorage.getItem('available_schools');
      if (schools) {
        setAvailableSchools(JSON.parse(schools));
      }
      const schoolId = localStorage.getItem('lastSelectedSchoolId');
      if (schoolId) {
        setCurrentSchoolId(schoolId);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSwitchSchool = async (school) => {
    const API_BASE_URL = 'http://localhost:4001';
    const token = localStorage.getItem('schoolAdmin_token');

    const response = await fetch(`${API_BASE_URL}/api/school-auth/switch-school`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        school_id: school.school_id
      })
    });

    const data = await response.json();

    if (data.success) {
      // Update stored token and info
      localStorage.setItem('schoolAdmin_token', data.token);
      
      // Update user info
      const updatedUserInfo = {
        ...userInfo,
        schoolId: data.school_id,
        schoolName: data.school.school_name,
        schoolCode: data.school.school_code,
        role: data.role
      };
      localStorage.setItem('schoolAdmin_info', JSON.stringify(updatedUserInfo));
      setUserInfo(updatedUserInfo);

      // Store selected school
      localStorage.setItem('currentSchool', JSON.stringify({
        school_id: data.school_id,
        school_name: data.school.school_name,
        school_code: data.school.school_code,
        role: data.role
      }));
      localStorage.setItem('lastSelectedSchoolId', data.school_id);
      setCurrentSchoolId(data.school_id);

      // Reload page to update all data context
      window.location.reload();
    } else {
      throw new Error(data.message || 'Failed to switch school');
    }
  };

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/students', icon: Users, label: 'Students' },
    { path: '/teachers', icon: UserCheck, label: 'Teachers' },
    { path: '/attendance', icon: Calendar, label: 'Attendance' },
    { path: '/exams', icon: ClipboardCheck, label: 'Exams & Grades' },
    { path: '/fees', icon: IndianRupee, label: 'Fee Management' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('schoolAdmin_token');
    localStorage.removeItem('schoolAdmin_info');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white shadow-lg transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          {sidebarOpen ? (
            <div className="flex items-center gap-2">
              <Building2 className="text-blue-600 w-8 h-8" />
              <div>
                <span className="text-xl font-bold text-gray-800 block">School Portal</span>
                <span className="text-xs text-gray-500 block truncate">{userInfo.schoolName}</span>
              </div>
            </div>
          ) : (
            <Building2 className="text-blue-600 w-8 h-8 mx-auto" />
          )}
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200">
            <Link
              to="/school-details"
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Building2 className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">School Details</span>
            </Link>
          </div>
        )}

        {/* Toggle Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white shadow-sm border-b border-gray-200 flex items-center px-6">
          <div className="flex items-center justify-between w-full">
            <h1 className="text-2xl font-semibold text-gray-800">
              {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </h1>
            <div className="flex items-center gap-3">
              {/* Academic Session Switcher */}
              <AcademicSessionSwitcher />

              {/* School Switcher */}
              {availableSchools.length > 0 && (
                <SchoolSwitcherDropdown
                  schools={availableSchools}
                  currentSchoolId={currentSchoolId}
                  onSwitch={handleSwitchSchool}
                />
              )}

              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {userInfo.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-left hidden md:block">
                    <p className="text-sm font-semibold text-gray-800">{userInfo.name}</p>
                    <p className="text-xs text-gray-500">{userInfo.email}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      to="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium">Profile Settings</span>
                    </Link>
                    <Link
                      to="/change-password"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span className="text-sm font-medium">Change Password</span>
                    </Link>
                    <hr className="my-2 border-gray-200" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
