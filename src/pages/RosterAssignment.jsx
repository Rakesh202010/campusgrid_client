import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, Users, Plus, Edit2, Trash2, X, Check,
  Loader2, Save, ChevronLeft, ChevronRight, AlertCircle, Filter,
  UserCheck, GraduationCap, Briefcase, Eye, Search, RefreshCw
} from 'lucide-react';
import { roster, teachers, people, academicSessions } from '../services/api';
import { toast } from '../utils/toast';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const RosterAssignment = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // View mode
  const [viewMode, setViewMode] = useState('calendar'); // calendar, list, daily
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Data
  const [assignments, setAssignments] = useState([]);
  const [duties, setDuties] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [locations, setLocations] = useState([]);
  const [dutyRoles, setDutyRoles] = useState([]);
  const [rosterTypes, setRosterTypes] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [academicSession, setAcademicSession] = useState(null);
  
  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formData, setFormData] = useState({
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
    is_recurring: false,
    recurrence_days: []
  });
  
  // Filters
  const [filters, setFilters] = useState({
    assignee_type: '',
    duty_id: '',
    status: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (academicSession) {
      fetchAssignments();
    }
  }, [currentDate, academicSession, filters]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [
        dutiesRes, slotsRes, locsRes, rolesRes, typesRes, sessionRes,
        teachersRes, staffRes
      ] = await Promise.all([
        roster.getDuties({ active_only: true }),
        roster.getTimeSlots({ active_only: true }),
        roster.getLocations({ active_only: true }),
        roster.getDutyRoles({ active_only: true }),
        roster.getRosterTypes({ active_only: true }),
        academicSessions.getCurrent(),
        teachers.getAll(),
        people.getStaff()
      ]);
      
      setDuties(dutiesRes.data || []);
      setTimeSlots(slotsRes.data || []);
      setLocations(locsRes.data || []);
      setDutyRoles(rolesRes.data || []);
      setRosterTypes(typesRes.data || []);
      setTeachersList(teachersRes.data || []);
      setStaffList(staffRes.data || []);
      
      if (sessionRes.success && sessionRes.session) {
        setAcademicSession(sessionRes.session);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const params = {
        start_date: startOfMonth.toISOString().split('T')[0],
        end_date: endOfMonth.toISOString().split('T')[0],
        academic_session_id: academicSession?.id,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      
      const result = await roster.getAssignments(params);
      setAssignments(result.data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const openModal = (assignment = null, date = null) => {
    if (assignment) {
      setEditingAssignment(assignment);
      setFormData({
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
        is_recurring: assignment.is_recurring || false,
        recurrence_days: assignment.recurrence_days || []
      });
    } else {
      setEditingAssignment(null);
      setFormData({
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
        is_recurring: false,
        recurrence_days: []
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAssignment(null);
  };

  const handleSave = async () => {
    if (!formData.duty_id || !formData.assignee_id) {
      toast.error('Please select a duty and assignee');
      return;
    }
    
    setSaving(true);
    try {
      const payload = {
        ...formData,
        academic_session_id: academicSession?.id
      };
      
      let result;
      if (editingAssignment) {
        result = await roster.updateAssignment(editingAssignment.id, payload);
      } else {
        result = await roster.createAssignment(payload);
      }
      
      if (result?.success) {
        toast.success(`Assignment ${editingAssignment ? 'updated' : 'created'} successfully`);
        fetchAssignments();
        closeModal();
      } else {
        toast.error(result?.message || 'Operation failed');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    
    try {
      const result = await roster.deleteAssignment(id);
      if (result?.success) {
        toast.success('Assignment deleted');
        fetchAssignments();
      } else {
        toast.error(result?.message || 'Delete failed');
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getAssigneeOptions = () => {
    switch (formData.assignee_type) {
      case 'teacher':
        return teachersList.map(t => ({
          id: t.id,
          name: `${t.first_name} ${t.last_name}`
        }));
      case 'staff':
        return staffList.map(s => ({
          id: s.id,
          name: `${s.first_name} ${s.last_name}`
        }));
      case 'student':
        return studentsList.map(s => ({
          id: s.id,
          name: `${s.first_name} ${s.last_name}`
        }));
      default:
        return [];
    }
  };

  const getAssignmentsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return assignments.filter(a => {
      const start = a.start_date?.split('T')[0];
      const end = a.end_date?.split('T')[0] || start;
      return dateStr >= start && dateStr <= end;
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
    
    // Add empty cells for days before the first day
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const selectedDuty = duties.find(d => d.id === formData.duty_id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Calendar className="w-8 h-8" />
              Duty Roster Assignment
            </h1>
            <p className="text-white/80 mt-1">Assign duties to teachers, staff, and students</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/roster')}
              className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              Configure Masters
            </button>
            <button
              onClick={() => openModal()}
              className="px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-white/90 transition-colors flex items-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              New Assignment
            </button>
          </div>
        </div>
      </div>

      {/* View Controls & Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'calendar' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                viewMode === 'daily' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Daily Sheet
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={filters.assignee_type}
              onChange={(e) => setFilters({ ...filters, assignee_type: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Assignees</option>
              <option value="teacher">Teachers</option>
              <option value="staff">Staff</option>
              <option value="student">Students</option>
            </select>
            <select
              value={filters.duty_id}
              onChange={(e) => setFilters({ ...filters, duty_id: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Duties</option>
              {duties.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <button
              onClick={fetchAssignments}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {DAYS.map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-600 bg-gray-50">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar Grid */}
          <div className="grid grid-cols-7">
            {getDaysInMonth().map((date, idx) => {
              if (!date) {
                return <div key={idx} className="h-28 border-b border-r border-gray-100 bg-gray-50" />;
              }
              
              const dateAssignments = getAssignmentsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const isSelected = date.toISOString().split('T')[0] === selectedDate;
              
              return (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedDate(date.toISOString().split('T')[0]);
                    if (viewMode === 'calendar') {
                      openModal(null, date.toISOString().split('T')[0]);
                    }
                  }}
                  className={`h-28 border-b border-r border-gray-100 p-1 cursor-pointer hover:bg-indigo-50 transition-colors ${
                    isToday ? 'bg-indigo-50' : ''
                  } ${isSelected ? 'ring-2 ring-indigo-500 ring-inset' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${isToday ? 'text-indigo-600' : 'text-gray-700'}`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-0.5 overflow-hidden max-h-20">
                    {dateAssignments.slice(0, 3).map(assignment => (
                      <div
                        key={assignment.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(assignment);
                        }}
                        className="text-xs px-1.5 py-0.5 rounded truncate"
                        style={{ backgroundColor: assignment.roster_type_color || '#E5E7EB', color: '#374151' }}
                      >
                        {assignment.duty_name}
                      </div>
                    ))}
                    {dateAssignments.length > 3 && (
                      <div className="text-xs text-gray-500 px-1">
                        +{dateAssignments.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Duty</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Assignee</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Time Slot</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Location</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date Range</th>
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
                      <div className="font-medium text-gray-900">{assignment.duty_name}</div>
                      <div className="text-xs text-gray-500">{assignment.roster_type_name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {assignment.assignee_type === 'teacher' && <UserCheck className="w-4 h-4 text-blue-600" />}
                        {assignment.assignee_type === 'staff' && <Briefcase className="w-4 h-4 text-purple-600" />}
                        {assignment.assignee_type === 'student' && <GraduationCap className="w-4 h-4 text-green-600" />}
                        <span className="text-gray-900">{assignment.assignee_name || '-'}</span>
                      </div>
                      {assignment.supervisor_name && (
                        <div className="text-xs text-gray-500">Supervisor: {assignment.supervisor_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900">{assignment.time_slot_name || '-'}</div>
                      {assignment.start_time && (
                        <div className="text-xs text-gray-500">
                          {assignment.start_time?.slice(0, 5)} - {assignment.end_time?.slice(0, 5)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{assignment.location_name || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900">
                        {new Date(assignment.start_date).toLocaleDateString()}
                      </div>
                      {assignment.end_date && (
                        <div className="text-xs text-gray-500">
                          to {new Date(assignment.end_date).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        assignment.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        assignment.status === 'active' ? 'bg-green-100 text-green-700' :
                        assignment.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                        assignment.status === 'pending_approval' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {assignment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openModal(assignment)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(assignment.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                        >
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
      {viewMode === 'daily' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            />
            <span className="text-gray-600">
              {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
              })}
            </span>
          </div>
          
          {timeSlots.map(slot => {
            const slotAssignments = assignments.filter(a => {
              const dateStr = selectedDate;
              const start = a.start_date?.split('T')[0];
              const end = a.end_date?.split('T')[0] || start;
              return dateStr >= start && dateStr <= end && a.time_slot_id === slot.id;
            });
            
            return (
              <div key={slot.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No assignments for this time slot
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {slotAssignments.map(assignment => (
                      <div key={assignment.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-2 h-10 rounded-full"
                            style={{ backgroundColor: assignment.roster_type_color || '#6B7280' }}
                          />
                          <div>
                            <div className="font-medium text-gray-900">{assignment.duty_name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-2">
                              {assignment.assignee_type === 'teacher' && <UserCheck className="w-3 h-3" />}
                              {assignment.assignee_type === 'staff' && <Briefcase className="w-3 h-3" />}
                              {assignment.assignee_type === 'student' && <GraduationCap className="w-3 h-3" />}
                              {assignment.assignee_name || 'Unassigned'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {assignment.location_name && (
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {assignment.location_name}
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => openModal(assignment)}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* Assignment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingAssignment ? 'Edit Assignment' : 'New Duty Assignment'}
                </h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              {/* Duty Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duty *</label>
                <select
                  value={formData.duty_id}
                  onChange={(e) => {
                    const duty = duties.find(d => d.id === e.target.value);
                    setFormData({
                      ...formData,
                      duty_id: e.target.value,
                      roster_type_id: duty?.roster_type_id || formData.roster_type_id,
                      time_slot_id: duty?.default_time_slot_id || formData.time_slot_id,
                      location_id: duty?.default_location_id || formData.location_id
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
                    value={formData.assignee_type}
                    onChange={(e) => setFormData({ ...formData, assignee_type: e.target.value, assignee_id: '' })}
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
                    value={formData.assignee_id}
                    onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
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
              {(formData.assignee_type === 'student' || selectedDuty?.supervisor_required) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Supervisor {selectedDuty?.supervisor_required ? '*' : ''}
                  </label>
                  <select
                    value={formData.supervisor_id}
                    onChange={(e) => setFormData({ ...formData, supervisor_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">-- Select Supervisor --</option>
                    {teachersList.map(t => (
                      <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
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
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
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
                    value={formData.time_slot_id}
                    onChange={(e) => setFormData({ ...formData, time_slot_id: e.target.value })}
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
                    value={formData.location_id}
                    onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
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
                  value={formData.role_id}
                  onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
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
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Additional notes..."
                />
              </div>
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
                {editingAssignment ? 'Update' : 'Create'} Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RosterAssignment;

