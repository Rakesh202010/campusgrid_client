import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  IndianRupee, Search, FileText, TrendingUp, Clock, CheckCircle,
  Calendar, Printer, X, ChevronRight, Receipt, RefreshCw, Eye,
  Wallet, Building, Keyboard, AlertTriangle, Gift, ArrowRight,
  BarChart3, Filter, Plus, Minus, User, Phone, Hash, BookOpen,
  CreditCard, CalendarDays, AlertCircle, ChevronDown, ChevronUp,
  History, FileCheck, Info, Bus
} from 'lucide-react';
import { feeManagement, feeSettings, classConfig, fees } from '../services/api';
import { useAcademicSession } from '../contexts/AcademicSessionContext';
import { toast } from '../utils/toast';

const Fees = () => {
  const { currentSession, sessionId } = useAcademicSession();
  
  // Tab navigation
  const [activeTab, setActiveTab] = useState('collect');
  
  // Fee settings
  const [schoolFeeSettings, setSchoolFeeSettings] = useState(null);
  
  // Overview data
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  
  // Student search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentFeeDetails, setStudentFeeDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  
  // Class sections
  const [classSections, setClassSections] = useState([]);
  
  // Fee collection state
  const [selectedFees, setSelectedFees] = useState([]);
  const [collecting, setCollecting] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [focusedFeeIndex, setFocusedFeeIndex] = useState(-1);
  const [expandedSections, setExpandedSections] = useState({
    overdue: true,
    currentDue: true,
    upcoming: false,
    periodFees: true,
    annualFees: true,
    pendingDues: true,
    paidFees: false,
    history: false
  });
  
  // Reports
  const [reportType, setReportType] = useState('collection');
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    fromDate: new Date().toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    classSectionId: ''
  });
  
  // Refs for keyboard navigation
  const searchInputRef = useRef(null);
  const feeListRef = useRef(null);
  const collectBtnRef = useRef(null);

  // Keyboard shortcuts guide
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetchOverview();
      fetchClassSections();
      fetchFeeSettings();
    }
  }, [sessionId]);

  useEffect(() => {
    if (activeTab === 'reports' && sessionId) {
      fetchReport();
    }
  }, [activeTab, reportType, reportFilters, sessionId]);

  // Global keyboard handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't handle if typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        // Special handling for search input
        if (e.target === searchInputRef.current) {
          if (e.key === 'ArrowDown' && searchResults.length > 0) {
            e.preventDefault();
            setSelectedResultIndex(prev => Math.min(prev + 1, searchResults.length - 1));
          } else if (e.key === 'ArrowUp' && searchResults.length > 0) {
            e.preventDefault();
            setSelectedResultIndex(prev => Math.max(prev - 1, 0));
          } else if (e.key === 'Enter' && searchResults.length > 0) {
            e.preventDefault();
            selectStudent(searchResults[selectedResultIndex]);
          } else if (e.key === 'Escape') {
            setSearchResults([]);
            setSearchQuery('');
          }
        }
        return;
      }

      // Global shortcuts
      if (e.key === '/' || (e.key === 'f' && !e.ctrlKey && !e.metaKey)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (selectedStudent) {
          clearStudent();
        }
      } else if (e.key === 'Enter' && selectedFees.length > 0 && !collecting) {
        e.preventDefault();
        handleCollectFee();
      } else if (e.key === '?') {
        setShowShortcuts(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchResults, selectedResultIndex, selectedStudent, selectedFees, collecting]);

  const fetchFeeSettings = async () => {
    try {
      const res = await feeSettings.getSchoolSettings({ academic_session_id: sessionId });
      if (res?.success) {
        setSchoolFeeSettings(res.data);
      }
    } catch (e) {
      console.error('Fee settings error:', e);
    }
  };

  const fetchOverview = async () => {
    setLoadingOverview(true);
    try {
      const res = await feeManagement.getOverview({ academic_session_id: sessionId });
      if (res?.success) {
        setOverview(res.data);
      }
    } catch (e) {
      console.error('Overview error:', e);
    } finally {
      setLoadingOverview(false);
    }
  };

  const fetchClassSections = async () => {
    try {
      const res = await classConfig.getClassSections({ academic_session_id: sessionId });
      if (res?.success) {
        setClassSections(res.data || []);
      }
    } catch (e) {
      console.error('Class sections error:', e);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);
    setSelectedResultIndex(0);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    if (!sessionId) {
      toast.error('Please wait, loading session...');
      return;
    }
    
    setSearching(true);
    try {
      const res = await feeManagement.searchStudents({
        search: query,
        academic_session_id: sessionId
      });
      if (res?.success) {
        setSearchResults(res.data || []);
      }
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setSearching(false);
    }
  };

  const selectStudent = async (student) => {
    if (!sessionId) return;
    
    setSelectedStudent(student);
    setSearchResults([]);
    setSearchQuery('');
    setSelectedFees([]);
    setLoadingDetails(true);
    
    try {
      // Use the new student dues endpoint that returns organized dues
      const res = await fees.getStudentDues(student.id, { academic_session_id: sessionId });
      
      if (res?.success) {
        setStudentFeeDetails(res.data);
        
        // Auto-expand sections based on data availability
        setExpandedSections({
          periodFees: false, // We'll use overdue/current/upcoming instead
          annualFees: false,
          pendingDues: (res.data.overdue?.length || 0) > 0 || (res.data.currentDue?.length || 0) > 0,
          paidFees: false,
          history: false,
          overdue: (res.data.overdue?.length || 0) > 0,
          currentDue: (res.data.currentDue?.length || 0) > 0,
          upcoming: false
        });
        
        // Auto-select overdue and current dues
        const autoSelect = [...(res.data.overdue || []), ...(res.data.currentDue || [])].map(due => ({
          ...due,
          payAmount: due.balance,
          discountAmount: 0,
          fineAmount: due.lateFee || 0
        }));
        if (autoSelect.length > 0) {
          setSelectedFees(autoSelect);
        }
      } else {
        // Fallback to old endpoint if new one fails
        const fallbackRes = await feeManagement.getStudentFeeDetails(student.id, { academic_session_id: sessionId });
        if (fallbackRes?.success) {
          setStudentFeeDetails(fallbackRes.data);
          setExpandedSections({
            periodFees: (fallbackRes.data.periodWiseFees?.length || 0) > 0,
            annualFees: (fallbackRes.data.applicableFees?.length || 0) > 0,
            pendingDues: (fallbackRes.data.pendingDues?.length || 0) > 0,
            paidFees: false,
            history: false
          });
        }
      }
    } catch (e) {
      console.error('Fee details error:', e);
      toast.error('Failed to load fee details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const toggleFeeSelection = (fee) => {
    setSelectedFees(prev => {
      const key = fee.id || `${fee.feeTypeId}_${fee.periodName || 'annual'}`;
      const exists = prev.find(f => (f.id || `${f.feeTypeId}_${f.periodName || 'annual'}`) === key);
      
      if (exists) {
        return prev.filter(f => (f.id || `${f.feeTypeId}_${f.periodName || 'annual'}`) !== key);
      } else {
        // Add with calculated values
        return [...prev, {
          ...fee,
          payAmount: fee.balance || fee.amount,
          discountAmount: 0,
          fineAmount: fee.lateFee || fee.fineAmount || 0
        }];
      }
    });
  };

  const updateFeeAmount = (feeKey, field, value) => {
    setSelectedFees(prev => prev.map(f => {
      const key = f.id || `${f.feeTypeId}_${f.periodName || 'annual'}`;
      if (key === feeKey) {
        return { ...f, [field]: parseFloat(value) || 0 };
      }
      return f;
    }));
  };

  const isSelected = (fee) => {
    const key = fee.id || `${fee.feeTypeId}_${fee.periodName || 'annual'}`;
    return selectedFees.some(f => (f.id || `${f.feeTypeId}_${f.periodName || 'annual'}`) === key);
  };

  const calculateTotal = () => {
    return selectedFees.reduce((sum, f) => {
      const net = (f.payAmount || 0) - (f.discountAmount || 0) + (f.fineAmount || 0);
      return sum + net;
    }, 0);
  };

  const handleCollectFee = async () => {
    if (selectedFees.length === 0) {
      toast.error('Please select at least one fee');
      return;
    }

    const totalAmount = selectedFees.reduce((sum, f) => sum + (f.payAmount || 0), 0);
    const discountAmount = selectedFees.reduce((sum, f) => sum + (f.discountAmount || 0), 0);
    const fineAmount = selectedFees.reduce((sum, f) => sum + (f.fineAmount || 0), 0);
    const netAmount = calculateTotal();

    setCollecting(true);
    try {
      const res = await feeManagement.collectFee({
        student_id: selectedStudent.id,
        academic_session_id: sessionId,
        fee_items: selectedFees.map(f => ({
          fee_type_id: f.feeTypeId,
          fee_type_name: f.feeTypeName,
          amount: f.payAmount,
          discount_amount: f.discountAmount || 0,
          fine_amount: f.fineAmount || 0,
          period_name: f.periodName,
          period_id: f.periodId,
          due_month: f.dueMonth || f.periodName
        })),
        total_amount: totalAmount,
        discount_amount: discountAmount,
        fine_amount: fineAmount,
        net_amount: netAmount,
        remarks
      });

      if (res?.success) {
        toast.success('✅ Payment collected! Opening receipt...');
        
        // Open receipt in new tab
        const receiptUrl = `/fee-receipt?id=${res.data.paymentId}`;
        window.open(receiptUrl, '_blank');
        
        // Clear student and refresh overview
        clearStudent();
        fetchOverview();
      } else {
        // Show validation errors
        if (res?.errors && res.errors.length > 0) {
          res.errors.forEach(err => toast.error(err));
        } else {
          toast.error(res?.message || 'Failed to collect payment');
        }
      }
    } catch (e) {
      console.error('Collection error:', e);
      toast.error('Failed to collect payment');
    } finally {
      setCollecting(false);
    }
  };

  const openReceipt = (paymentId) => {
    const receiptUrl = `/fee-receipt?id=${paymentId}`;
    window.open(receiptUrl, '_blank');
  };

  const fetchReport = async () => {
    if (!sessionId) return;
    
    setLoadingReport(true);
    try {
      let res;
      const params = { academic_session_id: sessionId };
      
      if (reportType === 'collection') {
        params.from_date = reportFilters.fromDate;
        params.to_date = reportFilters.toDate;
        if (reportFilters.classSectionId) params.class_section_id = reportFilters.classSectionId;
        res = await feeManagement.getCollectionReport(params);
      } else if (reportType === 'pending') {
        if (reportFilters.classSectionId) params.class_section_id = reportFilters.classSectionId;
        res = await feeManagement.getPendingDuesReport(params);
      }
      
      if (res?.success) {
        setReportData(res.data);
      }
    } catch (e) {
      console.error('Report error:', e);
    } finally {
      setLoadingReport(false);
    }
  };

  const clearStudent = () => {
    setSelectedStudent(null);
    setStudentFeeDetails(null);
    setSelectedFees([]);
    setRemarks('');
    setFocusedFeeIndex(-1);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const formatFrequency = (freq) => {
    const map = {
      'monthly': 'Monthly',
      'quarterly': 'Quarterly',
      'half_yearly': 'Half-Yearly',
      'yearly': 'Yearly',
      'annual': 'Annual',
      'one_time': 'One-Time'
    };
    return map[freq] || freq;
  };

  const getPaymentFrequencyLabel = () => {
    const freq = studentFeeDetails?.feeSettings?.paymentFrequency || schoolFeeSettings?.paymentFrequency;
    return formatFrequency(freq);
  };
  
  const getPaymentFrequencySource = () => {
    const source = studentFeeDetails?.student?.paymentFrequencySource;
    if (source === 'student') return '(Custom)';
    if (source === 'class') return '(Class)';
    return '(School)';
  };

  // Render fee item card
  const FeeItemCard = ({ fee, showPeriod = false, isOverdue = false, isPending = false }) => {
    const selected = isSelected(fee);
    const selectedFee = selected ? selectedFees.find(f => 
      (f.id || `${f.feeTypeId}_${f.periodName || 'annual'}`) === 
      (fee.id || `${fee.feeTypeId}_${fee.periodName || 'annual'}`)
    ) : null;
    
    return (
      <div
        onClick={() => toggleFeeSelection(fee)}
        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
          selected
            ? 'border-emerald-500 bg-emerald-50 shadow-md'
            : isOverdue 
              ? 'border-red-200 bg-red-50 hover:border-red-300'
              : isPending
                ? 'border-orange-200 bg-orange-50 hover:border-orange-300'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* Selection checkbox */}
          <div className={`w-6 h-6 rounded-md flex items-center justify-center mt-1 ${
            selected 
              ? 'bg-emerald-500 text-white' 
              : 'border-2 border-gray-300'
          }`}>
            {selected && <CheckCircle className="w-4 h-4" />}
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Fee name and badges */}
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <h5 className="font-semibold text-gray-800">{fee.feeTypeName}</h5>
              
              {showPeriod && fee.periodName && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                  {fee.periodName}
                </span>
              )}
              
              {isOverdue && (
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Overdue
                </span>
              )}
              
              {fee.isPartiallyPaid && (
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                  Partial
                </span>
              )}
              
              {fee.lateFee > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                  +₹{fee.lateFee} Late Fee
                </span>
              )}
            </div>
            
            {/* Details row */}
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="capitalize">{fee.category}</span>
              <span>•</span>
              <span>{formatFrequency(fee.frequency)}</span>
              
              {fee.dueDate && (
                <>
                  <span>•</span>
                  <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                    Due: {new Date(fee.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </span>
                </>
              )}
            </div>
            
            {/* Paid amount info */}
            {fee.paidAmount > 0 && (
              <p className="text-xs text-green-600 mt-1">
                Already Paid: ₹{fee.paidAmount.toLocaleString()}
              </p>
            )}
          </div>
          
          {/* Amount */}
          <div className="text-right">
            <p className="text-lg font-bold text-gray-800">
              ₹{(fee.balance || fee.amount)?.toLocaleString()}
            </p>
            {fee.originalAmount && fee.originalAmount !== (fee.balance || fee.amount) && (
              <p className="text-xs text-gray-400 line-through">
                ₹{fee.originalAmount.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Section header component
  const SectionHeader = ({ title, icon: Icon, count, color = 'gray', expanded, onToggle }) => (
    <button
      onClick={onToggle}
      className={`w-full flex items-center justify-between p-3 rounded-lg bg-${color}-50 hover:bg-${color}-100 transition-colors`}
    >
      <div className="flex items-center gap-2">
        <Icon className={`w-5 h-5 text-${color}-600`} />
        <h4 className="font-semibold text-gray-800">{title}</h4>
        {count > 0 && (
          <span className={`px-2 py-0.5 bg-${color}-200 text-${color}-700 text-xs rounded-full font-medium`}>
            {count}
          </span>
        )}
      </div>
      {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
    </button>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white">
            <IndianRupee className="w-6 h-6" />
            <h1 className="text-xl font-bold">Fee Collection</h1>
          </div>
          {currentSession && (
            <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm">
              {currentSession.name}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {/* Quick Stats */}
          {overview && (
            <div className="flex items-center gap-6 text-white/90 text-sm">
              <div>
                <span className="text-white/60">Today:</span>
                <span className="ml-2 font-bold">₹{overview.today?.amount?.toLocaleString() || 0}</span>
              </div>
              <div>
                <span className="text-white/60">Pending:</span>
                <span className="ml-2 font-bold text-yellow-300">₹{overview.pendingDues?.amount?.toLocaleString() || 0}</span>
              </div>
            </div>
          )}
          
          {/* Tabs */}
          <div className="flex bg-white/20 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('collect')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'collect' ? 'bg-white text-emerald-700' : 'text-white hover:bg-white/10'
              }`}
            >
              <Wallet className="w-4 h-4 inline mr-1" />
              Collect
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'reports' ? 'bg-white text-emerald-700' : 'text-white hover:bg-white/10'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-1" />
              Reports
            </button>
          </div>
          
          {/* Keyboard Shortcuts */}
          <button
            onClick={() => setShowShortcuts(true)}
            className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30"
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'collect' && (
          <div className="h-full flex">
            {/* Left Panel - Student Search & Fee Selection */}
            <div className="w-2/3 border-r border-gray-200 flex flex-col">
              {/* Search Bar */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search student by name, admission no, or phone... (Press / to focus)"
                    className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-0 focus:outline-none"
                    autoFocus
                  />
                  {searching && (
                    <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                  )}
                </div>
                
                {/* Search Results Dropdown */}
                {searchResults.length > 0 && (
                  <div className="absolute z-20 left-4 right-4 mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-80 overflow-y-auto">
                    {searchResults.map((student, idx) => (
                      <button
                        key={student.id}
                        onClick={() => selectStudent(student)}
                        className={`w-full flex items-center gap-4 p-4 text-left border-b last:border-b-0 transition-colors ${
                          idx === selectedResultIndex ? 'bg-emerald-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                          {student.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{student.name}</p>
                          <p className="text-sm text-gray-500">{student.admissionNumber} • {student.className}</p>
                        </div>
                        <div className="text-sm text-gray-400">
                          Press Enter or Click
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Student Details & Fee List */}
              <div className="flex-1 overflow-y-auto p-4">
                {!selectedStudent ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Search className="w-16 h-16 mb-4 opacity-30" />
                    <p className="text-lg">Search and select a student to collect fees</p>
                    <p className="text-sm mt-2">Press <kbd className="px-2 py-1 bg-gray-200 rounded text-gray-600">/</kbd> to start searching</p>
                  </div>
                ) : loadingDetails ? (
                  <div className="h-full flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Student Info Card - Enhanced */}
                    <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-5 text-white">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center text-2xl font-bold">
                            {selectedStudent.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">{studentFeeDetails?.student?.name || selectedStudent.name}</h3>
                            <div className="flex items-center gap-4 text-gray-300 text-sm mt-1">
                              <span className="flex items-center gap-1">
                                <Hash className="w-3.5 h-3.5" />
                                {studentFeeDetails?.student?.admissionNumber || selectedStudent.admissionNumber}
                              </span>
                              <span className="flex items-center gap-1">
                                <BookOpen className="w-3.5 h-3.5" />
                                {studentFeeDetails?.student?.className || selectedStudent.className}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={clearStudent}
                          className="p-2 hover:bg-white/10 rounded-lg"
                          title="Clear (Esc)"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      
                      {/* Additional Student Info */}
                      <div className="grid grid-cols-3 gap-4 text-sm border-t border-white/10 pt-4">
                        {studentFeeDetails?.student?.fatherName && (
                          <div>
                            <p className="text-gray-400 text-xs">Father's Name</p>
                            <p className="font-medium">{studentFeeDetails.student.fatherName}</p>
                          </div>
                        )}
                        {studentFeeDetails?.student?.phone && (
                          <div>
                            <p className="text-gray-400 text-xs">Phone</p>
                            <p className="font-medium flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5" />
                              {studentFeeDetails.student.phone}
                            </p>
                          </div>
                        )}
                        {studentFeeDetails?.student?.rollNumber && (
                          <div>
                            <p className="text-gray-400 text-xs">Roll No.</p>
                            <p className="font-medium">{studentFeeDetails.student.rollNumber}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Fee Summary & Payment Mode */}
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="bg-white/10 rounded-lg p-3 text-center">
                          <p className="text-gray-400 text-xs uppercase">Total Due</p>
                          <p className="text-xl font-bold text-red-400">
                            ₹{studentFeeDetails?.summary?.balance?.toLocaleString() || 0}
                          </p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3 text-center">
                          <p className="text-gray-400 text-xs uppercase">Total Paid</p>
                          <p className="text-xl font-bold text-green-400">
                            ₹{studentFeeDetails?.summary?.totalPaid?.toLocaleString() || 0}
                          </p>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3 text-center">
                          <p className="text-gray-400 text-xs uppercase">Payment Mode</p>
                          <p className="text-lg font-bold text-blue-300">
                            {getPaymentFrequencyLabel()}
                          </p>
                          <p className="text-xs text-blue-400/70">
                            {getPaymentFrequencySource()}
                          </p>
                        </div>
                      </div>
                      
                      {/* Late Fee Info */}
                      {studentFeeDetails?.summary?.totalLateFees > 0 && (
                        <div className="mt-3 p-2 bg-red-500/20 rounded-lg flex items-center justify-between">
                          <span className="text-red-200 text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Late fees applicable
                          </span>
                          <span className="text-red-300 font-bold">
                            +₹{studentFeeDetails.summary.totalLateFees.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Fee List - Simple Clean View */}
                    <div className="space-y-4" ref={feeListRef}>
                      
                      {/* Combine all payable fees into one clean list */}
                      {(() => {
                        // Combine all fee sources into one list
                        const allFees = [];
                        
                        // Add overdue fees
                        (studentFeeDetails?.overdue || []).forEach(f => allFees.push({ ...f, status: 'overdue' }));
                        
                        // Add current dues
                        (studentFeeDetails?.currentDue || []).forEach(f => allFees.push({ ...f, status: 'current' }));
                        
                        // Add period-wise fees (fallback)
                        if (!studentFeeDetails?.overdue?.length && !studentFeeDetails?.currentDue?.length) {
                          (studentFeeDetails?.periodWiseFees || []).forEach(f => 
                            allFees.push({ ...f, status: f.isOverdue ? 'overdue' : 'current' })
                          );
                        }
                        
                        // Add annual/one-time fees (fallback)
                        if (!studentFeeDetails?.overdue?.length && !studentFeeDetails?.currentDue?.length) {
                          (studentFeeDetails?.applicableFees || []).forEach(f => 
                            allFees.push({ ...f, status: 'annual' })
                          );
                        }
                        
                        // Group fees by category
                        const mandatoryFees = allFees.filter(f => f.category !== 'transport');
                        const optionalFees = allFees.filter(f => f.category === 'transport');
                        const upcomingFees = studentFeeDetails?.upcoming || [];
                        const paidFees = studentFeeDetails?.paid || studentFeeDetails?.paidFees || [];
                        
                        return (
                          <>
                            {/* Fees Payable Now */}
                            {mandatoryFees.length > 0 && (
                              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex justify-between items-center">
                                  <div className="flex items-center gap-2 text-white">
                                    <CreditCard className="w-5 h-5" />
                                    <span className="font-semibold">Fees Payable Now</span>
                                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                                      {mandatoryFees.length} items
                                    </span>
                                  </div>
                                  <span className="text-white font-bold text-lg">
                                    ₹{mandatoryFees.reduce((sum, f) => sum + (f.amount || 0) + (f.lateFee || 0), 0).toLocaleString()}
                                  </span>
                                </div>
                                <div className="divide-y divide-gray-100">
                                  {mandatoryFees.map((fee, idx) => (
                                    <div 
                                      key={fee.id || idx}
                                      onClick={() => toggleFeeSelection(fee)}
                                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-all flex items-center gap-4 ${
                                        isSelected(fee) ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''
                                      }`}
                                    >
                                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                        isSelected(fee) ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                                      }`}>
                                        {isSelected(fee) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-gray-800">{fee.feeTypeName}</span>
                                          {fee.status === 'overdue' && (
                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                              OVERDUE
                                            </span>
                                          )}
                                          {fee.periodName && (
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                              {fee.periodName}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                          {fee.frequency === 'monthly' ? 'Monthly' : 
                                           fee.frequency === 'yearly' || fee.frequency === 'one_time' ? 'Annual' :
                                           fee.frequency === 'half_yearly' ? 'Half-yearly' : fee.frequency}
                                          {fee.dueDate && ` • Due: ${new Date(fee.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-bold text-gray-800">₹{(fee.amount || 0).toLocaleString()}</p>
                                        {fee.lateFee > 0 && (
                                          <p className="text-xs text-red-600">+₹{fee.lateFee} late fee</p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Optional Fees (Transport) */}
                            {optionalFees.length > 0 && (
                              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 flex justify-between items-center">
                                  <div className="flex items-center gap-2 text-white">
                                    <Bus className="w-5 h-5" />
                                    <span className="font-semibold">Optional Fees</span>
                                  </div>
                                  <span className="text-white font-bold">
                                    ₹{optionalFees.reduce((sum, f) => sum + (f.amount || 0), 0).toLocaleString()}
                                  </span>
                                </div>
                                <div className="divide-y divide-gray-100">
                                  {optionalFees.map((fee, idx) => (
                                    <div 
                                      key={fee.id || idx}
                                      onClick={() => toggleFeeSelection(fee)}
                                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-all flex items-center gap-4 ${
                                        isSelected(fee) ? 'bg-emerald-50 border-l-4 border-emerald-500' : ''
                                      }`}
                                    >
                                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                        isSelected(fee) ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                                      }`}>
                                        {isSelected(fee) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                                      </div>
                                      <div className="flex-1">
                                        <span className="font-medium text-gray-800">{fee.feeTypeName}</span>
                                        <p className="text-xs text-gray-500 mt-0.5">{fee.periodName || 'Monthly'}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-bold text-gray-800">₹{(fee.amount || 0).toLocaleString()}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Upcoming Fees - Collapsed */}
                            {upcomingFees.length > 0 && (
                              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <button 
                                  onClick={() => toggleSection('upcoming')}
                                  className="w-full px-4 py-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100"
                                >
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <CalendarDays className="w-5 h-5" />
                                    <span className="font-medium">Upcoming ({upcomingFees.length})</span>
                                  </div>
                                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections.upcoming ? 'rotate-180' : ''}`} />
                                </button>
                                {expandedSections.upcoming && (
                                  <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
                                    {upcomingFees.slice(0, 5).map((fee, idx) => (
                                      <div key={fee.id || idx} className="p-3 flex justify-between items-center text-sm text-gray-500">
                                        <span>{fee.feeTypeName} - {fee.periodName}</span>
                                        <span>₹{(fee.amount || 0).toLocaleString()}</span>
                                      </div>
                                    ))}
                                    {upcomingFees.length > 5 && (
                                      <div className="p-2 text-center text-xs text-gray-400">
                                        +{upcomingFees.length - 5} more upcoming fees
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Already Paid - Collapsed */}
                            {paidFees.length > 0 && (
                              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <button 
                                  onClick={() => toggleSection('paidFees')}
                                  className="w-full px-4 py-3 flex justify-between items-center bg-green-50 hover:bg-green-100"
                                >
                                  <div className="flex items-center gap-2 text-green-700">
                                    <CheckCircle className="w-5 h-5" />
                                    <span className="font-medium">Already Paid ({paidFees.length})</span>
                                  </div>
                                  <ChevronDown className={`w-5 h-5 text-green-400 transition-transform ${expandedSections.paidFees ? 'rotate-180' : ''}`} />
                                </button>
                                {expandedSections.paidFees && (
                                  <div className="divide-y divide-green-100 max-h-48 overflow-y-auto">
                                    {paidFees.map((fee, idx) => (
                                      <div key={idx} className="p-3 flex justify-between items-center text-sm">
                                        <span className="text-gray-700">{fee.feeTypeName} {fee.periodName && `- ${fee.periodName}`}</span>
                                        <span className="text-green-600 font-medium">₹{(fee.paidAmount || fee.totalPaid || 0).toLocaleString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* No fees to show */}
                            {mandatoryFees.length === 0 && optionalFees.length === 0 && paidFees.length === 0 && (
                              <div className="text-center py-8 bg-gray-50 rounded-xl">
                                <Info className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="text-gray-600 font-medium">No fees configured for this class</p>
                                <p className="text-sm text-gray-400 mt-1">Please configure fee structure in Settings → Fee Configuration</p>
                              </div>
                            )}

                            {/* All paid message */}
                            {mandatoryFees.length === 0 && optionalFees.length === 0 && paidFees.length > 0 && (
                              <div className="text-center py-6 bg-green-50 rounded-xl border-2 border-green-200">
                                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" />
                                <p className="font-semibold text-green-700">All fees paid! 🎉</p>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel - Payment Summary */}
            <div className="w-1/3 bg-gray-50 flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-white">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-600" />
                  Payment Summary
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4">
                {selectedFees.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Wallet className="w-12 h-12 mb-3 opacity-30" />
                    <p>Select fees to collect</p>
                    <p className="text-sm mt-2 text-center">Click on fee items to select them for collection</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedFees.map((fee) => {
                      const feeKey = fee.id || `${fee.feeTypeId}_${fee.periodName || 'annual'}`;
                      return (
                        <div key={feeKey} className="bg-white rounded-lg p-3 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-medium text-gray-800 text-sm">{fee.feeTypeName}</span>
                              {fee.periodName && (
                                <span className="ml-2 text-xs text-blue-600">({fee.periodName})</span>
                              )}
                            </div>
                            <button
                              onClick={() => toggleFeeSelection(fee)}
                              className="text-red-400 hover:text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {/* Amount Inputs */}
                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <label className="text-gray-500 block mb-1">Amount</label>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                <input
                                  type="number"
                                  value={fee.payAmount}
                                  onChange={(e) => updateFeeAmount(feeKey, 'payAmount', e.target.value)}
                                  className="w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded text-right font-medium"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-gray-500 block mb-1 flex items-center gap-1">
                                <Minus className="w-3 h-3" /> Discount
                              </label>
                              <input
                                type="number"
                                value={fee.discountAmount}
                                onChange={(e) => updateFeeAmount(feeKey, 'discountAmount', e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded text-right text-green-600"
                              />
                            </div>
                            <div>
                              <label className="text-gray-500 block mb-1 flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Fine
                              </label>
                              <input
                                type="number"
                                value={fee.fineAmount}
                                onChange={(e) => updateFeeAmount(feeKey, 'fineAmount', e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded text-right text-red-600"
                              />
                            </div>
                          </div>
                          
                          <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between text-sm">
                            <span className="text-gray-500">Net:</span>
                            <span className="font-bold text-emerald-600">
                              ₹{((fee.payAmount || 0) - (fee.discountAmount || 0) + (fee.fineAmount || 0)).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Total & Collect Button */}
              <div className="p-4 bg-white border-t border-gray-200">
                {selectedFees.length > 0 && (
                  <>
                    <div className="mb-3">
                      <input
                        type="text"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Remarks (optional)"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                    
                    {/* Summary breakdown */}
                    <div className="mb-3 p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Subtotal:</span>
                        <span>₹{selectedFees.reduce((sum, f) => sum + (f.payAmount || 0), 0).toLocaleString()}</span>
                      </div>
                      {selectedFees.reduce((sum, f) => sum + (f.discountAmount || 0), 0) > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount:</span>
                          <span>-₹{selectedFees.reduce((sum, f) => sum + (f.discountAmount || 0), 0).toLocaleString()}</span>
                        </div>
                      )}
                      {selectedFees.reduce((sum, f) => sum + (f.fineAmount || 0), 0) > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Fine/Late Fee:</span>
                          <span>+₹{selectedFees.reduce((sum, f) => sum + (f.fineAmount || 0), 0).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between mb-4 p-3 bg-emerald-50 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-500">Total Payable</p>
                        <p className="text-sm text-gray-400 flex items-center gap-1">
                          <IndianRupee className="w-3 h-3" /> Cash Payment
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-emerald-600">₹{calculateTotal().toLocaleString()}</p>
                    </div>
                    
                    <button
                      ref={collectBtnRef}
                      onClick={handleCollectFee}
                      disabled={collecting}
                      className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {collecting ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Wallet className="w-5 h-5" />
                          Collect ₹{calculateTotal().toLocaleString()}
                        </>
                      )}
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-2">
                      Press <kbd className="px-1.5 py-0.5 bg-gray-200 rounded">Enter</kbd> to collect
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="h-full overflow-y-auto p-6">
            {/* Report Type Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setReportType('collection')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  reportType === 'collection' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Collection Report
              </button>
              <button
                onClick={() => setReportType('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  reportType === 'pending' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Clock className="w-4 h-4 inline mr-2" />
                Pending Dues
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 mb-4 flex flex-wrap items-center gap-4">
              <Filter className="w-5 h-5 text-gray-400" />
              
              {reportType === 'collection' && (
                <>
                  <input
                    type="date"
                    value={reportFilters.fromDate}
                    onChange={(e) => setReportFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="date"
                    value={reportFilters.toDate}
                    onChange={(e) => setReportFilters(prev => ({ ...prev, toDate: e.target.value }))}
                    className="px-3 py-2 border border-gray-200 rounded-lg"
                  />
                </>
              )}
              
              <select
                value={reportFilters.classSectionId}
                onChange={(e) => setReportFilters(prev => ({ ...prev, classSectionId: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-lg"
              >
                <option value="">All Classes</option>
                {classSections.map(cs => (
                  <option key={cs.id} value={cs.id}>
                    {cs.gradeDisplayName || cs.gradeName} - {cs.sectionName}
                  </option>
                ))}
              </select>
              
              <button
                onClick={fetchReport}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg"
              >
                <RefreshCw className="w-4 h-4 inline mr-1" />
                Refresh
              </button>
            </div>

            {/* Report Data */}
            <div className="bg-white rounded-xl overflow-hidden">
              {loadingReport ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
              ) : reportData ? (
                <>
                  {/* Summary */}
                  <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                    <div>
                      <span className="text-gray-500">Total: </span>
                      <span className="font-bold">
                        {reportType === 'collection' ? reportData.summary?.totalPayments : reportData.summary?.totalStudents} records
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-gray-500">Amount: </span>
                      <span className={`font-bold text-lg ${reportType === 'pending' ? 'text-red-600' : 'text-green-600'}`}>
                        ₹{(reportType === 'collection' ? reportData.summary?.totalAmount : reportData.summary?.totalDueAmount)?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          {reportType === 'collection' ? (
                            <>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Receipt</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Date</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Student</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Class</th>
                              <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Amount</th>
                              <th className="text-center py-3 px-4 text-sm font-medium text-gray-600"></th>
                            </>
                          ) : (
                            <>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Student</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Adm No</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Class</th>
                              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Phone</th>
                              <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Due Amount</th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {reportType === 'collection' && reportData.payments?.map(p => (
                          <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-800">{p.receiptNumber}</td>
                            <td className="py-3 px-4 text-gray-600">{new Date(p.paymentDate).toLocaleDateString('en-IN')}</td>
                            <td className="py-3 px-4 text-gray-800">{p.studentName}</td>
                            <td className="py-3 px-4 text-gray-600">{p.className}</td>
                            <td className="py-3 px-4 text-right font-medium text-green-600">₹{p.amount?.toLocaleString()}</td>
                            <td className="py-3 px-4 text-center">
                              <button 
                                onClick={() => openReceipt(p.id)} 
                                className="text-gray-400 hover:text-emerald-600"
                                title="View Receipt"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {reportType === 'pending' && reportData.students?.map(s => (
                          <tr key={s.studentId} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-800">{s.name}</td>
                            <td className="py-3 px-4 text-gray-600">{s.admissionNumber}</td>
                            <td className="py-3 px-4 text-gray-600">{s.className}</td>
                            <td className="py-3 px-4 text-gray-600">{s.phone || '-'}</td>
                            <td className="py-3 px-4 text-right font-medium text-red-600">₹{s.totalDue?.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>No data available</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Keyboard className="w-5 h-5" />
                Keyboard Shortcuts
              </h3>
              <button onClick={() => setShowShortcuts(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {[
                { key: '/', desc: 'Focus search box' },
                { key: '↑ ↓', desc: 'Navigate search results' },
                { key: 'Enter', desc: 'Select student / Collect payment' },
                { key: 'Esc', desc: 'Clear / Close' },
                { key: '?', desc: 'Toggle this help' },
              ].map(({ key, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-gray-700">{key}</kbd>
                  <span className="text-gray-600">{desc}</span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-gray-50 rounded-b-2xl">
              <p className="text-sm text-gray-500 text-center">
                Click on fee items to select/deselect them
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fees;
