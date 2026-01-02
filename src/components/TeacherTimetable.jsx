import { useState, useEffect } from 'react';
import {
  Clock, Calendar, BookOpen, Users, Building, Plus, X, Edit2, Trash2,
  ChevronLeft, ChevronRight, Search, Filter, Save, Copy, Eye, Grid3X3,
  List, RefreshCw, AlertCircle, Coffee, Sun, Moon, Sunrise, Sunset, Settings
} from 'lucide-react';
import { teachers, subjects as subjectsApi, classConfig, academicSessions, subjectAssignments, classTimings, timetable } from '../services/api';
import { toast } from '../utils/toast';
import { useNavigate } from 'react-router-dom';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Beautiful color palette for subjects
const SUBJECT_COLORS = [
  { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700', accent: 'bg-blue-500' },
  { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700', accent: 'bg-purple-500' },
  { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700', accent: 'bg-green-500' },
  { bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-700', accent: 'bg-amber-500' },
  { bg: 'bg-rose-100', border: 'border-rose-300', text: 'text-rose-700', accent: 'bg-rose-500' },
  { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-700', accent: 'bg-cyan-500' },
  { bg: 'bg-indigo-100', border: 'border-indigo-300', text: 'text-indigo-700', accent: 'bg-indigo-500' },
  { bg: 'bg-teal-100', border: 'border-teal-300', text: 'text-teal-700', accent: 'bg-teal-500' }
];

const getSubjectColor = (subjectId, colorMap) => {
  if (!colorMap[subjectId]) {
    colorMap[subjectId] = SUBJECT_COLORS[Object.keys(colorMap).length % SUBJECT_COLORS.length];
  }
  return colorMap[subjectId];
};

const TeacherTimetable = () => {
  const navigate = useNavigate();
  const [teachersList, setTeachersList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [classSections, setClassSections] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [timetableData, setTimetableData] = useState({});
  const [timingData, setTimingData] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [breaks, setBreaks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timingConfigured, setTimingConfigured] = useState(false);
  
  // Day-wise periods (different templates for different days)
  const [dayWisePeriods, setDayWisePeriods] = useState({}); // { Monday: [...], Friday: [...] }
  const [dayWiseBreaks, setDayWiseBreaks] = useState({});
  const [dayTemplates, setDayTemplates] = useState({}); // { Monday: 'Default', Friday: 'Friday' }
  
  // UI State
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [viewMode, setViewMode] = useState('teacher'); // teacher, class
  const [showAddModal, setShowAddModal] = useState(null); // { day, periodId, periodNumber }
  const [showTeacherList, setShowTeacherList] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectColorMap] = useState({});
  const [addFormData, setAddFormData] = useState({ subjectId: '', classSectionId: '', teacherId: '', room: '' });
  const [filteredSubjects, setFilteredSubjects] = useState([]); // Subjects filtered by teacher/class assignment
  const [filteredClassesForTeacher, setFilteredClassesForTeacher] = useState([]); // Classes where teacher teaches
  const [filteredTeachersForClass, setFilteredTeachersForClass] = useState([]); // Teachers who teach in the class

  useEffect(() => {
    fetchData();
  }, []);

  // Filter subjects when teacher or class selection changes
  useEffect(() => {
    filterSubjectsForSelection();
  }, [selectedTeacher, selectedClass, viewMode, subjectsList, currentSession]);

  useEffect(() => {
    if ((selectedTeacher || selectedClass) && currentSession?.id) {
      fetchTimetable();
    }
  }, [selectedTeacher, selectedClass, currentSession]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [teachersRes, subjectsRes, classRes, sessionRes, dayTimingRes] = await Promise.all([
        teachers.getAll(),
        subjectsApi.getAll(),
        classConfig.getClassSections(),
        academicSessions.getCurrent(),
        classTimings.getDayWiseWithPeriods() // Fetch day-wise periods
      ]);
      if (teachersRes?.success) setTeachersList(teachersRes.data || []);
      if (subjectsRes?.success) setSubjectsList(subjectsRes.data || []);
      if (classRes?.success) setClassSections(classRes.data || []);
      if (sessionRes?.success) setCurrentSession(sessionRes.data);
      
      // Handle day-wise timing data
      if (dayTimingRes?.success && dayTimingRes.data) {
        setTimingData(dayTimingRes.data);
        setTimingConfigured(dayTimingRes.data.isConfigured);
        
        if (dayTimingRes.data.isConfigured && dayTimingRes.data.dayTimings) {
          const periodsPerDay = {};
          const breaksPerDay = {};
          const templatesPerDay = {};
          
          // Build periods and breaks for each day
          dayTimingRes.data.dayTimings.forEach(dayData => {
            const dayName = dayData.dayName;
            if (!dayData.isWorkingDay) return;
            
            templatesPerDay[dayName] = dayData.templateName;
            
            // Build periods array
            periodsPerDay[dayName] = (dayData.periods || []).map(p => ({
              id: p.id,
              name: p.name,
              shortName: p.shortName,
              start: p.startTime?.substring(0, 5),
              end: p.endTime?.substring(0, 5),
              type: 'class',
              periodNumber: p.periodNumber
            }));
            
            // Build breaks array
            breaksPerDay[dayName] = (dayData.breaks || []).map(b => ({
              id: b.id,
              name: b.name,
              shortName: b.shortName,
              start: b.startTime?.substring(0, 5),
              end: b.endTime?.substring(0, 5),
              type: 'break',
              breakType: b.breakType,
              afterPeriod: b.afterPeriod
            }));
          });
          
          setDayWisePeriods(periodsPerDay);
          setDayWiseBreaks(breaksPerDay);
          setDayTemplates(templatesPerDay);
          
          // Set default periods (Monday or first available day)
          const firstDay = DAYS.find(d => periodsPerDay[d]?.length > 0) || 'Monday';
          const defaultPeriods = periodsPerDay[firstDay] || [];
          const defaultBreaks = breaksPerDay[firstDay] || [];
          
          // Merge into timeline for display
          const timeline = [...defaultPeriods, ...defaultBreaks].sort((a, b) => 
            (a.start || '').localeCompare(b.start || '')
          );
          
          setPeriods(timeline);
          setBreaks(defaultBreaks);
        }
      }
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetable = async () => {
    if (!currentSession?.id) return;
    
    try {
      let res;
      if (viewMode === 'teacher' && selectedTeacher?.id) {
        res = await timetable.getTeacher(selectedTeacher.id, { academic_session_id: currentSession.id });
      } else if (viewMode === 'class' && selectedClass?.id) {
        res = await timetable.getClass(selectedClass.id, { academic_session_id: currentSession.id });
      }

      if (res?.success) {
        setTimetableData(res.data || {});
      }
    } catch (e) {
      console.error('Error fetching timetable:', e);
    }
  };

  // Filter subjects, classes, and teachers based on assignments
  const filterSubjectsForSelection = async () => {
    const sessionClasses = classSections.filter(c => c.academicSessionId === currentSession?.id);
    
    if (!currentSession?.id) {
      setFilteredSubjects(subjectsList);
      setFilteredClassesForTeacher(sessionClasses);
      setFilteredTeachersForClass(teachersList);
      return;
    }
    
    try {
      if (viewMode === 'teacher' && selectedTeacher?.id) {
        // Fetch all teacher assignments and find this teacher's data
        const res = await subjectAssignments.getByTeacher({ academic_session_id: currentSession.id });
        
        if (res?.success && res.data) {
          // Find this teacher's assignments
          const teacherData = res.data.find(t => t.teacherId === selectedTeacher.id);
          
          if (teacherData && teacherData.assignments && teacherData.assignments.length > 0) {
            // Get unique subject IDs from teacher's assignments
            const assignedSubjectIds = [...new Set(teacherData.assignments.map(a => a.subjectId))];
            const filteredSubs = subjectsList.filter(s => assignedSubjectIds.includes(s.id));
            setFilteredSubjects(filteredSubs.length > 0 ? filteredSubs : subjectsList);
            
            // Get unique class section IDs where teacher teaches
            const assignedClassIds = [...new Set(teacherData.assignments.map(a => a.classSectionId).filter(Boolean))];
            const filteredCls = sessionClasses.filter(c => assignedClassIds.includes(c.id));
            setFilteredClassesForTeacher(filteredCls.length > 0 ? filteredCls : sessionClasses);
          } else {
            setFilteredSubjects(subjectsList);
            setFilteredClassesForTeacher(sessionClasses);
          }
        } else {
          setFilteredSubjects(subjectsList);
          setFilteredClassesForTeacher(sessionClasses);
        }
      } else if (viewMode === 'class' && selectedClass?.id) {
        // Fetch all class assignments and find this class's data
        const res = await subjectAssignments.getByClass({ academic_session_id: currentSession.id });
        if (res?.success && res.data) {
          // Find this class's assignments
          const classData = res.data.find(c => c.classSectionId === selectedClass.id);
          
          if (classData && classData.assignments && classData.assignments.length > 0) {
            // Get unique subject IDs from class assignments
            const assignedSubjectIds = [...new Set(classData.assignments.map(a => a.subjectId))];
            const filteredSubs = subjectsList.filter(s => assignedSubjectIds.includes(s.id));
            setFilteredSubjects(filteredSubs.length > 0 ? filteredSubs : subjectsList);
            
            // Get unique teacher IDs who teach in this class
            const assignedTeacherIds = [...new Set(classData.assignments.map(a => a.teacherId).filter(Boolean))];
            const filteredTchs = teachersList.filter(t => assignedTeacherIds.includes(t.id));
            setFilteredTeachersForClass(filteredTchs.length > 0 ? filteredTchs : teachersList);
          } else {
            setFilteredSubjects(subjectsList);
            setFilteredTeachersForClass(teachersList);
          }
        } else {
          setFilteredSubjects(subjectsList);
          setFilteredTeachersForClass(teachersList);
        }
      } else {
        setFilteredSubjects(subjectsList);
        setFilteredClassesForTeacher(sessionClasses);
        setFilteredTeachersForClass(teachersList);
      }
    } catch (e) {
      console.error('Error filtering subjects:', e);
      setFilteredSubjects(subjectsList);
      setFilteredClassesForTeacher(sessionClasses);
      setFilteredTeachersForClass(teachersList);
    }
  };

  const handleAddEntry = async (day, periodNumber, data) => {
    try {
      const entryData = {
        academicSessionId: currentSession?.id,
        dayOfWeek: day,
        periodNumber: periodNumber,
        periodId: data.periodId || null,
        teacherId: viewMode === 'teacher' ? selectedTeacher?.id : (data.teacherId || null),
        classSectionId: viewMode === 'class' ? selectedClass?.id : (data.classSectionId || null),
        subjectId: data.subjectId || null,
        room: data.room || null,
        notes: data.notes || null
      };

      const res = await timetable.save(entryData);
      
      if (res?.success) {
        // Get display names for local state update
        const subject = subjectsList.find(s => s.id === data.subjectId);
        const classSection = classSections.find(c => c.id === (viewMode === 'class' ? selectedClass?.id : data.classSectionId));
        const teacher = teachersList.find(t => t.id === (viewMode === 'teacher' ? selectedTeacher?.id : data.teacherId));
        
        // Update local state with display names
        const key = `${day}-${periodNumber}`;
        setTimetableData(prev => ({
          ...prev,
          [key]: {
            ...data,
            dayOfWeek: day,
            periodNumber: periodNumber,
            subjectName: subject?.name || '',
            className: classSection?.gradeDisplayName || classSection?.gradeName || '',
            sectionName: classSection?.sectionDisplayName || classSection?.sectionName || '',
            teacherName: teacher?.fullName || ''
          }
        }));
        setShowAddModal(null);
        setAddFormData({ subjectId: '', classSectionId: '', teacherId: '', room: '' });
        toast.success('Period added to timetable');
      } else {
        toast.error(res?.message || 'Failed to save');
      }
    } catch (e) {
      console.error('Error:', e);
      toast.error('Failed to add period');
    }
  };

  const handleRemoveEntry = async (day, periodNumber) => {
    try {
      const res = await timetable.remove({
        academicSessionId: currentSession?.id,
        dayOfWeek: day,
        periodNumber: periodNumber,
        teacherId: viewMode === 'teacher' ? selectedTeacher?.id : null,
        classSectionId: viewMode === 'class' ? selectedClass?.id : null
      });

      if (res?.success) {
        const key = `${day}-${periodNumber}`;
        setTimetableData(prev => {
          const newData = { ...prev };
          delete newData[key];
          return newData;
        });
        toast.success('Period removed');
      } else {
        toast.error(res?.message || 'Failed to remove');
      }
    } catch (e) {
      console.error('Error:', e);
      toast.error('Failed to remove period');
    }
  };

  // Filter teachers
  const filteredTeachers = teachersList.filter(t => 
    !searchTerm || t.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClasses = classSections.filter(c =>
    c.academicSessionId === currentSession?.id
  );

  // Get period info
  const getTimeIcon = (time) => {
    const hour = parseInt(time.split(':')[0]);
    if (hour < 10) return Sunrise;
    if (hour < 12) return Sun;
    if (hour < 14) return Coffee;
    return Sunset;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading timetable...</p>
        </div>
      </div>
    );
  }

  // Show configuration required message if timing not set up
  if (!timingConfigured || periods.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10 text-amber-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Class Timings Not Configured</h3>
          <p className="text-gray-500 mb-6">
            Please configure your school's class timings (periods, breaks, working hours) before using the timetable.
          </p>
          <button onClick={() => navigate('/settings/class-timings')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
            <Settings className="w-5 h-5" />
            Configure Class Timings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-6">
      {/* Sidebar - Teacher/Class List */}
      {showTeacherList && (
        <div className="w-80 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-full">
            {/* View Toggle */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button onClick={() => { setViewMode('teacher'); setSelectedClass(null); }}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                    viewMode === 'teacher' ? 'bg-white shadow-md text-purple-600' : 'text-gray-500'
                  }`}>
                  <Users className="w-4 h-4" /> Teachers
                </button>
                <button onClick={() => { setViewMode('class'); setSelectedTeacher(null); }}
                  className={`flex-1 py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                    viewMode === 'class' ? 'bg-white shadow-md text-purple-600' : 'text-gray-500'
                  }`}>
                  <Building className="w-4 h-4" /> Classes
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder={`Search ${viewMode}...`} value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto p-4 pt-0" style={{ maxHeight: 'calc(100vh - 350px)' }}>
              {viewMode === 'teacher' ? (
                <div className="space-y-2">
                  {filteredTeachers.map(teacher => (
                    <button key={teacher.id} onClick={() => setSelectedTeacher(teacher)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                        selectedTeacher?.id === teacher.id 
                          ? 'bg-purple-100 border-2 border-purple-300' 
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                        selectedTeacher?.id === teacher.id ? 'bg-purple-500' : 'bg-gray-400'
                      }`}>
                        {teacher.firstName?.[0]}{teacher.lastName?.[0] || ''}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate">{teacher.fullName}</p>
                        <p className="text-xs text-gray-500 truncate">{teacher.department || 'Staff'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredClasses.map(cls => (
                    <button key={cls.id} onClick={() => setSelectedClass(cls)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                        selectedClass?.id === cls.id 
                          ? 'bg-purple-100 border-2 border-purple-300' 
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                        selectedClass?.id === cls.id ? 'bg-purple-500' : 'bg-gray-400'
                      }`}>
                        {cls.gradeDisplayName?.replace(/[^0-9]/g, '') || 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800">{cls.gradeDisplayName || cls.gradeName} - {cls.sectionDisplayName || cls.sectionName}</p>
                        <p className="text-xs text-gray-500">{cls.roomNumber || 'Room not assigned'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Timetable Area */}
      <div className="flex-1">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Grid3X3 className="w-8 h-8" />
                Weekly Timetable
              </h2>
              {selectedTeacher && (
                <p className="text-white/80 mt-1">
                  Viewing timetable for <strong>{selectedTeacher.fullName}</strong>
                </p>
              )}
              {selectedClass && (
                <p className="text-white/80 mt-1">
                  Viewing timetable for <strong>{selectedClass.gradeDisplayName} - {selectedClass.sectionDisplayName}</strong>
                </p>
              )}
              {!selectedTeacher && !selectedClass && (
                <p className="text-white/80 mt-1">Select a teacher or class to view their timetable</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowTeacherList(!showTeacherList)}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors">
                <List className="w-5 h-5" />
              </button>
              <button onClick={fetchTimetable}
                className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-colors">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

        </div>

        {/* Timetable Grid */}
        {(selectedTeacher || selectedClass) ? (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-4 text-left text-sm font-semibold text-gray-600 border-b border-gray-200 sticky left-0 bg-gray-50 z-10 w-28">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Time
                      </div>
                    </th>
                    {DAYS.map(day => {
                      const templateName = dayTemplates[day];
                      const hasDifferentTemplate = templateName && templateName !== 'Default' && templateName !== 'Regular Day';
                      return (
                        <th key={day} className="p-4 text-center border-b border-gray-200 min-w-[140px]">
                          <div className="text-sm font-semibold text-gray-700">{day}</div>
                          {hasDifferentTemplate && (
                            <div className="text-xs text-purple-600 font-medium mt-1 bg-purple-50 px-2 py-0.5 rounded-full inline-block">
                              {templateName}
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {/* Calculate max periods to determine rows */}
                  {(() => {
                    // Get maximum period number across all days
                    const maxPeriods = Math.max(
                      ...DAYS.map(day => 
                        (dayWisePeriods[day] || []).filter(p => p.type !== 'break').length
                      ),
                      periods.filter(p => p.type !== 'break').length
                    );
                    
                    // Build unified timeline with period numbers
                    const rows = [];
                    for (let pNum = 1; pNum <= maxPeriods; pNum++) {
                      rows.push({ type: 'period', periodNumber: pNum });
                      
                      // Check if any day has a break after this period
                      const hasBreakAfter = DAYS.some(day => {
                        const dayBreaks = dayWiseBreaks[day] || breaks;
                        return dayBreaks.some(b => b.afterPeriod === pNum);
                      });
                      
                      if (hasBreakAfter && pNum < maxPeriods) {
                        rows.push({ type: 'break', afterPeriod: pNum });
                      }
                    }
                    
                    return rows.map((row, idx) => {
                      const isBreak = row.type === 'break';
                      
                      return (
                        <tr key={`row-${idx}`} className={isBreak ? 'bg-amber-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          {/* Time column - show first day's timing or generic label */}
                          <td className={`p-3 border-b border-gray-100 sticky left-0 z-10 ${isBreak ? 'bg-amber-50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <div className="flex items-center gap-2">
                              {isBreak ? (
                                <>
                                  <Coffee className="w-4 h-4 text-amber-500" />
                                  <div>
                                    <p className="font-medium text-amber-700">Break</p>
                                    <p className="text-xs text-gray-500">After P{row.afterPeriod}</p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  {(() => {
                                    const firstDayPeriod = (dayWisePeriods['Monday'] || periods).find(p => p.periodNumber === row.periodNumber);
                                    const TimeIcon = getTimeIcon(firstDayPeriod?.start);
                                    return (
                                      <>
                                        <TimeIcon className="w-4 h-4 text-gray-400" />
                                        <div>
                                          <p className="font-medium text-gray-800">Period {row.periodNumber}</p>
                                          {firstDayPeriod && (
                                            <p className="text-xs text-gray-500">{firstDayPeriod.start} - {firstDayPeriod.end}</p>
                                          )}
                                        </div>
                                      </>
                                    );
                                  })()}
                                </>
                              )}
                            </div>
                          </td>
                          
                          {/* Day columns */}
                          {DAYS.map(day => {
                            const dayPeriods = dayWisePeriods[day] || periods;
                            const dayBreaksList = dayWiseBreaks[day] || breaks;
                            
                            if (isBreak) {
                              // Check if this day has a break after this period
                              const dayBreak = dayBreaksList.find(b => b.afterPeriod === row.afterPeriod);
                              return (
                                <td key={day} className="p-2 border-b border-gray-100 text-center">
                                  {dayBreak ? (
                                    <div className="px-3 py-2 bg-amber-100/50 rounded-xl">
                                      <Coffee className="w-4 h-4 text-amber-500 mx-auto" />
                                      <p className="text-xs text-amber-700 mt-1">{dayBreak.start}-{dayBreak.end}</p>
                                    </div>
                                  ) : (
                                    <div className="px-3 py-2 text-gray-300 text-xs">—</div>
                                  )}
                                </td>
                              );
                            }
                            
                            // Find the period for this day
                            const dayPeriod = dayPeriods.find(p => p.periodNumber === row.periodNumber);
                            
                            if (!dayPeriod) {
                              return (
                                <td key={day} className="p-2 border-b border-gray-100 text-center">
                                  <div className="text-gray-300 text-xs">No period</div>
                                </td>
                              );
                            }
                            
                            const key = `${day}-${row.periodNumber}`;
                            const entry = timetableData[key];
                            const color = entry ? getSubjectColor(entry.subjectId, subjectColorMap) : null;
                            
                            return (
                              <td key={day} className="p-2 border-b border-gray-100">
                                {/* Show time if different from Monday */}
                                {dayTemplates[day] && dayTemplates[day] !== 'Default' && dayTemplates[day] !== 'Regular Day' && (
                                  <div className="text-xs text-purple-500 mb-1 text-center font-medium">
                                    {dayPeriod.start}-{dayPeriod.end}
                                  </div>
                                )}
                                {entry ? (
                                  <div className={`group relative p-3 rounded-xl border-2 ${color.bg} ${color.border} transition-all hover:shadow-md`}>
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${color.accent} rounded-l-lg`}></div>
                                    <p className={`font-semibold ${color.text} text-sm truncate`}>{entry.subjectName}</p>
                                    <p className="text-xs text-gray-500 truncate mt-1">
                                      {viewMode === 'teacher' 
                                        ? `${entry.className || ''}${entry.sectionName ? ` - ${entry.sectionName}` : ''}`
                                        : entry.teacherName}
                                    </p>
                                    <button onClick={() => handleRemoveEntry(day, row.periodNumber)}
                                      className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded-lg transition-all">
                                      <X className="w-3 h-3 text-red-500" />
                                    </button>
                                  </div>
                                ) : (
                                  <button onClick={() => setShowAddModal({ day, periodId: dayPeriod.id, periodNumber: row.periodNumber })}
                                    className="w-full h-full min-h-[60px] border-2 border-dashed border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 transition-all flex items-center justify-center group">
                                    <Plus className="w-5 h-5 text-gray-300 group-hover:text-purple-500" />
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          // Empty State
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Timetable Selected</h3>
            <p className="text-gray-500 mb-6">Choose a teacher or class from the sidebar to view their weekly timetable</p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{teachersList.length} Teachers</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                <span>{classSections.length} Classes</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {(selectedTeacher || selectedClass) && (
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{Object.keys(timetableData).length}</p>
                <p className="text-gray-500 text-sm">Periods/Week</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {new Set(Object.values(timetableData).map(e => e?.subjectId).filter(Boolean)).size}
                </p>
                <p className="text-gray-500 text-sm">Subjects</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Building className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">
                  {new Set(Object.values(timetableData).map(e => e?.classId).filter(Boolean)).size}
                </p>
                <p className="text-gray-500 text-sm">Classes</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Coffee className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{periods.filter(p => p.type === 'break').length}</p>
                <p className="text-gray-500 text-sm">Breaks</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Period Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">Add Period</h3>
                  <p className="text-white/70 text-sm mt-1">
                    {showAddModal.day} - {periods.find(p => p.id === showAddModal.periodId)?.name}
                  </p>
                </div>
                <button onClick={() => setShowAddModal(null)} className="p-2 hover:bg-white/20 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <BookOpen className="w-4 h-4 inline mr-2" />Subject *
                  {filteredSubjects.length < subjectsList.length && (
                    <span className="ml-2 text-xs text-purple-600 font-normal">
                      (Showing {filteredSubjects.length} assigned subjects)
                    </span>
                  )}
                </label>
                <select 
                  value={addFormData.subjectId}
                  onChange={(e) => setAddFormData({ ...addFormData, subjectId: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">Select Subject</option>
                  {filteredSubjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              {viewMode === 'teacher' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Building className="w-4 h-4 inline mr-2" />Class *
                    {filteredClassesForTeacher.length < classSections.length && (
                      <span className="ml-2 text-xs text-purple-600 font-normal">
                        (Showing {filteredClassesForTeacher.length} assigned classes)
                      </span>
                    )}
                  </label>
                  <select 
                    value={addFormData.classSectionId}
                    onChange={(e) => setAddFormData({ ...addFormData, classSectionId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="">Select Class</option>
                    {filteredClassesForTeacher.map(c => (
                      <option key={c.id} value={c.id}>{c.gradeDisplayName} - {c.sectionDisplayName}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Users className="w-4 h-4 inline mr-2" />Teacher *
                    {filteredTeachersForClass.length < teachersList.length && (
                      <span className="ml-2 text-xs text-purple-600 font-normal">
                        (Showing {filteredTeachersForClass.length} assigned teachers)
                      </span>
                    )}
                  </label>
                  <select 
                    value={addFormData.teacherId}
                    onChange={(e) => setAddFormData({ ...addFormData, teacherId: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="">Select Teacher</option>
                    {filteredTeachersForClass.map(t => (
                      <option key={t.id} value={t.id}>{t.fullName}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Room (Optional)</label>
                <input type="text" placeholder="e.g., Room 101"
                  value={addFormData.room}
                  onChange={(e) => setAddFormData({ ...addFormData, room: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => { setShowAddModal(null); setAddFormData({ subjectId: '', classSectionId: '', teacherId: '', room: '' }); }} 
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl font-medium">
                Cancel
              </button>
              <button 
                onClick={() => handleAddEntry(showAddModal.day, showAddModal.periodNumber, { 
                  periodId: showAddModal.periodId, 
                  subjectId: addFormData.subjectId, 
                  classSectionId: addFormData.classSectionId, 
                  teacherId: addFormData.teacherId, 
                  room: addFormData.room 
                })}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!addFormData.subjectId || (viewMode === 'teacher' ? !addFormData.classSectionId : !addFormData.teacherId)}>
                Add to Timetable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherTimetable;

