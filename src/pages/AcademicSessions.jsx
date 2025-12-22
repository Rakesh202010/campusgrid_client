import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  X,
  Star,
  ChevronDown
} from 'lucide-react';
import { academicSessions } from '../services/api';
import { toast } from '../utils/toast';

const AcademicSessions = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    startDate: '',
    endDate: '',
    status: 'active',
    termType: 'annual',
    description: '',
    isCurrent: false
  });

  const termTypes = [
    { value: 'annual', label: 'Annual (Full Year)' },
    { value: 'semester', label: 'Semester (2 Terms)' },
    { value: 'trimester', label: 'Trimester (3 Terms)' },
    { value: 'quarterly', label: 'Quarterly (4 Terms)' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active', color: 'bg-green-100 text-green-700' },
    { value: 'upcoming', label: 'Upcoming', color: 'bg-blue-100 text-blue-700' },
    { value: 'completed', label: 'Completed', color: 'bg-gray-100 text-gray-700' },
    { value: 'inactive', label: 'Inactive', color: 'bg-yellow-100 text-yellow-700' }
  ];

  useEffect(() => {
    fetchSessions();
  }, [statusFilter]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      
      const response = await academicSessions.getAll(params);
      if (response?.success) {
        setSessions(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load academic sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (session = null) => {
    if (session) {
      setEditingSession(session);
      setFormData({
        name: session.name,
        code: session.code,
        startDate: session.startDate?.split('T')[0] || '',
        endDate: session.endDate?.split('T')[0] || '',
        status: session.status,
        termType: session.termType || 'annual',
        description: session.description || '',
        isCurrent: session.isCurrent || false
      });
    } else {
      setEditingSession(null);
      setFormData({
        name: '',
        code: '',
        startDate: '',
        endDate: '',
        status: 'active',
        termType: 'annual',
        description: '',
        isCurrent: false
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSession(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      if (editingSession) {
        response = await academicSessions.update(editingSession.id, formData);
      } else {
        response = await academicSessions.create(formData);
      }

      if (response?.success) {
        toast.success(
          editingSession 
            ? 'Academic session updated successfully' 
            : 'Academic session created successfully'
        );
        handleCloseModal();
        fetchSessions();
      } else {
        toast.error(response?.message || 'Operation failed');
      }
    } catch (error) {
      console.error('Error saving session:', error);
      toast.error('Failed to save academic session');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await academicSessions.delete(id);
      if (response?.success) {
        toast.success('Academic session deleted successfully');
        setShowDeleteConfirm(null);
        fetchSessions();
      } else {
        toast.error(response?.message || 'Failed to delete');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete academic session');
    }
  };

  const handleSetCurrent = async (id) => {
    try {
      const response = await academicSessions.setCurrent(id);
      if (response?.success) {
        toast.success(response.message || 'Session set as current');
        fetchSessions();
      } else {
        toast.error(response?.message || 'Failed to set current session');
      }
    } catch (error) {
      console.error('Error setting current session:', error);
      toast.error('Failed to set current session');
    }
  };

  const getStatusBadge = (status) => {
    const option = statusOptions.find(s => s.value === status);
    return option || { label: status, color: 'bg-gray-100 text-gray-700' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Generate code suggestion from dates
  const generateCode = () => {
    if (formData.startDate && formData.endDate) {
      const startYear = new Date(formData.startDate).getFullYear();
      const endYear = new Date(formData.endDate).getFullYear();
      return startYear === endYear ? `AY-${startYear}` : `AY-${startYear}-${endYear.toString().slice(-2)}`;
    }
    return '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Academic Sessions</h2>
          <p className="text-gray-600 mt-1">Manage academic years and session configurations</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add Session</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Filter by Status:</span>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
              >
                <option value="">All Status</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Academic Sessions</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first academic session.</p>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Session
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Session</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Code</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Duration</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Term Type</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-right py-4 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => {
                  const statusBadge = getStatusBadge(session.status);
                  return (
                    <tr key={session.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${session.isCurrent ? 'bg-amber-100' : 'bg-blue-100'}`}>
                            {session.isCurrent ? (
                              <Star className="w-5 h-5 text-amber-600" />
                            ) : (
                              <Calendar className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800 flex items-center gap-2">
                              {session.name}
                              {session.isCurrent && (
                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                                  Current
                                </span>
                              )}
                            </p>
                            {session.description && (
                              <p className="text-sm text-gray-500 truncate max-w-xs">{session.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{session.code}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          <p className="text-gray-800">{formatDate(session.startDate)}</p>
                          <p className="text-gray-500">to {formatDate(session.endDate)}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-700 capitalize">
                          {termTypes.find(t => t.value === session.termType)?.label || session.termType}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                          {session.status === 'active' && <CheckCircle className="w-3.5 h-3.5" />}
                          {session.status === 'upcoming' && <Clock className="w-3.5 h-3.5" />}
                          {session.status === 'completed' && <CheckCircle className="w-3.5 h-3.5" />}
                          {session.status === 'inactive' && <AlertCircle className="w-3.5 h-3.5" />}
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          {!session.isCurrent && session.status !== 'completed' && (
                            <button
                              onClick={() => handleSetCurrent(session.id)}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Set as Current"
                            >
                              <Star className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenModal(session)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(session)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                            disabled={session.isCurrent}
                          >
                            <Trash2 className={`w-4 h-4 ${session.isCurrent ? 'opacity-50' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingSession ? 'Edit Academic Session' : 'Create Academic Session'}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Academic Year 2024-2025"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    min={formData.startDate}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Code <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., AY-2024-25"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, code: generateCode() })}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Auto
                  </button>
                </div>
              </div>

              {/* Term Type & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Term Type
                  </label>
                  <select
                    value={formData.termType}
                    onChange={(e) => setFormData({ ...formData, termType: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {termTypes.map(term => (
                      <option key={term.value} value={term.value}>{term.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional notes about this academic session..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Set as Current */}
              {!editingSession && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <input
                    type="checkbox"
                    id="isCurrent"
                    checked={formData.isCurrent}
                    onChange={(e) => setFormData({ ...formData, isCurrent: e.target.checked })}
                    className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                  />
                  <label htmlFor="isCurrent" className="text-sm text-amber-800">
                    <span className="font-medium">Set as current session</span>
                    <p className="text-amber-600 text-xs mt-0.5">This will be used as the default session across the school</p>
                  </label>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium"
                >
                  {editingSession ? 'Update Session' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Delete Academic Session</h3>
                  <p className="text-gray-600 text-sm">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete <strong>"{showDeleteConfirm.name}"</strong>? 
                All associated data may be affected.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm.id)}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicSessions;

