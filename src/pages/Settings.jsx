import { useNavigate } from 'react-router-dom';
import { User, Bell, Calendar, Sliders, ChevronRight, BookOpen, Layers, IndianRupee, Users, Clock, Building2, Hash, CreditCard, KeyRound } from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();

  const configurationItems = [
    { 
      label: 'Academic Sessions', 
      description: 'Manage academic years and session configurations',
      icon: Calendar,
      path: '/settings/academic-sessions',
      color: 'bg-blue-100 text-blue-600'
    },
    { 
      label: 'Departments', 
      description: 'Manage academic departments and their heads',
      icon: Building2,
      path: '/settings/departments',
      color: 'bg-teal-100 text-teal-600'
    },
    { 
      label: 'Class & Section', 
      description: 'Configure classes, sections, and structure',
      icon: BookOpen,
      path: '/settings/class-configuration',
      color: 'bg-purple-100 text-purple-600'
    },
    { 
      label: 'Subjects & Curriculum', 
      description: 'Manage subjects and assign to classes',
      icon: Layers,
      path: '/settings/subjects',
      color: 'bg-indigo-100 text-indigo-600'
    },
    { 
      label: 'Finance & Fees', 
      description: 'Configure fee types, structures, and discounts',
      icon: IndianRupee,
      path: '/settings/fees',
      color: 'bg-green-100 text-green-600'
    },
    { 
      label: 'Fee Payment Settings', 
      description: 'Payment frequency, due dates, late fees & discounts',
      icon: CreditCard,
      path: '/settings/fee-payment',
      color: 'bg-emerald-100 text-emerald-600'
    },
    { 
      label: 'Staff & Users', 
      description: 'Departments, non-teaching staff, roles & RBAC permissions',
      icon: Users,
      path: '/settings/people',
      color: 'bg-orange-100 text-orange-600'
    },
    { 
      label: 'Class Timings', 
      description: 'Configure periods, breaks and school schedules',
      icon: Clock,
      path: '/settings/class-timings',
      color: 'bg-pink-100 text-pink-600'
    },
    { 
      label: 'Number Generation', 
      description: 'Configure admission number and roll number formats',
      icon: Hash,
      path: '/settings/number-settings',
      color: 'bg-cyan-100 text-cyan-600'
    },
    { 
      label: 'User Login Management', 
      description: 'Enable login access and set passwords for all user types',
      icon: KeyRound,
      path: '/settings/user-login',
      color: 'bg-violet-100 text-violet-600'
    },
  ];

  const settingsSections = [
    {
      title: 'Profile Settings',
      icon: User,
      items: [
        { label: 'Personal Information', description: 'Update your personal details' },
        { label: 'Change Password', description: 'Update your account password', path: '/change-password' },
        { label: 'Email Preferences', description: 'Manage email notifications' },
      ],
    },
    {
      title: 'Notifications',
      icon: Bell,
      items: [
        { label: 'Push Notifications', description: 'Manage push notification settings' },
        { label: 'Email Notifications', description: 'Configure email alerts' },
        { label: 'SMS Notifications', description: 'Set up SMS alerts' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-800">Settings</h2>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Configuration Section */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Sliders className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Configuration</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {configurationItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group text-left"
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${item.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                    {item.label}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">{section.title}</h3>
              </div>
              <div className="space-y-2">
                {section.items.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => item.path && navigate(item.path)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                        {item.label}
                      </p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Account Actions */}
      <div className="card bg-red-50 border border-red-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Danger Zone</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">Deactivate Account</p>
              <p className="text-sm text-gray-600">Temporarily disable your account</p>
            </div>
            <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-100 transition-colors">
              Deactivate
            </button>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-red-200">
            <div>
              <p className="font-medium text-gray-800">Delete Account</p>
              <p className="text-sm text-gray-600">Permanently delete your account and all data</p>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
