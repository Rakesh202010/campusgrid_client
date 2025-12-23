import { useState, useEffect } from 'react';
import { 
  BookOpen, Users, Building, Loader2, Plus, X, Check, AlertTriangle, 
  Search, Filter, ChevronDown, ArrowRight, Copy, Trash2, Edit2, RefreshCw,
  AlertCircle, CheckCircle, XCircle, ChevronRight, BarChart3, 
  GraduationCap, UserCheck, Clock, Target, Briefcase
} from 'lucide-react';
import { subjectAssignments, teachers, subjects as subjectsApi, classConfig, academicSessions } from '../services/api';
import { toast } from '../utils/toast';

const WORKLOAD_STATUS = {
  overloaded: { label: 'Overloaded', color: 'bg-red-100 text-red-700', icon: AlertCircle },
  heavy: { label: 'Heavy', color: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  moderate: { label: 'Moderate', color: 'bg-blue-100 text-blue-700', icon: Clock },
  light: { label: 'Light', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  unassigned: { label: 'Unassigned', color: 'bg-gray-100 text-gray-500', icon: XCircle }
};

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'by-teacher', label: 'By Teacher', icon: Users },
  { id: 'by-subject', label: 'By Subject', icon: BookOpen },
  { id: 'by-class', label: 'By Class', icon: Building },
  { id: 'vacant', label: 'Vacant Positions', icon: Target },
];

const SubjectAssignment = () => {
  // Data
  const [allAssignments, setAllAssignments] = useState([]);
  const [byTeacher, setByTeacher] = useState([]);
  const [bySubject, setBySubject] = useState([]);
  const [byClass, setByClass] = useState([]);
  const [vacantPositions, setVacantPositions] = useState({ totalVacant: 0, positions: [] });
  const [workloadSummary, setWorkloadSummary] = useState(null);
  const [teachersList, setTeachersList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [classSections, setClassSections] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);

  // UI State
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(null); // 'teacher' | 'classes' | null
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [conflicts, setConflicts] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItem, setExpandedItem] = useState(null);

  // Forms
  const [assignForm, setAssignForm] = useState({
    teacherId: '', subjectId: '', classSectionId: '', isPrimary: false, periodsPerWeek: 0
  });
  const [bulkTeacherForm, setBulkTeacherForm] = useState({
    teacherId: '', assignments: []
  });
  const [bulkClassForm, setBulkClassForm] = useState({
    teacherId: '', subjectId: '', classSectionIds: [], isPrimary: false, periodsPerWeek: 0
  });
  const [transferForm, setTransferForm] = useState({
    fromTeacherId: '', toTeacherId: '', transferAll: true, assignmentIds: []
  });
  const [copyForm, setCopyForm] = useState({
    fromSessionId: '', toSessionId: '', teacherIds: []
  });

  useEffect(() => { fetchInitialData(); }, []);
  useEffect(() => { if (currentSession) fetchAllData(); }, [currentSession]);

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
      console.error('Error:', e);
      toast.error('Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    if (!currentSession?.id) return;
    setLoading(true);
    try {
      const sessionId = currentSession.id;
      const [assignmentsRes, byTeacherRes, bySubjectRes, byClassRes, vacantRes, workloadRes, classRes] = await Promise.all([
        subjectAssignments.getAll({ academic_session_id: sessionId }),
        subjectAssignments.getByTeacher({ academic_session_id: sessionId }),
        subjectAssignments.getBySubject({ academic_session_id: sessionId }),
        subjectAssignments.getByClass({ academic_session_id: sessionId }),
        subjectAssignments.getVacant({ academic_session_id: sessionId }),
        subjectAssignments.getWorkload({ academic_session_id: sessionId }),
        classConfig.getClassSections({ academic_session_id: sessionId })
      ]);

      if (assignmentsRes?.success) setAllAssignments(assignmentsRes.data || []);
      if (byTeacherRes?.success) setByTeacher(byTeacherRes.data || []);
      if (bySubjectRes?.success) setBySubject(bySubjectRes.data || []);
      if (byClassRes?.success) setByClass(byClassRes.data || []);
      if (vacantRes?.success) setVacantPositions(vacantRes.data || { totalVacant: 0, positions: [] });
      if (workloadRes?.success) setWorkloadSummary(workloadRes.data);
      if (classRes?.success) setClassSections(classRes.data || []);
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Check conflicts before assigning
  const handleCheckConflicts = async () => {
    if (!assignForm.teacherId || !assignForm.subjectId) {
      toast.error('Select teacher and subject first');
      return;
    }
    try {
      const res = await subjectAssignments.checkConflicts({
        ...assignForm,
        academicSessionId: currentSession?.id
      });
      if (res?.success) {
        setConflicts(res.data);
        if (res.data.hasConflicts) {
          toast.error('Conflicts detected');
        } else if (res.data.hasWarnings) {
          toast.warning('Warnings detected - you can still proceed');
        } else {
          toast.success('No conflicts found');
        }
      }
    } catch (e) {
      toast.error('Failed to check conflicts');
    }
  };

  // Assign subject
  const handleAssign = async () => {
    if (!assignForm.teacherId || !assignForm.subjectId) {
      toast.error('Teacher and Subject are required');
      return;
    }
    try {
      const res = await subjectAssignments.assign({
        ...assignForm,
        academicSessionId: currentSession?.id
      });
      if (res?.success) {
        toast.success('Subject assigned');
        setShowAssignModal(false);
        setAssignForm({ teacherId: '', subjectId: '', classSectionId: '', isPrimary: false, periodsPerWeek: 0 });
        setConflicts(null);
        fetchAllData();
      } else {
        toast.error(res?.message || 'Failed');
      }
    } catch (e) {
      toast.error('Failed to assign');
    }
  };

  // Bulk assign to teacher
  const handleBulkAssignToTeacher = async () => {
    if (!bulkTeacherForm.teacherId || bulkTeacherForm.assignments.length === 0) {
      toast.error('Select teacher and at least one subject');
      return;
    }
    try {
      const res = await subjectAssignments.bulkAssignToTeacher({
        teacherId: bulkTeacherForm.teacherId,
        assignments: bulkTeacherForm.assignments,
        academicSessionId: currentSession?.id
      });
      if (res?.success) {
        toast.success(res.message);
        setShowBulkModal(null);
        setBulkTeacherForm({ teacherId: '', assignments: [] });
        fetchAllData();
      } else {
        toast.error(res?.message || 'Failed');
      }
    } catch (e) {
      toast.error('Failed');
    }
  };

  // Bulk assign subject to classes
  const handleBulkAssignToClasses = async () => {
    if (!bulkClassForm.teacherId || !bulkClassForm.subjectId || bulkClassForm.classSectionIds.length === 0) {
      toast.error('All fields required');
      return;
    }
    try {
      const res = await subjectAssignments.bulkAssignToClasses({
        ...bulkClassForm,
        academicSessionId: currentSession?.id
      });
      if (res?.success) {
        toast.success(res.message);
        setShowBulkModal(null);
        setBulkClassForm({ teacherId: '', subjectId: '', classSectionIds: [], isPrimary: false, periodsPerWeek: 0 });
        fetchAllData();
      } else {
        toast.error(res?.message || 'Failed');
      }
    } catch (e) {
      toast.error('Failed');
    }
  };

  // Transfer assignments
  const handleTransfer = async () => {
    if (!transferForm.fromTeacherId || !transferForm.toTeacherId) {
      toast.error('Select both teachers');
      return;
    }
    try {
      const res = await subjectAssignments.transfer({
        ...transferForm,
        academicSessionId: currentSession?.id
      });
      if (res?.success) {
        toast.success(res.message);
        setShowTransferModal(false);
        setTransferForm({ fromTeacherId: '', toTeacherId: '', transferAll: true, assignmentIds: [] });
        fetchAllData();
      } else {
        toast.error(res?.message || 'Failed');
      }
    } catch (e) {
      toast.error('Failed');
    }
  };

  // Copy to new session
  const handleCopyToSession = async () => {
    if (!copyForm.fromSessionId || !copyForm.toSessionId) {
      toast.error('Select both sessions');
      return;
    }
    try {
      const res = await subjectAssignments.copyToSession(copyForm);
      if (res?.success) {
        toast.success(res.message);
        setShowCopyModal(false);
        setCopyForm({ fromSessionId: '', toSessionId: '', teacherIds: [] });
        fetchAllData();
      } else {
        toast.error(res?.message || 'Failed');
      }
    } catch (e) {
      toast.error('Failed');
    }
  };

  // Delete assignment
  const handleDelete = async (id) => {
    try {
      const res = await subjectAssignments.delete(id);
      if (res?.success) {
        toast.success('Assignment deleted');
        setShowDeleteConfirm(null);
        fetchAllData();
      }
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  // Quick assign from vacant
  const handleQuickAssign = (position) => {
    setAssignForm({
      teacherId: '',
      subjectId: position.subjectId,
      classSectionId: position.classSectionId || '',
      isPrimary: true,
      periodsPerWeek: 0
    });
    setShowAssignModal(true);
  };

  // Toggle bulk assignment selection
  const toggleBulkSelection = (subjectId, classSectionId) => {
    setBulkTeacherForm(prev => {
      const existing = prev.assignments.find(a => a.subjectId === subjectId && a.classSectionId === classSectionId);
      if (existing) {
        return { ...prev, assignments: prev.assignments.filter(a => !(a.subjectId === subjectId && a.classSectionId === classSectionId)) };
      }
      return { ...prev, assignments: [...prev.assignments, { subjectId, classSectionId, isPrimary: false, periodsPerWeek: 0 }] };
    });
  };

  // Toggle class selection for bulk
  const toggleClassSelection = (classSectionId) => {
    setBulkClassForm(prev => {
      if (prev.classSectionIds.includes(classSectionId)) {
        return { ...prev, classSectionIds: prev.classSectionIds.filter(id => id !== classSectionId) };
      }
      return { ...prev, classSectionIds: [...prev.classSectionIds, classSectionId] };
    });
  };

  if (loading && !currentSession) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Subject Assignment</h1>
          <p className="text-gray-600 mt-1">Manage teacher-subject-class assignments with conflict detection</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={currentSession?.id || ''} onChange={(e) => {
            const session = sessions.find(s => s.id === e.target.value);
            setCurrentSession(session);
          }} className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button onClick={() => setShowCopyModal(true)} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Copy className="w-4 h-4" /> Copy from Session
          </button>
          <button onClick={() => setShowTransferModal(true)} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <ArrowRight className="w-4 h-4" /> Transfer
          </button>
          <button onClick={() => setShowAssignModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25">
            <Plus className="w-5 h-5" /> Assign Subject
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {workloadSummary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <p className="text-blue-100 text-sm">Total Assignments</p>
            <p className="text-3xl font-bold">{allAssignments.length}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
            <p className="text-green-100 text-sm">Teachers Assigned</p>
            <p className="text-3xl font-bold">{workloadSummary.summary.totalTeachers - workloadSummary.summary.unassignedCount}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white">
            <p className="text-red-100 text-sm">Overloaded</p>
            <p className="text-3xl font-bold">{workloadSummary.summary.overloadedCount}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white">
            <p className="text-amber-100 text-sm">Vacant Positions</p>
            <p className="text-3xl font-bold">{vacantPositions.totalVacant}</p>
          </div>
          <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl p-4 text-white">
            <p className="text-slate-300 text-sm">Avg Periods/Teacher</p>
            <p className="text-3xl font-bold">{workloadSummary.summary.averagePeriods}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
              {tab.id === 'vacant' && vacantPositions.totalVacant > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">{vacantPositions.totalVacant}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && workloadSummary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Workload Distribution */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Teacher Workload Distribution</h3>
            <div className="space-y-3">
              {workloadSummary.allTeachers.slice(0, 10).map(t => {
                const status = WORKLOAD_STATUS[t.status];
                const maxPeriods = 35;
                const percentage = Math.min((t.totalPeriods / maxPeriods) * 100, 100);
                return (
                  <div key={t.teacherId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{t.teacherName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${status.color}`}>{t.totalPeriods} periods</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          t.status === 'overloaded' ? 'bg-red-500' 
                          : t.status === 'heavy' ? 'bg-amber-500' 
                          : t.status === 'moderate' ? 'bg-blue-500' 
                          : 'bg-green-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowBulkModal('teacher')} className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 text-left transition-colors">
                <Users className="w-6 h-6 text-blue-600 mb-2" />
                <p className="font-medium text-gray-800">Bulk Assign to Teacher</p>
                <p className="text-xs text-gray-500">Assign multiple subjects to one teacher</p>
              </button>
              <button onClick={() => setShowBulkModal('classes')} className="p-4 border border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50/50 text-left transition-colors">
                <Building className="w-6 h-6 text-green-600 mb-2" />
                <p className="font-medium text-gray-800">Bulk Assign to Classes</p>
                <p className="text-xs text-gray-500">Assign one subject to multiple classes</p>
              </button>
              <button onClick={() => setShowTransferModal(true)} className="p-4 border border-gray-200 rounded-xl hover:border-amber-300 hover:bg-amber-50/50 text-left transition-colors">
                <ArrowRight className="w-6 h-6 text-amber-600 mb-2" />
                <p className="font-medium text-gray-800">Transfer Assignments</p>
                <p className="text-xs text-gray-500">Move assignments between teachers</p>
              </button>
              <button onClick={() => setShowCopyModal(true)} className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/50 text-left transition-colors">
                <Copy className="w-6 h-6 text-purple-600 mb-2" />
                <p className="font-medium text-gray-800">Copy to New Session</p>
                <p className="text-xs text-gray-500">Copy assignments to another session</p>
              </button>
            </div>

            {/* Warnings */}
            {workloadSummary.overloadedTeachers.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                  <AlertCircle className="w-4 h-4" /> Overloaded Teachers
                </div>
                <div className="space-y-1">
                  {workloadSummary.overloadedTeachers.map(t => (
                    <p key={t.id} className="text-sm text-red-600">{t.name} - {t.periods} periods/week</p>
                  ))}
                </div>
              </div>
            )}

            {workloadSummary.unassignedTeachers.length > 0 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
                  <AlertTriangle className="w-4 h-4" /> Unassigned Teachers
                </div>
                <div className="space-y-1">
                  {workloadSummary.unassignedTeachers.slice(0, 5).map(t => (
                    <p key={t.id} className="text-sm text-amber-600">{t.name} ({t.department || 'No dept'})</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* By Teacher Tab */}
      {activeTab === 'by-teacher' && (
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search teachers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={fetchAllData} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"><RefreshCw className="w-5 h-5" /></button>
          </div>
          <div className="space-y-3">
            {byTeacher.filter(t => t.teacherName.toLowerCase().includes(searchTerm.toLowerCase())).map(teacher => {
              const status = WORKLOAD_STATUS[teacher.workloadStatus];
              const isExpanded = expandedItem === teacher.teacherId;
              return (
                <div key={teacher.teacherId} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setExpandedItem(isExpanded ? null : teacher.teacherId)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                        {teacher.teacherName?.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{teacher.teacherName}</p>
                        <p className="text-xs text-gray-500">{teacher.department || 'No dept'} • {teacher.employeeId || 'No ID'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">{teacher.totalSubjects} subjects</p>
                        <p className="text-xs text-gray-500">{teacher.totalPeriods} periods/week</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${status.color}`}>{status.label}</span>
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </button>
                  {isExpanded && teacher.assignments.length > 0 && (
                    <div className="border-t border-gray-100 bg-gray-50 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {teacher.assignments.map(a => (
                          <div key={a.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                            <div>
                              <p className="font-medium text-gray-800 text-sm">{a.subjectName}</p>
                              <p className="text-xs text-gray-500">{a.classSection} • {a.periodsPerWeek}p/w</p>
                            </div>
                            <div className="flex items-center gap-1">
                              {a.isPrimary && <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">Primary</span>}
                              <button onClick={() => setShowDeleteConfirm(a)} className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* By Subject Tab */}
      {activeTab === 'by-subject' && (
        <div className="card">
          <div className="space-y-3">
            {bySubject.filter(s => s.subjectName.toLowerCase().includes(searchTerm.toLowerCase())).map(subject => {
              const isExpanded = expandedItem === subject.subjectId;
              return (
                <div key={subject.subjectId} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setExpandedItem(isExpanded ? null : subject.subjectId)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{subject.subjectName}</p>
                        <p className="text-xs text-gray-500">{subject.subjectCode} • {subject.category || 'General'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">{subject.totalTeachers} teachers</p>
                        <p className="text-xs text-gray-500">{subject.totalAssignments} assignments</p>
                      </div>
                      {subject.hasPrimaryTeacher && <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Has Primary</span>}
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </button>
                  {isExpanded && subject.assignments.length > 0 && (
                    <div className="border-t border-gray-100 bg-gray-50 p-4">
                      <div className="space-y-2">
                        {subject.assignments.map(a => (
                          <div key={a.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800 text-sm">{a.teacherName}</span>
                              <span className="text-xs text-gray-500">→ {a.classSection}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">{a.periodsPerWeek}p/w</span>
                              {a.isPrimary && <span className="px-1.5 py-0.5 text-xs bg-green-100 text-green-700 rounded">Primary</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* By Class Tab */}
      {activeTab === 'by-class' && (
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {byClass.map(cs => (
              <div key={cs.classSectionId} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">{cs.displayName}</p>
                    <p className="text-xs text-gray-500">{cs.totalSubjects} subjects • {cs.totalTeachers} teachers</p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">{cs.totalPeriods} periods</span>
                </div>
                {cs.assignments.length > 0 && (
                  <div className="space-y-1">
                    {cs.assignments.slice(0, 5).map(a => (
                      <div key={a.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{a.subjectName}</span>
                        <span className="text-gray-500 text-xs">{a.teacherName}</span>
                      </div>
                    ))}
                    {cs.assignments.length > 5 && (
                      <p className="text-xs text-blue-600">+{cs.assignments.length - 5} more</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vacant Positions Tab */}
      {activeTab === 'vacant' && (
        <div className="card">
          {vacantPositions.totalVacant === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-800">All Positions Filled!</h3>
              <p className="text-gray-600">All subjects have been assigned teachers</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-600">{vacantPositions.totalVacant} vacant positions need teachers</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {vacantPositions.positions.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border border-red-200 bg-red-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-800">{p.subjectName}</p>
                      <p className="text-xs text-gray-600">{p.classSection}</p>
                    </div>
                    <button onClick={() => handleQuickAssign(p)} className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Assign
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Single Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Assign Subject to Teacher</h3>
              <button onClick={() => { setShowAssignModal(false); setConflicts(null); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher *</label>
                <select value={assignForm.teacherId} onChange={(e) => setAssignForm({ ...assignForm, teacherId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Teacher</option>
                  {teachersList.map(t => <option key={t.id} value={t.id}>{t.fullName} ({t.department || 'N/A'})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <select value={assignForm.subjectId} onChange={(e) => setAssignForm({ ...assignForm, subjectId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Subject</option>
                  {subjectsList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class-Section (optional)</label>
                <select value={assignForm.classSectionId} onChange={(e) => setAssignForm({ ...assignForm, classSectionId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All Classes</option>
                  {classSections.map(cs => <option key={cs.id} value={cs.id}>{cs.gradeDisplayName || cs.gradeName} - {cs.sectionDisplayName || cs.sectionName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Periods/Week</label>
                  <input type="number" min="0" max="20" value={assignForm.periodsPerWeek}
                    onChange={(e) => setAssignForm({ ...assignForm, periodsPerWeek: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={assignForm.isPrimary}
                      onChange={(e) => setAssignForm({ ...assignForm, isPrimary: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm text-gray-700">Primary Teacher</span>
                  </label>
                </div>
              </div>

              {/* Conflict Check Button */}
              <button type="button" onClick={handleCheckConflicts}
                className="w-full py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Check for Conflicts
              </button>

              {/* Conflicts Display */}
              {conflicts && (
                <div className={`p-3 rounded-lg ${conflicts.hasConflicts ? 'bg-red-50 border border-red-200' : conflicts.hasWarnings ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                  {conflicts.conflicts.map((c, i) => (
                    <p key={i} className="text-sm text-red-600 flex items-center gap-2"><XCircle className="w-4 h-4" /> {c.message}</p>
                  ))}
                  {conflicts.warnings.map((w, i) => (
                    <p key={i} className="text-sm text-amber-600 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {w.message}</p>
                  ))}
                  {!conflicts.hasConflicts && !conflicts.hasWarnings && (
                    <p className="text-sm text-green-600 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> No conflicts detected</p>
                  )}
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowAssignModal(false); setConflicts(null); }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleAssign} disabled={conflicts?.hasConflicts}
                className={`px-4 py-2 text-white rounded-lg ${conflicts?.hasConflicts ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assign to Teacher Modal */}
      {showBulkModal === 'teacher' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Bulk Assign Subjects to Teacher</h3>
                <button onClick={() => setShowBulkModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Teacher *</label>
                <select value={bulkTeacherForm.teacherId} onChange={(e) => setBulkTeacherForm({ ...bulkTeacherForm, teacherId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Teacher</option>
                  {teachersList.map(t => <option key={t.id} value={t.id}>{t.fullName} ({t.department || 'N/A'})</option>)}
                </select>
              </div>
              <p className="text-sm text-gray-600 mb-3">Select subjects to assign ({bulkTeacherForm.assignments.length} selected)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {subjectsList.map(subject => (
                  classSections.map(cs => {
                    const isSelected = bulkTeacherForm.assignments.some(a => a.subjectId === subject.id && a.classSectionId === cs.id);
                    return (
                      <button key={`${subject.id}-${cs.id}`} type="button"
                        onClick={() => toggleBulkSelection(subject.id, cs.id)}
                        className={`p-2 rounded-lg border text-left text-sm transition-colors ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                        }`}>
                        <p className="font-medium text-gray-800">{subject.name}</p>
                        <p className="text-xs text-gray-500">{cs.gradeDisplayName || cs.gradeName} - {cs.sectionDisplayName || cs.sectionName}</p>
                      </button>
                    );
                  })
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setShowBulkModal(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleBulkAssignToTeacher} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Assign {bulkTeacherForm.assignments.length} Subjects
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assign to Classes Modal */}
      {showBulkModal === 'classes' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Assign Subject to Multiple Classes</h3>
                <button onClick={() => setShowBulkModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teacher *</label>
                  <select value={bulkClassForm.teacherId} onChange={(e) => setBulkClassForm({ ...bulkClassForm, teacherId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Teacher</option>
                    {teachersList.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <select value={bulkClassForm.subjectId} onChange={(e) => setBulkClassForm({ ...bulkClassForm, subjectId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Subject</option>
                    {subjectsList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3">Select classes ({bulkClassForm.classSectionIds.length} selected)</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {classSections.map(cs => {
                  const isSelected = bulkClassForm.classSectionIds.includes(cs.id);
                  return (
                    <button key={cs.id} type="button" onClick={() => toggleClassSelection(cs.id)}
                      className={`p-2 rounded-lg border text-center text-sm transition-colors ${
                        isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-300'
                      }`}>
                      {cs.gradeDisplayName || cs.gradeName} - {cs.sectionDisplayName || cs.sectionName}
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={bulkClassForm.isPrimary}
                    onChange={(e) => setBulkClassForm({ ...bulkClassForm, isPrimary: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded" />
                  <span className="text-sm text-gray-700">Set as Primary Teacher</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Periods/Week:</span>
                  <input type="number" min="0" max="20" value={bulkClassForm.periodsPerWeek}
                    onChange={(e) => setBulkClassForm({ ...bulkClassForm, periodsPerWeek: parseInt(e.target.value) || 0 })}
                    className="w-16 px-2 py-1 border border-gray-200 rounded-lg" />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setShowBulkModal(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleBulkAssignToClasses} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Assign to {bulkClassForm.classSectionIds.length} Classes
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
                <label className="block text-sm font-medium text-gray-700 mb-1">From Teacher *</label>
                <select value={transferForm.fromTeacherId} onChange={(e) => setTransferForm({ ...transferForm, fromTeacherId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Teacher</option>
                  {teachersList.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-center">
                <ArrowRight className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Teacher *</label>
                <select value={transferForm.toTeacherId} onChange={(e) => setTransferForm({ ...transferForm, toTeacherId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Teacher</option>
                  {teachersList.filter(t => t.id !== transferForm.fromTeacherId).map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={transferForm.transferAll}
                  onChange={(e) => setTransferForm({ ...transferForm, transferAll: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-sm text-gray-700">Transfer all assignments</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowTransferModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleTransfer} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">Transfer</button>
            </div>
          </div>
        </div>
      )}

      {/* Copy to Session Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Copy Assignments to New Session</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Session *</label>
                <select value={copyForm.fromSessionId} onChange={(e) => setCopyForm({ ...copyForm, fromSessionId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Session</option>
                  {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Session *</label>
                <select value={copyForm.toSessionId} onChange={(e) => setCopyForm({ ...copyForm, toSessionId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Session</option>
                  {sessions.filter(s => s.id !== copyForm.fromSessionId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <p className="text-sm text-gray-600">Leave empty to copy all teachers' assignments</p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCopyModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleCopyToSession} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">Copy</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Delete Assignment?</h3>
            <p className="text-gray-600 mb-6">Remove <strong>{showDeleteConfirm.subjectName}</strong> from {showDeleteConfirm.classSection}?</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={() => handleDelete(showDeleteConfirm.id)} className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectAssignment;

