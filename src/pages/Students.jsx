import { useState } from 'react';
import { Search, Plus, Edit, Trash2, Filter } from 'lucide-react';

const Students = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const students = [
    { id: 1, name: 'Emma Johnson', email: 'emma@school.edu', course: 'Mathematics', grade: 'A', status: 'Active' },
    { id: 2, name: 'Michael Chen', email: 'michael@school.edu', course: 'Science', grade: 'A+', status: 'Active' },
    { id: 3, name: 'Sarah Williams', email: 'sarah@school.edu', course: 'English', grade: 'B+', status: 'Active' },
    { id: 4, name: 'David Brown', email: 'david@school.edu', course: 'History', grade: 'A', status: 'Active' },
    { id: 5, name: 'Olivia Davis', email: 'olivia@school.edu', course: 'Art', grade: 'A-', status: 'Active' },
    { id: 6, name: 'James Wilson', email: 'james@school.edu', course: 'Physics', grade: 'B', status: 'Active' },
    { id: 7, name: 'Sophia Martinez', email: 'sophia@school.edu', course: 'Chemistry', grade: 'A', status: 'Active' },
    { id: 8, name: 'Lucas Anderson', email: 'lucas@school.edu', course: 'Literature', grade: 'B+', status: 'Active' },
  ];

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Students Management</h2>
          <p className="text-gray-600 mt-1">Manage all student information</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add New Student
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button className="btn-secondary flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filter
        </button>
      </div>

      {/* Students Table */}
      <div className="card bg-white overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Course
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Grade
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-semibold">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      <div className="text-sm text-gray-500">{student.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{student.course}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {student.grade}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {student.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    <button className="text-gray-600 hover:text-blue-600 transition-colors">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button className="text-gray-600 hover:text-red-600 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing <span className="font-medium">1</span> to <span className="font-medium">8</span> of{' '}
          <span className="font-medium">{students.length}</span> results
        </p>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Previous
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Students;
