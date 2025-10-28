import { 
  Users, 
  UserCog, 
  BookOpen, 
  TrendingUp,
  Award,
  DollarSign
} from 'lucide-react';

const Dashboard = () => {
  const stats = [
    {
      title: 'Total Students',
      value: '2,847',
      change: '+12%',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Teachers',
      value: '124',
      change: '+8%',
      icon: UserCog,
      color: 'bg-green-500',
    },
    {
      title: 'Courses',
      value: '45',
      change: '+5%',
      icon: BookOpen,
      color: 'bg-purple-500',
    },
    {
      title: 'Revenue',
      value: '$45,231',
      change: '+23%',
      icon: DollarSign,
      color: 'bg-orange-500',
    },
  ];

  const recentStudents = [
    { name: 'Emma Johnson', email: 'emma@school.edu', course: 'Mathematics' },
    { name: 'Michael Chen', email: 'michael@school.edu', course: 'Science' },
    { name: 'Sarah Williams', email: 'sarah@school.edu', course: 'English' },
    { name: 'David Brown', email: 'david@school.edu', course: 'History' },
    { name: 'Olivia Davis', email: 'olivia@school.edu', course: 'Art' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="card bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    {stat.change} from last month
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Students */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recent Students</h2>
            <button className="text-sm text-blue-600 hover:text-blue-700">
              View all
            </button>
          </div>
          <div className="space-y-3">
            {recentStudents.map((student, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">
                    {student.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{student.name}</p>
                  <p className="text-sm text-gray-600">{student.email}</p>
                </div>
                <div className="text-xs bg-gray-100 px-3 py-1 rounded-full">
                  {student.course}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Overview */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Performance Overview</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Excellent</p>
                  <p className="text-sm text-gray-600">85% students</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">85%</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Good</p>
                  <p className="text-sm text-gray-600">12% students</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">12%</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '12%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="btn-primary w-full text-left px-6 py-4 flex items-center gap-3">
            <Users className="w-5 h-5" />
            Add New Student
          </button>
          <button className="btn-secondary w-full text-left px-6 py-4 flex items-center gap-3">
            <BookOpen className="w-5 h-5" />
            Create Course
          </button>
          <button className="btn-secondary w-full text-left px-6 py-4 flex items-center gap-3">
            <UserCog className="w-5 h-5" />
            Add Teacher
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
