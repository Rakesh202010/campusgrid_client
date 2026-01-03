import { useState, useEffect } from 'react';
import { useNavigate, Link, Outlet, useLocation } from 'react-router-dom';
import {
  BookOpen, Home, User, Calendar, ClipboardList, Users,
  Bell, LogOut, Menu, X, ChevronRight, Clock, Award,
  CheckCircle2, FileText, BarChart3, MessageSquare, Settings, GraduationCap
} from 'lucide-react';

const TEACHER_MENU = [
  { id: 'home', label: 'Home', icon: Home, path: '/teacher' },
  { id: 'profile', label: 'My Profile', icon: User, path: '/teacher/profile' },
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
    if (path === '/teacher') {
      return location.pathname === '/teacher';
    }
    return location.pathname.startsWith(path);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const isHomePage = location.pathname === '/teacher';

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
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white truncate">{user.fullName}</p>
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
        {isHomePage ? (
          <TeacherHome user={user} school={school} />
        ) : (
          <div className="p-4 lg:p-6">
            <Outlet />
          </div>
        )}
      </main>
    </div>
  );
};

// Teacher Home Component
const TeacherHome = ({ user, school }) => {
  const quickLinks = [
    { label: 'Take Attendance', icon: CheckCircle2, path: '/teacher/attendance', color: 'from-emerald-500 to-teal-500' },
    { label: 'View Timetable', icon: Clock, path: '/teacher/timetable', color: 'from-blue-500 to-cyan-500' },
    { label: 'Enter Marks', icon: ClipboardList, path: '/teacher/exams', color: 'from-purple-500 to-pink-500' },
    { label: 'Apply Leave', icon: Calendar, path: '/teacher/leave', color: 'from-amber-500 to-orange-500' },
  ];

  const stats = [
    { label: 'My Classes', value: '4', icon: Users, color: 'text-blue-400' },
    { label: 'Total Students', value: '145', icon: GraduationCap, color: 'text-emerald-400' },
    { label: 'Subjects', value: '3', icon: BookOpen, color: 'text-purple-400' },
    { label: 'Leave Balance', value: '12 Days', icon: Calendar, color: 'text-amber-400' },
  ];

  const todaySchedule = [
    { time: '08:00 - 08:45', class: 'Class 10-A', subject: 'Mathematics' },
    { time: '08:45 - 09:30', class: 'Class 9-B', subject: 'Mathematics' },
    { time: '10:00 - 10:45', class: 'Class 8-A', subject: 'Mathematics' },
    { time: '11:30 - 12:15', class: 'Class 10-B', subject: 'Mathematics' },
    { time: '01:00 - 01:45', class: 'Class 9-A', subject: 'Mathematics' },
  ];

  const pendingTasks = [
    { task: 'Submit Class 10-A attendance', due: 'Today', priority: 'high' },
    { task: 'Grade Unit Test papers', due: 'Tomorrow', priority: 'medium' },
    { task: 'Prepare Class 9 worksheet', due: 'In 3 days', priority: 'low' },
  ];

  return (
    <div className="p-4 lg:p-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">
              Good Morning, {user.firstName}! 👋
            </h1>
            <p className="text-emerald-100">
              {user.designation || 'Teacher'} | {user.department || 'Department'}
            </p>
            <p className="text-sm text-emerald-200 mt-1">
              {school?.name || 'Your School'}
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-white" />
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

      {/* Today's Schedule & Tasks */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            Today's Schedule
          </h3>
          <div className="space-y-3">
            {todaySchedule.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-slate-700/30 rounded-lg">
                <div className="text-sm text-slate-400 w-28">{item.time}</div>
                <div className="flex-1">
                  <p className="font-medium text-white">{item.class}</p>
                  <p className="text-sm text-slate-400">{item.subject}</p>
                </div>
                <Link
                  to={`/teacher/attendance?class=${item.class}`}
                  className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400 hover:bg-emerald-500/30"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            Pending Tasks
          </h3>
          <div className="space-y-3">
            {pendingTasks.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-slate-700/30 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  item.priority === 'high' ? 'bg-red-500' :
                  item.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
                <div className="flex-1">
                  <p className="font-medium text-white">{item.task}</p>
                  <p className="text-sm text-slate-400">Due: {item.due}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Notices */}
          <h4 className="text-md font-semibold text-white mt-6 mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            Recent Notices
          </h4>
          <div className="space-y-2">
            {[
              { title: 'Staff Meeting - Tomorrow 3 PM', date: '2 hours ago' },
              { title: 'Submit Term Grades by Friday', date: '1 day ago' },
            ].map((notice, idx) => (
              <div key={idx} className="p-3 bg-slate-700/30 rounded-lg">
                <p className="text-sm font-medium text-white">{notice.title}</p>
                <p className="text-xs text-slate-400 mt-1">{notice.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;

