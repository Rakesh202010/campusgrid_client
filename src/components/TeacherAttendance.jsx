import { useState, useEffect } from 'react';
import {
  Calendar, Clock, CheckCircle, XCircle, UserCheck, UserX, Coffee,
  ChevronLeft, ChevronRight, Search, Filter, Save, RefreshCw, Sun,
  Moon, CalendarDays, BarChart3, Users, AlertCircle, Check, X
} from 'lucide-react';
import { teachers, academicSessions } from '../services/api';
import { toast } from '../utils/toast';

const ATTENDANCE_STATUS = {
  present: { label: 'Present', short: 'P', color: 'bg-green-500', light: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  absent: { label: 'Absent', short: 'A', color: 'bg-red-500', light: 'bg-red-100', text: 'text-red-700', icon: XCircle },
  half_day: { label: 'Half Day', short: 'H', color: 'bg-amber-500', light: 'bg-amber-100', text: 'text-amber-700', icon: Coffee },
  on_leave: { label: 'On Leave', short: 'L', color: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700', icon: Calendar }
};

const TeacherAttendance = () => {
  const [teachersList, setTeachersList] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // UI State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [showMonthView, setShowMonthView] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (currentSession?.id) fetchAttendance();
  }, [selectedDate, currentSession]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teachersRes, sessionRes] = await Promise.all([
        teachers.getAll(),
        academicSessions.getCurrent()
      ]);
      if (teachersRes?.success) setTeachersList(teachersRes.data || []);
      if (sessionRes?.success) setCurrentSession(sessionRes.data);
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      // Fetch attendance for selected date
      const res = await teachers.getAttendanceForDate(selectedDate);
      if (res?.success) {
        const data = {};
        (res.data || []).forEach(a => {
          data[a.teacherId] = a.status;
        });
        setAttendanceData(data);
      }
    } catch (e) {
      // Initialize empty if not found
      setAttendanceData({});
    }
  };

  const handleStatusChange = (teacherId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [teacherId]: prev[teacherId] === status ? null : status
    }));
    setHasUnsavedChanges(true);
  };

  const handleMarkAll = (status) => {
    const newData = {};
    filteredTeachers.forEach(t => {
      newData[t.id] = status;
    });
    setAttendanceData(prev => ({ ...prev, ...newData }));
    setHasUnsavedChanges(true);
    toast.success(`Marked all as ${ATTENDANCE_STATUS[status].label}`);
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const entries = Object.entries(attendanceData)
        .filter(([_, status]) => status)
        .map(([teacherId, status]) => ({
          teacherId,
          status,
          date: selectedDate
        }));
      
      const res = await teachers.saveAttendance(entries);
      if (res?.success) {
        toast.success('Attendance saved successfully!');
        setHasUnsavedChanges(false);
      } else {
        toast.error('Failed to save attendance');
      }
    } catch (e) {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  // Filter teachers
  const departments = [...new Set(teachersList.map(t => t.department).filter(Boolean))];
  const filteredTeachers = teachersList.filter(t => {
    const matchSearch = !searchTerm || t.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = !filterDept || t.department === filterDept;
    return matchSearch && matchDept && t.status === 'active';
  });

  // Stats
  const presentCount = Object.values(attendanceData).filter(s => s === 'present').length;
  const absentCount = Object.values(attendanceData).filter(s => s === 'absent').length;
  const halfDayCount = Object.values(attendanceData).filter(s => s === 'half_day').length;
  const onLeaveCount = Object.values(attendanceData).filter(s => s === 'on_leave').length;
  const notMarkedCount = filteredTeachers.length - Object.values(attendanceData).filter(Boolean).length;

  const formatDisplayDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const isWeekend = [0, 6].includes(new Date(selectedDate).getDay());

  // Month calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const { days, firstDay } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading attendance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <UserCheck className="w-8 h-8" />
              Teacher Attendance
            </h2>
            <p className="text-white/80 mt-1">Mark daily attendance quickly and easily</p>
          </div>
          
          {/* Date Picker */}
          <div className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl p-2">
            <button onClick={() => {
              const prev = new Date(selectedDate);
              prev.setDate(prev.getDate() - 1);
              setSelectedDate(prev.toISOString().split('T')[0]);
            }} className="p-2 hover:bg-white/20 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center min-w-[200px]">
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-0 text-white font-medium text-center focus:outline-none cursor-pointer" />
              <p className="text-xs text-white/70">{isToday ? "Today" : formatDisplayDate(selectedDate).split(',')[0]}</p>
            </div>
            <button onClick={() => {
              const next = new Date(selectedDate);
              next.setDate(next.getDate() + 1);
              setSelectedDate(next.toISOString().split('T')[0]);
            }} className="p-2 hover:bg-white/20 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mt-6">
          {Object.entries(ATTENDANCE_STATUS).map(([key, val]) => {
            const count = key === 'present' ? presentCount : 
                         key === 'absent' ? absentCount : 
                         key === 'half_day' ? halfDayCount : onLeaveCount;
            return (
              <div key={key} className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center">
                <val.icon className="w-6 h-6 mx-auto mb-2" />
                <p className="text-3xl font-bold">{count}</p>
                <p className="text-white/70 text-sm">{val.label}</p>
              </div>
            );
          })}
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            <p className="text-3xl font-bold">{notMarkedCount}</p>
            <p className="text-white/70 text-sm">Not Marked</p>
          </div>
        </div>
      </div>

      {/* Weekend Notice */}
      {isWeekend && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <Sun className="w-6 h-6 text-amber-500" />
          <p className="text-amber-700">This date falls on a weekend. Attendance marking might not be required.</p>
        </div>
      )}

      {/* Action Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search teacher..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 w-64" />
            </div>
            <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500">
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Mark All */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              <span className="text-sm text-gray-500 px-2">Mark All:</span>
              <button onClick={() => handleMarkAll('present')}
                className="p-2 hover:bg-green-100 rounded-lg text-green-600" title="Mark all Present">
                <CheckCircle className="w-5 h-5" />
              </button>
              <button onClick={() => handleMarkAll('absent')}
                className="p-2 hover:bg-red-100 rounded-lg text-red-600" title="Mark all Absent">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <button onClick={() => setShowMonthView(!showMonthView)}
              className={`px-4 py-2.5 rounded-xl font-medium transition-all ${showMonthView ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
              <CalendarDays className="w-5 h-5 inline mr-2" />Monthly View
            </button>

            <button onClick={handleSaveAttendance} disabled={saving || !hasUnsavedChanges}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
                hasUnsavedChanges 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/30' 
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}>
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTeachers.map(teacher => {
          const status = attendanceData[teacher.id];
          const statusConfig = status ? ATTENDANCE_STATUS[status] : null;
          
          return (
            <div key={teacher.id} className={`bg-white rounded-2xl shadow-md overflow-hidden transition-all hover:shadow-lg ${
              status ? `ring-2 ${statusConfig.text.replace('text', 'ring')}` : ''
            }`}>
              {/* Header */}
              <div className={`p-4 ${status ? statusConfig.light : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                    status ? statusConfig.color : 'bg-gray-400'
                  }`}>
                    {teacher.firstName?.[0]}{teacher.lastName?.[0] || ''}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 truncate">{teacher.fullName}</h4>
                    <p className="text-sm text-gray-500 truncate">{teacher.department || 'Staff'}</p>
                  </div>
                  {status && (
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig.color} text-white`}>
                      {statusConfig.short}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Buttons */}
              <div className="p-3 grid grid-cols-4 gap-2">
                {Object.entries(ATTENDANCE_STATUS).map(([key, val]) => {
                  const isActive = status === key;
                  const IconComp = val.icon;
                  return (
                    <button key={key} onClick={() => handleStatusChange(teacher.id, key)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
                        isActive 
                          ? `${val.color} text-white shadow-lg` 
                          : `${val.light} ${val.text} hover:shadow-md`
                      }`}>
                      <IconComp className="w-5 h-5" />
                      <span className="text-xs mt-1 font-medium">{val.short}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Month View Modal */}
      {showMonthView && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Monthly Attendance Overview</h3>
                <button onClick={() => setShowMonthView(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center justify-center gap-4 mt-4">
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-2 hover:bg-white/20 rounded-lg">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h4 className="text-lg font-medium min-w-[200px] text-center">{monthName}</h4>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-2 hover:bg-white/20 rounded-lg">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-auto max-h-[60vh]">
              <div className="grid grid-cols-7 gap-1">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="text-center text-sm font-medium text-gray-500 py-2">{day}</div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`e-${i}`} className="p-2"></div>
                ))}
                {Array.from({ length: days }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isWeekendDay = [0, 6].includes(new Date(dateStr).getDay());
                  const isTodayDate = dateStr === new Date().toISOString().split('T')[0];
                  
                  return (
                    <button key={day} onClick={() => { setSelectedDate(dateStr); setShowMonthView(false); }}
                      className={`p-3 rounded-xl text-center transition-all hover:bg-gray-100 ${
                        isTodayDate ? 'bg-green-100 text-green-700 font-bold' : 
                        isWeekendDay ? 'bg-gray-50 text-gray-400' : ''
                      }`}>
                      <span className="text-lg">{day}</span>
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h5 className="font-medium text-gray-700 mb-3">Quick Guide</h5>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(ATTENDANCE_STATUS).map(([key, val]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${val.color}`}></div>
                      <span className="text-sm text-gray-600">{val.label} ({val.short})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Warning */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 z-40">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">You have unsaved changes</span>
          <button onClick={handleSaveAttendance} className="px-4 py-1 bg-white text-amber-600 rounded-full font-medium text-sm">
            Save Now
          </button>
        </div>
      )}
    </div>
  );
};

export default TeacherAttendance;

