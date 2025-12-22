import { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus,
  UserCog,
  Shield,
  Plus, 
  Edit2, 
  Trash2, 
  X,
  Loader2,
  Phone,
  Mail,
  Building,
  Briefcase,
  Search,
  GraduationCap,
  Calendar,
  MapPin,
  IndianRupee,
  CheckCircle,
  XCircle,
  ChevronDown,
  Eye
} from 'lucide-react';
import { people, teachers, classConfig, subjects as subjectsApi } from '../services/api';
import { toast } from '../utils/toast';

const DEPARTMENTS = [
  'Science', 'Mathematics', 'English', 'Hindi', 'Social Science', 
  'Computer Science', 'Physical Education', 'Arts', 'Commerce', 
  'Languages', 'Music', 'Administration', 'Other'
];

const DESIGNATIONS = [
  'Principal', 'Vice Principal', 'Head of Department', 'Senior Teacher',
  'Teacher', 'Assistant Teacher', 'Trainee Teacher', 'Guest Faculty'
];

const QUALIFICATIONS = [
  'Ph.D.', 'M.Phil', 'M.Ed', 'M.A.', 'M.Sc.', 'M.Com', 'MBA', 
  'B.Ed', 'B.A.', 'B.Sc.', 'B.Com', 'BCA', 'MCA', 'B.Tech', 'M.Tech', 'Other'
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const ROLE_ICONS = {
  TEACHER: '👨‍🏫',
  STAFF: '👷',
  ACCOUNTANT: '💼',
  TRANSPORT_MGR: '🚌',
};

const ROLE_COLORS = {
  TEACHER: 'bg-blue-100 text-blue-700 border-blue-200',
  STAFF: 'bg-purple-100 text-purple-700 border-purple-200',
  ACCOUNTANT: 'bg-amber-100 text-amber-700 border-amber-200',
  TRANSPORT_MGR: 'bg-orange-100 text-orange-700 border-orange-200',
};

const PeopleConfiguration = () => {
  const [activeTab, setActiveTab] = useState('teachers');
  
  // Data state
  const [roles, setRoles] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [staff, setStaff] = useState([]);
  const [teacherStats, setTeacherStats] = useState(null);
  const [classSections, setClassSections] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showTeacherDetails, setShowTeacherDetails] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [formStep, setFormStep] = useState(1);

  // Form states
  const [roleForm, setRoleForm] = useState({
    name: '', code: '', description: '', permissions: [], isActive: true
  });

  const [teacherForm, setTeacherForm] = useState({
    employeeId: '', firstName: '', lastName: '', email: '', phone: '', alternatePhone: '',
    dateOfBirth: '', gender: '', bloodGroup: '', nationality: 'Indian', religion: '', maritalStatus: '',
    qualification: '', specialization: '', experience: '', joiningDate: '',
    address: '', city: '', state: '', pincode: '',
    emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: '',
    department: '', designation: '', employmentType: 'permanent', subjects: [],
    salary: '', bankAccountNo: '', bankName: '', ifscCode: '', panNumber: '', aadharNumber: '',
    isClassTeacher: false, classTeacherOf: '', canTakeAttendance: true, canManageExams: true
  });

  const [staffForm, setStaffForm] = useState({
    employeeId: '', firstName: '', lastName: '', email: '', phone: '',
    roleId: '', department: '', designation: '', dateOfJoining: '',
    gender: '', address: '', city: '', state: '', pincode: '', salary: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesRes, teachersRes, staffRes, statsRes, classRes, subjectsRes] = await Promise.all([
        people.getRoles(),
        teachers.getAll(),
        people.getStaff(),
        teachers.getStats(),
        classConfig.getClassSections(),
        subjectsApi.getAll()
      ]);

      if (rolesRes?.success) setRoles(rolesRes.data || []);
      if (teachersRes?.success) setTeachersList(teachersRes.data || []);
      if (staffRes?.success) setStaff(staffRes.data || []);
      if (statsRes?.success) setTeacherStats(statsRes.data);
      if (classRes?.success) setClassSections(classRes.data || []);
      if (subjectsRes?.success) setSubjectsList(subjectsRes.data || []);
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
        name: role.name, code: role.code, description: role.description || '',
        permissions: role.permissions || [], isActive: role.isActive
      });
    } else {
      setEditingItem(null);
      setRoleForm({ name: '', code: '', description: '', permissions: [], isActive: true });
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
      } else {
        toast.error(response?.message || 'Failed to delete');
      }
    } catch (error) {
      toast.error('Failed to delete role');
    }
  };

  // Teacher handlers
  const openTeacherModal = (teacher = null) => {
    setFormStep(1);
    if (teacher) {
      setEditingItem(teacher);
      setTeacherForm({
        employeeId: teacher.employeeId || '', firstName: teacher.firstName || '',
        lastName: teacher.lastName || '', email: teacher.email || '', phone: teacher.phone || '',
        alternatePhone: teacher.alternatePhone || '', dateOfBirth: teacher.dateOfBirth?.split('T')[0] || '',
        gender: teacher.gender || '', bloodGroup: teacher.bloodGroup || '',
        nationality: teacher.nationality || 'Indian', religion: teacher.religion || '',
        maritalStatus: teacher.maritalStatus || '', qualification: teacher.qualification || '',
        specialization: teacher.specialization || '', experience: teacher.experience || '',
        joiningDate: teacher.joiningDate?.split('T')[0] || '', address: teacher.address || '',
        city: teacher.city || '', state: teacher.state || '', pincode: teacher.pincode || '',
        emergencyContactName: teacher.emergencyContactName || '',
        emergencyContactPhone: teacher.emergencyContactPhone || '',
        emergencyContactRelation: teacher.emergencyContactRelation || '',
        department: teacher.department || '', designation: teacher.designation || '',
        employmentType: teacher.employmentType || 'permanent', subjects: teacher.subjects || [],
        salary: teacher.salary || '', bankAccountNo: teacher.bankAccountNo || '',
        bankName: teacher.bankName || '', ifscCode: teacher.ifscCode || '',
        panNumber: teacher.panNumber || '', aadharNumber: teacher.aadharNumber || '',
        isClassTeacher: teacher.isClassTeacher || false, classTeacherOf: teacher.classTeacherOf || '',
        canTakeAttendance: teacher.canTakeAttendance !== false, canManageExams: teacher.canManageExams !== false
      });
    } else {
      setEditingItem(null);
      setTeacherForm({
        employeeId: '', firstName: '', lastName: '', email: '', phone: '', alternatePhone: '',
        dateOfBirth: '', gender: '', bloodGroup: '', nationality: 'Indian', religion: '', maritalStatus: '',
        qualification: '', specialization: '', experience: '', joiningDate: '',
        address: '', city: '', state: '', pincode: '',
        emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelation: '',
        department: '', designation: '', employmentType: 'permanent', subjects: [],
        salary: '', bankAccountNo: '', bankName: '', ifscCode: '', panNumber: '', aadharNumber: '',
        isClassTeacher: false, classTeacherOf: '', canTakeAttendance: true, canManageExams: true
      });
    }
    setShowTeacherModal(true);
  };

  const handleTeacherSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...teacherForm,
        experience: teacherForm.experience ? parseInt(teacherForm.experience) : null,
        salary: teacherForm.salary ? parseFloat(teacherForm.salary) : null,
        classTeacherOf: teacherForm.isClassTeacher ? teacherForm.classTeacherOf : null
      };

      let response;
      if (editingItem) {
        response = await teachers.update(editingItem.id, data);
      } else {
        response = await teachers.create(data);
      }

      if (response?.success) {
        toast.success(editingItem ? 'Teacher updated' : 'Teacher added');
        setShowTeacherModal(false);
        fetchData();
      } else {
        toast.error(response?.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Failed to save teacher');
    }
  };

  const handleDeleteTeacher = async (id) => {
    try {
      const response = await teachers.delete(id);
      if (response?.success) {
        toast.success('Teacher deleted');
        setShowDeleteConfirm(null);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to delete teacher');
    }
  };

  // Staff handlers
  const openStaffModal = (member = null) => {
    if (member) {
      setEditingItem(member);
      setStaffForm({
        employeeId: member.employeeId || '', firstName: member.firstName,
        lastName: member.lastName || '', email: member.email || '', phone: member.phone || '',
        roleId: member.roleId || '', department: member.department || '',
        designation: member.designation || '', dateOfJoining: member.dateOfJoining?.split('T')[0] || '',
        gender: member.gender || '', address: member.address || '',
        city: member.city || '', state: member.state || '', pincode: member.pincode || '',
        salary: member.salary || ''
      });
    } else {
      setEditingItem(null);
      setStaffForm({
        employeeId: '', firstName: '', lastName: '', email: '', phone: '',
        roleId: '', department: '', designation: '', dateOfJoining: '',
        gender: '', address: '', city: '', state: '', pincode: '', salary: ''
      });
    }
    setShowStaffModal(true);
  };

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...staffForm,
        salary: staffForm.salary ? parseFloat(staffForm.salary) : null
      };

      let response;
      if (editingItem) {
        response = await people.updateStaff(editingItem.id, data);
      } else {
        response = await people.createStaff(data);
      }

      if (response?.success) {
        toast.success(editingItem ? 'Staff updated' : 'Staff added');
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

  // Filtered data
  const filteredTeachers = teachersList.filter(t => {
    const matchesSearch = searchTerm === '' || 
      t.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === '' || t.department === filterDept;
    return matchesSearch && matchesDept;
  });

  const filteredStaff = staff.filter(s => {
    return searchTerm === '' || 
      s.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const tabs = [
    { id: 'teachers', label: 'Teachers', icon: GraduationCap, count: teachersList.length },
    { id: 'staff', label: 'Staff Members', icon: UserCog, count: staff.length },
    { id: 'roles', label: 'User Roles', icon: Shield, count: roles.length },
  ];

  const formSteps = [
    { id: 1, label: 'Basic Info' },
    { id: 2, label: 'Professional' },
    { id: 3, label: 'Contact & Address' },
    { id: 4, label: 'Bank & Permissions' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">People & User Configuration</h1>
        <p className="text-gray-600 mt-1">Manage teachers, staff members, and user roles</p>
      </div>

      {/* Stats Cards */}
      {teacherStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-blue-100 text-sm">Total Teachers</p>
                <p className="text-2xl font-bold">{teacherStats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-green-100 text-sm">Active</p>
                <p className="text-2xl font-bold">{teacherStats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-purple-100 text-sm">Class Teachers</p>
                <p className="text-2xl font-bold">{teacherStats.classTeachers}</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <UserCog className="w-6 h-6" />
              </div>
              <div>
                <p className="text-amber-100 text-sm">Staff Members</p>
                <p className="text-2xl font-bold">{staff.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearchTerm(''); setFilterDept(''); }}
            className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            <span className={`px-2 py-0.5 text-xs rounded-full ${
              activeTab === tab.id ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* TEACHERS TAB */}
      {activeTab === 'teachers' && (
        <div className="card">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Teachers</h3>
              <p className="text-sm text-gray-500 mt-1">Manage teaching staff with complete details</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search teachers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
                />
              </div>
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Departments</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <button
                onClick={() => openTeacherModal()}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700"
              >
                <UserPlus className="w-4 h-4" />
                Add Teacher
              </button>
            </div>
          </div>

          {filteredTeachers.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Teachers</h3>
              <p className="text-gray-600">Add teachers to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Teacher</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Department</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Contact</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Class Teacher</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeachers.map(teacher => (
                    <tr key={teacher.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {teacher.firstName?.[0]}{teacher.lastName?.[0] || ''}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{teacher.fullName}</p>
                            <p className="text-xs text-gray-500">{teacher.employeeId || 'No ID'} • {teacher.designation || 'Teacher'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm text-gray-800">{teacher.department || '-'}</p>
                          <p className="text-xs text-gray-500">{teacher.qualification || ''}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          {teacher.phone && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Phone className="w-3 h-3" /> {teacher.phone}
                            </div>
                          )}
                          {teacher.email && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Mail className="w-3 h-3" /> {teacher.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {teacher.isClassTeacher ? (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                            {teacher.classTeacherOfName || 'Assigned'}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          teacher.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {teacher.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setShowTeacherDetails(teacher)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openTeacherModal(teacher)}
                          className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm({ type: 'teacher', item: teacher })}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
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

      {/* STAFF MEMBERS TAB */}
      {activeTab === 'staff' && (
        <div className="card">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Staff Members</h3>
              <p className="text-sm text-gray-500 mt-1">Manage accountants, transport managers, and other staff</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 w-64"
                />
              </div>
              <button
                onClick={() => openStaffModal()}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700"
              >
                <UserPlus className="w-4 h-4" />
                Add Staff
              </button>
            </div>
          </div>

          {filteredStaff.length === 0 ? (
            <div className="text-center py-12">
              <UserCog className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Staff Members</h3>
              <p className="text-gray-600">Add staff members to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStaff.map(member => (
                <div key={member.id} className="p-4 border-2 border-gray-200 rounded-xl hover:border-purple-200 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-600 font-medium">
                          {member.firstName?.[0]}{member.lastName?.[0] || ''}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">{member.fullName}</h4>
                        <p className="text-xs text-gray-500">{member.employeeId || 'No ID'}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openStaffModal(member)}
                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm({ type: 'staff', item: member })}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      ROLE_COLORS[member.roleCode] || 'bg-gray-100 text-gray-600'
                    }`}>
                      {member.roleName || 'Unassigned'}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1 text-sm">
                    {member.department && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building className="w-3 h-3" /> {member.department}
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-3 h-3" /> {member.phone}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* USER ROLES TAB */}
      {activeTab === 'roles' && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">User Roles</h3>
              <p className="text-sm text-gray-500 mt-1">Define roles and permissions for users</p>
            </div>
            <button
              onClick={() => openRoleModal()}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="w-4 h-4" />
              Add Custom Role
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.filter(r => r.code !== 'PARENT').map(role => (
              <div
                key={role.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  role.isSystem ? 'bg-gray-50 border-gray-200' : 'border-purple-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                      ROLE_COLORS[role.code] || 'bg-gray-100'
                    }`}>
                      {ROLE_ICONS[role.code] || '👤'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">{role.name}</h4>
                      <p className="text-xs text-gray-500">{role.code}</p>
                    </div>
                  </div>
                  {!role.isSystem && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => openRoleModal(role)}
                        className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm({ type: 'role', item: role })}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                {role.description && (
                  <p className="text-sm text-gray-600 mt-3">{role.description}</p>
                )}
                <div className="mt-3 flex items-center gap-2">
                  {role.isSystem && (
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">System</span>
                  )}
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    role.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {role.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TEACHER MODAL - Multi-step form */}
      {showTeacherModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingItem ? 'Edit Teacher' : 'Add New Teacher'}
                </h3>
                <button onClick={() => setShowTeacherModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              {/* Step indicators */}
              <div className="flex items-center gap-2 mt-4">
                {formSteps.map((step, idx) => (
                  <button
                    key={step.id}
                    onClick={() => setFormStep(step.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                      formStep === step.id
                        ? 'bg-blue-600 text-white'
                        : formStep > step.id
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">
                      {formStep > step.id ? '✓' : step.id}
                    </span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <form onSubmit={handleTeacherSubmit} className="flex-1 overflow-y-auto p-6">
              {/* Step 1: Basic Info */}
              {formStep === 1 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 mb-3">Personal Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input type="text" value={teacherForm.firstName}
                        onChange={(e) => setTeacherForm({ ...teacherForm, firstName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input type="text" value={teacherForm.lastName}
                        onChange={(e) => setTeacherForm({ ...teacherForm, lastName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                      <input type="text" value={teacherForm.employeeId}
                        onChange={(e) => setTeacherForm({ ...teacherForm, employeeId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select value={teacherForm.gender}
                        onChange={(e) => setTeacherForm({ ...teacherForm, gender: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input type="date" value={teacherForm.dateOfBirth}
                        onChange={(e) => setTeacherForm({ ...teacherForm, dateOfBirth: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                      <select value={teacherForm.bloodGroup}
                        onChange={(e) => setTeacherForm({ ...teacherForm, bloodGroup: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select</option>
                        {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                      <select value={teacherForm.maritalStatus}
                        onChange={(e) => setTeacherForm({ ...teacherForm, maritalStatus: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select</option>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="divorced">Divorced</option>
                        <option value="widowed">Widowed</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                      <input type="text" value={teacherForm.nationality}
                        onChange={(e) => setTeacherForm({ ...teacherForm, nationality: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                      <input type="text" value={teacherForm.religion}
                        onChange={(e) => setTeacherForm({ ...teacherForm, religion: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Professional Details */}
              {formStep === 2 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 mb-3">Professional Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                      <select value={teacherForm.department}
                        onChange={(e) => setTeacherForm({ ...teacherForm, department: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select Department</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                      <select value={teacherForm.designation}
                        onChange={(e) => setTeacherForm({ ...teacherForm, designation: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select Designation</option>
                        {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
                      <select value={teacherForm.qualification}
                        onChange={(e) => setTeacherForm({ ...teacherForm, qualification: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select Qualification</option>
                        {QUALIFICATIONS.map(q => <option key={q} value={q}>{q}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                      <input type="text" value={teacherForm.specialization} placeholder="e.g., Physics, Algebra"
                        onChange={(e) => setTeacherForm({ ...teacherForm, specialization: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Experience (Years)</label>
                      <input type="number" value={teacherForm.experience} min="0"
                        onChange={(e) => setTeacherForm({ ...teacherForm, experience: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                      <input type="date" value={teacherForm.joiningDate}
                        onChange={(e) => setTeacherForm({ ...teacherForm, joiningDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                      <select value={teacherForm.employmentType}
                        onChange={(e) => setTeacherForm({ ...teacherForm, employmentType: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="permanent">Permanent</option>
                        <option value="contract">Contract</option>
                        <option value="part-time">Part-time</option>
                        <option value="guest">Guest Faculty</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" checked={teacherForm.isClassTeacher}
                        onChange={(e) => setTeacherForm({ ...teacherForm, isClassTeacher: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded" />
                      <div>
                        <span className="font-medium text-gray-700">Is Class Teacher</span>
                        <p className="text-sm text-gray-500">Assign this teacher as a class teacher</p>
                      </div>
                    </label>
                  </div>
                  {teacherForm.isClassTeacher && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class Teacher Of</label>
                      <select value={teacherForm.classTeacherOf}
                        onChange={(e) => setTeacherForm({ ...teacherForm, classTeacherOf: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Select Class-Section</option>
                        {classSections.map(cs => (
                          <option key={cs.id} value={cs.id}>{cs.className} - {cs.sectionName}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Contact & Address */}
              {formStep === 3 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 mb-3">Contact Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" value={teacherForm.email}
                        onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input type="tel" value={teacherForm.phone}
                        onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Phone</label>
                    <input type="tel" value={teacherForm.alternatePhone}
                      onChange={(e) => setTeacherForm({ ...teacherForm, alternatePhone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <h4 className="font-medium text-gray-700 mt-6 mb-3">Address</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea value={teacherForm.address} rows={2}
                      onChange={(e) => setTeacherForm({ ...teacherForm, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input type="text" value={teacherForm.city}
                        onChange={(e) => setTeacherForm({ ...teacherForm, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <input type="text" value={teacherForm.state}
                        onChange={(e) => setTeacherForm({ ...teacherForm, state: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                      <input type="text" value={teacherForm.pincode}
                        onChange={(e) => setTeacherForm({ ...teacherForm, pincode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <h4 className="font-medium text-gray-700 mt-6 mb-3">Emergency Contact</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                      <input type="text" value={teacherForm.emergencyContactName}
                        onChange={(e) => setTeacherForm({ ...teacherForm, emergencyContactName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                      <input type="tel" value={teacherForm.emergencyContactPhone}
                        onChange={(e) => setTeacherForm({ ...teacherForm, emergencyContactPhone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                      <input type="text" value={teacherForm.emergencyContactRelation} placeholder="e.g., Spouse, Parent"
                        onChange={(e) => setTeacherForm({ ...teacherForm, emergencyContactRelation: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Bank & Permissions */}
              {formStep === 4 && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700 mb-3">Salary & Bank Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary (₹)</label>
                      <input type="number" value={teacherForm.salary}
                        onChange={(e) => setTeacherForm({ ...teacherForm, salary: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
                      <input type="text" value={teacherForm.bankName}
                        onChange={(e) => setTeacherForm({ ...teacherForm, bankName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                      <input type="text" value={teacherForm.bankAccountNo}
                        onChange={(e) => setTeacherForm({ ...teacherForm, bankAccountNo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
                      <input type="text" value={teacherForm.ifscCode}
                        onChange={(e) => setTeacherForm({ ...teacherForm, ifscCode: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <h4 className="font-medium text-gray-700 mt-6 mb-3">Identity Documents</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                      <input type="text" value={teacherForm.panNumber}
                        onChange={(e) => setTeacherForm({ ...teacherForm, panNumber: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
                      <input type="text" value={teacherForm.aadharNumber}
                        onChange={(e) => setTeacherForm({ ...teacherForm, aadharNumber: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                  </div>
                  <h4 className="font-medium text-gray-700 mt-6 mb-3">Permissions</h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" checked={teacherForm.canTakeAttendance}
                        onChange={(e) => setTeacherForm({ ...teacherForm, canTakeAttendance: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded" />
                      <div>
                        <span className="font-medium text-gray-700">Can Take Attendance</span>
                        <p className="text-sm text-gray-500">Allow this teacher to mark student attendance</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" checked={teacherForm.canManageExams}
                        onChange={(e) => setTeacherForm({ ...teacherForm, canManageExams: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded" />
                      <div>
                        <span className="font-medium text-gray-700">Can Manage Exams</span>
                        <p className="text-sm text-gray-500">Allow this teacher to enter marks and manage exams</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </form>
            {/* Footer with navigation */}
            <div className="p-6 border-t border-gray-200 flex justify-between">
              <button
                type="button"
                onClick={() => formStep > 1 ? setFormStep(formStep - 1) : setShowTeacherModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                {formStep > 1 ? 'Previous' : 'Cancel'}
              </button>
              <div className="flex gap-3">
                {formStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setFormStep(formStep + 1)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleTeacherSubmit}
                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700"
                  >
                    {editingItem ? 'Update Teacher' : 'Add Teacher'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TEACHER DETAILS MODAL */}
      {showTeacherDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">Teacher Details</h3>
                <button onClick={() => setShowTeacherDetails(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-3xl text-blue-600 font-bold">
                    {showTeacherDetails.firstName?.[0]}{showTeacherDetails.lastName?.[0] || ''}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-gray-800">{showTeacherDetails.fullName}</h4>
                  <p className="text-gray-500">{showTeacherDetails.designation || 'Teacher'} • {showTeacherDetails.department || 'N/A'}</p>
                  <p className="text-sm text-gray-400">Employee ID: {showTeacherDetails.employeeId || 'N/A'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium">{showTeacherDetails.email || 'N/A'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Phone</p>
                  <p className="font-medium">{showTeacherDetails.phone || 'N/A'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Qualification</p>
                  <p className="font-medium">{showTeacherDetails.qualification || 'N/A'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Experience</p>
                  <p className="font-medium">{showTeacherDetails.experience ? `${showTeacherDetails.experience} years` : 'N/A'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Joining Date</p>
                  <p className="font-medium">{showTeacherDetails.joiningDate ? new Date(showTeacherDetails.joiningDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Employment Type</p>
                  <p className="font-medium capitalize">{showTeacherDetails.employmentType || 'N/A'}</p>
                </div>
                {showTeacherDetails.isClassTeacher && (
                  <div className="p-3 bg-green-50 rounded-lg col-span-2">
                    <p className="text-green-600 font-medium">Class Teacher of: {showTeacherDetails.classTeacherOfName || 'Assigned'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROLE MODAL */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingItem ? 'Edit Role' : 'Add Custom Role'}
                </h3>
                <button onClick={() => setShowRoleModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <form onSubmit={handleRoleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input type="text" value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                  <input type="text" value={roleForm.code}
                    onChange={(e) => setRoleForm({ ...roleForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" required disabled={!!editingItem} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700">
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STAFF MODAL */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">
                  {editingItem ? 'Edit Staff Member' : 'Add Staff Member'}
                </h3>
                <button onClick={() => setShowStaffModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <form onSubmit={handleStaffSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input type="text" value={staffForm.firstName}
                    onChange={(e) => setStaffForm({ ...staffForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" value={staffForm.lastName}
                    onChange={(e) => setStaffForm({ ...staffForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                  <input type="text" value={staffForm.employeeId}
                    onChange={(e) => setStaffForm({ ...staffForm, employeeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select value={staffForm.roleId}
                    onChange={(e) => setStaffForm({ ...staffForm, roleId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="">Select Role</option>
                    {roles.filter(r => !['TEACHER', 'PARENT'].includes(r.code)).map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select value={staffForm.department}
                    onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="">Select Department</option>
                    {['Administration', 'Finance', 'Transport', 'Maintenance', 'Security', 'IT', 'Other'].map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                  <input type="text" value={staffForm.designation}
                    onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={staffForm.phone}
                    onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Joining</label>
                  <input type="date" value={staffForm.dateOfJoining}
                    onChange={(e) => setStaffForm({ ...staffForm, dateOfJoining: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select value={staffForm.gender}
                    onChange={(e) => setStaffForm({ ...staffForm, gender: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary (₹)</label>
                  <input type="number" value={staffForm.salary}
                    onChange={(e) => setStaffForm({ ...staffForm, salary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowStaffModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700">
                  {editingItem ? 'Update' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this?</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button onClick={() => {
                  if (showDeleteConfirm.type === 'role') handleDeleteRole(showDeleteConfirm.item.id);
                  else if (showDeleteConfirm.type === 'staff') handleDeleteStaff(showDeleteConfirm.item.id);
                  else if (showDeleteConfirm.type === 'teacher') handleDeleteTeacher(showDeleteConfirm.item.id);
                }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PeopleConfiguration;
