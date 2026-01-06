import { useState, useEffect } from 'react';
import {
  Calendar, Clock, User, Users, Search, Filter, RefreshCw,
  ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, X,
  BookOpen, GraduationCap, ArrowRight, UserPlus, XCircle, Eye, AlertCircle
} from 'lucide-react';
import { teachers, classConfig, academicSessions, timetable, teacherLeaves } from '../services/api';
import { toast } from '../utils/toast';

const DailyTimetableView = () => {
  // Data states
  const [currentSession, setCurrentSession] = useState(null);
  const [teachersList, setTeachersList] = useState([]);
  const [classSections, setClassSections] = useState([]);
  const [dailyTimetable, setDailyTimetable] = useState(null);
  const [substitutions, setSubstitutions] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [teachersOnLeave, setTeachersOnLeave] = useState([]); // Teachers on leave for selected date
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('all'); // all, teacher, class
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [showSubstitutionModal, setShowSubstitutionModal] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (currentSession?.id) {
      fetchClassSections();
      fetchDailyData();
    }
  }, [selectedDate, currentSession, selectedTeacher, selectedClass, viewMode]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [sessionRes, teachersRes] = await Promise.all([
        academicSessions.getCurrent(),
        teachers.getAll()
      ]);

      if (sessionRes?.success) {
        setCurrentSession(sessionRes.data);
      }
      if (teachersRes?.success) {
        // Filter only active teachers
        const activeTeachers = (teachersRes.data || []).filter(t => t.status === 'active');
        setTeachersList(activeTeachers);
      }
    } catch (e) {
      console.error('Error fetching initial data:', e);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassSections = async () => {
    if (!currentSession?.id) return;
    try {
      // Get class sections filtered by academic session
      const classRes = await classConfig.getClassSections({ academic_session_id: currentSession.id });
      if (classRes?.success) {
        // Remove duplicates based on id
        const uniqueClasses = [];
        const seenIds = new Set();
        (classRes.data || []).forEach(c => {
          if (!seenIds.has(c.id)) {
            seenIds.add(c.id);
            uniqueClasses.push(c);
          }
        });
        setClassSections(uniqueClasses);
      }
    } catch (e) {
      console.error('Error fetching class sections:', e);
    }
  };

  const fetchDailyData = async () => {
    if (!currentSession?.id) return;
    try {
      const params = {
        date: selectedDate,
        academic_session_id: currentSession.id
      };

      if (viewMode === 'teacher' && selectedTeacher) {
        params.teacher_id = selectedTeacher;
      }
      if (viewMode === 'class' && selectedClass) {
        params.class_section_id = selectedClass;
      }

      const [timetableRes, subsRes, leaveRes] = await Promise.all([
        timetable.getDaily(params),
        timetable.getSubstitutions(selectedDate),
        teacherLeaves.getOnLeave(selectedDate) // Fetch teachers on leave
      ]);

      if (timetableRes?.success) {
        setDailyTimetable(timetableRes.data);
      }
      if (subsRes?.success) {
        setSubstitutions(subsRes.data || []);
      }
      if (leaveRes?.success) {
        setTeachersOnLeave(leaveRes.data || []);
      }
    } catch (e) {
      console.error('Error fetching daily data:', e);
    }
  };

  // Helper to check if a teacher is on leave
  const isTeacherOnLeave = (teacherId) => {
    return teachersOnLeave.some(leave => leave.teacherId === teacherId);
  };

  // Get leave info for a teacher
  const getTeacherLeaveInfo = (teacherId) => {
    return teachersOnLeave.find(leave => leave.teacherId === teacherId);
  };

  const handleOpenSubstitution = async (entry) => {
    try {
      const res = await timetable.getAvailableTeachers({
        date: selectedDate,
        period_number: entry.periodNumber,
        exclude_teacher_id: entry.originalTeacherId,
        academic_session_id: currentSession.id
      });

      if (res?.success) {
        setAvailableTeachers(res.data || []);
        setShowSubstitutionModal(entry);
      }
    } catch (e) {
      toast.error('Failed to find available teachers');
    }
  };

  const handleAssignSubstitute = async (substituteTeacherId) => {
    if (!showSubstitutionModal) return;

    try {
      const res = await timetable.createSubstitution({
        academicSessionId: currentSession.id,
        date: selectedDate,
        dayOfWeek: dailyTimetable.dayOfWeek,
        periodNumber: showSubstitutionModal.periodNumber,
        originalTeacherId: showSubstitutionModal.originalTeacherId,
        substituteTeacherId,
        classSectionId: showSubstitutionModal.classSectionId,
        subjectId: showSubstitutionModal.subjectId,
        reason: 'Teacher unavailable'
      });

      if (res?.success) {
        toast.success(res.message || 'Substitute assigned successfully');
        setShowSubstitutionModal(null);
        fetchDailyData();
      } else {
        toast.error(res?.message || 'Failed to assign substitute');
      }
    } catch (e) {
      console.error('Substitution error:', e);
      toast.error('Something went wrong while assigning substitute');
    }
  };

  const handleRemoveSubstitution = async (substitutionId) => {
    try {
      const res = await timetable.removeSubstitution(substitutionId);
      if (res?.success) {
        toast.success('Substitution removed');
        fetchDailyData();
      }
    } catch (e) {
      toast.error('Failed to remove substitution');
    }
  };

  const navigateDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Navigation */}
      <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Calendar className="w-8 h-8" />
              Daily Timetable
            </h2>
            <p className="text-white/80 mt-1">{formatDate(selectedDate)}</p>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <button onClick={() => navigateDate(-1)} 
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-white font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            
            <button onClick={() => navigateDate(1)} 
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>

            <button onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className="px-4 py-2 bg-white text-blue-600 rounded-xl font-medium hover:bg-white/90 ml-2">
              Today
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-white/70" />
            <span className="text-lg font-semibold">{dailyTimetable?.entries?.length || 0}</span>
            <span className="text-white/70 text-sm">Classes</span>
          </div>
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-300" />
            <span className="text-lg font-semibold">{substitutions.length}</span>
            <span className="text-white/70 text-sm">Substitutions</span>
          </div>
          {teachersOnLeave.length > 0 && (
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-300" />
              <span className="text-lg font-semibold">{teachersOnLeave.length}</span>
              <span className="text-white/70 text-sm">On Leave</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-white/70" />
            <span className="text-lg font-semibold">{teachersList.length}</span>
            <span className="text-white/70 text-sm">Teachers</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-5">
        <div className="flex flex-wrap items-center gap-4">
          {/* View Mode Tabs */}
          <div className="flex bg-gray-100 rounded-xl p-1">
            {[
              { id: 'all', label: 'All Classes', icon: Eye },
              { id: 'teacher', label: 'By Teacher', icon: User },
              { id: 'class', label: 'By Class', icon: GraduationCap },
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => { setViewMode(mode.id); setSelectedTeacher(''); setSelectedClass(''); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  viewMode === mode.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <mode.icon className="w-4 h-4" />
                {mode.label}
              </button>
            ))}
          </div>

          {/* Teacher Filter */}
          {viewMode === 'teacher' && (
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 min-w-[250px]"
            >
              <option value="">-- Select Teacher --</option>
              {teachersList.map(t => (
                <option key={t.id} value={t.id}>
                  {t.first_name} {t.last_name} {t.employee_id ? `(${t.employee_id})` : ''}
                </option>
              ))}
            </select>
          )}

          {/* Class Filter */}
          {viewMode === 'class' && (
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 min-w-[250px]"
            >
              <option value="">-- Select Class --</option>
              {classSections.map(c => (
                <option key={c.id} value={c.id}>
                  {c.gradeName || c.grade_name} - {c.sectionName || c.section_name}
                </option>
              ))}
            </select>
          )}

          {/* Refresh Button */}
          <button onClick={fetchDailyData}
            className="ml-auto flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Teachers On Leave Summary */}
      {teachersOnLeave.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <h3 className="font-semibold text-red-800 flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5" />
            Teachers On Leave Today ({teachersOnLeave.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {teachersOnLeave.map(leave => (
              <div key={leave.leaveId} className="bg-white rounded-xl p-3 border border-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center text-white font-bold text-sm">
                    {leave.teacherName?.split(' ').map(n => n?.[0]).join('').slice(0,2) || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{leave.teacherName}</p>
                    <p className="text-xs text-gray-500">{leave.designation || leave.department || 'Teacher'}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    leave.leaveType === 'SL' || leave.leaveType === 'sick' ? 'bg-red-100 text-red-700' :
                    leave.leaveType === 'CL' || leave.leaveType === 'casual' ? 'bg-blue-100 text-blue-700' :
                    leave.leaveType === 'EL' || leave.leaveType === 'earned' ? 'bg-green-100 text-green-700' :
                    leave.leaveType === 'ML' ? 'bg-pink-100 text-pink-700' :
                    leave.leaveType === 'PL' ? 'bg-purple-100 text-purple-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {leave.leaveTypeName || leave.leaveType || 'Leave'}
                  </span>
                  {leave.reason && (
                    <span className="text-xs text-gray-400 truncate max-w-[150px]" title={leave.reason}>
                      {leave.reason}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Substitutions Summary */}
      {substitutions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5" />
            Today's Substitutions ({substitutions.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {substitutions.map(sub => (
              <div key={sub.id} className="bg-white rounded-xl p-3 border border-amber-200 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">Period {sub.periodNumber}</p>
                  <p className="text-sm text-gray-500">
                    {sub.originalTeacher} <ArrowRight className="w-3 h-3 inline mx-1" /> 
                    <span className="text-amber-700 font-medium">{sub.substituteTeacher}</span>
                  </p>
                  <p className="text-xs text-gray-400">{sub.className}</p>
                </div>
                <button onClick={() => handleRemoveSubstitution(sub.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timetable Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            {dailyTimetable?.dayOfWeek || 'Schedule'} - {formatDate(selectedDate)}
          </h3>
        </div>

        {!dailyTimetable?.entries?.length ? (
          <div className="p-12 text-center text-gray-400">
            <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No classes scheduled</p>
            <p className="text-sm mt-1">
              {viewMode === 'all' 
                ? 'No timetable entries for this day'
                : viewMode === 'teacher' && !selectedTeacher 
                  ? 'Please select a teacher to view their schedule'
                  : viewMode === 'class' && !selectedClass
                    ? 'Please select a class to view its schedule'
                    : 'No classes found for the selected filter'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">Period</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">Time</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">Subject</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">Class</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b">Teacher</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 border-b">Status</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 border-b">Action</th>
                </tr>
              </thead>
              <tbody>
                {dailyTimetable.entries.map((entry, idx) => {
                  const onLeave = !entry.isSubstituted && isTeacherOnLeave(entry.originalTeacherId);
                  return (
                  <tr key={entry.id || idx} className={`hover:bg-gray-50 ${
                    entry.isSubstituted ? 'bg-amber-50' : onLeave ? 'bg-red-50' : ''
                  }`}>
                    {/* Period */}
                    <td className="px-4 py-4 border-b">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl font-bold ${
                        entry.isSubstituted ? 'bg-amber-200 text-amber-800' : 
                        onLeave ? 'bg-red-200 text-red-800' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        P{entry.periodNumber}
                      </div>
                    </td>
                    
                    {/* Time */}
                    <td className="px-4 py-4 border-b">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">
                          {entry.startTime?.slice(0,5) || '--:--'} - {entry.endTime?.slice(0,5) || '--:--'}
                        </span>
                      </div>
                    </td>
                    
                    {/* Subject */}
                    <td className="px-4 py-4 border-b">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-indigo-500" />
                        <span className="font-semibold text-gray-800">{entry.subjectName || 'No Subject'}</span>
                      </div>
                    </td>
                    
                    {/* Class */}
                    <td className="px-4 py-4 border-b">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700">{entry.fullClassName || 'No Class'}</span>
                      </div>
                    </td>
                    
                    {/* Teacher */}
                    <td className="px-4 py-4 border-b">
                      {entry.isSubstituted ? (
                        <div>
                          <p className="text-xs text-gray-400 line-through">{entry.originalTeacherName}</p>
                          <p className="font-medium text-amber-700 flex items-center gap-1">
                            <UserPlus className="w-4 h-4" />
                            {entry.substituteTeacherName}
                          </p>
                        </div>
                      ) : isTeacherOnLeave(entry.originalTeacherId) ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-red-500" />
                            <span className="font-medium text-gray-800">{entry.effectiveTeacherName || 'No Teacher'}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                              <AlertCircle className="w-3 h-3" />
                              On Leave
                            </span>
                            {getTeacherLeaveInfo(entry.originalTeacherId)?.leaveType && (
                              <span className="text-xs text-gray-500">
                                ({getTeacherLeaveInfo(entry.originalTeacherId).leaveType})
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-gray-800">{entry.effectiveTeacherName || 'No Teacher'}</span>
                        </div>
                      )}
                    </td>
                    
                    {/* Status */}
                    <td className="px-4 py-4 border-b text-center">
                      {entry.isSubstituted ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                          <UserPlus className="w-3 h-3" />
                          Substituted
                        </span>
                      ) : onLeave ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          <AlertCircle className="w-3 h-3" />
                          On Leave
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Regular
                        </span>
                      )}
                    </td>
                    
                    {/* Action */}
                    <td className="px-4 py-4 border-b text-center">
                      {entry.isSubstituted ? (
                        <button onClick={() => handleRemoveSubstitution(entry.substitutionId)}
                          className="px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium border border-red-200">
                          Remove
                        </button>
                      ) : (
                        <button onClick={() => handleOpenSubstitution(entry)}
                          className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium flex items-center gap-1 mx-auto">
                          <UserPlus className="w-3 h-3" />
                          Substitute
                        </button>
                      )}
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Substitution Modal */}
      {showSubstitutionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserPlus className="w-8 h-8" />
                  <div>
                    <h3 className="text-xl font-bold">Assign Substitute</h3>
                    <p className="text-white/70 text-sm">
                      Period {showSubstitutionModal.periodNumber} • {showSubstitutionModal.subjectName}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowSubstitutionModal(null)} className="p-2 hover:bg-white/20 rounded-lg">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Original Teacher Info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-500 mb-1">Original Teacher</p>
                <p className="font-medium text-gray-800">{showSubstitutionModal.originalTeacherName || 'Not Assigned'}</p>
                <p className="text-sm text-gray-500 mt-2">Class: {showSubstitutionModal.fullClassName}</p>
              </div>

              {/* Available Teachers */}
              <h4 className="font-semibold text-gray-800 mb-3">Available Teachers ({availableTeachers.length})</h4>
              
              {availableTeachers.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No available teachers for this period</p>
                  <p className="text-sm mt-1">All teachers are busy or on leave</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableTeachers.map(teacher => (
                    <div key={teacher.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                          {teacher.name?.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{teacher.name}</p>
                          <p className="text-xs text-gray-500">{teacher.department || 'No department'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                              {teacher.periodsOnDay || 0} classes
                            </span>
                            {(teacher.substitutionsToday || 0) > 0 && (
                              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                                +{teacher.substitutionsToday} subs
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <button onClick={() => handleAssignSubstitute(teacher.id)}
                        className={`px-4 py-2 rounded-xl font-medium text-sm ${
                          (teacher.totalLoadToday || 0) >= 6
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        disabled={(teacher.totalLoadToday || 0) >= 6}
                      >
                        {(teacher.totalLoadToday || 0) >= 6 ? 'Full' : 'Assign'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end">
              <button onClick={() => setShowSubstitutionModal(null)}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl font-medium">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyTimetableView;
