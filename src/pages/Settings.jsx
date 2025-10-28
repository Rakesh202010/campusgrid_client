import { User, Bell, Shield, Globe, Palette } from 'lucide-react';

const Settings = () => {
  const settingsSections = [
    {
      title: 'Profile Settings',
      icon: User,
      items: [
        { label: 'Personal Information', description: 'Update your personal details' },
        { label: 'Change Password', description: 'Update your account password' },
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
    {
      title: 'Security',
      icon: Shield,
      items: [
        { label: 'Two-Factor Authentication', description: 'Enable 2FA for your account' },
        { label: 'Login Activity', description: 'View recent login attempts' },
        { label: 'API Keys', description: 'Manage API access keys' },
      ],
    },
    {
      title: 'Preferences',
      icon: Palette,
      items: [
        { label: 'Language', description: 'Select your preferred language' },
        { label: 'Timezone', description: 'Set your timezone' },
        { label: 'Theme', description: 'Choose your theme' },
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
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                        {item.label}
                      </p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    <button className="text-gray-400 group-hover:text-blue-600 transition-colors">
                      →
                    </button>
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
