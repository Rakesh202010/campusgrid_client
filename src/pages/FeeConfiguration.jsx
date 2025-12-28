import { useState, useEffect } from 'react';
import { 
  IndianRupee, 
  Plus, 
  Edit2, 
  Trash2, 
  X,
  Layers,
  Calendar,
  Percent,
  Tag,
  Loader2,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import { fees, academicSessions, classConfig } from '../services/api';
import { useAcademicSession } from '../contexts/AcademicSessionContext';
import { toast } from '../utils/toast';

// Predefined fee type templates
const FEE_TYPE_TEMPLATES = [
  { name: 'Tuition Fee', code: 'TUITION', category: 'academic', frequency: 'monthly' },
  { name: 'Admission Fee', code: 'ADMISSION', category: 'admission', frequency: 'one-time' },
  { name: 'Registration Fee', code: 'REG', category: 'admission', frequency: 'one-time' },
  { name: 'Annual Fee', code: 'ANNUAL', category: 'academic', frequency: 'annual' },
  { name: 'Exam Fee', code: 'EXAM', category: 'academic', frequency: 'term' },
  { name: 'Lab Fee', code: 'LAB', category: 'academic', frequency: 'annual' },
  { name: 'Library Fee', code: 'LIBRARY', category: 'academic', frequency: 'annual' },
  { name: 'Sports Fee', code: 'SPORTS', category: 'co-curricular', frequency: 'annual' },
  { name: 'Transport Fee', code: 'TRANSPORT', category: 'transport', frequency: 'monthly' },
  { name: 'Computer Fee', code: 'COMPUTER', category: 'academic', frequency: 'annual' },
];

const DISCOUNT_TEMPLATES = [
  { name: 'Sibling Discount', code: 'SIBLING', discountType: 'percentage', discountValue: 10 },
  { name: 'Staff Child', code: 'STAFF', discountType: 'percentage', discountValue: 50 },
  { name: 'Merit Scholarship', code: 'MERIT', discountType: 'percentage', discountValue: 25 },
  { name: 'Early Bird', code: 'EARLY', discountType: 'percentage', discountValue: 5 },
  { name: 'Financial Aid', code: 'AID', discountType: 'percentage', discountValue: 100 },
];

const CATEGORY_OPTIONS = [
  { value: 'academic', label: 'Academic', color: 'bg-blue-100 text-blue-700' },
  { value: 'admission', label: 'Admission', color: 'bg-green-100 text-green-700' },
  { value: 'transport', label: 'Transport', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'co-curricular', label: 'Co-Curricular', color: 'bg-purple-100 text-purple-700' },
  { value: 'hostel', label: 'Hostel', color: 'bg-pink-100 text-pink-700' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700' },
];

const FREQUENCY_OPTIONS = [
  { value: 'one_time', label: 'One-Time' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'half_yearly', label: 'Half-Yearly' },
  { value: 'annual', label: 'Annual/Yearly' },
];

const APPLICABILITY_OPTIONS = [
  { value: 'full_year', label: 'Full Year', description: 'Applies to all months' },
  { value: 'specific_months', label: 'Specific Months', description: 'Only applies in selected months' },
  { value: 'term_wise', label: 'Term-wise', description: 'Applies per academic term' },
];

const MONTHS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

const FeeConfiguration = () => {
  const { currentSession, sessionId, sessions: contextSessions } = useAcademicSession();
  
  const [activeTab, setActiveTab] = useState('types');
  
  // Data state
  const [feeTypes, setFeeTypes] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [discountTypes, setDiscountTypes] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [grades, setGrades] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [showFeeTypeModal, setShowFeeTypeModal] = useState(false);
  const [showStructureModal, setShowStructureModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [feeTypeForm, setFeeTypeForm] = useState({
    name: '', code: '', description: '', category: 'academic', frequency: 'monthly',
    applicabilityType: 'full_year', applicableMonths: [], isProratedOnJoin: false,
    isMandatory: true, isRefundable: false, taxApplicable: false, taxPercentage: 0,
    lateFeeApplicable: false, lateFeeType: 'fixed', lateFeeValue: 0, isActive: true
  });

  const [structureForm, setStructureForm] = useState({
    feeTypeId: '', classGradeId: '', amount: '', dueDay: 10, isActive: true
  });

  const [discountForm, setDiscountForm] = useState({
    name: '', code: '', description: '', discountType: 'percentage', discountValue: '',
    maxDiscountAmount: '', eligibilityCriteria: '', requiresApproval: false, isActive: true
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
      fetchFeeStructures();
    }
  }, [selectedSessionId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [feeTypesRes, discountsRes, sessionsRes, gradesRes] = await Promise.all([
        fees.getTypes(),
        fees.getDiscounts(),
        academicSessions.getAll(),
        classConfig.getGrades({ academic_session_id: sessionId })
      ]);

      if (feeTypesRes?.success) setFeeTypes(feeTypesRes.data || []);
      if (discountsRes?.success) setDiscountTypes(discountsRes.data || []);
      if (sessionsRes?.success) setSessions(sessionsRes.data || []);
      if (gradesRes?.success) setGrades(gradesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFeeStructures = async () => {
    if (!selectedSessionId) return;
    try {
      const response = await fees.getStructures({ academic_session_id: selectedSessionId });
      if (response?.success) {
        setFeeStructures(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching fee structures:', error);
    }
  };

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  // Fee Type handlers
  const openFeeTypeModal = (feeType = null) => {
    if (feeType) {
      setEditingItem(feeType);
      setFeeTypeForm({
        name: feeType.name, code: feeType.code, description: feeType.description || '',
        category: feeType.category, frequency: feeType.frequency,
        applicabilityType: feeType.applicabilityType || 'full_year',
        applicableMonths: feeType.applicableMonths || [],
        isProratedOnJoin: feeType.isProratedOnJoin || false,
        isMandatory: feeType.isMandatory, isRefundable: feeType.isRefundable,
        taxApplicable: feeType.taxApplicable, taxPercentage: feeType.taxPercentage || 0,
        lateFeeApplicable: feeType.lateFeeApplicable, lateFeeType: feeType.lateFeeType || 'fixed',
        lateFeeValue: feeType.lateFeeValue || 0, isActive: feeType.isActive
      });
    } else {
      setEditingItem(null);
      setFeeTypeForm({
        name: '', code: '', description: '', category: 'academic', frequency: 'monthly',
        applicabilityType: 'full_year', applicableMonths: [], isProratedOnJoin: false,
        isMandatory: true, isRefundable: false, taxApplicable: false, taxPercentage: 0,
        lateFeeApplicable: false, lateFeeType: 'fixed', lateFeeValue: 0, isActive: true
      });
    }
    setShowFeeTypeModal(true);
  };

  const handleFeeTypeSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (editingItem) {
        response = await fees.updateType(editingItem.id, feeTypeForm);
      } else {
        response = await fees.createType(feeTypeForm);
      }

      if (response?.success) {
        toast.success(editingItem ? 'Fee type updated' : 'Fee type created');
        setShowFeeTypeModal(false);
        fetchInitialData();
      } else {
        toast.error(response?.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Failed to save fee type');
    }
  };

  const handleDeleteFeeType = async (id) => {
    try {
      const response = await fees.deleteType(id);
      if (response?.success) {
        toast.success('Fee type deleted');
        setShowDeleteConfirm(null);
        fetchInitialData();
      } else {
        toast.error(response?.message || 'Failed to delete');
      }
    } catch (error) {
      toast.error('Failed to delete fee type');
    }
  };

  const handleQuickAddFeeTypes = async () => {
    const existingCodes = feeTypes.map(ft => ft.code);
    const toAdd = FEE_TYPE_TEMPLATES.filter(t => !existingCodes.includes(t.code));
    
    if (toAdd.length === 0) {
      toast.info('All common fee types already exist');
      return;
    }

    try {
      const response = await fees.bulkCreateTypes(toAdd);
      if (response?.success) {
        toast.success(response.message);
        fetchInitialData();
      }
    } catch (error) {
      toast.error('Failed to add fee types');
    }
  };

  // Fee Structure handlers
  const openStructureModal = (structure = null) => {
    if (structure) {
      setEditingItem(structure);
      setStructureForm({
        feeTypeId: structure.feeTypeId, classGradeId: structure.classGradeId || '',
        amount: structure.amount, dueDay: structure.dueDay || 10, isActive: structure.isActive
      });
    } else {
      setEditingItem(null);
      setStructureForm({
        feeTypeId: '', classGradeId: '', amount: '', dueDay: 10, isActive: true
      });
    }
    setShowStructureModal(true);
  };

  const handleStructureSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSessionId) {
      toast.error('Please select an academic session');
      return;
    }

    try {
      const data = {
        ...structureForm,
        amount: parseFloat(structureForm.amount),
        academicSessionId: selectedSessionId,
        classGradeId: structureForm.classGradeId || null
      };

      let response;
      if (editingItem) {
        response = await fees.updateStructure(editingItem.id, data);
      } else {
        response = await fees.createStructure(data);
      }

      if (response?.success) {
        toast.success(editingItem ? 'Fee structure updated' : 'Fee structure created');
        setShowStructureModal(false);
        fetchFeeStructures();
      } else {
        toast.error(response?.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Failed to save fee structure');
    }
  };

  const handleDeleteStructure = async (id) => {
    try {
      const response = await fees.deleteStructure(id);
      if (response?.success) {
        toast.success('Fee structure deleted');
        setShowDeleteConfirm(null);
        fetchFeeStructures();
      }
    } catch (error) {
      toast.error('Failed to delete fee structure');
    }
  };

  const handleBulkAddStructures = async (feeTypeId) => {
    if (grades.length === 0) {
      toast.error('Please add classes first');
      return;
    }

    const amount = prompt('Enter fee amount for all classes:');
    if (!amount || isNaN(parseFloat(amount))) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const response = await fees.bulkCreateStructures({
        feeTypeId,
        classGradeIds: grades.map(g => g.id),
        academicSessionId: selectedSessionId,
        amount: parseFloat(amount),
        dueDay: 10
      });

      if (response?.success) {
        toast.success(response.message);
        fetchFeeStructures();
      }
    } catch (error) {
      toast.error('Failed to create fee structures');
    }
  };

  // Discount handlers
  const openDiscountModal = (discount = null) => {
    if (discount) {
      setEditingItem(discount);
      setDiscountForm({
        name: discount.name, code: discount.code, description: discount.description || '',
        discountType: discount.discountType, discountValue: discount.discountValue,
        maxDiscountAmount: discount.maxDiscountAmount || '',
        eligibilityCriteria: discount.eligibilityCriteria || '',
        requiresApproval: discount.requiresApproval, isActive: discount.isActive
      });
    } else {
      setEditingItem(null);
      setDiscountForm({
        name: '', code: '', description: '', discountType: 'percentage', discountValue: '',
        maxDiscountAmount: '', eligibilityCriteria: '', requiresApproval: false, isActive: true
      });
    }
    setShowDiscountModal(true);
  };

  const handleDiscountSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...discountForm,
        discountValue: parseFloat(discountForm.discountValue),
        maxDiscountAmount: discountForm.maxDiscountAmount ? parseFloat(discountForm.maxDiscountAmount) : null
      };

      let response;
      if (editingItem) {
        response = await fees.updateDiscount(editingItem.id, data);
      } else {
        response = await fees.createDiscount(data);
      }

      if (response?.success) {
        toast.success(editingItem ? 'Discount updated' : 'Discount created');
        setShowDiscountModal(false);
        fetchInitialData();
      } else {
        toast.error(response?.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Failed to save discount');
    }
  };

  const handleDeleteDiscount = async (id) => {
    try {
      const response = await fees.deleteDiscount(id);
      if (response?.success) {
        toast.success('Discount deleted');
        setShowDeleteConfirm(null);
        fetchInitialData();
      }
    } catch (error) {
      toast.error('Failed to delete discount');
    }
  };

  const handleQuickAddDiscounts = async () => {
    const existingCodes = discountTypes.map(d => d.code);
    const toAdd = DISCOUNT_TEMPLATES.filter(t => !existingCodes.includes(t.code));
    
    if (toAdd.length === 0) {
      toast.info('All common discounts already exist');
      return;
    }

    try {
      const response = await fees.bulkCreateDiscounts(toAdd);
      if (response?.success) {
        toast.success(response.message);
        fetchInitialData();
      }
    } catch (error) {
      toast.error('Failed to add discounts');
    }
  };

  const getCategoryStyle = (category) => {
    const cat = CATEGORY_OPTIONS.find(c => c.value === category);
    return cat?.color || 'bg-gray-100 text-gray-700';
  };

  // Group structures by fee type
  const groupedStructures = feeTypes.map(ft => ({
    ...ft,
    structures: feeStructures.filter(fs => fs.feeTypeId === ft.id)
  }));

  const tabs = [
    { id: 'types', label: 'Fee Types', icon: Tag, count: feeTypes.length },
    { id: 'structures', label: 'Fee Structure', icon: Layers, count: feeStructures.length },
    { id: 'discounts', label: 'Discounts', icon: Percent, count: discountTypes.length },
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
        <h1 className="text-2xl font-bold text-gray-800">Finance & Fee Configuration</h1>
        <p className="text-gray-600 mt-1">Configure fee types, structures, and discounts</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              activeTab === tab.id ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* FEE TYPES TAB */}
      {activeTab === 'types' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Fee Types</h3>
              <p className="text-sm text-gray-500 mt-1">Define types of fees collected by the school</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleQuickAddFeeTypes}
                className="px-4 py-2 border border-green-200 text-green-600 rounded-lg hover:bg-green-50 transition-colors text-sm"
              >
                Quick Add Common
              </button>
              <button
                onClick={() => openFeeTypeModal()}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700"
              >
                <Plus className="w-4 h-4" />
                Add Fee Type
              </button>
            </div>
          </div>

          {feeTypes.length === 0 ? (
            <div className="text-center py-12">
              <IndianRupee className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Fee Types Yet</h3>
              <p className="text-gray-600 mb-4">Start by adding fee types or use Quick Add</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {feeTypes.map(feeType => (
                <div
                  key={feeType.id}
                  className="p-4 rounded-xl border-2 border-gray-200 hover:border-green-200 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                        <IndianRupee className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{feeType.name}</h4>
                        <p className="text-xs text-gray-500">{feeType.code}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openFeeTypeModal(feeType)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm({ type: 'feeType', item: feeType })}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getCategoryStyle(feeType.category)}`}>
                      {CATEGORY_OPTIONS.find(c => c.value === feeType.category)?.label || feeType.category}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                      {FREQUENCY_OPTIONS.find(f => f.value === feeType.frequency)?.label || feeType.frequency}
                    </span>
                    {feeType.applicabilityType === 'specific_months' && feeType.applicableMonths?.length > 0 && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                        {feeType.applicableMonths.length} months
                      </span>
                    )}
                    {feeType.isProratedOnJoin && (
                      <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">Prorated</span>
                    )}
                    {feeType.isMandatory && (
                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded-full">Required</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FEE STRUCTURE TAB */}
      {activeTab === 'structures' && (
        <div className="card">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Fee Structure</h3>
              <p className="text-sm text-gray-500 mt-1">Define fee amounts per class per session</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Session Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowSessionDropdown(!showSessionDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-green-300 transition-colors min-w-[180px]"
                >
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="flex-1 text-left text-sm">{selectedSession?.name || 'Select Session'}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                
                {showSessionDropdown && (
                  <div className="absolute top-full right-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                    {sessions.map(session => (
                      <button
                        key={session.id}
                        onClick={() => { setSelectedSessionId(session.id); setShowSessionDropdown(false); }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${
                          selectedSessionId === session.id ? 'bg-green-50 text-green-600' : ''
                        }`}
                      >
                        {session.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => openStructureModal()}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700"
              >
                <Plus className="w-4 h-4" />
                Add Structure
              </button>
            </div>
          </div>

          {selectedSession && (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg mb-6">
              <Calendar className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Session: {selectedSession.name}</span>
              <span className="text-sm text-green-600 ml-auto">{feeStructures.length} fee structures</span>
            </div>
          )}

          {!selectedSessionId ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">Select Academic Session</h3>
              <p className="text-gray-600">Please select a session to configure fee structures</p>
            </div>
          ) : feeTypes.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Fee Types</h3>
              <p className="text-gray-600">Please create fee types first</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedStructures.map(feeType => (
                <div key={feeType.id} className="border-2 border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-green-600 to-emerald-600">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                        <IndianRupee className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{feeType.name}</h4>
                        <p className="text-sm text-green-100">{feeType.structures.length} class structures</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleBulkAddStructures(feeType.id)}
                      className="text-sm bg-white/20 hover:bg-white/30 text-white font-medium px-4 py-2 rounded-lg transition-colors"
                    >
                      + Add for All Classes
                    </button>
                  </div>
                  
                  {feeType.structures.length > 0 ? (
                    <div className="p-4 bg-gray-50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {feeType.structures.map(fs => (
                        <div
                          key={fs.id}
                          className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-800">{fs.classDisplayName || 'All Classes'}</p>
                            <p className="text-lg font-bold text-green-600">₹{fs.amount.toLocaleString()}</p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => openStructureModal(fs)}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm({ type: 'structure', item: fs })}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 bg-gray-50 text-center text-gray-500 text-sm">
                      No fee structures defined for this fee type
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DISCOUNTS TAB */}
      {activeTab === 'discounts' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Discount Types</h3>
              <p className="text-sm text-gray-500 mt-1">Define discounts and concessions</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleQuickAddDiscounts}
                className="px-4 py-2 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors text-sm"
              >
                Quick Add Common
              </button>
              <button
                onClick={() => openDiscountModal()}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700"
              >
                <Plus className="w-4 h-4" />
                Add Discount
              </button>
            </div>
          </div>

          {discountTypes.length === 0 ? (
            <div className="text-center py-12">
              <Percent className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Discounts Yet</h3>
              <p className="text-gray-600 mb-4">Add discount types or use Quick Add</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {discountTypes.map(discount => (
                <div
                  key={discount.id}
                  className="p-4 rounded-xl border-2 border-gray-200 hover:border-purple-200 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                        <Percent className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{discount.name}</h4>
                        <p className="text-xs text-gray-500">{discount.code}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openDiscountModal(discount)}
                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm({ type: 'discount', item: discount })}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-2xl font-bold text-purple-600">
                      {discount.discountType === 'percentage' ? `${discount.discountValue}%` : `₹${discount.discountValue}`}
                    </p>
                    {discount.description && (
                      <p className="text-sm text-gray-500 mt-1">{discount.description}</p>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      discount.discountType === 'percentage' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {discount.discountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                    </span>
                    {discount.requiresApproval && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                        Needs Approval
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FEE TYPE MODAL */}
      {showFeeTypeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingItem ? 'Edit Fee Type' : 'Add Fee Type'}
                </h3>
                <button onClick={() => setShowFeeTypeModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleFeeTypeSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={feeTypeForm.name}
                    onChange={(e) => setFeeTypeForm({ ...feeTypeForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                  <input
                    type="text"
                    value={feeTypeForm.code}
                    onChange={(e) => setFeeTypeForm({ ...feeTypeForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={feeTypeForm.category}
                    onChange={(e) => setFeeTypeForm({ ...feeTypeForm, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {CATEGORY_OPTIONS.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                  <select
                    value={feeTypeForm.frequency}
                    onChange={(e) => setFeeTypeForm({ ...feeTypeForm, frequency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {FREQUENCY_OPTIONS.map(freq => (
                      <option key={freq.value} value={freq.value}>{freq.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={feeTypeForm.description}
                  onChange={(e) => setFeeTypeForm({ ...feeTypeForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              {/* Applicability Settings */}
              {(feeTypeForm.frequency === 'monthly' || feeTypeForm.frequency === 'quarterly') && (
                <div className="p-4 bg-blue-50 rounded-lg space-y-3 border border-blue-200">
                  <h4 className="font-medium text-blue-800 text-sm">Applicability Settings</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">When does this fee apply?</label>
                    <select
                      value={feeTypeForm.applicabilityType}
                      onChange={(e) => setFeeTypeForm({ ...feeTypeForm, applicabilityType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    >
                      {APPLICABILITY_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label} - {opt.description}</option>
                      ))}
                    </select>
                  </div>

                  {feeTypeForm.applicabilityType === 'specific_months' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Applicable Months</label>
                      <div className="grid grid-cols-4 gap-2">
                        {MONTHS.map(month => (
                          <label key={month.value} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={feeTypeForm.applicableMonths?.includes(month.value)}
                              onChange={(e) => {
                                const months = feeTypeForm.applicableMonths || [];
                                if (e.target.checked) {
                                  setFeeTypeForm({ ...feeTypeForm, applicableMonths: [...months, month.value] });
                                } else {
                                  setFeeTypeForm({ ...feeTypeForm, applicableMonths: months.filter(m => m !== month.value) });
                                }
                              }}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            {month.label.slice(0, 3)}
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        Tip: For transport fee, select only school working months (exclude summer vacation months)
                      </p>
                    </div>
                  )}

                  <label className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      checked={feeTypeForm.isProratedOnJoin}
                      onChange={(e) => setFeeTypeForm({ ...feeTypeForm, isProratedOnJoin: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Prorate for mid-month admissions</span>
                  </label>
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={feeTypeForm.isMandatory}
                    onChange={(e) => setFeeTypeForm({ ...feeTypeForm, isMandatory: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Mandatory</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={feeTypeForm.isRefundable}
                    onChange={(e) => setFeeTypeForm({ ...feeTypeForm, isRefundable: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Refundable</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={feeTypeForm.lateFeeApplicable}
                    onChange={(e) => setFeeTypeForm({ ...feeTypeForm, lateFeeApplicable: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Late Fee</span>
                </label>
              </div>

              {feeTypeForm.lateFeeApplicable && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Late Fee Type</label>
                    <select
                      value={feeTypeForm.lateFeeType}
                      onChange={(e) => setFeeTypeForm({ ...feeTypeForm, lateFeeType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    >
                      <option value="fixed">Fixed Amount</option>
                      <option value="percentage">Percentage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Late Fee Value {feeTypeForm.lateFeeType === 'percentage' ? '(%)' : '(₹)'}
                    </label>
                    <input
                      type="number"
                      value={feeTypeForm.lateFeeValue}
                      onChange={(e) => setFeeTypeForm({ ...feeTypeForm, lateFeeValue: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowFeeTypeModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700">
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FEE STRUCTURE MODAL */}
      {showStructureModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingItem ? 'Edit Fee Structure' : 'Add Fee Structure'}
                </h3>
                <button onClick={() => setShowStructureModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleStructureSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Type *</label>
                <select
                  value={structureForm.feeTypeId}
                  onChange={(e) => setStructureForm({ ...structureForm, feeTypeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  disabled={!!editingItem}
                >
                  <option value="">Select Fee Type</option>
                  {feeTypes.map(ft => (
                    <option key={ft.id} value={ft.id}>{ft.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class (optional)</label>
                <select
                  value={structureForm.classGradeId}
                  onChange={(e) => setStructureForm({ ...structureForm, classGradeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={!!editingItem}
                >
                  <option value="">All Classes</option>
                  {grades.map(g => (
                    <option key={g.id} value={g.id}>{g.displayName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    value={structureForm.amount}
                    onChange={(e) => setStructureForm({ ...structureForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Day</label>
                  <input
                    type="number"
                    value={structureForm.dueDay}
                    onChange={(e) => setStructureForm({ ...structureForm, dueDay: parseInt(e.target.value) })}
                    min="1"
                    max="28"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowStructureModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700">
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISCOUNT MODAL */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingItem ? 'Edit Discount' : 'Add Discount'}
                </h3>
                <button onClick={() => setShowDiscountModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleDiscountSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={discountForm.name}
                    onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                  <input
                    type="text"
                    value={discountForm.code}
                    onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={discountForm.discountType}
                    onChange={(e) => setDiscountForm({ ...discountForm, discountType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
                  <input
                    type="number"
                    value={discountForm.discountValue}
                    onChange={(e) => setDiscountForm({ ...discountForm, discountValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={discountForm.description}
                  onChange={(e) => setDiscountForm({ ...discountForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={discountForm.requiresApproval}
                  onChange={(e) => setDiscountForm({ ...discountForm, requiresApproval: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-sm text-gray-700">Requires Approval</span>
              </label>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowDiscountModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700">
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this item?</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (showDeleteConfirm.type === 'feeType') handleDeleteFeeType(showDeleteConfirm.item.id);
                    else if (showDeleteConfirm.type === 'structure') handleDeleteStructure(showDeleteConfirm.item.id);
                    else if (showDeleteConfirm.type === 'discount') handleDeleteDiscount(showDeleteConfirm.item.id);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
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

export default FeeConfiguration;

