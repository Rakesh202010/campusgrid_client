import { useState, useEffect } from 'react';
import {
  Clock, Calendar, BookOpen, Users, RefreshCw, ChevronLeft, ChevronRight,
  AlertCircle, Coffee, MapPin, GraduationCap
} from 'lucide-react';
import { timetable, academicSessions, teacherLeaves } from '../../services/api';
import { toast } from '../../utils/toast';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SUBJECT_COLORS = [
  { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-300', accent: 'bg-blue-500' },
  { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-300', accent: 'bg-purple-500' },
  { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-300', accent: 'bg-emerald-500' },
  { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-300', accent: 'bg-amber-500' },
  { bg: 'bg-rose-500/20', border: 'border-rose-500/50', text: 'text-rose-300', accent: 'bg-rose-500' },
  { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-300', accent: 'bg-cyan-500' },
  { bg: 'bg-indigo-500/20', border: 'border-indigo-500/50', text: 'text-indigo-300', accent: 'bg-indigo-500' },
  { bg: 'bg-teal-500/20', border: 'border-teal-500/50', text: 'text-teal-300', accent: 'bg-teal-500' }
];

const TeacherTimetablePage = () => {
  const [loading, setLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState(null);
  const [timetableData, setTimetableData] = useState({});
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [viewMode, setViewMode] = useState('week'); // week, day
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isOnLeave, setIsOnLeave] = useState(false);
  const [leaveInfo, setLeaveInfo] = useState(null);
  const [subjectColorMap, setSubjectColorMap] = useState({});

  useEffect(() => {
    const userInfo = localStorage.getItem('schoolAdmin_info');
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        setTeacherInfo(parsed.user);
      } catch (e) {
        console.error('Error parsing user info:', e);
      }
    }
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (teacherInfo?.id && currentSession?.id) {
      fetchTimetable();
      checkLeaveStatus();
    }
  }, [teacherInfo, currentSession, selectedDate]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const sessionRes = await academicSessions.getCurrent();
      if (sessionRes?.success) {
        setCurrentSession(sessionRes.data);
      }
    } catch (e) {
      console.error('Error fetching session:', e);
      toast.error('Failed to load session data');
    } finally {
      setLoading(false);
    }
  };

  const [daySchedules, setDaySchedules] = useState({});

  const fetchTimetable = async () => {
    if (!teacherInfo?.id || !currentSession?.id) return;
    
    try {
      const res = await timetable.getTeacher(teacherInfo.id, { 
        academic_session_id: currentSession.id 
      });
      
      if (res?.success) {
        setTimetableData(res.data || {});
        setDaySchedules(res.daySchedules || {});
        
        // Build color map for subjects
        const subjects = new Set();
        Object.values(res.data || {}).forEach(entry => {
          if (entry.subjectName) subjects.add(entry.subjectName);
        });
        
        const colorMap = {};
        Array.from(subjects).forEach((subj, idx) => {
          colorMap[subj] = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
        });
        setSubjectColorMap(colorMap);
      }
    } catch (e) {
      console.error('Error fetching timetable:', e);
    }
  };

  const checkLeaveStatus = async () => {
    try {
      const res = await teacherLeaves.getOnLeave(selectedDate);
      if (res?.success && res.data) {
        const myLeave = res.data.find(l => l.teacherId === teacherInfo?.id);
        setIsOnLeave(!!myLeave);
        setLeaveInfo(myLeave || null);
      }
    } catch (e) {
      console.error('Error checking leave status:', e);
    }
  };

  const getDayOfWeek = (dateStr) => {
    const date = new Date(dateStr);
    return DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1];
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

  const navigateDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const getTodaySchedule = () => {
    const day = getDayOfWeek(selectedDate);
    // Use daySchedules if available (includes breaks), otherwise fallback to timetableData
    if (daySchedules[day]) {
      return daySchedules[day];
    }
    // Fallback: filter from timetableData map
    const entries = [];
    Object.values(timetableData).forEach(entry => {
      if (entry.dayOfWeek === day) {
        entries.push(entry);
      }
    });
    return entries.sort((a, b) => a.periodNumber - b.periodNumber);
  };

  const getSubjectColor = (subjectName) => {
    return subjectColorMap[subjectName] || SUBJECT_COLORS[0];
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Clock className="w-8 h-8" />
              My Timetable
            </h2>
            <p className="text-emerald-100 mt-1">
              {currentSession?.name || 'Academic Session'} • {teacherInfo?.fullName || 'Teacher'}
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-white/20 rounded-xl p-1">
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'day' ? 'bg-white text-emerald-600' : 'text-white hover:bg-white/10'
              }`}
            >
              Day View
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'week' ? 'bg-white text-emerald-600' : 'text-white hover:bg-white/10'
              }`}
            >
              Week View
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/20">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-white/70" />
            <span className="text-lg font-semibold">{getTotalPeriods()}</span>
            <span className="text-white/70 text-sm">Classes/Week</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-white/70" />
            <span className="text-lg font-semibold">{getUniqueClasses()}</span>
            <span className="text-white/70 text-sm">Sections</span>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-white/70" />
            <span className="text-lg font-semibold">{Object.keys(subjectColorMap).length}</span>
            <span className="text-white/70 text-sm">Subjects</span>
          </div>
        </div>
      </div>

      {/* Leave Alert */}
      {isOnLeave && leaveInfo && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-300">You are on leave today</p>
            <p className="text-sm text-red-400">
              {leaveInfo.leaveTypeName || leaveInfo.leaveType} • {leaveInfo.reason || 'No reason specified'}
            </p>
          </div>
        </div>
      )}

      {viewMode === 'day' ? (
        <>
          {/* Date Navigation for Day View */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => navigateDate(-1)} 
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all"
              >
                <ChevronLeft className="w-5 h-5 text-slate-300" />
              </button>
              
              <div className="text-center">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-700 border border-slate-600 rounded-xl px-4 py-2 text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-slate-400 text-sm mt-1">{formatDate(selectedDate)}</p>
              </div>
              
              <button 
                onClick={() => navigateDate(1)} 
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl transition-all"
              >
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>
            </div>
            
            <div className="flex justify-center mt-3">
              <button 
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all"
              >
                Today
              </button>
            </div>
          </div>

          {/* Day Schedule */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
            <div className="bg-slate-700/50 px-6 py-4 border-b border-slate-600">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                {getDayOfWeek(selectedDate)}'s Schedule
              </h3>
            </div>

            {getTodaySchedule().length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <Coffee className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">No classes scheduled</p>
                <p className="text-sm mt-1">You have a free day on {getDayOfWeek(selectedDate)}</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {getTodaySchedule().map((entry, idx) => {
                  // Handle break periods
                  if (entry.isBreak) {
                    return (
                      <div 
                        key={idx} 
                        className={`p-4 ${
                          entry.periodType === 'lunch' 
                            ? 'bg-orange-500/10' 
                            : 'bg-emerald-500/10'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl ${
                            entry.periodType === 'lunch' 
                              ? 'bg-orange-500/20 border-orange-500/30' 
                              : 'bg-emerald-500/20 border-emerald-500/30'
                          } border flex items-center justify-center text-2xl`}>
                            {entry.periodType === 'lunch' ? '🍱' : '☕'}
                          </div>
                          
                          <div className="text-slate-400 w-32">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium text-white">
                                {entry.startTime?.slice(0,5) || '--:--'}
                              </span>
                            </div>
                            <span className="text-sm">
                              to {entry.endTime?.slice(0,5) || '--:--'}
                            </span>
                          </div>
                          
                          <div className="flex-1">
                            <p className={`font-semibold ${
                              entry.periodType === 'lunch' ? 'text-orange-400' : 'text-emerald-400'
                            }`}>
                              {entry.periodName}
                            </p>
                            <span className="text-slate-400 text-sm">{entry.durationMinutes} minutes</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  // Handle free period
                  if (entry.isFree) {
                    return (
                      <div 
                        key={idx} 
                        className="p-4 bg-slate-700/20"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-700/50 border border-slate-600 border-dashed flex items-center justify-center font-bold text-slate-400">
                            P{entry.periodNumber}
                          </div>
                          
                          <div className="text-slate-400 w-32">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium text-slate-300">
                                {entry.startTime?.slice(0,5) || '--:--'}
                              </span>
                            </div>
                            <span className="text-sm">
                              to {entry.endTime?.slice(0,5) || '--:--'}
                            </span>
                          </div>
                          
                          <div className="flex-1">
                            <p className="font-medium text-slate-400 italic">Free Period</p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  
                  // Handle regular class
                  const colors = getSubjectColor(entry.subjectName);
                  return (
                    <div 
                      key={entry.id || idx} 
                      className={`p-4 hover:bg-slate-700/30 transition-all ${isOnLeave ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-4">
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
                          <span className="text-sm">
                            to {entry.endTime?.slice(0,5) || '--:--'}
                          </span>
                        </div>
                        
                        {/* Subject & Class */}
                        <div className="flex-1">
                          <p className={`font-semibold ${colors.text}`}>
                            {entry.subjectName || 'No Subject'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-white font-medium">
                              {entry.className || 'No Class'}
                            </span>
                            {entry.room && (
                              <span className="text-slate-400 text-sm flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {entry.room}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Subject Color Indicator */}
                        <div className={`w-2 h-12 rounded-full ${colors.accent}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Week View */
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
          <div className="bg-slate-700/50 px-6 py-4 border-b border-slate-600">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Weekly Timetable
            </h3>
          </div>

          <div className="overflow-x-auto">
            <div className="grid grid-cols-6 min-w-[900px]">
              {/* Day Headers */}
              {DAYS.map(day => (
                <div 
                  key={day} 
                  className={`p-4 text-center font-semibold border-b border-r border-slate-700 last:border-r-0 ${
                    day === getDayOfWeek(new Date().toISOString().split('T')[0])
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-slate-700/50 text-slate-300'
                  }`}
                >
                  {day}
                </div>
              ))}

              {/* Day Contents */}
              {DAYS.map(day => {
                const schedule = daySchedules[day] || [];
                return (
                <div 
                  key={day} 
                  className={`border-r border-slate-700 last:border-r-0 min-h-[400px] ${
                    day === getDayOfWeek(new Date().toISOString().split('T')[0])
                      ? 'bg-emerald-500/5'
                      : ''
                  }`}
                >
                  {schedule.map((entry, idx) => {
                    // Break Period
                    if (entry.isBreak) {
                      return (
                        <div 
                          key={idx}
                          className={`p-2 m-2 rounded-xl text-center ${
                            entry.periodType === 'lunch' 
                              ? 'bg-orange-500/10 border border-orange-500/30' 
                              : 'bg-emerald-500/10 border border-emerald-500/30'
                          }`}
                        >
                          <span className="text-lg">{entry.periodType === 'lunch' ? '🍱' : '☕'}</span>
                          <p className={`text-xs font-medium ${
                            entry.periodType === 'lunch' ? 'text-orange-400' : 'text-emerald-400'
                          }`}>
                            {entry.periodName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {entry.startTime?.slice(0,5)} - {entry.endTime?.slice(0,5)}
                          </p>
                        </div>
                      );
                    }
                    
                    // Free Period
                    if (entry.isFree) {
                      return (
                        <div 
                          key={idx}
                          className="p-2 m-2 rounded-xl bg-slate-700/20 border border-slate-600/30 border-dashed text-center"
                        >
                          <span className="text-xs text-slate-500">P{entry.periodNumber}</span>
                          <p className="text-xs text-slate-500 italic">Free</p>
                          <p className="text-xs text-slate-600">{entry.startTime?.slice(0,5)}</p>
                        </div>
                      );
                    }
                    
                    // Regular Class
                    const colors = getSubjectColor(entry.subjectName);
                    return (
                      <div 
                        key={entry.id || idx}
                        className={`p-3 m-2 rounded-xl ${colors.bg} ${colors.border} border transition-all hover:scale-[1.02]`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold ${colors.text}`}>P{entry.periodNumber}</span>
                          <span className="text-xs text-slate-400">
                            {entry.startTime?.slice(0,5)} - {entry.endTime?.slice(0,5)}
                          </span>
                        </div>
                        <p className={`font-semibold text-sm ${colors.text}`}>
                          {entry.subjectName || 'No Subject'}
                        </p>
                        <p className="text-xs text-slate-300 mt-1">
                          {entry.className || 'No Class'}
                        </p>
                        {entry.room && (
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {entry.room}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  
                  {schedule.length === 0 && (
                    <div className="p-4 text-center text-slate-500">
                      <Coffee className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">Free Day</p>
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Subject Legend */}
      {Object.keys(subjectColorMap).length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
          <h4 className="font-semibold text-white mb-3">Subjects</h4>
          <div className="flex flex-wrap gap-3">
            {Object.entries(subjectColorMap).map(([subject, colors]) => (
              <div 
                key={subject}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${colors.bg} ${colors.border} border`}
              >
                <div className={`w-3 h-3 rounded-full ${colors.accent}`} />
                <span className={`text-sm font-medium ${colors.text}`}>{subject}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherTimetablePage;

