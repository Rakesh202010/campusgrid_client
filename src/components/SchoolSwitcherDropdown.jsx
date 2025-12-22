import { useState, useRef, useEffect } from 'react';
import { Building2, ChevronDown, CheckCircle, MapPin, Loader2 } from 'lucide-react';
import { toast } from '../utils/toast';

const SchoolSwitcherDropdown = ({ schools, currentSchoolId, onSwitch }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentSchool = schools?.find(s => s.school_id === currentSchoolId) || schools?.[0];

  const handleSwitchSchool = async (school) => {
    if (school.school_id === currentSchoolId) {
      setIsOpen(false);
      return;
    }

    setLoading(true);
    try {
      await onSwitch(school);
      setIsOpen(false);
      toast.success(`✅ Switched to ${school.school_name}`);
      
      // Remember last selected school
      localStorage.setItem('lastSelectedSchoolId', school.school_id);
    } catch (error) {
      toast.error('Failed to switch school. Please try again.');
      console.error('Switch school error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!schools || schools.length <= 1) {
    // Don't show switcher if user only has one school
    return currentSchool ? (
      <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200">
        <Building2 className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
          {currentSchool.school_name}
        </span>
      </div>
    ) : null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all min-w-[200px] max-w-[300px]"
      >
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {currentSchool?.school_name || 'Select School'}
          </p>
          {currentSchool?.city && (
            <p className="text-xs text-gray-500 truncate">
              {currentSchool.city}{currentSchool.state ? `, ${currentSchool.state}` : ''}
            </p>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Switch School</p>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {loading && (
              <div className="p-4 flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              </div>
            )}
            
            {schools.map((school) => (
              <button
                key={school.school_id}
                onClick={() => handleSwitchSchool(school)}
                disabled={loading}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                  school.school_id === currentSchoolId ? 'bg-blue-50' : ''
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    school.school_id === currentSchoolId
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Building2 className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 truncate">{school.school_name}</p>
                      {school.school_id === currentSchoolId && (
                        <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-1">Code: {school.school_code}</p>
                    {(school.city || school.state) && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" />
                        <span>{school.city}{school.city && school.state ? ', ' : ''}{school.state}</span>
                      </div>
                    )}
                    {school.role && (
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full ${
                        school.role === 'principal'
                          ? 'bg-purple-100 text-purple-700'
                          : school.role === 'vice_principal'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {school.role === 'principal' ? 'Principal' : 
                         school.role === 'vice_principal' ? 'Vice Principal' : 
                         'Admin'}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolSwitcherDropdown;

