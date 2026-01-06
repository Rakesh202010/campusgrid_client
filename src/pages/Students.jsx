import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Search, Filter, Download, Upload, RefreshCw,
  Edit, Trash2, Eye, Phone, Mail, MapPin, Calendar, GraduationCap,
  ChevronLeft, ChevronRight, X, Save, User, Building, Home,
  FileText, Heart, Bus, AlertCircle, CheckCircle, MoreVertical, FileSpreadsheet
} from 'lucide-react';
import { students, classConfig, numberSettings, streams, people } from '../services/api';
import { useAcademicSession } from '../contexts/AcademicSessionContext';
import { toast } from '../utils/toast';

const Students = () => {
  const navigate = useNavigate();
  const { currentSession, sessionId } = useAcademicSession();
  
  // Data states
  const [studentsList, setStudentsList] = useState([]);
  const [stats, setStats] = useState(null);
  const [classSections, setClassSections] = useState([]);
  const [classGrades, setClassGrades] = useState([]);
  
  // Pagination
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    class_section_id: '',
    class_grade_id: '',
    status: 'active'
  });
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // add, edit, view
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [saving, setSaving] = useState(false);
  
  // Import/Export States
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [importData, setImportData] = useState({ classSectionId: '', csvData: '' });
  const [importResult, setImportResult] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);
  
  // Academic Mapping
  const [academicMapping, setAcademicMapping] = useState(null);
  const [loadingMapping, setLoadingMapping] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState(getEmptyFormData());

  function getEmptyFormData() {
    return {
      admissionNumber: '',
      admissionDate: new Date().toISOString().split('T')[0],
      classSectionId: '',
      rollNumber: '',
      streamId: '', // Academic stream (Science, Commerce, Arts, etc.)
      firstName: '',
      middleName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      bloodGroup: '',
      nationality: 'Indian',
      religion: '',
      caste: '',
      category: '',
      email: '',
      phone: '',
      alternatePhone: '',
      address: { line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' },
      aadharNumber: '',
      medicalConditions: '',
      allergies: '',
      usesTransport: false,
      pickupPoint: '',
      previousSchool: { name: '', address: '', class: '', tcNumber: '' },
      parents: [],
      // Fee Settings
      paymentFrequency: '', // Empty = use class/school default
      customFeeStructureId: '',
    };
  }
  
  // Streams state
  const [streamsList, setStreamsList] = useState([]);
  
  // Existing parents for linking
  const [existingParents, setExistingParents] = useState([]);
  const [parentSearch, setParentSearch] = useState('');
  const [showParentSearch, setShowParentSearch] = useState(false);
  const [searchingParents, setSearchingParents] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetchInitialData();
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      fetchStudents();
      fetchStats();
    }
  }, [pagination.page, filters, sessionId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      // Fetch class sections for this session
      try {
        const sectionsRes = await classConfig.getClassSections({ academic_session_id: sessionId });
        if (sectionsRes?.success) {
          setClassSections(sectionsRes.data || []);
        }
      } catch (e) {
        console.error('Error fetching class sections:', e);
      }

      // Fetch grades
      try {
        const gradesRes = await classConfig.getClassGrades({ academic_session_id: sessionId });
        if (gradesRes?.success) {
          setClassGrades(gradesRes.data || []);
        }
      } catch (e) {
        console.error('Error fetching grades:', e);
      }
      
      // Fetch streams
      try {
        const streamsRes = await streams.getAll();
        if (streamsRes?.success) {
          setStreamsList(streamsRes.data || []);
        }
      } catch (e) {
        console.error('Error fetching streams:', e);
      }
    } catch (e) {
      console.error('Error fetching initial data:', e);
    } finally {
      setLoading(false);
    }
  };
  
  // Search existing parents
  const searchExistingParents = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setExistingParents([]);
      return;
    }
    
    setSearchingParents(true);
    try {
      const response = await people.getParents({ search: searchTerm, include_students: true });
      if (response?.success) {
        setExistingParents(response.data || []);
      }
    } catch (error) {
      console.error('Error searching parents:', error);
    } finally {
      setSearchingParents(false);
    }
  };
  
  // Link existing parent to student
  const linkExistingParent = (parent) => {
    // Check if already linked
    const alreadyLinked = formData.parents.some(p => p.id === parent.id);
    if (alreadyLinked) {
      toast.error('This parent is already linked to this student');
      return;
    }
    
    const newParent = {
      id: parent.id,
      isExisting: true, // Flag to indicate this is an existing parent
      firstName: parent.first_name || parent.firstName || '',
      lastName: parent.last_name || parent.lastName || '',
      relationship: parent.relationship || 'father',
      phone: parent.phone || '',
      email: parent.email || '',
      occupation: parent.occupation || '',
      isPrimaryContact: formData.parents.length === 0,
    };
    
    setFormData(prev => ({
      ...prev,
      parents: [...prev.parents, newParent]
    }));
    
    setShowParentSearch(false);
    setParentSearch('');
    setExistingParents([]);
    toast.success(`${newParent.firstName} ${newParent.lastName} linked successfully`);
  };

  const fetchStudents = async () => {
    try {
      const params = {
        ...filters,
        academic_session_id: sessionId,
        page: pagination.page,
        limit: pagination.limit
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      const res = await students.getAll(params);
      if (res?.success) {
        setStudentsList(res.data || []);
        setPagination(prev => ({ ...prev, ...res.pagination }));
      }
    } catch (e) {
      console.error('Error fetching students:', e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await students.getStats({ academic_session_id: sessionId });
      if (res?.success) {
        setStats(res.data);
      }
    } catch (e) {
      console.error('Error fetching stats:', e);
    }
  };

  const handleOpenModal = async (mode, student = null) => {
    setModalMode(mode);
    setActiveTab('personal');
    setAcademicMapping(null);
    
    if (mode === 'add') {
      // Get next admission number
      try {
        const res = await numberSettings.getNextAdmissionNumber();
        if (res?.success) {
          setFormData({
            ...getEmptyFormData(),
            admissionNumber: res.data.nextAdmissionNumber,
            academicSessionId: sessionId
          });
        }
      } catch (e) {
        setFormData({ ...getEmptyFormData(), academicSessionId: sessionId });
      }
    } else if (student) {
      if (mode === 'view' || mode === 'edit') {
        // Fetch full details
        try {
          const res = await students.getById(student.id);
          if (res?.success) {
            setSelectedStudent(res.data);
            setFormData({
              ...res.data,
              academicSessionId: res.data.academicSessionId || sessionId
            });
            
            // Fetch academic mapping for view mode
            if (mode === 'view') {
              fetchAcademicMapping(student.id);
            }
          }
        } catch (e) {
          toast.error('Failed to load student details');
          return;
        }
      }
    }
    
    setShowModal(true);
  };

  const fetchAcademicMapping = async (studentId) => {
    setLoadingMapping(true);
    try {
      const res = await students.getAcademicMapping(studentId);
      if (res?.success) {
        setAcademicMapping(res.data);
      }
    } catch (e) {
      console.error('Error fetching academic mapping:', e);
    } finally {
      setLoadingMapping(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
    setFormData(getEmptyFormData());
    setActiveTab('personal');
    setAcademicMapping(null);
  };

  const handleInputChange = async (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
      
      // Auto-generate roll number when class is selected (only for new students)
      if (field === 'classSectionId' && value && modalMode === 'add') {
        try {
          const res = await numberSettings.getNextRollNumber(value, sessionId);
          if (res?.success && res.data?.nextRollNumber) {
            setFormData(prev => ({ ...prev, [field]: value, rollNumber: res.data.nextRollNumber }));
          }
        } catch (e) {
          console.error('Error fetching next roll number:', e);
        }
      }
    }
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error('First name and last name are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        academicSessionId: sessionId
      };

      let res;
      if (modalMode === 'add') {
        res = await students.create(payload);
      } else {
        res = await students.update(selectedStudent.id, payload);
      }

      if (res?.success) {
        toast.success(res.message || (modalMode === 'add' ? 'Student added successfully' : 'Student updated successfully'));
        handleCloseModal();
        fetchStudents();
        fetchStats();
      } else {
        toast.error(res?.message || 'Operation failed');
      }
    } catch (e) {
      console.error('Error saving student:', e);
      toast.error('Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (student) => {
    if (!confirm(`Are you sure you want to deactivate ${student.fullName}?`)) return;
    
    try {
      const res = await students.delete(student.id);
      if (res?.success) {
        toast.success('Student deactivated successfully');
        fetchStudents();
        fetchStats();
      }
    } catch (e) {
      toast.error('Failed to deactivate student');
    }
  };

  // Parent management
  const addParent = () => {
    setFormData(prev => ({
      ...prev,
      parents: [...prev.parents, {
        relationship: 'father',
        isPrimaryContact: prev.parents.length === 0,
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        occupation: '',
        sameAsStudentAddress: true
      }]
    }));
  };

  const updateParent = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      parents: prev.parents.map((p, i) => i === index ? { ...p, [field]: value } : p)
    }));
  };

  const removeParent = (index) => {
    setFormData(prev => ({
      ...prev,
      parents: prev.parents.filter((_, i) => i !== index)
    }));
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700',
      transferred: 'bg-amber-100 text-amber-700',
      passed_out: 'bg-blue-100 text-blue-700',
      dropped: 'bg-red-100 text-red-700'
    };
    return colors[status] || colors.active;
  };

  // Export handlers
  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {
        academic_session_id: sessionId,
        ...filters
      };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      
      const blob = await students.export(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Students exported successfully');
      setShowExportModal(false);
    } catch (e) {
      console.error('Export error:', e);
      toast.error('Failed to export students');
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await students.getImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'student_import_template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Template downloaded');
    } catch (e) {
      toast.error('Failed to download template');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImportData(prev => ({ ...prev, csvData: event.target.result }));
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importData.csvData) {
      toast.error('Please select a CSV file');
      return;
    }

    setImporting(true);
    setImportResult(null);
    try {
      const res = await students.import({
        csvData: importData.csvData,
        classSectionId: importData.classSectionId || null,
        academicSessionId: sessionId
      });

      if (res?.success) {
        setImportResult(res.data);
        toast.success(res.message);
        fetchStudents();
        fetchStats();
      } else {
        toast.error(res?.message || 'Import failed');
      }
    } catch (e) {
      console.error('Import error:', e);
      toast.error('Failed to import students');
    } finally {
      setImporting(false);
    }
  };

  const handleCloseImportModal = () => {
    setShowImportModal(false);
    setImportData({ classSectionId: '', csvData: '' });
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="w-9 h-9" />
              Student Management
            </h1>
            <p className="text-white/80 mt-1">
              Manage student admissions, profiles, and records
            </p>
        </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30 transition-all"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/20 text-white rounded-xl font-medium hover:bg-white/30 transition-all"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => handleOpenModal('add')}
              className="flex items-center gap-2 px-6 py-3 bg-white text-teal-600 rounded-2xl font-semibold hover:bg-white/90 transition-all shadow-lg"
            >
              <UserPlus className="w-5 h-5" />
              Add Student
        </button>
          </div>
      </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6 pt-6 border-t border-white/20">
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <p className="text-white/70 text-sm">Total Students</p>
              <p className="text-2xl font-bold">{stats.summary?.total || 0}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <p className="text-white/70 text-sm">Active</p>
              <p className="text-2xl font-bold text-green-300">{stats.summary?.active || 0}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <p className="text-white/70 text-sm">Male</p>
              <p className="text-2xl font-bold">{stats.summary?.male || 0}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <p className="text-white/70 text-sm">Female</p>
              <p className="text-2xl font-bold">{stats.summary?.female || 0}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <p className="text-white/70 text-sm">Transferred</p>
              <p className="text-2xl font-bold text-amber-300">{stats.summary?.transferred || 0}</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
              <p className="text-white/70 text-sm">Passed Out</p>
              <p className="text-2xl font-bold text-blue-300">{stats.summary?.passedOut || 0}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-5">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
              placeholder="Search by name, admission number, phone..."
              value={filters.search}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, search: e.target.value }));
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-teal-500"
          />
        </div>

          {/* Class Filter */}
          <select
            value={filters.class_section_id}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, class_section_id: e.target.value }));
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-teal-500 min-w-[180px]"
          >
            <option value="">All Classes</option>
            {classSections.map(cs => (
              <option key={cs.id} value={cs.id}>
                {cs.gradeName || cs.gradeDisplayName} - {cs.sectionName}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, status: e.target.value }));
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-teal-500"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="transferred">Transferred</option>
            <option value="passed_out">Passed Out</option>
            <option value="all">All Status</option>
          </select>

          {/* Refresh */}
          <button
            onClick={() => { fetchStudents(); fetchStats(); }}
            className="p-3 text-gray-600 hover:bg-gray-100 rounded-xl"
          >
            <RefreshCw className="w-5 h-5" />
        </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">Student</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">Admission No.</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">Class</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">Roll No.</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">Gender</th>
                <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">Contact</th>
                <th className="px-4 py-4 text-center text-sm font-semibold text-gray-600">Status</th>
                <th className="px-4 py-4 text-center text-sm font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
            <tbody className="divide-y divide-gray-100">
              {studentsList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium">No students found</p>
                    <p className="text-sm">Add students to get started</p>
                  </td>
                </tr>
              ) : (
                studentsList.map(student => (
              <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                          {student.firstName?.[0]}{student.lastName?.[0]}
                    </div>
                    <div>
                          <p className="font-medium text-gray-800">{student.fullName}</p>
                          <p className="text-xs text-gray-500">{student.email || 'No email'}</p>
                    </div>
                  </div>
                </td>
                    <td className="px-4 py-4">
                      <span className="font-mono text-sm text-gray-700">{student.admissionNumber || '-'}</span>
                </td>
                    <td className="px-4 py-4">
                      <span className="text-gray-700">{student.className || 'Not assigned'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-gray-700">{student.rollNumber || '-'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        student.gender === 'male' ? 'bg-blue-100 text-blue-700' : 
                        student.gender === 'female' ? 'bg-pink-100 text-pink-700' : 
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {student.gender || 'N/A'}
                  </span>
                </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-600">
                        {student.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {student.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
                    {student.status}
                  </span>
                </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => navigate(`/students/${student.id}`)}
                          className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                    </button>
                        <button
                          onClick={() => navigate(`/students/${student.id}?mode=edit`)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
                ))
              )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} students
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-4 py-2 font-medium">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit/View Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-6 rounded-t-3xl text-white">
      <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">
                      {modalMode === 'add' ? 'New Student Admission' : 
                       modalMode === 'edit' ? 'Edit Student' : 'Student Details'}
                    </h2>
                    <p className="text-white/70 text-sm">
                      {modalMode === 'add' ? 'Fill in the student information' : 
                       formData.admissionNumber || 'Student Profile'}
        </p>
                  </div>
                </div>
                <button onClick={handleCloseModal} className="p-2 hover:bg-white/20 rounded-lg">
                  <X className="w-6 h-6" />
          </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mt-6 overflow-x-auto pb-2">
                {[
                  { id: 'personal', label: 'Personal', icon: User },
                  { id: 'contact', label: 'Contact', icon: Phone },
                  { id: 'academic', label: 'Academic', icon: GraduationCap },
                  { id: 'parents', label: 'Parents', icon: Users },
                  { id: 'other', label: 'Other', icon: FileText },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? 'bg-white text-teal-600'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
          </button>
                ))}
        </div>
      </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {/* Personal Tab */}
              {activeTab === 'personal' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      disabled={modalMode === 'view'}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                    <input
                      type="text"
                      value={formData.middleName}
                      onChange={(e) => handleInputChange('middleName', e.target.value)}
                      disabled={modalMode === 'view'}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                      placeholder="Middle name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      disabled={modalMode === 'view'}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                      placeholder="Last name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.dateOfBirth || ''}
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      disabled={modalMode === 'view'}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      disabled={modalMode === 'view'}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                    <select
                      value={formData.bloodGroup}
                      onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                      disabled={modalMode === 'view'}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                    >
                      <option value="">Select blood group</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => handleInputChange('nationality', e.target.value)}
                      disabled={modalMode === 'view'}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                    <input
                      type="text"
                      value={formData.religion}
                      onChange={(e) => handleInputChange('religion', e.target.value)}
                      disabled={modalMode === 'view'}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                      placeholder="Religion"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      disabled={modalMode === 'view'}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                    >
                      <option value="">Select category</option>
                      <option value="General">General</option>
                      <option value="OBC">OBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                      <option value="EWS">EWS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
                    <input
                      type="text"
                      value={formData.aadharNumber}
                      onChange={(e) => handleInputChange('aadharNumber', e.target.value)}
                      disabled={modalMode === 'view'}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                      placeholder="12 digit Aadhar"
                      maxLength={12}
                    />
                  </div>
                </div>
              )}

              {/* Contact Tab */}
              {activeTab === 'contact' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={modalMode === 'view'}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                        placeholder="student@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        disabled={modalMode === 'view'}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Phone</label>
                      <input
                        type="tel"
                        value={formData.alternatePhone}
                        onChange={(e) => handleInputChange('alternatePhone', e.target.value)}
                        disabled={modalMode === 'view'}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                        placeholder="+91 XXXXX XXXXX"
                      />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Address
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1</label>
                        <input
                          type="text"
                          value={formData.address?.line1 || ''}
                          onChange={(e) => handleInputChange('address.line1', e.target.value)}
                          disabled={modalMode === 'view'}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                          placeholder="House no, Street name"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                        <input
                          type="text"
                          value={formData.address?.line2 || ''}
                          onChange={(e) => handleInputChange('address.line2', e.target.value)}
                          disabled={modalMode === 'view'}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                          placeholder="Locality, Landmark"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          value={formData.address?.city || ''}
                          onChange={(e) => handleInputChange('address.city', e.target.value)}
                          disabled={modalMode === 'view'}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <input
                          type="text"
                          value={formData.address?.state || ''}
                          onChange={(e) => handleInputChange('address.state', e.target.value)}
                          disabled={modalMode === 'view'}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                        <input
                          type="text"
                          value={formData.address?.pincode || ''}
                          onChange={(e) => handleInputChange('address.pincode', e.target.value)}
                          disabled={modalMode === 'view'}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                          maxLength={6}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                        <input
                          type="text"
                          value={formData.address?.country || 'India'}
                          onChange={(e) => handleInputChange('address.country', e.target.value)}
                          disabled={modalMode === 'view'}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Academic Tab */}
              {activeTab === 'academic' && (
                <div className="space-y-6">
                  {/* Basic Academic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Admission Number</label>
                      <input
                        type="text"
                        value={formData.admissionNumber}
                        onChange={(e) => handleInputChange('admissionNumber', e.target.value)}
                        disabled={modalMode === 'view'}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Admission Date</label>
                      <input
                        type="date"
                        value={formData.admissionDate || ''}
                        onChange={(e) => handleInputChange('admissionDate', e.target.value)}
                        disabled={modalMode === 'view'}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class & Section</label>
                      <select
                        value={formData.classSectionId}
                        onChange={(e) => handleInputChange('classSectionId', e.target.value)}
                        disabled={modalMode === 'view'}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                      >
                        <option value="">Select class</option>
                        {classSections.map(cs => (
                          <option key={cs.id} value={cs.id}>
                            {cs.gradeName || cs.gradeDisplayName} - {cs.sectionName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                      <input
                        type="text"
                        value={formData.rollNumber}
                        onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                        disabled={modalMode === 'view'}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Stream / Course
                        <span className="text-xs text-gray-400 ml-1">(for higher classes)</span>
                      </label>
                      <select
                        value={formData.streamId || ''}
                        onChange={(e) => handleInputChange('streamId', e.target.value)}
                        disabled={modalMode === 'view'}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                      >
                        <option value="">Select Stream (Optional)</option>
                        {streamsList.filter(s => s.is_active).map(stream => (
                          <option key={stream.id} value={stream.id}>
                            {stream.display_name || stream.name}
                          </option>
                        ))}
                      </select>
                      {formData.streamId && (
                        <p className="text-xs text-gray-500 mt-1">
                          {streamsList.find(s => s.id === formData.streamId)?.description || ''}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Academic Mapping - Only in View Mode */}
                  {modalMode === 'view' && (
                    <div className="border-t pt-4">
                      {loadingMapping ? (
                        <div className="flex items-center justify-center py-8">
                          <RefreshCw className="w-6 h-6 animate-spin text-teal-600" />
                          <span className="ml-2 text-gray-500">Loading academic details...</span>
                        </div>
                      ) : academicMapping ? (
                        <div className="space-y-6">
                          {/* Summary Cards */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-3 border border-teal-100">
                              <p className="text-xs text-teal-600 font-medium">Total Subjects</p>
                              <p className="text-2xl font-bold text-teal-700">{academicMapping.summary?.totalSubjects || 0}</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
                              <p className="text-xs text-blue-600 font-medium">Teachers</p>
                              <p className="text-2xl font-bold text-blue-700">{academicMapping.summary?.totalTeachers || 0}</p>
                            </div>
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-100">
                              <p className="text-xs text-amber-600 font-medium">Total Fees</p>
                              <p className="text-xl font-bold text-amber-700">₹{(academicMapping.summary?.totalFees || 0).toLocaleString()}</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-100">
                              <p className="text-xs text-purple-600 font-medium">Class Teacher</p>
                              <p className="text-sm font-semibold text-purple-700 truncate">
                                {academicMapping.summary?.classTeacher?.name || 'Not Assigned'}
                              </p>
                            </div>
                          </div>

                          {/* Subjects & Teachers */}
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                              <GraduationCap className="w-4 h-4 text-teal-600" />
                              Subjects & Teachers ({academicMapping.subjects?.length || 0})
                            </h4>
                            {academicMapping.subjects?.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {academicMapping.subjects.map((sub, idx) => (
                                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                                    <div>
                                      <p className="font-medium text-gray-800">{sub.name}</p>
                                      <p className="text-xs text-gray-500">
                                        {sub.code && <span className="mr-2">{sub.code}</span>}
                                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                                          sub.isOptional ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'
                                        }`}>
                                          {sub.isOptional ? 'Optional' : 'Mandatory'}
                                        </span>
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      {sub.teacher ? (
                                        <p className="text-sm text-gray-700">{sub.teacher.name}</p>
                                      ) : (
                                        <p className="text-xs text-gray-400 italic">No teacher</p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-400 text-sm py-4 text-center">No subjects configured for this class</p>
                            )}
                          </div>

                          {/* Fees Applicable */}
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-amber-600" />
                              Applicable Fees ({academicMapping.fees?.items?.length || 0})
                            </h4>
                            {academicMapping.fees?.items?.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-gray-100 text-gray-600">
                                      <th className="px-3 py-2 text-left rounded-l-lg">Fee Type</th>
                                      <th className="px-3 py-2 text-left">Category</th>
                                      <th className="px-3 py-2 text-right">Amount</th>
                                      <th className="px-3 py-2 text-left rounded-r-lg">Due Date</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {academicMapping.fees.items.map((fee, idx) => (
                                      <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 font-medium">{fee.feeType}</td>
                                        <td className="px-3 py-2 capitalize">{fee.category}</td>
                                        <td className="px-3 py-2 text-right font-semibold text-amber-700">
                                          ₹{fee.amount.toLocaleString()}
                                        </td>
                                        <td className="px-3 py-2 text-gray-600">
                                          {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : '-'}
                                        </td>
                                      </tr>
                                    ))}
                                    <tr className="bg-amber-50 font-semibold">
                                      <td colSpan={2} className="px-3 py-2 text-right">Total:</td>
                                      <td className="px-3 py-2 text-right text-amber-700">
                                        ₹{academicMapping.fees.totalAmount?.toLocaleString() || 0}
                                      </td>
                                      <td></td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p className="text-gray-400 text-sm py-4 text-center">No fee structure configured for this class</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm py-4 text-center">
                          {formData.classSectionId ? 'Unable to load academic mapping' : 'Assign a class to view academic details'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Previous School Details */}
                  <div className="border-t pt-4 mt-2">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Previous School Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                        <input
                          type="text"
                          value={formData.previousSchool?.name || ''}
                          onChange={(e) => handleInputChange('previousSchool.name', e.target.value)}
                          disabled={modalMode === 'view'}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Class Attended</label>
                        <input
                          type="text"
                          value={formData.previousSchool?.class || ''}
                          onChange={(e) => handleInputChange('previousSchool.class', e.target.value)}
                          disabled={modalMode === 'view'}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">School Address</label>
                        <textarea
                          value={formData.previousSchool?.address || ''}
                          onChange={(e) => handleInputChange('previousSchool.address', e.target.value)}
                          disabled={modalMode === 'view'}
                          rows={2}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">TC Number</label>
                        <input
                          type="text"
                          value={formData.previousSchool?.tcNumber || ''}
                          onChange={(e) => handleInputChange('previousSchool.tcNumber', e.target.value)}
                          disabled={modalMode === 'view'}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Parents Tab */}
              {activeTab === 'parents' && (
                <div className="space-y-4">
                  {/* Link Existing Parent Section */}
                  {modalMode !== 'view' && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-semibold text-blue-800 flex items-center gap-2">
                          <Search className="w-4 h-4" />
                          Link Existing Parent
                        </h5>
                        <button
                          onClick={() => setShowParentSearch(!showParentSearch)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {showParentSearch ? 'Hide' : 'Show'} Search
                        </button>
                      </div>
                      
                      {showParentSearch && (
                        <div className="space-y-3">
                          <p className="text-xs text-blue-600">
                            Search by parent name, phone, or email to link an existing parent
                          </p>
                          <div className="relative">
                            <input
                              type="text"
                              value={parentSearch}
                              onChange={(e) => {
                                setParentSearch(e.target.value);
                                searchExistingParents(e.target.value);
                              }}
                              placeholder="Search by name, phone, or email..."
                              className="w-full px-4 py-2.5 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 pr-10"
                            />
                            {searchingParents && (
                              <RefreshCw className="absolute right-3 top-3 w-4 h-4 text-blue-400 animate-spin" />
                            )}
                          </div>
                          
                          {/* Search Results */}
                          {existingParents.length > 0 && (
                            <div className="max-h-48 overflow-y-auto space-y-2">
                              {existingParents.map(parent => (
                                <div
                                  key={parent.id}
                                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                                >
                                  <div>
                                    <p className="font-medium text-gray-800">
                                      {parent.first_name || parent.firstName} {parent.last_name || parent.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {parent.phone} • {parent.email || 'No email'}
                                    </p>
                                    {parent.linkedStudents && parent.linkedStudents.length > 0 && (
                                      <p className="text-xs text-blue-600 mt-1">
                                        Already linked to: {parent.linkedStudents.map(s => s.name).join(', ')}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => linkExistingParent(parent)}
                                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                                  >
                                    Link
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {parentSearch.length >= 2 && !searchingParents && existingParents.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-2">
                              No existing parents found. Add a new one below.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {formData.parents?.length === 0 && modalMode !== 'view' && !showParentSearch && (
                    <div className="text-center py-8 text-gray-400">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No parents/guardians added yet</p>
                      <p className="text-sm mt-2">Use "Link Existing Parent" above or add a new one below</p>
                    </div>
                  )}

                  {formData.parents?.map((parent, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="font-semibold text-gray-700">
                          {parent.relationship === 'father' ? 'Father' :
                           parent.relationship === 'mother' ? 'Mother' :
                           parent.relationship === 'guardian' ? 'Guardian' : 'Parent'} Details
                        </h5>
                        {modalMode !== 'view' && (
                          <button
                            onClick={() => removeParent(idx)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                          <select
                            value={parent.relationship}
                            onChange={(e) => updateParent(idx, 'relationship', e.target.value)}
                            disabled={modalMode === 'view'}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                          >
                            <option value="father">Father</option>
                            <option value="mother">Mother</option>
                            <option value="guardian">Guardian</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                          <input
                            type="text"
                            value={parent.firstName}
                            onChange={(e) => updateParent(idx, 'firstName', e.target.value)}
                            disabled={modalMode === 'view'}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                          <input
                            type="text"
                            value={parent.lastName || ''}
                            onChange={(e) => updateParent(idx, 'lastName', e.target.value)}
                            disabled={modalMode === 'view'}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                          <input
                            type="tel"
                            value={parent.phone}
                            onChange={(e) => updateParent(idx, 'phone', e.target.value)}
                            disabled={modalMode === 'view'}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={parent.email || ''}
                            onChange={(e) => updateParent(idx, 'email', e.target.value)}
                            disabled={modalMode === 'view'}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                          <input
                            type="text"
                            value={parent.occupation || ''}
                            onChange={(e) => updateParent(idx, 'occupation', e.target.value)}
                            disabled={modalMode === 'view'}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`primary-${idx}`}
                            checked={parent.isPrimaryContact}
                            onChange={(e) => updateParent(idx, 'isPrimaryContact', e.target.checked)}
                            disabled={modalMode === 'view'}
                            className="w-4 h-4 text-teal-600 border-gray-300 rounded"
                          />
                          <label htmlFor={`primary-${idx}`} className="text-sm text-gray-700">Primary Contact</label>
                        </div>
                      </div>
                    </div>
                  ))}

                  {modalMode !== 'view' && (
                    <button
                      onClick={addParent}
                      className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-teal-400 hover:text-teal-600 flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-5 h-5" />
                      Add Parent/Guardian
                    </button>
                  )}
                </div>
              )}

              {/* Other Tab */}
              {activeTab === 'other' && (
                <div className="space-y-6">
                  {/* Medical */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      Medical Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Medical Conditions</label>
                        <textarea
                          value={formData.medicalConditions}
                          onChange={(e) => handleInputChange('medicalConditions', e.target.value)}
                          disabled={modalMode === 'view'}
                          rows={2}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                          placeholder="Any medical conditions..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                        <textarea
                          value={formData.allergies}
                          onChange={(e) => handleInputChange('allergies', e.target.value)}
                          disabled={modalMode === 'view'}
                          rows={2}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                          placeholder="Any allergies..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Transport */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Bus className="w-4 h-4 text-amber-500" />
                      Transport
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="usesTransport"
                          checked={formData.usesTransport}
                          onChange={(e) => handleInputChange('usesTransport', e.target.checked)}
                          disabled={modalMode === 'view'}
                          className="w-4 h-4 text-teal-600 border-gray-300 rounded"
                        />
                        <label htmlFor="usesTransport" className="text-sm text-gray-700">Uses School Transport</label>
                      </div>
                      {formData.usesTransport && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Point</label>
                          <input
                            type="text"
                            value={formData.pickupPoint}
                            onChange={(e) => handleInputChange('pickupPoint', e.target.value)}
                            disabled={modalMode === 'view'}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                            placeholder="Bus stop / pickup location"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Fee Settings */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-500" />
                      Fee Payment Settings
                    </h4>
                    <div className="bg-green-50 p-4 rounded-xl">
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Payment Frequency
                            <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                          </label>
                          <select
                            value={formData.paymentFrequency || ''}
                            onChange={(e) => handleInputChange('paymentFrequency', e.target.value)}
                            disabled={modalMode === 'view'}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
                          >
                            <option value="">Use Class/School Default</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly (Every 3 months)</option>
                            <option value="half_yearly">Half-Yearly (Every 6 months)</option>
                            <option value="yearly">Yearly (Annual)</option>
                          </select>
                          <p className="text-xs text-gray-500 mt-1">
                            Override default payment schedule for this student (e.g., for scholarship students)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status (only for edit) */}
                  {modalMode === 'edit' && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-gray-800 mb-4">Status</h4>
                      <select
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="transferred">Transferred</option>
                        <option value="passed_out">Passed Out</option>
                        <option value="dropped">Dropped</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-3xl flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl font-medium"
              >
                {modalMode === 'view' ? 'Close' : 'Cancel'}
              </button>
              {modalMode !== 'view' && (
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-6 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {modalMode === 'add' ? 'Add Student' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Download className="w-6 h-6 text-teal-600" />
                  Export Students
                </h3>
                <button onClick={() => setShowExportModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-teal-50 rounded-xl p-4">
                <p className="text-sm text-teal-800">
                  Export will include students based on current filters:
                </p>
                <ul className="mt-2 text-sm text-teal-700 space-y-1">
                  <li>• Class: {filters.class_section_id ? classSections.find(c => c.id === filters.class_section_id)?.gradeName + ' ' + classSections.find(c => c.id === filters.class_section_id)?.sectionName : 'All Classes'}</li>
                  <li>• Status: {filters.status || 'All'}</li>
                  <li>• Search: {filters.search || 'None'}</li>
                </ul>
              </div>

              <p className="text-sm text-gray-500">
                The export will include student details, address, and parent information in CSV format.
              </p>
            </div>

            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <button onClick={() => setShowExportModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-xl">
                Cancel
              </button>
              <button onClick={handleExport} disabled={exporting}
                className="px-6 py-2 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
                {exporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Upload className="w-6 h-6 text-teal-600" />
                  Import Students
                </h3>
                <button onClick={handleCloseImportModal} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Download Template */}
              <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-800">Download Template</p>
                  <p className="text-sm text-blue-600">Get the CSV template with correct headers</p>
                </div>
                <button onClick={handleDownloadTemplate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Template
                </button>
              </div>

              {/* Class Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assign to Class (Optional)</label>
                <select
                  value={importData.classSectionId}
                  onChange={(e) => setImportData(prev => ({ ...prev, classSectionId: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Select Class (or leave blank) --</option>
                  {classSections.map(cs => (
                    <option key={cs.id} value={cs.id}>
                      {cs.gradeName || cs.gradeDisplayName} - {cs.sectionName}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select CSV File</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-teal-400 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 font-medium">Click to select CSV file</p>
                    <p className="text-sm text-gray-400 mt-1">or drag and drop</p>
                  </label>
                </div>
                {importData.csvData && (
                  <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    File loaded ({importData.csvData.split('\n').length - 1} rows detected)
                  </p>
                )}
              </div>

              {/* Import Results */}
              {importResult && (
                <div className={`rounded-xl p-4 ${importResult.failed > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    {importResult.failed > 0 ? (
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    Import Results
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-700 font-medium">{importResult.success}</span> imported
                    </div>
                    <div>
                      <span className="text-red-700 font-medium">{importResult.failed}</span> failed
                    </div>
                  </div>
                  {importResult.errors?.length > 0 && (
                    <div className="mt-3 max-h-32 overflow-y-auto">
                      <p className="text-xs font-medium text-red-700 mb-1">Errors:</p>
                      {importResult.errors.slice(0, 5).map((err, idx) => (
                        <p key={idx} className="text-xs text-red-600">{err}</p>
                      ))}
                      {importResult.errors.length > 5 && (
                        <p className="text-xs text-red-500 mt-1">... and {importResult.errors.length - 5} more</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <button onClick={handleCloseImportModal}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-xl">
                {importResult ? 'Close' : 'Cancel'}
              </button>
              {!importResult && (
                <button onClick={handleImport} disabled={importing || !importData.csvData}
                  className="px-6 py-2 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
                  {importing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Import Students
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
