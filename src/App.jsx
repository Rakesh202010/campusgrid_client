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
import StaffUsersConfiguration from './pages/StaffUsersConfiguration';
import UserLoginManagement from './pages/UserLoginManagement';
import StreamsConfiguration from './pages/StreamsConfiguration';
import IdCardConfiguration from './pages/IdCardConfiguration';
import IdCardPrint from './pages/IdCardPrint';
import RosterConfiguration from './pages/RosterConfiguration';
import RosterAssignment from './pages/RosterAssignment';

// Role-based Dashboards
import StudentDashboard from './pages/StudentDashboard';
import ParentDashboard from './pages/ParentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';

// Get dashboard path based on user type
const getDashboardPath = (userType) => {
  switch (userType) {
    case 'student': return '/student';
    case 'parent': return '/parent';
    case 'teacher': return '/teacher';
    case 'staff': return '/dashboard';
    case 'admin': return '/dashboard';
    default: return '/dashboard';
  }
};

// Protected Route Component
const ProtectedRoute = ({ children, allowedUserTypes = ['admin', 'staff'] }) => {
  const token = localStorage.getItem('schoolAdmin_token');
  const userInfo = localStorage.getItem('schoolAdmin_info');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Check user type access
  if (userInfo) {
    try {
      const parsed = JSON.parse(userInfo);
      const userType = parsed.userType || 'admin';
      
      // If user type doesn't match allowed types, redirect to their dashboard
      if (!allowedUserTypes.includes(userType)) {
        return <Navigate to={getDashboardPath(userType)} replace />;
      }
    } catch (e) {
      // If parsing fails, allow access
    }
  }
  
  return children;
};

// Role-based Protected Route
const RoleProtectedRoute = ({ children, userType }) => {
  const token = localStorage.getItem('schoolAdmin_token');
  const userInfo = localStorage.getItem('schoolAdmin_info');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (userInfo) {
    try {
      const parsed = JSON.parse(userInfo);
      const currentUserType = parsed.userType || 'admin';
      
      if (currentUserType !== userType) {
        return <Navigate to={getDashboardPath(currentUserType)} replace />;
      }
    } catch (e) {
      return <Navigate to="/login" replace />;
    }
  }
  
  return children;
};

// Public Route Component (redirect based on user type)
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('schoolAdmin_token');
  const userInfo = localStorage.getItem('schoolAdmin_info');
  
  if (token && userInfo) {
    try {
      const parsed = JSON.parse(userInfo);
      const userType = parsed.userType || 'admin';
      
      // Check if user needs to change password (admin only)
      if (userType === 'admin' && parsed.mustChangePassword) {
        return <Navigate to="/change-password" replace />;
      }
      
      // Redirect to appropriate dashboard
      return <Navigate to={getDashboardPath(userType)} replace />;
    } catch (e) {
      return <Navigate to="/dashboard" replace />;
    }
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
            <ProtectedRoute allowedUserTypes={['admin', 'staff', 'parent']}>
              <FeeReceipt />
            </ProtectedRoute>
          } 
        />

        {/* Student Dashboard Routes */}
        <Route 
          path="/student/*" 
          element={
            <RoleProtectedRoute userType="student">
              <StudentDashboard />
            </RoleProtectedRoute>
          }
        />

        {/* Parent Dashboard Routes */}
        <Route 
          path="/parent/*" 
          element={
            <RoleProtectedRoute userType="parent">
              <ParentDashboard />
            </RoleProtectedRoute>
          }
        />

        {/* Teacher Dashboard Routes */}
        <Route 
          path="/teacher/*" 
          element={
            <RoleProtectedRoute userType="teacher">
              <TeacherDashboard />
            </RoleProtectedRoute>
          }
        />

        {/* Admin/Staff Protected Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute allowedUserTypes={['admin', 'staff']}>
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
          <Route path="settings/streams" element={<StreamsConfiguration />} />
          <Route path="settings/subjects" element={<SubjectConfiguration />} />
          <Route path="settings/fees" element={<FeeConfiguration />} />
          <Route path="settings/people" element={<StaffUsersConfiguration />} />
          <Route path="settings/class-timings" element={<ClassTimingConfiguration />} />
          <Route path="settings/departments" element={<DepartmentConfiguration />} />
          <Route path="settings/number-settings" element={<NumberConfiguration />} />
          <Route path="settings/fee-payment" element={<FeePaymentSettings />} />
          <Route path="settings/user-login" element={<UserLoginManagement />} />
          <Route path="settings/id-cards" element={<IdCardConfiguration />} />
          <Route path="id-cards/print" element={<IdCardPrint />} />
          <Route path="roster" element={<RosterConfiguration />} />
          <Route path="roster/assignments" element={<RosterAssignment />} />
          <Route path="change-password" element={<ChangePassword />} />
        </Route>

        {/* Fallback - Redirect based on user type */}
        <Route path="*" element={<SmartRedirect />} />
      </Routes>
    </Router>
  );
}

// Smart redirect component
const SmartRedirect = () => {
  const token = localStorage.getItem('schoolAdmin_token');
  const userInfo = localStorage.getItem('schoolAdmin_info');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (userInfo) {
    try {
      const parsed = JSON.parse(userInfo);
      const userType = parsed.userType || 'admin';
      return <Navigate to={getDashboardPath(userType)} replace />;
    } catch (e) {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  return <Navigate to="/dashboard" replace />;
};

export default App;
