import { useState, useEffect } from 'react';
import { 
  Users, UserPlus, UserCog, Shield, Plus, Edit2, Trash2, X,
  Loader2, Phone, Mail, Building, Briefcase, Search, CheckCircle
} from 'lucide-react';
import { people } from '../services/api';
import { toast } from '../utils/toast';

const STAFF_TYPES = [
  { value: 'admin', label: 'Administration' },
  { value: 'accounts', label: 'Accounts' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'it', label: 'IT Support' },
  { value: 'security', label: 'Security' },
  { value: 'housekeeping', label: 'Housekeeping' },
  { value: 'transport', label: 'Transport' },
  { value: 'library', label: 'Library' },
  { value: 'lab', label: 'Lab Assistant' },
  { value: 'other', label: 'Other' }
];

const PeopleConfiguration = () => {
  const [activeTab, setActiveTab] = useState('staff');
  
  // Data state
  const [roles, setRoles] = useState([]);
  const [staff, setStaff] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [roleForm, setRoleForm] = useState({
    name: '', code: '', description: '', isActive: true
  });

  const [staffForm, setStaffForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    employeeId: '', department: '', designation: '',
    joiningDate: '', status: 'active'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, staffRes] = await Promise.all([
        people.getRoles(),
        people.getStaff()
      ]);

      if (rolesRes?.success) setRoles(rolesRes.data || []);
      if (staffRes?.success) setStaff(staffRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Role handlers
  const openRoleModal = (role = null) => {
    if (role) {
      setEditingItem(role);
      setRoleForm({
        name: role.name || '',
        code: role.code || '',
        description: role.description || '',
        isActive: role.isActive !== false
      });
    } else {
      setEditingItem(null);
      setRoleForm({ name: '', code: '', description: '', isActive: true });
    }
    setShowRoleModal(true);
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (editingItem) {
        response = await people.updateRole(editingItem.id, roleForm);
      } else {
        response = await people.createRole(roleForm);
      }
      if (response?.success) {
        toast.success(editingItem ? 'Role updated' : 'Role created');
        setShowRoleModal(false);
        fetchData();
      } else {
        toast.error(response?.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Failed to save role');
    }
  };

  const handleDeleteRole = async (id) => {
    try {
      const response = await people.deleteRole(id);
      if (response?.success) {
        toast.success('Role deleted');
        setShowDeleteConfirm(null);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete role');
    }
  };

  // Staff handlers
  const openStaffModal = (staffMember = null) => {
    if (staffMember) {
      setEditingItem(staffMember);
      setStaffForm({
        firstName: staffMember.firstName || '',
        lastName: staffMember.lastName || '',
        email: staffMember.email || '',
        phone: staffMember.phone || '',
        employeeId: staffMember.employeeId || '',
        department: staffMember.department || '',
        designation: staffMember.designation || '',
        joiningDate: staffMember.joiningDate?.split('T')[0] || '',
        status: staffMember.status || 'active'
      });
    } else {
      setEditingItem(null);
      setStaffForm({
        firstName: '', lastName: '', email: '', phone: '',
        employeeId: '', department: '', designation: '',
        joiningDate: '', status: 'active'
      });
    }
    setShowStaffModal(true);
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (editingItem) {
        response = await people.updateStaff(editingItem.id, staffForm);
      } else {
        response = await people.createStaff(staffForm);
      }
      if (response?.success) {
        toast.success(editingItem ? 'Staff updated' : 'Staff member added');
        setShowStaffModal(false);
        fetchData();
      } else {
        toast.error(response?.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Failed to save staff member');
    }
  };

  const handleDeleteStaff = async (id) => {
    try {
      const response = await people.deleteStaff(id);
      if (response?.success) {
        toast.success('Staff member deleted');
        setShowDeleteConfirm(null);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete staff member');
    }
  };

  // Filter staff
  const filteredStaff = staff.filter(s => {
    const fullName = `${s.firstName} ${s.lastName || ''}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) ||
           s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           s.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
        <h2 className="text-2xl font-semibold text-gray-800">Staff & Users Configuration</h2>
        <p className="text-gray-600 mt-1">Manage non-teaching staff and user roles</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('staff')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'staff'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Briefcase className="w-4 h-4 inline-block mr-2" />
            Staff Members
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'roles'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield className="w-4 h-4 inline-block mr-2" />
            User Roles
          </button>
        </nav>
      </div>

      {/* Staff Tab */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
              />
            </div>
            <button
              onClick={() => openStaffModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <UserPlus className="w-4 h-4" />
              Add Staff
            </button>
          </div>

          {filteredStaff.length === 0 ? (
            <div className="card text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Staff Members</h3>
              <p className="text-gray-600 mb-4">Add your first staff member to get started</p>
              <button
                onClick={() => openStaffModal()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add Staff
              </button>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Staff Member</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Department</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Contact</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredStaff.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-semibold text-sm">
                            {s.firstName?.[0]}{s.lastName?.[0] || ''}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{s.firstName} {s.lastName}</p>
                            <p className="text-xs text-gray-500">{s.employeeId || 'No ID'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-gray-800">{s.department || '-'}</p>
                        <p className="text-xs text-gray-500">{s.designation || ''}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {s.phone && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Phone className="w-3 h-3" /> {s.phone}
                            </div>
                          )}
                          {s.email && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Mail className="w-3 h-3" /> {s.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          s.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {s.status || 'active'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openStaffModal(s)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm({ type: 'staff', item: s })}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => openRoleModal()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Add Role
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.filter(r => r.code !== 'TEACHER' && r.code !== 'PARENT').map(role => (
              <div key={role.id} className="card border hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{role.name}</h4>
                      <p className="text-xs text-gray-500">{role.code}</p>
                    </div>
                  </div>
                  {role.isSystem ? (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">System</span>
                  ) : (
                    <div className="flex gap-1">
                      <button onClick={() => openRoleModal(role)} className="p-1 text-gray-400 hover:text-blue-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setShowDeleteConfirm({ type: 'role', item: role })} className="p-1 text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600">{role.description || 'No description'}</p>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className={`flex items-center gap-1 text-xs ${role.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                    <CheckCircle className="w-3 h-3" />
                    {role.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingItem ? 'Edit Staff' : 'Add Staff Member'}</h3>
              <button onClick={() => setShowStaffModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleStaffSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input type="text" value={staffForm.firstName} required
                    onChange={(e) => setStaffForm({ ...staffForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" value={staffForm.lastName}
                    onChange={(e) => setStaffForm({ ...staffForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <input type="text" value={staffForm.employeeId}
                  onChange={(e) => setStaffForm({ ...staffForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select value={staffForm.department}
                    onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select</option>
                    {STAFF_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input type="text" value={staffForm.designation}
                    onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                  <input type="date" value={staffForm.joiningDate}
                    onChange={(e) => setStaffForm({ ...staffForm, joiningDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={staffForm.status}
                    onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingItem ? 'Update' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{editingItem ? 'Edit Role' : 'Add User Role'}</h3>
              <button onClick={() => setShowRoleModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRoleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name *</label>
                <input type="text" value={roleForm.name} required
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Code *</label>
                <input type="text" value={roleForm.code} required
                  onChange={(e) => setRoleForm({ ...roleForm, code: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={roleForm.description} rows={2}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={roleForm.isActive}
                  onChange={(e) => setRoleForm({ ...roleForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editingItem ? 'Update' : 'Add Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete {showDeleteConfirm.type === 'staff' ? 'Staff Member' : 'Role'}?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{showDeleteConfirm.item.name || showDeleteConfirm.item.firstName}"?
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button
                onClick={() => showDeleteConfirm.type === 'staff' 
                  ? handleDeleteStaff(showDeleteConfirm.item.id)
                  : handleDeleteRole(showDeleteConfirm.item.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeopleConfiguration;
