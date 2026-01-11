/**
 * DutiesReport Page
 * 
 * Full page for viewing duties and responsibilities with filters, 
 * calendar/list views, and action capabilities for teachers, students, and parents.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, Shield, Briefcase, ChevronRight, ChevronLeft,
  AlertCircle, CheckCircle, User, Users, Filter, Loader2, CalendarDays,
  ListTodo, FileText, Download, RefreshCw, Bell, Star, Building2, Check,
  X, UserCheck, GraduationCap, Play, Pause, ArrowLeft, Search, Eye
} from 'lucide-react';
import { roster } from '../services/api';

// Status badges with colors
const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Calendar, bgFull: 'bg-blue-500' },
  accepted: { label: 'Accepted', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: CheckCircle, bgFull: 'bg-blue-500' },
  active: { label: 'Active', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Play, bgFull: 'bg-green-500' },
  completed: { label: 'Completed', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: CheckCircle, bgFull: 'bg-slate-500' },
  pending_approval: { label: 'Pending Approval', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: AlertCircle, bgFull: 'bg-amber-500' },
  pending_acceptance: { label: 'Pending Your Acceptance', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: Bell, bgFull: 'bg-orange-500' },
  declined: { label: 'Declined', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: X, bgFull: 'bg-red-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: X, bgFull: 'bg-red-500' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DutiesReport = ({ 
  userType, // 'teacher', 'student', 'parent'
  userId,
  backPath = '/teacher',
  accentColor = 'emerald', // 'blue', 'emerald', 'amber', 'purple'
  children = [], // For parent - list of children
}) => {
  const navigate = useNavigate();
  const [duties, setDuties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  
  // Filters
  const [viewMode, setViewMode] = useState('list'); // 'list', 'calendar'
  const [dateRange, setDateRange] = useState('week'); // 'today', 'week', 'month', 'all'
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChild, setSelectedChild] = useState(children[0]?.id || null);
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal states
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineTarget, setDeclineTarget] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [showDatesModal, setShowDatesModal] = useState(false);
  const [selectedDutyDates, setSelectedDutyDates] = useState(null);

  // Color schemes
  const colorSchemes = {
    blue: {
      primary: 'bg-blue-500',
      primaryHover: 'hover:bg-blue-600',
      gradient: 'from-blue-500 to-cyan-500',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    emerald: {
      primary: 'bg-emerald-500',
      primaryHover: 'hover:bg-emerald-600',
      gradient: 'from-emerald-500 to-teal-500',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    amber: {
      primary: 'bg-amber-500',
      primaryHover: 'hover:bg-amber-600',
      gradient: 'from-amber-500 to-orange-500',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    purple: {
      primary: 'bg-purple-500',
      primaryHover: 'hover:bg-purple-600',
      gradient: 'from-purple-500 to-pink-500',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
  };

  const colors = colorSchemes[accentColor] || colorSchemes.emerald;

  // Helper to format date as YYYY-MM-DD
  const formatLocalDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to safely parse a date string from API
  const parseApiDate = (dateStr) => {
    if (!dateStr) return null;
    // If it's already a Date object, format it
    if (dateStr instanceof Date) {
      return dateStr.toISOString().split('T')[0];
    }
    // If it's a string, just take the date part
    return String(dateStr).split('T')[0];
  };

  // Helper to safely create a displayable date
  const toDisplayDate = (dateStr, options = { month: 'short', day: 'numeric', year: 'numeric' }) => {
    if (!dateStr) return 'Unknown Date';
    const normalized = parseApiDate(dateStr);
    if (!normalized) return 'Invalid Date';
    // Add time component to ensure correct parsing
    const date = new Date(normalized + 'T00:00:00');
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', options);
  };

  // Fetch duties
  const fetchDuties = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const today = new Date();
      let startDate, endDate;
      
      switch (dateRange) {
        case 'today':
          startDate = formatLocalDate(today);
          endDate = formatLocalDate(today);
          break;
        case 'week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          startDate = formatLocalDate(weekStart);
          endDate = formatLocalDate(weekEnd);
          break;
        case 'month':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          startDate = formatLocalDate(monthStart);
          endDate = formatLocalDate(monthEnd);
          break;
        case 'all':
        default:
          // Last 6 months to next 6 months
          const allStart = new Date(today);
          allStart.setMonth(today.getMonth() - 6);
          const allEnd = new Date(today);
          allEnd.setMonth(today.getMonth() + 6);
          startDate = formatLocalDate(allStart);
          endDate = formatLocalDate(allEnd);
          break;
      }
      
      const effectiveUserId = userType === 'parent' && selectedChild ? selectedChild : userId;
      const effectiveType = userType === 'parent' ? 'student' : userType;
      
      const result = await roster.getMyDuties({
        assignee_id: effectiveUserId,
        assignee_type: effectiveType,
        start_date: startDate,
        end_date: endDate,
      });
      
      setDuties(result.data || []);
    } catch (err) {
      console.error('Error fetching duties:', err);
      setError('Failed to load duties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId || (userType === 'parent' && selectedChild)) {
      fetchDuties();
    }
  }, [userId, selectedChild, dateRange, userType]);

  // Filter duties based on search and status
  const filteredDuties = useMemo(() => {
    return duties.filter(duty => {
      if (statusFilter !== 'all' && duty.status !== statusFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const searchFields = [
          duty.duty_name,
          duty.roster_type_name,
          duty.location_name,
          duty.role_name,
        ].filter(Boolean).join(' ').toLowerCase();
        if (!searchFields.includes(query)) return false;
      }
      return true;
    });
  }, [duties, statusFilter, searchQuery]);

  // Accept duty
  const handleAccept = async (dutyId) => {
    setActionLoading(dutyId);
    try {
      await roster.acceptAssignment(dutyId);
      await fetchDuties();
    } catch (err) {
      console.error('Error accepting duty:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Accept all dates
  const handleAcceptAll = async (dutyId) => {
    setActionLoading(dutyId);
    try {
      await roster.acceptAllDates(dutyId);
      await fetchDuties();
      // Update the modal data if open
      if (showDatesModal && selectedDutyDates?.id === dutyId) {
        const updatedDuty = duties.find(d => d.id === dutyId);
        if (updatedDuty) setSelectedDutyDates(updatedDuty);
      }
    } catch (err) {
      console.error('Error accepting all dates:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Decline duty
  const handleDecline = async () => {
    if (!declineTarget) return;
    setActionLoading(declineTarget.dutyId);
    try {
      if (declineTarget.dateId) {
        await roster.declineDate(declineTarget.dutyId, declineTarget.dateId, declineReason);
      } else if (declineTarget.declineAll) {
        await roster.declineAllDates(declineTarget.dutyId, declineReason);
      } else {
        await roster.declineAssignment(declineTarget.dutyId, declineReason);
      }
      await fetchDuties();
      setShowDeclineModal(false);
      setDeclineTarget(null);
      setDeclineReason('');
      // Close dates modal if open
      if (showDatesModal) {
        setShowDatesModal(false);
        setSelectedDutyDates(null);
      }
    } catch (err) {
      console.error('Error declining duty:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Accept specific date
  const handleAcceptDate = async (dutyId, dateId) => {
    setActionLoading(`${dutyId}-${dateId}`);
    try {
      await roster.acceptDate(dutyId, dateId);
      // Refresh duties and update modal if open
      const result = await fetchDuties();
      // Find updated duty and refresh modal data
      if (showDatesModal && selectedDutyDates?.id === dutyId) {
        const effectiveUserId = userType === 'parent' && selectedChild ? selectedChild : userId;
        const effectiveType = userType === 'parent' ? 'student' : userType;
        const today = new Date();
        const refreshResult = await roster.getMyDuties({
          assignee_id: effectiveUserId,
          assignee_type: effectiveType,
          start_date: formatLocalDate(new Date(today.setMonth(today.getMonth() - 6))),
          end_date: formatLocalDate(new Date(new Date().setMonth(new Date().getMonth() + 6))),
        });
        const updatedDuty = refreshResult.data?.find(d => d.id === dutyId);
        if (updatedDuty) setSelectedDutyDates(updatedDuty);
      }
    } catch (err) {
      console.error('Error accepting date:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Complete specific date
  const handleCompleteDate = async (dutyId, dateId) => {
    setActionLoading(`${dutyId}-${dateId}`);
    try {
      await roster.completeDate(dutyId, dateId);
      // Refresh duties and update modal if open
      await fetchDuties();
      // Find updated duty and refresh modal data
      if (showDatesModal && selectedDutyDates?.id === dutyId) {
        const effectiveUserId = userType === 'parent' && selectedChild ? selectedChild : userId;
        const effectiveType = userType === 'parent' ? 'student' : userType;
        const today = new Date();
        const refreshResult = await roster.getMyDuties({
          assignee_id: effectiveUserId,
          assignee_type: effectiveType,
          start_date: formatLocalDate(new Date(today.setMonth(today.getMonth() - 6))),
          end_date: formatLocalDate(new Date(new Date().setMonth(new Date().getMonth() + 6))),
        });
        const updatedDuty = refreshResult.data?.find(d => d.id === dutyId);
        if (updatedDuty) setSelectedDutyDates(updatedDuty);
      }
    } catch (err) {
      console.error('Error completing date:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Mark complete
  const handleMarkComplete = async (dutyId) => {
    setActionLoading(dutyId);
    try {
      await roster.markComplete(dutyId);
      await fetchDuties();
    } catch (err) {
      console.error('Error marking complete:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Open decline modal
  const openDeclineModal = (dutyId, dateId = null, declineAll = false) => {
    setDeclineTarget({ dutyId, dateId, declineAll });
    setShowDeclineModal(true);
  };

  // Calendar helpers
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getDutiesForDate = (date) => {
    const dateStr = formatLocalDate(date);
    return filteredDuties.filter(duty => {
      const start = duty.start_date?.split('T')[0];
      const end = duty.end_date?.split('T')[0] || start;
      return dateStr >= start && dateStr <= end;
    }).map(duty => {
      // Get per-date status if available
      if (duty.dates && duty.dates.length > 0) {
        const dateRecord = duty.dates.find(d => d.date?.split('T')[0] === dateStr);
        if (dateRecord) {
          return { ...duty, date_status: dateRecord.status };
        }
      }
      return duty;
    });
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  // Statistics
  const stats = useMemo(() => {
    const pending = duties.filter(d => d.status === 'pending_acceptance').length;
    const scheduled = duties.filter(d => d.status === 'scheduled' || d.status === 'accepted').length;
    const completed = duties.filter(d => d.status === 'completed').length;
    const declined = duties.filter(d => d.status === 'declined').length;
    return { pending, scheduled, completed, declined, total: duties.length };
  }, [duties]);

  // Open dates modal
  const openDatesModal = (duty) => {
    setSelectedDutyDates(duty);
    setShowDatesModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(backPath)}
              className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white">
                My Duties & Responsibilities
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                View and manage all your assigned duties
              </p>
            </div>
          </div>
          
          <button
            onClick={fetchDuties}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 ${colors.primary} ${colors.primaryHover} text-white rounded-lg transition-colors disabled:opacity-50`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.pending}</div>
                <div className="text-xs text-slate-400">Pending</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.scheduled}</div>
                <div className="text-xs text-slate-400">Scheduled</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.completed}</div>
                <div className="text-xs text-slate-400">Completed</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <X className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.declined}</div>
                <div className="text-xs text-slate-400">Declined</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center`}>
                <ListTodo className={`w-5 h-5 ${colors.text}`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-xs text-slate-400">Total</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Child Selector for Parent */}
            {userType === 'parent' && children.length > 0 && (
              <div className="flex-1 max-w-xs">
                <label className="block text-xs text-slate-400 mb-1">Select Child</label>
                <select
                  value={selectedChild || ''}
                  onChange={(e) => setSelectedChild(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
                >
                  {children.map(child => (
                    <option key={child.id} value={child.id}>
                      {child.firstName} {child.lastName} - {child.className}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Search */}
            <div className="flex-1 max-w-sm">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search duties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-400"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="flex items-center gap-2 flex-wrap">
              {['today', 'week', 'month', 'all'].map(range => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    dateRange === range
                      ? `${colors.primary} text-white`
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                  }`}
                >
                  {range === 'today' ? 'Today' : range === 'week' ? 'This Week' : range === 'month' ? 'This Month' : 'All'}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending_acceptance">Pending Acceptance</option>
              <option value="scheduled">Scheduled</option>
              <option value="accepted">Accepted</option>
              <option value="completed">Completed</option>
              <option value="declined">Declined</option>
            </select>

            {/* View Mode */}
            <div className="flex items-center gap-1 p-1 bg-slate-700/50 rounded-lg">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? `${colors.primary} text-white` : 'text-slate-400 hover:text-white'
                }`}
              >
                <ListTodo className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'calendar' ? `${colors.primary} text-white` : 'text-slate-400 hover:text-white'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className={`w-8 h-8 animate-spin ${colors.text}`} />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-400">{error}</p>
            <button
              onClick={fetchDuties}
              className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredDuties.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-12 text-center">
            <div className={`w-16 h-16 rounded-full ${colors.bg} flex items-center justify-center mx-auto mb-4`}>
              <ListTodo className={`w-8 h-8 ${colors.text}`} />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Duties Found</h3>
            <p className="text-slate-400">No duties match your current filters</p>
          </div>
        ) : viewMode === 'list' ? (
          /* List View */
          <div className="space-y-4">
            {filteredDuties.map(duty => {
              const StatusIcon = STATUS_CONFIG[duty.status]?.icon || Calendar;
              const statusConfig = STATUS_CONFIG[duty.status] || STATUS_CONFIG.scheduled;
              const isPending = duty.status === 'pending_acceptance';
              const isScheduled = duty.status === 'scheduled' || duty.status === 'accepted';
              const isMultiDay = duty.dates && duty.dates.length > 0;
              
              // Calculate date stats for multi-day duties
              const dateStats = isMultiDay ? {
                total: duty.dates.length,
                accepted: duty.dates.filter(d => d.status === 'accepted' || d.status === 'scheduled').length,
                pending: duty.dates.filter(d => d.status === 'pending_acceptance').length,
                declined: duty.dates.filter(d => d.status === 'declined').length,
                completed: duty.dates.filter(d => d.status === 'completed').length,
              } : null;
              
              return (
                <div
                  key={duty.id}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600/50 transition-colors"
                >
                  {/* Main Duty Info */}
                  <div className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                            <Briefcase className={`w-6 h-6 ${colors.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-white text-lg">{duty.duty_name || 'Assigned Duty'}</h3>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                {statusConfig.label}
                              </span>
                              {isMultiDay && (
                                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                  {duty.dates.length} Days
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 mt-3 text-sm text-slate-400 flex-wrap">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                <span className="font-medium text-slate-300">
                                  {toDisplayDate(duty.start_date)}
                                </span>
                                {duty.end_date && parseApiDate(duty.end_date) !== parseApiDate(duty.start_date) && (
                                  <span className="text-slate-300">→ {toDisplayDate(duty.end_date)}</span>
                                )}
                              </div>
                              {duty.time_slot_name && (
                                <div className="flex items-center gap-1.5">
                                  <Clock className="w-4 h-4" />
                                  {duty.time_slot_name}
                                </div>
                              )}
                              {duty.location_name && (
                                <div className="flex items-center gap-1.5">
                                  <MapPin className="w-4 h-4" />
                                  {duty.location_name}
                                </div>
                              )}
                              {duty.supervisor_name && (
                                <div className="flex items-center gap-1.5">
                                  <Shield className="w-4 h-4" />
                                  Supervisor: {duty.supervisor_name}
                                </div>
                              )}
                            </div>
                            
                            {/* Multi-day Stats Summary */}
                            {isMultiDay && dateStats && (
                              <div className="flex items-center gap-3 mt-3">
                                {dateStats.accepted > 0 && (
                                  <span className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-300">
                                    <CheckCircle className="w-3 h-3" /> {dateStats.accepted} Accepted
                                  </span>
                                )}
                                {dateStats.pending > 0 && (
                                  <span className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-300">
                                    <Clock className="w-3 h-3" /> {dateStats.pending} Pending
                                  </span>
                                )}
                                {dateStats.declined > 0 && (
                                  <span className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-red-500/20 text-red-300">
                                    <X className="w-3 h-3" /> {dateStats.declined} Declined
                                  </span>
                                )}
                                {dateStats.completed > 0 && (
                                  <span className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-slate-500/20 text-slate-300">
                                    <CheckCircle className="w-3 h-3" /> {dateStats.completed} Completed
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
                        {isMultiDay && (
                          <>
                            <button
                              onClick={() => openDatesModal(duty)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-slate-700/50 text-slate-300 rounded-lg text-sm hover:bg-slate-600/50 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              Manage Dates
                            </button>
                            {dateStats.pending > 0 && (
                              <>
                                <button
                                  onClick={() => handleAcceptAll(duty.id)}
                                  disabled={actionLoading === duty.id}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                                >
                                  {actionLoading === duty.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                  Accept All
                                </button>
                                <button
                                  onClick={() => openDeclineModal(duty.id, null, true)}
                                  disabled={actionLoading === duty.id}
                                  className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                                >
                                  <X className="w-4 h-4" />
                                  Decline All
                                </button>
                              </>
                            )}
                          </>
                        )}
                        
                        {isPending && !isMultiDay && (
                          <>
                            <button
                              onClick={() => handleAccept(duty.id)}
                              disabled={actionLoading === duty.id}
                              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                            >
                              {actionLoading === duty.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                              Accept
                            </button>
                            <button
                              onClick={() => openDeclineModal(duty.id)}
                              disabled={actionLoading === duty.id}
                              className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                              Decline
                            </button>
                          </>
                        )}
                        
                        {isScheduled && !isMultiDay && (
                          <button
                            onClick={() => handleMarkComplete(duty.id)}
                            disabled={actionLoading === duty.id}
                            className={`flex items-center gap-1.5 px-3 py-2 ${colors.primary} ${colors.primaryHover} text-white rounded-lg text-sm transition-colors disabled:opacity-50`}
                          >
                            {actionLoading === duty.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            Mark Complete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Calendar View */
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold text-white">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <button
                onClick={() => navigateMonth(1)}
                className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            {/* Legend */}
            <div className="flex items-center gap-4 px-4 py-2 bg-slate-800/30 border-b border-slate-700/30 text-xs">
              <span className="text-slate-400">Status:</span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-blue-500/50 border border-blue-500/50"></div>
                <span className="text-slate-300">Accepted</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-orange-500/50 border border-orange-500/50"></div>
                <span className="text-slate-300">Pending</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500/50 border border-red-500/50"></div>
                <span className="text-slate-300">Declined</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-slate-500/50 border border-slate-500/50"></div>
                <span className="text-slate-300">Completed</span>
              </div>
            </div>
            
            <div className="grid grid-cols-7 border-b border-slate-700/50">
              {DAYS.map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-slate-400">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7">
              {getDaysInMonth().map((date, idx) => {
                if (!date) {
                  return <div key={idx} className="h-24 border-b border-r border-slate-700/30 bg-slate-900/30" />;
                }
                
                const dayDuties = getDutiesForDate(date);
                const isToday = date.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={idx}
                    className={`h-24 border-b border-r border-slate-700/30 p-1 ${
                      isToday ? 'bg-slate-700/30' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? colors.text : 'text-slate-300'}`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-0.5 overflow-hidden max-h-16">
                      {dayDuties.slice(0, 2).map(duty => {
                        const effectiveStatus = duty.date_status || duty.status;
                        const statusColors = {
                          pending_acceptance: 'bg-orange-500/30 text-orange-300 border-orange-500/30',
                          scheduled: 'bg-blue-500/30 text-blue-300 border-blue-500/30',
                          accepted: 'bg-blue-500/30 text-blue-300 border-blue-500/30',
                          completed: 'bg-slate-500/30 text-slate-300 border-slate-500/30',
                          declined: 'bg-red-500/30 text-red-300 border-red-500/30',
                        };
                        
                        return (
                          <div
                            key={duty.id}
                            className={`text-xs px-1.5 py-0.5 rounded truncate border ${statusColors[effectiveStatus] || statusColors.scheduled}`}
                            title={`${duty.duty_name} - ${effectiveStatus}`}
                          >
                            {duty.duty_name}
                          </div>
                        );
                      })}
                      {dayDuties.length > 2 && (
                        <div className="text-xs text-slate-400 px-1">+{dayDuties.length - 2}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">
                {declineTarget?.declineAll ? 'Decline All Dates' : declineTarget?.dateId ? 'Decline This Date' : 'Decline Duty'}
              </h3>
            </div>
            <div className="p-6">
              <label className="block text-sm text-slate-300 mb-2">
                Please provide a reason for declining:
              </label>
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Enter reason..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="p-6 border-t border-slate-700 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeclineModal(false);
                  setDeclineTarget(null);
                  setDeclineReason('');
                }}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDecline}
                disabled={actionLoading || !declineReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Declining...' : 'Decline'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Dates Modal */}
      {showDatesModal && selectedDutyDates && (() => {
        const modalDateStats = {
          total: selectedDutyDates.dates?.length || 0,
          accepted: selectedDutyDates.dates?.filter(d => d.status === 'accepted' || d.status === 'scheduled').length || 0,
          pending: selectedDutyDates.dates?.filter(d => d.status === 'pending_acceptance').length || 0,
          declined: selectedDutyDates.dates?.filter(d => d.status === 'declined').length || 0,
          completed: selectedDutyDates.dates?.filter(d => d.status === 'completed').length || 0,
        };
        
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                      <Briefcase className={`w-6 h-6 ${colors.text}`} />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {selectedDutyDates.duty_name || 'Duty'}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1">
                        {selectedDutyDates.time_slot_name && `${selectedDutyDates.time_slot_name} • `}
                        {selectedDutyDates.location_name || 'No location'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDatesModal(false)}
                    className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Stats Bar */}
                <div className="grid grid-cols-5 gap-2 mt-4 p-3 bg-slate-700/30 rounded-lg">
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{modalDateStats.total}</p>
                    <p className="text-xs text-slate-400">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-blue-400">{modalDateStats.accepted}</p>
                    <p className="text-xs text-slate-400">Accepted</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-orange-400">{modalDateStats.pending}</p>
                    <p className="text-xs text-slate-400">Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-red-400">{modalDateStats.declined}</p>
                    <p className="text-xs text-slate-400">Declined</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-slate-400">{modalDateStats.completed}</p>
                    <p className="text-xs text-slate-400">Completed</p>
                  </div>
                </div>
                
                {/* Bulk Actions */}
                {modalDateStats.pending > 0 && (
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => { handleAcceptAll(selectedDutyDates.id); }}
                      disabled={actionLoading === selectedDutyDates.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoading === selectedDutyDates.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Accept All Pending ({modalDateStats.pending})
                    </button>
                    <button
                      onClick={() => openDeclineModal(selectedDutyDates.id, null, true)}
                      disabled={actionLoading === selectedDutyDates.id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Decline All Pending
                    </button>
                  </div>
                )}
              </div>
              
              {/* Dates List */}
              <div className="p-4 overflow-y-auto flex-1">
                <div className="grid gap-2">
                  {selectedDutyDates.dates?.map((dateRecord, idx) => {
                    const normalizedDate = parseApiDate(dateRecord.date);
                    const dateObj = normalizedDate ? new Date(normalizedDate + 'T00:00:00') : new Date();
                    const isValidDate = normalizedDate && !isNaN(dateObj.getTime());
                    const dateStr = isValidDate 
                      ? dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                      : 'Invalid Date';
                    const isPending = dateRecord.status === 'pending_acceptance';
                    const isAccepted = dateRecord.status === 'accepted' || dateRecord.status === 'scheduled';
                    const isDeclined = dateRecord.status === 'declined';
                    const isCompleted = dateRecord.status === 'completed';
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isToday = isValidDate && dateObj.toDateString() === today.toDateString();
                    const isPast = isValidDate && dateObj < today && !isToday;
                    
                    const statusColors = {
                      pending_acceptance: 'bg-orange-500/10 border-orange-500/30',
                      accepted: 'bg-blue-500/10 border-blue-500/30',
                      scheduled: 'bg-blue-500/10 border-blue-500/30',
                      declined: 'bg-red-500/10 border-red-500/30',
                      completed: 'bg-slate-500/10 border-slate-500/30',
                    };
                    
                    return (
                      <div 
                        key={dateRecord.id} 
                        className={`flex items-center justify-between p-3 rounded-lg border ${statusColors[dateRecord.status] || 'bg-slate-700/30 border-slate-600/30'} ${isToday ? 'ring-2 ring-emerald-500/50' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center ${isToday ? 'bg-emerald-500/20' : 'bg-slate-700/50'}`}>
                            <span className={`text-xs ${isToday ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {isValidDate ? dateObj.toLocaleDateString('en-US', { weekday: 'short' }) : '---'}
                            </span>
                            <span className={`text-sm font-bold ${isToday ? 'text-emerald-300' : 'text-white'}`}>
                              {isValidDate ? dateObj.getDate() : '--'}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">{dateStr}</span>
                              {isToday && <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">Today</span>}
                              {isPast && !isCompleted && <span className="text-xs px-1.5 py-0.5 rounded bg-slate-600/50 text-slate-400">Past</span>}
                            </div>
                            <span className={`text-xs ${
                              isPending ? 'text-orange-400' :
                              isAccepted ? 'text-blue-400' :
                              isDeclined ? 'text-red-400' :
                              'text-slate-400'
                            }`}>
                              {isPending ? 'Awaiting your response' :
                               isAccepted ? 'Accepted' :
                               isDeclined ? 'Declined' :
                               'Completed'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isPending && (
                            <>
                              <button
                                onClick={() => handleAcceptDate(selectedDutyDates.id, dateRecord.id)}
                                disabled={actionLoading === `${selectedDutyDates.id}-${dateRecord.id}`}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50"
                                title="Accept"
                              >
                                {actionLoading === `${selectedDutyDates.id}-${dateRecord.id}` ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                Accept
                              </button>
                              <button
                                onClick={() => openDeclineModal(selectedDutyDates.id, dateRecord.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                                title="Decline"
                              >
                                <X className="w-3.5 h-3.5" />
                                Decline
                              </button>
                            </>
                          )}
                          {isAccepted && (
                            <button
                              onClick={() => handleCompleteDate(selectedDutyDates.id, dateRecord.id)}
                              disabled={actionLoading === `${selectedDutyDates.id}-${dateRecord.id}`}
                              className={`flex items-center gap-1 px-3 py-1.5 ${colors.primary} ${colors.primaryHover} text-white rounded-lg text-sm transition-colors disabled:opacity-50`}
                              title="Mark Complete"
                            >
                              {actionLoading === `${selectedDutyDates.id}-${dateRecord.id}` ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3.5 h-3.5" />
                              )}
                              Complete
                            </button>
                          )}
                          {isDeclined && dateRecord.decline_reason && (
                            <div className="flex items-center gap-1 text-xs text-red-400 max-w-[150px]">
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate" title={dateRecord.decline_reason}>{dateRecord.decline_reason}</span>
                            </div>
                          )}
                          {isCompleted && (
                            <span className="flex items-center gap-1 text-sm text-green-400">
                              <CheckCircle className="w-4 h-4" />
                              Done
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Footer */}
              <div className="p-4 border-t border-slate-700">
                <button
                  onClick={() => setShowDatesModal(false)}
                  className="w-full px-4 py-2.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default DutiesReport;

