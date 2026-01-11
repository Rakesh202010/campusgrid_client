import { useState, useEffect } from 'react';
import { useNavigate, Link, Routes, Route, useLocation } from 'react-router-dom';
import {
  GraduationCap, Home, BookOpen, Calendar, ClipboardList, FileText,
  CreditCard, Bell, User, Settings, LogOut, Menu, X, ChevronRight,
  Clock, Award, MessageSquare, Download, CheckCircle2, TrendingUp, MapPin, ListTodo
} from 'lucide-react';
import { timetable, academicSessions } from '../services/api';
import StudentTimetablePage from './student/StudentTimetablePage';
import MyDuties from '../components/MyDuties';
import DutiesReport from './DutiesReport';

const STUDENT_MENU = [
  { id: 'home', label: 'Home', icon: Home, path: '/student' },
  { id: 'profile', label: 'My Profile', icon: User, path: '/student/profile' },
  { id: 'duties', label: 'My Duties', icon: ListTodo, path: '/student/duties' },
  { id: 'attendance', label: 'Attendance', icon: CheckCircle2, path: '/student/attendance' },
  { id: 'timetable', label: 'Timetable', icon: Clock, path: '/student/timetable' },
  { id: 'subjects', label: 'My Subjects', icon: BookOpen, path: '/student/subjects' },
  { id: 'exams', label: 'Exams & Results', icon: ClipboardList, path: '/student/exams' },
  { id: 'assignments', label: 'Assignments', icon: FileText, path: '/student/assignments' },
  { id: 'fees', label: 'Fee Details', icon: CreditCard, path: '/student/fees' },
  { id: 'notices', label: 'Notices', icon: Bell, path: '/student/notices' },
  { id: 'downloads', label: 'Downloads', icon: Download, path: '/student/downloads' },
];

const StudentDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('schoolAdmin_token');
    const userInfo = localStorage.getItem('schoolAdmin_info');
    
    if (!token || !userInfo) {
      navigate('/login');
      return;
    }

    try {
      const parsed = JSON.parse(userInfo);
      if (parsed.userType !== 'student') {
        navigate('/login');
        return;
      }
      setUser(parsed.user);
      setSchool(parsed.school);
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
    if (path === '/student') {
      return location.pathname === '/student';
    }
    return location.pathname.startsWith(path);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If this is the base /student route, show the dashboard home
  const isHomePage = location.pathname === '/student';

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
            <GraduationCap className="w-6 h-6 text-blue-500" />
            <span className="font-semibold text-white">Student Portal</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Student Portal</h1>
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
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{user.fullName}</p>
              <p className="text-sm text-slate-400 truncate">{user.className || 'Class N/A'}</p>
              <p className="text-xs text-slate-500">Roll: {user.rollNumber || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {STUDENT_MENU.map(item => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
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
          <Route index element={<StudentHome user={user} school={school} navigate={navigate} />} />
          <Route path="duties" element={<DutiesReport userType="student" userId={user?.id} backPath="/student" accentColor="blue" />} />
          <Route path="timetable" element={<div className="p-4 lg:p-6"><StudentTimetablePage /></div>} />
          <Route path="profile" element={<StudentComingSoon title="My Profile" />} />
          <Route path="attendance" element={<StudentComingSoon title="Attendance" />} />
          <Route path="subjects" element={<StudentComingSoon title="My Subjects" />} />
          <Route path="exams" element={<StudentComingSoon title="Exams & Results" />} />
          <Route path="assignments" element={<StudentComingSoon title="Assignments" />} />
          <Route path="fees" element={<StudentComingSoon title="Fee Details" />} />
          <Route path="notices" element={<StudentComingSoon title="Notices" />} />
          <Route path="downloads" element={<StudentComingSoon title="Downloads" />} />
          <Route path="*" element={<StudentHome user={user} school={school} navigate={navigate} />} />
        </Routes>
      </main>
    </div>
  );
};

// Coming Soon Placeholder
const StudentComingSoon = ({ title }) => (
  <div className="p-4 lg:p-6">
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 text-center border border-slate-700">
      <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <Clock className="w-8 h-8 text-blue-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-slate-400 mb-4">This feature is coming soon!</p>
      <Link 
        to="/student" 
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        <Home className="w-4 h-4" />
        Back to Home
      </Link>
    </div>
  </div>
);

// Student Home Component
const StudentHome = ({ user, school, navigate }) => {
  const [todaysSchedule, setTodaysSchedule] = useState([]);
  const [loadingTimetable, setLoadingTimetable] = useState(true);
  const [academicSession, setAcademicSession] = useState(null);

  useEffect(() => {
    fetchAcademicSession();
  }, []);

  useEffect(() => {
    if (user?.classSectionId && academicSession?.id) {
      fetchTodaysTimetable();
    } else if (academicSession !== null) {
      // If academic session loaded but classSectionId missing, stop loading
      setLoadingTimetable(false);
    }
  }, [user, academicSession]);

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
    if (!user?.classSectionId || !academicSession?.id) {
      setLoadingTimetable(false);
      return;
    }
    
    setLoadingTimetable(true);
    try {
      const response = await timetable.getClass(user.classSectionId, {
        academic_session_id: academicSession.id
      });
      if (response.success && response.data) {
        // Get today's day name
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[new Date().getDay()];
        
        // Filter for today's schedule
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

  const quickLinks = [
    { label: 'View Timetable', icon: Clock, path: '/student/timetable', color: 'from-blue-500 to-cyan-500' },
    { label: 'Check Attendance', icon: CheckCircle2, path: '/student/attendance', color: 'from-emerald-500 to-teal-500' },
    { label: 'Exam Results', icon: Award, path: '/student/exams', color: 'from-purple-500 to-pink-500' },
    { label: 'Fee Status', icon: CreditCard, path: '/student/fees', color: 'from-amber-500 to-orange-500' },
  ];

  // Calculate dynamic stats
  const uniqueSubjects = [...new Set(todaysSchedule.map(e => e.subjectName).filter(Boolean))];
  const stats = [
    { label: 'Attendance', value: '92%', icon: CheckCircle2, color: 'text-emerald-400' },
    { label: 'Today\'s Classes', value: todaysSchedule.length.toString(), icon: BookOpen, color: 'text-blue-400' },
    { label: 'Subjects Today', value: uniqueSubjects.length.toString(), icon: FileText, color: 'text-amber-400' },
    { label: 'Next Exam', value: '5 Days', icon: Calendar, color: 'text-purple-400' },
  ];

  const getDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  return (
    <div className="p-4 lg:p-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">
              Welcome back, {user.firstName}! 👋
            </h1>
            <p className="text-blue-100">
              {user.className || 'Your Class'} | Roll No: {user.rollNumber || 'N/A'}
            </p>
            <p className="text-sm text-blue-200 mt-1">
              {school?.name || 'Your School'}
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-slate-700/50 ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Links */}
      <h2 className="text-lg font-semibold text-white mb-4">Quick Access</h2>
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

      {/* Today's Schedule */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Today's Schedule ({getDayName()})
            </h3>
            <Link to="/student/timetable" className="text-sm text-blue-400 hover:text-blue-300">
              View Full →
            </Link>
          </div>
          
          {loadingTimetable ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : getDayName() === 'Sunday' ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🌟</div>
              <p className="text-white font-medium">Sunday - Holiday!</p>
              <p className="text-slate-400 text-sm">Enjoy your day off</p>
            </div>
          ) : todaysSchedule.length > 0 ? (
            <div className="space-y-3">
              {todaysSchedule.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex-shrink-0">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
                      P{item.periodNumber}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{item.subjectName || 'No Subject'}</p>
                    <div className="flex items-center gap-3 text-sm text-slate-400">
                      {item.teacherName && (
                        <span className="flex items-center gap-1 truncate">
                          <User className="w-3 h-3" />
                          {item.teacherName}
                        </span>
                      )}
                      {item.room && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {item.room}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 text-right">
                    {formatTime(item.startTime)}<br />
                    {formatTime(item.endTime)}
                  </div>
                </div>
              ))}
              {todaysSchedule.length > 5 && (
                <p className="text-center text-sm text-slate-400">
                  +{todaysSchedule.length - 5} more classes
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-white font-medium">No Classes Today</p>
              <p className="text-slate-400 text-sm">Timetable not configured for today</p>
            </div>
          )}
        </div>

        {/* Recent Notices */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            Recent Notices
          </h3>
          <div className="space-y-3">
            {[
              { title: 'Mid-Term Exam Schedule Released', date: '2 hours ago', type: 'exam' },
              { title: 'School Annual Day - Dec 15', date: '1 day ago', type: 'event' },
              { title: 'Winter Vacation Notice', date: '3 days ago', type: 'holiday' },
            ].map((notice, idx) => (
              <div key={idx} className="p-3 bg-slate-700/30 rounded-lg">
                <p className="font-medium text-white">{notice.title}</p>
                <p className="text-sm text-slate-400 mt-1">{notice.date}</p>
              </div>
            ))}
          </div>
          <Link
            to="/student/notices"
            className="block text-center mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            View All Notices →
          </Link>
        </div>
      </div>

      {/* Today's Duties */}
      <div className="mt-6">
        <MyDuties
          assigneeId={user?.id}
          assigneeType="student"
          todayOnly={true}
          title="Today's Duties"
          accentColor="blue"
          onViewAll={() => navigate('/student/duties')}
        />
      </div>
    </div>
  );
};

export default StudentDashboard;

