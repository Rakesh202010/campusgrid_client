/**
 * MyDuties Component
 * 
 * Displays roster assignments/duties for teachers, students, and parents
 * with beautiful design, filtering, and status management capabilities.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Calendar, Clock, MapPin, Shield, Briefcase, ChevronRight, ChevronLeft,
  AlertCircle, CheckCircle, User, Users, Filter, Loader2, CalendarDays,
  ListTodo, FileText, Download, RefreshCw, Bell, Star, Building2, Check,
  X, UserCheck, GraduationCap, Play, Pause
} from 'lucide-react';
import { roster } from '../services/api';

// Status badges with colors
const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Calendar, bgFull: 'bg-blue-500' },
  active: { label: 'Active', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Play, bgFull: 'bg-green-500' },
  completed: { label: 'Completed', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', icon: CheckCircle, bgFull: 'bg-slate-500' },
  pending_approval: { label: 'Pending Approval', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: AlertCircle, bgFull: 'bg-amber-500' },
  pending_acceptance: { label: 'Pending Your Acceptance', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: Bell, bgFull: 'bg-orange-500' },
  declined: { label: 'Declined', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: X, bgFull: 'bg-red-500' },
  cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: X, bgFull: 'bg-red-500' },
};

// Priority colors
const PRIORITY_COLORS = {
  0: 'border-l-slate-500',
  1: 'border-l-blue-500',
  2: 'border-l-amber-500',
  3: 'border-l-red-500',
};

const MyDuties = ({ 
  assigneeId, 
  assigneeType, // 'teacher', 'student', 'staff'
  showSupervised = false, // For teachers to see students under them
  compact = false,
  todayOnly = false, // Only show today's duties (for dashboard widgets)
  title = 'My Duties & Responsibilities',
  accentColor = 'blue', // 'blue', 'emerald', 'amber', 'purple'
  childrenList = [], // For parent portal - list of children
  canMarkComplete = true, // Allow marking duties as complete
  onViewAll = null, // Callback to navigate to full duties page
}) => {
  const [duties, setDuties] = useState([]);
  const [supervisedStudents, setSupervisedStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState(todayOnly ? 'today' : 'week'); // 'today', 'week', 'month', 'all'
  const [selectedChild, setSelectedChild] = useState(childrenList[0]?.id || null);
  const [statusFilter, setStatusFilter] = useState('all');

  // Helper to format date as YYYY-MM-DD
  const formatLocalDate = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch duties based on view mode
  const fetchDuties = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const today = new Date();
      let startDate, endDate;
      
      switch (viewMode) {
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
          startDate = formatLocalDate(new Date(today.getFullYear(), today.getMonth(), 1));
          endDate = formatLocalDate(new Date(today.getFullYear(), today.getMonth() + 1, 0));
          break;
        case 'all':
          // Show past 30 days to next 60 days
          const pastDate = new Date(today);
          pastDate.setDate(today.getDate() - 30);
          const futureDate = new Date(today);
          futureDate.setDate(today.getDate() + 60);
          startDate = formatLocalDate(pastDate);
          endDate = formatLocalDate(futureDate);
          break;
      }
      
      // For parent portal, use selected child's ID
      const targetAssigneeId = childrenList.length > 0 ? selectedChild : assigneeId;
      const targetAssigneeType = childrenList.length > 0 ? 'student' : assigneeType;
      
      if (!targetAssigneeId) {
        setDuties([]);
        setLoading(false);
        return;
      }
      
      const result = await roster.getMyDuties({
        assignee_id: targetAssigneeId,
        assignee_type: targetAssigneeType,
        start_date: startDate,
        end_date: endDate,
      });
      
      setDuties(result.data || []);
      
      // For teachers, also fetch supervised students
      if (showSupervised && assigneeType === 'teacher') {
        const supervisedResult = await roster.getSupervisedStudents({
          supervisor_id: assigneeId,
          date: formatLocalDate(today),
        });
        setSupervisedStudents(supervisedResult.data || []);
      }
    } catch (err) {
      console.error('Error fetching duties:', err);
      setError('Failed to load duties. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuties();
  }, [viewMode, selectedChild, assigneeId, assigneeType]);

  // Mark duty as complete
  const handleMarkComplete = async (dutyId) => {
    if (!canMarkComplete) return;
    setActionLoading(dutyId);
    try {
      const result = await roster.markComplete(dutyId);
      if (result.success) {
        // Update local state
        setDuties(prev => prev.map(d => 
          d.id === dutyId ? { ...d, status: 'completed' } : d
        ));
      }
    } catch (err) {
      console.error('Error marking complete:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // State for expanded duty dates view
  const [expandedDutyId, setExpandedDutyId] = useState(null);
  const [dutyDates, setDutyDates] = useState({});
  const [loadingDates, setLoadingDates] = useState(null);

  // Toggle expand/collapse duty dates
  const toggleDutyDates = async (dutyId) => {
    if (expandedDutyId === dutyId) {
      setExpandedDutyId(null);
      return;
    }
    
    setExpandedDutyId(dutyId);
    if (!dutyDates[dutyId]) {
      setLoadingDates(dutyId);
      try {
        const result = await roster.getAssignmentDates(dutyId);
        if (result.success) {
          setDutyDates(prev => ({ ...prev, [dutyId]: result.data }));
        }
      } catch (err) {
        console.error('Error fetching duty dates:', err);
      } finally {
        setLoadingDates(null);
      }
    }
  };

  // Accept all dates
  const handleAcceptAll = async (dutyId) => {
    setActionLoading(dutyId);
    try {
      const result = await roster.acceptAllDates(dutyId);
      if (result.success) {
        setDuties(prev => prev.map(d => 
          d.id === dutyId ? { ...d, status: 'scheduled' } : d
        ));
        // Refresh dates
        const datesResult = await roster.getAssignmentDates(dutyId);
        if (datesResult.success) {
          setDutyDates(prev => ({ ...prev, [dutyId]: datesResult.data }));
        }
      }
    } catch (err) {
      console.error('Error accepting all dates:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Accept single date
  const handleAcceptDate = async (dutyId, dateId) => {
    setActionLoading(`${dutyId}-${dateId}`);
    try {
      const result = await roster.acceptDate(dutyId, dateId);
      if (result.success) {
        setDutyDates(prev => ({
          ...prev,
          [dutyId]: prev[dutyId].map(d => 
            d.id === dateId ? { ...d, status: 'accepted' } : d
          )
        }));
        // Refresh main duty to get updated status
        fetchDuties();
      }
    } catch (err) {
      console.error('Error accepting date:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Complete single date
  const handleCompleteDate = async (dutyId, dateId) => {
    setActionLoading(`${dutyId}-${dateId}`);
    try {
      const result = await roster.completeDate(dutyId, dateId);
      if (result.success) {
        setDutyDates(prev => ({
          ...prev,
          [dutyId]: prev[dutyId].map(d => 
            d.id === dateId ? { ...d, status: 'completed' } : d
          )
        }));
        fetchDuties();
      }
    } catch (err) {
      console.error('Error completing date:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Accept duty assignment (for single-day or backward compatibility)
  const handleAccept = async (dutyId) => {
    setActionLoading(dutyId);
    try {
      const result = await roster.acceptAssignment(dutyId);
      if (result.success) {
        setDuties(prev => prev.map(d => 
          d.id === dutyId ? { ...d, status: 'scheduled' } : d
        ));
      }
    } catch (err) {
      console.error('Error accepting duty:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Decline duty assignment
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [decliningDutyId, setDecliningDutyId] = useState(null);
  const [decliningDateId, setDecliningDateId] = useState(null);
  const [declineMode, setDeclineMode] = useState('all'); // 'all' or 'single'

  const openDeclineModal = (dutyId, dateId = null) => {
    setDecliningDutyId(dutyId);
    setDecliningDateId(dateId);
    setDeclineMode(dateId ? 'single' : 'all');
    setDeclineReason('');
    setShowDeclineModal(true);
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) return;
    setActionLoading(decliningDutyId);
    try {
      let result;
      if (declineMode === 'single' && decliningDateId) {
        result = await roster.declineDate(decliningDutyId, decliningDateId, declineReason);
        if (result.success) {
          setDutyDates(prev => ({
            ...prev,
            [decliningDutyId]: prev[decliningDutyId]?.map(d => 
              d.id === decliningDateId ? { ...d, status: 'declined', decline_reason: declineReason } : d
            )
          }));
          fetchDuties();
        }
      } else {
        result = await roster.declineAllDates(decliningDutyId, declineReason);
        if (result.success) {
          setDuties(prev => prev.map(d => 
            d.id === decliningDutyId ? { ...d, status: 'declined' } : d
          ));
          if (dutyDates[decliningDutyId]) {
            setDutyDates(prev => ({
              ...prev,
              [decliningDutyId]: prev[decliningDutyId].map(d => ({ ...d, status: 'declined', decline_reason: declineReason }))
            }));
          }
        }
      }
      setShowDeclineModal(false);
      setDecliningDutyId(null);
      setDecliningDateId(null);
      setDeclineReason('');
    } catch (err) {
      console.error('Error declining duty:', err);
    } finally {
      setActionLoading(null);
    }
  };

  // Check if duty is multi-day
  const isMultiDay = (duty) => {
    if (!duty.start_date || !duty.end_date) return false;
    const start = new Date(duty.start_date);
    const end = new Date(duty.end_date);
    return end > start;
  };

  // Filter duties by status
  const filteredDuties = useMemo(() => {
    let filtered = duties;
    if (statusFilter !== 'all') {
      filtered = duties.filter(d => d.status === statusFilter);
    }
    // Sort by date and time
    return filtered.sort((a, b) => {
      const dateA = a.start_date?.split('T')[0] || '';
      const dateB = b.start_date?.split('T')[0] || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      const timeA = a.start_time || '00:00';
      const timeB = b.start_time || '00:00';
      return timeA.localeCompare(timeB);
    });
  }, [duties, statusFilter]);

  // Group duties by date with smart labels
  const dutiesByDate = useMemo(() => {
    const grouped = {};
    const today = formatLocalDate(new Date());
    const tomorrow = formatLocalDate(new Date(Date.now() + 86400000));
    const yesterday = formatLocalDate(new Date(Date.now() - 86400000));
    
    filteredDuties.forEach(duty => {
      const dateKey = duty.start_date?.split('T')[0] || 'No Date';
      let label = dateKey;
      
      if (dateKey === today) label = 'Today';
      else if (dateKey === tomorrow) label = 'Tomorrow';
      else if (dateKey === yesterday) label = 'Yesterday';
      else {
        const date = new Date(dateKey + 'T00:00:00');
        label = date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'short', 
          day: 'numeric' 
        });
      }
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = { label, duties: [] };
      }
      grouped[dateKey].duties.push(duty);
    });
    return grouped;
  }, [filteredDuties]);

  // Calculate stats
  const stats = useMemo(() => ({
    total: duties.length,
    scheduled: duties.filter(d => d.status === 'scheduled').length,
    active: duties.filter(d => d.status === 'active').length,
    completed: duties.filter(d => d.status === 'completed').length,
    pending: duties.filter(d => d.status === 'pending_approval').length,
  }), [duties]);

  // Color themes
  const colorThemes = {
    blue: {
      primary: 'from-blue-600 to-blue-700',
      accent: 'text-blue-400',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
    emerald: {
      primary: 'from-emerald-600 to-emerald-700',
      accent: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      button: 'bg-emerald-600 hover:bg-emerald-700',
    },
    amber: {
      primary: 'from-amber-600 to-amber-700',
      accent: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      button: 'bg-amber-600 hover:bg-amber-700',
    },
    purple: {
      primary: 'from-purple-600 to-purple-700',
      accent: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      button: 'bg-purple-600 hover:bg-purple-700',
    },
  };
  
  const theme = colorThemes[accentColor] || colorThemes.blue;

  // Format time
  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Today's duties for quick view
  const todaysDuties = useMemo(() => {
    const today = formatLocalDate(new Date());
    return duties.filter(d => {
      const start = d.start_date?.split('T')[0];
      const end = d.end_date?.split('T')[0] || start;
      return today >= start && today <= end;
    });
  }, [duties]);

  // Compact view for dashboard widgets
  if (compact) {
    return (
      <div className={`rounded-xl border ${theme.border} ${theme.bg} p-4`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-semibold ${theme.accent} flex items-center gap-2`}>
            <ListTodo className="w-5 h-5" />
            Today's Duties
          </h3>
          <span className="text-xs text-slate-400">
            {todaysDuties.length} {todaysDuties.length === 1 ? 'duty' : 'duties'}
          </span>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : todaysDuties.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">
            No duties scheduled for today
          </p>
        ) : (
          <div className="space-y-2">
            {todaysDuties.slice(0, 3).map((duty, idx) => (
              <div key={duty.id || idx} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50">
                <div className={`w-1 h-10 rounded-full ${PRIORITY_COLORS[duty.priority] || PRIORITY_COLORS[0]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {duty.duty_name || duty.roster_type_name || 'Duty'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    {duty.start_time && (
                      <>
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(duty.start_time)}</span>
                      </>
                    )}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${STATUS_CONFIG[duty.status]?.color || ''}`}>
                      {STATUS_CONFIG[duty.status]?.label || duty.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {todaysDuties.length > 3 && (
              <p className="text-xs text-center text-slate-400">
                +{todaysDuties.length - 3} more duties
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div className="bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${theme.primary} ${todayOnly ? 'p-4' : 'p-6'}`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className={`${todayOnly ? 'text-lg' : 'text-xl'} font-bold text-white flex items-center gap-3`}>
              <ListTodo className={todayOnly ? 'w-5 h-5' : 'w-6 h-6'} />
              {todayOnly ? "Today's Duties" : title}
            </h2>
            {!todayOnly && (
              <p className="text-white/70 text-sm mt-1">
                Track your assigned duties and responsibilities
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Child selector for parents */}
            {childrenList.length > 1 && (
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-white/70" />
                <select
                  value={selectedChild || ''}
                  onChange={(e) => setSelectedChild(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  {childrenList.map(child => (
                    <option key={child.id} value={child.id} className="bg-slate-800 text-white">
                      {child.firstName} {child.lastName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* View All button for todayOnly mode */}
            {onViewAll && (
              <button
                onClick={onViewAll}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-all text-sm font-medium"
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* View mode tabs - hide for todayOnly */}
        {!todayOnly && (
          <div className="flex flex-wrap gap-2 mt-4">
            {['today', 'week', 'month', 'all'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  viewMode === mode 
                    ? 'bg-white text-slate-800' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {mode === 'today' ? 'Today' : 
                 mode === 'week' ? 'This Week' : 
                 mode === 'month' ? 'This Month' : 'All'}
              </button>
            ))}
            <button
              onClick={() => fetchDuties()}
              className="px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Stats Bar - simplified for todayOnly */}
      {todayOnly ? (
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-400">
              <span className="font-semibold text-white">{stats.total}</span> duties today
            </span>
            {stats.pending > 0 && (
              <span className="text-orange-400">
                <span className="font-semibold">{stats.pending}</span> pending
              </span>
            )}
          </div>
          <button
            onClick={() => fetchDuties()}
            className="p-1.5 rounded-lg bg-slate-700/50 text-slate-400 hover:text-white transition-all"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-slate-800/50 border-b border-slate-700/50">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-slate-400">Total</p>
          </div>
          <div className="text-center cursor-pointer hover:opacity-80" onClick={() => setStatusFilter(statusFilter === 'scheduled' ? 'all' : 'scheduled')}>
            <p className="text-2xl font-bold text-blue-400">{stats.scheduled}</p>
            <p className="text-xs text-slate-400">Scheduled</p>
          </div>
          <div className="text-center cursor-pointer hover:opacity-80" onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}>
            <p className="text-2xl font-bold text-green-400">{stats.active}</p>
            <p className="text-xs text-slate-400">Active</p>
          </div>
          <div className="text-center cursor-pointer hover:opacity-80" onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}>
            <p className="text-2xl font-bold text-slate-400">{stats.completed}</p>
            <p className="text-xs text-slate-400">Completed</p>
          </div>
          <div className="text-center cursor-pointer hover:opacity-80" onClick={() => setStatusFilter(statusFilter === 'pending_approval' ? 'all' : 'pending_approval')}>
            <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
            <p className="text-xs text-slate-400">Pending</p>
          </div>
        </div>
      )}

      {/* Status Filter Pills - hide for todayOnly */}
      {!todayOnly && (
      <div className="p-4 border-b border-slate-700/50 flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-400 mr-2">Filter:</span>
        {['all', 'scheduled', 'active', 'pending_approval', 'completed'].map((status) => {
          const config = STATUS_CONFIG[status];
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                statusFilter === status 
                  ? `${theme.button} text-white border-transparent` 
                  : config ? config.color : 'bg-slate-700/50 text-slate-300 border-slate-600'
              }`}
            >
              {status === 'all' ? 'All' : config?.label || status}
            </button>
          );
        })}
      </div>
      )}

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400 mb-3" />
            <p className="text-slate-400">Loading duties...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-400">{error}</p>
            <button 
              onClick={fetchDuties}
              className={`mt-4 px-4 py-2 rounded-lg ${theme.button} text-white text-sm`}
            >
              Try Again
            </button>
          </div>
        ) : filteredDuties.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400 text-lg">No duties found</p>
            <p className="text-slate-500 text-sm mt-1">
              {statusFilter !== 'all' ? `No ${STATUS_CONFIG[statusFilter]?.label?.toLowerCase() || statusFilter} duties.` :
               viewMode === 'today' ? 'You have no duties scheduled for today.' : 
               viewMode === 'week' ? 'No duties scheduled for this week.' :
               viewMode === 'month' ? 'No duties scheduled for this month.' :
               'No duties have been assigned yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(dutiesByDate).sort(([a], [b]) => a.localeCompare(b)).map(([dateKey, { label, duties: dayDuties }]) => (
              <div key={dateKey}>
                <div className="flex items-center gap-3 mb-3 sticky top-0 bg-slate-900/90 backdrop-blur-sm py-2 -mx-4 px-4">
                  <CalendarDays className={`w-5 h-5 ${theme.accent}`} />
                  <h3 className="font-semibold text-white">{label}</h3>
                  <span className="text-xs text-slate-400 px-2 py-0.5 bg-slate-800 rounded-full">
                    {dayDuties.length} {dayDuties.length === 1 ? 'duty' : 'duties'}
                  </span>
                  {dateKey === formatLocalDate(new Date()) && (
                    <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                      Current
                    </span>
                  )}
                </div>
                
                <div className="space-y-3">
                  {dayDuties.map((duty, idx) => {
                    const statusConfig = STATUS_CONFIG[duty.status] || STATUS_CONFIG.scheduled;
                    const StatusIcon = statusConfig.icon;
                    const isCompleted = duty.status === 'completed';
                    const isPending = duty.status === 'pending_approval';
                    const isPendingAcceptance = duty.status === 'pending_acceptance';
                    const isDeclined = duty.status === 'declined';
                    const canComplete = canMarkComplete && ['scheduled', 'active'].includes(duty.status);
                    
                    return (
                      <div 
                        key={duty.id || idx}
                        className={`bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-all ${
                          isCompleted ? 'opacity-60' : ''
                        }`}
                      >
                        <div className="flex">
                          {/* Left color bar */}
                          <div className={`w-1.5 ${statusConfig.bgFull}`} />
                          
                          <div className="flex-1 p-4">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className={`font-semibold text-white ${isCompleted ? 'line-through' : ''}`}>
                                    {duty.duty_name || duty.roster_type_name || 'Assigned Duty'}
                                  </h4>
                                </div>
                                {duty.roster_type_name && duty.duty_name && (
                                  <p className="text-xs text-slate-400 mt-0.5">
                                    {duty.roster_type_name}
                                  </p>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 ${statusConfig.color}`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {statusConfig.label}
                                </span>
                              </div>
                            </div>
                            
                            {/* Details Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                              {(duty.time_slot_name || duty.start_time) && (
                                <div className="flex items-center gap-2 text-slate-300">
                                  <Clock className="w-4 h-4 text-slate-500" />
                                  <span>
                                    {duty.time_slot_name || `${formatTime(duty.start_time)} - ${formatTime(duty.end_time)}`}
                                  </span>
                                </div>
                              )}
                              
                              {duty.location_name && (
                                <div className="flex items-center gap-2 text-slate-300">
                                  <MapPin className="w-4 h-4 text-slate-500" />
                                  <span>{duty.location_name}</span>
                                </div>
                              )}
                              
                              {duty.role_name && (
                                <div className="flex items-center gap-2 text-slate-300">
                                  <Shield className="w-4 h-4 text-slate-500" />
                                  <span>{duty.role_name}</span>
                                </div>
                              )}
                              
                              {duty.supervisor_name && (
                                <div className="flex items-center gap-2 text-slate-300">
                                  <User className="w-4 h-4 text-slate-500" />
                                  <span>Supervisor: {duty.supervisor_name}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Instructions */}
                            {duty.instructions && (
                              <div className="mb-3 p-2 rounded-lg bg-slate-700/30">
                                <p className="text-xs text-slate-400">
                                  <span className="font-medium text-slate-300">Instructions:</span> {duty.instructions}
                                </p>
                              </div>
                            )}
                            
                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                              <div className="flex items-center gap-2">
                                {isPending && (
                                  <span className="text-xs text-amber-400 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Awaiting approval from admin
                                  </span>
                                )}
                                {isPendingAcceptance && (
                                  <span className="text-xs text-orange-400 flex items-center gap-1">
                                    <Bell className="w-3 h-3" />
                                    Please accept or decline this duty
                                  </span>
                                )}
                                {isDeclined && (
                                  <span className="text-xs text-red-400 flex items-center gap-1">
                                    <X className="w-3 h-3" />
                                    You declined this duty
                                  </span>
                                )}
                                {isCompleted && duty.completed_at && (
                                  <span className="text-xs text-slate-500">
                                    Completed {new Date(duty.completed_at).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              
                              {/* Accept/Decline buttons for pending acceptance */}
                              {isPendingAcceptance && (
                                <div className="flex items-center gap-2">
                                  {isMultiDay(duty) ? (
                                    <>
                                      <button
                                        onClick={() => toggleDutyDates(duty.id)}
                                        className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors"
                                      >
                                        <CalendarDays className="w-3 h-3" />
                                        {expandedDutyId === duty.id ? 'Hide Dates' : 'View Dates'}
                                      </button>
                                      <button
                                        onClick={() => handleAcceptAll(duty.id)}
                                        disabled={actionLoading === duty.id}
                                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                      >
                                        {actionLoading === duty.id ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <CheckCircle className="w-3 h-3" />
                                        )}
                                        Accept All
                                      </button>
                                      <button
                                        onClick={() => openDeclineModal(duty.id)}
                                        disabled={actionLoading === duty.id}
                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                      >
                                        <X className="w-3 h-3" />
                                        Decline All
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleAccept(duty.id)}
                                        disabled={actionLoading === duty.id}
                                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                      >
                                        {actionLoading === duty.id ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <CheckCircle className="w-3 h-3" />
                                        )}
                                        Accept
                                      </button>
                                      <button
                                        onClick={() => openDeclineModal(duty.id)}
                                        disabled={actionLoading === duty.id}
                                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                      >
                                        <X className="w-3 h-3" />
                                        Decline
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}

                              {canComplete && (
                                <button
                                  onClick={() => handleMarkComplete(duty.id)}
                                  disabled={actionLoading === duty.id}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                                >
                                  {actionLoading === duty.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-3 h-3" />
                                  )}
                                  Mark Complete
                                </button>
                              )}
                            </div>
                            
                            {/* Expanded Per-Day View for Multi-Day Duties */}
                            {expandedDutyId === duty.id && (
                              <div className="mt-3 pt-3 border-t border-slate-700/50">
                                <h4 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                                  <CalendarDays className="w-4 h-4" />
                                  Individual Dates
                                </h4>
                                {loadingDates === duty.id ? (
                                  <div className="flex items-center justify-center py-4">
                                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                                  </div>
                                ) : dutyDates[duty.id]?.length > 0 ? (
                                  <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {dutyDates[duty.id].map((dateRecord) => {
                                      // Handle date which might come as ISO string, Date object, or YYYY-MM-DD
                                      let dateObj;
                                      if (typeof dateRecord.date === 'string') {
                                        // If it's a string like "2026-01-12" or "2026-01-12T00:00:00.000Z"
                                        const dateOnly = dateRecord.date.split('T')[0];
                                        dateObj = new Date(dateOnly + 'T12:00:00');
                                      } else if (dateRecord.date instanceof Date) {
                                        dateObj = dateRecord.date;
                                      } else {
                                        dateObj = new Date(dateRecord.date);
                                      }
                                      const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                                      const isDatePending = dateRecord.status === 'pending_acceptance';
                                      const isDateAccepted = dateRecord.status === 'accepted';
                                      const isDateDeclined = dateRecord.status === 'declined';
                                      const isDateCompleted = dateRecord.status === 'completed';
                                      
                                      return (
                                        <div 
                                          key={dateRecord.id} 
                                          className={`flex items-center justify-between p-2 rounded-lg ${
                                            isDateCompleted ? 'bg-slate-700/30' :
                                            isDateDeclined ? 'bg-red-900/20' :
                                            isDateAccepted ? 'bg-green-900/20' :
                                            'bg-slate-700/50'
                                          }`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <span className={`text-sm font-medium ${
                                              isDateCompleted ? 'text-slate-500' :
                                              isDateDeclined ? 'text-red-400' :
                                              isDateAccepted ? 'text-green-400' :
                                              'text-white'
                                            }`}>
                                              {dateStr}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                              isDateCompleted ? 'bg-slate-600 text-slate-300' :
                                              isDateDeclined ? 'bg-red-600/30 text-red-400' :
                                              isDateAccepted ? 'bg-green-600/30 text-green-400' :
                                              'bg-orange-600/30 text-orange-400'
                                            }`}>
                                              {isDateCompleted ? 'Completed' :
                                               isDateDeclined ? 'Declined' :
                                               isDateAccepted ? 'Accepted' : 'Pending'}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            {isDatePending && (
                                              <>
                                                <button
                                                  onClick={() => handleAcceptDate(duty.id, dateRecord.id)}
                                                  disabled={actionLoading === `${duty.id}-${dateRecord.id}`}
                                                  className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
                                                  title="Accept this date"
                                                >
                                                  {actionLoading === `${duty.id}-${dateRecord.id}` ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                  ) : (
                                                    <Check className="w-3 h-3" />
                                                  )}
                                                </button>
                                                <button
                                                  onClick={() => openDeclineModal(duty.id, dateRecord.id)}
                                                  disabled={actionLoading === `${duty.id}-${dateRecord.id}`}
                                                  className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50"
                                                  title="Decline this date"
                                                >
                                                  <X className="w-3 h-3" />
                                                </button>
                                              </>
                                            )}
                                            {isDateAccepted && canMarkComplete && (
                                              <button
                                                onClick={() => handleCompleteDate(duty.id, dateRecord.id)}
                                                disabled={actionLoading === `${duty.id}-${dateRecord.id}`}
                                                className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
                                                title="Mark as complete"
                                              >
                                                {actionLoading === `${duty.id}-${dateRecord.id}` ? (
                                                  <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                  <CheckCircle className="w-3 h-3" />
                                                )}
                                              </button>
                                            )}
                                            {isDateDeclined && dateRecord.decline_reason && (
                                              <span className="text-xs text-red-400 max-w-[150px] truncate" title={dateRecord.decline_reason}>
                                                {dateRecord.decline_reason}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-500 text-center py-2">No date records found</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Supervised Students Section (for teachers) */}
      {showSupervised && supervisedStudents.length > 0 && (
        <div className="border-t border-slate-700/50 p-4">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-emerald-400" />
            Students Under Your Supervision Today
          </h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {supervisedStudents.map((student, idx) => (
              <div 
                key={student.id || idx}
                className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">
                      {student.first_name} {student.last_name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {student.duty_name} • {student.time_slot_name}
                    </p>
                    {student.location_name && (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {student.location_name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <X className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {declineMode === 'single' ? 'Decline This Date' : 'Decline All Dates'}
                </h3>
                <p className="text-sm text-slate-400">
                  {declineMode === 'single' 
                    ? 'You are declining only the selected date'
                    : 'You are declining all dates for this duty'
                  }
                </p>
              </div>
            </div>
            
            <textarea
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Enter your reason for declining..."
              className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:border-red-500 focus:outline-none resize-none"
              rows={4}
            />
            
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => {
                  setShowDeclineModal(false);
                  setDecliningDutyId(null);
                  setDecliningDateId(null);
                  setDeclineReason('');
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDecline}
                disabled={!declineReason.trim() || actionLoading}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                {declineMode === 'single' ? 'Decline Date' : 'Decline All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDuties;
