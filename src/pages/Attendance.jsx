import { Calendar, Plus } from 'lucide-react';

const Attendance = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Calendar className="w-8 h-8" />
              Attendance Management
            </h1>
            <p className="text-blue-100">Track and manage student attendance</p>
          </div>
          <button className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Mark Attendance
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-12 shadow-lg border border-gray-100 text-center">
        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Attendance Module Coming Soon</h3>
        <p className="text-gray-600">
          This feature is under development. You'll be able to mark and track attendance here.
        </p>
      </div>
    </div>
  );
};

export default Attendance;

