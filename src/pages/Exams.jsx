import { ClipboardCheck, Plus } from 'lucide-react';

const Exams = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <ClipboardCheck className="w-8 h-8" />
              Exams & Grades
            </h1>
            <p className="text-blue-100">Manage exams, assessments, and grades</p>
          </div>
          <button className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create Exam
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-12 shadow-lg border border-gray-100 text-center">
        <ClipboardCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Exams Module Coming Soon</h3>
        <p className="text-gray-600">
          This feature is under development. You'll be able to manage exams and grades here.
        </p>
      </div>
    </div>
  );
};

export default Exams;

