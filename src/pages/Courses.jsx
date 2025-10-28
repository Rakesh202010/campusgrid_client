import { useState } from 'react';
import { Search, Plus, Edit, Trash2, Users, Clock, BookOpen } from 'lucide-react';

const Courses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const courses = [
    { id: 1, name: 'Mathematics 101', code: 'MATH101', students: 45, duration: '12 weeks', instructor: 'Dr. Jennifer Smith', status: 'Active' },
    { id: 2, name: 'Advanced Science', code: 'SCI201', students: 38, duration: '14 weeks', instructor: 'Prof. Robert Johnson', status: 'Active' },
    { id: 3, name: 'English Literature', code: 'ENG102', students: 52, duration: '12 weeks', instructor: 'Dr. Emily Brown', status: 'Active' },
    { id: 4, name: 'World History', code: 'HIS101', students: 41, duration: '10 weeks', instructor: 'Prof. Michael Davis', status: 'Active' },
    { id: 5, name: 'Fine Arts', code: 'ART201', students: 28, duration: '15 weeks', instructor: 'Dr. Sarah Wilson', status: 'Active' },
    { id: 6, name: 'Physics Fundamentals', code: 'PHY101', students: 35, duration: '12 weeks', instructor: 'Prof. James Taylor', status: 'Active' },
  ];

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'all', label: 'All Courses', count: courses.length },
    { id: 'active', label: 'Active', count: courses.filter(c => c.status === 'Active').length },
    { id: 'archived', label: 'Archived', count: 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Courses Management</h2>
          <p className="text-gray-600 mt-1">Manage all courses and curriculum</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create Course
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCourses.map((course) => (
          <div key={course.id} className="card bg-white hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{course.name}</h3>
                  <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                    {course.code}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">{course.instructor}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    <span>{course.students} students</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                {course.status}
              </span>
              <div className="flex gap-2">
                <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No courses found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default Courses;
