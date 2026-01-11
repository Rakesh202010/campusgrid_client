import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, UserCog, BookOpen, GraduationCap, Calendar, Clock,
  TrendingUp, TrendingDown, IndianRupee, Building2, Award,
  UserPlus, Settings, ChevronRight, RefreshCw, BarChart3,
  PieChart, Activity, Target, Briefcase, UserCheck, AlertCircle,
  ListTodo, MapPin, Shield, User
} from 'lucide-react';
import { dashboard, roster } from '../services/api';
import { useAcademicSession } from '../contexts/AcademicSessionContext';
import { formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentSession, sessionId } = useAcademicSession();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [todaysDuties, setTodaysDuties] = useState([]);
  const [dutiesLoading, setDutiesLoading] = useState(false);

  // Helper to format date as YYYY-MM-DD
  const formatLocalDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (sessionId) {
      fetchDashboardData();
      fetchTodaysDuties();
    }
  }, [sessionId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboard.getStats({ academic_session_id: sessionId });
      if (res?.success) {
        setStats(res.data);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (e) {
      console.error('Dashboard error:', e);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaysDuties = async () => {
    setDutiesLoading(true);
    try {
      const today = formatLocalDate(new Date());
      const res = await roster.getAssignments({
        start_date: today,
        end_date: today,
        academic_session_id: sessionId,
      });
      if (res?.success) {
        setTodaysDuties(res.data || []);
      }
    } catch (e) {
      console.error('Error fetching duties:', e);
    } finally {
      setDutiesLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-gray-600">{error}</p>
          <button onClick={fetchDashboardData} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const overview = stats?.overview || {};
  const genderDist = stats?.genderDistribution || { male: 0, female: 0, other: 0 };
  const classDist = stats?.classDistribution || [];
  const deptDist = stats?.departmentDistribution || [];
  const recentStudents = stats?.recentStudents || [];
  const recentTeachers = stats?.recentTeachers || [];
  // Use currentSession from context (already available)

  const totalGender = genderDist.male + genderDist.female + genderDist.other;
  const malePercent = totalGender > 0 ? ((genderDist.male / totalGender) * 100).toFixed(1) : 0;
  const femalePercent = totalGender > 0 ? ((genderDist.female / totalGender) * 100).toFixed(1) : 0;

  // Get max value for class distribution chart
  const maxClassCount = Math.max(...classDist.map(c => c.value), 1);

  return (
    <div className="space-y-6 pb-8">
      {/* Header with Session Info */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back! 👋</h1>
            <p className="text-white/80 mt-1">Here's what's happening in your school today</p>
          </div>
          {currentSession && (
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5" />
                <div>
                  <p className="text-sm text-white/70">Current Session</p>
                  <p className="font-semibold">{currentSession.name}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Students</p>
              <p className="text-4xl font-bold text-gray-800 mt-2">{overview.totalStudents?.toLocaleString()}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3" />
                  +{overview.newStudentsThisMonth || 0} this month
                </span>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">Active: <strong className="text-gray-700">{overview.activeStudents}</strong></span>
            <span className="text-gray-500">Inactive: <strong className="text-gray-700">{overview.inactiveStudents}</strong></span>
          </div>
        </div>

        {/* Total Teachers */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Teachers</p>
              <p className="text-4xl font-bold text-gray-800 mt-2">{overview.totalTeachers?.toLocaleString()}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  <UserCheck className="w-3 h-3" />
                  {overview.activeTeachers} active
                </span>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-lg">
              <UserCog className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">On Leave: <strong className="text-gray-700">{overview.teachersOnLeave || 0}</strong></span>
            <span className="text-gray-500">New: <strong className="text-gray-700">+{overview.newTeachersThisMonth || 0}</strong></span>
          </div>
        </div>

        {/* Student-Teacher Ratio */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Student-Teacher Ratio</p>
              <p className="text-4xl font-bold text-gray-800 mt-2">{overview.studentTeacherRatio}:1</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                  <Target className="w-3 h-3" />
                  Optimal range: 20-25
                </span>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${parseFloat(overview.studentTeacherRatio) <= 25 ? 'bg-green-500' : 'bg-amber-500'}`}
                style={{ width: `${Math.min((parseFloat(overview.studentTeacherRatio) / 40) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Fee Configuration */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Fee Types Configured</p>
              <p className="text-4xl font-bold text-gray-800 mt-2">{overview.totalFeeTypes}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                  <IndianRupee className="w-3 h-3" />
                  ₹{(overview.totalConfiguredFees || 0).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl shadow-lg">
              <IndianRupee className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button 
              onClick={() => navigate('/settings/fees')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              Manage Fees <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gender Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-600" />
              Gender Distribution
            </h3>
          </div>
          
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-40 h-40">
              {/* Simple pie chart using conic-gradient */}
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: `conic-gradient(
                    #3B82F6 0% ${malePercent}%, 
                    #EC4899 ${malePercent}% ${parseFloat(malePercent) + parseFloat(femalePercent)}%, 
                    #8B5CF6 ${parseFloat(malePercent) + parseFloat(femalePercent)}% 100%
                  )`
                }}
              ></div>
              <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-800">{totalGender}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600">Male</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800">{genderDist.male}</span>
                <span className="text-xs text-gray-400">({malePercent}%)</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                <span className="text-sm text-gray-600">Female</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800">{genderDist.female}</span>
                <span className="text-xs text-gray-400">({femalePercent}%)</span>
              </div>
            </div>
            {genderDist.other > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm text-gray-600">Other</span>
                </div>
                <span className="font-semibold text-gray-800">{genderDist.other}</span>
              </div>
            )}
          </div>
        </div>

        {/* Class Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Students by Class
            </h3>
            <button 
              onClick={() => navigate('/students')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View All
            </button>
          </div>
          
          <div className="space-y-3">
            {classDist.slice(0, 8).map((cls, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-20 text-sm font-medium text-gray-600 truncate">{cls.name}</div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-end pr-2"
                      style={{ width: `${Math.max((cls.value / maxClassCount) * 100, 5)}%` }}
                    >
                      <span className="text-xs font-medium text-white">{cls.value}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {classDist.length === 0 && (
              <p className="text-center text-gray-400 py-8">No class data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Students */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              Recent Admissions
            </h3>
            <button 
              onClick={() => navigate('/students')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            {recentStudents.slice(0, 5).map((student) => (
              <div key={student.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold">
                  {student.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{student.name}</p>
                  <p className="text-sm text-gray-500 truncate">{student.className}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-600">{student.admissionNumber || 'N/A'}</p>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(student.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
            {recentStudents.length === 0 && (
              <p className="text-center text-gray-400 py-8">No recent admissions</p>
            )}
          </div>
        </div>

        {/* Recent Teachers */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-600" />
              Recent Staff
            </h3>
            <button 
              onClick={() => navigate('/teachers')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-4">
            {recentTeachers.map((teacher) => (
              <div key={teacher.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold">
                  {teacher.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{teacher.name}</p>
                  <p className="text-sm text-gray-500 truncate">{teacher.department}</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    teacher.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {teacher.status}
                  </span>
                </div>
              </div>
            ))}
            {recentTeachers.length === 0 && (
              <p className="text-center text-gray-400 py-8">No recent staff additions</p>
            )}
          </div>
        </div>
      </div>

      {/* Today's Duty Assignments */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <ListTodo className="w-5 h-5 text-indigo-600" />
            Today's Duty Assignments
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {formatLocalDate(new Date())}
            </span>
            <Link 
              to="/roster"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              Manage <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
        
        {dutiesLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        ) : todaysDuties.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No duties assigned for today</p>
            <Link 
              to="/roster"
              className="mt-3 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
            >
              <UserPlus className="w-4 h-4" />
              Assign Duties
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {todaysDuties.slice(0, 6).map((duty, idx) => (
              <div 
                key={duty.id || idx}
                className="p-4 rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-semibold text-gray-800 truncate">
                    {duty.duty_name || duty.roster_type_name || 'Duty'}
                  </h4>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    duty.assignee_type === 'teacher' ? 'bg-emerald-100 text-emerald-700' :
                    duty.assignee_type === 'student' ? 'bg-blue-100 text-blue-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {duty.assignee_type}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700 truncate">
                    {duty.assignee_name || 'Unknown'}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                  {duty.time_slot_name && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {duty.time_slot_name}
                    </span>
                  )}
                  {duty.location_name && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {duty.location_name}
                    </span>
                  )}
                  {duty.role_name && (
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {duty.role_name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {todaysDuties.length > 6 && (
          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <Link 
              to="/roster"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View all {todaysDuties.length} assignments →
            </Link>
          </div>
        )}

        {/* Quick Stats */}
        {todaysDuties.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {todaysDuties.filter(d => d.assignee_type === 'teacher').length}
              </p>
              <p className="text-xs text-gray-500">Teachers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {todaysDuties.filter(d => d.assignee_type === 'staff').length}
              </p>
              <p className="text-xs text-gray-500">Staff</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {todaysDuties.filter(d => d.assignee_type === 'student').length}
              </p>
              <p className="text-xs text-gray-500">Students</p>
            </div>
          </div>
        )}
      </div>

      {/* Department Distribution & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              Teachers by Department
            </h3>
          </div>
          
          <div className="space-y-3">
            {deptDist.slice(0, 6).map((dept, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                <span className="text-sm font-medium text-gray-700 truncate">{dept.name}</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                  {dept.count}
                </span>
              </div>
            ))}
            {deptDist.length === 0 && (
              <p className="text-center text-gray-400 py-4">No department data</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Quick Actions
            </h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/students')}
              className="flex flex-col items-center gap-3 p-5 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 border border-blue-100 transition-all group"
            >
              <div className="p-3 bg-blue-500 rounded-xl text-white group-hover:scale-110 transition-transform">
                <UserPlus className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-gray-700">Add Student</span>
            </button>
            
            <button
              onClick={() => navigate('/teachers')}
              className="flex flex-col items-center gap-3 p-5 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-100 transition-all group"
            >
              <div className="p-3 bg-emerald-500 rounded-xl text-white group-hover:scale-110 transition-transform">
                <UserCog className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-gray-700">Add Teacher</span>
            </button>
            
            <button
              onClick={() => navigate('/settings/class-configuration')}
              className="flex flex-col items-center gap-3 p-5 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border border-purple-100 transition-all group"
            >
              <div className="p-3 bg-purple-500 rounded-xl text-white group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-gray-700">Manage Classes</span>
            </button>
            
            <button
              onClick={() => navigate('/settings')}
              className="flex flex-col items-center gap-3 p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-100 transition-all group"
            >
              <div className="p-3 bg-amber-500 rounded-xl text-white group-hover:scale-110 transition-transform">
                <Settings className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-gray-700">Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 text-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-gray-400 text-sm">Active Classes</p>
            <p className="text-3xl font-bold mt-1">{classDist.length}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">Departments</p>
            <p className="text-3xl font-bold mt-1">{deptDist.length}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">New This Week</p>
            <p className="text-3xl font-bold mt-1">+{overview.newStudentsThisWeek || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-sm">System Status</p>
            <p className="text-lg font-bold mt-1 text-green-400 flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              All Systems Go
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
