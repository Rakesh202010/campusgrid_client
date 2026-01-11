import { useState, useEffect } from 'react';
import {
  Calendar, Clock, MapPin, Users, Shield, Briefcase, Plus, Edit2, Trash2, X,
  Loader2, Save, ChevronDown, ChevronRight, ChevronLeft, AlertCircle, CheckCircle, Settings,
  Building2, UserCheck, GraduationCap, Search, Filter, RefreshCw, CalendarDays
} from 'lucide-react';
import { roster, academicSessions, teachers, people, students } from '../services/api';
import { toast } from '../utils/toast';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const RISK_LEVELS = [
  { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700' },
  { value: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-700' }
];

const ASSIGNEE_TYPES = [
  { value: 'teacher', label: 'Teacher', icon: UserCheck },
  { value: 'staff', label: 'Staff', icon: Briefcase },
  { value: 'student', label: 'Student', icon: GraduationCap }
];

const LOCATION_TYPES = [
  { value: 'gate', label: 'Gate' },
  { value: 'ground', label: 'Ground' },
  { value: 'building', label: 'Building' },
  { value: 'classroom', label: 'Classroom' },
  { value: 'corridor', label: 'Corridor' },
  { value: 'office', label: 'Office' },
  { value: 'lab', label: 'Lab' },
  { value: 'library', label: 'Library' },
  { value: 'cafeteria', label: 'Cafeteria' },
  { value: 'other', label: 'Other' }
];

const RosterConfiguration = () => {
  const [activeTab, setActiveTab] = useState('assignments');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Master data
  const [rosterTypes, setRosterTypes] = useState([]);
  const [dutyCategories, setDutyCategories] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [locations, setLocations] = useState([]);
  const [dutyRoles, setDutyRoles] = useState([]);
  const [duties, setDuties] = useState([]);
  const [config, setConfig] = useState({});
  
  // Assignment data
  const [assignments, setAssignments] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [academicSession, setAcademicSession] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignmentViewMode, setAssignmentViewMode] = useState('calendar');
  const [assignmentFilters, setAssignmentFilters] = useState({ assignee_type: '', duty_id: '', status: '' });
  
  // Modals
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  
  // Assignment Modal
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [assignmentFormData, setAssignmentFormData] = useState({
    roster_type_id: '',
    duty_id: '',
    assignee_type: 'teacher',
    assignee_id: '',
    supervisor_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    time_slot_id: '',
    location_id: '',
    role_id: '',
    notes: '',
    require_acceptance: true
  });
  
  // Search/Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  
  // Per-date status modal for admin
  const [showDatesModal, setShowDatesModal] = useState(false);
  const [selectedAssignmentForDates, setSelectedAssignmentForDates] = useState(null);
  const [assignmentDates, setAssignmentDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (academicSession) {
      fetchAssignments();
    }
  }, [currentDate, academicSession, assignmentFilters]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [typesRes, categoriesRes, slotsRes, locsRes, rolesRes, dutiesRes, configRes, sessionRes, teachersRes, staffRes, studentsRes] = await Promise.all([
        roster.getRosterTypes(),
        roster.getDutyCategories(),
        roster.getTimeSlots(),
        roster.getLocations(),
        roster.getDutyRoles(),
        roster.getDuties(),
        roster.getConfig(),
        academicSessions.getCurrent(),
        teachers.getAll(),
        people.getStaff(),
        students.getAll({ status: 'active' })
      ]);
      
      setRosterTypes(typesRes.data || []);
      setDutyCategories(categoriesRes.data || []);
      setTimeSlots(slotsRes.data || []);
      setLocations(locsRes.data || []);
      setDutyRoles(rolesRes.data || []);
      setDuties(dutiesRes.data || []);
      setConfig(configRes.data || {});
      setTeachersList(teachersRes.data || []);
      setStaffList(staffRes.data || []);
      setStudentsList(studentsRes.data || []);
      
      if (sessionRes.success && sessionRes.data) {
        setAcademicSession(sessionRes.data);
      } else {
        console.warn('No academic session found:', sessionRes);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load roster configuration');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      // Helper to format date as YYYY-MM-DD without timezone conversion
      const formatLocalDate = (d) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const params = {
        start_date: formatLocalDate(startOfMonth),
        end_date: formatLocalDate(endOfMonth),
        academic_session_id: academicSession?.id,
        ...assignmentFilters
      };
      
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      
      const result = await roster.getAssignments(params);
      setAssignments(result.data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const openAssignmentModal = (assignment = null, date = null) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setAssignmentFormData({
        roster_type_id: assignment.roster_type_id || '',
        duty_id: assignment.duty_id || '',
        assignee_type: assignment.assignee_type || 'teacher',
        assignee_id: assignment.assignee_id || '',
        supervisor_id: assignment.supervisor_id || '',
        start_date: assignment.start_date?.split('T')[0] || selectedDate,
        end_date: assignment.end_date?.split('T')[0] || '',
        time_slot_id: assignment.time_slot_id || '',
        location_id: assignment.location_id || '',
        role_id: assignment.role_id || '',
        notes: assignment.notes || '',
        require_acceptance: assignment.requires_approval ?? false
      });
    } else {
      setEditingAssignment(null);
      setAssignmentFormData({
        roster_type_id: '',
        duty_id: '',
        assignee_type: 'teacher',
        assignee_id: '',
        supervisor_id: '',
        start_date: date || selectedDate,
        end_date: '',
        time_slot_id: '',
        location_id: '',
        role_id: '',
        notes: '',
        require_acceptance: true
      });
    }
    setShowAssignmentModal(true);
  };

  const handleSaveAssignment = async () => {
    if (!assignmentFormData.duty_id || !assignmentFormData.assignee_id) {
      toast.error('Please select a duty and assignee');
      return;
    }
    
    if (!academicSession?.id) {
      toast.error('No academic session available. Please refresh the page.');
      return;
    }
    
    setSaving(true);
    try {
      const payload = { 
        ...assignmentFormData, 
        academic_session_id: academicSession.id 
      };
      
      // If editing a declined assignment with a new assignee, reset to pending
      if (editingAssignment && 
          editingAssignment.status === 'declined' && 
          editingAssignment.assignee_id !== assignmentFormData.assignee_id) {
        // Clear old decline notes when re-assigning
        payload.notes = assignmentFormData.notes?.replace(/\[DECLINED:[^\]]*\]\s*/g, '').trim() || '';
      }
      
      console.log('Saving assignment with payload:', payload);
      let result;
      if (editingAssignment) {
        result = await roster.updateAssignment(editingAssignment.id, payload);
      } else {
        result = await roster.createAssignment(payload);
      }
      
      if (result?.success) {
        toast.success(`Assignment ${editingAssignment ? 'updated' : 'created'} successfully`);
        fetchAssignments();
        setShowAssignmentModal(false);
        setEditingAssignment(null);
      } else {
        toast.error(result?.message || 'Operation failed');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssignment = async (id) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    try {
      const result = await roster.deleteAssignment(id);
      if (result?.success) {
        toast.success('Assignment deleted');
        fetchAssignments();
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // View per-date status for an assignment
  const viewAssignmentDates = async (assignment) => {
    setSelectedAssignmentForDates(assignment);
    setShowDatesModal(true);
    setLoadingDates(true);
    try {
      const result = await roster.getAssignmentDates(assignment.id);
      if (result.success) {
        setAssignmentDates(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching assignment dates:', error);
      toast.error('Failed to load date details');
    } finally {
      setLoadingDates(false);
    }
  };

  // Check if assignment is multi-day
  const isMultiDayAssignment = (assignment) => {
    if (!assignment.start_date || !assignment.end_date) return false;
    const start = new Date(assignment.start_date);
    const end = new Date(assignment.end_date);
    return end > start;
  };

  const getAssigneeOptions = () => {
    switch (assignmentFormData.assignee_type) {
      case 'teacher':
        return teachersList.map(t => ({ id: t.id, name: t.fullName || `${t.firstName || ''} ${t.lastName || ''}`.trim() }));
      case 'staff':
        return staffList.map(s => ({ id: s.id, name: s.fullName || `${s.firstName || ''} ${s.lastName || ''}`.trim() }));
      case 'student':
        return studentsList.map(s => ({ id: s.id, name: s.fullName || `${s.firstName || ''} ${s.lastName || ''}`.trim() }));
      default:
        return [];
    }
  };

  const getAssignmentsForDate = (date) => {
    // Use local date string to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return assignments.filter(a => {
      const start = a.start_date?.split('T')[0];
      const end = a.end_date?.split('T')[0] || start;
      return dateStr >= start && dateStr <= end;
    }).map(a => {
      // For multi-day assignments with per-date tracking, get the status for this specific date
      if (a.dates && a.dates.length > 0) {
        const dateRecord = a.dates.find(d => d.date?.split('T')[0] === dateStr);
        if (dateRecord) {
          // Return assignment with the specific date's status
          return {
            ...a,
            date_status: dateRecord.status,
            date_decline_reason: dateRecord.decline_reason,
            date_accepted_at: dateRecord.accepted_at
          };
        }
      }
      return a;
    });
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    setEditingItem(item);
    
    if (item) {
      // When editing a duty, the backend already parses allowed_assignee_types correctly
      if (type === 'duty') {
        // Backend now returns allowed_assignee_types as a proper array
        // Just ensure it's valid and has at least one item
        let assigneeTypes = item.allowed_assignee_types;
        console.log('[DEBUG FE] allowed_assignee_types from API:', assigneeTypes);
        
        if (!assigneeTypes || !Array.isArray(assigneeTypes) || assigneeTypes.length === 0) {
          assigneeTypes = ['teacher', 'staff'];
        }
        
        console.log('[DEBUG FE] Final allowed_assignee_types:', assigneeTypes);
        
        setFormData({ 
          ...item, 
          allowed_assignee_types: assigneeTypes,
          category_id: item.category_id || '',
          roster_type_id: item.roster_type_id || '',
          default_time_slot_id: item.default_time_slot_id || '',
          default_location_id: item.default_location_id || ''
        });
      } else {
        setFormData({ ...item });
      }
    } else {
      // Default form data based on type
      switch (type) {
        case 'duty':
          setFormData({
            code: '',
            name: '',
            category_id: '',
            roster_type_id: '',
            allowed_assignee_types: ['teacher', 'staff'],
            risk_level: 'low',
            supervisor_required: false,
            default_time_slot_id: '',
            default_location_id: '',
            min_assignees: 1,
            max_assignees: null,
            max_per_week_student: 2,
            instructions: ''
          });
          break;
        case 'category':
          setFormData({
            code: '',
            name: '',
            description: '',
            color: '#6B7280',
            display_order: 0
          });
          break;
        case 'timeSlot':
          setFormData({
            code: '',
            name: '',
            start_time: '08:00',
            end_time: '09:00',
            applies_to_days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
            display_order: 0
          });
          break;
        case 'location':
          setFormData({
            code: '',
            name: '',
            type: 'other',
            building: '',
            floor: '',
            capacity: null,
            description: ''
          });
          break;
        case 'role':
          setFormData({
            code: '',
            name: '',
            description: '',
            priority: 0
          });
          break;
        default:
          setFormData({});
      }
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
    setEditingItem(null);
    setFormData({});
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let result;
      
      switch (modalType) {
        case 'duty':
          if (editingItem) {
            result = await roster.updateDuty(editingItem.id, formData);
          } else {
            result = await roster.createDuty(formData);
          }
          break;
        case 'timeSlot':
          if (editingItem) {
            result = await roster.updateTimeSlot(editingItem.id, formData);
          } else {
            result = await roster.createTimeSlot(formData);
          }
          break;
        case 'location':
          if (editingItem) {
            result = await roster.updateLocation(editingItem.id, formData);
          } else {
            result = await roster.createLocation(formData);
          }
          break;
        case 'role':
          if (editingItem) {
            result = await roster.updateDutyRole(editingItem.id, formData);
          } else {
            result = await roster.createDutyRole(formData);
          }
          break;
        case 'category':
          if (editingItem) {
            result = await roster.updateDutyCategory(editingItem.id, formData);
          } else {
            result = await roster.createDutyCategory(formData);
          }
          break;
      }
      
      if (result?.success) {
        toast.success(`${editingItem ? 'Updated' : 'Created'} successfully`);
        fetchAllData();
        closeModal();
      } else {
        toast.error(result?.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      let result;
      switch (type) {
        case 'duty':
          result = await roster.deleteDuty(id);
          break;
        case 'timeSlot':
          result = await roster.deleteTimeSlot(id);
          break;
        case 'location':
          result = await roster.deleteLocation(id);
          break;
        case 'role':
          result = await roster.deleteDutyRole(id);
          break;
        case 'category':
          result = await roster.deleteDutyCategory(id);
          break;
      }
      
      if (result?.success) {
        toast.success('Deleted successfully');
        fetchAllData();
      } else {
        toast.error(result?.message || 'Delete failed');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const handleConfigSave = async () => {
    setSaving(true);
    try {
      const result = await roster.updateConfig(config);
      if (result?.success) {
        toast.success('Configuration saved');
        setConfig(result.data);
      } else {
        toast.error('Failed to save configuration');
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleAssigneeType = (type) => {
    const current = formData.allowed_assignee_types || [];
    if (current.includes(type)) {
      setFormData({
        ...formData,
        allowed_assignee_types: current.filter(t => t !== type)
      });
    } else {
      setFormData({
        ...formData,
        allowed_assignee_types: [...current, type]
      });
    }
  };

  const filteredDuties = duties.filter(duty => {
    const matchesSearch = !searchTerm || 
                         (duty.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (duty.code || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || duty.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const selectedDuty = duties.find(d => d.id === assignmentFormData.duty_id);

  // Helper to get category color classes from hex color
  const getCategoryColorClass = (hexColor) => {
    if (!hexColor) return 'bg-gray-100 text-gray-700';
    // Use inline style for dynamic colors
    return '';
  };

  const tabs = [
    { id: 'assignments', label: 'Roster Assignments', icon: CalendarDays, count: assignments.length },
    { id: 'duties', label: 'Duties/Tasks', icon: Briefcase, count: duties.length },
    { id: 'categories', label: 'Categories', icon: Filter, count: dutyCategories.length },
    { id: 'timeSlots', label: 'Time Slots', icon: Clock, count: timeSlots.length },
    { id: 'locations', label: 'Locations', icon: MapPin, count: locations.length },
    { id: 'roles', label: 'Duty Roles', icon: Shield, count: dutyRoles.length },
    { id: 'config', label: 'Configuration', icon: Settings }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Calendar className="w-8 h-8" />
              Roster & Duties Configuration
            </h1>
            <p className="text-white/80 mt-1">Configure duties, time slots, locations, and roles for roster management</p>
          </div>
          <button
            onClick={fetchAllData}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <div className="space-y-4">
              {/* View Controls & Filters */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAssignmentViewMode('calendar')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      assignmentViewMode === 'calendar' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Calendar
                  </button>
                  <button
                    onClick={() => setAssignmentViewMode('list')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      assignmentViewMode === 'list' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setAssignmentViewMode('daily')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      assignmentViewMode === 'daily' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Daily Sheet
                  </button>
                </div>
                
                <div className="flex items-center gap-3">
                  <select
                    value={assignmentFilters.assignee_type}
                    onChange={(e) => setAssignmentFilters({ ...assignmentFilters, assignee_type: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">All Assignees</option>
                    <option value="teacher">Teachers</option>
                    <option value="staff">Staff</option>
                    <option value="student">Students</option>
                  </select>
                  <select
                    value={assignmentFilters.duty_id}
                    onChange={(e) => setAssignmentFilters({ ...assignmentFilters, duty_id: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">All Duties</option>
                    {duties.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  <select
                    value={assignmentFilters.status}
                    onChange={(e) => setAssignmentFilters({ ...assignmentFilters, status: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">All Statuses</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="active">Active</option>
                    <option value="pending_acceptance">Pending Acceptance</option>
                    <option value="declined">Declined</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button
                    onClick={() => openAssignmentModal()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    New Assignment
                  </button>
                </div>
              </div>

              {/* Calendar View */}
              {assignmentViewMode === 'calendar' && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                    <button onClick={() => navigateMonth(-1)} className="p-2 hover:bg-gray-200 rounded-lg">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={() => navigateMonth(1)} className="p-2 hover:bg-gray-200 rounded-lg">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Calendar Legend */}
                  <div className="flex items-center gap-4 px-4 py-2 bg-white border-b border-gray-100 text-xs">
                    <span className="text-gray-500 font-medium">Status:</span>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: '#DBEAFE', border: '1px solid #BFDBFE' }}></div>
                      <span className="text-gray-600">Accepted</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A' }}></div>
                      <span className="text-gray-600">Pending</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: '#FEE2E2', border: '1px solid #FECACA' }}></div>
                      <span className="text-gray-600">Declined</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded" style={{ backgroundColor: '#D1FAE5', border: '1px solid #A7F3D0' }}></div>
                      <span className="text-gray-600">Completed</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-7 border-b border-gray-200">
                    {DAYS.map(day => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-gray-600 bg-gray-50">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7">
                    {getDaysInMonth().map((date, idx) => {
                      if (!date) {
                        return <div key={idx} className="h-24 border-b border-r border-gray-100 bg-gray-50" />;
                      }
                      
                      const dateAssignments = getAssignmentsForDate(date);
                      const isToday = date.toDateString() === new Date().toDateString();
                      const isSelected = date.toISOString().split('T')[0] === selectedDate;
                      
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setSelectedDate(date.toISOString().split('T')[0]);
                            openAssignmentModal(null, date.toISOString().split('T')[0]);
                          }}
                          className={`h-24 border-b border-r border-gray-100 p-1 cursor-pointer hover:bg-indigo-50 transition-colors ${
                            isToday ? 'bg-indigo-50' : ''
                          } ${isSelected ? 'ring-2 ring-indigo-500 ring-inset' : ''}`}
                        >
                          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-indigo-600' : 'text-gray-700'}`}>
                            {date.getDate()}
                          </div>
                          <div className="space-y-0.5 overflow-hidden max-h-16">
                            {dateAssignments.slice(0, 2).map(assignment => {
                              // Use per-date status if available (for multi-day assignments), otherwise use assignment status
                              const effectiveStatus = assignment.date_status || assignment.status;
                              
                              // Get status-specific styling with more detailed statuses
                              let statusStyles = { backgroundColor: assignment.roster_type_color || '#E5E7EB', color: '#374151' };
                              let statusLabel = '';
                              let StatusIcon = null;
                              
                              if (effectiveStatus === 'declined') {
                                statusStyles = { backgroundColor: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA' };
                                statusLabel = ' (DECLINED)';
                                StatusIcon = AlertCircle;
                              } else if (effectiveStatus === 'pending_acceptance') {
                                statusStyles = { backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' };
                                statusLabel = ' (PENDING)';
                                StatusIcon = Clock;
                              } else if (effectiveStatus === 'accepted' || effectiveStatus === 'scheduled') {
                                statusStyles = { backgroundColor: '#DBEAFE', color: '#1E40AF', border: '1px solid #BFDBFE' };
                                statusLabel = ' (ACCEPTED)';
                                StatusIcon = CheckCircle;
                              } else if (effectiveStatus === 'completed') {
                                statusStyles = { backgroundColor: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' };
                                statusLabel = ' (COMPLETED)';
                                StatusIcon = CheckCircle;
                              } else if (effectiveStatus === 'active') {
                                statusStyles = { backgroundColor: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' };
                                statusLabel = '';
                                StatusIcon = null;
                              }
                              
                              return (
                                <div
                                  key={assignment.id}
                                  onClick={(e) => { e.stopPropagation(); openAssignmentModal(assignment); }}
                                  className="text-xs px-1.5 py-0.5 rounded truncate flex items-center gap-1"
                                  style={statusStyles}
                                  title={`${assignment.duty_name || 'Duty'} - ${assignment.assignee_name || 'Unassigned'}${statusLabel}${assignment.date_decline_reason ? ` Reason: ${assignment.date_decline_reason}` : ''}`}
                                >
                                  {StatusIcon && <StatusIcon className="w-2.5 h-2.5 flex-shrink-0" />}
                                  {!StatusIcon && (
                                    <>
                                      {assignment.assignee_type === 'teacher' && <UserCheck className="w-2.5 h-2.5 flex-shrink-0" />}
                                      {assignment.assignee_type === 'staff' && <Briefcase className="w-2.5 h-2.5 flex-shrink-0" />}
                                      {assignment.assignee_type === 'student' && <GraduationCap className="w-2.5 h-2.5 flex-shrink-0" />}
                                    </>
                                  )}
                                  <span className="truncate font-medium">{assignment.assignee_name?.split(' ')[0] || assignment.duty_name}</span>
                                </div>
                              );
                            })}
                            {dateAssignments.length > 2 && (
                              <div className="text-xs text-gray-500 px-1">+{dateAssignments.length - 2} more</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* List View */}
              {assignmentViewMode === 'list' && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Duty</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Assignee</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Time Slot</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Location</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {assignments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No duty assignments found</p>
                          </td>
                        </tr>
                      ) : (
                        assignments.map(assignment => (
                          <tr key={assignment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{assignment.duty_name || assignment.roster_type_name}</div>
                              <div className="text-xs text-gray-500">{assignment.roster_type_name}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                  assignment.assignee_type === 'teacher' ? 'bg-blue-500' :
                                  assignment.assignee_type === 'staff' ? 'bg-purple-500' :
                                  'bg-green-500'
                                }`}>
                                  {assignment.assignee_name ? assignment.assignee_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{assignment.assignee_name || 'Unassigned'}</div>
                                  <div className="text-xs text-gray-500 capitalize flex items-center gap-1">
                                    {assignment.assignee_type === 'teacher' && <UserCheck className="w-3 h-3" />}
                                    {assignment.assignee_type === 'staff' && <Briefcase className="w-3 h-3" />}
                                    {assignment.assignee_type === 'student' && <GraduationCap className="w-3 h-3" />}
                                    {assignment.assignee_type}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-700">{assignment.time_slot_name || '-'}</td>
                            <td className="px-4 py-3 text-gray-700">{assignment.location_name || '-'}</td>
                            <td className="px-4 py-3 text-gray-900">
                              {new Date(assignment.start_date + 'T00:00:00').toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className={`px-2 py-1 text-xs rounded-full inline-block w-fit ${
                                  assignment.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                  assignment.status === 'active' ? 'bg-green-100 text-green-700' :
                                  assignment.status === 'pending_acceptance' ? 'bg-amber-100 text-amber-700' :
                                  assignment.status === 'declined' ? 'bg-red-100 text-red-700' :
                                  assignment.status === 'completed' ? 'bg-slate-100 text-slate-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {assignment.status === 'pending_acceptance' ? 'Pending Acceptance' : 
                                   assignment.status === 'declined' ? 'Declined' : assignment.status}
                                </span>
                                {assignment.status === 'declined' && assignment.notes?.includes('[DECLINED:') && (
                                  <span className="text-xs text-red-600 mt-1 max-w-[200px] truncate" title={assignment.notes?.match(/\[DECLINED: ([^\]]+)\]/)?.[1]}>
                                    Reason: {assignment.notes?.match(/\[DECLINED: ([^\]]+)\]/)?.[1] || 'Not provided'}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {isMultiDayAssignment(assignment) && (
                                  <button 
                                    onClick={() => viewAssignmentDates(assignment)} 
                                    className="px-2 py-1 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1"
                                    title="View per-date acceptance status"
                                  >
                                    <CalendarDays className="w-3 h-3" />
                                    Dates
                                  </button>
                                )}
                                {assignment.status === 'declined' && (
                                  <button 
                                    onClick={() => openAssignmentModal(assignment)} 
                                    className="px-2 py-1 text-xs text-white bg-amber-600 hover:bg-amber-700 rounded-lg flex items-center gap-1"
                                    title="Re-assign to another person"
                                  >
                                    <Users className="w-3 h-3" />
                                    Re-assign
                                  </button>
                                )}
                                <button onClick={() => openAssignmentModal(assignment)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteAssignment(assignment.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg">
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
              )}

              {/* Daily Sheet View */}
              {assignmentViewMode === 'daily' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <span className="text-gray-600">
                      {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  
                  {timeSlots.map(slot => {
                    const slotAssignments = assignments.filter(a => {
                      const start = a.start_date?.split('T')[0];
                      const end = a.end_date?.split('T')[0] || start;
                      return selectedDate >= start && selectedDate <= end && a.time_slot_id === slot.id;
                    });
                    
                    return (
                      <div key={slot.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-gray-500" />
                            <span className="font-semibold text-gray-900">{slot.name}</span>
                            <span className="text-sm text-gray-500">
                              {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">{slotAssignments.length} assignments</span>
                        </div>
                        
                        {slotAssignments.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">No assignments</div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {slotAssignments.map(assignment => (
                              <div key={assignment.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center gap-4">
                                  <div className="w-1.5 h-14 rounded-full" style={{ backgroundColor: assignment.roster_type_color || '#6B7280' }} />
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                                    assignment.assignee_type === 'teacher' ? 'bg-blue-500' :
                                    assignment.assignee_type === 'staff' ? 'bg-purple-500' :
                                    'bg-green-500'
                                  }`}>
                                    {assignment.assignee_name ? assignment.assignee_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900">{assignment.assignee_name || 'Unassigned'}</div>
                                    <div className="text-sm text-gray-600">{assignment.duty_name || assignment.roster_type_name}</div>
                                    <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                                      {assignment.assignee_type === 'teacher' && <><UserCheck className="w-3 h-3" /> Teacher</>}
                                      {assignment.assignee_type === 'staff' && <><Briefcase className="w-3 h-3" /> Staff</>}
                                      {assignment.assignee_type === 'student' && <><GraduationCap className="w-3 h-3" /> Student</>}
                                      {assignment.role_name && <span className="ml-2">• {assignment.role_name}</span>}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  {assignment.location_name && (
                                    <span className="text-sm text-gray-500 flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                                      <MapPin className="w-4 h-4" />
                                      {assignment.location_name}
                                    </span>
                                  )}
                                  <div className="flex flex-col items-end">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                      assignment.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                      assignment.status === 'active' ? 'bg-green-100 text-green-700' :
                                      assignment.status === 'pending_acceptance' ? 'bg-amber-100 text-amber-700' :
                                      assignment.status === 'declined' ? 'bg-red-100 text-red-700' :
                                      assignment.status === 'completed' ? 'bg-slate-100 text-slate-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}>
                                      {assignment.status === 'pending_acceptance' ? 'Pending' : 
                                       assignment.status === 'declined' ? 'Declined' : assignment.status}
                                    </span>
                                    {assignment.status === 'declined' && assignment.notes?.includes('[DECLINED:') && (
                                      <span className="text-xs text-red-500 mt-1" title={assignment.notes?.match(/\[DECLINED: ([^\]]+)\]/)?.[1]}>
                                        {assignment.notes?.match(/\[DECLINED: ([^\]]+)\]/)?.[1]?.slice(0, 30) || 'No reason'}...
                                      </span>
                                    )}
                                  </div>
                                  {assignment.status === 'declined' && (
                                    <button 
                                      onClick={() => openAssignmentModal(assignment)} 
                                      className="px-2 py-1 text-xs text-white bg-amber-600 hover:bg-amber-700 rounded-lg flex items-center gap-1"
                                    >
                                      <Users className="w-3 h-3" />
                                      Re-assign
                                    </button>
                                  )}
                                  <button onClick={() => openAssignmentModal(assignment)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Duties Tab */}
          {activeTab === 'duties' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search duties..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Categories</option>
                    {dutyCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => openModal('duty')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Duty
                </button>
              </div>

              <div className="grid gap-4">
                {filteredDuties.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No duties found</p>
                  </div>
                ) : (
                  filteredDuties.map(duty => {
                    const riskLevel = RISK_LEVELS.find(r => r.value === duty.risk_level);
                    return (
                      <div
                        key={duty.id}
                        className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-gray-900">{duty.name || 'Unnamed Duty'}</h3>
                              {duty.code && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                                  {duty.code}
                                </span>
                              )}
                              {duty.category_name && (
                                <span 
                                  className="px-2 py-0.5 text-xs rounded-full"
                                  style={{ backgroundColor: `${duty.category_color}20`, color: duty.category_color }}
                                >
                                  {duty.category_name}
                                </span>
                              )}
                              {riskLevel && (
                                <span className={`px-2 py-0.5 text-xs rounded-full ${riskLevel.color}`}>
                                  {riskLevel.label} Risk
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              {duty.roster_type_name && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {duty.roster_type_name}
                                </span>
                              )}
                              {duty.default_time_slot_name && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {duty.default_time_slot_name}
                                </span>
                              )}
                              {duty.default_location_name && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {duty.default_location_name}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {duty.min_assignees || 1}{duty.max_assignees ? `-${duty.max_assignees}` : '+'} assignees
                              </span>
                            </div>
                            {duty.allowed_assignee_types && Array.isArray(duty.allowed_assignee_types) && duty.allowed_assignee_types.length > 0 && (
                              <div className="flex items-center gap-2 mt-2">
                                {duty.allowed_assignee_types.map((type, idx) => {
                                  const at = ASSIGNEE_TYPES.find(a => a.value === type);
                                  const Icon = at?.icon || Users;
                                  return (
                                    <span key={type || idx} className="px-2 py-1 text-xs bg-gray-100 rounded-lg flex items-center gap-1">
                                      <Icon className="w-3 h-3" />
                                      {at?.label || type}
                                    </span>
                                  );
                                })}
                                {duty.supervisor_required && (
                                  <span className="px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded-lg">
                                    Supervisor Required
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openModal('duty', duty)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete('duty', duty.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => openModal('category')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Category
                </button>
              </div>
              
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {dutyCategories.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <Filter className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No duty categories configured</p>
                  </div>
                ) : (
                  dutyCategories.map(cat => (
                    <div
                      key={cat.id}
                      className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                          >
                            <Filter className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                            <p className="text-sm text-gray-500">{cat.code}</p>
                            {cat.description && (
                              <p className="text-xs text-gray-400 mt-1">{cat.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openModal('category', cat)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete('category', cat.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <span 
                          className="px-2 py-1 text-xs rounded-full"
                          style={{ backgroundColor: cat.color, color: '#fff' }}
                        >
                          {cat.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          Order: {cat.display_order || 0}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Time Slots Tab */}
          {activeTab === 'timeSlots' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => openModal('timeSlot')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Time Slot
                </button>
              </div>
              
              <div className="grid gap-3">
                {timeSlots.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No time slots configured</p>
                  </div>
                ) : (
                  timeSlots.map((slot, idx) => (
                    <div
                      key={slot.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                          {idx + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{slot.name}</h3>
                          <p className="text-sm text-gray-600">
                            {slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 text-xs bg-gray-100 rounded-lg text-gray-600">
                          {slot.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openModal('timeSlot', slot)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete('timeSlot', slot.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Locations Tab */}
          {activeTab === 'locations' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => openModal('location')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Location
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {locations.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No locations configured</p>
                  </div>
                ) : (
                  locations.map(loc => (
                    <div
                      key={loc.id}
                      className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">{loc.name}</h3>
                          <p className="text-sm text-gray-500">{loc.code}</p>
                          <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full capitalize">
                            {loc.type}
                          </span>
                          {loc.building && (
                            <p className="text-sm text-gray-600 mt-1">
                              {loc.building}{loc.floor && `, Floor ${loc.floor}`}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openModal('location', loc)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete('location', loc.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Duty Roles Tab */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => openModal('role')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Role
                </button>
              </div>
              
              <div className="grid gap-3">
                {dutyRoles.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No duty roles configured</p>
                  </div>
                ) : (
                  dutyRoles.map(role => (
                    <div
                      key={role.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{role.name}</h3>
                          <p className="text-sm text-gray-600">{role.description || role.code}</p>
                        </div>
                        <span className="px-2 py-0.5 text-xs bg-gray-100 rounded-lg text-gray-600">
                          Priority: {role.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openModal('role', role)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete('role', role.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Configuration Tab */}
          {activeTab === 'config' && (
            <div className="max-w-2xl space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900">Roster Configuration</h3>
                    <p className="text-sm text-blue-700">Configure validation rules and default behaviors for roster assignments.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Student Duty Rules</h3>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div>
                    <h4 className="font-medium text-gray-900">Max Duties Per Week</h4>
                    <p className="text-sm text-gray-600">Maximum number of duties a student can be assigned per week</p>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={config.student_max_duties_per_week || 3}
                    onChange={(e) => setConfig({ ...config, student_max_duties_per_week: parseInt(e.target.value) })}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div>
                    <h4 className="font-medium text-gray-900">Allow Overlap with Class Time</h4>
                    <p className="text-sm text-gray-600">Allow student duties during their class schedule</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.student_duties_overlap_class || false}
                      onChange={(e) => setConfig({ ...config, student_duties_overlap_class: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div>
                    <h4 className="font-medium text-gray-900">Require Approval for Student Duties</h4>
                    <p className="text-sm text-gray-600">Student duty assignments must be approved by class teacher</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.student_duties_require_approval !== false}
                      onChange={(e) => setConfig({ ...config, student_duties_require_approval: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <h3 className="font-semibold text-gray-900 mt-6">Approval Settings</h3>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div>
                    <h4 className="font-medium text-gray-900">High-Risk Duties Require Approval</h4>
                    <p className="text-sm text-gray-600">High-risk duty assignments must be approved by admin</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.high_risk_requires_approval !== false}
                      onChange={(e) => setConfig({ ...config, high_risk_requires_approval: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <h3 className="font-semibold text-gray-900 mt-6">Notifications</h3>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div>
                    <h4 className="font-medium text-gray-900">Notify Assignees</h4>
                    <p className="text-sm text-gray-600">Send notifications when duties are assigned</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.notify_assignees !== false}
                      onChange={(e) => setConfig({ ...config, notify_assignees: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div>
                    <h4 className="font-medium text-gray-900">Notify Supervisors</h4>
                    <p className="text-sm text-gray-600">Send notifications to supervisors for student duties</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.notify_supervisors !== false}
                      onChange={(e) => setConfig({ ...config, notify_supervisors: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleConfigSave}
                    disabled={saving}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Configuration
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingItem ? 'Edit' : 'Add'} {
                    modalType === 'duty' ? 'Duty' :
                    modalType === 'timeSlot' ? 'Time Slot' :
                    modalType === 'location' ? 'Location' :
                    modalType === 'role' ? 'Duty Role' : 
                    modalType === 'category' ? 'Category' : ''
                  }
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Duty Form */}
              {modalType === 'duty' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                      <input
                        type="text"
                        value={formData.code || ''}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="MORNING_GATE"
                        disabled={!!editingItem}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Morning Gate Duty"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={formData.category_id || ''}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value || null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Select Category --</option>
                        {dutyCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                      <select
                        value={formData.risk_level || 'low'}
                        onChange={(e) => setFormData({ ...formData, risk_level: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        {RISK_LEVELS.map(level => (
                          <option key={level.value} value={level.value}>{level.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Allowed Assignee Types</label>
                    <div className="flex flex-wrap gap-2">
                      {ASSIGNEE_TYPES.map(type => {
                        const Icon = type.icon;
                        const isSelected = (formData.allowed_assignee_types || []).includes(type.value);
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => toggleAssigneeType(type.value)}
                            className={`px-4 py-2 rounded-lg border-2 flex items-center gap-2 transition-all ${
                              isSelected
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            {type.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Default Time Slot</label>
                      <select
                        value={formData.default_time_slot_id || ''}
                        onChange={(e) => setFormData({ ...formData, default_time_slot_id: e.target.value || null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Select --</option>
                        {timeSlots.map(slot => (
                          <option key={slot.id} value={slot.id}>{slot.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Default Location</label>
                      <select
                        value={formData.default_location_id || ''}
                        onChange={(e) => setFormData({ ...formData, default_location_id: e.target.value || null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">-- Select --</option>
                        {locations.map(loc => (
                          <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Assignees</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.min_assignees || 1}
                        onChange={(e) => setFormData({ ...formData, min_assignees: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Assignees</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.max_assignees || ''}
                        onChange={(e) => setFormData({ ...formData, max_assignees: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        placeholder="Unlimited"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max/Week (Student)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.max_per_week_student || 2}
                        onChange={(e) => setFormData({ ...formData, max_per_week_student: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.supervisor_required || false}
                        onChange={(e) => setFormData({ ...formData, supervisor_required: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span className="text-sm text-gray-700">Supervisor Required</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
                    <textarea
                      value={formData.instructions || ''}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Duty instructions..."
                    />
                  </div>
                </div>
              )}

              {/* Time Slot Form */}
              {modalType === 'timeSlot' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                      <input
                        type="text"
                        value={formData.code || ''}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        disabled={!!editingItem}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={formData.start_time || '08:00'}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        type="time"
                        value={formData.end_time || '09:00'}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                      <input
                        type="number"
                        value={formData.display_order || 0}
                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Location Form */}
              {modalType === 'location' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                      <input
                        type="text"
                        value={formData.code || ''}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        disabled={!!editingItem}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={formData.type || 'other'}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {LOCATION_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                      <input
                        type="number"
                        value={formData.capacity || ''}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
                      <input
                        type="text"
                        value={formData.building || ''}
                        onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                      <input
                        type="text"
                        value={formData.floor || ''}
                        onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Role Form */}
              {modalType === 'role' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                      <input
                        type="text"
                        value={formData.code || ''}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        disabled={!!editingItem}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <input
                      type="number"
                      value={formData.priority || 0}
                      onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">Lower number = higher priority</p>
                  </div>
                </div>
              )}

              {/* Category Form */}
              {modalType === 'category' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                      <input
                        type="text"
                        value={formData.code || ''}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="ACADEMIC"
                        disabled={!!editingItem}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Academic"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Description of this category"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={formData.color || '#6B7280'}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={formData.color || '#6B7280'}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                          placeholder="#6B7280"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                      <input
                        type="number"
                        value={formData.display_order || 0}
                        onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">Lower number appears first</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                    <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
                    <span 
                      className="px-3 py-1.5 text-sm rounded-full"
                      style={{ backgroundColor: formData.color || '#6B7280', color: '#fff' }}
                    >
                      {formData.name || 'Category Name'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingItem ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingAssignment ? 'Edit Assignment' : 'New Duty Assignment'}
                </h2>
                <button onClick={() => { setShowAssignmentModal(false); setEditingAssignment(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              {/* Duty Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duty *</label>
                <select
                  value={assignmentFormData.duty_id}
                  onChange={(e) => {
                    const duty = duties.find(d => d.id === e.target.value);
                    setAssignmentFormData({
                      ...assignmentFormData,
                      duty_id: e.target.value,
                      roster_type_id: duty?.roster_type_id || assignmentFormData.roster_type_id,
                      time_slot_id: duty?.default_time_slot_id || assignmentFormData.time_slot_id,
                      location_id: duty?.default_location_id || assignmentFormData.location_id
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select Duty --</option>
                  {duties.map(duty => (
                    <option key={duty.id} value={duty.id}>{duty.name}</option>
                  ))}
                </select>
              </div>

              {/* Assignee Type & Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assignee Type *</label>
                  <select
                    value={assignmentFormData.assignee_type}
                    onChange={(e) => setAssignmentFormData({ ...assignmentFormData, assignee_type: e.target.value, assignee_id: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="teacher">Teacher</option>
                    <option value="staff">Staff</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assignee *</label>
                  <select
                    value={assignmentFormData.assignee_id}
                    onChange={(e) => setAssignmentFormData({ ...assignmentFormData, assignee_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Select --</option>
                    {getAssigneeOptions().map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Supervisor (for students) */}
              {(assignmentFormData.assignee_type === 'student' || selectedDuty?.supervisor_required) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supervisor {selectedDuty?.supervisor_required ? '*' : ''}
                  </label>
                  <select
                    value={assignmentFormData.supervisor_id}
                    onChange={(e) => setAssignmentFormData({ ...assignmentFormData, supervisor_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Select Supervisor --</option>
                    {teachersList.map(t => (
                      <option key={t.id} value={t.id}>{t.fullName || `${t.firstName || ''} ${t.lastName || ''}`.trim()}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={assignmentFormData.start_date}
                    onChange={(e) => setAssignmentFormData({ ...assignmentFormData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={assignmentFormData.end_date}
                    onChange={(e) => setAssignmentFormData({ ...assignmentFormData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for single day</p>
                </div>
              </div>

              {/* Time Slot & Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
                  <select
                    value={assignmentFormData.time_slot_id}
                    onChange={(e) => setAssignmentFormData({ ...assignmentFormData, time_slot_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Select --</option>
                    {timeSlots.map(slot => (
                      <option key={slot.id} value={slot.id}>
                        {slot.name} ({slot.start_time?.slice(0, 5)} - {slot.end_time?.slice(0, 5)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <select
                    value={assignmentFormData.location_id}
                    onChange={(e) => setAssignmentFormData({ ...assignmentFormData, location_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Select --</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={assignmentFormData.role_id}
                  onChange={(e) => setAssignmentFormData({ ...assignmentFormData, role_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Select --</option>
                  {dutyRoles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={assignmentFormData.notes}
                  onChange={(e) => setAssignmentFormData({ ...assignmentFormData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Additional notes..."
                />
              </div>

              {/* Require Acceptance */}
              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <input
                  type="checkbox"
                  id="require_acceptance"
                  checked={assignmentFormData.require_acceptance}
                  onChange={(e) => setAssignmentFormData({ ...assignmentFormData, require_acceptance: e.target.checked })}
                  className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <div>
                  <label htmlFor="require_acceptance" className="text-sm font-medium text-amber-900 cursor-pointer">
                    Require Acceptance
                  </label>
                  <p className="text-xs text-amber-700">
                    {assignmentFormData.assignee_type === 'student' 
                      ? 'The supervisor must accept before the duty is active' 
                      : 'The assignee must accept before the duty is active'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => { setShowAssignmentModal(false); setEditingAssignment(null); }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAssignment}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingAssignment ? 'Update' : 'Create'} Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Per-Date Status Modal for Admin */}
      {showDatesModal && selectedAssignmentForDates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Per-Date Acceptance Status</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedAssignmentForDates.duty_name || selectedAssignmentForDates.roster_type_name} - {selectedAssignmentForDates.assignee_full_name || 'Assignee'}
                  </p>
                </div>
                <button onClick={() => setShowDatesModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Summary Stats */}
              {assignmentDates.length > 0 && (
                <div className="mt-4 grid grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-gray-900">{assignmentDates.length}</div>
                    <div className="text-xs text-gray-500">Total Days</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {assignmentDates.filter(d => d.status === 'accepted').length}
                    </div>
                    <div className="text-xs text-green-600">Accepted</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-amber-600">
                      {assignmentDates.filter(d => d.status === 'pending_acceptance').length}
                    </div>
                    <div className="text-xs text-amber-600">Pending</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {assignmentDates.filter(d => d.status === 'declined').length}
                    </div>
                    <div className="text-xs text-red-600">Declined</div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {loadingDates ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : assignmentDates.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No date records found</p>
              ) : (
                <div className="space-y-2">
                  {assignmentDates.map((dateRecord) => {
                    let dateObj;
                    if (typeof dateRecord.date === 'string') {
                      const dateOnly = dateRecord.date.split('T')[0];
                      dateObj = new Date(dateOnly + 'T12:00:00');
                    } else {
                      dateObj = new Date(dateRecord.date);
                    }
                    const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
                    
                    return (
                      <div 
                        key={dateRecord.id} 
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          dateRecord.status === 'accepted' ? 'bg-green-50 border-green-200' :
                          dateRecord.status === 'declined' ? 'bg-red-50 border-red-200' :
                          dateRecord.status === 'completed' ? 'bg-slate-50 border-slate-200' :
                          'bg-amber-50 border-amber-200'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-gray-900">{dateStr}</div>
                          {dateRecord.status === 'accepted' && dateRecord.accepted_at && (
                            <div className="text-xs text-green-600 mt-1">
                              Accepted on {new Date(dateRecord.accepted_at).toLocaleDateString()}
                            </div>
                          )}
                          {dateRecord.status === 'declined' && (
                            <div className="text-xs text-red-600 mt-1">
                              {dateRecord.decline_reason || 'No reason provided'}
                            </div>
                          )}
                          {dateRecord.status === 'completed' && dateRecord.completed_at && (
                            <div className="text-xs text-slate-600 mt-1">
                              Completed on {new Date(dateRecord.completed_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                          dateRecord.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          dateRecord.status === 'declined' ? 'bg-red-100 text-red-700' :
                          dateRecord.status === 'completed' ? 'bg-slate-100 text-slate-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {dateRecord.status === 'pending_acceptance' ? 'Pending' : 
                           dateRecord.status.charAt(0).toUpperCase() + dateRecord.status.slice(1)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowDatesModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RosterConfiguration;

