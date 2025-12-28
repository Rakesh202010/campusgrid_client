import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { AcademicSessionProvider } from './contexts/AcademicSessionContext';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentDetail from './pages/StudentDetail';
import Teachers from './pages/Teachers';
import Classes from './pages/Classes';
import Attendance from './pages/Attendance';
import Exams from './pages/Exams';
import Fees from './pages/Fees';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import SchoolDetails from './pages/SchoolDetails';
import ChangePassword from './pages/ChangePassword';
import AcademicSessions from './pages/AcademicSessions';
import ClassConfiguration from './pages/ClassConfiguration';
import SubjectConfiguration from './pages/SubjectConfiguration';
import FeeConfiguration from './pages/FeeConfiguration';
import PeopleConfiguration from './pages/PeopleConfiguration';
import SubjectAssignment from './pages/SubjectAssignment';
import ClassTimingConfiguration from './pages/ClassTimingConfiguration';
import DepartmentConfiguration from './pages/DepartmentConfiguration';
import NumberConfiguration from './pages/NumberConfiguration';
import FeePaymentSettings from './pages/FeePaymentSettings';
import FeeReceipt from './pages/FeeReceipt';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('schoolAdmin_token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Public Route Component (redirect based on mustChangePassword flag)
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('schoolAdmin_token');
  
  if (token) {
    // Check if user needs to change password
    const userInfo = localStorage.getItem('schoolAdmin_info');
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        if (parsed.mustChangePassword) {
          return <Navigate to="/change-password" replace />;
        }
      } catch (e) {
        // If parsing fails, just go to dashboard
      }
    }
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Receipt Page - Opens in new tab */}
        <Route 
          path="/fee-receipt" 
          element={
            <ProtectedRoute>
              <FeeReceipt />
            </ProtectedRoute>
          } 
        />

        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <AcademicSessionProvider>
                <Layout />
              </AcademicSessionProvider>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="students/:id" element={<StudentDetail />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="teachers/subject-assignment" element={<SubjectAssignment />} />
          <Route path="classes" element={<Classes />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="exams" element={<Exams />} />
          <Route path="fees" element={<Fees />} />
          <Route path="reports" element={<Reports />} />
          <Route path="school-details" element={<SchoolDetails />} />
          <Route path="settings" element={<Settings />} />
          <Route path="settings/academic-sessions" element={<AcademicSessions />} />
          <Route path="settings/class-configuration" element={<ClassConfiguration />} />
          <Route path="settings/subjects" element={<SubjectConfiguration />} />
          <Route path="settings/fees" element={<FeeConfiguration />} />
          <Route path="settings/people" element={<PeopleConfiguration />} />
          <Route path="settings/class-timings" element={<ClassTimingConfiguration />} />
          <Route path="settings/departments" element={<DepartmentConfiguration />} />
          <Route path="settings/number-settings" element={<NumberConfiguration />} />
          <Route path="settings/fee-payment" element={<FeePaymentSettings />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
