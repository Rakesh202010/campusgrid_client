import { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, Building2, Plus, Edit2, Trash2, X,
  Loader2, Phone, Mail, Briefcase, Search, CheckCircle, Key,
  Eye, EyeOff, Lock, Unlock, Settings, ChevronDown, ChevronRight,
  Save, RefreshCw, AlertCircle, UserCog, Layers, GraduationCap,
  CreditCard, FileText, Calendar, BarChart3, BookOpen, Clock,
  UserCheck, Check
} from 'lucide-react';
import { people, departments as departmentsApi } from '../services/api';
import { toast } from '../utils/toast';

// Module definitions with their permissions
const MODULES = [
  { 
    id: 'dashboard', 
    name: 'Dashboard', 
    icon: BarChart3,
    permissions: ['view']
  },
  { 
    id: 'students', 
    name: 'Students', 
    icon: GraduationCap,
    permissions: ['view', 'create', 'edit', 'delete', 'export', 'import']
  },
  { 
    id: 'teachers', 
    name: 'Teachers', 
    icon: Users,
    permissions: ['view', 'create', 'edit', 'delete', 'manage_attendance', 'manage_leave']
  },
  { 
    id: 'classes', 
    name: 'Classes & Timetable', 
    icon: BookOpen,
    permissions: ['view', 'create', 'edit', 'delete', 'manage_timetable']
  },
  { 
    id: 'attendance', 
    name: 'Attendance', 
    icon: UserCheck,
    permissions: ['view', 'mark', 'edit', 'reports']
  },
  { 
    id: 'fees', 
    name: 'Fees & Finance', 
    icon: CreditCard,
    permissions: ['view', 'collect', 'edit', 'refund', 'reports', 'configure']
  },
  { 
    id: 'exams', 
    name: 'Exams & Results', 
    icon: FileText,
    permissions: ['view', 'create', 'edit', 'delete', 'publish_results']
  },
  { 
    id: 'reports', 
    name: 'Reports', 
    icon: BarChart3,
    permissions: ['view', 'export', 'generate']
  },
  { 
    id: 'settings', 
    name: 'Settings', 
    icon: Settings,
    permissions: ['view', 'edit']
  },
  { 
    id: 'staff_management', 
    name: 'Staff Management', 
    icon: UserCog,
    permissions: ['view', 'create', 'edit', 'delete', 'manage_access']
  }
];

// Pre-defined staff department types (shown as default departments)
const DEFAULT_DEPARTMENTS = [
  { id: 'default-1', code: 'ADMIN', name: 'Administration', description: 'Administrative staff and office management', color: '#4F46E5', isActive: true, isDefault: true },
  { id: 'default-2', code: 'ACCOUNTS', name: 'Accounts & Finance', description: 'Financial operations and accounting', color: '#10B981', isActive: true, isDefault: true },
  { id: 'default-3', code: 'HR', name: 'Human Resources', description: 'HR and employee management', color: '#F59E0B', isActive: true, isDefault: true },
  { id: 'default-4', code: 'IT', name: 'IT & Technology', description: 'IT support and technology management', color: '#3B82F6', isActive: true, isDefault: true },
  { id: 'default-5', code: 'SECURITY', name: 'Security', description: 'Campus security and safety', color: '#EF4444', isActive: true, isDefault: true },
  { id: 'default-6', code: 'HOUSEKEEP', name: 'Housekeeping', description: 'Cleaning and maintenance staff', color: '#8B5CF6', isActive: true, isDefault: true },
  { id: 'default-7', code: 'TRANSPORT', name: 'Transport', description: 'School transportation and drivers', color: '#06B6D4', isActive: true, isDefault: true },
  { id: 'default-8', code: 'LIBRARY', name: 'Library', description: 'Library staff and management', color: '#EC4899', isActive: true, isDefault: true },
  { id: 'default-9', code: 'LAB', name: 'Laboratory', description: 'Lab assistants and technicians', color: '#14B8A6', isActive: true, isDefault: true },
  { id: 'default-10', code: 'SPORTS', name: 'Sports & PE', description: 'Sports coordinators and PE staff', color: '#F97316', isActive: true, isDefault: true },
  { id: 'default-11', code: 'MEDICAL', name: 'Medical/Health', description: 'School nurse and health staff', color: '#DC2626', isActive: true, isDefault: true },
  { id: 'default-12', code: 'CANTEEN', name: 'Canteen', description: 'Canteen and food service staff', color: '#84CC16', isActive: true, isDefault: true },
  { id: 'default-13', code: 'RECEPTION', name: 'Reception/Front Office', description: 'Front desk and reception staff', color: '#A855F7', isActive: true, isDefault: true },
];

// Color palette for custom departments
const DEPARTMENT_COLORS = [
  '#4F46E5', '#10B981', '#F59E0B', '#3B82F6', '#EF4444', 
  '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6', '#F97316',
  '#DC2626', '#84CC16', '#A855F7', '#6B7280', '#0EA5E9'
];

const StaffUsersConfiguration = () => {
  const [activeTab, setActiveTab] = useState('departments');
  
  // Data states
  const [staffDepartments, setStaffDepartments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  const [editingItem, setEditingItem] = useState(null);
  
  // Department form
  const [deptForm, setDeptForm] = useState({
    name: '', code: '', description: '', color: '#4F46E5', isActive: true
  });
  
  // Staff form
  const [staffForm, setStaffForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    employeeId: '', departmentId: '', designation: '',
    joiningDate: '', status: 'active', canLogin: false,
    roleId: '', password: ''
  });
  
  // Role form with permissions
  const [roleForm, setRoleForm] = useState({
    name: '', code: '', description: '', isActive: true,
    permissions: {}
  });
  
  // Access/Login management
  const [accessForm, setAccessForm] = useState({
    staffId: '', email: '', password: '', roleId: '', canLogin: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffRes, rolesRes, deptRes] = await Promise.all([
        people.getStaff(),
        people.getRoles(),
        people.getDepartments ? people.getDepartments() : Promise.resolve({ success: true, data: [] })
      ]);

      if (staffRes?.success) setStaff(staffRes.data || []);
      if (rolesRes?.success) setRoles(rolesRes.data || []);
      if (deptRes?.success) setStaffDepartments(deptRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // ===================== DEPARTMENT HANDLERS =====================
  const openDeptModal = (dept = null) => {
    if (dept) {
      setEditingItem(dept);
      setDeptForm({
        name: dept.name || '',
        code: dept.code || '',
        description: dept.description || '',
        color: dept.color || '#4F46E5',
        isActive: dept.isActive !== false
      });
    } else {
      setEditingItem(null);
      setDeptForm({
        name: '', code: '', description: '', color: '#4F46E5', isActive: true
      });
    }
    setShowDeptModal(true);
  };

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    if (!deptForm.name || !deptForm.code) {
      toast.error('Name and code are required');
      return;
    }
    setSaving(true);
    try {
      let response;
      // For default departments being edited, create a customized copy
      if (editingItem?.isDefault) {
        response = await people.createDepartment?.({ ...deptForm, isDefault: false }) ||
                   await departmentsApi.create({ ...deptForm, isStaffDepartment: true, isDefault: false });
      } else if (editingItem) {
        response = await people.updateDepartment?.(editingItem.id, deptForm) || 
                   await departmentsApi.update(editingItem.id, { ...deptForm, isStaffDepartment: true });
      } else {
        response = await people.createDepartment?.(deptForm) ||
                   await departmentsApi.create({ ...deptForm, isStaffDepartment: true });
      }
      if (response?.success) {
        toast.success(editingItem ? 'Department updated' : 'Department created');
        setShowDeptModal(false);
        fetchData();
      } else {
        toast.error(response?.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Failed to save department');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDept = async (id) => {
    try {
      const response = await people.deleteDepartment?.(id) || await departmentsApi.delete(id);
      if (response?.success) {
        toast.success('Department deleted');
        setShowDeleteConfirm(null);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete department');
    }
  };

  // ===================== STAFF HANDLERS =====================
  const openStaffModal = (staffMember = null) => {
    if (staffMember) {
      setEditingItem(staffMember);
      setStaffForm({
        firstName: staffMember.firstName || '',
        lastName: staffMember.lastName || '',
        email: staffMember.email || '',
        phone: staffMember.phone || '',
        employeeId: staffMember.employeeId || '',
        departmentId: staffMember.departmentId || '',
        designation: staffMember.designation || '',
        joiningDate: staffMember.joiningDate?.split('T')[0] || '',
        status: staffMember.status || 'active',
        canLogin: staffMember.canLogin || false,
        roleId: staffMember.roleId || '',
        password: ''
      });
    } else {
      setEditingItem(null);
      setStaffForm({
        firstName: '', lastName: '', email: '', phone: '',
        employeeId: '', departmentId: '', designation: '',
        joiningDate: '', status: 'active', canLogin: false,
        roleId: '', password: ''
      });
    }
    setShowStaffModal(true);
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    if (!staffForm.firstName) {
      toast.error('First name is required');
      return;
    }
    setSaving(true);
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
    } finally {
      setSaving(false);
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

  // ===================== ROLE HANDLERS =====================
  const openRoleModal = (role = null) => {
    if (role) {
      setEditingItem(role);
      setRoleForm({
        name: role.name || '',
        code: role.code || '',
        description: role.description || '',
        isActive: role.isActive !== false,
        permissions: role.permissions || {}
      });
    } else {
      setEditingItem(null);
      // Initialize with empty permissions
      const emptyPerms = {};
      MODULES.forEach(mod => {
        emptyPerms[mod.id] = {};
        mod.permissions.forEach(perm => {
          emptyPerms[mod.id][perm] = false;
        });
      });
      setRoleForm({
        name: '', code: '', description: '', isActive: true,
        permissions: emptyPerms
      });
    }
    setShowRoleModal(true);
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    if (!roleForm.name || !roleForm.code) {
      toast.error('Name and code are required');
      return;
    }
    setSaving(true);
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
    } finally {
      setSaving(false);
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

  const toggleModulePermission = (moduleId, permission) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleId]: {
          ...(prev.permissions[moduleId] || {}),
          [permission]: !(prev.permissions[moduleId]?.[permission])
        }
      }
    }));
  };

  const toggleAllModulePermissions = (moduleId, enable) => {
    const module = MODULES.find(m => m.id === moduleId);
    if (!module) return;
    
    const newPerms = {};
    module.permissions.forEach(perm => {
      newPerms[perm] = enable;
    });
    
    setRoleForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleId]: newPerms
      }
    }));
  };

  // ===================== ACCESS/LOGIN HANDLERS =====================
  const openAccessModal = (staffMember) => {
    setEditingItem(staffMember);
    setAccessForm({
      staffId: staffMember.id,
      email: staffMember.email || '',
      password: '',
      roleId: staffMember.roleId || '',
      canLogin: staffMember.canLogin || false
    });
    setShowAccessModal(true);
  };

  const handleAccessSubmit = async (e) => {
    e.preventDefault();
    if (!accessForm.email) {
      toast.error('Email is required for login access');
      return;
    }
    if (accessForm.canLogin && !editingItem?.hasPassword && !accessForm.password) {
      toast.error('Password is required to enable login');
      return;
    }
    setSaving(true);
    try {
      const response = await people.updateStaffAccess?.(accessForm.staffId, accessForm) ||
                       await people.updateStaff(accessForm.staffId, {
                         email: accessForm.email,
                         roleId: accessForm.roleId,
                         canLogin: accessForm.canLogin,
                         ...(accessForm.password && { password: accessForm.password })
                       });
      if (response?.success) {
        toast.success('Access settings updated');
        setShowAccessModal(false);
        fetchData();
      } else {
        toast.error(response?.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Failed to update access settings');
    } finally {
      setSaving(false);
    }
  };

  // Filter functions
  const filteredStaff = staff.filter(s => {
    const fullName = `${s.firstName} ${s.lastName || ''}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) ||
           s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           s.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const filteredRoles = roles.filter(r => 
    r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Merge default departments with custom ones from database
  const allDepartments = [
    ...DEFAULT_DEPARTMENTS.filter(dd => !staffDepartments.some(sd => sd.code === dd.code)),
    ...staffDepartments
  ];

  const getDepartmentById = (id) => {
    return allDepartments.find(d => d.id === id);
  };

  const getRoleById = (id) => roles.find(r => r.id === id);

  // Stats
  const stats = {
    totalDepartments: allDepartments.length,
    totalStaff: staff.length,
    activeStaff: staff.filter(s => s.status === 'active').length,
    staffWithLogin: staff.filter(s => s.canLogin).length,
    totalRoles: roles.filter(r => !r.isSystem && r.code !== 'TEACHER' && r.code !== 'PARENT').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-500">Loading configuration...</p>
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
              <UserCog className="w-8 h-8" />
              Staff & Users Configuration
            </h1>
            <p className="text-white/80 mt-1">Manage departments, staff members, roles and access control</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mt-6">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-3xl font-bold">{stats.totalDepartments}</p>
            <p className="text-white/70 text-sm">Departments</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-3xl font-bold">{stats.totalStaff}</p>
            <p className="text-white/70 text-sm">Total Staff</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-3xl font-bold">{stats.activeStaff}</p>
            <p className="text-white/70 text-sm">Active Staff</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-3xl font-bold">{stats.staffWithLogin}</p>
            <p className="text-white/70 text-sm">With Login</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center">
            <p className="text-3xl font-bold">{stats.totalRoles}</p>
            <p className="text-white/70 text-sm">Custom Roles</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          {[
            { id: 'departments', label: 'Departments', icon: Building2 },
            { id: 'staff', label: 'Staff Members', icon: Users },
            { id: 'roles', label: 'Roles & Permissions', icon: Shield },
            { id: 'access', label: 'User Access', icon: Key }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-6 py-4 font-medium text-sm border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* ===================== DEPARTMENTS TAB ===================== */}
          {activeTab === 'departments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Staff Departments</h3>
                  <p className="text-sm text-gray-500">Pre-assigned departments for organizing non-teaching staff. Add more as needed.</p>
                </div>
                <button
                  onClick={() => openDeptModal()}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Custom Department
                </button>
              </div>

              {/* Info banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Pre-assigned Departments</p>
                  <p className="text-xs text-blue-600 mt-1">These are standard departments available for all schools. You can edit them or add custom departments as per your school's requirements.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allDepartments.map(dept => (
                  <div
                    key={dept.id}
                    className={`bg-white rounded-xl border-l-4 p-5 shadow-sm hover:shadow-md transition-all ${!dept.isActive ? 'opacity-60' : ''}`}
                    style={{ borderLeftColor: dept.color || '#4F46E5' }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: dept.color || '#4F46E5' }}
                        >
                          {dept.code?.substring(0, 2) || dept.name?.substring(0, 2)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                            {dept.name}
                            {dept.isDefault && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-medium rounded">DEFAULT</span>
                            )}
                          </h4>
                          <p className="text-xs text-gray-500">{dept.code}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openDeptModal(dept)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {!dept.isDefault && (
                          <button onClick={() => setShowDeleteConfirm({ type: 'department', item: dept })} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    {dept.description && (
                      <p className="text-sm text-gray-500 mt-3 line-clamp-2">{dept.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Users className="w-4 h-4" />
                        {staff.filter(s => s.departmentId === dept.id).length} staff
                      </span>
                      <div className="flex items-center gap-2">
                        {!dept.isActive && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">Inactive</span>
                        )}
                        {dept.isActive && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full">Active</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===================== STAFF TAB ===================== */}
          {activeTab === 'staff' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search staff by name, email or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => openStaffModal()}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Staff Member
                </button>
              </div>

              {filteredStaff.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">No Staff Members</h3>
                  <p className="text-gray-600 mb-4">Add your first staff member to get started</p>
                  <button
                    onClick={() => openStaffModal()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4" />
                    Add Staff
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Staff Member</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Department</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Contact</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Role</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredStaff.map(s => {
                        const dept = getDepartmentById(s.departmentId);
                        const role = getRoleById(s.roleId);
                        return (
                          <tr key={s.id} className="hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                                  style={{ backgroundColor: dept?.color || '#6366F1' }}
                                >
                                  {s.firstName?.[0]}{s.lastName?.[0] || ''}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-800">{s.firstName} {s.lastName}</p>
                                  <p className="text-xs text-gray-500">{s.employeeId || 'No ID'} • {s.designation || 'No designation'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {dept ? (
                                <span 
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full"
                                  style={{ 
                                    backgroundColor: `${dept.color}15`,
                                    color: dept.color 
                                  }}
                                >
                                  <span 
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: dept.color }}
                                  />
                                  {dept.name || dept.label}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-sm">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                {s.phone && (
                                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                    <Phone className="w-3.5 h-3.5" /> {s.phone}
                                  </div>
                                )}
                                {s.email && (
                                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                    <Mail className="w-3.5 h-3.5" /> {s.email}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              {role ? (
                                <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                                  {role.name}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-sm">No role</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-col gap-1">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full w-fit ${
                                  s.status === 'active' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                                  {s.status || 'active'}
                                </span>
                                {s.canLogin && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full w-fit">
                                    <Key className="w-3 h-3" /> Login enabled
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => openAccessModal(s)}
                                  className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                                  title="Manage Access"
                                >
                                  <Key className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openStaffModal(s)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                  title="Edit"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm({ type: 'staff', item: s })}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
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
          )}

          {/* ===================== ROLES & PERMISSIONS TAB ===================== */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Roles & Permissions (RBAC)</h3>
                  <p className="text-sm text-gray-500">Configure what each role can access in the system</p>
                </div>
                <button
                  onClick={() => openRoleModal()}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Role
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* System Roles */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    System Roles (Read-only)
                  </h4>
                  <div className="space-y-2">
                    {roles.filter(r => r.isSystem || r.code === 'ADMIN').map(role => (
                      <div key={role.id} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Shield className="w-5 h-5 text-gray-500" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-800">{role.name}</h4>
                              <p className="text-xs text-gray-500">{role.code}</p>
                            </div>
                          </div>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">System</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">{role.description || 'Full system access'}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Roles */}
                <div className="bg-indigo-50/50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                    <Unlock className="w-4 h-4" />
                    Custom Roles
                  </h4>
                  {roles.filter(r => !r.isSystem && r.code !== 'ADMIN' && r.code !== 'TEACHER' && r.code !== 'PARENT').length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-300">
                      <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No custom roles created yet</p>
                      <button
                        onClick={() => openRoleModal()}
                        className="mt-3 text-sm text-indigo-600 hover:underline"
                      >
                        Create your first role
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {roles.filter(r => !r.isSystem && r.code !== 'ADMIN' && r.code !== 'TEACHER' && r.code !== 'PARENT').map(role => (
                        <div key={role.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-indigo-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800">{role.name}</h4>
                                <p className="text-xs text-gray-500">{role.code}</p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <button onClick={() => openRoleModal(role)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button onClick={() => setShowDeleteConfirm({ type: 'role', item: role })} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">{role.description || 'No description'}</p>
                          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(role.permissions || {}).slice(0, 3).map(([moduleId, perms]) => {
                                const hasAny = Object.values(perms || {}).some(v => v);
                                if (!hasAny) return null;
                                return (
                                  <span key={moduleId} className="px-2 py-0.5 text-xs bg-indigo-50 text-indigo-600 rounded">
                                    {moduleId}
                                  </span>
                                );
                              })}
                            </div>
                            <span className={`flex items-center gap-1 text-xs ${role.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                              <CheckCircle className="w-3 h-3" />
                              {role.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Role Templates */}
              <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                <h4 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Quick Setup: Common Role Templates
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'Accountant', modules: ['dashboard', 'fees', 'reports'] },
                    { name: 'Receptionist', modules: ['dashboard', 'students', 'attendance'] },
                    { name: 'Librarian', modules: ['dashboard', 'students', 'reports'] },
                    { name: 'Lab Assistant', modules: ['dashboard', 'classes'] },
                    { name: 'Data Entry', modules: ['students', 'teachers', 'attendance'] }
                  ].map(template => (
                    <button
                      key={template.name}
                      onClick={() => {
                        const perms = {};
                        MODULES.forEach(mod => {
                          perms[mod.id] = {};
                          mod.permissions.forEach(perm => {
                            perms[mod.id][perm] = template.modules.includes(mod.id) && perm === 'view';
                          });
                        });
                        setRoleForm({
                          name: template.name,
                          code: template.name.toUpperCase().replace(/\s/g, '_'),
                          description: `${template.name} role with limited access`,
                          isActive: true,
                          permissions: perms
                        });
                        setEditingItem(null);
                        setShowRoleModal(true);
                      }}
                      className="px-3 py-1.5 text-sm bg-white border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      + {template.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===================== USER ACCESS TAB ===================== */}
          {activeTab === 'access' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">User Access Management</h3>
                  <p className="text-sm text-gray-500">Manage login credentials and assign roles to staff</p>
                </div>
              </div>

              {/* Staff with/without login */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Staff with Login */}
                <div className="bg-green-50/50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <Unlock className="w-4 h-4" />
                    Staff with Login Access ({staff.filter(s => s.canLogin).length})
                  </h4>
                  {staff.filter(s => s.canLogin).length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-lg border border-dashed border-green-200">
                      <Key className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">No staff have login access yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {staff.filter(s => s.canLogin).map(s => {
                        const role = getRoleById(s.roleId);
                        return (
                          <div key={s.id} className="bg-white rounded-lg p-3 border border-green-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm">
                                {s.firstName?.[0]}
                              </div>
                              <div>
                                <p className="font-medium text-gray-800 text-sm">{s.firstName} {s.lastName}</p>
                                <p className="text-xs text-gray-500">{s.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {role && (
                                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                                  {role.name}
                                </span>
                              )}
                              <button
                                onClick={() => openAccessModal(s)}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Staff without Login */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Staff without Login ({staff.filter(s => !s.canLogin).length})
                  </h4>
                  {staff.filter(s => !s.canLogin).length === 0 ? (
                    <div className="text-center py-8 bg-white rounded-lg border border-dashed border-gray-200">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">All staff have login access</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {staff.filter(s => !s.canLogin).map(s => (
                        <div key={s.id} className="bg-white rounded-lg p-3 border border-gray-200 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-semibold text-sm">
                              {s.firstName?.[0]}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800 text-sm">{s.firstName} {s.lastName}</p>
                              <p className="text-xs text-gray-500">{s.designation || 'No designation'}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => openAccessModal(s)}
                            className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                          >
                            Enable Login
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===================== MODALS ===================== */}

      {/* Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingItem ? 'Edit Department' : 'Add Department'}
                </h3>
                <button onClick={() => setShowDeptModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <form onSubmit={handleDeptSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={deptForm.name}
                    onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                  <input
                    type="text"
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {DEPARTMENT_COLORS.map((color, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDeptForm({ ...deptForm, color })}
                      className={`w-8 h-8 rounded-lg transition-all ${deptForm.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={deptForm.isActive}
                  onChange={(e) => setDeptForm({ ...deptForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowDeptModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Modal */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingItem ? 'Edit Staff Member' : 'Add Staff Member'}
                </h3>
                <button onClick={() => setShowStaffModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <form onSubmit={handleStaffSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={staffForm.firstName}
                    onChange={(e) => setStaffForm({ ...staffForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={staffForm.lastName}
                    onChange={(e) => setStaffForm({ ...staffForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <input
                  type="text"
                  value={staffForm.employeeId}
                  onChange={(e) => setStaffForm({ ...staffForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={staffForm.departmentId}
                    onChange={(e) => setStaffForm({ ...staffForm, departmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select department</option>
                    {allDepartments.filter(d => d.isActive).map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={staffForm.designation}
                    onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })}
                    placeholder="e.g., Senior Accountant"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={staffForm.joiningDate}
                    onChange={(e) => setStaffForm({ ...staffForm, joiningDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={staffForm.status}
                    onChange={(e) => setStaffForm({ ...staffForm, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowStaffModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingItem ? 'Update' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Modal with Permissions */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingItem ? 'Edit Role' : 'Create New Role'}
                </h3>
                <button onClick={() => setShowRoleModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <form onSubmit={handleRoleSubmit} className="flex-1 overflow-hidden flex flex-col">
              <div className="p-6 space-y-4 border-b border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role Name *</label>
                    <input
                      type="text"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                      placeholder="e.g., Accountant"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role Code *</label>
                    <input
                      type="text"
                      value={roleForm.code}
                      onChange={(e) => setRoleForm({ ...roleForm, code: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                      placeholder="e.g., ACCOUNTANT"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={roleForm.description}
                    onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                    placeholder="Brief description of this role"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Permissions Grid */}
              <div className="flex-1 overflow-y-auto p-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Module Permissions
                </h4>
                <div className="space-y-3">
                  {MODULES.map(module => {
                    const ModIcon = module.icon;
                    const modulePerms = roleForm.permissions[module.id] || {};
                    const enabledCount = Object.values(modulePerms).filter(v => v).length;
                    const allEnabled = enabledCount === module.permissions.length;
                    
                    return (
                      <div key={module.id} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                              <ModIcon className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                              <h5 className="font-medium text-gray-800">{module.name}</h5>
                              <p className="text-xs text-gray-500">{enabledCount}/{module.permissions.length} permissions enabled</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleAllModulePermissions(module.id, !allEnabled)}
                            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                              allEnabled 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            }`}
                          >
                            {allEnabled ? 'Disable All' : 'Enable All'}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {module.permissions.map(perm => (
                            <button
                              key={perm}
                              type="button"
                              onClick={() => toggleModulePermission(module.id, perm)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                modulePerms[perm]
                                  ? 'bg-green-100 text-green-700 border border-green-200'
                                  : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {modulePerms[perm] ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                <X className="w-3 h-3" />
                              )}
                              {perm.replace(/_/g, ' ')}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={roleForm.isActive}
                    onChange={(e) => setRoleForm({ ...roleForm, isActive: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm text-gray-700">Active Role</span>
                </label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowRoleModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {editingItem ? 'Update Role' : 'Create Role'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Access Modal */}
      {showAccessModal && editingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">
                  Manage Access for {editingItem.firstName}
                </h3>
                <button onClick={() => setShowAccessModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <form onSubmit={handleAccessSubmit} className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${accessForm.canLogin ? 'bg-green-100' : 'bg-gray-200'}`}>
                    {accessForm.canLogin ? (
                      <Unlock className="w-5 h-5 text-green-600" />
                    ) : (
                      <Lock className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Login Access</p>
                    <p className="text-xs text-gray-500">Allow this staff to login to the system</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAccessForm({ ...accessForm, canLogin: !accessForm.canLogin })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    accessForm.canLogin ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    accessForm.canLogin ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {accessForm.canLogin && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email (Username) *</label>
                    <input
                      type="email"
                      value={accessForm.email}
                      onChange={(e) => setAccessForm({ ...accessForm, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {editingItem.hasPassword ? 'New Password (leave blank to keep current)' : 'Password *'}
                    </label>
                    <input
                      type="password"
                      value={accessForm.password}
                      onChange={(e) => setAccessForm({ ...accessForm, password: e.target.value })}
                      placeholder={editingItem.hasPassword ? '••••••••' : 'Enter password'}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required={!editingItem.hasPassword}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign Role *</label>
                    <select
                      value={accessForm.roleId}
                      onChange={(e) => setAccessForm({ ...accessForm, roleId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Select role</option>
                      {roles.filter(r => !r.isSystem || r.code === 'ADMIN').map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      The assigned role determines what this staff member can access
                    </p>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowAccessModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Delete {showDeleteConfirm.type === 'department' ? 'Department' : showDeleteConfirm.type === 'staff' ? 'Staff Member' : 'Role'}?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{showDeleteConfirm.item.name || showDeleteConfirm.item.firstName}"? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showDeleteConfirm.type === 'department') handleDeleteDept(showDeleteConfirm.item.id);
                  else if (showDeleteConfirm.type === 'staff') handleDeleteStaff(showDeleteConfirm.item.id);
                  else if (showDeleteConfirm.type === 'role') handleDeleteRole(showDeleteConfirm.item.id);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffUsersConfiguration;

