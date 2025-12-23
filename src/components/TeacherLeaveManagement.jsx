import { useState, useEffect } from 'react';
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle, User, Plus, X,
  ChevronLeft, ChevronRight, CalendarDays, Briefcase, Heart, Baby,
  Plane, GraduationCap, FileText, Filter, Search, Check, Ban
} from 'lucide-react';
import { teachers, academicSessions } from '../services/api';
import { toast } from '../utils/toast';

// Leave type icons and colors
const LEAVE_ICONS = {
  CL: { icon: Calendar, color: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-700' },
  SL: { icon: Heart, color: 'bg-red-500', light: 'bg-red-50', text: 'text-red-700' },
  EL: { icon: Briefcase, color: 'bg-green-500', light: 'bg-green-50', text: 'text-green-700' },
  ML: { icon: Baby, color: 'bg-pink-500', light: 'bg-pink-50', text: 'text-pink-700' },
  PL: { icon: GraduationCap, color: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-700' },
  LWP: { icon: Plane, color: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-700' },
  default: { icon: FileText, color: 'bg-gray-500', light: 'bg-gray-50', text: 'text-gray-700' }
};

const STATUS_STYLES = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock, label: 'Pending Approval' },
  approved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: 'Approved' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: 'Rejected' }
};

const TeacherLeaveManagement = () => {
  const [teachersList, setTeachersList] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [allApplications, setAllApplications] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [activeView, setActiveView] = useState('pending'); // pending, all, calendar
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  
  // Form
  const [leaveForm, setLeaveForm] = useState({
    teacherId: '',
    leaveTypeId: '',
    fromDate: '',
    toDate: '',
    reason: ''
  });

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teachersRes, sessionRes, typesRes, appsRes] = await Promise.all([
        teachers.getAll(),
        academicSessions.getCurrent(),
        teachers.getLeaveTypes(),
        teachers.getAllLeaveApplications()
      ]);
      if (teachersRes?.success) setTeachersList(teachersRes.data || []);
      if (sessionRes?.success) setCurrentSession(sessionRes.data);
      if (typesRes?.success) setLeaveTypes(typesRes.data || []);
      if (appsRes?.success) setAllApplications(appsRes.data || []);
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyLeave = async () => {
    if (!leaveForm.teacherId || !leaveForm.leaveTypeId || !leaveForm.fromDate || !leaveForm.toDate) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      const res = await teachers.applyLeave(leaveForm.teacherId, {
        leaveTypeId: leaveForm.leaveTypeId,
        fromDate: leaveForm.fromDate,
        toDate: leaveForm.toDate,
        reason: leaveForm.reason
      });
      if (res?.success) {
        toast.success('Leave application submitted successfully!');
        setShowApplyModal(false);
        setLeaveForm({ teacherId: '', leaveTypeId: '', fromDate: '', toDate: '', reason: '' });
        fetchData();
      } else {
        toast.error(res?.message || 'Failed to apply leave');
      }
    } catch (e) {
      toast.error('Something went wrong');
    }
  };

  const handleProcessLeave = async (app, action) => {
    try {
      const res = await teachers.processLeave(app.teacherId, app.id, { action });
      if (res?.success) {
        toast.success(`Leave ${action} successfully`);
        fetchData();
      }
    } catch (e) {
      toast.error('Failed to process');
    }
  };

  const getLeaveIcon = (code) => LEAVE_ICONS[code] || LEAVE_ICONS.default;

  const calculateDays = (from, to) => {
    if (!from || !to) return 0;
    const diff = new Date(to) - new Date(from);
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Filter applications
  const pendingApps = allApplications.filter(a => a.status === 'pending');
  const filteredApps = allApplications.filter(a => {
    const matchSearch = !searchTerm || a.teacherName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = !filterType || a.leaveTypeCode === filterType;
    const matchView = activeView === 'all' || a.status === activeView;
    return matchSearch && matchType && (activeView === 'all' || matchView);
  });

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const { days, firstDay } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  // Get leaves for a specific date
  const getLeavesOnDate = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    return allApplications.filter(a => {
      const from = new Date(a.fromDate).toISOString().split('T')[0];
      const to = new Date(a.toDate).toISOString().split('T')[0];
      return a.status === 'approved' && dateStr >= from && dateStr <= to;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading leave data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Calendar className="w-8 h-8" />
              Leave Management
            </h2>
            <p className="text-white/80 mt-1">Manage teacher leave applications easily</p>
          </div>
          <button onClick={() => setShowApplyModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-orange-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-105">
            <Plus className="w-5 h-5" /> Apply Leave
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-4xl font-bold">{pendingApps.length}</p>
            <p className="text-white/80 text-sm">Pending Approval</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-4xl font-bold">{allApplications.filter(a => a.status === 'approved').length}</p>
            <p className="text-white/80 text-sm">Approved</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-4xl font-bold">{allApplications.filter(a => a.status === 'rejected').length}</p>
            <p className="text-white/80 text-sm">Rejected</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-4xl font-bold">{leaveTypes.length}</p>
            <p className="text-white/80 text-sm">Leave Types</p>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl w-fit">
        {[
          { id: 'pending', label: 'Pending', count: pendingApps.length },
          { id: 'approved', label: 'Approved' },
          { id: 'rejected', label: 'Rejected' },
          { id: 'all', label: 'All Applications' },
          { id: 'calendar', label: 'Calendar View' }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveView(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              activeView === tab.id 
                ? 'bg-white text-orange-600 shadow-md' 
                : 'text-gray-600 hover:text-gray-800'
            }`}>
            {tab.label}
            {tab.count > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Calendar View */}
      {activeView === 'calendar' && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-gray-800">{monthName}</h3>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 hover:bg-gray-100 rounded-lg">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">{day}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="p-2"></div>
            ))}
            {Array.from({ length: days }).map((_, i) => {
              const day = i + 1;
              const leaves = getLeavesOnDate(day);
              const isToday = new Date().toDateString() === new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toDateString();
              return (
                <div key={day} className={`min-h-[80px] p-2 rounded-lg border ${isToday ? 'border-orange-500 bg-orange-50' : 'border-gray-100'}`}>
                  <p className={`text-sm font-medium ${isToday ? 'text-orange-600' : 'text-gray-700'}`}>{day}</p>
                  {leaves.slice(0, 2).map(l => (
                    <div key={l.id} className="mt-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs truncate">
                      {l.teacherName?.split(' ')[0]}
                    </div>
                  ))}
                  {leaves.length > 2 && (
                    <p className="text-xs text-gray-500">+{leaves.length - 2} more</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {activeView !== 'calendar' && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search teacher name..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500">
              <option value="">All Leave Types</option>
              {leaveTypes.map(lt => <option key={lt.id} value={lt.code}>{lt.name}</option>)}
            </select>
          </div>

          {/* Leave Cards */}
          {filteredApps.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <CalendarDays className="w-20 h-20 text-gray-200 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-600">No Leave Applications</h3>
              <p className="text-gray-400 mt-2">There are no leave applications to display</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApps.map(app => {
                const leaveIcon = getLeaveIcon(app.leaveTypeCode);
                const statusStyle = STATUS_STYLES[app.status] || STATUS_STYLES.pending;
                const IconComponent = leaveIcon.icon;
                const StatusIcon = statusStyle.icon;
                const days = calculateDays(app.fromDate, app.toDate);

                return (
                  <div key={app.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="flex items-stretch">
                      {/* Left Color Bar */}
                      <div className={`w-2 ${leaveIcon.color}`}></div>
                      
                      {/* Content */}
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            {/* Teacher Avatar */}
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {app.teacherName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800 text-lg">{app.teacherName}</h4>
                              <p className="text-gray-500 text-sm">{app.employeeId || 'Staff Member'}</p>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                            <StatusIcon className="w-4 h-4" />
                            <span className="font-medium text-sm">{statusStyle.label}</span>
                          </div>
                        </div>

                        {/* Leave Details */}
                        <div className="mt-4 flex items-center gap-6">
                          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${leaveIcon.light}`}>
                            <IconComponent className={`w-5 h-5 ${leaveIcon.text}`} />
                            <span className={`font-medium ${leaveIcon.text}`}>{app.leaveTypeName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(app.fromDate)} → {formatDate(app.toDate)}</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
                            <span className="text-2xl font-bold text-gray-800">{days}</span>
                            <span className="text-gray-500 text-sm">day{days > 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        {/* Reason */}
                        {app.reason && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-xl">
                            <p className="text-gray-600 text-sm">
                              <span className="font-medium text-gray-700">Reason:</span> {app.reason}
                            </p>
                          </div>
                        )}

                        {/* Actions for Pending */}
                        {app.status === 'pending' && (
                          <div className="mt-4 flex items-center gap-3">
                            <button onClick={() => handleProcessLeave(app, 'approved')}
                              className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition-colors shadow-lg shadow-green-500/30">
                              <Check className="w-4 h-4" /> Approve
                            </button>
                            <button onClick={() => handleProcessLeave(app, 'rejected')}
                              className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30">
                              <Ban className="w-4 h-4" /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Calendar className="w-6 h-6" /> Apply for Leave
                </h3>
                <button onClick={() => setShowApplyModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Teacher Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />Select Teacher
                </label>
                <select value={leaveForm.teacherId} onChange={(e) => setLeaveForm({ ...leaveForm, teacherId: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">Choose a teacher...</option>
                  {teachersList.map(t => (
                    <option key={t.id} value={t.id}>{t.fullName} - {t.department || 'Staff'}</option>
                  ))}
                </select>
              </div>

              {/* Leave Type - Visual Cards */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />Leave Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {leaveTypes.map(lt => {
                    const icon = getLeaveIcon(lt.code);
                    const IconComp = icon.icon;
                    const isSelected = leaveForm.leaveTypeId === lt.id;
                    return (
                      <button key={lt.id} type="button" onClick={() => setLeaveForm({ ...leaveForm, leaveTypeId: lt.id })}
                        className={`p-3 rounded-xl border-2 transition-all text-center ${
                          isSelected 
                            ? `${icon.light} border-current ${icon.text}` 
                            : 'border-gray-100 hover:border-gray-200'
                        }`}>
                        <IconComp className={`w-6 h-6 mx-auto mb-1 ${isSelected ? icon.text : 'text-gray-400'}`} />
                        <p className={`text-sm font-medium ${isSelected ? icon.text : 'text-gray-600'}`}>{lt.code}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                  <input type="date" value={leaveForm.fromDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, fromDate: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                  <input type="date" value={leaveForm.toDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, toDate: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" />
                </div>
              </div>

              {/* Days Preview */}
              {leaveForm.fromDate && leaveForm.toDate && (
                <div className="p-4 bg-orange-50 rounded-xl text-center">
                  <p className="text-3xl font-bold text-orange-600">{calculateDays(leaveForm.fromDate, leaveForm.toDate)}</p>
                  <p className="text-orange-700 text-sm">days of leave</p>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason (Optional)</label>
                <textarea value={leaveForm.reason} rows={3} placeholder="Enter reason for leave..."
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowApplyModal(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl font-medium">
                Cancel
              </button>
              <button onClick={handleApplyLeave} 
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all">
                Submit Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherLeaveManagement;

