import { useState, useEffect } from 'react';
import {
  Clock, Calendar, Plus, X, Edit2, Trash2, Save, Play, Coffee, Sun,
  Moon, Sunrise, ChevronRight, ChevronLeft, AlertCircle, CheckCircle, XCircle,
  Settings, Zap, Copy, Eye, Bell, Building, RefreshCw, Info, Check,
  CalendarDays, Timer, Users, BookOpen, Grid3X3
} from 'lucide-react';
import { classTimings } from '../services/api';
import { toast } from '../utils/toast';

const DAYS = [
  { id: 0, name: 'Sunday', short: 'Sun' },
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' }
];

const PERIOD_TYPES = [
  { value: 'regular', label: 'Regular Class', color: 'bg-blue-500' },
  { value: 'lab', label: 'Lab/Practical', color: 'bg-purple-500' },
  { value: 'activity', label: 'Activity', color: 'bg-green-500' },
  { value: 'assembly', label: 'Assembly', color: 'bg-amber-500' },
  { value: 'sports', label: 'Sports/PT', color: 'bg-orange-500' }
];

const BREAK_TYPES = [
  { value: 'short_break', label: 'Short Break', icon: Coffee, color: 'bg-amber-400' },
  { value: 'lunch', label: 'Lunch Break', icon: Coffee, color: 'bg-orange-500' },
  { value: 'assembly', label: 'Assembly', icon: Users, color: 'bg-indigo-500' },
  { value: 'prayer', label: 'Prayer', icon: Sun, color: 'bg-purple-500' }
];

const EXCEPTION_TYPES = [
  { value: 'holiday', label: 'Holiday', color: 'bg-red-500' },
  { value: 'half_day', label: 'Half Day', color: 'bg-amber-500' },
  { value: 'exam', label: 'Exam Day', color: 'bg-blue-500' },
  { value: 'event', label: 'School Event', color: 'bg-green-500' },
  { value: 'custom', label: 'Custom Timing', color: 'bg-purple-500' }
];

const ClassTimingConfiguration = () => {
  // Data
  const [settings, setSettings] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [exceptions, setExceptions] = useState([]);
  const [dayWiseTimings, setDayWiseTimings] = useState([]);
  
  // UI
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('setup'); // setup, templates, exceptions
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPeriodModal, setShowPeriodModal] = useState(null);
  const [showBreakModal, setShowBreakModal] = useState(null);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [showQuickSetup, setShowQuickSetup] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Forms
  const [settingsForm, setSettingsForm] = useState({
    schoolStartTime: '08:00',
    schoolEndTime: '15:00',
    gateOpenTime: '07:30',
    gateCloseTime: '09:00',
    defaultPeriodDuration: 45,
    defaultBreakDuration: 15,
    defaultLunchDuration: 45,
    bellBeforePeriod: 5,
    workingDays: [1, 2, 3, 4, 5, 6],
    timezone: 'Asia/Kolkata'
  });

  const [templateForm, setTemplateForm] = useState({
    name: '',
    code: '',
    description: '',
    isDefault: false,
    applicableDays: [1, 2, 3, 4, 5, 6]
  });

  const [periodForm, setPeriodForm] = useState({
    periodNumber: 1,
    name: '',
    shortName: '',
    startTime: '',
    endTime: '',
    periodType: 'regular'
  });

  const [breakForm, setBreakForm] = useState({
    name: '',
    shortName: '',
    startTime: '',
    endTime: '',
    breakType: 'short_break',
    afterPeriod: 1
  });

  const [quickSetupForm, setQuickSetupForm] = useState({
    schoolStartTime: '08:00',
    periodsCount: 8,
    periodDuration: 45,
    breakAfterPeriods: [3],
    breakDuration: 15,
    lunchAfterPeriod: 5,
    lunchDuration: 45
  });

  const [exceptionForm, setExceptionForm] = useState({
    exceptionDate: '',
    exceptionType: 'holiday',
    templateId: '',
    reason: '',
    isNoSchool: false
  });

  const [showAutoGenerate, setShowAutoGenerate] = useState(false);
  const [autoGenForm, setAutoGenForm] = useState({
    startTime: '08:00',
    periodsCount: 8,
    periodDuration: 45,
    shortBreakDuration: 15,
    shortBreakAfter: [3], // After which periods
    lunchDuration: 45,
    lunchAfterPeriod: 5
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, templatesRes, exceptionsRes, dayWiseRes] = await Promise.all([
        classTimings.getSettings(),
        classTimings.getTemplates(),
        classTimings.getExceptions(),
        classTimings.getDayWise()
      ]);

      if (settingsRes?.success && settingsRes.data) {
        setSettings(settingsRes.data);
        setSettingsForm({
          schoolStartTime: settingsRes.data.schoolStartTime || '08:00',
          schoolEndTime: settingsRes.data.schoolEndTime || '15:00',
          gateOpenTime: settingsRes.data.gateOpenTime || '07:30',
          gateCloseTime: settingsRes.data.gateCloseTime || '09:00',
          defaultPeriodDuration: settingsRes.data.defaultPeriodDuration || 45,
          defaultBreakDuration: settingsRes.data.defaultBreakDuration || 15,
          defaultLunchDuration: settingsRes.data.defaultLunchDuration || 45,
          bellBeforePeriod: settingsRes.data.bellBeforePeriod || 5,
          workingDays: settingsRes.data.workingDays || [1, 2, 3, 4, 5, 6],
          timezone: settingsRes.data.timezone || 'Asia/Kolkata'
        });

        // Show quick setup if not configured
        if (!settingsRes.data.isConfigured) {
          setShowQuickSetup(true);
        }
      }

      if (templatesRes?.success) {
        setTemplates(templatesRes.data || []);
        const defaultTemplate = templatesRes.data?.find(t => t.isDefault);
        if (defaultTemplate) {
          loadTemplateDetails(defaultTemplate.id);
        }
      }

      if (exceptionsRes?.success) {
        setExceptions(exceptionsRes.data || []);
      }

      if (dayWiseRes?.success) {
        setDayWiseTimings(dayWiseRes.data || []);
      }
    } catch (e) {
      console.error('Error:', e);
      toast.error('Failed to load timing data');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplateDetails = async (templateId) => {
    try {
      const res = await classTimings.getTemplateById(templateId);
      if (res?.success) {
        setActiveTemplate(res.data);
      }
    } catch (e) {
      console.error('Error loading template:', e);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await classTimings.saveSettings(settingsForm);
      if (res?.success) {
        toast.success('Settings saved successfully!');
        setSettings({ ...settings, ...settingsForm, isConfigured: true });
      } else {
        toast.error(res?.message || 'Failed to save settings');
      }
    } catch (e) {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleQuickSetup = async () => {
    setSaving(true);
    try {
      const res = await classTimings.generateDefault(quickSetupForm);
      if (res?.success) {
        toast.success('Timing configuration generated successfully!');
        setShowQuickSetup(false);
        fetchData();
      } else {
        toast.error(res?.message || 'Failed to generate configuration');
      }
    } catch (e) {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name || !templateForm.code) {
      toast.error('Name and code are required');
      return;
    }

    setSaving(true);
    try {
      let res;
      if (editingTemplate) {
        res = await classTimings.updateTemplate(editingTemplate.id, templateForm);
      } else {
        res = await classTimings.createTemplate(templateForm);
      }

      if (res?.success) {
        toast.success(editingTemplate ? 'Template updated!' : 'Template created!');
        setShowTemplateModal(false);
        setEditingTemplate(null);
        setTemplateForm({ name: '', code: '', description: '', isDefault: false, applicableDays: [1, 2, 3, 4, 5, 6] });
        fetchData();
      } else {
        toast.error(res?.message || 'Failed to save template');
      }
    } catch (e) {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      const res = await classTimings.deleteTemplate(id);
      if (res?.success) {
        toast.success('Template deleted');
        fetchData();
      } else {
        toast.error(res?.message || 'Cannot delete default template');
      }
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const handleSavePeriods = async () => {
    if (!activeTemplate) return;
    
    if (!activeTemplate.periods || activeTemplate.periods.length === 0) {
      toast.error('Add at least one period before saving');
      return;
    }

    setSaving(true);
    try {
      const res = await classTimings.savePeriods(activeTemplate.id, activeTemplate.periods);
      if (res?.success) {
        toast.success(res.message || 'Periods saved!');
        // Refresh template to get updated data
        loadTemplateDetails(activeTemplate.id);
      } else {
        toast.error(res?.message || 'Failed to save periods');
      }
    } catch (e) {
      toast.error('Failed to save periods');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBreaks = async () => {
    if (!activeTemplate) return;
    
    setSaving(true);
    try {
      const res = await classTimings.saveBreaks(activeTemplate.id, activeTemplate.breaks || []);
      if (res?.success) {
        toast.success(res.message || 'Breaks saved!');
        // Refresh template to get updated data
        loadTemplateDetails(activeTemplate.id);
      } else {
        toast.error(res?.message || 'Failed to save breaks');
      }
    } catch (e) {
      toast.error('Failed to save breaks');
    } finally {
      setSaving(false);
    }
  };

  // Auto-generate periods and breaks for active template
  const handleAutoGenerate = () => {
    if (!activeTemplate) return;

    const formatTime = (mins) => {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const [startHour, startMin] = autoGenForm.startTime.split(':').map(Number);
    let currentTime = startHour * 60 + startMin;

    const newPeriods = [];
    const newBreaks = [];

    for (let i = 1; i <= autoGenForm.periodsCount; i++) {
      const periodStart = formatTime(currentTime);
      currentTime += autoGenForm.periodDuration;
      const periodEnd = formatTime(currentTime);

      newPeriods.push({
        id: `gen-period-${i}`,
        periodNumber: i,
        name: `Period ${i}`,
        shortName: `P${i}`,
        startTime: periodStart,
        endTime: periodEnd,
        periodType: 'regular',
        orderIndex: newPeriods.length
      });

      // Add lunch after specific period
      if (i === autoGenForm.lunchAfterPeriod && i < autoGenForm.periodsCount) {
        const lunchStart = formatTime(currentTime);
        currentTime += autoGenForm.lunchDuration;
        const lunchEnd = formatTime(currentTime);

        newBreaks.push({
          id: `gen-lunch-${i}`,
          name: 'Lunch Break',
          shortName: 'Lunch',
          startTime: lunchStart,
          endTime: lunchEnd,
          breakType: 'lunch',
          afterPeriod: i,
          orderIndex: newBreaks.length
        });
      }
      // Add short break after specific periods
      else if (autoGenForm.shortBreakAfter.includes(i) && i < autoGenForm.periodsCount && i !== autoGenForm.lunchAfterPeriod) {
        const breakStart = formatTime(currentTime);
        currentTime += autoGenForm.shortBreakDuration;
        const breakEnd = formatTime(currentTime);

        newBreaks.push({
          id: `gen-break-${i}`,
          name: 'Short Break',
          shortName: 'Break',
          startTime: breakStart,
          endTime: breakEnd,
          breakType: 'short_break',
          afterPeriod: i,
          orderIndex: newBreaks.length
        });
      }
    }

    setActiveTemplate(prev => ({
      ...prev,
      periods: newPeriods,
      breaks: newBreaks
    }));

    setShowAutoGenerate(false);
    toast.success(`Generated ${newPeriods.length} periods and ${newBreaks.length} breaks! Click "Save All" to persist.`);
  };

  // Toggle short break after period
  const toggleShortBreakAfter = (periodNum) => {
    setAutoGenForm(prev => ({
      ...prev,
      shortBreakAfter: prev.shortBreakAfter.includes(periodNum)
        ? prev.shortBreakAfter.filter(p => p !== periodNum)
        : [...prev.shortBreakAfter, periodNum].sort((a, b) => a - b)
    }));
  };

  // Save both periods and breaks in one click
  const handleSaveAll = async () => {
    if (!activeTemplate) return;
    
    setSaving(true);
    try {
      const [periodsRes, breaksRes] = await Promise.all([
        classTimings.savePeriods(activeTemplate.id, activeTemplate.periods || []),
        classTimings.saveBreaks(activeTemplate.id, activeTemplate.breaks || [])
      ]);

      if (periodsRes?.success && breaksRes?.success) {
        toast.success('Template saved successfully!');
        loadTemplateDetails(activeTemplate.id);
        fetchData();
      } else {
        toast.error(periodsRes?.message || breaksRes?.message || 'Failed to save');
      }
    } catch (e) {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  // Validate time - check if end is after start
  const validateTimeOrder = (startTime, endTime) => {
    if (!startTime || !endTime) return true;
    return startTime < endTime;
  };

  // Check for time overlap between two time ranges
  const hasTimeOverlap = (start1, end1, start2, end2) => {
    return start1 < end2 && end1 > start2;
  };

  // Check if new period overlaps with existing periods/breaks
  const checkPeriodOverlap = (startTime, endTime, excludeIndex = -1) => {
    if (!activeTemplate) return null;

    // Check against existing periods
    for (let i = 0; i < activeTemplate.periods.length; i++) {
      if (i === excludeIndex) continue;
      const p = activeTemplate.periods[i];
      if (hasTimeOverlap(startTime, endTime, p.startTime, p.endTime)) {
        return `Overlaps with ${p.name} (${p.startTime} - ${p.endTime})`;
      }
    }

    // Check against existing breaks
    for (const b of activeTemplate.breaks || []) {
      if (hasTimeOverlap(startTime, endTime, b.startTime, b.endTime)) {
        return `Overlaps with ${b.name} (${b.startTime} - ${b.endTime})`;
      }
    }

    return null;
  };

  const addPeriod = () => {
    if (!periodForm.name || !periodForm.startTime || !periodForm.endTime) {
      toast.error('Fill all required fields');
      return;
    }

    // Validate time order
    if (!validateTimeOrder(periodForm.startTime, periodForm.endTime)) {
      toast.error('End time must be after start time');
      return;
    }

    // Check for overlaps
    const overlap = checkPeriodOverlap(periodForm.startTime, periodForm.endTime);
    if (overlap) {
      toast.error(`Time conflict: ${overlap}`);
      return;
    }

    const newPeriod = {
      ...periodForm,
      id: `temp-${Date.now()}`,
      orderIndex: activeTemplate.periods.length
    };

    setActiveTemplate(prev => ({
      ...prev,
      periods: [...prev.periods, newPeriod].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    }));

    setPeriodForm({ periodNumber: activeTemplate.periods.length + 2, name: '', shortName: '', startTime: '', endTime: '', periodType: 'regular' });
    setShowPeriodModal(null);
    toast.success('Period added! Click "Save" to persist changes.');
  };

  const removePeriod = (index) => {
    setActiveTemplate(prev => ({
      ...prev,
      periods: prev.periods.filter((_, i) => i !== index)
    }));
  };

  // Check if new break overlaps with existing periods/breaks
  const checkBreakOverlap = (startTime, endTime, excludeIndex = -1) => {
    if (!activeTemplate) return null;

    // Check against existing periods
    for (const p of activeTemplate.periods || []) {
      if (hasTimeOverlap(startTime, endTime, p.startTime, p.endTime)) {
        return `Overlaps with ${p.name} (${p.startTime} - ${p.endTime})`;
      }
    }

    // Check against existing breaks
    for (let i = 0; i < (activeTemplate.breaks || []).length; i++) {
      if (i === excludeIndex) continue;
      const b = activeTemplate.breaks[i];
      if (hasTimeOverlap(startTime, endTime, b.startTime, b.endTime)) {
        return `Overlaps with ${b.name} (${b.startTime} - ${b.endTime})`;
      }
    }

    return null;
  };

  const addBreak = () => {
    if (!breakForm.name || !breakForm.startTime || !breakForm.endTime) {
      toast.error('Fill all required fields');
      return;
    }

    // Validate time order
    if (!validateTimeOrder(breakForm.startTime, breakForm.endTime)) {
      toast.error('End time must be after start time');
      return;
    }

    // Check for overlaps
    const overlap = checkBreakOverlap(breakForm.startTime, breakForm.endTime);
    if (overlap) {
      toast.error(`Time conflict: ${overlap}`);
      return;
    }

    const newBreak = {
      ...breakForm,
      id: `temp-${Date.now()}`,
      orderIndex: activeTemplate.breaks.length
    };

    setActiveTemplate(prev => ({
      ...prev,
      breaks: [...prev.breaks, newBreak].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''))
    }));

    setBreakForm({ name: '', shortName: '', startTime: '', endTime: '', breakType: 'short_break', afterPeriod: 1 });
    setShowBreakModal(null);
    toast.success('Break added! Click "Save" to persist changes.');
  };

  const removeBreak = (index) => {
    setActiveTemplate(prev => ({
      ...prev,
      breaks: prev.breaks.filter((_, i) => i !== index)
    }));
  };

  const handleSaveException = async () => {
    if (!exceptionForm.exceptionDate || !exceptionForm.exceptionType) {
      toast.error('Date and type are required');
      return;
    }

    setSaving(true);
    try {
      const res = await classTimings.createException(exceptionForm);
      if (res?.success) {
        toast.success('Exception saved!');
        setShowExceptionModal(false);
        setExceptionForm({ exceptionDate: '', exceptionType: 'holiday', templateId: '', reason: '', isNoSchool: false });
        fetchData();
      }
    } catch (e) {
      toast.error('Failed to save exception');
    } finally {
      setSaving(false);
    }
  };

  const toggleWorkingDay = (dayId) => {
    setSettingsForm(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(dayId)
        ? prev.workingDays.filter(d => d !== dayId)
        : [...prev.workingDays, dayId].sort()
    }));
  };

  const formatTime = (time) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  // Create timeline for visual preview
  const getTimeline = () => {
    if (!activeTemplate) return [];
    
    const items = [];
    
    activeTemplate.periods?.forEach(p => {
      items.push({ ...p, type: 'period' });
    });
    
    activeTemplate.breaks?.forEach(b => {
      items.push({ ...b, type: 'break' });
    });
    
    return items.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading timing configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Clock className="w-8 h-8" />
              Class Timing Configuration
            </h1>
            <p className="text-white/80 mt-1">Configure school hours, periods, breaks and schedules</p>
          </div>
          <div className="flex items-center gap-3">
            {!settings?.isConfigured && (
              <button onClick={() => setShowQuickSetup(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
                <Zap className="w-5 h-5" /> Quick Setup
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-3xl font-bold">{templates.length}</p>
            <p className="text-white/70 text-sm">Templates</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-3xl font-bold">{activeTemplate?.periods?.length || 0}</p>
            <p className="text-white/70 text-sm">Periods</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-3xl font-bold">{settingsForm.workingDays.length}</p>
            <p className="text-white/70 text-sm">Working Days</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-3xl font-bold">{exceptions.length}</p>
            <p className="text-white/70 text-sm">Exceptions</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl w-fit overflow-x-auto">
        {[
          { id: 'setup', label: 'Default Hours', icon: Settings },
          { id: 'daywise', label: 'Day-wise Hours', icon: Calendar },
          { id: 'templates', label: 'Schedule Templates', icon: Grid3X3 },
          { id: 'exceptions', label: 'Holidays & Exceptions', icon: CalendarDays }
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-white text-indigo-600 shadow-md' 
                : 'text-gray-600 hover:text-gray-800'
            }`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: School Timings */}
      {activeTab === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Settings */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500" />
              School Hours
            </h3>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">School Start Time</label>
                  <input type="time" value={settingsForm.schoolStartTime}
                    onChange={(e) => setSettingsForm({ ...settingsForm, schoolStartTime: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">School End Time</label>
                  <input type="time" value={settingsForm.schoolEndTime}
                    onChange={(e) => setSettingsForm({ ...settingsForm, schoolEndTime: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-medium" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gate Opens</label>
                  <input type="time" value={settingsForm.gateOpenTime}
                    onChange={(e) => setSettingsForm({ ...settingsForm, gateOpenTime: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gate Closes</label>
                  <input type="time" value={settingsForm.gateCloseTime}
                    onChange={(e) => setSettingsForm({ ...settingsForm, gateCloseTime: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Working Days</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <button key={day.id} onClick={() => toggleWorkingDay(day.id)}
                      className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                        settingsForm.workingDays.includes(day.id)
                          ? 'bg-indigo-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {day.short}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Default Durations */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <Timer className="w-5 h-5 text-blue-500" />
              Default Durations
            </h3>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Period Duration (minutes)</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="30" max="60" value={settingsForm.defaultPeriodDuration}
                    onChange={(e) => setSettingsForm({ ...settingsForm, defaultPeriodDuration: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                  <span className="w-16 text-center font-bold text-2xl text-indigo-600">{settingsForm.defaultPeriodDuration}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Short Break Duration (minutes)</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="5" max="30" value={settingsForm.defaultBreakDuration}
                    onChange={(e) => setSettingsForm({ ...settingsForm, defaultBreakDuration: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                  <span className="w-16 text-center font-bold text-2xl text-amber-600">{settingsForm.defaultBreakDuration}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lunch Duration (minutes)</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="30" max="60" value={settingsForm.defaultLunchDuration}
                    onChange={(e) => setSettingsForm({ ...settingsForm, defaultLunchDuration: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500" />
                  <span className="w-16 text-center font-bold text-2xl text-orange-600">{settingsForm.defaultLunchDuration}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bell Before Period (minutes)</label>
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-gray-400" />
                  <input type="number" min="0" max="15" value={settingsForm.bellBeforePeriod}
                    onChange={(e) => setSettingsForm({ ...settingsForm, bellBeforePeriod: parseInt(e.target.value) })}
                    className="w-20 px-3 py-2 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center font-bold" />
                  <span className="text-gray-500">minutes before each period</span>
                </div>
              </div>
            </div>

            <button onClick={handleSaveSettings} disabled={saving}
              className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
              {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Settings
            </button>
          </div>
        </div>
      )}

      {/* Tab: Day-wise Hours */}
      {activeTab === 'daywise' && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                Day-wise School Hours
              </h3>
              <p className="text-sm text-gray-500 mt-1">Configure different hours for each day of the week</p>
            </div>
            <button
              onClick={async () => {
                setSaving(true);
                try {
                  const res = await classTimings.saveDayWise(dayWiseTimings);
                  if (res?.success) {
                    toast.success('Day-wise timings saved!');
                  } else {
                    toast.error(res?.message || 'Failed to save');
                  }
                } catch (e) {
                  toast.error('Something went wrong');
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save All
            </button>
          </div>

          <div className="space-y-3">
            {dayWiseTimings.map((day, idx) => (
              <div
                key={day.id}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  day.isWorkingDay
                    ? 'bg-white border-gray-200 hover:border-indigo-300'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                {/* Day Name */}
                <div className="w-28">
                  <p className={`font-semibold ${day.isWorkingDay ? 'text-gray-800' : 'text-gray-400'}`}>
                    {day.name}
                  </p>
                  <p className="text-xs text-gray-400">{day.short}</p>
                </div>

                {/* Working Day Toggle */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={day.isWorkingDay}
                    onChange={(e) => {
                      const updated = [...dayWiseTimings];
                      updated[idx] = { ...updated[idx], isWorkingDay: e.target.checked };
                      setDayWiseTimings(updated);
                    }}
                    className="w-5 h-5 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-gray-600">Working</span>
                </label>

                {day.isWorkingDay && (
                  <>
                    {/* Start Time */}
                    <div className="flex items-center gap-2">
                      <Sunrise className="w-4 h-4 text-amber-500" />
                      <input
                        type="time"
                        value={day.schoolStartTime || '08:00'}
                        onChange={(e) => {
                          const updated = [...dayWiseTimings];
                          updated[idx] = { ...updated[idx], schoolStartTime: e.target.value };
                          setDayWiseTimings(updated);
                        }}
                        className="px-3 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                    </div>

                    <span className="text-gray-400">to</span>

                    {/* End Time */}
                    <div className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-indigo-500" />
                      <input
                        type="time"
                        value={day.schoolEndTime || '15:00'}
                        onChange={(e) => {
                          const updated = [...dayWiseTimings];
                          updated[idx] = { ...updated[idx], schoolEndTime: e.target.value };
                          setDayWiseTimings(updated);
                        }}
                        className="px-3 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 font-medium"
                      />
                    </div>

                    {/* Half Day Toggle */}
                    <label className="flex items-center gap-2 cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={day.isHalfDay || false}
                        onChange={(e) => {
                          const updated = [...dayWiseTimings];
                          updated[idx] = { ...updated[idx], isHalfDay: e.target.checked };
                          if (e.target.checked && updated[idx].schoolEndTime > '13:00') {
                            updated[idx].schoolEndTime = '12:30';
                          }
                          setDayWiseTimings(updated);
                        }}
                        className="w-4 h-4 text-amber-500 rounded"
                      />
                      <span className="text-sm text-amber-600 font-medium">Half Day</span>
                    </label>

                    {/* Template Selector */}
                    {templates.length > 0 && (
                      <select
                        value={day.templateId || ''}
                        onChange={(e) => {
                          const updated = [...dayWiseTimings];
                          updated[idx] = { ...updated[idx], templateId: e.target.value || null };
                          setDayWiseTimings(updated);
                        }}
                        className="ml-auto px-3 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                      >
                        <option value="">Default Template</option>
                        {templates.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    )}
                  </>
                )}

                {!day.isWorkingDay && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm">Day Off</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {dayWiseTimings.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-600">No Day Configuration</h4>
              <p className="text-gray-400 mt-2">Save default settings first to configure day-wise hours</p>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">How Day-wise Configuration Works</p>
                <ul className="list-disc list-inside space-y-1 text-blue-600">
                  <li>Configure different school hours for each day (e.g., Saturday = half day)</li>
                  <li>Assign specific schedule templates to different days</li>
                  <li>Day-wise settings override default school hours</li>
                  <li>Exceptions (holidays) override day-wise settings</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Schedule Templates */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Templates</h3>
                <button onClick={() => { setEditingTemplate(null); setShowTemplateModal(true); }}
                  className="p-2 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200">
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              {templates.length === 0 ? (
                <div className="text-center py-8">
                  <Grid3X3 className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No templates yet</p>
                  <button onClick={() => setShowQuickSetup(true)}
                    className="mt-3 text-indigo-600 text-sm font-medium">
                    Use Quick Setup →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {templates.map(template => (
                    <button key={template.id} onClick={() => loadTemplateDetails(template.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left ${
                        activeTemplate?.id === template.id
                          ? 'bg-indigo-50 border-2 border-indigo-300'
                          : 'hover:bg-gray-50 border-2 border-transparent'
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          template.isDefault ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{template.name}</p>
                          <p className="text-xs text-gray-500">{template.periodCount} periods • {template.breakCount} breaks</p>
                        </div>
                      </div>
                      {template.isDefault && (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">Default</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Template Editor */}
          <div className="lg:col-span-2">
            {activeTemplate ? (
              <div className="space-y-6">
                {/* Template Info */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{activeTemplate.name}</h3>
                      <p className="text-gray-500">{activeTemplate.description || 'No description'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowAutoGenerate(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all">
                        <Zap className="w-4 h-4" /> Auto Generate
                      </button>
                      <button onClick={handleSaveAll} disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50">
                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save All
                      </button>
                      <button onClick={() => { setEditingTemplate(activeTemplate); setTemplateForm(activeTemplate); setShowTemplateModal(true); }}
                        className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                        <Edit2 className="w-5 h-5" />
                      </button>
                      {!activeTemplate.isDefault && (
                        <button onClick={() => handleDeleteTemplate(activeTemplate.id)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Visual Timeline */}
                  {getTimeline().length > 0 ? (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Daily Schedule Preview</h4>
                      <div className="flex items-stretch gap-1 h-14 rounded-xl overflow-hidden bg-gray-100 p-1">
                        {getTimeline().map((item, idx) => (
                          <div key={idx} title={`${item.name}: ${formatTime(item.startTime)} - ${formatTime(item.endTime)}`}
                            className={`flex-1 rounded-lg flex items-center justify-center text-white text-xs font-medium ${
                              item.type === 'break' ? 'bg-amber-400' : 'bg-indigo-500'
                            }`}>
                            {item.shortName || item.name?.split(' ')[0]}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-dashed border-purple-200 text-center">
                      <Zap className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                      <p className="text-purple-700 font-medium">No periods configured yet</p>
                      <p className="text-purple-500 text-sm mt-1">Click "Auto Generate" to quickly create all periods and breaks</p>
                    </div>
                  )}
                </div>

                {/* Periods */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-indigo-500" />
                      Periods ({activeTemplate.periods?.length || 0})
                    </h4>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowPeriodModal('add')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-200">
                        <Plus className="w-4 h-4" /> Add Period
                      </button>
                      <button onClick={handleSavePeriods} disabled={saving}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-600 rounded-lg text-sm font-medium hover:bg-green-200">
                        <Save className="w-4 h-4" /> Save
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {activeTemplate.periods?.map((period, idx) => (
                      <div key={period.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl group">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                          P{period.periodNumber}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{period.name}</p>
                          <p className="text-sm text-gray-500">{formatTime(period.startTime)} - {formatTime(period.endTime)}</p>
                        </div>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {period.durationMinutes || '--'} min
                        </span>
                        <button onClick={() => removePeriod(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Breaks */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                      <Coffee className="w-5 h-5 text-amber-500" />
                      Breaks ({activeTemplate.breaks?.length || 0})
                    </h4>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setShowBreakModal('add')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-600 rounded-lg text-sm font-medium hover:bg-amber-200">
                        <Plus className="w-4 h-4" /> Add Break
                      </button>
                      <button onClick={handleSaveBreaks} disabled={saving}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-600 rounded-lg text-sm font-medium hover:bg-green-200">
                        <Save className="w-4 h-4" /> Save
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {activeTemplate.breaks?.map((brk, idx) => (
                      <div key={brk.id} className="flex items-center gap-4 p-3 bg-amber-50 rounded-xl group">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                          <Coffee className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{brk.name}</p>
                          <p className="text-sm text-gray-500">{formatTime(brk.startTime)} - {formatTime(brk.endTime)} (after P{brk.afterPeriod})</p>
                        </div>
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                          {brk.durationMinutes || '--'} min
                        </span>
                        <button onClick={() => removeBreak(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <Clock className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-600">Select a Template</h3>
                <p className="text-gray-400 mt-2">Choose a template from the left to edit its periods and breaks</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Exceptions */}
      {activeTab === 'exceptions' && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Holidays & Special Days</h3>
            <button onClick={() => setShowExceptionModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium">
              <Plus className="w-4 h-4" /> Add Exception
            </button>
          </div>

          {exceptions.length === 0 ? (
            <div className="text-center py-12">
              <CalendarDays className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-600">No Exceptions</h4>
              <p className="text-gray-400 mt-2">Add holidays, half-days, or special timing days</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exceptions.map(exception => {
                const typeConfig = EXCEPTION_TYPES.find(t => t.value === exception.exceptionType);
                return (
                  <div key={exception.id} className="relative p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                    <div className={`absolute top-0 left-0 w-1 h-full ${typeConfig?.color} rounded-l-xl`}></div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-800">
                          {new Date(exception.exceptionDate).toLocaleDateString('en-IN', { 
                            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' 
                          })}
                        </p>
                        <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${typeConfig?.color} text-white`}>
                          {typeConfig?.label}
                        </span>
                        {exception.reason && (
                          <p className="text-sm text-gray-500 mt-2">{exception.reason}</p>
                        )}
                      </div>
                      <button onClick={async () => {
                        await classTimings.deleteException(exception.id);
                        fetchData();
                      }} className="p-1 text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Quick Setup Modal */}
      {showQuickSetup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="w-8 h-8" />
                  <div>
                    <h3 className="text-xl font-bold">Quick Setup</h3>
                    <p className="text-white/70 text-sm">Generate timing in seconds</p>
                  </div>
                </div>
                <button onClick={() => setShowQuickSetup(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">School Starts At</label>
                  <input type="time" value={quickSetupForm.schoolStartTime}
                    onChange={(e) => setQuickSetupForm({ ...quickSetupForm, schoolStartTime: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 text-lg font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Periods</label>
                  <input type="number" min="4" max="12" value={quickSetupForm.periodsCount}
                    onChange={(e) => setQuickSetupForm({ ...quickSetupForm, periodsCount: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 text-lg font-medium text-center" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Period Duration: {quickSetupForm.periodDuration} minutes</label>
                <input type="range" min="30" max="60" value={quickSetupForm.periodDuration}
                  onChange={(e) => setQuickSetupForm({ ...quickSetupForm, periodDuration: parseInt(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lunch After Period</label>
                  <select value={quickSetupForm.lunchAfterPeriod}
                    onChange={(e) => setQuickSetupForm({ ...quickSetupForm, lunchAfterPeriod: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500">
                    {Array.from({ length: quickSetupForm.periodsCount - 1 }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>Period {n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lunch Duration</label>
                  <select value={quickSetupForm.lunchDuration}
                    onChange={(e) => setQuickSetupForm({ ...quickSetupForm, lunchDuration: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500">
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 rounded-xl">
                <div className="flex items-center gap-2 text-indigo-700">
                  <Info className="w-5 h-5" />
                  <p className="text-sm font-medium">This will create a "Regular Day" template with your settings</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowQuickSetup(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl font-medium">
                Cancel
              </button>
              <button onClick={handleQuickSetup} disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium shadow-lg disabled:opacity-50">
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                Generate Timetable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">{editingTemplate ? 'Edit Template' : 'Create Template'}</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template Name</label>
                <input type="text" value={templateForm.name} placeholder="e.g., Regular Day, Exam Day"
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
                <input type="text" value={templateForm.code} placeholder="e.g., REGULAR, EXAM"
                  onChange={(e) => setTemplateForm({ ...templateForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 uppercase" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea value={templateForm.description} rows={2}
                  onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={templateForm.isDefault}
                  onChange={(e) => setTemplateForm({ ...templateForm, isDefault: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded" />
                <span className="text-sm text-gray-700">Set as default template</span>
              </label>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => { setShowTemplateModal(false); setEditingTemplate(null); }} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-xl">
                Cancel
              </button>
              <button onClick={handleSaveTemplate} disabled={saving} className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-medium">
                {editingTemplate ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Period Modal */}
      {showPeriodModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Add Period</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Period Number</label>
                  <input type="number" value={periodForm.periodNumber} min={1}
                    onChange={(e) => setPeriodForm({ ...periodForm, periodNumber: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select value={periodForm.periodType}
                    onChange={(e) => setPeriodForm({ ...periodForm, periodType: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500">
                    {PERIOD_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input type="text" value={periodForm.name} placeholder="e.g., Period 1"
                  onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <input type="time" value={periodForm.startTime}
                    onChange={(e) => setPeriodForm({ ...periodForm, startTime: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                  <input type="time" value={periodForm.endTime}
                    onChange={(e) => setPeriodForm({ ...periodForm, endTime: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowPeriodModal(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-xl">Cancel</button>
              <button onClick={addPeriod} className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-medium">Add Period</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Break Modal */}
      {showBreakModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Add Break</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input type="text" value={breakForm.name} placeholder="e.g., Lunch Break"
                    onChange={(e) => setBreakForm({ ...breakForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select value={breakForm.breakType}
                    onChange={(e) => setBreakForm({ ...breakForm, breakType: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-amber-500">
                    {BREAK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <input type="time" value={breakForm.startTime}
                    onChange={(e) => setBreakForm({ ...breakForm, startTime: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-amber-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                  <input type="time" value={breakForm.endTime}
                    onChange={(e) => setBreakForm({ ...breakForm, endTime: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-amber-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">After Period</label>
                <select value={breakForm.afterPeriod}
                  onChange={(e) => setBreakForm({ ...breakForm, afterPeriod: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-amber-500">
                  {activeTemplate?.periods?.map(p => (
                    <option key={p.periodNumber} value={p.periodNumber}>After Period {p.periodNumber}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowBreakModal(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-xl">Cancel</button>
              <button onClick={addBreak} className="px-5 py-2 bg-amber-500 text-white rounded-xl font-medium">Add Break</button>
            </div>
          </div>
        </div>
      )}

      {/* Exception Modal */}
      {showExceptionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">Add Exception</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input type="date" value={exceptionForm.exceptionDate}
                  onChange={(e) => setExceptionForm({ ...exceptionForm, exceptionDate: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Exception Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {EXCEPTION_TYPES.map(type => (
                    <button key={type.value} type="button"
                      onClick={() => setExceptionForm({ ...exceptionForm, exceptionType: type.value, isNoSchool: type.value === 'holiday' })}
                      className={`p-2 rounded-xl text-sm font-medium transition-all ${
                        exceptionForm.exceptionType === type.value
                          ? `${type.color} text-white`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                <input type="text" value={exceptionForm.reason} placeholder="e.g., Diwali Holiday"
                  onChange={(e) => setExceptionForm({ ...exceptionForm, reason: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500" />
              </div>
              {exceptionForm.exceptionType !== 'holiday' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Use Template</label>
                  <select value={exceptionForm.templateId}
                    onChange={(e) => setExceptionForm({ ...exceptionForm, templateId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500">
                    <option value="">Default Template</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={exceptionForm.isNoSchool}
                  onChange={(e) => setExceptionForm({ ...exceptionForm, isNoSchool: e.target.checked })}
                  className="w-5 h-5 text-red-600 rounded" />
                <span className="text-sm text-gray-700">No school on this day</span>
              </label>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowExceptionModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-xl">Cancel</button>
              <button onClick={handleSaveException} disabled={saving} className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-medium">Save Exception</button>
            </div>
          </div>
        </div>
      )}

      {/* Auto Generate Modal */}
      {showAutoGenerate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Auto Generate Schedule</h3>
                    <p className="text-white/70 text-sm">Configure all periods & breaks in one click</p>
                  </div>
                </div>
                <button onClick={() => setShowAutoGenerate(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Time Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Sunrise className="w-4 h-4 inline mr-1 text-amber-500" /> School Starts At
                  </label>
                  <input type="time" value={autoGenForm.startTime}
                    onChange={(e) => setAutoGenForm({ ...autoGenForm, startTime: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-purple-500 text-lg font-semibold" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <BookOpen className="w-4 h-4 inline mr-1 text-indigo-500" /> Number of Periods
                  </label>
                  <input type="number" min="4" max="12" value={autoGenForm.periodsCount}
                    onChange={(e) => setAutoGenForm({ ...autoGenForm, periodsCount: parseInt(e.target.value) || 8 })}
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-purple-500 text-lg font-semibold text-center" />
                </div>
              </div>

              {/* Duration Settings */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Period Duration: <span className="text-purple-600 font-bold">{autoGenForm.periodDuration} min</span>
                  </label>
                  <input type="range" min="30" max="60" step="5" value={autoGenForm.periodDuration}
                    onChange={(e) => setAutoGenForm({ ...autoGenForm, periodDuration: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600" />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>30 min</span><span>45 min</span><span>60 min</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Break Duration: <span className="text-amber-600 font-bold">{autoGenForm.shortBreakDuration} min</span>
                  </label>
                  <input type="range" min="5" max="20" step="5" value={autoGenForm.shortBreakDuration}
                    onChange={(e) => setAutoGenForm({ ...autoGenForm, shortBreakDuration: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                </div>
              </div>

              {/* Short Breaks After */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Coffee className="w-4 h-4 inline mr-1 text-amber-500" /> Short Breaks After Period
                </label>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: autoGenForm.periodsCount - 1 }, (_, i) => i + 1).map(num => (
                    <button key={num} type="button"
                      onClick={() => num !== autoGenForm.lunchAfterPeriod && toggleShortBreakAfter(num)}
                      disabled={num === autoGenForm.lunchAfterPeriod}
                      className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                        num === autoGenForm.lunchAfterPeriod
                          ? 'bg-orange-100 text-orange-400 cursor-not-allowed'
                          : autoGenForm.shortBreakAfter.includes(num)
                            ? 'bg-amber-500 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      P{num}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Click to toggle. Orange = Lunch (can't add break there)</p>
              </div>

              {/* Lunch Settings */}
              <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Coffee className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-orange-800">Lunch Break</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div>
                        <label className="text-xs text-orange-600">After Period</label>
                        <select value={autoGenForm.lunchAfterPeriod}
                          onChange={(e) => setAutoGenForm({ 
                            ...autoGenForm, 
                            lunchAfterPeriod: parseInt(e.target.value),
                            shortBreakAfter: autoGenForm.shortBreakAfter.filter(p => p !== parseInt(e.target.value))
                          })}
                          className="ml-2 px-3 py-1.5 bg-white border-0 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm font-semibold">
                          {Array.from({ length: autoGenForm.periodsCount - 1 }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>P{n}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-orange-600">Duration</label>
                        <select value={autoGenForm.lunchDuration}
                          onChange={(e) => setAutoGenForm({ ...autoGenForm, lunchDuration: parseInt(e.target.value) })}
                          className="ml-2 px-3 py-1.5 bg-white border-0 rounded-lg focus:ring-2 focus:ring-orange-500 text-sm font-semibold">
                          <option value={30}>30 min</option>
                          <option value={45}>45 min</option>
                          <option value={60}>60 min</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  <span>
                    This will generate <strong>{autoGenForm.periodsCount} periods</strong>, 
                    <strong> {autoGenForm.shortBreakAfter.length} short breaks</strong>, 
                    and <strong>1 lunch break</strong>
                  </span>
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setShowAutoGenerate(false)} 
                className="px-5 py-2.5 text-gray-600 hover:bg-gray-200 rounded-xl font-medium">
                Cancel
              </button>
              <button onClick={handleAutoGenerate}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
                <Zap className="w-4 h-4" /> Generate Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassTimingConfiguration;

