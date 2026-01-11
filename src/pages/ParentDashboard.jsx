import { useState, useEffect } from 'react';
import { useNavigate, Link, Routes, Route, useLocation } from 'react-router-dom';
import {
  Users, Home, User, Calendar, ClipboardList, FileText,
  CreditCard, Bell, LogOut, Menu, X, ChevronRight, ChevronDown,
  Clock, Award, MessageSquare, Phone, CheckCircle2, BookOpen, GraduationCap, MapPin, ListTodo
} from 'lucide-react';
import { timetable, academicSessions } from '../services/api';
import ParentTimetablePage from './parent/ParentTimetablePage';
import MyDuties from '../components/MyDuties';
import DutiesReport from './DutiesReport';

const PARENT_MENU = [
  { id: 'home', label: 'Home', icon: Home, path: '/parent' },
  { id: 'children', label: 'My Children', icon: Users, path: '/parent/children' },
  { id: 'duties', label: "Child's Duties", icon: ListTodo, path: '/parent/duties' },
  { id: 'attendance', label: 'Attendance', icon: CheckCircle2, path: '/parent/attendance' },
  { id: 'timetable', label: 'Timetable', icon: Clock, path: '/parent/timetable' },
  { id: 'exams', label: 'Exams & Results', icon: ClipboardList, path: '/parent/exams' },
  { id: 'fees', label: 'Fee Payment', icon: CreditCard, path: '/parent/fees' },
  { id: 'notices', label: 'Notices', icon: Bell, path: '/parent/notices' },
  { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/parent/messages' },
  { id: 'contact', label: 'Contact School', icon: Phone, path: '/parent/contact' },
];

const ParentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showChildSelector, setShowChildSelector] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('schoolAdmin_token');
    const userInfo = localStorage.getItem('schoolAdmin_info');
    
    if (!token || !userInfo) {
      navigate('/login');
      return;
    }

    try {
      const parsed = JSON.parse(userInfo);
      if (parsed.userType !== 'parent') {
        navigate('/login');
        return;
      }
      setUser(parsed.user);
      setSchool(parsed.school);
      setChildren(parsed.children || []);
      if (parsed.children?.length > 0) {
        setSelectedChild(parsed.children[0]);
      }
    } catch (e) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('schoolAdmin_token');
    localStorage.removeItem('schoolAdmin_info');
    navigate('/login');
  };

  const isActivePath = (path) => {
    if (path === '/parent') {
      return location.pathname === '/parent';
    }
    return location.pathname.startsWith(path);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  const isHomePage = location.pathname === '/parent';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-slate-400 hover:text-white"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" />
            <span className="font-semibold text-white">Parent Portal</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold">
            {user.firstName?.[0]}
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-72 bg-slate-800 border-r border-slate-700
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Parent Portal</h1>
                <p className="text-xs text-slate-400">{school?.name || 'School'}</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{user.fullName}</p>
              <p className="text-sm text-slate-400 truncate capitalize">{user.relationship || 'Parent'}</p>
            </div>
          </div>

          {/* Child Selector */}
          {children.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowChildSelector(!showChildSelector)}
                className="w-full flex items-center justify-between p-3 bg-slate-700/50 rounded-lg text-left hover:bg-slate-700"
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-sm font-medium text-white">{selectedChild?.fullName}</p>
                    <p className="text-xs text-slate-400">{selectedChild?.className || 'Class N/A'}</p>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showChildSelector ? 'rotate-180' : ''}`} />
              </button>
              
              {showChildSelector && children.length > 1 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 rounded-lg shadow-lg overflow-hidden z-10">
                  {children.map(child => (
                    <button
                      key={child.id}
                      onClick={() => {
                        setSelectedChild(child);
                        setShowChildSelector(false);
                      }}
                      className={`w-full p-3 text-left hover:bg-slate-600 ${
                        selectedChild?.id === child.id ? 'bg-slate-600' : ''
                      }`}
                    >
                      <p className="text-sm font-medium text-white">{child.fullName}</p>
                      <p className="text-xs text-slate-400">{child.className || 'Class N/A'}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
          {PARENT_MENU.map(item => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 pt-16 lg:pt-0 min-h-screen">
        <Routes>
          <Route index element={<ParentHome user={user} school={school} children={children} selectedChild={selectedChild} navigate={navigate} />} />
          <Route path="duties" element={
            <DutiesReport 
              userType="parent" 
              userId={selectedChild?.id} 
              backPath="/parent" 
              accentColor="amber"
              children={children}
            />
          } />
          <Route path="timetable" element={
            <div className="p-4 lg:p-6">
              <ParentTimetablePage selectedChild={selectedChild} children={children} />
            </div>
          } />
          <Route path="children" element={<ParentComingSoon title="My Children" />} />
          <Route path="attendance" element={<ParentComingSoon title="Attendance" />} />
          <Route path="exams" element={<ParentComingSoon title="Exams & Results" />} />
          <Route path="fees" element={<ParentComingSoon title="Fee Payment" />} />
          <Route path="notices" element={<ParentComingSoon title="Notices" />} />
          <Route path="messages" element={<ParentComingSoon title="Messages" />} />
          <Route path="contact" element={<ParentComingSoon title="Contact School" />} />
          <Route path="*" element={<ParentHome user={user} school={school} children={children} selectedChild={selectedChild} navigate={navigate} />} />
        </Routes>
      </main>
    </div>
  );
};

// Coming Soon Placeholder
const ParentComingSoon = ({ title }) => (
  <div className="p-4 lg:p-6">
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 text-center border border-slate-700">
      <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <Clock className="w-8 h-8 text-amber-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-slate-400 mb-4">This feature is coming soon!</p>
      <Link 
        to="/parent" 
        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
      >
        <Home className="w-4 h-4" />
        Back to Home
      </Link>
    </div>
  </div>
);

// Parent Home Component
const ParentHome = ({ user, school, children, selectedChild, navigate }) => {
  const [todaysSchedule, setTodaysSchedule] = useState([]);
  const [loadingTimetable, setLoadingTimetable] = useState(true);
  const [academicSession, setAcademicSession] = useState(null);

  useEffect(() => {
    fetchAcademicSession();
  }, []);

  useEffect(() => {
    if (selectedChild?.classSectionId && academicSession?.id) {
      fetchTodaysTimetable();
    } else if (academicSession !== null) {
      // If academic session loaded but classSectionId missing, stop loading
      setLoadingTimetable(false);
    }
  }, [selectedChild, academicSession]);

  const fetchAcademicSession = async () => {
    try {
      const response = await academicSessions.getCurrent();
      if (response.success && response.data) {
        setAcademicSession(response.data);
      } else {
        setAcademicSession({});
        setLoadingTimetable(false);
      }
    } catch (error) {
      console.error('Error fetching academic session:', error);
      setAcademicSession({});
      setLoadingTimetable(false);
    }
  };

  const fetchTodaysTimetable = async () => {
    if (!selectedChild?.classSectionId || !academicSession?.id) {
      setLoadingTimetable(false);
      return;
    }
    
    setLoadingTimetable(true);
    try {
      const response = await timetable.getClass(selectedChild.classSectionId, {
        academic_session_id: academicSession.id
      });
      if (response.success && response.data) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[new Date().getDay()];
        
        const todayEntries = Object.values(response.data)
          .filter(entry => entry.dayOfWeek === today)
          .sort((a, b) => a.periodNumber - b.periodNumber);
        
        setTodaysSchedule(todayEntries);
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
    } finally {
      setLoadingTimetable(false);
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  const getDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const quickLinks = [
    { label: 'View Timetable', icon: Clock, path: '/parent/timetable', color: 'from-blue-500 to-cyan-500' },
    { label: 'Check Attendance', icon: CheckCircle2, path: '/parent/attendance', color: 'from-emerald-500 to-teal-500' },
    { label: 'View Results', icon: Award, path: '/parent/exams', color: 'from-purple-500 to-pink-500' },
    { label: 'Pay Fees', icon: CreditCard, path: '/parent/fees', color: 'from-amber-500 to-orange-500' },
  ];

  return (
    <div className="p-4 lg:p-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">
              Welcome, {user.firstName}! 👋
            </h1>
            <p className="text-amber-100">
              Parent/Guardian Portal
            </p>
            <p className="text-sm text-amber-200 mt-1">
              {school?.name || 'Your School'}
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
              <Users className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Children Cards */}
      {children.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-white mb-4">Your Children</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {children.map(child => (
              <div key={child.id} className={`bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border ${
                selectedChild?.id === child.id ? 'border-amber-500' : 'border-slate-700'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                    {child.firstName?.[0]}{child.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{child.fullName}</p>
                    <p className="text-sm text-slate-400">{child.className || 'Class N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-slate-700/30 rounded-lg p-2 text-center">
                    <p className="text-emerald-400 font-bold">92%</p>
                    <p className="text-slate-400 text-xs">Attendance</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-2 text-center">
                    <p className="text-blue-400 font-bold">A+</p>
                    <p className="text-slate-400 text-xs">Last Grade</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Quick Links */}
      <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {quickLinks.map((link, idx) => {
          const Icon = link.icon;
          return (
            <Link
              key={idx}
              to={link.path}
              className={`bg-gradient-to-br ${link.color} rounded-xl p-4 text-white hover:scale-105 transition-transform`}
            >
              <Icon className="w-8 h-8 mb-2" />
              <p className="font-semibold">{link.label}</p>
            </Link>
          );
        })}
      </div>

      {/* Today's Schedule & Notices */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Today's Schedule for Selected Child */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              {selectedChild?.fullName}'s Schedule
            </h3>
            <Link to="/parent/timetable" className="text-sm text-amber-400 hover:text-amber-300">
              View Full →
            </Link>
          </div>
          <p className="text-sm text-slate-400 mb-3">{getDayName()} - {selectedChild?.className || 'Class N/A'}</p>
          
          {loadingTimetable ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
            </div>
          ) : getDayName() === 'Sunday' ? (
            <div className="text-center py-6">
              <div className="text-3xl mb-3">🌟</div>
              <p className="text-white font-medium">Sunday - Holiday!</p>
              <p className="text-slate-400 text-sm">No classes today</p>
            </div>
          ) : todaysSchedule.length > 0 ? (
            <div className="space-y-2">
              {todaysSchedule.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 bg-slate-700/30 rounded-lg">
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded text-xs font-medium">
                    P{item.periodNumber}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">{item.subjectName || 'No Subject'}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {item.teacherName && `${item.teacherName}`}
                      {item.room && ` • Room ${item.room}`}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500">{formatTime(item.startTime)}</p>
                </div>
              ))}
              {todaysSchedule.length > 5 && (
                <p className="text-center text-xs text-slate-400 pt-1">
                  +{todaysSchedule.length - 5} more classes
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-white font-medium text-sm">No Classes Today</p>
              <p className="text-slate-400 text-xs">Timetable not configured</p>
            </div>
          )}
        </div>

        {/* Recent Notices */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            School Notices
          </h3>
          <div className="space-y-3">
            {[
              { title: 'Parent-Teacher Meeting - Jan 10', date: '2 hours ago', type: 'meeting' },
              { title: 'Fee Payment Reminder', date: '1 day ago', type: 'fee' },
              { title: 'Winter Vacation Notice', date: '3 days ago', type: 'holiday' },
            ].map((notice, idx) => (
              <div key={idx} className="p-3 bg-slate-700/30 rounded-lg">
                <p className="font-medium text-white">{notice.title}</p>
                <p className="text-sm text-slate-400 mt-1">{notice.date}</p>
              </div>
            ))}
          </div>
          <Link
            to="/parent/notices"
            className="block text-center mt-4 text-amber-400 hover:text-amber-300 text-sm font-medium"
          >
            View All Notices →
          </Link>
        </div>
      </div>

      {/* Fee Summary */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-amber-400" />
          Fee Summary
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-700/30 rounded-lg text-center">
            <p className="text-2xl font-bold text-white">₹45,000</p>
            <p className="text-slate-400 text-sm">Total Annual Fee</p>
          </div>
          <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30 text-center">
            <p className="text-2xl font-bold text-emerald-400">₹30,000</p>
            <p className="text-emerald-400/70 text-sm">Paid</p>
          </div>
          <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/30 text-center">
            <p className="text-2xl font-bold text-amber-400">₹15,000</p>
            <p className="text-amber-400/70 text-sm">Pending</p>
          </div>
        </div>
        <Link
          to="/parent/fees"
          className="block text-center mt-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors"
        >
          Pay Now
        </Link>
      </div>

      {/* Child's Today Duties */}
      {children.length > 0 && (
        <div className="mt-6">
          <MyDuties
            assigneeId={selectedChild?.id}
            assigneeType="student"
            todayOnly={true}
            title="Today's Duties"
            accentColor="amber"
            childrenList={children}
            onViewAll={() => navigate('/parent/duties')}
          />
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;

