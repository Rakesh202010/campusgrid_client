import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { academicSessions } from '../services/api';

const AcademicSessionContext = createContext(null);

export const AcademicSessionProvider = ({ children }) => {
  const [currentSession, setCurrentSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [allSessionsRes, currentSessionRes] = await Promise.all([
        academicSessions.getAll(),
        academicSessions.getCurrent()
      ]);

      if (allSessionsRes?.success) {
        setSessions(allSessionsRes.data || []);
      }

      if (currentSessionRes?.success && currentSessionRes.data) {
        setCurrentSession(currentSessionRes.data);
      }
    } catch (err) {
      console.error('Error fetching academic sessions:', err);
      setError('Failed to load academic sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const switchSession = useCallback(async (sessionId) => {
    try {
      const response = await academicSessions.setCurrent(sessionId);
      
      if (response?.success) {
        const newSession = sessions.find(s => s.id === sessionId);
        if (newSession) {
          setCurrentSession(newSession);
          // Update sessions list to reflect the change
          setSessions(prev => prev.map(s => ({
            ...s,
            isCurrent: s.id === sessionId
          })));
        }
        return { success: true };
      } else {
        return { success: false, message: response?.message || 'Failed to switch session' };
      }
    } catch (err) {
      console.error('Error switching session:', err);
      return { success: false, message: 'Failed to switch academic session' };
    }
  }, [sessions]);

  const refreshSessions = useCallback(() => {
    return fetchSessions();
  }, [fetchSessions]);

  const value = {
    currentSession,
    sessions,
    loading,
    error,
    switchSession,
    refreshSessions,
    sessionId: currentSession?.id
  };

  return (
    <AcademicSessionContext.Provider value={value}>
      {children}
    </AcademicSessionContext.Provider>
  );
};

export const useAcademicSession = () => {
  const context = useContext(AcademicSessionContext);
  if (!context) {
    throw new Error('useAcademicSession must be used within an AcademicSessionProvider');
  }
  return context;
};

export default AcademicSessionContext;

