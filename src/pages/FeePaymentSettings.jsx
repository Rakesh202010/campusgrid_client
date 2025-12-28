import { useState, useEffect } from 'react';
import { 
  Settings, Calendar, Clock, IndianRupee, Percent, AlertTriangle,
  CheckCircle, X, ChevronDown, ChevronRight, RefreshCw, Save,
  Building, Users, CalendarDays, Bell, Zap, Info, Gift, Timer,
  FileText, Copy, Trash2, Star, Eye, Plus, Palette, Type, Layout,
  AlignLeft, User, Phone, MapPin, Hash, Image, Printer
} from 'lucide-react';
import { feeSettings, classConfig } from '../services/api';
import { useAcademicSession } from '../contexts/AcademicSessionContext';
import { toast } from '../utils/toast';

const PAYMENT_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly', desc: 'Fee due every month', periods: 12, icon: '📅' },
  { value: 'quarterly', label: 'Quarterly', desc: 'Fee due every 3 months', periods: 4, icon: '📆' },
  { value: 'half_yearly', label: 'Half-Yearly', desc: 'Fee due every 6 months', periods: 2, icon: '📊' },
  { value: 'yearly', label: 'Yearly', desc: 'One-time annual payment', periods: 1, icon: '📈' },
];

const PAPER_SIZES = [
  { value: 'a4', label: 'A4', desc: 'Standard (210×297mm)' },
  { value: 'a5', label: 'A5', desc: 'Half (148×210mm)' },
  { value: 'thermal', label: 'Thermal', desc: '80mm Roll' },
  { value: 'letter', label: 'Letter', desc: 'US Letter' },
];

const FONT_FAMILIES = [
  'Arial', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New', 'Tahoma', 'Trebuchet MS'
];

const COLOR_PRESETS = [
  '#059669', '#2563eb', '#7c3aed', '#dc2626', '#ea580c', '#0891b2', '#4f46e5', '#1f2937'
];

const FeePaymentSettings = () => {
  const { currentSession, sessionId } = useAcademicSession();
  
  const [activeTab, setActiveTab] = useState('school');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // School-wide settings
  const [schoolSettings, setSchoolSettings] = useState({
    paymentFrequency: 'monthly',
    dueDayOfMonth: 10,
    gracePeriodDays: 5,
    lateFee: {
      enabled: true,
      type: 'fixed',
      amount: 50,
      maxAmount: null
    },
    earlyPaymentDiscount: {
      enabled: false,
      days: 5,
      type: 'percentage',
      amount: 2
    },
    paymentRules: {
      partialPaymentAllowed: true,
      minimumPartialAmount: null,
      carryForwardDues: true
    },
    autoGeneration: {
      enabled: false,
      day: 1
    },
    reminders: {
      enabled: false,
      daysBefore: 7
    }
  });
  
  // Class-specific settings
  const [classSettings, setClassSettings] = useState([]);
  const [grades, setGrades] = useState([]);
  const [expandedClass, setExpandedClass] = useState(null);
  const [editingClassSettings, setEditingClassSettings] = useState(null);
  
  // Fee calendar
  const [feeCalendar, setFeeCalendar] = useState([]);
  const [generatingCalendar, setGeneratingCalendar] = useState(false);
  
  // Receipt Templates
  const [templates, setTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [templateEditorTab, setTemplateEditorTab] = useState('header');

  useEffect(() => {
    if (sessionId) {
      fetchData();
    }
  }, [sessionId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, classSettingsRes, gradesRes, calendarRes, templatesRes] = await Promise.all([
        feeSettings.getSchoolSettings({ academic_session_id: sessionId }),
        feeSettings.getClassSettings({ academic_session_id: sessionId }),
        classConfig.getGrades(),
        feeSettings.getCalendar({ academic_session_id: sessionId }),
        feeSettings.getTemplates()
      ]);

      if (settingsRes?.success && settingsRes.data) {
        setSchoolSettings(settingsRes.data);
      }
      if (classSettingsRes?.success) {
        setClassSettings(classSettingsRes.data || []);
      }
      if (gradesRes?.success) {
        setGrades(gradesRes.data || []);
      }
      if (calendarRes?.success) {
        setFeeCalendar(calendarRes.data || []);
      }
      if (templatesRes?.success) {
        setTemplates(templatesRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSchoolSettings = async () => {
    setSaving(true);
    try {
      const res = await feeSettings.saveSchoolSettings({
        academic_session_id: sessionId,
        settings: schoolSettings
      });
      if (res?.success) {
        toast.success('Settings saved successfully!');
      } else {
        toast.error(res?.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClassSettings = async (classGradeId, settings) => {
    try {
      const res = await feeSettings.saveClassSettings({
        academic_session_id: sessionId,
        class_grade_id: classGradeId,
        settings
      });
      if (res?.success) {
        toast.success('Class settings saved!');
        fetchData();
        setEditingClassSettings(null);
      } else {
        toast.error(res?.message || 'Failed to save');
      }
    } catch (error) {
      toast.error('Failed to save class settings');
    }
  };

  const handleDeleteClassSettings = async (id) => {
    try {
      const res = await feeSettings.deleteClassSettings(id);
      if (res?.success) {
        toast.success('Class settings removed');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to remove settings');
    }
  };

  const handleGenerateCalendar = async (classGradeId = null) => {
    setGeneratingCalendar(true);
    try {
      const res = await feeSettings.generateCalendar({
        academic_session_id: sessionId,
        class_grade_id: classGradeId
      });
      if (res?.success) {
        toast.success(res.message);
        fetchData();
      } else {
        toast.error(res?.message || 'Failed to generate calendar');
      }
    } catch (error) {
      toast.error('Failed to generate fee calendar');
    } finally {
      setGeneratingCalendar(false);
    }
  };

  const getClassSetting = (classGradeId) => {
    return classSettings.find(cs => cs.classGradeId === classGradeId);
  };

  // Template Functions
  const getDefaultTemplate = () => ({
    name: 'New Template',
    isDefault: false,
    paperSize: 'a4',
    orientation: 'portrait',
    showLogo: true,
    logoPosition: 'left',
    schoolNameSize: 'large',
    showAddress: true,
    showContact: true,
    headerColor: '#1f2937',
    receiptTitle: 'Fee Receipt',
    showReceiptNumber: true,
    receiptPrefix: 'RCP',
    showStudentPhoto: false,
    showFatherName: true,
    showMotherName: false,
    showPhone: true,
    showAddressStudent: false,
    showRollNumber: false,
    showPeriodColumn: true,
    showCategoryColumn: false,
    tableHeaderColor: '#f3f4f6',
    showAmountInWords: true,
    currencySymbol: '₹',
    footerText: 'This is a computer generated receipt. Thank you for your payment!',
    showSignatureLine: true,
    signatureLabel: 'Authorized Signature',
    showDateTime: true,
    showCollectedBy: true,
    primaryColor: '#059669',
    fontFamily: 'Arial',
    borderStyle: 'solid',
    termsText: '',
    showTerms: false
  });

  const openTemplateEditor = (template = null) => {
    setEditingTemplate(template ? { ...template } : getDefaultTemplate());
    setShowTemplateEditor(true);
    setTemplateEditorTab('header');
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate.name?.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    
    setSaving(true);
    try {
      let res;
      if (editingTemplate.id) {
        res = await feeSettings.updateTemplate(editingTemplate.id, editingTemplate);
      } else {
        res = await feeSettings.createTemplate(editingTemplate);
      }
      
      if (res?.success) {
        toast.success(editingTemplate.id ? 'Template updated!' : 'Template created!');
        setShowTemplateEditor(false);
        setEditingTemplate(null);
        fetchData();
      } else {
        toast.error(res?.message || 'Failed to save template');
      }
    } catch (error) {
      console.error('Save template error:', error);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Delete this template?')) return;
    
    try {
      const res = await feeSettings.deleteTemplate(id);
      if (res?.success) {
        toast.success('Template deleted');
        fetchData();
      } else {
        toast.error(res?.message || 'Failed to delete');
      }
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const handleDuplicateTemplate = async (id) => {
    try {
      const res = await feeSettings.duplicateTemplate(id, {});
      if (res?.success) {
        toast.success('Template duplicated!');
        fetchData();
      } else {
        toast.error(res?.message || 'Failed to duplicate');
      }
    } catch (error) {
      toast.error('Failed to duplicate template');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      const res = await feeSettings.setDefaultTemplate(id);
      if (res?.success) {
        toast.success('Default template updated');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to set default');
    }
  };

  const tabs = [
    { id: 'school', label: 'School Settings', icon: Building, desc: 'Default payment rules for all classes' },
    { id: 'class', label: 'Class Settings', icon: Users, desc: 'Override settings for specific classes' },
    { id: 'calendar', label: 'Fee Calendar', icon: CalendarDays, desc: 'View & manage fee due dates' },
    { id: 'templates', label: 'Receipt Templates', icon: FileText, desc: 'Design fee receipt layouts' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Receipt Preview Component
  const ReceiptPreview = ({ template }) => {
    const t = template || getDefaultTemplate();
    
    return (
      <div 
        className={`bg-white shadow-lg mx-auto ${
          t.paperSize === 'a5' ? 'max-w-md' : t.paperSize === 'thermal' ? 'max-w-xs' : 'max-w-2xl'
        }`}
        style={{ 
          fontFamily: t.fontFamily,
          border: t.borderStyle === 'none' ? 'none' : `2px ${t.borderStyle} ${t.primaryColor}20`
        }}
      >
        {/* Header */}
        <div 
          className="p-4 text-center"
          style={{ backgroundColor: `${t.headerColor}08`, borderBottom: `2px solid ${t.primaryColor}` }}
        >
          <div className={`flex items-center ${t.logoPosition === 'left' ? 'justify-start' : t.logoPosition === 'right' ? 'justify-end' : 'justify-center'} gap-3 mb-2`}>
            {t.showLogo && (
              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                <Image className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <h2 
              className={`font-bold ${t.schoolNameSize === 'large' ? 'text-2xl' : t.schoolNameSize === 'medium' ? 'text-xl' : 'text-lg'}`}
              style={{ color: t.headerColor }}
            >
              Sample School Name
            </h2>
          </div>
          {t.showAddress && <p className="text-gray-600 text-sm">123 School Street, City, State - 123456</p>}
          {t.showContact && <p className="text-gray-500 text-xs mt-1">Phone: +91 98765 43210 | Email: school@example.com</p>}
        </div>

        {/* Title */}
        <div className="py-3 text-center border-b border-gray-200">
          <h3 className="text-xl font-bold uppercase tracking-wide" style={{ color: t.primaryColor }}>
            {t.receiptTitle}
          </h3>
          {t.showReceiptNumber && (
            <p className="text-gray-600 font-mono mt-1">{t.receiptPrefix}-2024-001234</p>
          )}
        </div>

        {/* Student Info */}
        <div className="p-4 grid grid-cols-2 gap-4 text-sm border-b border-gray-200" style={{ backgroundColor: '#fafafa' }}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {t.showStudentPhoto && <div className="w-8 h-8 bg-gray-200 rounded"></div>}
              <div>
                <p className="text-gray-500 text-xs">Student Name</p>
                <p className="font-medium">John Doe</p>
              </div>
            </div>
            {t.showFatherName && (
              <div>
                <p className="text-gray-500 text-xs">Father's Name</p>
                <p className="font-medium">Mr. James Doe</p>
              </div>
            )}
            {t.showMotherName && (
              <div>
                <p className="text-gray-500 text-xs">Mother's Name</p>
                <p className="font-medium">Mrs. Jane Doe</p>
              </div>
            )}
          </div>
          <div className="text-right space-y-2">
            <div>
              <p className="text-gray-500 text-xs">Class</p>
              <p className="font-medium">Class 10-A</p>
            </div>
            {t.showRollNumber && (
              <div>
                <p className="text-gray-500 text-xs">Roll Number</p>
                <p className="font-medium">15</p>
              </div>
            )}
            {t.showPhone && (
              <div>
                <p className="text-gray-500 text-xs">Phone</p>
                <p className="font-medium">+91 98765 43210</p>
              </div>
            )}
          </div>
        </div>

        {/* Fee Table */}
        <div className="p-4">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: t.tableHeaderColor }}>
                <th className="text-left py-2 px-3 font-medium">Fee Type</th>
                {t.showPeriodColumn && <th className="text-center py-2 px-3 font-medium">Period</th>}
                {t.showCategoryColumn && <th className="text-center py-2 px-3 font-medium">Category</th>}
                <th className="text-right py-2 px-3 font-medium">Amount ({t.currencySymbol})</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-2 px-3">Tuition Fee</td>
                {t.showPeriodColumn && <td className="text-center py-2 px-3">April 2024</td>}
                {t.showCategoryColumn && <td className="text-center py-2 px-3">Monthly</td>}
                <td className="text-right py-2 px-3">{t.currencySymbol}5,000</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 px-3">Transport Fee</td>
                {t.showPeriodColumn && <td className="text-center py-2 px-3">April 2024</td>}
                {t.showCategoryColumn && <td className="text-center py-2 px-3">Monthly</td>}
                <td className="text-right py-2 px-3">{t.currencySymbol}1,500</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="font-bold" style={{ backgroundColor: `${t.primaryColor}10` }}>
                <td colSpan={t.showPeriodColumn && t.showCategoryColumn ? 3 : t.showPeriodColumn || t.showCategoryColumn ? 2 : 1} className="py-2 px-3 text-right">
                  Total:
                </td>
                <td className="py-2 px-3 text-right" style={{ color: t.primaryColor }}>
                  {t.currencySymbol}6,500
                </td>
              </tr>
            </tfoot>
          </table>
          
          {t.showAmountInWords && (
            <p className="text-sm text-gray-600 mt-3 italic">
              Amount in words: Six Thousand Five Hundred Rupees Only
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 text-center text-sm text-gray-500">
          {t.showDateTime && <p>Date: {new Date().toLocaleDateString('en-IN')} | Time: {new Date().toLocaleTimeString('en-IN')}</p>}
          {t.showCollectedBy && <p className="mt-1">Collected by: Admin</p>}
          {t.footerText && <p className="mt-2">{t.footerText}</p>}
          
          {t.showSignatureLine && (
            <div className="mt-6 pt-4">
              <div className="w-48 border-t border-gray-400 mx-auto"></div>
              <p className="text-gray-600 mt-1">{t.signatureLabel}</p>
            </div>
          )}
          
          {t.showTerms && t.termsText && (
            <div className="mt-4 p-3 bg-gray-50 rounded text-left text-xs">
              <p className="font-medium mb-1">Terms & Conditions:</p>
              <p className="text-gray-500">{t.termsText}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Settings className="w-8 h-8" />
              Fee Payment Settings
            </h1>
            <p className="text-white/80 mt-1">Configure how and when fees are collected</p>
          </div>
          {currentSession && (
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <p className="text-sm text-white/70">Session: <strong>{currentSession.name}</strong></p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* SCHOOL SETTINGS TAB */}
          {activeTab === 'school' && (
            <div className="space-y-8">
              {/* Payment Frequency */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Payment Frequency
                </h3>
                <p className="text-sm text-gray-500 mb-4">Choose how often students should pay fees</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {PAYMENT_FREQUENCIES.map(freq => (
                    <button
                      key={freq.value}
                      onClick={() => setSchoolSettings(prev => ({ ...prev, paymentFrequency: freq.value }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        schoolSettings.paymentFrequency === freq.value
                          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-2">{freq.icon}</div>
                      <h4 className="font-semibold text-gray-800">{freq.label}</h4>
                      <p className="text-sm text-gray-500 mt-1">{freq.desc}</p>
                      <p className="text-xs text-indigo-600 mt-2">{freq.periods} payment(s)/year</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date Settings */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    Due Date Settings
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fee Due Day of Month
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="28"
                        value={schoolSettings.dueDayOfMonth}
                        onChange={(e) => setSchoolSettings(prev => ({ ...prev, dueDayOfMonth: parseInt(e.target.value) || 10 }))}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grace Period (Days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={schoolSettings.gracePeriodDays}
                        onChange={(e) => setSchoolSettings(prev => ({ ...prev, gracePeriodDays: parseInt(e.target.value) || 0 }))}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Late Fee Settings */}
                <div className="bg-red-50 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      Late Fee
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={schoolSettings.lateFee?.enabled}
                        onChange={(e) => setSchoolSettings(prev => ({
                          ...prev,
                          lateFee: { ...prev.lateFee, enabled: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                  
                  {schoolSettings.lateFee?.enabled && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Late Fee Type</label>
                        <select
                          value={schoolSettings.lateFee?.type || 'fixed'}
                          onChange={(e) => setSchoolSettings(prev => ({
                            ...prev,
                            lateFee: { ...prev.lateFee, type: e.target.value }
                          }))}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
                        >
                          <option value="fixed">Fixed Amount (₹)</option>
                          <option value="percentage">Percentage (%)</option>
                          <option value="daily">Per Day (₹)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Amount {schoolSettings.lateFee?.type === 'percentage' ? '(%)' : '(₹)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={schoolSettings.lateFee?.amount || 0}
                          onChange={(e) => setSchoolSettings(prev => ({
                            ...prev,
                            lateFee: { ...prev.lateFee, amount: parseFloat(e.target.value) || 0 }
                          }))}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Maximum Late Fee (₹)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={schoolSettings.lateFee?.maxAmount || ''}
                          onChange={(e) => setSchoolSettings(prev => ({
                            ...prev,
                            lateFee: { ...prev.lateFee, maxAmount: e.target.value ? parseFloat(e.target.value) : null }
                          }))}
                          placeholder="No limit"
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Early Payment & Payment Rules */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Early Payment Discount */}
                <div className="bg-green-50 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <Gift className="w-5 h-5 text-green-600" />
                      Early Payment Discount
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={schoolSettings.earlyPaymentDiscount?.enabled}
                        onChange={(e) => setSchoolSettings(prev => ({
                          ...prev,
                          earlyPaymentDiscount: { ...prev.earlyPaymentDiscount, enabled: e.target.checked }
                        }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                  
                  {schoolSettings.earlyPaymentDiscount?.enabled && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Days Before Due Date
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={schoolSettings.earlyPaymentDiscount?.days || 5}
                          onChange={(e) => setSchoolSettings(prev => ({
                            ...prev,
                            earlyPaymentDiscount: { ...prev.earlyPaymentDiscount, days: parseInt(e.target.value) || 5 }
                          }))}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                          <select
                            value={schoolSettings.earlyPaymentDiscount?.type || 'percentage'}
                            onChange={(e) => setSchoolSettings(prev => ({
                              ...prev,
                              earlyPaymentDiscount: { ...prev.earlyPaymentDiscount, type: e.target.value }
                            }))}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                          >
                            <option value="percentage">Percentage</option>
                            <option value="fixed">Fixed</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={schoolSettings.earlyPaymentDiscount?.amount || 0}
                            onChange={(e) => setSchoolSettings(prev => ({
                              ...prev,
                              earlyPaymentDiscount: { ...prev.earlyPaymentDiscount, amount: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Rules */}
                <div className="bg-blue-50 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    Payment Rules
                  </h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <div>
                        <span className="font-medium text-gray-700">Allow Partial Payments</span>
                        <p className="text-xs text-gray-500 mt-0.5">Students can pay less than full amount</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={schoolSettings.paymentRules?.partialPaymentAllowed}
                        onChange={(e) => setSchoolSettings(prev => ({
                          ...prev,
                          paymentRules: { ...prev.paymentRules, partialPaymentAllowed: e.target.checked }
                        }))}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                    </label>
                    
                    <label className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                      <div>
                        <span className="font-medium text-gray-700">Carry Forward Dues</span>
                        <p className="text-xs text-gray-500 mt-0.5">Unpaid fees roll over to next period</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={schoolSettings.paymentRules?.carryForwardDues}
                        onChange={(e) => setSchoolSettings(prev => ({
                          ...prev,
                          paymentRules: { ...prev.paymentRules, carryForwardDues: e.target.checked }
                        }))}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={handleSaveSchoolSettings}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          )}

          {/* CLASS SETTINGS TAB */}
          {activeTab === 'class' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Class-Specific Settings</h3>
                  <p className="text-sm text-gray-500 mt-1">Override school defaults for specific classes</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700">
                  Classes without specific settings will use the school-wide defaults.
                </p>
              </div>

              <div className="space-y-3">
                {grades.map(grade => {
                  const classSetting = getClassSetting(grade.id);
                  const isExpanded = expandedClass === grade.id;
                  
                  return (
                    <div key={grade.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedClass(isExpanded ? null : grade.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            classSetting ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'
                          }`}>
                            <Users className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <h4 className="font-medium text-gray-800">{grade.displayName}</h4>
                            <p className="text-sm text-gray-500">
                              {classSetting ? (
                                <span className="text-indigo-600">Custom settings applied</span>
                              ) : (
                                'Using school defaults'
                              )}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>
                      
                      {isExpanded && (
                        <div className="p-4 bg-gray-50 border-t border-gray-200">
                          {classSetting ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white p-3 rounded-lg">
                                  <p className="text-xs text-gray-500">Payment Frequency</p>
                                  <p className="font-medium text-gray-800">
                                    {PAYMENT_FREQUENCIES.find(f => f.value === classSetting.paymentFrequency)?.label || 'School Default'}
                                  </p>
                                </div>
                                <div className="bg-white p-3 rounded-lg">
                                  <p className="text-xs text-gray-500">Due Day</p>
                                  <p className="font-medium text-gray-800">
                                    {classSetting.dueDayOfMonth || schoolSettings.dueDayOfMonth}
                                  </p>
                                </div>
                                <div className="bg-white p-3 rounded-lg">
                                  <p className="text-xs text-gray-500">Grace Period</p>
                                  <p className="font-medium text-gray-800">
                                    {classSetting.gracePeriodDays || schoolSettings.gracePeriodDays} days
                                  </p>
                                </div>
                                <div className="bg-white p-3 rounded-lg">
                                  <p className="text-xs text-gray-500">Late Fee</p>
                                  <p className="font-medium text-gray-800">
                                    {classSetting.lateFeeEnabled ? `₹${classSetting.lateFeeAmount}` : 'Disabled'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingClassSettings({ ...classSetting, classGradeId: grade.id, className: grade.displayName })}
                                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                  Edit Settings
                                </button>
                                <button
                                  onClick={() => handleDeleteClassSettings(classSetting.id)}
                                  className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-gray-500 mb-3">This class uses school-wide default settings</p>
                              <button
                                onClick={() => setEditingClassSettings({ classGradeId: grade.id, className: grade.displayName })}
                                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                              >
                                Add Custom Settings
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* FEE CALENDAR TAB */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Fee Calendar</h3>
                  <p className="text-sm text-gray-500 mt-1">View and manage fee due dates for the session</p>
                </div>
                <button
                  onClick={() => handleGenerateCalendar()}
                  disabled={generatingCalendar}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {generatingCalendar ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {generatingCalendar ? 'Generating...' : 'Generate Calendar'}
                </button>
              </div>

              {feeCalendar.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <CalendarDays className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No Fee Calendar</h3>
                  <p className="text-gray-500 mb-4">Generate a fee calendar based on your payment settings</p>
                  <button
                    onClick={() => handleGenerateCalendar()}
                    disabled={generatingCalendar}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg"
                  >
                    Generate Now
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Period</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Class</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Due Date</th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feeCalendar.map(cal => (
                        <tr key={cal.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium text-gray-800">{cal.periodName}</td>
                          <td className="py-3 px-4 text-gray-600">{cal.className}</td>
                          <td className="py-3 px-4 text-gray-600">
                            {new Date(cal.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {cal.isActive ? (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">Active</span>
                            ) : (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded-full">Inactive</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* RECEIPT TEMPLATES TAB */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Receipt Templates</h3>
                  <p className="text-sm text-gray-500 mt-1">Create and customize fee receipt designs</p>
                </div>
                <button
                  onClick={() => openTemplateEditor()}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                  New Template
                </button>
              </div>

              {templates.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No Templates Yet</h3>
                  <p className="text-gray-500 mb-4">Create your first receipt template</p>
                  <button
                    onClick={() => openTemplateEditor()}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg"
                  >
                    Create Template
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map(template => (
                    <div 
                      key={template.id} 
                      className={`bg-white border-2 rounded-xl p-4 transition-all ${
                        template.isDefault ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                            {template.name}
                            {template.isDefault && (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            )}
                          </h4>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {PAPER_SIZES.find(p => p.value === template.paperSize)?.label} • {template.fontFamily}
                          </p>
                        </div>
                        <div 
                          className="w-6 h-6 rounded-full border-2 border-white shadow"
                          style={{ backgroundColor: template.primaryColor }}
                        />
                      </div>
                      
                      {/* Mini Preview */}
                      <div 
                        className="h-32 bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden"
                        style={{ border: `1px solid ${template.primaryColor}20` }}
                      >
                        <div className="w-full h-full p-2 bg-white transform scale-50 origin-center">
                          <div className="text-center mb-1 border-b pb-1" style={{ borderColor: template.primaryColor }}>
                            <p className="text-xs font-bold" style={{ color: template.headerColor }}>School Name</p>
                          </div>
                          <p className="text-center text-xs font-medium" style={{ color: template.primaryColor }}>{template.receiptTitle}</p>
                          <div className="mt-1 space-y-0.5">
                            <div className="h-1.5 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-1.5 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          <button
                            onClick={() => openTemplateEditor(template)}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            title="Edit"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditingTemplate(template); setShowPreview(true); }}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicateTemplate(template.id)}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                            title="Duplicate"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {!template.isDefault && (
                          <button
                            onClick={() => handleSetDefault(template.id)}
                            className="text-xs text-indigo-600 hover:underline"
                          >
                            Set as Default
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Class Settings Modal */}
      {editingClassSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  Settings for {editingClassSettings.className}
                </h3>
                <button onClick={() => setEditingClassSettings(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Frequency</label>
                <select
                  value={editingClassSettings.paymentFrequency || ''}
                  onChange={(e) => setEditingClassSettings(prev => ({ ...prev, paymentFrequency: e.target.value || null }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="">Use School Default</option>
                  {PAYMENT_FREQUENCIES.map(freq => (
                    <option key={freq.value} value={freq.value}>{freq.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Day of Month</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    value={editingClassSettings.dueDayOfMonth || ''}
                    onChange={(e) => setEditingClassSettings(prev => ({ ...prev, dueDayOfMonth: e.target.value ? parseInt(e.target.value) : null }))}
                    placeholder={`Default: ${schoolSettings.dueDayOfMonth}`}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grace Period (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingClassSettings.gracePeriodDays || ''}
                    onChange={(e) => setEditingClassSettings(prev => ({ ...prev, gracePeriodDays: e.target.value ? parseInt(e.target.value) : null }))}
                    placeholder={`Default: ${schoolSettings.gracePeriodDays}`}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => setEditingClassSettings(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveClassSettings(editingClassSettings.classGradeId, editingClassSettings)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template Editor Modal */}
      {showTemplateEditor && editingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-4">
                <FileText className="w-6 h-6 text-indigo-600" />
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate(prev => ({ ...prev, name: e.target.value }))}
                  className="text-xl font-semibold bg-transparent border-none focus:ring-0 focus:outline-none"
                  placeholder="Template Name"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 px-3 py-1.5 bg-yellow-100 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingTemplate.isDefault}
                    onChange={(e) => setEditingTemplate(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="w-4 h-4 text-yellow-600 rounded"
                  />
                  <Star className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-700">Default</span>
                </label>
                <button onClick={() => setShowTemplateEditor(false)} className="p-2 hover:bg-gray-200 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Left: Settings */}
              <div className="w-1/2 border-r border-gray-200 flex flex-col">
                {/* Sub Tabs */}
                <div className="flex border-b border-gray-200 bg-gray-50 px-4">
                  {[
                    { id: 'header', label: 'Header', icon: Layout },
                    { id: 'student', label: 'Student Info', icon: User },
                    { id: 'table', label: 'Fee Table', icon: AlignLeft },
                    { id: 'footer', label: 'Footer', icon: FileText },
                    { id: 'style', label: 'Style', icon: Palette },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setTemplateEditorTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
                        templateEditorTab === tab.id
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Header Settings */}
                  {templateEditorTab === 'header' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Paper Size</label>
                          <select
                            value={editingTemplate.paperSize}
                            onChange={(e) => setEditingTemplate(prev => ({ ...prev, paperSize: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                          >
                            {PAPER_SIZES.map(size => (
                              <option key={size.value} value={size.value}>{size.label} - {size.desc}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Orientation</label>
                          <select
                            value={editingTemplate.orientation}
                            onChange={(e) => setEditingTemplate(prev => ({ ...prev, orientation: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                          >
                            <option value="portrait">Portrait</option>
                            <option value="landscape">Landscape</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Title</label>
                        <input
                          type="text"
                          value={editingTemplate.receiptTitle}
                          onChange={(e) => setEditingTemplate(prev => ({ ...prev, receiptTitle: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Prefix</label>
                          <input
                            type="text"
                            value={editingTemplate.receiptPrefix}
                            onChange={(e) => setEditingTemplate(prev => ({ ...prev, receiptPrefix: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">School Name Size</label>
                          <select
                            value={editingTemplate.schoolNameSize}
                            onChange={(e) => setEditingTemplate(prev => ({ ...prev, schoolNameSize: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                          >
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Logo Position</label>
                        <div className="flex gap-2">
                          {['left', 'center', 'right'].map(pos => (
                            <button
                              key={pos}
                              onClick={() => setEditingTemplate(prev => ({ ...prev, logoPosition: pos }))}
                              className={`flex-1 py-2 rounded-lg capitalize ${
                                editingTemplate.logoPosition === pos
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {pos}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {[
                          { key: 'showLogo', label: 'Show School Logo' },
                          { key: 'showAddress', label: 'Show School Address' },
                          { key: 'showContact', label: 'Show Contact Info' },
                          { key: 'showReceiptNumber', label: 'Show Receipt Number' },
                        ].map(item => (
                          <label key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700">{item.label}</span>
                            <input
                              type="checkbox"
                              checked={editingTemplate[item.key]}
                              onChange={(e) => setEditingTemplate(prev => ({ ...prev, [item.key]: e.target.checked }))}
                              className="w-5 h-5 text-indigo-600 rounded"
                            />
                          </label>
                        ))}
                      </div>
                    </>
                  )}

                  {/* Student Info Settings */}
                  {templateEditorTab === 'student' && (
                    <div className="space-y-2">
                      {[
                        { key: 'showStudentPhoto', label: 'Show Student Photo' },
                        { key: 'showFatherName', label: "Show Father's Name" },
                        { key: 'showMotherName', label: "Show Mother's Name" },
                        { key: 'showPhone', label: 'Show Phone Number' },
                        { key: 'showAddressStudent', label: 'Show Student Address' },
                        { key: 'showRollNumber', label: 'Show Roll Number' },
                      ].map(item => (
                        <label key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">{item.label}</span>
                          <input
                            type="checkbox"
                            checked={editingTemplate[item.key]}
                            onChange={(e) => setEditingTemplate(prev => ({ ...prev, [item.key]: e.target.checked }))}
                            className="w-5 h-5 text-indigo-600 rounded"
                          />
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Table Settings */}
                  {templateEditorTab === 'table' && (
                    <>
                      <div className="space-y-2">
                        {[
                          { key: 'showPeriodColumn', label: 'Show Period Column' },
                          { key: 'showCategoryColumn', label: 'Show Category Column' },
                          { key: 'showAmountInWords', label: 'Show Amount in Words' },
                        ].map(item => (
                          <label key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700">{item.label}</span>
                            <input
                              type="checkbox"
                              checked={editingTemplate[item.key]}
                              onChange={(e) => setEditingTemplate(prev => ({ ...prev, [item.key]: e.target.checked }))}
                              className="w-5 h-5 text-indigo-600 rounded"
                            />
                          </label>
                        ))}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label>
                        <input
                          type="text"
                          value={editingTemplate.currencySymbol}
                          onChange={(e) => setEditingTemplate(prev => ({ ...prev, currencySymbol: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                          maxLength={3}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Table Header Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={editingTemplate.tableHeaderColor}
                            onChange={(e) => setEditingTemplate(prev => ({ ...prev, tableHeaderColor: e.target.value }))}
                            className="w-12 h-10 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={editingTemplate.tableHeaderColor}
                            onChange={(e) => setEditingTemplate(prev => ({ ...prev, tableHeaderColor: e.target.value }))}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Footer Settings */}
                  {templateEditorTab === 'footer' && (
                    <>
                      <div className="space-y-2">
                        {[
                          { key: 'showDateTime', label: 'Show Date & Time' },
                          { key: 'showCollectedBy', label: 'Show Collected By' },
                          { key: 'showSignatureLine', label: 'Show Signature Line' },
                          { key: 'showTerms', label: 'Show Terms & Conditions' },
                        ].map(item => (
                          <label key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700">{item.label}</span>
                            <input
                              type="checkbox"
                              checked={editingTemplate[item.key]}
                              onChange={(e) => setEditingTemplate(prev => ({ ...prev, [item.key]: e.target.checked }))}
                              className="w-5 h-5 text-indigo-600 rounded"
                            />
                          </label>
                        ))}
                      </div>

                      {editingTemplate.showSignatureLine && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Signature Label</label>
                          <input
                            type="text"
                            value={editingTemplate.signatureLabel}
                            onChange={(e) => setEditingTemplate(prev => ({ ...prev, signatureLabel: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
                        <textarea
                          value={editingTemplate.footerText}
                          onChange={(e) => setEditingTemplate(prev => ({ ...prev, footerText: e.target.value }))}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                          placeholder="Thank you message..."
                        />
                      </div>

                      {editingTemplate.showTerms && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                          <textarea
                            value={editingTemplate.termsText}
                            onChange={(e) => setEditingTemplate(prev => ({ ...prev, termsText: e.target.value }))}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                            placeholder="Enter terms..."
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Style Settings */}
                  {templateEditorTab === 'style' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {COLOR_PRESETS.map(color => (
                            <button
                              key={color}
                              onClick={() => setEditingTemplate(prev => ({ ...prev, primaryColor: color }))}
                              className={`w-8 h-8 rounded-lg border-2 ${
                                editingTemplate.primaryColor === color ? 'border-gray-800' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={editingTemplate.primaryColor}
                            onChange={(e) => setEditingTemplate(prev => ({ ...prev, primaryColor: e.target.value }))}
                            className="w-12 h-10 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={editingTemplate.primaryColor}
                            onChange={(e) => setEditingTemplate(prev => ({ ...prev, primaryColor: e.target.value }))}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Header Color</label>
                        <div className="flex gap-2">
                          <input
                            type="color"
                            value={editingTemplate.headerColor}
                            onChange={(e) => setEditingTemplate(prev => ({ ...prev, headerColor: e.target.value }))}
                            className="w-12 h-10 rounded cursor-pointer"
                          />
                          <input
                            type="text"
                            value={editingTemplate.headerColor}
                            onChange={(e) => setEditingTemplate(prev => ({ ...prev, headerColor: e.target.value }))}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                        <select
                          value={editingTemplate.fontFamily}
                          onChange={(e) => setEditingTemplate(prev => ({ ...prev, fontFamily: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                        >
                          {FONT_FAMILIES.map(font => (
                            <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Border Style</label>
                        <div className="flex gap-2">
                          {['solid', 'dashed', 'none'].map(style => (
                            <button
                              key={style}
                              onClick={() => setEditingTemplate(prev => ({ ...prev, borderStyle: style }))}
                              className={`flex-1 py-2 rounded-lg capitalize ${
                                editingTemplate.borderStyle === style
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {style}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Right: Live Preview */}
              <div className="w-1/2 bg-gray-100 p-4 overflow-y-auto">
                <div className="sticky top-0 bg-gray-100 pb-2 mb-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-700 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Live Preview
                    </h4>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1 px-3 py-1 text-sm bg-white rounded-lg shadow hover:bg-gray-50"
                    >
                      <Printer className="w-4 h-4" />
                      Test Print
                    </button>
                  </div>
                </div>
                <ReceiptPreview template={editingTemplate} />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowTemplateEditor(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && editingTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-800">Preview: {editingTemplate.name}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </button>
                <button onClick={() => { setShowPreview(false); setEditingTemplate(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6 bg-gray-100">
              <ReceiptPreview template={editingTemplate} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeePaymentSettings;
