import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  ChevronDown, 
  Check, 
  Star, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Settings,
  Loader2
} from 'lucide-react';
import { useAcademicSession } from '../contexts/AcademicSessionContext';
import { toast } from '../utils/toast';

const AcademicSessionSwitcher = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  const { currentSession, sessions, loading, switchSession, refreshSessions } = useAcademicSession();

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

  const handleSetCurrent = async (session) => {
    if (session.id === currentSession?.id) {
      setIsOpen(false);
      return;
    }

    try {
      setSwitching(true);
      const result = await switchSession(session.id);
      
      if (result.success) {
        toast.success(`Switched to ${session.name}`);
        setIsOpen(false);
        // Reload the page to refresh all data with new session
        window.location.reload();
      } else {
        toast.error(result.message || 'Failed to switch session');
      }
    } catch (error) {
      console.error('Error switching session:', error);
      toast.error('Failed to switch academic session');
    } finally {
      setSwitching(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
      case 'upcoming':
        return <Clock className="w-3.5 h-3.5 text-blue-500" />;
      case 'completed':
        return <Check className="w-3.5 h-3.5 text-gray-400" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'upcoming':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'completed':
        return 'bg-gray-50 text-gray-600 border-gray-200';
      default:
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
  };

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    
    if (startYear === endYear) {
      return startYear.toString();
    }
    return `${startYear}-${endYear.toString().slice(-2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
          currentSession 
            ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 hover:border-amber-300' 
            : 'bg-gray-50 border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          currentSession ? 'bg-amber-100' : 'bg-gray-100'
        }`}>
          <Calendar className={`w-4 h-4 ${currentSession ? 'text-amber-600' : 'text-gray-500'}`} />
        </div>
        <div className="text-left hidden sm:block">
          {currentSession ? (
            <>
              <p className="text-xs text-gray-500 leading-none">Academic Session</p>
              <p className="text-sm font-semibold text-gray-800 leading-tight">{currentSession.code || currentSession.name}</p>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-500 leading-none">No Session</p>
              <p className="text-sm font-medium text-gray-600 leading-tight">Select Session</p>
            </>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Academic Sessions</h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/settings/academic-sessions');
                }}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                <Settings className="w-3.5 h-3.5" />
                Manage
              </button>
            </div>
          </div>

          {/* Sessions List */}
          <div className="max-h-72 overflow-y-auto py-1">
            {sessions.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 mb-2">No academic sessions found</p>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/settings/academic-sessions');
                  }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Create your first session →
                </button>
              </div>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => handleSetCurrent(session)}
                  disabled={switching || session.status === 'completed'}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left ${
                    session.id === currentSession?.id ? 'bg-amber-50' : ''
                  } ${session.status === 'completed' ? 'opacity-60' : ''}`}
                >
                  {/* Session Icon */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    session.id === currentSession?.id 
                      ? 'bg-amber-100' 
                      : 'bg-gray-100'
                  }`}>
                    {session.id === currentSession?.id ? (
                      <Star className="w-5 h-5 text-amber-500" />
                    ) : (
                      <Calendar className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  {/* Session Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {session.name}
                      </p>
                      {session.id === currentSession?.id && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono text-gray-500">{session.code}</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs text-gray-500">
                        {formatDateRange(session.startDate, session.endDate)}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(session.status)}`}>
                    {getStatusIcon(session.status)}
                    <span className="capitalize">{session.status}</span>
                  </div>

                  {/* Selection Indicator */}
                  {session.id === currentSession?.id && (
                    <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {sessions.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                Click on a session to set it as current
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AcademicSessionSwitcher;
