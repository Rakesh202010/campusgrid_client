import { useState } from 'react';
import { Search, Plus, Edit, Trash2, Mail, Phone } from 'lucide-react';

const Teachers = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const teachers = [
    { id: 1, name: 'Dr. Jennifer Smith', email: 'jennifer@school.edu', phone: '+1 234-567-8901', department: 'Mathematics', experience: '10 years', status: 'Active' },
    { id: 2, name: 'Prof. Robert Johnson', email: 'robert@school.edu', phone: '+1 234-567-8902', department: 'Science', experience: '15 years', status: 'Active' },
    { id: 3, name: 'Dr. Emily Brown', email: 'emily@school.edu', phone: '+1 234-567-8903', department: 'English', experience: '8 years', status: 'Active' },
    { id: 4, name: 'Prof. Michael Davis', email: 'michael@school.edu', phone: '+1 234-567-8904', department: 'History', experience: '12 years', status: 'Active' },
    { id: 5, name: 'Dr. Sarah Wilson', email: 'sarah@school.edu', phone: '+1 234-567-8905', department: 'Art', experience: '9 years', status: 'Active' },
    { id: 6, name: 'Prof. James Taylor', email: 'james@school.edu', phone: '+1 234-567-8906', department: 'Physics', experience: '11 years', status: 'Active' },
  ];

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Teachers Management</h2>
          <p className="text-gray-600 mt-1">Manage all teacher information</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add New Teacher
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search teachers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.map((teacher) => (
          <div key={teacher.id} className="card bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-xl">
                  {teacher.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">{teacher.name}</h3>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{teacher.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{teacher.phone}</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div>
                <span className="text-xs text-gray-500">Department</span>
                <p className="text-sm font-medium text-gray-800">{teacher.department}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Experience</span>
                <p className="text-sm font-medium text-gray-800">{teacher.experience}</p>
              </div>
            </div>
            <div className="mt-3">
              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                {teacher.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredTeachers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No teachers found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default Teachers;
