import { useState } from 'react';
import { Building2, CheckCircle, MapPin, Loader2, X } from 'lucide-react';

const SchoolSelectionModal = ({ schools, onSelect, onClose, loading }) => {
  const [selectedSchoolId, setSelectedSchoolId] = useState(null);

  const handleContinue = () => {
    if (selectedSchoolId) {
      const selectedSchool = schools.find(s => s.school_id === selectedSchoolId);
      onSelect(selectedSchool);
    }
  };

  if (!schools || schools.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Select a School</h2>
              <p className="text-blue-100 text-sm">Choose which school you want to access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-3">
            {schools.map((school) => (
              <button
                key={school.school_id}
                onClick={() => setSelectedSchoolId(school.school_id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedSchoolId === school.school_id
                    ? 'border-blue-600 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                    selectedSchoolId === school.school_id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Building2 className="w-6 h-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 truncate">{school.school_name}</h3>
                      {selectedSchoolId === school.school_id && (
                        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Code: {school.school_code}</p>
                    {(school.city || school.state) && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        <span>{school.city}{school.city && school.state ? ', ' : ''}{school.state}</span>
                      </div>
                    )}
                    {school.role && (
                      <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${
                        school.role === 'principal'
                          ? 'bg-purple-100 text-purple-700'
                          : school.role === 'vice_principal'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {school.role === 'principal' ? 'Principal' : 
                         school.role === 'vice_principal' ? 'Vice Principal' : 
                         'School Admin'}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            disabled={!selectedSchoolId || loading}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchoolSelectionModal;

