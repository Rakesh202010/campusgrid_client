import { useState, useEffect, useRef } from 'react';
import { 
  GraduationCap, UserPlus, Edit2, Trash2, X, Loader2, Phone, Mail, 
  Search, Eye, ChevronDown, Building, Briefcase, Calendar, MapPin,
  CheckCircle, XCircle, Clock, AlertCircle, Users, BookOpen, Plus,
  FileText, Award, History, IndianRupee, Shield, MoreVertical, Key,
  Play, Pause, UserX, RefreshCw, Upload, Download, CalendarDays,
  ClipboardList, GraduationCapIcon, FileCheck, Lock, Unlock, ChevronRight,
  ChevronLeft, Filter, Table, LayoutGrid, Save, Check
} from 'lucide-react';
import { teachers, classConfig, subjects as subjectsApi, academicSessions, departments as departmentsApi } from '../services/api';
import { toast } from '../utils/toast';
import TeacherSubjectAssignment from '../components/TeacherSubjectAssignment';
import TeacherLeaveManagement from '../components/TeacherLeaveManagement';
import TeacherAttendance from '../components/TeacherAttendance';
import TeacherTimetable from '../components/TeacherTimetable';
import DailyTimetableView from '../components/DailyTimetableView';

// Fallback departments if API fails
const DEFAULT_DEPARTMENTS = ['Science', 'Mathematics', 'English', 'Hindi', 'Social Science', 'Computer Science', 'Physical Education', 'Arts', 'Commerce', 'Languages', 'Music', 'Administration', 'Other'];
const DESIGNATIONS = ['Principal', 'Vice Principal', 'Head of Department', 'Senior Teacher', 'Teacher', 'Assistant Teacher', 'Trainee Teacher', 'Guest Faculty'];
const QUALIFICATIONS = ['Ph.D.', 'M.Phil', 'M.Ed', 'M.A.', 'M.Sc.', 'M.Com', 'MBA', 'B.Ed', 'B.A.', 'B.Sc.', 'B.Com', 'BCA', 'MCA', 'B.Tech', 'M.Tech', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const DOC_TYPES = ['ID Proof', 'Address Proof', 'PAN Card', 'Aadhar Card', 'Passport', 'Driving License', 'Educational Certificate', 'Experience Letter', 'Offer Letter', 'Other'];

const STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-700', icon: Pause },
  relieved: { label: 'Relieved', color: 'bg-gray-100 text-gray-700', icon: UserX },
  on_leave: { label: 'On Leave', color: 'bg-amber-100 text-amber-700', icon: Clock },
  probation: { label: 'Probation', color: 'bg-blue-100 text-blue-700', icon: AlertCircle }
};

const TABS = [
  { id: 'list', label: 'Teachers', icon: Users },
  { id: 'subjects', label: 'Subject Assignment', icon: BookOpen },
  { id: 'attendance', label: 'Attendance', icon: CalendarDays },
  { id: 'leave', label: 'Leave Management', icon: Calendar },
  { id: 'timetable', label: 'Timetable', icon: Clock },
  { id: 'credentials', label: 'Login Access', icon: Key },
];

// Timetable Section with Sub-tabs
const TimetableSection = () => {
  const [subTab, setSubTab] = useState('daily');

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="bg-white rounded-2xl shadow-lg p-2">
        <div className="flex gap-2">
          <button onClick={() => setSubTab('daily')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
              subTab === 'daily'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}>
            <Calendar className="w-5 h-5" />
            Daily View & Substitutions
          </button>
          <button onClick={() => setSubTab('weekly')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
              subTab === 'weekly'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}>
            <Clock className="w-5 h-5" />
            Weekly Configuration
          </button>
        </div>
      </div>

      {/* Sub-tab Content */}
      {subTab === 'daily' && <DailyTimetableView />}
      {subTab === 'weekly' && <TeacherTimetable />}
    </div>
  );
};

const Teachers = () => {
  // Data state
  const [teachersList, setTeachersList] = useState([]);
  const [stats, setStats] = useState(null);
  const [classSections, setClassSections] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [allLeaveApplications, setAllLeaveApplications] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]); // Dynamic departments
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(null);
  const [showSubjectModal, setShowSubjectModal] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(null);
  const [showCredentialModal, setShowCredentialModal] = useState(null);
  const [showQualModal, setShowQualModal] = useState(null);
  const [showExpModal, setShowExpModal] = useState(null);
  const [showDocModal, setShowDocModal] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [formStep, setFormStep] = useState(1);
  const [viewMode, setViewMode] = useState('table');
  const [activeDetailsTab, setActiveDetailsTab] = useState('profile');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // Form states
  const initTeacherForm = {
    employeeId: '', firstName: '', lastName: '', email: '', phone: '', alternatePhone: '',
    dateOfBirth: '', gender: '', bloodGroup: '', nationality: 'Indian', religion: '', maritalStatus: '',
    qualification: '', specialization: '', experience: '', joiningDate: '',
    address: '', city: '', state: '', pincode: '',
    emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: '',
    department: '', designation: '', employmentType: 'permanent', subjects: [],
    salary: '', bankAccountNo: '', bankName: '', ifscCode: '', panNumber: '', aadharNumber: '',
    isClassTeacher: false, classTeacherOf: '', canTakeAttendance: true, canManageExams: true
  };
  const [teacherForm, setTeacherForm] = useState(initTeacherForm);
  const [statusForm, setStatusForm] = useState({ status: '', reason: '' });
  const [subjectForm, setSubjectForm] = useState({ subjectId: '', classSectionId: '', isPrimary: false, periodsPerWeek: 0 });
  const [leaveForm, setLeaveForm] = useState({ leaveTypeId: '', fromDate: '', toDate: '', reason: '' });
  const [credentialForm, setCredentialForm] = useState({ username: '', password: '' });
  const [qualForm, setQualForm] = useState({ degree: '', specialization: '', institution: '', university: '', yearOfPassing: '', percentage: '', grade: '' });
  const [expForm, setExpForm] = useState({ organization: '', designation: '', fromDate: '', toDate: '', responsibilities: '', reasonForLeaving: '' });
  const [docForm, setDocForm] = useState({ documentType: '', documentName: '', fileUrl: '', expiryDate: '', remarks: '' });
  const [importData, setImportData] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sessionRes = await academicSessions.getCurrent();
      const currentSessionId = sessionRes?.success ? sessionRes.data?.id : null;
      setCurrentSession(sessionRes?.data);

      const [teachersRes, statsRes, classRes, subjectsRes, leaveTypesRes, leaveAppsRes, deptRes] = await Promise.all([
        teachers.getAll(),
        teachers.getStats(),
        classConfig.getClassSections(currentSessionId ? { academic_session_id: currentSessionId } : {}),
        subjectsApi.getAll(),
        teachers.getLeaveTypes(),
        teachers.getAllLeaveApplications({ status: 'pending' }),
        departmentsApi.getAll({ is_active: true })
      ]);

      if (teachersRes?.success) setTeachersList(teachersRes.data || []);
      if (statsRes?.success) setStats(statsRes.data);
      if (classRes?.success) setClassSections(classRes.data || []);
      if (subjectsRes?.success) setSubjectsList(subjectsRes.data || []);
      if (leaveTypesRes?.success) setLeaveTypes(leaveTypesRes.data || []);
      if (leaveAppsRes?.success) setAllLeaveApplications(leaveAppsRes.data || []);
      if (deptRes?.success && deptRes.data?.length > 0) {
        setDepartmentsList(deptRes.data.map(d => d.name));
      } else {
        setDepartmentsList(DEFAULT_DEPARTMENTS);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
      setDepartmentsList(DEFAULT_DEPARTMENTS);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async (date) => {
    try {
      const res = await teachers.getAttendanceSummary({ date });
      if (res?.success) setAttendanceData(res.data || []);
    } catch (e) {
      console.error('Error fetching attendance:', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'attendance') fetchAttendance(attendanceDate);
  }, [activeTab, attendanceDate]);

  // Teacher handlers
  const openTeacherModal = (teacher = null) => {
    setFormStep(1);
    if (teacher) {
      setEditingItem(teacher);
      setTeacherForm({
        ...initTeacherForm,
        employeeId: teacher.employeeId || '', firstName: teacher.firstName || '',
        lastName: teacher.lastName || '', email: teacher.email || '', phone: teacher.phone || '',
        alternatePhone: teacher.alternatePhone || '', dateOfBirth: teacher.dateOfBirth?.split('T')[0] || '',
        gender: teacher.gender || '', bloodGroup: teacher.bloodGroup || '',
        nationality: teacher.nationality || 'Indian', religion: teacher.religion || '',
        maritalStatus: teacher.maritalStatus || '', qualification: teacher.qualification || '',
        specialization: teacher.specialization || '', experience: teacher.experience || '',
        joiningDate: teacher.joiningDate?.split('T')[0] || '', address: teacher.address || '',
        city: teacher.city || '', state: teacher.state || '', pincode: teacher.pincode || '',
        emergencyContactName: teacher.emergencyContactName || '',
        emergencyContactPhone: teacher.emergencyContactPhone || '',
        emergencyContactRelation: teacher.emergencyContactRelation || '',
        department: teacher.department || '', designation: teacher.designation || '',
        employmentType: teacher.employmentType || 'permanent', subjects: teacher.subjects || [],
        salary: teacher.salary || '', bankAccountNo: teacher.bankAccountNo || '',
        bankName: teacher.bankName || '', ifscCode: teacher.ifscCode || '',
        panNumber: teacher.panNumber || '', aadharNumber: teacher.aadharNumber || '',
        isClassTeacher: teacher.isClassTeacher || false, classTeacherOf: teacher.classTeacherOf || '',
        canTakeAttendance: teacher.canTakeAttendance !== false, canManageExams: teacher.canManageExams !== false
      });
    } else {
      setEditingItem(null);
      setTeacherForm(initTeacherForm);
    }
    setShowTeacherModal(true);
  };

  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...teacherForm,
        experience: teacherForm.experience ? parseInt(teacherForm.experience) : null,
        salary: teacherForm.salary ? parseFloat(teacherForm.salary) : null,
        classTeacherOf: teacherForm.isClassTeacher ? teacherForm.classTeacherOf : null
      };

      const response = editingItem ? await teachers.update(editingItem.id, data) : await teachers.create(data);

      if (response?.success) {
        toast.success(editingItem ? 'Teacher updated' : 'Teacher added');
        setShowTeacherModal(false);
        fetchData();
      } else {
        toast.error(response?.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Failed to save teacher');
    }
  };

  const handleDeleteTeacher = async (id) => {
    try {
      const response = await teachers.delete(id);
      if (response?.success) {
        toast.success('Teacher deleted');
        setShowDeleteConfirm(null);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete teacher');
    }
  };

  const handleStatusChange = async () => {
    if (!showStatusModal || !statusForm.status) return;
    try {
      const response = await teachers.changeStatus(showStatusModal.id, statusForm);
      if (response?.success) {
        toast.success(`Status changed to ${statusForm.status}`);
        setShowStatusModal(null);
        setStatusForm({ status: '', reason: '' });
        fetchData();
      } else {
        toast.error(response?.message || 'Failed to change status');
      }
    } catch (error) {
      toast.error('Failed to change status');
    }
  };

  // Subject Assignment handlers
  const handleAssignSubject = async () => {
    if (!showSubjectModal || !subjectForm.subjectId) return;
    try {
      const response = await teachers.assignSubject(showSubjectModal.id, {
        ...subjectForm,
        academicSessionId: currentSession?.id
      });
      if (response?.success) {
        toast.success('Subject assigned');
        setShowSubjectModal(null);
        setSubjectForm({ subjectId: '', classSectionId: '', isPrimary: false, periodsPerWeek: 0 });
      } else {
        toast.error(response?.message || 'Failed');
      }
    } catch (e) {
      toast.error('Failed to assign subject');
    }
  };

  // Leave handlers
  const handleApplyLeave = async () => {
    if (!showLeaveModal || !leaveForm.leaveTypeId || !leaveForm.fromDate || !leaveForm.toDate) return;
    try {
      const response = await teachers.applyLeave(showLeaveModal.id, leaveForm);
      if (response?.success) {
        toast.success('Leave application submitted');
        setShowLeaveModal(null);
        setLeaveForm({ leaveTypeId: '', fromDate: '', toDate: '', reason: '' });
        fetchData();
      } else {
        toast.error(response?.message || 'Failed');
      }
    } catch (e) {
      toast.error('Failed to apply leave');
    }
  };

  const handleProcessLeave = async (app, action) => {
    try {
      const response = await teachers.processLeave(app.teacherId, app.id, { action });
      if (response?.success) {
        toast.success(`Leave ${action}`);
        fetchData();
      }
    } catch (e) {
      toast.error('Failed to process leave');
    }
  };

  // Credential handlers
  const handleCreateCredential = async () => {
    if (!showCredentialModal || !credentialForm.username || !credentialForm.password) return;
    try {
      const response = await teachers.createLogin(showCredentialModal.id, credentialForm);
      if (response?.success) {
        toast.success('Login credentials created');
        setShowCredentialModal(null);
        setCredentialForm({ username: '', password: '' });
        fetchData();
      } else {
        toast.error(response?.message || 'Failed');
      }
    } catch (e) {
      toast.error('Failed to create credentials');
    }
  };

  const handleToggleLogin = async (teacher, enabled) => {
    try {
      const response = await teachers.toggleLoginAccess(teacher.id, { enabled });
      if (response?.success) {
        toast.success(`Login ${enabled ? 'enabled' : 'disabled'}`);
        fetchData();
      }
    } catch (e) {
      toast.error('Failed');
    }
  };

  // Attendance handlers
  const handleMarkAttendance = async () => {
    if (attendanceData.length === 0) return;
    try {
      const response = await teachers.markAttendance({
        attendances: attendanceData.map(a => ({
          teacherId: a.teacherId,
          date: attendanceDate,
          status: a.status
        }))
      });
      if (response?.success) {
        toast.success('Attendance saved');
      }
    } catch (e) {
      toast.error('Failed to save attendance');
    }
  };

  const updateAttendanceStatus = (teacherId, status) => {
    setAttendanceData(prev => prev.map(a => a.teacherId === teacherId ? { ...a, status } : a));
  };

  // Bulk import handler
  const handleBulkImport = async () => {
    try {
      const parsedData = JSON.parse(importData);
      const response = await teachers.bulkImport({ teachers: parsedData });
      if (response?.success) {
        toast.success(response.message);
        setShowImportModal(false);
        setImportData('');
        fetchData();
      } else {
        toast.error(response?.message || 'Import failed');
      }
    } catch (e) {
      toast.error('Invalid JSON format');
    }
  };

  // Export handler
  const handleExport = async (format) => {
    try {
      const response = await teachers.export(format);
      if (format === 'json' && response?.success) {
        const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'teachers.json';
        a.click();
      }
    } catch (e) {
      toast.error('Export failed');
    }
  };

  // Qualification handlers
  const handleAddQualification = async () => {
    if (!showQualModal || !qualForm.degree) return;
    try {
      const response = await teachers.addQualification(showQualModal.id, qualForm);
      if (response?.success) {
        toast.success('Qualification added');
        setShowQualModal(null);
        setQualForm({ degree: '', specialization: '', institution: '', university: '', yearOfPassing: '', percentage: '', grade: '' });
      }
    } catch (e) {
      toast.error('Failed');
    }
  };

  // Experience handlers
  const handleAddExperience = async () => {
    if (!showExpModal || !expForm.organization) return;
    try {
      const response = await teachers.addExperience(showExpModal.id, expForm);
      if (response?.success) {
        toast.success('Experience added');
        setShowExpModal(null);
        setExpForm({ organization: '', designation: '', fromDate: '', toDate: '', responsibilities: '', reasonForLeaving: '' });
      }
    } catch (e) {
      toast.error('Failed');
    }
  };

  // Document handlers
  const handleAddDocument = async () => {
    if (!showDocModal || !docForm.documentType || !docForm.documentName) return;
    try {
      const response = await teachers.addDocument(showDocModal.id, docForm);
      if (response?.success) {
        toast.success('Document added');
        setShowDocModal(null);
        setDocForm({ documentType: '', documentName: '', fileUrl: '', expiryDate: '', remarks: '' });
      }
    } catch (e) {
      toast.error('Failed');
    }
  };

  // Filtered data
  const filteredTeachers = teachersList.filter(t => {
    const matchesSearch = searchTerm === '' || 
      t.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === '' || t.department === filterDept;
    const matchesStatus = filterStatus === '' || t.status === filterStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-800">Teacher Management</h1>
          <p className="text-gray-600 mt-1">Comprehensive teacher administration system</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Upload className="w-4 h-4" /> Import
          </button>
          <button onClick={() => handleExport('json')} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={() => openTeacherModal()} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25">
            <UserPlus className="w-5 h-5" /> Add Teacher
        </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <p className="text-blue-100 text-sm">Total</p>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
            <p className="text-green-100 text-sm">Active</p>
            <p className="text-3xl font-bold">{stats.active}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <p className="text-purple-100 text-sm">Class Teachers</p>
            <p className="text-3xl font-bold">{stats.classTeachers}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white">
            <p className="text-amber-100 text-sm">Pending Leaves</p>
            <p className="text-3xl font-bold">{stats.pendingLeaves || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white">
            <p className="text-indigo-100 text-sm">With Login</p>
            <p className="text-3xl font-bold">{stats.withLoginAccess || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl p-4 text-white">
            <p className="text-slate-300 text-sm">Departments</p>
            <p className="text-3xl font-bold">{stats.byDepartment?.length || 0}</p>
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
              {tab.id === 'leave' && stats?.pendingLeaves > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">{stats.pendingLeaves}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab: Teachers List */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="card">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search teachers..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Departments</option>
                {departmentsList.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Status</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <button onClick={fetchData} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Table */}
          {filteredTeachers.length === 0 ? (
            <div className="card text-center py-16">
              <GraduationCap className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-800 mb-2">No Teachers Found</h3>
              <p className="text-gray-600 mb-6">Add your first teacher to get started</p>
              <button onClick={() => openTeacherModal()} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
                <UserPlus className="w-5 h-5" /> Add Teacher
              </button>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Teacher</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Department</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Contact</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Class Teacher</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Login</th>
                      <th className="text-left py-4 px-4 text-sm font-semibold text-gray-600">Status</th>
                      <th className="text-right py-4 px-4 text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTeachers.map(teacher => {
                      const statusConfig = STATUS_CONFIG[teacher.status] || STATUS_CONFIG.active;
                      return (
                        <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                                {teacher.firstName?.[0]}{teacher.lastName?.[0] || ''}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">{teacher.fullName}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span>{teacher.employeeId || 'No ID'}</span>
                                  <span>•</span>
                                  <span>{teacher.designation || 'Teacher'}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-medium text-gray-800">{teacher.department || '-'}</p>
                            <p className="text-xs text-gray-500">{teacher.qualification || ''}</p>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              {teacher.phone && <div className="flex items-center gap-1.5 text-sm text-gray-600"><Phone className="w-3.5 h-3.5" /> {teacher.phone}</div>}
                              {teacher.email && <div className="flex items-center gap-1.5 text-sm text-gray-600"><Mail className="w-3.5 h-3.5" /> {teacher.email}</div>}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            {teacher.isClassTeacher ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                <CheckCircle className="w-3 h-3" /> {teacher.classTeacherOfName || 'Assigned'}
                              </span>
                            ) : <span className="text-gray-400 text-sm">-</span>}
                          </td>
                          <td className="py-4 px-4">
                            {teacher.hasLoginAccess ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                                <Unlock className="w-3 h-3" /> Enabled
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-full">
                                <Lock className="w-3 h-3" /> Disabled
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig.color}`}>
                              <statusConfig.icon className="w-3 h-3" /> {statusConfig.label}
                </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => setShowDetailsModal(teacher)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View Details">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button onClick={() => openTeacherModal(teacher)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Edit">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => { setShowStatusModal(teacher); setStatusForm({ status: teacher.status, reason: '' }); }} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg" title="Status">
                                <Shield className="w-4 h-4" />
                              </button>
                              <button onClick={() => setShowDeleteConfirm(teacher)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Subject Assignment - Enterprise Grade Component */}
      {activeTab === 'subjects' && (
        <TeacherSubjectAssignment />
      )}

      {/* Tab: Attendance - Modern UI */}
      {activeTab === 'attendance' && (
        <TeacherAttendance />
      )}

      {/* Tab: Leave Management - Modern UI */}
      {activeTab === 'leave' && (
        <TeacherLeaveManagement />
      )}

      {/* Tab: Timetable - Modern UI with Sub-tabs */}
      {activeTab === 'timetable' && (
        <TimetableSection />
      )}

      {/* Tab: Login Access */}
      {activeTab === 'credentials' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Teacher Login Access</h3>
          <p className="text-gray-600 mb-4">Manage login credentials for teacher portal access</p>
          <div className="space-y-3">
            {filteredTeachers.map(teacher => (
              <div key={teacher.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                    {teacher.firstName?.[0]}{teacher.lastName?.[0] || ''}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{teacher.fullName}</p>
                    <p className="text-xs text-gray-500">{teacher.email || 'No email'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {teacher.hasLoginAccess ? (
                    <>
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Login Enabled</span>
                      <button onClick={() => handleToggleLogin(teacher, false)}
                        className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg">
                        Disable
                      </button>
                      <button onClick={() => { setShowCredentialModal(teacher); setCredentialForm({ username: '', password: '' }); }}
                        className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg">
                        Reset Password
                      </button>
                    </>
                  ) : (
                    <button onClick={() => { setShowCredentialModal(teacher); setCredentialForm({ username: teacher.email || '', password: '' }); }}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Key className="w-4 h-4" /> Create Login
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Teacher Modal */}
      {showTeacherModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">{editingItem ? 'Edit Teacher' : 'Add New Teacher'}</h3>
                <button onClick={() => setShowTeacherModal(false)} className="p-2 hover:bg-white/20 rounded-lg text-white"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex items-center gap-2 mt-4">
                {[1, 2, 3, 4].map(step => (
                  <button key={step} onClick={() => setFormStep(step)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                      formStep === step ? 'bg-white text-blue-600' : formStep > step ? 'bg-green-400 text-white' : 'bg-white/20 text-white/80'
                    }`}>
                    <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs font-bold">
                      {formStep > step ? '✓' : step}
                    </span>
                    <span className="hidden sm:inline">{['Basic', 'Professional', 'Contact', 'Bank'][step - 1]}</span>
                  </button>
                ))}
              </div>
            </div>
            <form onSubmit={handleTeacherSubmit} className="flex-1 overflow-y-auto p-6">
              {formStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input type="text" value={teacherForm.firstName} required
                        onChange={(e) => setTeacherForm({ ...teacherForm, firstName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input type="text" value={teacherForm.lastName}
                        onChange={(e) => setTeacherForm({ ...teacherForm, lastName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                      <input type="text" value={teacherForm.employeeId}
                        onChange={(e) => setTeacherForm({ ...teacherForm, employeeId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select value={teacherForm.gender}
                        onChange={(e) => setTeacherForm({ ...teacherForm, gender: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input type="date" value={teacherForm.dateOfBirth}
                        onChange={(e) => setTeacherForm({ ...teacherForm, dateOfBirth: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                      <select value={teacherForm.bloodGroup}
                        onChange={(e) => setTeacherForm({ ...teacherForm, bloodGroup: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select</option>
                        {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                      <select value={teacherForm.maritalStatus}
                        onChange={(e) => setTeacherForm({ ...teacherForm, maritalStatus: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select</option>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
              {formStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <select value={teacherForm.department}
                        onChange={(e) => setTeacherForm({ ...teacherForm, department: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select</option>
                        {departmentsList.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                      <select value={teacherForm.designation}
                        onChange={(e) => setTeacherForm({ ...teacherForm, designation: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select</option>
                        {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                      <select value={teacherForm.qualification}
                        onChange={(e) => setTeacherForm({ ...teacherForm, qualification: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select</option>
                        {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                      <input type="date" value={teacherForm.joiningDate}
                        onChange={(e) => setTeacherForm({ ...teacherForm, joiningDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={teacherForm.isClassTeacher}
                        onChange={(e) => setTeacherForm({ ...teacherForm, isClassTeacher: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded" />
                      <span className="font-medium text-gray-700">Assign as Class Teacher</span>
                    </label>
                    {teacherForm.isClassTeacher && (
                      <select value={teacherForm.classTeacherOf}
                        onChange={(e) => setTeacherForm({ ...teacherForm, classTeacherOf: e.target.value })}
                        className="w-full mt-3 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                        <option value="">Select Class-Section</option>
                        {classSections.map(cs => <option key={cs.id} value={cs.id}>{cs.gradeDisplayName || cs.gradeName} - {cs.sectionDisplayName || cs.sectionName}</option>)}
                      </select>
                    )}
                  </div>
                </div>
              )}
              {formStep === 3 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" value={teacherForm.email}
                        onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input type="tel" value={teacherForm.phone}
                        onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea value={teacherForm.address} rows={2}
                      onChange={(e) => setTeacherForm({ ...teacherForm, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <input type="text" value={teacherForm.city} placeholder="City"
                      onChange={(e) => setTeacherForm({ ...teacherForm, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="text" value={teacherForm.state} placeholder="State"
                      onChange={(e) => setTeacherForm({ ...teacherForm, state: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="text" value={teacherForm.pincode} placeholder="Pincode"
                      onChange={(e) => setTeacherForm({ ...teacherForm, pincode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              )}
              {formStep === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Salary (₹)</label>
                      <input type="number" value={teacherForm.salary}
                        onChange={(e) => setTeacherForm({ ...teacherForm, salary: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                      <input type="text" value={teacherForm.bankName}
                        onChange={(e) => setTeacherForm({ ...teacherForm, bankName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                      <input type="text" value={teacherForm.bankAccountNo}
                        onChange={(e) => setTeacherForm({ ...teacherForm, bankAccountNo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                      <input type="text" value={teacherForm.ifscCode}
                        onChange={(e) => setTeacherForm({ ...teacherForm, ifscCode: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                      <input type="text" value={teacherForm.panNumber} maxLength={10}
                        onChange={(e) => setTeacherForm({ ...teacherForm, panNumber: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
                      <input type="text" value={teacherForm.aadharNumber} maxLength={12}
                        onChange={(e) => setTeacherForm({ ...teacherForm, aadharNumber: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
              )}
            </form>
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between">
              <button type="button" onClick={() => formStep > 1 ? setFormStep(formStep - 1) : setShowTeacherModal(false)}
                className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-xl">
                {formStep > 1 ? '← Previous' : 'Cancel'}
              </button>
              {formStep < 4 ? (
                <button type="button" onClick={() => setFormStep(formStep + 1)}
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700">Next →</button>
              ) : (
                <button type="button" onClick={handleTeacherSubmit}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700">
                  {editingItem ? 'Update Teacher' : 'Add Teacher'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subject Assignment Modal */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Assign Subject to {showSubjectModal.fullName}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <select value={subjectForm.subjectId}
                  onChange={(e) => setSubjectForm({ ...subjectForm, subjectId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Subject</option>
                  {subjectsList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class-Section (Optional)</label>
                <select value={subjectForm.classSectionId}
                  onChange={(e) => setSubjectForm({ ...subjectForm, classSectionId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All Classes</option>
                  {classSections.map(cs => <option key={cs.id} value={cs.id}>{cs.gradeDisplayName || cs.gradeName} - {cs.sectionDisplayName || cs.sectionName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Periods per Week</label>
                <input type="number" value={subjectForm.periodsPerWeek} min="0"
                  onChange={(e) => setSubjectForm({ ...subjectForm, periodsPerWeek: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={subjectForm.isPrimary}
                  onChange={(e) => setSubjectForm({ ...subjectForm, isPrimary: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-sm text-gray-700">Primary Teacher for this subject</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowSubjectModal(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleAssignSubject} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Assign</button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Application Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Apply Leave for {showLeaveModal.fullName}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type *</label>
                <select value={leaveForm.leaveTypeId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveTypeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Leave Type</option>
                  {leaveTypes.map(lt => <option key={lt.id} value={lt.id}>{lt.name} ({lt.code})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date *</label>
                  <input type="date" value={leaveForm.fromDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, fromDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date *</label>
                  <input type="date" value={leaveForm.toDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, toDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea value={leaveForm.reason} rows={2}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowLeaveModal(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleApplyLeave} className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">Apply Leave</button>
            </div>
          </div>
        </div>
      )}

      {/* Credential Modal */}
      {showCredentialModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {showCredentialModal.hasLoginAccess ? 'Reset Password' : 'Create Login'} for {showCredentialModal.fullName}
            </h3>
            <div className="space-y-4">
              {!showCredentialModal.hasLoginAccess && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username / Email *</label>
                  <input type="text" value={credentialForm.username}
                    onChange={(e) => setCredentialForm({ ...credentialForm, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input type="password" value={credentialForm.password}
                  onChange={(e) => setCredentialForm({ ...credentialForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCredentialModal(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleCreateCredential} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {showCredentialModal.hasLoginAccess ? 'Reset Password' : 'Create Login'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Status: {showStatusModal.fullName}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                <select value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Status</option>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <textarea value={statusForm.reason}
                  onChange={(e) => setStatusForm({ ...statusForm, reason: e.target.value })}
                  rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowStatusModal(null); setStatusForm({ status: '', reason: '' }); }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleStatusChange}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Update Status</button>
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
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Delete Teacher?</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete <strong>{showDeleteConfirm.fullName}</strong>?</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={() => handleDeleteTeacher(showDeleteConfirm.id)} className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Import Teachers</h3>
            <p className="text-sm text-gray-600 mb-4">Paste JSON array of teachers. Each teacher should have: firstName, lastName, email, phone, employeeId, department, designation</p>
            <textarea value={importData} rows={10} placeholder='[{"firstName": "John", "lastName": "Doe", ...}]'
              onChange={(e) => setImportData(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none" />
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => { setShowImportModal(false); setImportData(''); }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleBulkImport} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Import</button>
            </div>
          </div>
        </div>
      )}

      {/* Teacher Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                    {showDetailsModal.firstName?.[0]}{showDetailsModal.lastName?.[0] || ''}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{showDetailsModal.fullName}</h3>
                    <p className="text-blue-100">{showDetailsModal.designation || 'Teacher'} • {showDetailsModal.department || 'N/A'}</p>
                    <p className="text-sm text-blue-200">ID: {showDetailsModal.employeeId || 'Not Assigned'}</p>
                  </div>
                </div>
                <button onClick={() => setShowDetailsModal(null)} className="p-2 hover:bg-white/20 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex border-b border-gray-200 mb-6">
                {['profile', 'qualifications', 'documents', 'audit'].map(tab => (
                  <button key={tab} onClick={() => setActiveDetailsTab(tab)}
                    className={`px-4 py-2 font-medium text-sm capitalize ${activeDetailsTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
                    {tab}
                  </button>
        ))}
      </div>
              {activeDetailsTab === 'profile' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="font-medium text-gray-800">{showDetailsModal.email || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Phone</p>
                    <p className="font-medium text-gray-800">{showDetailsModal.phone || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Qualification</p>
                    <p className="font-medium text-gray-800">{showDetailsModal.qualification || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Experience</p>
                    <p className="font-medium text-gray-800">{showDetailsModal.experience ? `${showDetailsModal.experience} years` : 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Joining Date</p>
                    <p className="font-medium text-gray-800">{showDetailsModal.joiningDate ? new Date(showDetailsModal.joiningDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <p className="font-medium text-gray-800 capitalize">{showDetailsModal.status || 'active'}</p>
                  </div>
                  {showDetailsModal.isClassTeacher && (
                    <div className="p-4 bg-green-50 rounded-xl col-span-full">
                      <p className="text-xs text-green-600 mb-1">Class Teacher Of</p>
                      <p className="font-medium text-green-800">{showDetailsModal.classTeacherOfName || 'Assigned'}</p>
                    </div>
                  )}
                </div>
              )}
              {activeDetailsTab === 'qualifications' && (
                <div className="space-y-4">
                  <button onClick={() => setShowQualModal(showDetailsModal)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus className="w-4 h-4" /> Add Qualification
                  </button>
                  <p className="text-gray-500 text-center py-8">Qualifications will be displayed here</p>
                </div>
              )}
              {activeDetailsTab === 'documents' && (
                <div className="space-y-4">
                  <button onClick={() => setShowDocModal(showDetailsModal)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <Plus className="w-4 h-4" /> Add Document
                  </button>
                  <p className="text-gray-500 text-center py-8">Documents will be displayed here</p>
                </div>
              )}
              {activeDetailsTab === 'audit' && (
                <p className="text-gray-500 text-center py-8">Audit logs will be displayed here</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Qualification Modal */}
      {showQualModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Qualification</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Degree *</label>
                <select value={qualForm.degree}
                  onChange={(e) => setQualForm({ ...qualForm, degree: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                <input type="text" value={qualForm.institution}
                  onChange={(e) => setQualForm({ ...qualForm, institution: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year of Passing</label>
                  <input type="number" value={qualForm.yearOfPassing}
                    onChange={(e) => setQualForm({ ...qualForm, yearOfPassing: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Percentage/Grade</label>
                  <input type="text" value={qualForm.percentage}
                    onChange={(e) => setQualForm({ ...qualForm, percentage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowQualModal(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleAddQualification} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Document Modal */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Document</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
                <select value={docForm.documentType}
                  onChange={(e) => setDocForm({ ...docForm, documentType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option>
                  {DOC_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Name *</label>
                <input type="text" value={docForm.documentName}
                  onChange={(e) => setDocForm({ ...docForm, documentName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File URL</label>
                <input type="text" value={docForm.fileUrl}
                  onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input type="date" value={docForm.expiryDate}
                  onChange={(e) => setDocForm({ ...docForm, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowDocModal(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleAddDocument} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;

