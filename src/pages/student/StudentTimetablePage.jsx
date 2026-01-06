import { useState, useEffect } from 'react';
import {
  Calendar, Clock, ChevronLeft, ChevronRight, BookOpen, User,
  MapPin, CalendarDays, CalendarRange, LayoutGrid
} from 'lucide-react';
import { timetable, academicSessions } from '../../services/api';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const SUBJECT_COLORS = {
  'Mathematics': 'bg-blue-500',
  'Math': 'bg-blue-500',
  'English': 'bg-green-500',
  'Science': 'bg-purple-500',
  'Physics': 'bg-purple-500',
  'Chemistry': 'bg-pink-500',
  'Biology': 'bg-emerald-500',
  'Hindi': 'bg-orange-500',
  'Social Studies': 'bg-yellow-500',
  'History': 'bg-yellow-500',
  'Geography': 'bg-teal-500',
  'Computer': 'bg-cyan-500',
  'Computer Science': 'bg-cyan-500',
  'Physical Education': 'bg-red-500',
  'PE': 'bg-red-500',
  'Art': 'bg-rose-500',
  'Music': 'bg-violet-500',
  'Sanskrit': 'bg-amber-500',
  'default': 'bg-slate-500'
};

const getSubjectColor = (subjectName) => {
  if (!subjectName) return SUBJECT_COLORS.default;
  const key = Object.keys(SUBJECT_COLORS).find(k => 
    subjectName.toLowerCase().includes(k.toLowerCase())
  );
  return key ? SUBJECT_COLORS[key] : SUBJECT_COLORS.default;
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

const StudentTimetablePage = () => {
  const [viewMode, setViewMode] = useState('daily'); // daily, weekly, monthly
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [timetableData, setTimetableData] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [academicSession, setAcademicSession] = useState(null);

  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  useEffect(() => {
    const userInfo = localStorage.getItem('schoolAdmin_info');
    if (userInfo) {
      const parsed = JSON.parse(userInfo);
      setUser(parsed.user);
    }
  }, []);

  useEffect(() => {
    fetchAcademicSession();
  }, []);

  useEffect(() => {
    if (user?.classSectionId && academicSession?.id) {
      fetchTimetable();
    } else if (academicSession !== null && user !== null) {
      // If we have checked both but one is missing, stop loading
      console.log('Cannot fetch timetable - missing:', { 
        classSectionId: user?.classSectionId, 
        academicSessionId: academicSession?.id 
      });
      setLoading(false);
    }
  }, [user, academicSession]);

  const fetchAcademicSession = async () => {
    try {
      const response = await academicSessions.getCurrent();
      if (response.success && response.data) {
        setAcademicSession(response.data);
      } else {
        // No active session found
        setAcademicSession({});
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching academic session:', error);
      setAcademicSession({});
      setLoading(false);
    }
  };

  const [daySchedules, setDaySchedules] = useState({});

  const fetchTimetable = async () => {
    if (!user?.classSectionId || !academicSession?.id) {
      console.log('Missing data:', { classSectionId: user?.classSectionId, academicSessionId: academicSession?.id });
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log('Fetching timetable for class section:', user.classSectionId);
      const response = await timetable.getClass(user.classSectionId, {
        academic_session_id: academicSession.id
      });
      console.log('Timetable response:', response);
      if (response.success) {
        setTimetableData(response.data || {});
        setDaySchedules(response.daySchedules || {});
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  const getDateString = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getDailySchedule = (dayName) => {
    // Use daySchedules if available (includes breaks), otherwise fallback to timetableData
    if (daySchedules[dayName]) {
      return daySchedules[dayName];
    }
    // Fallback: filter from timetableData
    const entries = [];
    Object.values(timetableData).forEach(entry => {
      if (entry.dayOfWeek === dayName) {
        entries.push(entry);
      }
    });
    return entries.sort((a, b) => a.periodNumber - b.periodNumber);
  };

  const getTodaysSchedule = () => {
    const dayName = getDayName(selectedDate);
    return getDailySchedule(dayName);
  };

  const navigateDay = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction);
    setSelectedDate(newDate);
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentWeekStart(newDate);
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentMonth(newDate);
  };

  // Calculate unique subjects for legend
  const uniqueSubjects = [...new Set(Object.values(timetableData).map(e => e.subjectName).filter(Boolean))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show message if class section info is missing
  if (!user?.classSectionId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center bg-slate-800 rounded-xl p-8 border border-slate-700">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Class Not Assigned</h3>
          <p className="text-slate-400">Your class section is not assigned yet. Please contact your school administrator.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-7 h-7 text-blue-400" />
            My Class Timetable
          </h1>
          <p className="text-slate-400 mt-1">
            {user?.className || 'Your Class'} - {academicSession?.name || ''}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('daily')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              viewMode === 'daily'
                ? 'bg-blue-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Daily
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              viewMode === 'weekly'
                ? 'bg-blue-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarRange className="w-4 h-4" />
            Weekly
          </button>
          <button
            onClick={() => setViewMode('monthly')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              viewMode === 'monthly'
                ? 'bg-blue-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Monthly
          </button>
        </div>
      </div>

      {/* Daily View */}
      {viewMode === 'daily' && (
        <div className="space-y-4">
          {/* Date Navigation */}
          <div className="flex items-center justify-between bg-slate-800 rounded-xl p-4">
            <button
              onClick={() => navigateDay(-1)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="text-center">
              <p className="text-lg font-semibold text-white">{getDateString(selectedDate)}</p>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Go to Today
              </button>
            </div>
            <button
              onClick={() => navigateDay(1)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Schedule */}
          {getDayName(selectedDate) === 'Sunday' ? (
            <div className="bg-slate-800 rounded-xl p-8 text-center">
              <div className="text-4xl mb-4">🌟</div>
              <h3 className="text-xl font-semibold text-white mb-2">Sunday - Holiday!</h3>
              <p className="text-slate-400">Enjoy your day off</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getTodaysSchedule().length > 0 ? (
                getTodaysSchedule().map((entry, idx) => (
                  entry.isBreak ? (
                    // Break/Lunch Period
                    <div
                      key={idx}
                      className={`rounded-xl p-3 border ${
                        entry.periodType === 'lunch' 
                          ? 'bg-orange-500/10 border-orange-500/30' 
                          : 'bg-emerald-500/10 border-emerald-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {entry.periodType === 'lunch' ? '🍱' : '☕'}
                          </span>
                          <div>
                            <h3 className={`font-semibold ${
                              entry.periodType === 'lunch' ? 'text-orange-400' : 'text-emerald-400'
                            }`}>
                              {entry.periodName}
                            </h3>
                            <p className="text-slate-400 text-sm">
                              {entry.durationMinutes} minutes
                            </p>
                          </div>
                        </div>
                        <span className="text-slate-400 text-sm flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                        </span>
                      </div>
                    </div>
                  ) : entry.isEmpty ? (
                    // Empty Period Slot
                    <div
                      key={idx}
                      className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 border-dashed"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-slate-700/50 rounded-full text-sm text-slate-400 font-medium">
                            Period {entry.periodNumber}
                          </span>
                          <span className="text-slate-500 italic">Free Period</span>
                        </div>
                        <span className="text-slate-500 text-sm flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    // Regular Class Period
                    <div
                      key={idx}
                      className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`${getSubjectColor(entry.subjectName)} w-2 h-full min-h-[60px] rounded-full`}></div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 bg-slate-700 rounded-full text-sm text-white font-medium">
                                Period {entry.periodNumber}
                              </span>
                              <span className="text-slate-400 text-sm flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                              </span>
                            </div>
                          </div>
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {entry.subjectName || 'No Subject'}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            {entry.teacherName && (
                              <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {entry.teacherName}
                              </span>
                            )}
                            {entry.room && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                Room {entry.room}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                ))
              ) : (
                <div className="bg-slate-800 rounded-xl p-8 text-center">
                  <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Classes Scheduled</h3>
                  <p className="text-slate-400">There are no classes scheduled for this day</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Weekly View */}
      {viewMode === 'weekly' && (
        <div className="space-y-4">
          {/* Week Navigation */}
          <div className="flex items-center justify-between bg-slate-800 rounded-xl p-4">
            <button
              onClick={() => navigateWeek(-1)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="text-center">
              <p className="text-lg font-semibold text-white">
                {currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {
                  new Date(currentWeekStart.getTime() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                }
              </p>
            </div>
            <button
              onClick={() => navigateWeek(1)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Week Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {DAYS_OF_WEEK.map((day, dayIndex) => {
              const dayDate = new Date(currentWeekStart);
              dayDate.setDate(dayDate.getDate() + dayIndex);
              const isToday = new Date().toDateString() === dayDate.toDateString();
              const daySchedule = getDailySchedule(day);

              return (
                <div
                  key={day}
                  className={`bg-slate-800 rounded-xl border ${
                    isToday ? 'border-blue-500' : 'border-slate-700'
                  }`}
                >
                  <div className={`p-3 border-b border-slate-700 ${isToday ? 'bg-blue-500/20' : ''}`}>
                    <p className={`font-semibold ${isToday ? 'text-blue-400' : 'text-white'}`}>{day}</p>
                    <p className="text-xs text-slate-400">
                      {dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="p-2 space-y-1 max-h-96 overflow-y-auto">
                    {daySchedule.length > 0 ? (
                      daySchedule.map((entry, idx) => (
                        entry.isBreak ? (
                          // Break Period
                          <div
                            key={idx}
                            className={`p-2 rounded-lg ${
                              entry.periodType === 'lunch' 
                                ? 'bg-orange-500/10 border-l-4 border-orange-500' 
                                : 'bg-emerald-500/10 border-l-4 border-emerald-500'
                            }`}
                          >
                            <p className="text-xs text-slate-400">{formatTime(entry.startTime)}</p>
                            <p className={`text-sm font-medium truncate ${
                              entry.periodType === 'lunch' ? 'text-orange-400' : 'text-emerald-400'
                            }`}>
                              {entry.periodType === 'lunch' ? '🍱' : '☕'} {entry.periodName}
                            </p>
                          </div>
                        ) : entry.isEmpty ? (
                          // Free Period
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-slate-700/30 border-l-4 border-slate-600 border-dashed"
                          >
                            <p className="text-xs text-slate-500">{formatTime(entry.startTime)} - P{entry.periodNumber}</p>
                            <p className="text-sm text-slate-500 italic truncate">Free</p>
                          </div>
                        ) : (
                          // Regular Class
                          <div
                            key={idx}
                            className={`p-2 rounded-lg ${getSubjectColor(entry.subjectName)} bg-opacity-20 border-l-4 ${getSubjectColor(entry.subjectName)}`}
                          >
                            <p className="text-xs text-slate-400">{formatTime(entry.startTime)} - P{entry.periodNumber}</p>
                            <p className="text-sm font-medium text-white truncate">
                              {entry.subjectName || 'N/A'}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              {entry.teacherName}
                            </p>
                          </div>
                        )
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 text-center py-4">No classes</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly View */}
      {viewMode === 'monthly' && (
        <div className="space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between bg-slate-800 rounded-xl p-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-400" />
            </button>
            <p className="text-lg font-semibold text-white">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Monthly Calendar List - Detailed View */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            {DAYS_OF_WEEK.map((day, dayIdx) => {
              const daySchedule = getDailySchedule(day);
              const classCount = daySchedule.filter(e => !e.isBreak && !e.isEmpty).length;
              const firstTime = daySchedule[0]?.startTime;
              const lastEntry = daySchedule.filter(e => !e.isBreak)[daySchedule.filter(e => !e.isBreak).length - 1];
              
              return (
                <div key={day} className={`${dayIdx > 0 ? 'border-t border-slate-700' : ''}`}>
                  {/* Day Header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-700/30">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white">{day}</span>
                      <span className="text-xs text-slate-400">
                        {classCount} classes
                      </span>
                    </div>
                    {firstTime && lastEntry?.endTime && (
                      <span className="text-xs text-slate-400">
                        {formatTime(firstTime)} - {formatTime(lastEntry.endTime)}
                      </span>
                    )}
                  </div>
                  
                  {/* Day Schedule */}
                  <div className="px-4 py-2 space-y-1">
                    {daySchedule.length > 0 ? (
                      daySchedule.map((entry, idx) => (
                        entry.isBreak ? (
                          <div key={idx} className="flex items-center gap-2 py-1 px-2 text-xs">
                            <span className={`${entry.periodType === 'lunch' ? 'text-orange-400' : 'text-emerald-400'}`}>
                              {entry.periodType === 'lunch' ? '🍱' : '☕'}
                            </span>
                            <span className="text-slate-500">
                              {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                            </span>
                            <span className={`${entry.periodType === 'lunch' ? 'text-orange-400' : 'text-emerald-400'}`}>
                              {entry.periodName}
                            </span>
                          </div>
                        ) : entry.isEmpty ? (
                          <div key={idx} className="flex items-center gap-2 py-1 px-2 text-xs text-slate-500">
                            <span className="w-16">{formatTime(entry.startTime)}</span>
                            <span className="px-2 py-0.5 bg-slate-700 rounded">P{entry.periodNumber}</span>
                            <span className="italic">Free Period</span>
                          </div>
                        ) : (
                          <div key={idx} className="flex items-center gap-2 py-1 px-2">
                            <span className="text-xs text-slate-400 w-16">{formatTime(entry.startTime)}</span>
                            <span className="text-xs px-2 py-0.5 bg-slate-700 rounded text-white">P{entry.periodNumber}</span>
                            <span className={`text-sm font-medium ${getSubjectColor(entry.subjectName)} px-2 py-0.5 rounded`}>
                              {entry.subjectName}
                            </span>
                            <span className="text-xs text-slate-400">- {entry.teacherName}</span>
                          </div>
                        )
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 py-2">No classes scheduled</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Subject Legend */}
      {uniqueSubjects.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-3">Subject Legend</h3>
          <div className="flex flex-wrap gap-2">
            {uniqueSubjects.map((subject, idx) => (
              <span
                key={idx}
                className={`px-3 py-1 rounded-full text-xs text-white ${getSubjectColor(subject)}`}
              >
                {subject}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTimetablePage;

