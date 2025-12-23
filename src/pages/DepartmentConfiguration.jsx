import { useState, useEffect } from 'react';
import {
  Building2, Plus, Edit2, Trash2, Save, X, Users, BookOpen,
  GripVertical, Check, AlertCircle, Palette, Search, Filter,
  ChevronRight, RefreshCw
} from 'lucide-react';
import { departments as departmentsApi, teachers } from '../services/api';
import { toast } from '../utils/toast';

const COLORS = [
  { value: '#4F46E5', label: 'Indigo' },
  { value: '#10B981', label: 'Green' },
  { value: '#3B82F6', label: 'Blue' },
  { value: '#8B5CF6', label: 'Purple' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#EC4899', label: 'Pink' },
  { value: '#EF4444', label: 'Red' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#F97316', label: 'Orange' },
];

const DepartmentConfiguration = () => {
  const [departmentsList, setDepartmentsList] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    headTeacherId: '',
    color: '#4F46E5',
    isActive: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptRes, teachersRes] = await Promise.all([
        departmentsApi.getAll(),
        teachers.getAll({ status: 'active' })
      ]);

      if (deptRes?.success) {
        setDepartmentsList(deptRes.data || []);
      }
      if (teachersRes?.success) {
        setTeachersList(teachersRes.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.code) {
      toast.error('Name and code are required');
      return;
    }

    setSaving(true);
    try {
      let res;
      if (editingDept) {
        res = await departmentsApi.update(editingDept.id, form);
      } else {
        res = await departmentsApi.create(form);
      }

      if (res?.success) {
        toast.success(editingDept ? 'Department updated!' : 'Department created!');
        setShowModal(false);
        resetForm();
        fetchData();
      } else {
        toast.error(res?.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this department?')) return;

    try {
      const res = await departmentsApi.delete(id);
      if (res?.success) {
        toast.success('Department deleted');
        fetchData();
      } else {
        toast.error(res?.message || 'Cannot delete department');
      }
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const openEditModal = (dept) => {
    setEditingDept(dept);
    setForm({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      headTeacherId: dept.headTeacherId || '',
      color: dept.color || '#4F46E5',
      isActive: dept.isActive
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingDept(null);
    setForm({
      name: '',
      code: '',
      description: '',
      headTeacherId: '',
      color: '#4F46E5',
      isActive: true
    });
  };

  const filteredDepartments = departmentsList.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: departmentsList.length,
    active: departmentsList.filter(d => d.isActive).length,
    withHead: departmentsList.filter(d => d.headTeacherId).length,
    totalSubjects: departmentsList.reduce((sum, d) => sum + (d.subjectCount || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading departments...</p>
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
              <Building2 className="w-8 h-8" />
              Departments Configuration
            </h1>
            <p className="text-white/80 mt-1">Manage academic departments and their heads</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" /> Add Department
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-3xl font-bold">{stats.total}</p>
            <p className="text-white/70 text-sm">Total Departments</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-3xl font-bold">{stats.active}</p>
            <p className="text-white/70 text-sm">Active</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-3xl font-bold">{stats.withHead}</p>
            <p className="text-white/70 text-sm">With Head</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-3xl font-bold">{stats.totalSubjects}</p>
            <p className="text-white/70 text-sm">Total Subjects</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={fetchData}
            className="p-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Departments Grid */}
      {filteredDepartments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-600">No Departments</h3>
          <p className="text-gray-400 mt-2">Create departments to organize subjects and teachers</p>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium"
          >
            Create First Department
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.map((dept) => (
            <div
              key={dept.id}
              className={`bg-white rounded-xl shadow-sm border-l-4 p-5 hover:shadow-md transition-all group ${
                !dept.isActive ? 'opacity-60' : ''
              }`}
              style={{ borderLeftColor: dept.color }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: dept.color }}
                  >
                    {dept.code.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{dept.name}</h3>
                    <p className="text-sm text-gray-500">{dept.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(dept)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(dept.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {dept.description && (
                <p className="text-sm text-gray-500 mt-3 line-clamp-2">{dept.description}</p>
              )}

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {dept.subjectCount || 0} subjects
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {dept.teacherCount || 0} teachers
                  </span>
                </div>
                {!dept.isActive && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                    Inactive
                  </span>
                )}
              </div>

              {dept.headTeacherName && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Head:</span>
                  <span className="font-medium text-gray-700">{dept.headTeacherName}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {editingDept ? 'Edit Department' : 'Add Department'}
                </h3>
                <button onClick={() => { setShowModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Science"
                    className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Code *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., SCI"
                    className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Brief description of the department"
                  className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department Head</label>
                <select
                  value={form.headTeacherId}
                  onChange={(e) => setForm({ ...form, headTeacherId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a teacher (optional)</option>
                  {teachersList.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Palette className="w-4 h-4 inline mr-1" /> Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setForm({ ...form, color: color.value })}
                      className={`w-8 h-8 rounded-lg transition-all ${
                        form.color === color.value ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-5 h-5 text-indigo-600 rounded"
                />
                <span className="text-sm text-gray-700">Active Department</span>
              </label>
            </div>

            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-xl font-medium disabled:opacity-50"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {editingDept ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentConfiguration;

