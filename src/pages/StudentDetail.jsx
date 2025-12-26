import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User, Phone, Mail, MapPin, Calendar, GraduationCap, Users, FileText,
  Heart, Bus, Building, ChevronLeft, Edit, Save, X, RefreshCw,
  BookOpen, IndianRupee, Clock, Award, AlertCircle, CheckCircle,
  Camera, Trash2, Plus, UserCheck, Home, Briefcase
} from 'lucide-react';
import { students, classConfig, academicSessions } from '../services/api';
import { toast } from '../utils/toast';

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = searchParams.get('mode') === 'edit';

  // State
  const [student, setStudent] = useState(null);
  const [academicMapping, setAcademicMapping] = useState(null);
  const [classSections, setClassSections] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(isEditMode);
  const [activeMenu, setActiveMenu] = useState('personal');
  const [formData, setFormData] = useState(null);

  // Menu items
  const menuItems = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'contact', label: 'Contact Details', icon: Phone },
    { id: 'academic', label: 'Academic', icon: GraduationCap },
    { id: 'parents', label: 'Parents/Guardians', icon: Users },
    { id: 'fees', label: 'Fees & Payments', icon: IndianRupee },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'other', label: 'Other Details', icon: Heart },
  ];

  useEffect(() => {
    fetchStudentData();
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    try {
      const sessionRes = await academicSessions.getCurrent();
      if (sessionRes?.success) {
        setCurrentSession(sessionRes.data);
        const sectionsRes = await classConfig.getClassSections({ academic_session_id: sessionRes.data.id });
        if (sectionsRes?.success) {
          setClassSections(sectionsRes.data || []);
        }
      }
    } catch (e) {
      console.error('Error fetching initial data:', e);
    }
  };

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const [studentRes, mappingRes] = await Promise.all([
        students.getById(id),
        students.getAcademicMapping(id)
      ]);

      if (studentRes?.success) {
        setStudent(studentRes.data);
        setFormData(studentRes.data);
      } else {
        toast.error('Student not found');
        navigate('/students');
        return;
      }

      if (mappingRes?.success) {
        setAcademicMapping(mappingRes.data);
      }
    } catch (e) {
      console.error('Error fetching student:', e);
      toast.error('Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const parts = field.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current = newData;
        for (let i = 0; i < parts.length - 1; i++) {
          current[parts[i]] = { ...current[parts[i]] };
          current = current[parts[i]];
        }
        current[parts[parts.length - 1]] = value;
        return newData;
      });
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSave = async () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error('First name and last name are required');
      return;
    }

    setSaving(true);
    try {
      const res = await students.update(id, formData);
      if (res?.success) {
        toast.success('Student updated successfully');
        setStudent(formData);
        setEditing(false);
        navigate(`/students/${id}`);
      } else {
        toast.error(res?.message || 'Failed to update student');
      }
    } catch (e) {
      toast.error('Failed to update student');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(student);
    setEditing(false);
    navigate(`/students/${id}`);
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700 border-green-200',
      inactive: 'bg-gray-100 text-gray-700 border-gray-200',
      transferred: 'bg-amber-100 text-amber-700 border-amber-200',
      passed_out: 'bg-blue-100 text-blue-700 border-blue-200',
      dropped: 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[status] || colors.active;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-gray-500 text-lg">Student not found</p>
        <button onClick={() => navigate('/students')} className="mt-4 text-teal-600 hover:underline">
          Back to Students
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/students')}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {student.firstName?.[0]}{student.lastName?.[0]}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">{student.fullName}</h1>
                  <div className="flex items-center gap-3 mt-1 text-white/80 text-sm">
                    <span>Adm: {student.admissionNumber || 'N/A'}</span>
                    <span>•</span>
                    <span>Roll: {student.rollNumber || 'N/A'}</span>
                    <span>•</span>
                    <span>{student.className || 'No Class'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(student.status)}`}>
                {student.status}
              </span>
              {editing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-4 py-2 bg-white text-teal-600 rounded-xl font-medium flex items-center gap-2 hover:bg-white/90"
                  >
                    {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setEditing(true);
                    navigate(`/students/${id}?mode=edit`);
                  }}
                  className="px-4 py-2 bg-white text-teal-600 rounded-xl font-medium flex items-center gap-2 hover:bg-white/90"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Menu */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden sticky top-6">
              <nav className="p-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveMenu(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                      activeMenu === item.id
                        ? 'bg-teal-50 text-teal-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              {/* Personal Info */}
              {activeMenu === 'personal' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <User className="w-5 h-5 text-teal-600" />
                    Personal Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">First Name</label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData?.firstName || ''}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                        />
                      ) : (
                        <p className="text-gray-800 font-medium">{student.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Middle Name</label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData?.middleName || ''}
                          onChange={(e) => handleInputChange('middleName', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                        />
                      ) : (
                        <p className="text-gray-800">{student.middleName || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Last Name</label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData?.lastName || ''}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                        />
                      ) : (
                        <p className="text-gray-800 font-medium">{student.lastName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
                      {editing ? (
                        <input
                          type="date"
                          value={formData?.dateOfBirth?.split('T')[0] || ''}
                          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                        />
                      ) : (
                        <p className="text-gray-800">
                          {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : '-'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Gender</label>
                      {editing ? (
                        <select
                          value={formData?.gender || ''}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="">Select</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      ) : (
                        <p className="text-gray-800 capitalize">{student.gender || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Blood Group</label>
                      {editing ? (
                        <select
                          value={formData?.bloodGroup || ''}
                          onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="">Select</option>
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-gray-800">{student.bloodGroup || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Nationality</label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData?.nationality || ''}
                          onChange={(e) => handleInputChange('nationality', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                        />
                      ) : (
                        <p className="text-gray-800">{student.nationality || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Religion</label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData?.religion || ''}
                          onChange={(e) => handleInputChange('religion', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                        />
                      ) : (
                        <p className="text-gray-800">{student.religion || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
                      {editing ? (
                        <select
                          value={formData?.category || ''}
                          onChange={(e) => handleInputChange('category', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="">Select</option>
                          {['General', 'OBC', 'SC', 'ST', 'EWS'].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-gray-800">{student.category || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Aadhar Number</label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData?.aadharNumber || ''}
                          onChange={(e) => handleInputChange('aadharNumber', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                          maxLength={12}
                        />
                      ) : (
                        <p className="text-gray-800 font-mono">{student.aadharNumber || '-'}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Details */}
              {activeMenu === 'contact' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-teal-600" />
                    Contact Details
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                      {editing ? (
                        <input
                          type="email"
                          value={formData?.email || ''}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                        />
                      ) : (
                        <p className="text-gray-800 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          {student.email || '-'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                      {editing ? (
                        <input
                          type="tel"
                          value={formData?.phone || ''}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                        />
                      ) : (
                        <p className="text-gray-800 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {student.phone || '-'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Alternate Phone</label>
                      {editing ? (
                        <input
                          type="tel"
                          value={formData?.alternatePhone || ''}
                          onChange={(e) => handleInputChange('alternatePhone', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                        />
                      ) : (
                        <p className="text-gray-800">{student.alternatePhone || '-'}</p>
                      )}
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-teal-600" />
                      Address
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-500 mb-1">Address Line 1</label>
                        {editing ? (
                          <input
                            type="text"
                            value={formData?.address?.line1 || ''}
                            onChange={(e) => handleInputChange('address.line1', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                          />
                        ) : (
                          <p className="text-gray-800">{student.address?.line1 || '-'}</p>
                        )}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-500 mb-1">Address Line 2</label>
                        {editing ? (
                          <input
                            type="text"
                            value={formData?.address?.line2 || ''}
                            onChange={(e) => handleInputChange('address.line2', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                          />
                        ) : (
                          <p className="text-gray-800">{student.address?.line2 || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">City</label>
                        {editing ? (
                          <input
                            type="text"
                            value={formData?.address?.city || ''}
                            onChange={(e) => handleInputChange('address.city', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                          />
                        ) : (
                          <p className="text-gray-800">{student.address?.city || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">State</label>
                        {editing ? (
                          <input
                            type="text"
                            value={formData?.address?.state || ''}
                            onChange={(e) => handleInputChange('address.state', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                          />
                        ) : (
                          <p className="text-gray-800">{student.address?.state || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Pincode</label>
                        {editing ? (
                          <input
                            type="text"
                            value={formData?.address?.pincode || ''}
                            onChange={(e) => handleInputChange('address.pincode', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                          />
                        ) : (
                          <p className="text-gray-800">{student.address?.pincode || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Country</label>
                        {editing ? (
                          <input
                            type="text"
                            value={formData?.address?.country || 'India'}
                            onChange={(e) => handleInputChange('address.country', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                          />
                        ) : (
                          <p className="text-gray-800">{student.address?.country || 'India'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Academic */}
              {activeMenu === 'academic' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-teal-600" />
                    Academic Information
                  </h2>

                  {/* Basic Academic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Admission Number</label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData?.admissionNumber || ''}
                          onChange={(e) => handleInputChange('admissionNumber', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 font-mono"
                        />
                      ) : (
                        <p className="text-gray-800 font-mono font-medium">{student.admissionNumber || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Admission Date</label>
                      {editing ? (
                        <input
                          type="date"
                          value={formData?.admissionDate?.split('T')[0] || ''}
                          onChange={(e) => handleInputChange('admissionDate', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                        />
                      ) : (
                        <p className="text-gray-800">
                          {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : '-'}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Class & Section</label>
                      {editing ? (
                        <select
                          value={formData?.classSectionId || ''}
                          onChange={(e) => handleInputChange('classSectionId', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="">Select</option>
                          {classSections.map(cs => (
                            <option key={cs.id} value={cs.id}>
                              {cs.gradeName || cs.gradeDisplayName} - {cs.sectionName}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-gray-800 font-medium">{student.className || '-'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Roll Number</label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData?.rollNumber || ''}
                          onChange={(e) => handleInputChange('rollNumber', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                        />
                      ) : (
                        <p className="text-gray-800 font-medium">{student.rollNumber || '-'}</p>
                      )}
                    </div>
                  </div>

                  {/* Academic Mapping */}
                  {academicMapping && (
                    <>
                      {/* Summary Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-100">
                          <BookOpen className="w-8 h-8 text-teal-600 mb-2" />
                          <p className="text-2xl font-bold text-teal-700">{academicMapping.summary?.totalSubjects || 0}</p>
                          <p className="text-sm text-teal-600">Subjects</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                          <Users className="w-8 h-8 text-blue-600 mb-2" />
                          <p className="text-2xl font-bold text-blue-700">{academicMapping.summary?.totalTeachers || 0}</p>
                          <p className="text-sm text-blue-600">Teachers</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                          <IndianRupee className="w-8 h-8 text-amber-600 mb-2" />
                          <p className="text-2xl font-bold text-amber-700">₹{(academicMapping.summary?.totalFees || 0).toLocaleString()}</p>
                          <p className="text-sm text-amber-600">Total Fees</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                          <UserCheck className="w-8 h-8 text-purple-600 mb-2" />
                          <p className="text-lg font-bold text-purple-700 truncate">
                            {academicMapping.summary?.classTeacher?.name || 'Not Assigned'}
                          </p>
                          <p className="text-sm text-purple-600">Class Teacher</p>
                        </div>
                      </div>

                      {/* Subjects & Teachers */}
                      <div className="mt-6">
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-teal-600" />
                          Subjects & Teachers
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {academicMapping.subjects?.map((sub, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium text-gray-800">{sub.name}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {sub.code && <span className="text-xs text-gray-500">{sub.code}</span>}
                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      sub.isOptional ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'
                                    }`}>
                                      {sub.isOptional ? 'Optional' : 'Core'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                {sub.teachers && sub.teachers.length > 0 ? (
                                  <div className="flex flex-wrap gap-2">
                                    {sub.teachers.map((teacher, tIdx) => (
                                      <span 
                                        key={tIdx} 
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm"
                                      >
                                        <Users className="w-3.5 h-3.5" />
                                        {teacher.name}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-400 italic">No teacher assigned</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {(!academicMapping.subjects || academicMapping.subjects.length === 0) && (
                          <p className="text-gray-400 text-center py-8">No subjects configured</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Parents */}
              {activeMenu === 'parents' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Users className="w-5 h-5 text-teal-600" />
                    Parents / Guardians
                  </h2>

                  {student.parents?.length > 0 ? (
                    <div className="space-y-4">
                      {student.parents.map((parent, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg">
                                {parent.firstName?.[0]}{parent.lastName?.[0]}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">{parent.fullName}</p>
                                <p className="text-sm text-gray-500 capitalize">{parent.relationship}</p>
                              </div>
                            </div>
                            {parent.isPrimary && (
                              <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                                Primary Contact
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="w-4 h-4" />
                              {parent.phone || '-'}
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Mail className="w-4 h-4" />
                              {parent.email || '-'}
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                              <Briefcase className="w-4 h-4" />
                              {parent.occupation || '-'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">No parents/guardians added</p>
                      {editing && (
                        <button className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-xl">
                          <Plus className="w-4 h-4 inline mr-2" />
                          Add Parent
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Fees */}
              {activeMenu === 'fees' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <IndianRupee className="w-5 h-5 text-teal-600" />
                    Fees & Payments
                  </h2>

                  {academicMapping?.fees?.items?.length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 rounded-l-xl">Fee Type</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Category</th>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Frequency</th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 rounded-r-xl">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {academicMapping.fees.items.map((fee, idx) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-800">{fee.feeType}</td>
                                <td className="px-4 py-3 capitalize text-gray-600">{fee.category}</td>
                                <td className="px-4 py-3 capitalize text-gray-600">{fee.frequency}</td>
                                <td className="px-4 py-3 text-right font-semibold text-amber-700">
                                  ₹{fee.amount.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-amber-50">
                              <td colSpan={3} className="px-4 py-3 text-right font-semibold text-gray-700 rounded-l-xl">
                                Total Fees:
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-lg text-amber-700 rounded-r-xl">
                                ₹{academicMapping.fees.totalAmount?.toLocaleString() || 0}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <IndianRupee className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">No fee structure configured for this class</p>
                    </div>
                  )}
                </div>
              )}

              {/* Documents */}
              {activeMenu === 'documents' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-teal-600" />
                    Documents
                  </h2>

                  {student.documents?.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {student.documents.map((doc, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-teal-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">{doc.documentName}</p>
                              <p className="text-sm text-gray-500">{doc.documentType}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-400">
                      <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">No documents uploaded</p>
                      {editing && (
                        <button className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-xl">
                          <Plus className="w-4 h-4 inline mr-2" />
                          Upload Document
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Other Details */}
              {activeMenu === 'other' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-teal-600" />
                    Other Details
                  </h2>

                  {/* Medical */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      Medical Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Medical Conditions</label>
                        {editing ? (
                          <textarea
                            value={formData?.medicalConditions || ''}
                            onChange={(e) => handleInputChange('medicalConditions', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                          />
                        ) : (
                          <p className="text-gray-800">{student.medicalConditions || 'None reported'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Allergies</label>
                        {editing ? (
                          <textarea
                            value={formData?.allergies || ''}
                            onChange={(e) => handleInputChange('allergies', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                          />
                        ) : (
                          <p className="text-gray-800">{student.allergies || 'None reported'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Transport */}
                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Bus className="w-4 h-4 text-blue-500" />
                      Transport Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Uses Transport</label>
                        {editing ? (
                          <select
                            value={formData?.usesTransport ? 'yes' : 'no'}
                            onChange={(e) => handleInputChange('usesTransport', e.target.value === 'yes')}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                          >
                            <option value="no">No</option>
                            <option value="yes">Yes</option>
                          </select>
                        ) : (
                          <p className="text-gray-800">{student.usesTransport ? 'Yes' : 'No'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Pickup Point</label>
                        {editing ? (
                          <input
                            type="text"
                            value={formData?.pickupPoint || ''}
                            onChange={(e) => handleInputChange('pickupPoint', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                          />
                        ) : (
                          <p className="text-gray-800">{student.pickupPoint || '-'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Previous School */}
                  <div className="border-t pt-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Building className="w-4 h-4 text-purple-500" />
                      Previous School
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">School Name</label>
                        {editing ? (
                          <input
                            type="text"
                            value={formData?.previousSchool?.name || ''}
                            onChange={(e) => handleInputChange('previousSchool.name', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                          />
                        ) : (
                          <p className="text-gray-800">{student.previousSchool?.name || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Last Class</label>
                        {editing ? (
                          <input
                            type="text"
                            value={formData?.previousSchool?.class || ''}
                            onChange={(e) => handleInputChange('previousSchool.class', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                          />
                        ) : (
                          <p className="text-gray-800">{student.previousSchool?.class || '-'}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">TC Number</label>
                        {editing ? (
                          <input
                            type="text"
                            value={formData?.previousSchool?.tcNumber || ''}
                            onChange={(e) => handleInputChange('previousSchool.tcNumber', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500"
                          />
                        ) : (
                          <p className="text-gray-800">{student.previousSchool?.tcNumber || '-'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetail;

