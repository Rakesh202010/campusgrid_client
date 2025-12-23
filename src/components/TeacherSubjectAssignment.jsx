import { useState, useEffect } from 'react';
import {
  BookOpen, Users, Building, Plus, X, Check, AlertTriangle, Search,
  ChevronDown, ChevronRight, ArrowRight, Copy, Trash2, Edit2, RefreshCw,
  AlertCircle, CheckCircle, XCircle, Clock, Target, Briefcase, Calendar,
  GraduationCap, Layers, Grid3X3, BarChart3, PieChart, Filter, Eye, Save
} from 'lucide-react';
import { subjectAssignments, teachers, subjects as subjectsApi, classConfig, academicSessions } from '../services/api';
import { toast } from '../utils/toast';

const WORKLOAD_CONFIG = {
  overloaded: { label: 'Overloaded', color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-50', border: 'border-red-200', min: 31 },
  heavy: { label: 'Heavy', color: 'bg-amber-500', textColor: 'text-amber-700', bgLight: 'bg-amber-50', border: 'border-amber-200', min: 21, max: 30 },
  moderate: { label: 'Moderate', color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-50', border: 'border-blue-200', min: 11, max: 20 },
  light: { label: 'Light', color: 'bg-green-500', textColor: 'text-green-700', bgLight: 'bg-green-50', border: 'border-green-200', min: 1, max: 10 },
  unassigned: { label: 'No Load', color: 'bg-gray-400', textColor: 'text-gray-600', bgLight: 'bg-gray-50', border: 'border-gray-200', min: 0, max: 0 }
};

const getWorkloadStatus = (periods) => {
  if (periods > 30) return 'overloaded';
  if (periods > 20) return 'heavy';
  if (periods > 10) return 'moderate';
  if (periods > 0) return 'light';
  return 'unassigned';
};

const TeacherSubjectAssignment = ({ selectedTeacher, onClose }) => {
  // Data
  const [teachersList, setTeachersList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [classSections, setClassSections] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [workloadData, setWorkloadData] = useState([]);
  const [vacantPositions, setVacantPositions] = useState([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('teachers'); // teachers, subjects, classes, schedule
  const [selectedTeacherId, setSelectedTeacherId] = useState(selectedTeacher?.id || null);
  const [expandedTeacher, setExpandedTeacher] = useState(selectedTeacher?.id || null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterWorkload, setFilterWorkload] = useState('');

  // Forms
  const [assignForm, setAssignForm] = useState({
    teacherId: selectedTeacher?.id || '',
    subjectId: '',
    classSectionId: '',
    isPrimary: false,
    periodsPerWeek: 5
  });
  const [bulkSelections, setBulkSelections] = useState([]);
  const [transferForm, setTransferForm] = useState({ fromId: '', toId: '', all: true });
  const [copyForm, setCopyForm] = useState({ fromSession: '', toSession: '' });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (currentSession?.id) fetchAssignmentData();
  }, [currentSession]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [sessionsRes, currentRes, teachersRes, subjectsRes] = await Promise.all([
        academicSessions.getAll(),
        academicSessions.getCurrent(),
        teachers.getAll(),
        subjectsApi.getAll()
      ]);
      if (sessionsRes?.success) setSessions(sessionsRes.data || []);
      if (currentRes?.success) setCurrentSession(currentRes.data);
      if (teachersRes?.success) setTeachersList(teachersRes.data || []);
      if (subjectsRes?.success) setSubjectsList(subjectsRes.data || []);
    } catch (e) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentData = async () => {
    if (!currentSession?.id) return;
    try {
      const [assignRes, workloadRes, classRes, vacantRes] = await Promise.all([
        subjectAssignments.getAll({ academic_session_id: currentSession.id }),
        subjectAssignments.getWorkload({ academic_session_id: currentSession.id }),
        classConfig.getClassSections({ academic_session_id: currentSession.id }),
        subjectAssignments.getVacant({ academic_session_id: currentSession.id })
      ]);
      if (assignRes?.success) setAssignments(assignRes.data || []);
      if (workloadRes?.success) setWorkloadData(workloadRes.data?.allTeachers || []);
      if (classRes?.success) setClassSections(classRes.data || []);
      if (vacantRes?.success) setVacantPositions(vacantRes.data?.positions || []);
    } catch (e) {
      console.error('Error fetching assignments:', e);
    }
  };

  const handleAssign = async () => {
    if (!assignForm.teacherId || !assignForm.subjectId) {
      toast.error('Select teacher and subject');
      return;
    }
    try {
      const res = await subjectAssignments.assign({
        ...assignForm,
        academicSessionId: currentSession?.id
      });
      if (res?.success) {
        toast.success('Subject assigned successfully');
        setShowAssignModal(false);
        setAssignForm({ teacherId: '', subjectId: '', classSectionId: '', isPrimary: false, periodsPerWeek: 5 });
        fetchAssignmentData();
      } else {
        toast.error(res?.message || 'Failed to assign');
      }
    } catch (e) {
      toast.error('Failed to assign subject');
    }
  };

  const handleBulkAssign = async () => {
    if (!assignForm.teacherId || bulkSelections.length === 0) {
      toast.error('Select teacher and at least one subject-class');
      return;
    }
    try {
      const res = await subjectAssignments.bulkAssignToTeacher({
        teacherId: assignForm.teacherId,
        assignments: bulkSelections.map(s => ({
          subjectId: s.subjectId,
          classSectionId: s.classSectionId,
          isPrimary: s.isPrimary || false,
          periodsPerWeek: s.periodsPerWeek || 5
        })),
        academicSessionId: currentSession?.id
      });
      if (res?.success) {
        toast.success(res.message);
        setShowBulkModal(false);
        setBulkSelections([]);
        fetchAssignmentData();
      }
    } catch (e) {
      toast.error('Bulk assign failed');
    }
  };

  const handleDeleteAssignment = async (id) => {
    try {
      const res = await subjectAssignments.delete(id);
      if (res?.success) {
        toast.success('Assignment removed');
        fetchAssignmentData();
      }
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const handleTransfer = async () => {
    if (!transferForm.fromId || !transferForm.toId) return;
    try {
      const res = await subjectAssignments.transfer({
        fromTeacherId: transferForm.fromId,
        toTeacherId: transferForm.toId,
        transferAll: transferForm.all,
        academicSessionId: currentSession?.id
      });
      if (res?.success) {
        toast.success(res.message);
        setShowTransferModal(false);
        fetchAssignmentData();
      }
    } catch (e) {
      toast.error('Transfer failed');
    }
  };

  const handleCopySession = async () => {
    if (!copyForm.fromSession || !copyForm.toSession) return;
    try {
      const res = await subjectAssignments.copyToSession({
        fromSessionId: copyForm.fromSession,
        toSessionId: copyForm.toSession
      });
      if (res?.success) {
        toast.success(res.message);
        setShowCopyModal(false);
        fetchAssignmentData();
      }
    } catch (e) {
      toast.error('Copy failed');
    }
  };

  const toggleBulkSelection = (subjectId, classSectionId) => {
    const key = `${subjectId}-${classSectionId}`;
    setBulkSelections(prev => {
      const exists = prev.find(s => s.subjectId === subjectId && s.classSectionId === classSectionId);
      if (exists) return prev.filter(s => !(s.subjectId === subjectId && s.classSectionId === classSectionId));
      return [...prev, { subjectId, classSectionId, isPrimary: false, periodsPerWeek: 5 }];
    });
  };

  const getTeacherAssignments = (teacherId) => assignments.filter(a => a.teacherId === teacherId);
  const getTeacherWorkload = (teacherId) => {
    const wl = workloadData.find(w => w.teacherId === teacherId);
    return wl || { totalPeriods: 0, totalAssignments: 0, status: 'unassigned' };
  };

  // Filtered teachers
  const filteredTeachers = teachersList.filter(t => {
    const matchSearch = !searchTerm || t.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchDept = !filterDept || t.department === filterDept;
    const wl = getTeacherWorkload(t.id);
    const matchWorkload = !filterWorkload || wl.status === filterWorkload;
    return matchSearch && matchDept && matchWorkload;
  });

  const departments = [...new Set(teachersList.map(t => t.department).filter(Boolean))];

  // Summary stats
  const totalAssignments = assignments.length;
  const totalPeriods = workloadData.reduce((sum, w) => sum + (w.totalPeriods || 0), 0);
  const overloadedCount = workloadData.filter(w => w.status === 'overloaded').length;
  const unassignedCount = workloadData.filter(w => w.totalAssignments === 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Subject Assignment Management</h2>
            <p className="text-white/80 mt-1">
              Session: <strong>{currentSession?.name || 'Select Session'}</strong> • 
              {totalAssignments} assignments • {totalPeriods} total periods
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select value={currentSession?.id || ''} onChange={(e) => {
              const session = sessions.find(s => s.id === e.target.value);
              setCurrentSession(session);
            }} className="bg-white/20 text-white border-white/30 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white/50">
              {sessions.map(s => <option key={s.id} value={s.id} className="text-gray-800">{s.name}</option>)}
            </select>
            {onClose && (
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg"><Users className="w-5 h-5" /></div>
              <div>
                <p className="text-3xl font-bold">{teachersList.length}</p>
                <p className="text-white/70 text-sm">Teachers</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg"><BookOpen className="w-5 h-5" /></div>
              <div>
                <p className="text-3xl font-bold">{totalAssignments}</p>
                <p className="text-white/70 text-sm">Assignments</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-400/50 rounded-lg"><AlertCircle className="w-5 h-5" /></div>
              <div>
                <p className="text-3xl font-bold">{overloadedCount}</p>
                <p className="text-white/70 text-sm">Overloaded</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-400/50 rounded-lg"><Target className="w-5 h-5" /></div>
              <div>
                <p className="text-3xl font-bold">{vacantPositions.length}</p>
                <p className="text-white/70 text-sm">Vacant Slots</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="border-b border-gray-200 bg-gray-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {['teachers', 'subjects', 'classes', 'schedule'].map(view => (
              <button key={view} onClick={() => setActiveView(view)}
                className={`px-4 py-2 rounded-lg font-medium text-sm capitalize transition-colors ${
                  activeView === view 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}>
                {view === 'teachers' && <Users className="w-4 h-4 inline mr-1" />}
                {view === 'subjects' && <BookOpen className="w-4 h-4 inline mr-1" />}
                {view === 'classes' && <Building className="w-4 h-4 inline mr-1" />}
                {view === 'schedule' && <Grid3X3 className="w-4 h-4 inline mr-1" />}
                {view}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCopyModal(true)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm">
              <Copy className="w-4 h-4 inline mr-1" /> Copy Session
            </button>
            <button onClick={() => setShowTransferModal(true)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm">
              <ArrowRight className="w-4 h-4 inline mr-1" /> Transfer
            </button>
            <button onClick={() => { setShowBulkModal(true); setBulkSelections([]); }} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm">
              <Layers className="w-4 h-4 inline mr-1" /> Bulk Assign
            </button>
            <button onClick={() => setShowAssignModal(true)} className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg shadow-lg shadow-indigo-500/30 text-sm font-medium">
              <Plus className="w-4 h-4 inline mr-1" /> Assign Subject
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search teachers..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={filterWorkload} onChange={(e) => setFilterWorkload(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Workload</option>
            {Object.entries(WORKLOAD_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button onClick={fetchAssignmentData} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        {/* Teachers View */}
        {activeView === 'teachers' && (
          <div className="space-y-4">
            {filteredTeachers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>No teachers found</p>
              </div>
            ) : (
              filteredTeachers.map(teacher => {
                const workload = getTeacherWorkload(teacher.id);
                const teacherAssigns = getTeacherAssignments(teacher.id);
                const statusConfig = WORKLOAD_CONFIG[workload.status] || WORKLOAD_CONFIG.unassigned;
                const isExpanded = expandedTeacher === teacher.id;

                return (
                  <div key={teacher.id} className={`border rounded-xl overflow-hidden transition-all ${statusConfig.border} ${isExpanded ? 'shadow-lg' : ''}`}>
                    {/* Teacher Header */}
                    <div 
                      onClick={() => setExpandedTeacher(isExpanded ? null : teacher.id)}
                      className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors ${statusConfig.bgLight}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                          {teacher.firstName?.[0]}{teacher.lastName?.[0] || ''}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{teacher.fullName}</h4>
                          <p className="text-sm text-gray-500">{teacher.department || 'No Department'} • {teacher.employeeId || 'No ID'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        {/* Workload Bar */}
                        <div className="w-32">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-500">Workload</span>
                            <span className={`font-medium ${statusConfig.textColor}`}>{workload.totalPeriods} p/w</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full ${statusConfig.color} rounded-full transition-all`}
                              style={{ width: `${Math.min((workload.totalPeriods / 35) * 100, 100)}%` }} />
                          </div>
                        </div>
                        {/* Stats */}
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-xl font-bold text-gray-800">{teacherAssigns.length}</p>
                            <p className="text-xs text-gray-500">Subjects</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgLight} ${statusConfig.textColor} border ${statusConfig.border}`}>
                            {statusConfig.label}
                          </span>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-white p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="font-medium text-gray-700">Assigned Subjects ({teacherAssigns.length})</h5>
                          <button onClick={() => { setAssignForm({ ...assignForm, teacherId: teacher.id }); setShowAssignModal(true); }}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1">
                            <Plus className="w-4 h-4" /> Add Subject
                          </button>
                        </div>
                        
                        {teacherAssigns.length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <BookOpen className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                            <p className="text-gray-500">No subjects assigned yet</p>
                            <button onClick={() => { setAssignForm({ ...assignForm, teacherId: teacher.id }); setShowAssignModal(true); }}
                              className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm">
                              Assign First Subject
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {teacherAssigns.map(assign => (
                              <div key={assign.id} className="group bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-indigo-200 transition-all">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h6 className="font-semibold text-gray-800">{assign.subjectName}</h6>
                                    <p className="text-sm text-gray-500">{assign.subjectCode}</p>
                                  </div>
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteAssignment(assign.id); }}
                                    className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <div className="mt-3 flex items-center gap-2 flex-wrap">
                                  <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs">{assign.classSection || 'All Classes'}</span>
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">{assign.periodsPerWeek}p/w</span>
                                  {assign.isPrimary && (
                                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" /> Primary
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Subjects View */}
        {activeView === 'subjects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectsList.map(subject => {
              const subjectAssigns = assignments.filter(a => a.subjectId === subject.id);
              const teacherCount = [...new Set(subjectAssigns.map(a => a.teacherId))].length;
              return (
                <div key={subject.id} className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-xl p-5 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <BookOpen className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">{subject.code}</span>
                  </div>
                  <h4 className="font-semibold text-gray-800 text-lg">{subject.name}</h4>
                  <p className="text-sm text-gray-500 mb-4">{subject.category || 'General'}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600"><Users className="w-4 h-4 inline mr-1" />{teacherCount} teachers</span>
                    <span className="text-gray-600">{subjectAssigns.length} classes</span>
                  </div>
                  {subjectAssigns.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-purple-100">
                      <p className="text-xs text-gray-500 mb-2">Assigned to:</p>
                      <div className="flex flex-wrap gap-1">
                        {subjectAssigns.slice(0, 4).map(a => (
                          <span key={a.id} className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-600">{a.teacherName?.split(' ')[0]}</span>
                        ))}
                        {subjectAssigns.length > 4 && <span className="text-xs text-gray-400">+{subjectAssigns.length - 4}</span>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Classes View */}
        {activeView === 'classes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {classSections.map(cs => {
              const classAssigns = assignments.filter(a => a.classSectionId === cs.id);
              return (
                <div key={cs.id} className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl p-5 hover:shadow-lg transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-xl font-bold text-gray-800">{classAssigns.length}</span>
                  </div>
                  <h4 className="font-semibold text-gray-800">{cs.gradeDisplayName || cs.gradeName} - {cs.sectionDisplayName || cs.sectionName}</h4>
                  <p className="text-sm text-gray-500">subjects assigned</p>
                  {classAssigns.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-100 space-y-1">
                      {classAssigns.slice(0, 3).map(a => (
                        <div key={a.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-700">{a.subjectName}</span>
                          <span className="text-gray-500">{a.teacherName?.split(' ')[0]}</span>
                        </div>
                      ))}
                      {classAssigns.length > 3 && <p className="text-xs text-blue-600">+{classAssigns.length - 3} more</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Schedule/Grid View */}
        {activeView === 'schedule' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 p-3 text-left text-sm font-semibold text-gray-600 sticky left-0 bg-gray-50 z-10">Teacher</th>
                  {subjectsList.slice(0, 8).map(s => (
                    <th key={s.id} className="border border-gray-200 p-3 text-center text-sm font-medium text-gray-600 min-w-[100px]">
                      <div className="truncate">{s.name}</div>
                      <div className="text-xs text-gray-400">{s.code}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.slice(0, 15).map(teacher => {
                  const teacherAssigns = getTeacherAssignments(teacher.id);
                  return (
                    <tr key={teacher.id} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-3 sticky left-0 bg-white z-10">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                            {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 text-sm truncate max-w-[120px]">{teacher.fullName}</p>
                            <p className="text-xs text-gray-500">{teacher.department || '-'}</p>
                          </div>
                        </div>
                      </td>
                      {subjectsList.slice(0, 8).map(s => {
                        const hasAssignment = teacherAssigns.some(a => a.subjectId === s.id);
                        const assign = teacherAssigns.find(a => a.subjectId === s.id);
                        return (
                          <td key={s.id} className={`border border-gray-200 p-2 text-center ${hasAssignment ? 'bg-green-50' : ''}`}>
                            {hasAssignment ? (
                              <div className="text-xs">
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">{assign?.periodsPerWeek}p/w</span>
                              </div>
                            ) : (
                              <button onClick={() => { setAssignForm({ teacherId: teacher.id, subjectId: s.id, classSectionId: '', isPrimary: false, periodsPerWeek: 5 }); setShowAssignModal(true); }}
                                className="text-gray-300 hover:text-indigo-600">
                                <Plus className="w-4 h-4 mx-auto" />
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Vacant Positions Footer */}
      {vacantPositions.length > 0 && (
        <div className="border-t border-gray-200 bg-amber-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">{vacantPositions.length} Vacant Positions</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              {vacantPositions.slice(0, 5).map((v, i) => (
                <button key={i} onClick={() => { setAssignForm({ teacherId: '', subjectId: v.subjectId, classSectionId: v.classSectionId || '', isPrimary: true, periodsPerWeek: 5 }); setShowAssignModal(true); }}
                  className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-sm text-amber-700 hover:bg-amber-100 whitespace-nowrap">
                  {v.subjectName} → {v.classSection}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white">
              <h3 className="text-lg font-semibold">Assign Subject to Teacher</h3>
              <p className="text-white/70 text-sm">Session: {currentSession?.name}</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher *</label>
                <select value={assignForm.teacherId} onChange={(e) => setAssignForm({ ...assignForm, teacherId: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select Teacher</option>
                  {teachersList.map(t => <option key={t.id} value={t.id}>{t.fullName} ({t.department || 'N/A'})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <select value={assignForm.subjectId} onChange={(e) => setAssignForm({ ...assignForm, subjectId: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Select Subject</option>
                  {subjectsList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class-Section</label>
                <select value={assignForm.classSectionId} onChange={(e) => setAssignForm({ ...assignForm, classSectionId: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">All Classes</option>
                  {classSections.map(cs => <option key={cs.id} value={cs.id}>{cs.gradeDisplayName || cs.gradeName} - {cs.sectionDisplayName || cs.sectionName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Periods/Week</label>
                  <input type="number" min="1" max="20" value={assignForm.periodsPerWeek}
                    onChange={(e) => setAssignForm({ ...assignForm, periodsPerWeek: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={assignForm.isPrimary}
                      onChange={(e) => setAssignForm({ ...assignForm, isPrimary: e.target.checked })}
                      className="w-5 h-5 text-indigo-600 rounded" />
                    <span className="text-sm text-gray-700">Primary Teacher</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-xl">Cancel</button>
              <button onClick={handleAssign} className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg">Assign</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assign Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white">
              <h3 className="text-lg font-semibold">Bulk Assign Subjects</h3>
              <p className="text-white/70 text-sm">Select teacher and multiple subject-class combinations</p>
            </div>
            <div className="p-5 border-b">
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Teacher</label>
              <select value={assignForm.teacherId} onChange={(e) => setAssignForm({ ...assignForm, teacherId: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select Teacher</option>
                {teachersList.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
              </select>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <p className="text-sm text-gray-600 mb-3">{bulkSelections.length} selected</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {subjectsList.flatMap(subject =>
                  classSections.map(cs => {
                    const isSelected = bulkSelections.some(s => s.subjectId === subject.id && s.classSectionId === cs.id);
                    return (
                      <button key={`${subject.id}-${cs.id}`} onClick={() => toggleBulkSelection(subject.id, cs.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-200 hover:border-indigo-300'
                        }`}>
                        <p className="font-medium text-gray-800">{subject.name}</p>
                        <p className="text-sm text-gray-500">{cs.gradeDisplayName || cs.gradeName} - {cs.sectionDisplayName || cs.sectionName}</p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            <div className="px-5 py-4 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowBulkModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-xl">Cancel</button>
              <button onClick={handleBulkAssign} className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg">
                Assign {bulkSelections.length} Subjects
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Transfer Assignments</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Teacher</label>
                <select value={transferForm.fromId} onChange={(e) => setTransferForm({ ...transferForm, fromId: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl">
                  <option value="">Select</option>
                  {teachersList.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
              </div>
              <div className="flex justify-center"><ArrowRight className="w-6 h-6 text-gray-400" /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Teacher</label>
                <select value={transferForm.toId} onChange={(e) => setTransferForm({ ...transferForm, toId: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl">
                  <option value="">Select</option>
                  {teachersList.filter(t => t.id !== transferForm.fromId).map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowTransferModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl">Cancel</button>
              <button onClick={handleTransfer} className="px-5 py-2 bg-amber-600 text-white rounded-xl">Transfer All</button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Session Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Copy to New Session</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Session</label>
                <select value={copyForm.fromSession} onChange={(e) => setCopyForm({ ...copyForm, fromSession: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl">
                  <option value="">Select</option>
                  {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Session</label>
                <select value={copyForm.toSession} onChange={(e) => setCopyForm({ ...copyForm, toSession: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl">
                  <option value="">Select</option>
                  {sessions.filter(s => s.id !== copyForm.fromSession).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCopyModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl">Cancel</button>
              <button onClick={handleCopySession} className="px-5 py-2 bg-purple-600 text-white rounded-xl">Copy Assignments</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherSubjectAssignment;

