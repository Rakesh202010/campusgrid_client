import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, GraduationCap, BookOpen, Briefcase, UserCheck, UserX,
  Search, Filter, ChevronLeft, RefreshCw, Key, Eye, EyeOff,
  Lock, Unlock, Mail, Phone, Hash, AlertCircle, CheckCircle,
  Shield, Settings, MoreVertical, Copy, Send, X, Loader2, Calendar
} from 'lucide-react';
import { students, teachers, people, academicSessions } from '../services/api';
import { toast } from '../utils/toast';

// User type tabs configuration
const USER_TYPES = [
  { 
    id: 'students', 
    label: 'Students', 
    icon: GraduationCap, 
    color: 'blue',
    bgColor: 'bg-blue-500',
    lightBg: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200'
  },
  { 
    id: 'parents', 
    label: 'Parents', 
    icon: Users, 
    color: 'amber',
    bgColor: 'bg-amber-500',
    lightBg: 'bg-amber-50',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-200'
  },
  { 
    id: 'teachers', 
    label: 'Teachers', 
    icon: BookOpen, 
    color: 'emerald',
    bgColor: 'bg-emerald-500',
    lightBg: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    borderColor: 'border-emerald-200'
  },
  { 
    id: 'staff', 
    label: 'Non-Teaching Staff', 
    icon: Briefcase, 
    color: 'rose',
    bgColor: 'bg-rose-500',
    lightBg: 'bg-rose-50',
    textColor: 'text-rose-600',
    borderColor: 'border-rose-200'
  },
];

const UserLoginManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, enabled, disabled

  // Academic Session states
  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [currentSession, setCurrentSession] = useState(null);

  // Data states
  const [studentsList, setStudentsList] = useState([]);
  const [parentsList, setParentsList] = useState([]);
  const [teachersList, setTeachersList] = useState([]);
  const [staffList, setStaffList] = useState([]);

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Bulk action states
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkPassword, setBulkPassword] = useState('');

  // Fetch academic sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  // Fetch data when session changes
  useEffect(() => {
    if (selectedSessionId) {
      fetchAllData();
    }
  }, [selectedSessionId]);

  const fetchSessions = async () => {
    try {
      const [sessionsRes, currentRes] = await Promise.all([
        academicSessions.getAll(),
        academicSessions.getCurrent()
      ]);

      if (sessionsRes?.success) {
        setSessions(sessionsRes.data || []);
      }
      
      if (currentRes?.success && currentRes.data) {
        setCurrentSession(currentRes.data);
        setSelectedSessionId(currentRes.data.id);
      } else if (sessionsRes?.data?.length > 0) {
        // Fallback to first session if no current
        setSelectedSessionId(sessionsRes.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load academic sessions');
    }
  };

  const fetchAllData = async () => {
    if (!selectedSessionId) return;
    
    setLoading(true);
    try {
      const [studentsRes, parentsRes, teachersRes, staffRes] = await Promise.all([
        students.getAll({ limit: 1000, academic_session_id: selectedSessionId }),
        people.getParents({ limit: 1000, academic_session_id: selectedSessionId }),
        teachers.getAll({ academic_session_id: selectedSessionId }),
        people.getStaff({ limit: 1000 })
      ]);

      if (studentsRes?.success) {
        setStudentsList(studentsRes.data || []);
      }
      if (parentsRes?.success) {
        setParentsList(parentsRes.data || []);
      }
      if (teachersRes?.success) {
        setTeachersList(teachersRes.data || []);
      }
      if (staffRes?.success) {
        setStaffList(staffRes.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentList = () => {
    switch (activeTab) {
      case 'students': return studentsList;
      case 'parents': return parentsList;
      case 'teachers': return teachersList;
      case 'staff': return staffList;
      default: return [];
    }
  };

  const getActiveTabConfig = () => USER_TYPES.find(t => t.id === activeTab);

  // Filter and search
  const filteredList = useMemo(() => {
    let list = getCurrentList();

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(user => {
        const name = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
        const email = (user.email || '').toLowerCase();
        const phone = (user.phone || '').toLowerCase();
        const id = (user.admissionNumber || user.employeeId || user.id || '').toLowerCase();
        return name.includes(term) || email.includes(term) || phone.includes(term) || id.includes(term);
      });
    }

    // Status filter
    if (filterStatus !== 'all') {
      list = list.filter(user => {
        const hasLogin = user.hasLoginAccess || user.canLogin || user.has_login_access || user.can_login;
        return filterStatus === 'enabled' ? hasLogin : !hasLogin;
      });
    }

    return list;
  }, [activeTab, studentsList, parentsList, teachersList, staffList, searchTerm, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const list = getCurrentList();
    const total = list.length;
    const enabled = list.filter(u => u.hasLoginAccess || u.canLogin || u.has_login_access || u.can_login).length;
    return { total, enabled, disabled: total - enabled };
  }, [activeTab, studentsList, parentsList, teachersList, staffList]);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSetPassword = (user) => {
    setSelectedUser({ ...user, userType: activeTab });
    setNewPassword(generatePassword());
    setShowPasswordModal(true);
  };

  const handleSavePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    try {
      let res;
      const userType = selectedUser.userType;

      switch (userType) {
        case 'students':
          res = await people.createStudentLogin(selectedUser.id, newPassword);
          break;
        case 'parents':
          res = await people.createParentLogin(selectedUser.id, newPassword);
          break;
        case 'teachers':
          res = await teachers.createLogin(selectedUser.id, { 
            username: selectedUser.email || selectedUser.employeeId, 
            password: newPassword 
          });
          break;
        case 'staff':
          res = await people.updateStaffAccess(selectedUser.id, {
            canLogin: true,
            password: newPassword
          });
          break;
      }

      if (res?.success) {
        toast.success(`Login credentials set for ${selectedUser.firstName} ${selectedUser.lastName}`);
        setShowPasswordModal(false);
        setSelectedUser(null);
        setNewPassword('');
        fetchAllData(); // Refresh list
      } else {
        toast.error(res?.message || 'Failed to set password');
      }
    } catch (error) {
      console.error('Error setting password:', error);
      toast.error('Failed to set password');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAccess = async (user, enable) => {
    try {
      let res;
      switch (activeTab) {
        case 'teachers':
          res = await teachers.toggleLoginAccess(user.id, enable);
          break;
        case 'staff':
          res = await people.toggleStaffLogin(user.id, enable);
          break;
        default:
          // For students and parents, we need to update their access
          toast.info('Use "Set Password" to enable login for this user');
          return;
      }

      if (res?.success) {
        toast.success(`Login ${enable ? 'enabled' : 'disabled'} for ${user.firstName} ${user.lastName}`);
        fetchAllData();
      } else {
        toast.error(res?.message || 'Failed to update access');
      }
    } catch (error) {
      console.error('Error toggling access:', error);
      toast.error('Failed to update access');
    }
  };

  const handleBulkSetPassword = async () => {
    if (!bulkPassword || bulkPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);
    let success = 0;
    let failed = 0;

    for (const userId of selectedUsers) {
      try {
        let res;
        switch (activeTab) {
          case 'students':
            res = await people.createStudentLogin(userId, bulkPassword);
            break;
          case 'parents':
            res = await people.createParentLogin(userId, bulkPassword);
            break;
          case 'teachers':
            const teacher = teachersList.find(t => t.id === userId);
            res = await teachers.createLogin(userId, { 
              username: teacher?.email || teacher?.employeeId, 
              password: bulkPassword 
            });
            break;
          case 'staff':
            res = await people.updateStaffAccess(userId, {
              canLogin: true,
              password: bulkPassword
            });
            break;
        }
        if (res?.success) success++;
        else failed++;
      } catch (e) {
        failed++;
      }
    }

    toast.success(`Login enabled for ${success} users${failed > 0 ? `, ${failed} failed` : ''}`);
    setShowBulkModal(false);
    setBulkPassword('');
    setSelectedUsers([]);
    fetchAllData();
    setSaving(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const tabConfig = getActiveTabConfig();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/settings')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Shield className="w-7 h-7" />
                User Login Management
              </h1>
              <p className="text-white/80 mt-1">
                Enable login access and set passwords for students, parents, teachers, and staff
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Academic Session Selector */}
              <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
                <Calendar className="w-4 h-4" />
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="bg-transparent border-none text-white focus:outline-none text-sm font-medium cursor-pointer"
                >
                  {sessions.map(session => (
                    <option key={session.id} value={session.id} className="text-gray-900">
                      {session.name} {session.isCurrent && '(Current)'}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={fetchAllData}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* User Type Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-6">
          <div className="flex gap-2 overflow-x-auto">
            {USER_TYPES.map(type => {
              const Icon = type.icon;
              const isActive = activeTab === type.id;
              const count = type.id === 'students' ? studentsList.length :
                           type.id === 'parents' ? parentsList.length :
                           type.id === 'teachers' ? teachersList.length : staffList.length;
              
              return (
                <button
                  key={type.id}
                  onClick={() => {
                    setActiveTab(type.id);
                    setSelectedUsers([]);
                    setSearchTerm('');
                  }}
                  className={`flex items-center gap-3 px-5 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? `${type.bgColor} text-white shadow-lg`
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{type.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    isActive ? 'bg-white/20' : 'bg-gray-200'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`${tabConfig?.lightBg} rounded-xl p-4 border ${tabConfig?.borderColor}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total {tabConfig?.label}</p>
                <p className={`text-3xl font-bold ${tabConfig?.textColor}`}>{stats.total}</p>
              </div>
              <div className={`w-12 h-12 ${tabConfig?.bgColor} rounded-xl flex items-center justify-center text-white`}>
                {tabConfig && <tabConfig.icon className="w-6 h-6" />}
              </div>
            </div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Login Enabled</p>
                <p className="text-3xl font-bold text-emerald-600">{stats.enabled}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Login Disabled</p>
                <p className="text-3xl font-bold text-gray-600">{stats.disabled}</p>
              </div>
              <div className="w-12 h-12 bg-gray-400 rounded-xl flex items-center justify-center text-white">
                <UserX className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${tabConfig?.label.toLowerCase()} by name, email, phone, ID...`}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                <option value="all">All Status</option>
                <option value="enabled">Login Enabled</option>
                <option value="disabled">Login Disabled</option>
              </select>
              {selectedUsers.length > 0 && (
                <button
                  onClick={() => {
                    setBulkPassword(generatePassword());
                    setShowBulkModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  <Key className="w-4 h-4" />
                  Set Password ({selectedUsers.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredList.length && filteredList.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers(filteredList.map(u => u.id));
                        } else {
                          setSelectedUsers([]);
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">
                    {activeTab === 'students' ? 'Student' : activeTab === 'parents' ? 'Parent' : activeTab === 'teachers' ? 'Teacher' : 'Staff'}
                  </th>
                  {activeTab === 'parents' && (
                    <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">Linked Students</th>
                  )}
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">Contact</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-600">ID</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-gray-600">Login Status</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'parents' ? 7 : 6} className="px-4 py-12 text-center text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-lg font-medium">No {tabConfig?.label.toLowerCase()} found</p>
                      <p className="text-sm">Try adjusting your search or filter</p>
                    </td>
                  </tr>
                ) : (
                  filteredList.map(user => {
                    const hasLogin = user.hasLoginAccess || user.canLogin || user.has_login_access || user.can_login;
                    const isSelected = selectedUsers.includes(user.id);
                    
                    return (
                      <tr key={user.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-indigo-50' : ''}`}>
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full ${tabConfig?.bgColor} flex items-center justify-center text-white font-bold`}>
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </p>
                              {activeTab === 'students' && user.className && (
                                <p className="text-sm text-gray-500">{user.className}</p>
                              )}
                              {activeTab === 'parents' && user.relationship && (
                                <p className="text-sm text-gray-500 capitalize">{user.relationship}</p>
                              )}
                              {(activeTab === 'teachers' || activeTab === 'staff') && user.designation && (
                                <p className="text-sm text-gray-500">{user.designation}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* Linked Students column for Parents tab */}
                        {activeTab === 'parents' && (
                          <td className="px-4 py-4">
                            {user.students && user.students.length > 0 ? (
                              <div className="space-y-2">
                                {user.students.map((student, idx) => (
                                  <div key={student.id || idx} className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                                      {student.firstName?.[0]}{student.lastName?.[0]}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {student.fullName || `${student.firstName} ${student.lastName || ''}`}
                                      </p>
                                      <div className="flex items-center gap-2 text-xs text-gray-500">
                                        {student.className && <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{student.className}</span>}
                                        {student.admissionNumber && <span>#{student.admissionNumber}</span>}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 italic">No students linked</span>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            {user.email && (
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {user.email}
                              </p>
                            )}
                            {user.phone && (
                              <p className="text-sm text-gray-500 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {user.phone}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            {user.admissionNumber || user.employeeId || user.id?.slice(0, 8)}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {hasLogin ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                              <CheckCircle className="w-4 h-4" />
                              Enabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                              <AlertCircle className="w-4 h-4" />
                              Disabled
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleSetPassword(user)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                              title="Set Password"
                            >
                              <Key className="w-4 h-4" />
                              {hasLogin ? 'Reset' : 'Enable'}
                            </button>
                            {hasLogin && (activeTab === 'teachers' || activeTab === 'staff') && (
                              <button
                                onClick={() => handleToggleAccess(user, false)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                                title="Disable Login"
                              >
                                <Lock className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-100">
          <h3 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            How User Login Works
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-indigo-800">
            <div>
              <p className="font-medium mb-1">Students</p>
              <ul className="list-disc list-inside space-y-1 text-indigo-700">
                <li>Login with Email or Admission Number</li>
                <li>Use the password set by admin</li>
                <li>Access Student Dashboard</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Parents</p>
              <ul className="list-disc list-inside space-y-1 text-indigo-700">
                <li>Login with Email or Phone Number</li>
                <li>Use the password set by admin</li>
                <li>Access Parent Dashboard, view children</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Teachers</p>
              <ul className="list-disc list-inside space-y-1 text-indigo-700">
                <li>Login with Email or Employee ID</li>
                <li>Use the password set by admin</li>
                <li>Access Teacher Dashboard, attendance, exams</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">Non-Teaching Staff</p>
              <ul className="list-disc list-inside space-y-1 text-indigo-700">
                <li>Login with Email or Employee ID</li>
                <li>Access based on assigned RBAC role</li>
                <li>Configured in Staff & Users settings</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Set Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Set Login Password</h2>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setSelectedUser(null);
                    setNewPassword('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className={`w-12 h-12 rounded-full ${tabConfig?.bgColor} flex items-center justify-center text-white font-bold`}>
                  {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedUser.email || selectedUser.phone || selectedUser.admissionNumber || selectedUser.employeeId}
                  </p>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temporary Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 pr-24"
                    placeholder="Enter password"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(newPassword)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                      title="Copy password"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setNewPassword(generatePassword())}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Generate new password
                </button>
              </div>

              {/* Info */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <p className="font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Important
                </p>
                <p className="mt-1">
                  Share this password with the user securely. They can change it after first login.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setSelectedUser(null);
                  setNewPassword('');
                }}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePassword}
                disabled={saving || !newPassword}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Set Password & Enable Login
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Password Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Bulk Set Password</h2>
                <button
                  onClick={() => {
                    setShowBulkModal(false);
                    setBulkPassword('');
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl">
                <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                  {selectedUsers.length}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {selectedUsers.length} {tabConfig?.label} Selected
                  </p>
                  <p className="text-sm text-gray-500">
                    Same password will be set for all
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password for all users
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={bulkPassword}
                    onChange={(e) => setBulkPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 pr-24"
                    placeholder="Enter password"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(bulkPassword)}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBulkPassword(generatePassword())}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Generate new password
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
                <p className="font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Bulk Action Warning
                </p>
                <p className="mt-1">
                  This will set the same password for {selectedUsers.length} users. 
                  Make sure to distribute passwords securely.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkPassword('');
                }}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkSetPassword}
                disabled={saving || !bulkPassword}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Enable Login for All
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserLoginManagement;

