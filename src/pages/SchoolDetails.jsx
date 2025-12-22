import { useState, useEffect } from 'react';
import { Building2, MapPin, Mail, Phone, Calendar, Users, BookOpen, Loader2 } from 'lucide-react';
import api from '../services/api';

const SchoolDetails = () => {
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSchoolDetails();
  }, []);

  const fetchSchoolDetails = async () => {
    try {
      setLoading(true);
      const data = await api.auth.getSchool();
      
      if (data?.success) {
        setSchool(data.data);
      } else {
        setError('Failed to load school details');
      }
    } catch (err) {
      console.error('Error fetching school details:', err);
      setError('Failed to load school details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!school) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center">
            <Building2 className="w-10 h-10 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold mb-2">{school.schoolName}</h1>
            <p className="text-blue-100">Code: {school.schoolCode} | Type: {school.schoolType}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Students</p>
              <p className="text-3xl font-bold text-gray-900">{school._count?.students || 0}</p>
            </div>
            <Users className="w-12 h-12 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Teachers</p>
              <p className="text-3xl font-bold text-gray-900">{school._count?.teachers || 0}</p>
            </div>
            <Users className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Classes</p>
              <p className="text-3xl font-bold text-gray-900">{school._count?.classes || 0}</p>
            </div>
            <BookOpen className="w-12 h-12 text-purple-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Status</p>
              <p className="text-xl font-bold text-green-600">{school.status}</p>
            </div>
            <Building2 className="w-12 h-12 text-orange-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-600">Education Board</dt>
              <dd className="text-base text-gray-900 mt-1">{school.educationBoard}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">Academic Level</dt>
              <dd className="text-base text-gray-900 mt-1">{school.academicLevel?.join(', ') || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">Grading System</dt>
              <dd className="text-base text-gray-900 mt-1">{school.gradingSystem || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">Attendance Type</dt>
              <dd className="text-base text-gray-900 mt-1">{school.attendanceType || 'N/A'}</dd>
            </div>
          </dl>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Address
          </h2>
          <p className="text-gray-900">{school.addressLine1}</p>
          {school.addressLine2 && <p className="text-gray-900">{school.addressLine2}</p>}
          <p className="text-gray-900 mt-2">
            {school.city}, {school.state} {school.pincode}
          </p>
          <p className="text-gray-900">{school.country}</p>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Primary Email
              </dt>
              <dd className="text-base text-gray-900 mt-1">{school.primaryContactEmail}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Primary Phone
              </dt>
              <dd className="text-base text-gray-900 mt-1">{school.primaryContactPhone}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">Primary Contact Name</dt>
              <dd className="text-base text-gray-900 mt-1">{school.primaryContactName} ({school.primaryContactRole})</dd>
            </div>
          </dl>
        </div>

        {/* Academic Configuration */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Academic Configuration</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-600">Grades Offered</dt>
              <dd className="text-base text-gray-900 mt-1">{school.gradesOffered?.join(', ') || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">Sections</dt>
              <dd className="text-base text-gray-900 mt-1">{school.sectionsPerGrade?.join(', ') || 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-600">Subjects</dt>
              <dd className="text-base text-gray-900 mt-1">{school.subjectsOffered?.join(', ') || 'N/A'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default SchoolDetails;

