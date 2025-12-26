import { useState, useEffect } from 'react';
import {
  Hash, Settings, Save, RefreshCw, Eye, RotateCcw, ChevronRight,
  CheckCircle, AlertCircle, Calendar, Building, Users, FileText,
  Zap, List, Play, X
} from 'lucide-react';
import { numberSettings, students, classConfig, academicSessions } from '../services/api';
import { toast } from '../utils/toast';

const NumberConfiguration = () => {
  const [settings, setSettings] = useState({
    admission_number: null,
    roll_number: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('admission_number');
  const [previewNumber, setPreviewNumber] = useState('');
  
  // Bulk generation state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkType, setBulkType] = useState('admission'); // 'admission' or 'roll'
  const [bulkLoading, setBulkLoading] = useState(false);
  const [classSections, setClassSections] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [studentsWithoutNumber, setStudentsWithoutNumber] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [bulkClassFilter, setBulkClassFilter] = useState('');

  // Form state for admission number
  const [admissionForm, setAdmissionForm] = useState({
    prefix: 'ADM',
    suffix: '',
    separator: '/',
    startNumber: 1,
    numberLength: 4,
    includeYear: true,
    yearFormat: 'YY',
    includeClass: false,
    includeSection: false,
    resetYearly: true,
    autoIncrement: true // Auto increment after each student
  });

  // Form state for roll number
  const [rollForm, setRollForm] = useState({
    prefix: '',
    suffix: '',
    separator: '',
    startNumber: 1,
    numberLength: 2,
    rollNumberType: 'sequential',
    rollPerClass: true
  });

  useEffect(() => {
    fetchSettings();
    fetchInitialData();
  }, []);
  
  const fetchInitialData = async () => {
    try {
      const [sessionRes, classRes] = await Promise.all([
        academicSessions.getCurrent(),
        classConfig.getClassSections()
      ]);
      if (sessionRes?.success) setCurrentSession(sessionRes.data);
      if (classRes?.success) setClassSections(classRes.data || []);
    } catch (e) {
      console.error('Error fetching initial data:', e);
    }
  };

  useEffect(() => {
    updatePreview();
  }, [admissionForm, rollForm, activeTab]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await numberSettings.getAll();
      if (res?.success && res.data) {
        setSettings(res.data);
        
        if (res.data.admission_number) {
          setAdmissionForm({
            prefix: res.data.admission_number.prefix || 'ADM',
            suffix: res.data.admission_number.suffix || '',
            separator: res.data.admission_number.separator || '/',
            startNumber: res.data.admission_number.startNumber || 1,
            numberLength: res.data.admission_number.numberLength || 4,
            includeYear: res.data.admission_number.includeYear !== false,
            yearFormat: res.data.admission_number.yearFormat || 'YY',
            includeClass: res.data.admission_number.includeClass || false,
            includeSection: res.data.admission_number.includeSection || false,
            resetYearly: res.data.admission_number.resetYearly !== false,
            autoIncrement: res.data.admission_number.autoIncrement !== false
          });
        }
        
        if (res.data.roll_number) {
          setRollForm({
            prefix: res.data.roll_number.prefix || '',
            suffix: res.data.roll_number.suffix || '',
            separator: res.data.roll_number.separator || '',
            startNumber: res.data.roll_number.startNumber || 1,
            numberLength: res.data.roll_number.numberLength || 2,
            rollNumberType: res.data.roll_number.rollNumberType || 'sequential',
            rollPerClass: res.data.roll_number.rollPerClass !== false
          });
        }
      }
    } catch (e) {
      console.error('Error fetching settings:', e);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updatePreview = () => {
    if (activeTab === 'admission_number') {
      const parts = [];
      if (admissionForm.prefix) parts.push(admissionForm.prefix);
      if (admissionForm.includeYear) {
        const year = new Date().getFullYear();
        parts.push(admissionForm.yearFormat === 'YYYY' ? year.toString() : year.toString().slice(-2));
      }
      if (admissionForm.includeClass) parts.push('01');
      if (admissionForm.includeSection) parts.push('A');
      parts.push('1'.padStart(admissionForm.numberLength, '0'));
      if (admissionForm.suffix) parts.push(admissionForm.suffix);
      setPreviewNumber(parts.join(admissionForm.separator || '/'));
    } else {
      let preview = '';
      if (rollForm.prefix) preview += rollForm.prefix + (rollForm.separator || '');
      preview += '1'.padStart(rollForm.numberLength, '0');
      if (rollForm.suffix) preview += (rollForm.separator || '') + rollForm.suffix;
      setPreviewNumber(preview);
    }
  };

  const handleSaveAdmission = async () => {
    setSaving(true);
    try {
      const res = await numberSettings.update('admission_number', admissionForm);
      if (res?.success) {
        toast.success('Admission number settings saved');
        fetchSettings();
      } else {
        toast.error(res?.message || 'Failed to save');
      }
    } catch (e) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRoll = async () => {
    setSaving(true);
    try {
      const res = await numberSettings.update('roll_number', rollForm);
      if (res?.success) {
        toast.success('Roll number settings saved');
        fetchSettings();
      } else {
        toast.error(res?.message || 'Failed to save');
      }
    } catch (e) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetSequence = async (type) => {
    if (!confirm(`Are you sure you want to reset the ${type.replace('_', ' ')} sequence? This will start numbering from the beginning.`)) {
      return;
    }

    try {
      const res = await numberSettings.reset(type, { startFrom: type === 'admission_number' ? admissionForm.startNumber : rollForm.startNumber });
      if (res?.success) {
        toast.success('Sequence reset successfully');
        fetchSettings();
      } else {
        toast.error(res?.message || 'Failed to reset');
      }
    } catch (e) {
      toast.error('Failed to reset sequence');
    }
  };

  // Open bulk generation modal
  const openBulkModal = async (type) => {
    setBulkType(type);
    setBulkLoading(true);
    setShowBulkModal(true);
    setSelectedStudents([]);
    setBulkClassFilter('');
    
    try {
      // Fetch students without admission/roll number
      const params = { 
        academic_session_id: currentSession?.id,
        status: 'active',
        limit: 500
      };
      
      const res = await students.getAll(params);
      if (res?.success) {
        let filtered = res.data || [];
        if (type === 'admission') {
          filtered = filtered.filter(s => !s.admissionNumber || s.admissionNumber.trim() === '');
        } else {
          filtered = filtered.filter(s => !s.rollNumber || s.rollNumber.trim() === '');
        }
        setStudentsWithoutNumber(filtered);
      }
    } catch (e) {
      console.error('Error fetching students:', e);
      toast.error('Failed to load students');
    } finally {
      setBulkLoading(false);
    }
  };

  // Generate numbers for selected students
  const handleBulkGenerate = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    setBulkLoading(true);
    try {
      const res = await numberSettings.bulkGenerate({
        type: bulkType,
        studentIds: selectedStudents,
        classSectionId: bulkClassFilter || null
      });
      
      if (res?.success) {
        toast.success(`Generated ${bulkType === 'admission' ? 'admission' : 'roll'} numbers for ${res.data?.updated || selectedStudents.length} students`);
        setShowBulkModal(false);
        fetchSettings();
      } else {
        toast.error(res?.message || 'Failed to generate numbers');
      }
    } catch (e) {
      console.error('Error generating numbers:', e);
      toast.error('Failed to generate numbers');
    } finally {
      setBulkLoading(false);
    }
  };

  // Toggle student selection
  const toggleStudent = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Select all students
  const selectAllStudents = () => {
    const filtered = getFilteredStudents();
    if (selectedStudents.length === filtered.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filtered.map(s => s.id));
    }
  };

  // Get filtered students based on class filter
  const getFilteredStudents = () => {
    if (!bulkClassFilter) return studentsWithoutNumber;
    return studentsWithoutNumber.filter(s => s.classSectionId === bulkClassFilter);
  };

  // Get session filtered classes
  const getSessionClasses = () => {
    return classSections.filter(c => c.academicSessionId === currentSession?.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-violet-600 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center gap-3">
          <Hash className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Number Generation Settings</h1>
            <p className="text-white/80">Configure admission number and roll number formats</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('admission_number')}
            className={`flex-1 px-6 py-4 font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'admission_number'
                ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-5 h-5" />
            Admission Number
          </button>
          <button
            onClick={() => setActiveTab('roll_number')}
            className={`flex-1 px-6 py-4 font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'roll_number'
                ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Users className="w-5 h-5" />
            Roll Number
          </button>
        </div>

        <div className="p-6">
          {/* Preview Card */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 mb-6 border-2 border-dashed border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 mb-1">Preview</p>
                <p className="text-3xl font-bold text-gray-800 font-mono tracking-wide">
                  {previewNumber}
                </p>
              </div>
              <Eye className="w-10 h-10 text-gray-300" />
            </div>
          </div>

          {/* Admission Number Form */}
          {activeTab === 'admission_number' && (
            <div className="space-y-6">
              {/* Current Info */}
              {settings.admission_number && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">Current Sequence</p>
                      <p className="text-sm text-blue-600">
                        Last used: {settings.admission_number.currentNumber || 0}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleResetSequence('admission_number')}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Prefix */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prefix</label>
                  <input
                    type="text"
                    value={admissionForm.prefix}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, prefix: e.target.value.toUpperCase() })}
                    placeholder="e.g., ADM, STU"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Separator */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Separator</label>
                  <select
                    value={admissionForm.separator}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, separator: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="/">/</option>
                    <option value="-">-</option>
                    <option value="">None</option>
                  </select>
                </div>

                {/* Number Length */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number Length</label>
                  <select
                    value={admissionForm.numberLength}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, numberLength: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={3}>3 digits (001)</option>
                    <option value={4}>4 digits (0001)</option>
                    <option value={5}>5 digits (00001)</option>
                    <option value={6}>6 digits (000001)</option>
                  </select>
                </div>

                {/* Start Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start From</label>
                  <input
                    type="number"
                    value={admissionForm.startNumber}
                    onChange={(e) => setAdmissionForm({ ...admissionForm, startNumber: parseInt(e.target.value) || 1 })}
                    min={1}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Include Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Include Year</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={admissionForm.includeYear}
                        onChange={(e) => setAdmissionForm({ ...admissionForm, includeYear: e.target.checked })}
                        className="w-5 h-5 text-indigo-600 rounded"
                      />
                      <span>Yes</span>
                    </label>
                    {admissionForm.includeYear && (
                      <select
                        value={admissionForm.yearFormat}
                        onChange={(e) => setAdmissionForm({ ...admissionForm, yearFormat: e.target.value })}
                        className="px-3 py-2 border border-gray-200 rounded-lg"
                      >
                        <option value="YY">Short (25)</option>
                        <option value="YYYY">Full (2025)</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* Reset Yearly */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reset Every Year</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={admissionForm.resetYearly}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, resetYearly: e.target.checked })}
                      className="w-5 h-5 text-indigo-600 rounded"
                    />
                    <span>Start from 1 each new year</span>
                  </label>
                </div>

                {/* Auto Increment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Auto Increment</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={admissionForm.autoIncrement}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, autoIncrement: e.target.checked })}
                      className="w-5 h-5 text-indigo-600 rounded"
                    />
                    <span>Auto-increment after each student</span>
                  </label>
                </div>
              </div>

              {/* Include Class/Section */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-medium text-gray-700 mb-3">Include in Format</p>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={admissionForm.includeClass}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, includeClass: e.target.checked })}
                      className="w-5 h-5 text-indigo-600 rounded"
                    />
                    <span>Class Number</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={admissionForm.includeSection}
                      onChange={(e) => setAdmissionForm({ ...admissionForm, includeSection: e.target.checked })}
                      className="w-5 h-5 text-indigo-600 rounded"
                    />
                    <span>Section Letter</span>
                  </label>
                </div>
              </div>

              {/* Suffix */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Suffix (Optional)</label>
                <input
                  type="text"
                  value={admissionForm.suffix}
                  onChange={(e) => setAdmissionForm({ ...admissionForm, suffix: e.target.value.toUpperCase() })}
                  placeholder="e.g., SCH"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => openBulkModal('admission')}
                  className="px-5 py-3 border-2 border-indigo-600 text-indigo-600 rounded-xl font-medium flex items-center gap-2 hover:bg-indigo-50 transition-all"
                >
                  <List className="w-5 h-5" />
                  Bulk Generate Admission Numbers
                </button>
                <button
                  onClick={handleSaveAdmission}
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save Settings
                </button>
              </div>
            </div>
          )}

          {/* Roll Number Form */}
          {activeTab === 'roll_number' && (
            <div className="space-y-6">
              {/* Current Info */}
              {settings.roll_number && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Roll Number Type</p>
                      <p className="text-sm text-green-600 capitalize">
                        {settings.roll_number.rollNumberType || 'Sequential'}
                        {settings.roll_number.rollPerClass && ' (Per Class)'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Prefix */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prefix (Optional)</label>
                  <input
                    type="text"
                    value={rollForm.prefix}
                    onChange={(e) => setRollForm({ ...rollForm, prefix: e.target.value.toUpperCase() })}
                    placeholder="e.g., R"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Number Length */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number Length</label>
                  <select
                    value={rollForm.numberLength}
                    onChange={(e) => setRollForm({ ...rollForm, numberLength: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={1}>1 digit (1)</option>
                    <option value={2}>2 digits (01)</option>
                    <option value={3}>3 digits (001)</option>
                  </select>
                </div>

                {/* Start Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start From</label>
                  <input
                    type="number"
                    value={rollForm.startNumber}
                    onChange={(e) => setRollForm({ ...rollForm, startNumber: parseInt(e.target.value) || 1 })}
                    min={1}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Roll Number Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Numbering Type</label>
                  <select
                    value={rollForm.rollNumberType}
                    onChange={(e) => setRollForm({ ...rollForm, rollNumberType: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="sequential">Sequential (1, 2, 3...)</option>
                    <option value="padded">Padded (01, 02, 03...)</option>
                  </select>
                </div>

                {/* Roll Per Class */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reset Per Class</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rollForm.rollPerClass}
                      onChange={(e) => setRollForm({ ...rollForm, rollPerClass: e.target.checked })}
                      className="w-5 h-5 text-indigo-600 rounded"
                    />
                    <span>Each class starts from 1</span>
                  </label>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-between items-center">
                <button
                  onClick={() => openBulkModal('roll')}
                  className="px-5 py-3 border-2 border-indigo-600 text-indigo-600 rounded-xl font-medium flex items-center gap-2 hover:bg-indigo-50 transition-all"
                >
                  <List className="w-5 h-5" />
                  Bulk Generate Roll Numbers
                </button>
                <button
                  onClick={handleSaveRoll}
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Generation Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <List className="w-6 h-6" />
                <div>
                  <h3 className="text-lg font-bold">
                    Bulk Generate {bulkType === 'admission' ? 'Admission' : 'Roll'} Numbers
                  </h3>
                  <p className="text-white/80 text-sm">
                    Select students to generate numbers for
                  </p>
                </div>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="p-2 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Class Filter */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Filter by Class:</label>
                <select
                  value={bulkClassFilter}
                  onChange={(e) => setBulkClassFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All Classes</option>
                  {getSessionClasses().map(cs => (
                    <option key={cs.id} value={cs.id}>
                      {cs.gradeDisplayName || cs.gradeName} - {cs.sectionDisplayName || cs.sectionName}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-gray-500">
                  {getFilteredStudents().length} students without {bulkType === 'admission' ? 'admission' : 'roll'} number
                </span>
              </div>
            </div>

            {/* Student List */}
            <div className="flex-1 overflow-auto p-4">
              {bulkLoading ? (
                <div className="flex items-center justify-center h-48">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : getFilteredStudents().length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                  <CheckCircle className="w-16 h-16 mb-4" />
                  <p className="text-lg font-medium">All students have {bulkType === 'admission' ? 'admission' : 'roll'} numbers!</p>
                </div>
              ) : (
                <>
                  {/* Select All */}
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                    <input
                      type="checkbox"
                      checked={selectedStudents.length === getFilteredStudents().length && getFilteredStudents().length > 0}
                      onChange={selectAllStudents}
                      className="w-5 h-5 text-indigo-600 rounded"
                    />
                    <span className="font-medium text-gray-700">
                      Select All ({getFilteredStudents().length} students)
                    </span>
                    {selectedStudents.length > 0 && (
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                        {selectedStudents.length} selected
                      </span>
                    )}
                  </div>

                  {/* Student Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {getFilteredStudents().map(student => (
                      <label
                        key={student.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedStudents.includes(student.id)
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => toggleStudent(student.id)}
                          className="w-5 h-5 text-indigo-600 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{student.fullName}</p>
                          <p className="text-sm text-gray-500 truncate">
                            {student.className || 'No class'} • {student.admissionNumber || 'No Adm #'}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkGenerate}
                disabled={bulkLoading || selectedStudents.length === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {bulkLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
                Generate {selectedStudents.length} Numbers
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">How it works</p>
            <ul className="mt-2 text-sm text-amber-700 space-y-1">
              <li>• <strong>Admission Number</strong>: Auto-generated when adding a new student</li>
              <li>• <strong>Roll Number</strong>: Auto-generated based on class and existing students</li>
              <li>• Numbers can be manually edited during student creation if needed</li>
              <li>• Use "Reset" to restart the sequence (useful at start of new academic year)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NumberConfiguration;

