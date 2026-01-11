import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  BookOpen, Home, User, Calendar, ClipboardList, Users,
  Bell, LogOut, Menu, X, ChevronRight, Clock, Award,
  CheckCircle2, FileText, BarChart3, GraduationCap, RefreshCw, ListTodo
} from 'lucide-react';
import MyDuties from '../components/MyDuties';
import DutiesReport from './DutiesReport';

const TEACHER_MENU = [
  { id: 'home', label: 'Home', icon: Home, path: '/teacher' },
  { id: 'profile', label: 'My Profile', icon: User, path: '/teacher/profile' },
  { id: 'duties', label: 'Duties & Responsibilities', icon: ListTodo, path: '/teacher/duties' },
  { id: 'timetable', label: 'My Timetable', icon: Clock, path: '/teacher/timetable' },
  { id: 'classes', label: 'My Classes', icon: Users, path: '/teacher/classes' },
  { id: 'attendance', label: 'Take Attendance', icon: CheckCircle2, path: '/teacher/attendance' },
  { id: 'subjects', label: 'My Subjects', icon: BookOpen, path: '/teacher/subjects' },
  { id: 'exams', label: 'Exams & Marks', icon: ClipboardList, path: '/teacher/exams' },
  { id: 'assignments', label: 'Assignments', icon: FileText, path: '/teacher/assignments' },
  { id: 'reports', label: 'Reports', icon: BarChart3, path: '/teacher/reports' },
  { id: 'leave', label: 'Leave Management', icon: Calendar, path: '/teacher/leave' },
  { id: 'notices', label: 'Notices', icon: Bell, path: '/teacher/notices' },
];

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('schoolAdmin_token');
    const userInfo = localStorage.getItem('schoolAdmin_info');
    
    if (!token || !userInfo) {
      navigate('/login');
      return;
    }

    try {
      const parsed = JSON.parse(userInfo);
      if (parsed.userType !== 'teacher') {
        navigate('/login');
        return;
      }
      setUser(parsed.user || {});
      setSchool(parsed.school || {});
    } catch (e) {
      console.error('Error parsing user info:', e);
      navigate('/login');
      return;
    }
    
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('schoolAdmin_token');
    localStorage.removeItem('schoolAdmin_info');
    navigate('/login');
  };

  const isActivePath = (path) => {
    if (path === '/teacher') {
      return location.pathname === '/teacher';
    }
    return location.pathname.startsWith(path);
  };

  // Get current page based on URL
  const getCurrentPage = () => {
    const path = location.pathname;
    if (path === '/teacher' || path === '/teacher/') return 'home';
    if (path.includes('/duties')) return 'duties';
    if (path.includes('/timetable')) return 'timetable';
    if (path.includes('/profile')) return 'profile';
    if (path.includes('/classes')) return 'classes';
    if (path.includes('/attendance')) return 'attendance';
    if (path.includes('/subjects')) return 'subjects';
    if (path.includes('/exams')) return 'exams';
    if (path.includes('/assignments')) return 'assignments';
    if (path.includes('/reports')) return 'reports';
    if (path.includes('/leave')) return 'leave';
    if (path.includes('/notices')) return 'notices';
    return 'home';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading user data...</div>
      </div>
    );
  }

  const currentPage = getCurrentPage();

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
            <BookOpen className="w-6 h-6 text-emerald-500" />
            <span className="font-semibold text-white">Teacher Portal</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold">
            {user.firstName?.[0] || 'T'}
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
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Teacher Portal</h1>
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
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
              {user.firstName?.[0] || 'T'}{user.lastName?.[0] || ''}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Teacher'}</p>
              <p className="text-sm text-slate-400 truncate">{user.designation || 'Teacher'}</p>
              <p className="text-xs text-slate-500">{user.department || 'Department'}</p>
            </div>
          </div>
          {user.isClassTeacher && (
            <div className="mt-3 p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <Award className="w-3 h-3" />
                Class Teacher
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {TEACHER_MENU.map(item => {
            const Icon = item.icon;
            const isActive = isActivePath(item.path);
            return (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
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
        {currentPage === 'home' && <TeacherHome user={user} school={school} navigate={navigate} />}
        {currentPage === 'timetable' && <TeacherTimetablePage user={user} />}
        {currentPage === 'duties' && (
          <DutiesReport 
            userType="teacher"
            userId={user?.id}
            backPath="/teacher"
            accentColor="emerald"
          />
        )}
        {currentPage !== 'home' && currentPage !== 'timetable' && currentPage !== 'duties' && (
          <div className="p-4 lg:p-6">
            <ComingSoon title={TEACHER_MENU.find(m => m.id === currentPage)?.label || 'Page'} />
          </div>
        )}
      </main>
    </div>
  );
};

// Coming Soon Component
const ComingSoon = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-96 text-center">
    <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
      <Clock className="w-12 h-12 text-emerald-400" />
    </div>
    <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
    <p className="text-slate-400 max-w-md">
      This feature is coming soon. We're working hard to bring you the best experience.
    </p>
  </div>
);

// Teacher Home Component
const TeacherHome = ({ user, school, navigate }) => {
  const [loading, setLoading] = useState(true);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [stats, setStats] = useState({ classes: 0, periods: 0, subjects: 0, today: 0 });
  
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const getDayOfWeek = () => {
    const dayIdx = new Date().getDay();
    return dayIdx === 0 ? 'Sunday' : DAYS[dayIdx - 1];
  };

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  useEffect(() => {
    fetchTodaySchedule();
  }, [user]);

  const fetchTodaySchedule = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    try {
      const { academicSessions, timetable } = await import('../services/api');
      
      const sessionRes = await academicSessions.getCurrent();
      if (sessionRes?.success && sessionRes.data) {
        const res = await timetable.getTeacher(user.id, { 
          academic_session_id: sessionRes.data.id 
        });
        
        if (res?.success && res.data) {
          // Convert API data format
          const allEntries = Object.values(res.data);
          const day = getDayOfWeek();
          
          // Filter today's schedule
          const todayEntries = allEntries
            .filter(entry => entry.dayOfWeek === day)
            .sort((a, b) => a.periodNumber - b.periodNumber)
            .map(entry => ({
              ...entry,
              className: entry.className ? 
                (entry.sectionName ? `${entry.className} - ${entry.sectionName}` : entry.className) : 
                'No Class'
            }));
          
          setTodaySchedule(todayEntries);
          
          // Calculate stats
          const uniqueClasses = new Set(allEntries.map(e => e.classSectionId).filter(Boolean));
          const uniqueSubjects = new Set(allEntries.map(e => e.subjectName).filter(Boolean));
          
          setStats({
            classes: uniqueClasses.size,
            periods: allEntries.length,
            subjects: uniqueSubjects.size,
            today: todayEntries.length
          });
        }
      }
    } catch (e) {
      console.error('Error fetching schedule:', e);
    } finally {
      setLoading(false);
    }
  };

  const quickLinks = [
    { label: 'Take Attendance', icon: CheckCircle2, path: '/teacher/attendance', color: 'from-emerald-500 to-teal-500' },
    { label: 'View Timetable', icon: Clock, path: '/teacher/timetable', color: 'from-blue-500 to-cyan-500' },
    { label: 'My Duties', icon: ListTodo, path: '/teacher/duties', color: 'from-orange-500 to-rose-500' },
    { label: 'Apply Leave', icon: Calendar, path: '/teacher/leave', color: 'from-amber-500 to-orange-500' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const SUBJECT_COLORS = [
    { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' },
    { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
    { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30' },
    { bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' },
  ];

  const getSubjectColor = (idx) => SUBJECT_COLORS[idx % SUBJECT_COLORS.length];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Welcome Header with Date */}
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-emerald-200 text-sm font-medium mb-1">{formatDate()}</p>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">
              {getGreeting()}, {user?.firstName || 'Teacher'}! 👋
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm">
                {user?.designation || 'Teacher'}
              </span>
              {user?.department && (
                <span className="px-3 py-1 bg-white/10 rounded-full text-sm">
                  {user.department}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden lg:block">
              <p className="text-emerald-200 text-sm">School</p>
              <p className="font-semibold">{school?.name || 'Your School'}</p>
            </div>
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-white/20 flex items-center justify-center">
              <GraduationCap className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-white">{stats.classes}</p>
              <p className="text-sm text-blue-300">My Sections</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/20">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 backdrop-blur-sm rounded-xl p-4 border border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-white">{stats.periods}</p>
              <p className="text-sm text-emerald-300">Periods/Week</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/20">
              <Clock className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-white">{stats.subjects}</p>
              <p className="text-sm text-purple-300">Subjects</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/20">
              <BookOpen className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/10 backdrop-blur-sm rounded-xl p-4 border border-amber-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-white">{stats.today}</p>
              <p className="text-sm text-amber-300">Today's Classes</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/20">
              <Calendar className="w-6 h-6 text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ChevronRight className="w-5 h-5 text-emerald-400" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link, idx) => {
            const Icon = link.icon;
            return (
              <Link
                key={idx}
                to={link.path}
                className={`bg-gradient-to-br ${link.color} rounded-xl p-4 text-white hover:scale-[1.02] hover:shadow-lg transition-all duration-200 group`}
              >
                <Icon className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                <p className="font-semibold text-sm">{link.label}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Schedule - Takes 2 columns */}
        <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              Today's Classes
            </h3>
            <Link 
              to="/teacher/timetable" 
              className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Full Timetable
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
              </div>
            ) : getDayOfWeek() === 'Sunday' ? (
              <div className="text-center py-12 text-slate-400">
                <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-slate-500" />
                </div>
                <p className="font-semibold text-white text-lg">It's Sunday!</p>
                <p className="text-sm mt-1">Enjoy your well-deserved day off</p>
              </div>
            ) : todaySchedule.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-slate-500" />
                </div>
                <p className="font-semibold text-white">No classes scheduled</p>
                <p className="text-sm mt-1">You have a free day today</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {todaySchedule.map((entry, idx) => {
                  const colors = getSubjectColor(idx);
                  return (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-xl ${colors.bg} border ${colors.border} flex items-center gap-4`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex flex-col items-center justify-center text-white">
                        <span className="text-xs text-slate-400">Period</span>
                        <span className="font-bold text-lg">{entry.periodNumber}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold ${colors.text} truncate`}>
                          {entry.subjectName || 'No Subject'}
                        </p>
                        <p className="text-sm text-slate-400">{entry.className}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-white">
                          {entry.startTime?.slice(0, 5) || '--:--'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {entry.endTime?.slice(0, 5) || '--:--'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Notices */}
        <div className="space-y-6">
          {/* Notices */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                Notices
              </h3>
              <Link 
                to="/teacher/notices" 
                className="text-xs text-amber-400 hover:text-amber-300"
              >
                View All
              </Link>
            </div>
            <div className="p-4 space-y-3">
              {[
                { title: 'Staff Meeting Tomorrow', time: '3:00 PM', type: 'meeting' },
                { title: 'Submit Term Grades', time: 'Due Friday', type: 'deadline' },
                { title: 'PTM Next Week', time: 'Saturday', type: 'event' },
              ].map((notice, idx) => (
                <div key={idx} className="p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer">
                  <p className="text-sm font-medium text-white truncate">{notice.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{notice.time}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              This Week
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Attendance Taken</span>
                <span className="text-sm font-medium text-emerald-400">85%</span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full w-[85%] bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-slate-400">Classes Completed</span>
                <span className="text-sm font-medium text-blue-400">12/15</span>
              </div>
              <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full w-[80%] bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Duties Section - Compact Widget */}
      <div>
        <MyDuties
          assigneeId={user?.id}
          assigneeType="teacher"
          showSupervised={true}
          todayOnly={true}
          title="Today's Duties"
          accentColor="emerald"
          onViewAll={() => navigate('/teacher/duties')}
        />
      </div>
    </div>
  );
};

// Timetable Page with Date Filters
const TeacherTimetablePage = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [timetableData, setTimetableData] = useState({});
  const [currentSession, setCurrentSession] = useState(null);
  const [viewMode, setViewMode] = useState('daily'); // daily, weekly, monthly
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedWeekStart, setSelectedWeekStart] = useState(getWeekStart(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const SUBJECT_COLORS = [
    { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-300' },
    { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-300' },
    { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-300' },
    { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-300' },
    { bg: 'bg-rose-500/20', border: 'border-rose-500/50', text: 'text-rose-300' },
    { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-300' },
  ];

  const [subjectColorMap, setSubjectColorMap] = useState({});

  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  }

  function getWeekDates(startDate) {
    const dates = [];
    const start = new Date(startDate);
    for (let i = 0; i < 6; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      dates.push({
        date: d.toISOString().split('T')[0],
        day: DAYS[i],
        dayNum: d.getDate(),
        month: d.toLocaleDateString('en-IN', { month: 'short' })
      });
    }
    return dates;
  }

  function getMonthDates(yearMonth) {
    const [year, month] = yearMonth.split('-').map(Number);
    const dates = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month - 1, day);
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0) { // Skip Sundays
        dates.push({
          date: d.toISOString().split('T')[0],
          day: DAYS[dayOfWeek === 0 ? 6 : dayOfWeek - 1],
          dayNum: day,
          weekday: d.toLocaleDateString('en-IN', { weekday: 'short' })
        });
      }
    }
    return dates;
  }

  useEffect(() => {
    fetchTimetable();
  }, [user]);

  const fetchTimetable = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Import API dynamically to avoid issues
      const { academicSessions, timetable } = await import('../services/api');
      
      const sessionRes = await academicSessions.getCurrent();
      if (sessionRes?.success) {
        setCurrentSession(sessionRes.data);
        
        const res = await timetable.getTeacher(user.id, { 
          academic_session_id: sessionRes.data.id 
        });
        
        if (res?.success && res.data) {
          // API returns data as {"Monday-1": {...}, "Monday-2": {...}}
          // Convert to {"Monday": [{...}, {...}], "Tuesday": [...]}
          const convertedData = {};
          
          Object.entries(res.data).forEach(([key, entry]) => {
            // key format is "Monday-1", "Tuesday-2", etc.
            const dayOfWeek = entry.dayOfWeek || key.split('-')[0];
            
            if (!convertedData[dayOfWeek]) {
              convertedData[dayOfWeek] = [];
            }
            
            convertedData[dayOfWeek].push({
              ...entry,
              className: entry.className ? 
                (entry.sectionName ? `${entry.className} - ${entry.sectionName}` : entry.className) : 
                'No Class'
            });
          });
          
          // Sort each day's entries by period number
          Object.keys(convertedData).forEach(day => {
            convertedData[day].sort((a, b) => a.periodNumber - b.periodNumber);
          });
          
          setTimetableData(convertedData);
          
          // Build color map
          const subjects = new Set();
          Object.values(convertedData).forEach(dayEntries => {
            (dayEntries || []).forEach(entry => {
              if (entry.subjectName) subjects.add(entry.subjectName);
            });
          });
          
          const colorMap = {};
          Array.from(subjects).forEach((subj, idx) => {
            colorMap[subj] = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
          });
          setSubjectColorMap(colorMap);
        }
      }
    } catch (e) {
      console.error('Error fetching timetable:', e);
    } finally {
      setLoading(false);
    }
  };

  const getDayOfWeek = (dateStr) => {
    const date = new Date(dateStr);
    const dayIdx = date.getDay();
    return dayIdx === 0 ? 'Sunday' : DAYS[dayIdx - 1];
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getScheduleForDay = (day) => {
    return (timetableData[day] || []).sort((a, b) => a.periodNumber - b.periodNumber);
  };

  const getSubjectColor = (subjectName) => {
    return subjectColorMap[subjectName] || SUBJECT_COLORS[0];
  };

  const navigateDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const navigateWeek = (weeks) => {
    const newDate = new Date(selectedWeekStart);
    newDate.setDate(newDate.getDate() + (weeks * 7));
    setSelectedWeekStart(newDate.toISOString().split('T')[0]);
  };

  const navigateMonth = (months) => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const newDate = new Date(year, month - 1 + months, 1);
    setSelectedMonth(newDate.toISOString().slice(0, 7));
  };

  // Stats
  const getTotalPeriods = () => {
    let total = 0;
    Object.values(timetableData).forEach(day => {
      total += (day || []).length;
    });
    return total;
  };

  const getUniqueClasses = () => {
    const classes = new Set();
    Object.values(timetableData).forEach(day => {
      (day || []).forEach(entry => {
        if (entry.className) classes.add(entry.className);
      });
    });
    return classes.size;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const weekDates = getWeekDates(selectedWeekStart);
  const monthDates = getMonthDates(selectedMonth);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Clock className="w-8 h-8" />
              My Timetable
            </h2>
            <p className="text-emerald-100 mt-1">
              {currentSession?.name || 'Academic Session'} • {user?.fullName || user?.firstName || 'Teacher'}
            </p>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="bg-white/20 rounded-lg px-3 py-2">
              <span className="font-bold text-lg">{getTotalPeriods()}</span>
              <span className="text-emerald-100 ml-1">classes/week</span>
            </div>
            <div className="bg-white/20 rounded-lg px-3 py-2">
              <span className="font-bold text-lg">{getUniqueClasses()}</span>
              <span className="text-emerald-100 ml-1">sections</span>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-2 border border-slate-700">
        <div className="flex gap-2">
          {[
            { id: 'daily', label: 'Daily View', icon: Calendar },
            { id: 'weekly', label: 'Weekly View', icon: Clock },
            { id: 'monthly', label: 'Monthly View', icon: GraduationCap },
          ].map(mode => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  viewMode === mode.id
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Daily View */}
      {viewMode === 'daily' && (
        <>
          {/* Date Navigation */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => navigateDate(-1)} 
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all"
              >
                <ChevronRight className="w-5 h-5 text-slate-300 rotate-180" />
              </button>
              
              <div className="text-center flex-1">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-slate-400 text-sm mt-1">{formatDate(selectedDate)}</p>
              </div>
              
              <button 
                onClick={() => navigateDate(1)} 
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all"
              >
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>
            </div>
            
            <div className="flex justify-center gap-2 mt-3">
              <button 
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-all"
              >
                Today
              </button>
            </div>
          </div>

          {/* Daily Schedule */}
          <DayScheduleCard 
            day={getDayOfWeek(selectedDate)} 
            date={selectedDate}
            schedule={getScheduleForDay(getDayOfWeek(selectedDate))}
            getSubjectColor={getSubjectColor}
          />
        </>
      )}

      {/* Weekly View */}
      {viewMode === 'weekly' && (
        <>
          {/* Week Navigation */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => navigateWeek(-1)} 
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all"
              >
                <ChevronRight className="w-5 h-5 text-slate-300 rotate-180" />
              </button>
              
              <div className="text-center">
                <p className="text-white font-semibold">
                  {new Date(selectedWeekStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {
                    new Date(new Date(selectedWeekStart).setDate(new Date(selectedWeekStart).getDate() + 5)).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                  }
                </p>
              </div>
              
              <button 
                onClick={() => navigateWeek(1)} 
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all"
              >
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>
            </div>
            
            <div className="flex justify-center mt-3">
              <button 
                onClick={() => setSelectedWeekStart(getWeekStart(new Date()))}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-all"
              >
                Current Week
              </button>
            </div>
          </div>

          {/* Weekly Grid */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
            <div className="grid grid-cols-6 min-w-[800px]">
              {/* Day Headers */}
              {weekDates.map(({ day, dayNum, month, date }) => {
                const isToday = date === new Date().toISOString().split('T')[0];
                return (
                  <div 
                    key={day} 
                    className={`p-3 text-center border-b border-r border-slate-700 last:border-r-0 ${
                      isToday ? 'bg-emerald-500/20' : 'bg-slate-700/50'
                    }`}
                  >
                    <p className={`font-semibold ${isToday ? 'text-emerald-300' : 'text-slate-300'}`}>{day}</p>
                    <p className={`text-sm ${isToday ? 'text-emerald-400' : 'text-slate-400'}`}>{dayNum} {month}</p>
                  </div>
                );
              })}

              {/* Day Contents */}
              {weekDates.map(({ day, date }) => {
                const schedule = getScheduleForDay(day);
                const isToday = date === new Date().toISOString().split('T')[0];
                return (
                  <div 
                    key={day} 
                    className={`border-r border-slate-700 last:border-r-0 min-h-[300px] ${
                      isToday ? 'bg-emerald-500/5' : ''
                    }`}
                  >
                    {schedule.length > 0 ? (
                      schedule.map((entry, idx) => {
                        const colors = getSubjectColor(entry.subjectName);
                        return (
                          <div 
                            key={idx}
                            className={`p-2 m-1 rounded-lg ${colors.bg} ${colors.border} border`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs font-bold ${colors.text}`}>P{entry.periodNumber}</span>
                              <span className="text-xs text-slate-400">{entry.startTime?.slice(0,5)}</span>
                            </div>
                            <p className={`font-semibold text-xs ${colors.text}`}>{entry.subjectName}</p>
                            <p className="text-xs text-slate-300">{entry.className}</p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-slate-500 text-xs">
                        No classes
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Monthly View */}
      {viewMode === 'monthly' && (
        <>
          {/* Month Navigation */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => navigateMonth(-1)} 
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all"
              >
                <ChevronRight className="w-5 h-5 text-slate-300 rotate-180" />
              </button>
              
              <div className="text-center">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              
              <button 
                onClick={() => navigateMonth(1)} 
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all"
              >
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>
            </div>
            
            <div className="flex justify-center mt-3">
              <button 
                onClick={() => setSelectedMonth(new Date().toISOString().slice(0, 7))}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-all"
              >
                Current Month
              </button>
            </div>
          </div>

          {/* Monthly Calendar */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <h3 className="font-semibold text-white">
                {new Date(selectedMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </h3>
            </div>
            
            <div className="divide-y divide-slate-700 max-h-[600px] overflow-y-auto">
              {monthDates.map(({ date, day, dayNum, weekday }) => {
                const schedule = getScheduleForDay(day);
                const isToday = date === new Date().toISOString().split('T')[0];
                const totalClasses = schedule.length;
                
                return (
                  <div 
                    key={date} 
                    className={`p-3 flex items-center gap-4 ${isToday ? 'bg-emerald-500/10' : 'hover:bg-slate-700/30'}`}
                  >
                    <div className={`w-14 text-center ${isToday ? 'text-emerald-400' : 'text-slate-400'}`}>
                      <p className="text-lg font-bold">{dayNum}</p>
                      <p className="text-xs">{weekday}</p>
                    </div>
                    
                    <div className="flex-1 flex flex-wrap gap-2">
                      {schedule.length > 0 ? (
                        schedule.slice(0, 5).map((entry, idx) => {
                          const colors = getSubjectColor(entry.subjectName);
                          return (
                            <div 
                              key={idx}
                              className={`px-2 py-1 rounded ${colors.bg} ${colors.border} border`}
                            >
                              <span className={`text-xs font-medium ${colors.text}`}>
                                P{entry.periodNumber}: {entry.subjectName}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-slate-500 text-sm">No classes</span>
                      )}
                      {schedule.length > 5 && (
                        <span className="text-slate-400 text-xs self-center">+{schedule.length - 5} more</span>
                      )}
                    </div>
                    
                    <div className={`text-right ${isToday ? 'text-emerald-400' : 'text-slate-400'}`}>
                      <span className="font-bold">{totalClasses}</span>
                      <span className="text-xs ml-1">classes</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Subject Legend */}
      {Object.keys(subjectColorMap).length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
          <h4 className="font-semibold text-white mb-3">Your Subjects</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(subjectColorMap).map(([subject, colors]) => (
              <div 
                key={subject}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${colors.bg} ${colors.border} border`}
              >
                <span className={`text-sm font-medium ${colors.text}`}>{subject}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Day Schedule Card Component
const DayScheduleCard = ({ day, date, schedule, getSubjectColor }) => {
  if (day === 'Sunday') {
    return (
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700 text-center">
        <Calendar className="w-16 h-16 mx-auto mb-4 text-slate-500 opacity-50" />
        <p className="text-lg font-medium text-white">Sunday</p>
        <p className="text-slate-400">It's a holiday! Enjoy your day off.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
      <div className="bg-slate-700/50 px-6 py-4 border-b border-slate-600">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-400" />
          {day}'s Schedule
          <span className="text-sm text-slate-400 font-normal ml-2">({schedule.length} classes)</span>
        </h3>
      </div>

      {schedule.length === 0 ? (
        <div className="p-12 text-center text-slate-400">
          <Clock className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No classes scheduled</p>
          <p className="text-sm mt-1">You have a free day on {day}</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-700">
          {schedule.map((entry, idx) => {
            const colors = getSubjectColor(entry.subjectName);
            return (
              <div 
                key={idx} 
                className="p-4 hover:bg-slate-700/30 transition-all flex items-center gap-4"
              >
                {/* Period Number */}
                <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center font-bold ${colors.text}`}>
                  P{entry.periodNumber}
                </div>
                
                {/* Time */}
                <div className="text-slate-400 w-32">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium text-white">
                      {entry.startTime?.slice(0,5) || '--:--'}
                    </span>
                  </div>
                  <span className="text-sm">to {entry.endTime?.slice(0,5) || '--:--'}</span>
                </div>
                
                {/* Subject & Class */}
                <div className="flex-1">
                  <p className={`font-semibold ${colors.text}`}>{entry.subjectName || 'No Subject'}</p>
                  <p className="text-slate-300">{entry.className || 'No Class'}</p>
                </div>
                
                {/* Room */}
                {entry.room && (
                  <div className="text-slate-400 text-sm">
                    Room: {entry.room}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
