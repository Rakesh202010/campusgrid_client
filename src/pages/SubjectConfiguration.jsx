import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  Layers,
  Calendar,
  Check,
  AlertCircle,
  Loader2,
  Copy,
  ChevronDown,
  Palette
} from 'lucide-react';
import { subjects, academicSessions, classConfig, departments as departmentsApi } from '../services/api';
import { useAcademicSession } from '../contexts/AcademicSessionContext';
import { toast } from '../utils/toast';

// Predefined subject templates
const SUBJECT_TEMPLATES = [
  { name: 'English', code: 'ENG', category: 'core', color: '#3B82F6' },
  { name: 'Hindi', code: 'HIN', category: 'language', color: '#F59E0B' },
  { name: 'Mathematics', code: 'MATH', category: 'core', color: '#10B981' },
  { name: 'Science', code: 'SCI', category: 'core', color: '#8B5CF6' },
  { name: 'Social Studies', code: 'SST', category: 'core', color: '#EC4899' },
  { name: 'Computer Science', code: 'CS', category: 'elective', color: '#06B6D4' },
  { name: 'Physical Education', code: 'PE', category: 'co-curricular', color: '#EF4444' },
  { name: 'Art & Craft', code: 'ART', category: 'co-curricular', color: '#F97316' },
  { name: 'Music', code: 'MUS', category: 'co-curricular', color: '#A855F7' },
  { name: 'Sanskrit', code: 'SKT', category: 'language', color: '#84CC16' },
  { name: 'Environmental Studies', code: 'EVS', category: 'core', color: '#22C55E' },
  { name: 'General Knowledge', code: 'GK', category: 'elective', color: '#6366F1' },
];

const CATEGORY_OPTIONS = [
  { value: 'core', label: 'Core Subject', color: 'bg-blue-100 text-blue-700' },
  { value: 'elective', label: 'Elective', color: 'bg-purple-100 text-purple-700' },
  { value: 'language', label: 'Language', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'vocational', label: 'Vocational', color: 'bg-green-100 text-green-700' },
  { value: 'co-curricular', label: 'Co-Curricular', color: 'bg-pink-100 text-pink-700' },
];

const SubjectConfiguration = () => {
  const { currentSession, sessionId, sessions: contextSessions } = useAcademicSession();
  
  const [activeTab, setActiveTab] = useState('subjects');
  
  // Data state
  const [subjectsList, setSubjectsList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [curriculum, setCurriculum] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [classSections, setClassSections] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [selectedClassSectionId, setSelectedClassSectionId] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form state
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    code: '',
    displayName: '',
    description: '',
    category: 'core',
    departmentId: '',
    subjectType: 'theory',
    isMandatory: true,
    creditHours: 0,
    maxMarks: 100,
    passingMarks: 33,
    color: '#3B82F6',
    isActive: true
  });

  const [assignForm, setAssignForm] = useState({
    subjectId: '',
    periodsPerWeek: 5,
    isOptional: false
  });

  useEffect(() => {
    if (sessionId) {
      setSelectedSessionId(sessionId);
      fetchInitialData();
    }
  }, [sessionId]);

  useEffect(() => {
    if (contextSessions?.length > 0) {
      setSessions(contextSessions);
    }
  }, [contextSessions]);

  useEffect(() => {
    if (selectedSessionId) {
      fetchClassSections();
    }
  }, [selectedSessionId]);

  useEffect(() => {
    if (selectedClassSectionId && selectedSessionId) {
      fetchCurriculum();
    }
  }, [selectedClassSectionId, selectedSessionId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [subjectsRes, sessionsRes, departmentsRes] = await Promise.all([
        subjects.getAll({ academic_session_id: sessionId }),
        academicSessions.getAll(),
        departmentsApi.getAll()
      ]);

      if (subjectsRes?.success) setSubjectsList(subjectsRes.data || []);
      if (sessionsRes?.success) setSessions(sessionsRes.data || []);
      if (departmentsRes?.success) setDepartmentsList(departmentsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchClassSections = async () => {
    if (!selectedSessionId) return;
    try {
      const response = await classConfig.getClassSections({ academic_session_id: selectedSessionId });
      if (response?.success) {
        setClassSections(response.data || []);
        if (response.data?.length > 0 && !selectedClassSectionId) {
          setSelectedClassSectionId(response.data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching class sections:', error);
    }
  };

  const fetchCurriculum = async () => {
    if (!selectedClassSectionId || !selectedSessionId) return;
    try {
      const response = await subjects.getCurriculum({ 
        class_section_id: selectedClassSectionId,
        academic_session_id: selectedSessionId 
      });
      if (response?.success) {
        setCurriculum(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching curriculum:', error);
    }
  };

  const selectedSession = sessions.find(s => s.id === selectedSessionId);
  const selectedClassSection = classSections.find(cs => cs.id === selectedClassSectionId);

  // Subject handlers
  const openSubjectModal = (subject = null) => {
    if (subject) {
      setEditingItem(subject);
      setSubjectForm({
        name: subject.name,
        code: subject.code,
        displayName: subject.displayName || '',
        description: subject.description || '',
        category: subject.category || 'core',
        departmentId: subject.departmentId || '',
        subjectType: subject.subjectType || 'theory',
        isMandatory: subject.isMandatory !== false,
        creditHours: subject.creditHours || 0,
        maxMarks: subject.maxMarks || 100,
        passingMarks: subject.passingMarks || 33,
        color: subject.color || '#3B82F6',
        isActive: subject.isActive !== false
      });
    } else {
      setEditingItem(null);
      setSubjectForm({
        name: '',
        code: '',
        displayName: '',
        description: '',
        category: 'core',
        departmentId: '',
        subjectType: 'theory',
        isMandatory: true,
        creditHours: 0,
        maxMarks: 100,
        passingMarks: 33,
        color: '#3B82F6',
        isActive: true
      });
    }
    setShowSubjectModal(true);
  };

  const handleSubjectSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (editingItem) {
        response = await subjects.update(editingItem.id, subjectForm);
      } else {
        response = await subjects.create(subjectForm);
      }

      if (response?.success) {
        toast.success(editingItem ? 'Subject updated' : 'Subject created');
        setShowSubjectModal(false);
        fetchInitialData();
      } else {
        toast.error(response?.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Failed to save subject');
    }
  };

  const handleDeleteSubject = async (id) => {
    try {
      const response = await subjects.delete(id);
      if (response?.success) {
        toast.success('Subject deleted');
        setShowDeleteConfirm(null);
        fetchInitialData();
      } else {
        toast.error(response?.message || 'Failed to delete');
      }
    } catch (error) {
      toast.error('Failed to delete subject');
    }
  };

  const handleQuickAddSubjects = async () => {
    const existingCodes = subjectsList.map(s => s.code);
    const toAdd = SUBJECT_TEMPLATES.filter(t => !existingCodes.includes(t.code));
    
    if (toAdd.length === 0) {
      toast.info('All common subjects already exist');
      return;
    }

    try {
      const response = await subjects.bulkCreate(toAdd);
      if (response?.success) {
        toast.success(response.message);
        fetchInitialData();
      } else {
        toast.error(response?.message || 'Failed to add subjects');
      }
    } catch (error) {
      toast.error('Failed to add subjects');
    }
  };

  // Curriculum handlers
  const openAssignModal = () => {
    setAssignForm({
      subjectId: '',
      periodsPerWeek: 5,
      isOptional: false
    });
    setShowAssignModal(true);
  };

  const handleAssignSubject = async (e) => {
    e.preventDefault();
    if (!selectedClassSectionId || !assignForm.subjectId) {
      toast.error('Please select a class and subject');
      return;
    }

    try {
      const response = await subjects.assignToClass({
        classSectionId: selectedClassSectionId,
        subjectId: assignForm.subjectId,
        academicSessionId: selectedSessionId,
        periodsPerWeek: assignForm.periodsPerWeek,
        isOptional: assignForm.isOptional
      });

      if (response?.success) {
        toast.success('Subject assigned to class');
        setShowAssignModal(false);
        fetchCurriculum();
      } else {
        toast.error(response?.message || 'Failed to assign');
      }
    } catch (error) {
      toast.error('Failed to assign subject');
    }
  };

  const handleRemoveFromClass = async (id) => {
    try {
      const response = await subjects.removeFromClass(id);
      if (response?.success) {
        toast.success('Subject removed from class');
        setShowDeleteConfirm(null);
        fetchCurriculum();
      } else {
        toast.error(response?.message || 'Failed to remove');
      }
    } catch (error) {
      toast.error('Failed to remove subject');
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedClassSectionId || subjectsList.length === 0) {
      toast.error('Please select a class and ensure subjects exist');
      return;
    }

    // Assign all core and language subjects
    const coreSubjects = subjectsList.filter(s => 
      s.category === 'core' || s.category === 'language'
    );

    if (coreSubjects.length === 0) {
      toast.info('No core/language subjects to assign');
      return;
    }

    try {
      const response = await subjects.bulkAssign({
        classSectionId: selectedClassSectionId,
        subjectIds: coreSubjects.map(s => s.id),
        academicSessionId: selectedSessionId,
        periodsPerWeek: 5
      });

      if (response?.success) {
        toast.success(response.message);
        fetchCurriculum();
      } else {
        toast.error(response?.message || 'Failed to assign subjects');
      }
    } catch (error) {
      toast.error('Failed to assign subjects');
    }
  };

  const getCategoryStyle = (category) => {
    const cat = CATEGORY_OPTIONS.find(c => c.value === category);
    return cat?.color || 'bg-gray-100 text-gray-700';
  };

  const tabs = [
    { id: 'subjects', label: 'Subjects', icon: BookOpen, count: subjectsList.length },
    { id: 'curriculum', label: 'Curriculum Mapping', icon: Layers, count: curriculum.length },
  ];

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
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Subject & Curriculum Configuration</h1>
        <p className="text-gray-600 mt-1">Manage subjects and assign them to classes</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              activeTab === tab.id
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* SUBJECTS TAB */}
      {activeTab === 'subjects' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Subjects Master List</h3>
              <p className="text-sm text-gray-500 mt-1">Define all subjects taught in your school</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleQuickAddSubjects}
                className="px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
              >
                Quick Add Common
              </button>
              <button
                onClick={() => openSubjectModal()}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4" />
                Add Subject
              </button>
            </div>
          </div>

          {subjectsList.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Subjects Yet</h3>
              <p className="text-gray-600 mb-4">Start by adding subjects or use Quick Add</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subjectsList.map(subject => (
                <div
                  key={subject.id}
                  className="p-4 rounded-xl border-2 border-gray-200 hover:border-blue-200 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: subject.color || '#3B82F6' }}
                      >
                        {subject.code?.substring(0, 2) || subject.name?.substring(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{subject.displayName || subject.name}</h4>
                        <p className="text-xs text-gray-500">{subject.code}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openSubjectModal(subject)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm({ type: 'subject', item: subject })}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {subject.departmentId && (
                      <span className="px-2 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full font-medium">
                        {departmentsList.find(d => d.id === subject.departmentId)?.name || 'Department'}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getCategoryStyle(subject.category)}`}>
                      {CATEGORY_OPTIONS.find(c => c.value === subject.category)?.label || subject.category}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                      {subject.subjectType}
                    </span>
                    {subject.isMandatory && (
                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">
                        Mandatory
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CURRICULUM TAB */}
      {activeTab === 'curriculum' && (
        <div className="card">
          {/* Session & Class Selector Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Curriculum Mapping</h3>
              <p className="text-sm text-gray-500 mt-1">
                Assign subjects to classes for each academic session
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Session Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowSessionDropdown(!showSessionDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors min-w-[180px]"
                >
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="flex-1 text-left text-sm">
                    {selectedSession?.name || 'Select Session'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                
                {showSessionDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-auto">
                    {sessions.map(session => (
                      <button
                        key={session.id}
                        onClick={() => {
                          setSelectedSessionId(session.id);
                          setShowSessionDropdown(false);
                          setSelectedClassSectionId(null);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                          selectedSessionId === session.id ? 'bg-blue-50 text-blue-600' : ''
                        }`}
                      >
                        {session.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Class Section Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowClassDropdown(!showClassDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors min-w-[180px]"
                >
                  <Layers className="w-4 h-4 text-gray-500" />
                  <span className="flex-1 text-left text-sm">
                    {selectedClassSection?.displayName || 'Select Class'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                
                {showClassDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-auto">
                    {classSections.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">No classes for this session</div>
                    ) : (
                      classSections.map(cs => (
                        <button
                          key={cs.id}
                          onClick={() => {
                            setSelectedClassSectionId(cs.id);
                            setShowClassDropdown(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                            selectedClassSectionId === cs.id ? 'bg-blue-50 text-blue-600' : ''
                          }`}
                        >
                          {cs.displayName}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleBulkAssign}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Assign Core Subjects
              </button>

              <button
                onClick={openAssignModal}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="w-4 h-4" />
                Assign Subject
              </button>
            </div>
          </div>

          {/* Info Banner */}
          {selectedSession && selectedClassSection && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-6">
              <Layers className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">
                {selectedClassSection.displayName} • {selectedSession.name}
              </span>
              <span className="text-sm text-blue-600 ml-auto">
                {curriculum.length} subjects assigned
              </span>
            </div>
          )}

          {!selectedSessionId || !selectedClassSectionId ? (
            <div className="text-center py-12">
              <Layers className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">Select Session & Class</h3>
              <p className="text-gray-600">Please select an academic session and class to manage curriculum</p>
            </div>
          ) : curriculum.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Subjects Assigned</h3>
              <p className="text-gray-600 mb-4">Assign subjects to this class</p>
              <button
                onClick={handleBulkAssign}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Click here to assign all core subjects
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {curriculum.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 hover:border-blue-200 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: item.subjectColor || '#3B82F6' }}
                    >
                      {item.subjectCode?.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-800">{item.subjectDisplayName || item.subjectName}</h4>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{item.periodsPerWeek} periods/week</span>
                        {item.isOptional && (
                          <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">Optional</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDeleteConfirm({ type: 'curriculum', item })}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBJECT MODAL */}
      {showSubjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingItem ? 'Edit Subject' : 'Add New Subject'}
                </h3>
                <button onClick={() => setShowSubjectModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubjectSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={subjectForm.name}
                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    placeholder="e.g., Mathematics"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                  <input
                    type="text"
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., MATH"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  value={subjectForm.displayName}
                  onChange={(e) => setSubjectForm({ ...subjectForm, displayName: e.target.value })}
                  placeholder="e.g., Mathematics"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                <select
                  value={subjectForm.departmentId}
                  onChange={(e) => setSubjectForm({ ...subjectForm, departmentId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Department</option>
                  {departmentsList.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={subjectForm.category}
                    onChange={(e) => setSubjectForm({ ...subjectForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {CATEGORY_OPTIONS.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={subjectForm.subjectType}
                    onChange={(e) => setSubjectForm({ ...subjectForm, subjectType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="theory">Theory</option>
                    <option value="practical">Practical</option>
                    <option value="both">Theory & Practical</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Marks</label>
                  <input
                    type="number"
                    value={subjectForm.maxMarks}
                    onChange={(e) => setSubjectForm({ ...subjectForm, maxMarks: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pass Marks</label>
                  <input
                    type="number"
                    value={subjectForm.passingMarks}
                    onChange={(e) => setSubjectForm({ ...subjectForm, passingMarks: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <input
                    type="color"
                    value={subjectForm.color}
                    onChange={(e) => setSubjectForm({ ...subjectForm, color: e.target.value })}
                    className="w-full h-10 border border-gray-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={subjectForm.isMandatory}
                    onChange={(e) => setSubjectForm({ ...subjectForm, isMandatory: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Mandatory</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={subjectForm.isActive}
                    onChange={(e) => setSubjectForm({ ...subjectForm, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowSubjectModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700"
                >
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN SUBJECT MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Assign Subject</h3>
                  <p className="text-sm text-gray-500 mt-1">{selectedClassSection?.displayName}</p>
                </div>
                <button onClick={() => setShowAssignModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleAssignSubject} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <select
                  value={assignForm.subjectId}
                  onChange={(e) => setAssignForm({ ...assignForm, subjectId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Subject</option>
                  {subjectsList
                    .filter(s => !curriculum.some(c => c.subjectId === s.id))
                    .map(subject => (
                      <option key={subject.id} value={subject.id}>
                        {subject.displayName || subject.name} ({subject.code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Periods per Week</label>
                <input
                  type="number"
                  value={assignForm.periodsPerWeek}
                  onChange={(e) => setAssignForm({ ...assignForm, periodsPerWeek: parseInt(e.target.value) })}
                  min="1"
                  max="15"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={assignForm.isOptional}
                  onChange={(e) => setAssignForm({ ...assignForm, isOptional: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">Optional Subject</span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700"
                >
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">
                {showDeleteConfirm.type === 'subject' 
                  ? 'Delete this subject? This will also remove it from all class assignments.'
                  : 'Remove this subject from the class?'}
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (showDeleteConfirm.type === 'subject') {
                      handleDeleteSubject(showDeleteConfirm.item.id);
                    } else {
                      handleRemoveFromClass(showDeleteConfirm.item.id);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectConfiguration;

