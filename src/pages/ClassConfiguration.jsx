import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  Layers,
  LayoutGrid,
  Users,
  Building,
  Check,
  AlertCircle,
  Loader2,
  Calendar,
  Copy,
  ChevronDown
} from 'lucide-react';
import { classConfig, academicSessions } from '../services/api';
import { toast } from '../utils/toast';

const ClassConfiguration = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('grades'); // grades, sections, structure

  // Data state
  const [grades, setGrades] = useState([]);
  const [sections, setSections] = useState([]);
  const [classSections, setClassSections] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  
  // Modal states
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  
  // Edit state
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [gradeForm, setGradeForm] = useState({
    name: '',
    displayName: '',
    numericValue: '',
    description: '',
    orderIndex: 0,
    isActive: true
  });

  const [sectionForm, setSectionForm] = useState({
    name: '',
    displayName: '',
    description: '',
    orderIndex: 0,
    isActive: true
  });

  const [structureForm, setStructureForm] = useState({
    classGradeId: '',
    sectionId: '',
    capacity: 40,
    roomNumber: '',
    building: '',
    floor: '',
    classTeacherId: '',
    isActive: true
  });

  const [copyForm, setCopyForm] = useState({
    sourceSessionId: ''
  });

  // Predefined templates
  const gradeTemplates = [
    { name: 'Class 1', displayName: 'Class 1', numericValue: 1 },
    { name: 'Class 2', displayName: 'Class 2', numericValue: 2 },
    { name: 'Class 3', displayName: 'Class 3', numericValue: 3 },
    { name: 'Class 4', displayName: 'Class 4', numericValue: 4 },
    { name: 'Class 5', displayName: 'Class 5', numericValue: 5 },
    { name: 'Class 6', displayName: 'Class 6', numericValue: 6 },
    { name: 'Class 7', displayName: 'Class 7', numericValue: 7 },
    { name: 'Class 8', displayName: 'Class 8', numericValue: 8 },
    { name: 'Class 9', displayName: 'Class 9', numericValue: 9 },
    { name: 'Class 10', displayName: 'Class 10', numericValue: 10 },
    { name: 'Class 11', displayName: 'Class 11', numericValue: 11 },
    { name: 'Class 12', displayName: 'Class 12', numericValue: 12 },
  ];

  const sectionTemplates = ['A', 'B', 'C', 'D', 'E', 'F'];

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Fetch class sections when selected session changes
  useEffect(() => {
    if (selectedSessionId) {
      fetchClassSections();
    }
  }, [selectedSessionId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [gradesRes, sectionsRes, sessionsRes, currentSessionRes] = await Promise.all([
        classConfig.getGrades(),
        classConfig.getSections(),
        academicSessions.getAll(),
        academicSessions.getCurrent()
      ]);

      if (gradesRes?.success) setGrades(gradesRes.data || []);
      if (sectionsRes?.success) setSections(sectionsRes.data || []);
      if (sessionsRes?.success) setSessions(sessionsRes.data || []);
      
      if (currentSessionRes?.success && currentSessionRes.data) {
        setCurrentSession(currentSessionRes.data);
        setSelectedSessionId(currentSessionRes.data.id);
      } else if (sessionsRes?.data?.length > 0) {
        // Fallback to first session if no current session
        setSelectedSessionId(sessionsRes.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load configuration data');
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
      }
    } catch (error) {
      console.error('Error fetching class sections:', error);
    }
  };

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  // =====================================================
  // GRADES HANDLERS
  // =====================================================
  
  const openGradeModal = (grade = null) => {
    if (grade) {
      setEditingItem(grade);
      setGradeForm({
        name: grade.name,
        displayName: grade.displayName,
        numericValue: grade.numericValue || '',
        description: grade.description || '',
        orderIndex: grade.orderIndex || 0,
        isActive: grade.isActive
      });
    } else {
      setEditingItem(null);
      setGradeForm({
        name: '',
        displayName: '',
        numericValue: '',
        description: '',
        orderIndex: grades.length,
        isActive: true
      });
    }
    setShowGradeModal(true);
  };

  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...gradeForm,
        numericValue: gradeForm.numericValue ? parseInt(gradeForm.numericValue) : null,
        orderIndex: parseInt(gradeForm.orderIndex)
      };

      let response;
      if (editingItem) {
        response = await classConfig.updateGrade(editingItem.id, data);
      } else {
        response = await classConfig.createGrade(data);
      }

      if (response?.success) {
        toast.success(editingItem ? 'Class updated successfully' : 'Class created successfully');
        setShowGradeModal(false);
        fetchInitialData();
      } else {
        toast.error(response?.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Failed to save class');
    }
  };

  const handleDeleteGrade = async (id) => {
    try {
      const response = await classConfig.deleteGrade(id);
      if (response?.success) {
        toast.success('Class deleted successfully');
        setShowDeleteConfirm(null);
        fetchInitialData();
      } else {
        toast.error(response?.message || 'Failed to delete');
      }
    } catch (error) {
      toast.error('Failed to delete class');
    }
  };

  const handleQuickAddGrades = async () => {
    const existingNames = grades.map(g => g.name);
    const toAdd = gradeTemplates.filter(t => !existingNames.includes(t.name));
    
    if (toAdd.length === 0) {
      toast.info('All standard classes already exist');
      return;
    }

    try {
      for (let i = 0; i < toAdd.length; i++) {
        await classConfig.createGrade({
          ...toAdd[i],
          orderIndex: grades.length + i,
          isActive: true
        });
      }
      toast.success(`Added ${toAdd.length} classes`);
      fetchInitialData();
    } catch (error) {
      toast.error('Failed to add classes');
    }
  };

  // =====================================================
  // SECTIONS HANDLERS
  // =====================================================
  
  const openSectionModal = (section = null) => {
    if (section) {
      setEditingItem(section);
      setSectionForm({
        name: section.name,
        displayName: section.displayName || '',
        description: section.description || '',
        orderIndex: section.orderIndex || 0,
        isActive: section.isActive
      });
    } else {
      setEditingItem(null);
      setSectionForm({
        name: '',
        displayName: '',
        description: '',
        orderIndex: sections.length,
        isActive: true
      });
    }
    setShowSectionModal(true);
  };

  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...sectionForm,
        orderIndex: parseInt(sectionForm.orderIndex)
      };

      let response;
      if (editingItem) {
        response = await classConfig.updateSection(editingItem.id, data);
      } else {
        response = await classConfig.createSection(data);
      }

      if (response?.success) {
        toast.success(editingItem ? 'Section updated successfully' : 'Section created successfully');
        setShowSectionModal(false);
        fetchInitialData();
      } else {
        toast.error(response?.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Failed to save section');
    }
  };

  const handleDeleteSection = async (id) => {
    try {
      const response = await classConfig.deleteSection(id);
      if (response?.success) {
        toast.success('Section deleted successfully');
        setShowDeleteConfirm(null);
        fetchInitialData();
      } else {
        toast.error(response?.message || 'Failed to delete');
      }
    } catch (error) {
      toast.error('Failed to delete section');
    }
  };

  const handleQuickAddSections = async () => {
    const existingNames = sections.map(s => s.name);
    const toAdd = sectionTemplates.filter(t => !existingNames.includes(t));
    
    if (toAdd.length === 0) {
      toast.info('All standard sections already exist');
      return;
    }

    try {
      for (let i = 0; i < toAdd.length; i++) {
        await classConfig.createSection({
          name: toAdd[i],
          displayName: `Section ${toAdd[i]}`,
          orderIndex: sections.length + i,
          isActive: true
        });
      }
      toast.success(`Added ${toAdd.length} sections`);
      fetchInitialData();
    } catch (error) {
      toast.error('Failed to add sections');
    }
  };

  // =====================================================
  // CLASS STRUCTURE HANDLERS
  // =====================================================
  
  const openStructureModal = (structure = null) => {
    if (structure) {
      setEditingItem(structure);
      setStructureForm({
        classGradeId: structure.classGradeId,
        sectionId: structure.sectionId,
        capacity: structure.capacity || 40,
        roomNumber: structure.roomNumber || '',
        building: structure.building || '',
        floor: structure.floor || '',
        classTeacherId: structure.classTeacherId || '',
        isActive: structure.isActive
      });
    } else {
      setEditingItem(null);
      setStructureForm({
        classGradeId: '',
        sectionId: '',
        capacity: 40,
        roomNumber: '',
        building: '',
        floor: '',
        classTeacherId: '',
        isActive: true
      });
    }
    setShowStructureModal(true);
  };

  const handleStructureSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSessionId) {
      toast.error('Please select an academic session first');
      return;
    }

    try {
      const data = {
        ...structureForm,
        capacity: parseInt(structureForm.capacity),
        academicSessionId: selectedSessionId,
        classTeacherId: structureForm.classTeacherId || null
      };

      let response;
      if (editingItem) {
        response = await classConfig.updateClassSection(editingItem.id, data);
      } else {
        response = await classConfig.createClassSection(data);
      }

      if (response?.success) {
        toast.success(editingItem ? 'Structure updated successfully' : 'Structure created successfully');
        setShowStructureModal(false);
        fetchClassSections();
      } else {
        toast.error(response?.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Failed to save structure');
    }
  };

  const handleDeleteStructure = async (id) => {
    try {
      const response = await classConfig.deleteClassSection(id);
      if (response?.success) {
        toast.success('Structure deleted successfully');
        setShowDeleteConfirm(null);
        fetchClassSections();
      } else {
        toast.error(response?.message || 'Failed to delete');
      }
    } catch (error) {
      toast.error('Failed to delete structure');
    }
  };

  const handleBulkCreateStructures = async (gradeId) => {
    if (sections.length === 0) {
      toast.error('Please create sections first');
      return;
    }

    if (!selectedSessionId) {
      toast.error('Please select an academic session first');
      return;
    }

    try {
      const response = await classConfig.bulkCreateClassSections({
        classGradeId: gradeId,
        sectionIds: sections.map(s => s.id),
        academicSessionId: selectedSessionId,
        defaultCapacity: 40
      });

      if (response?.success) {
        toast.success(response.message);
        fetchClassSections();
      } else {
        toast.error(response?.message || 'Failed to create structures');
      }
    } catch (error) {
      toast.error('Failed to create structures');
    }
  };

  // Copy structure from another session
  const handleCopyFromSession = async () => {
    if (!copyForm.sourceSessionId) {
      toast.error('Please select a source session');
      return;
    }

    if (!selectedSessionId) {
      toast.error('Please select a target session');
      return;
    }

    if (copyForm.sourceSessionId === selectedSessionId) {
      toast.error('Source and target sessions cannot be the same');
      return;
    }

    setCopying(true);
    try {
      const response = await classConfig.copyClassSections({
        sourceSessionId: copyForm.sourceSessionId,
        targetSessionId: selectedSessionId
      });

      if (response?.success) {
        toast.success(response.message || 'Structure copied successfully');
        setShowCopyModal(false);
        fetchClassSections();
      } else {
        toast.error(response?.message || 'Failed to copy structure');
      }
    } catch (error) {
      toast.error('Failed to copy structure');
    } finally {
      setCopying(false);
    }
  };

  // Group class sections by grade for display
  const groupedStructures = grades.map(grade => ({
    ...grade,
    sections: classSections.filter(cs => cs.classGradeId === grade.id)
  }));

  const tabs = [
    { id: 'grades', label: 'Classes', icon: BookOpen, count: grades.length },
    { id: 'sections', label: 'Sections', icon: Layers, count: sections.length },
    { id: 'structure', label: 'Class Structure', icon: LayoutGrid, count: classSections.length },
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Class & Section Configuration</h1>
          <p className="text-gray-600 mt-1">Manage your school's class structure and sections</p>
        </div>
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

      {/* GRADES TAB */}
      {activeTab === 'grades' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Classes / Grades</h3>
              <p className="text-sm text-gray-500 mt-1">These are permanent and shared across all academic sessions</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleQuickAddGrades}
                className="px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
              >
                Quick Add (1-12)
              </button>
              <button
                onClick={() => openGradeModal()}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Class
              </button>
            </div>
          </div>

          {grades.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Classes Yet</h3>
              <p className="text-gray-600 mb-4">Start by adding classes or use the quick add button</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {grades.map(grade => (
                <div
                  key={grade.id}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    grade.isActive 
                      ? 'border-blue-200 bg-blue-50/50' 
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        grade.isActive ? 'bg-blue-100' : 'bg-gray-200'
                      }`}>
                        <span className={`text-lg font-bold ${
                          grade.isActive ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {grade.numericValue || grade.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{grade.displayName}</h4>
                        <p className="text-xs text-gray-500">{grade.name}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openGradeModal(grade)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm({ type: 'grade', item: grade })}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {grade.description && (
                    <p className="mt-2 text-sm text-gray-600">{grade.description}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    {grade.isActive ? (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">Active</span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded-full">Inactive</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTIONS TAB */}
      {activeTab === 'sections' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Sections</h3>
              <p className="text-sm text-gray-500 mt-1">These are permanent and shared across all academic sessions</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleQuickAddSections}
                className="px-4 py-2 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors text-sm"
              >
                Quick Add (A-F)
              </button>
              <button
                onClick={() => openSectionModal()}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Section
              </button>
            </div>
          </div>

          {sections.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Sections Yet</h3>
              <p className="text-gray-600 mb-4">Add sections like A, B, C or use quick add</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {sections.map(section => (
                <div
                  key={section.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    section.isActive 
                      ? 'border-purple-200 bg-purple-50/50' 
                      : 'border-gray-200 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    section.isActive ? 'bg-purple-100' : 'bg-gray-200'
                  }`}>
                    <span className={`text-lg font-bold ${
                      section.isActive ? 'text-purple-600' : 'text-gray-500'
                    }`}>
                      {section.name}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{section.displayName || `Section ${section.name}`}</h4>
                    {section.isActive ? (
                      <span className="text-xs text-green-600">Active</span>
                    ) : (
                      <span className="text-xs text-gray-500">Inactive</span>
                    )}
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button
                      onClick={() => openSectionModal(section)}
                      className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm({ type: 'section', item: section })}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STRUCTURE TAB */}
      {activeTab === 'structure' && (
        <div className="card">
          {/* Session Selector Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Class Structure</h3>
              <p className="text-sm text-gray-500 mt-1">
                Configure which classes have which sections for each academic session
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Session Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowSessionDropdown(!showSessionDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors min-w-[200px]"
                >
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="flex-1 text-left">
                    {selectedSession?.name || 'Select Session'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                
                {showSessionDropdown && (
                  <div className="absolute top-full right-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-60 overflow-auto">
                    {sessions.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-gray-500">No sessions available</div>
                    ) : (
                      sessions.map(session => (
                        <button
                          key={session.id}
                          onClick={() => {
                            setSelectedSessionId(session.id);
                            setShowSessionDropdown(false);
                          }}
                          className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                            selectedSessionId === session.id ? 'bg-blue-50 text-blue-600' : ''
                          }`}
                        >
                          <span>{session.name}</span>
                          {session.isCurrent && (
                            <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded">Current</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Copy from Session Button */}
              <button
                onClick={() => {
                  setCopyForm({ sourceSessionId: '' });
                  setShowCopyModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy from Session
              </button>

              {/* Add Structure Button */}
              <button
                onClick={() => openStructureModal()}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Structure
              </button>
            </div>
          </div>

          {/* Session Info Banner */}
          {selectedSession && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-6">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <span className="font-medium text-blue-800">Viewing: {selectedSession.name}</span>
                {selectedSession.isCurrent && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Current Session</span>
                )}
              </div>
              <span className="text-sm text-blue-600 ml-auto">
                {classSections.length} class-section combinations
              </span>
            </div>
          )}

          {!selectedSessionId ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">Select Academic Session</h3>
              <p className="text-gray-600">Please select an academic session to view or configure class structure</p>
            </div>
          ) : grades.length === 0 || sections.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">Setup Required</h3>
              <p className="text-gray-600 mb-4">
                Please add classes and sections first before creating the structure.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {groupedStructures.map(grade => (
                <div key={grade.id} className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  {/* Class Header - More Prominent */}
                  <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 to-blue-600">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                        <span className="text-xl font-bold text-white">
                          {grade.numericValue || grade.name.replace('Class ', '')}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">{grade.displayName}</h4>
                        <p className="text-sm text-blue-100">
                          {grade.sections.length} {grade.sections.length === 1 ? 'section' : 'sections'} assigned
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleBulkCreateStructures(grade.id)}
                      className="text-sm bg-white/20 hover:bg-white/30 text-white font-medium px-4 py-2 rounded-lg transition-colors backdrop-blur"
                    >
                      + Add All Sections
                    </button>
                  </div>
                  
                  {/* Sections List */}
                  {grade.sections.length > 0 ? (
                    <div className="p-4 bg-gray-50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {grade.sections.map(cs => (
                        <div
                          key={cs.id}
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center">
                              <span className="font-semibold text-purple-600 text-sm">{cs.sectionName}</span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-sm">{cs.displayName}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Users className="w-3 h-3" />
                                <span>{cs.currentStrength || 0}/{cs.capacity}</span>
                                {cs.roomNumber && (
                                  <>
                                    <span>•</span>
                                    <Building className="w-3 h-3" />
                                    <span>{cs.roomNumber}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => openStructureModal(cs)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm({ type: 'structure', item: cs })}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 bg-gray-50 text-center">
                      <p className="text-gray-500 text-sm">No sections assigned to this class for this session</p>
                      <button
                        onClick={() => handleBulkCreateStructures(grade.id)}
                        className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Click here to add all sections
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* GRADE MODAL */}
      {showGradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingItem ? 'Edit Class' : 'Add New Class'}
                </h3>
                <button onClick={() => setShowGradeModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleGradeSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={gradeForm.name}
                    onChange={(e) => setGradeForm({ ...gradeForm, name: e.target.value })}
                    placeholder="e.g., Class 1"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name *</label>
                  <input
                    type="text"
                    value={gradeForm.displayName}
                    onChange={(e) => setGradeForm({ ...gradeForm, displayName: e.target.value })}
                    placeholder="e.g., Class 1"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Numeric Value</label>
                  <input
                    type="number"
                    value={gradeForm.numericValue}
                    onChange={(e) => setGradeForm({ ...gradeForm, numericValue: e.target.value })}
                    placeholder="e.g., 1"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                  <input
                    type="number"
                    value={gradeForm.orderIndex}
                    onChange={(e) => setGradeForm({ ...gradeForm, orderIndex: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={gradeForm.description}
                  onChange={(e) => setGradeForm({ ...gradeForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="gradeActive"
                  checked={gradeForm.isActive}
                  onChange={(e) => setGradeForm({ ...gradeForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="gradeActive" className="text-sm text-gray-700">Active</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowGradeModal(false)}
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

      {/* SECTION MODAL */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingItem ? 'Edit Section' : 'Add New Section'}
                </h3>
                <button onClick={() => setShowSectionModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSectionSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={sectionForm.name}
                    onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                    placeholder="e.g., A"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={sectionForm.displayName}
                    onChange={(e) => setSectionForm({ ...sectionForm, displayName: e.target.value })}
                    placeholder="e.g., Section A"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={sectionForm.description}
                  onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                  <input
                    type="number"
                    value={sectionForm.orderIndex}
                    onChange={(e) => setSectionForm({ ...sectionForm, orderIndex: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <input
                    type="checkbox"
                    id="sectionActive"
                    checked={sectionForm.isActive}
                    onChange={(e) => setSectionForm({ ...sectionForm, isActive: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <label htmlFor="sectionActive" className="ml-2 text-sm text-gray-700">Active</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowSectionModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700"
                >
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STRUCTURE MODAL */}
      {showStructureModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {editingItem ? 'Edit Class-Section' : 'Add Class-Section'}
                  </h3>
                  {selectedSession && (
                    <p className="text-sm text-gray-500 mt-1">Session: {selectedSession.name}</p>
                  )}
                </div>
                <button onClick={() => setShowStructureModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleStructureSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                  <select
                    value={structureForm.classGradeId}
                    onChange={(e) => setStructureForm({ ...structureForm, classGradeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!!editingItem}
                  >
                    <option value="">Select Class</option>
                    {grades.map(grade => (
                      <option key={grade.id} value={grade.id}>{grade.displayName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
                  <select
                    value={structureForm.sectionId}
                    onChange={(e) => setStructureForm({ ...structureForm, sectionId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!!editingItem}
                  >
                    <option value="">Select Section</option>
                    {sections.map(section => (
                      <option key={section.id} value={section.id}>{section.displayName || section.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={structureForm.capacity}
                    onChange={(e) => setStructureForm({ ...structureForm, capacity: e.target.value })}
                    placeholder="40"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                  <input
                    type="text"
                    value={structureForm.roomNumber}
                    onChange={(e) => setStructureForm({ ...structureForm, roomNumber: e.target.value })}
                    placeholder="e.g., 101"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
                  <input
                    type="text"
                    value={structureForm.building}
                    onChange={(e) => setStructureForm({ ...structureForm, building: e.target.value })}
                    placeholder="e.g., Main Building"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                  <input
                    type="text"
                    value={structureForm.floor}
                    onChange={(e) => setStructureForm({ ...structureForm, floor: e.target.value })}
                    placeholder="e.g., Ground Floor"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="structureActive"
                  checked={structureForm.isActive}
                  onChange={(e) => setStructureForm({ ...structureForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="structureActive" className="text-sm text-gray-700">Active</label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowStructureModal(false)}
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

      {/* COPY FROM SESSION MODAL */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">Copy Class Structure</h3>
                <button onClick={() => setShowCopyModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Visual explanation with arrows */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="text-center flex-1">
                  <p className="text-xs text-gray-500 mb-1">FROM (Source)</p>
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-1">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Previous Session</p>
                  <p className="text-xs text-green-600">Has class structure</p>
                </div>
                <div className="px-4">
                  <div className="text-2xl text-gray-400">→</div>
                </div>
                <div className="text-center flex-1">
                  <p className="text-xs text-gray-500 mb-1">TO (Target)</p>
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-1">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">{selectedSession?.name || 'Current'}</p>
                  <p className="text-xs text-blue-600">{classSections.length} class sections</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Copy FROM Session (Source) *</label>
                <select
                  value={copyForm.sourceSessionId}
                  onChange={(e) => setCopyForm({ ...copyForm, sourceSessionId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select session with existing structure</option>
                  {sessions
                    .filter(s => s.id !== selectedSessionId)
                    .map(session => (
                      <option key={session.id} value={session.id}>
                        {session.name} {session.isCurrent ? '(Current)' : ''}
                      </option>
                    ))}
                </select>
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>✓ Copying TO:</strong> {selectedSession?.name || 'None selected'}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Currently has {classSections.length} class sections
                </p>
              </div>

              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Select a session that already has class structure configured.
                  Existing configurations in the target session will be skipped.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCopyModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCopyFromSession}
                  disabled={copying || !copyForm.sourceSessionId}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                >
                  {copying && <Loader2 className="w-4 h-4 animate-spin" />}
                  Copy Structure
                </button>
              </div>
            </div>
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
                Are you sure you want to delete this {showDeleteConfirm.type}? This action cannot be undone.
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
                    if (showDeleteConfirm.type === 'grade') {
                      handleDeleteGrade(showDeleteConfirm.item.id);
                    } else if (showDeleteConfirm.type === 'section') {
                      handleDeleteSection(showDeleteConfirm.item.id);
                    } else if (showDeleteConfirm.type === 'structure') {
                      handleDeleteStructure(showDeleteConfirm.item.id);
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

export default ClassConfiguration;
