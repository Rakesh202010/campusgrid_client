const API_BASE_URL = 'http://localhost:4001';

// Get token from localStorage
const getToken = () => localStorage.getItem('schoolAdmin_token');

// API request wrapper
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    // Handle unauthorized
    if (response.status === 401) {
      localStorage.removeItem('schoolAdmin_token');
      localStorage.removeItem('schoolAdmin_info');
      window.location.href = '/login';
      return null;
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Authentication APIs
export const auth = {
  login: (credentials) =>
    apiRequest('/api/school-auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  logout: () =>
    apiRequest('/api/school-auth/logout', {
      method: 'POST',
    }),

  me: () => apiRequest('/api/school-auth/me'),

  changePassword: (passwords) =>
    apiRequest('/api/school-auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwords),
    }),

  getSchool: () => apiRequest('/api/school-auth/school'),
};

// Students APIs
export const students = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/students${queryString ? `?${queryString}` : ''}`);
  },
  
  getById: (id) => apiRequest(`/api/students/${id}`),
  
  getStats: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/students/stats${queryString ? `?${queryString}` : ''}`);
  },
  
  getNextAdmissionNumber: (prefix) => 
    apiRequest(`/api/students/next-admission-number${prefix ? `?prefix=${prefix}` : ''}`),
  
  create: (studentData) =>
    apiRequest('/api/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    }),
  
  update: (id, studentData) =>
    apiRequest(`/api/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(studentData),
    }),
  
  delete: (id, permanent = false) =>
    apiRequest(`/api/students/${id}${permanent ? '?permanent=true' : ''}`, {
      method: 'DELETE',
    }),
  
  // Parent management
  addParent: (studentId, parentData) =>
    apiRequest(`/api/students/${studentId}/parents`, {
      method: 'POST',
      body: JSON.stringify(parentData),
    }),
  
  updateParent: (studentId, parentId, parentData) =>
    apiRequest(`/api/students/${studentId}/parents/${parentId}`, {
      method: 'PUT',
      body: JSON.stringify(parentData),
    }),
  
  deleteParent: (studentId, parentId) =>
    apiRequest(`/api/students/${studentId}/parents/${parentId}`, {
      method: 'DELETE',
    }),
  
  // Link an existing parent to a student
  linkParent: (studentId, linkData) =>
    apiRequest(`/api/students/${studentId}/parents/link`, {
      method: 'POST',
      body: JSON.stringify(linkData),
    }),
  
  // Promotion
  promote: (data) =>
    apiRequest('/api/students/promote', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Export students
  export: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const token = localStorage.getItem('schoolAdmin_token');
    // Direct download - returns blob
    return fetch(`http://localhost:4001/api/students/export${queryString ? `?${queryString}` : ''}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.blob());
  },

  // Get import template
  getImportTemplate: () => {
    const token = localStorage.getItem('schoolAdmin_token');
    return fetch('http://localhost:4001/api/students/import-template', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => res.blob());
  },

  // Import students
  import: (data) =>
    apiRequest('/api/students/import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Academic Mapping
  getAcademicMapping: (id) => apiRequest(`/api/students/${id}/academic-mapping`),
  
  updateClassSection: (id, data) =>
    apiRequest(`/api/students/${id}/class-section`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// Teachers APIs
export const teachers = {
  // CRUD
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/teachers${queryString ? `?${queryString}` : ''}`);
  },
  getStats: () => apiRequest('/api/teachers/stats'),
  getById: (id) => apiRequest(`/api/teachers/${id}`),
  create: (data) => apiRequest('/api/teachers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/api/teachers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/api/teachers/${id}`, { method: 'DELETE' }),

  // Status Management
  changeStatus: (id, data) => apiRequest(`/api/teachers/${id}/status`, { method: 'POST', body: JSON.stringify(data) }),

  // Subject Assignments
  getSubjects: (id, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/teachers/${id}/subjects${queryString ? `?${queryString}` : ''}`);
  },
  assignSubject: (id, data) => apiRequest(`/api/teachers/${id}/subjects`, { method: 'POST', body: JSON.stringify(data) }),
  bulkAssignSubjects: (id, data) => apiRequest(`/api/teachers/${id}/subjects/bulk`, { method: 'POST', body: JSON.stringify(data) }),
  removeSubject: (teacherId, assignmentId) => apiRequest(`/api/teachers/${teacherId}/subjects/${assignmentId}`, { method: 'DELETE' }),

  // Leave Management
  getLeaveTypes: () => apiRequest('/api/teachers/leave-types'),
  createLeaveType: (data) => apiRequest('/api/teachers/leave-types', { method: 'POST', body: JSON.stringify(data) }),
  getAllLeaveApplications: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/teachers/leave-applications${queryString ? `?${queryString}` : ''}`);
  },
  getLeaveBalance: (id, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/teachers/${id}/leave-balance${queryString ? `?${queryString}` : ''}`);
  },
  getLeaveApplications: (id, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/teachers/${id}/leave-applications${queryString ? `?${queryString}` : ''}`);
  },
  applyLeave: (id, data) => apiRequest(`/api/teachers/${id}/leave-applications`, { method: 'POST', body: JSON.stringify(data) }),
  processLeave: (teacherId, applicationId, data) => apiRequest(`/api/teachers/${teacherId}/leave-applications/${applicationId}`, { method: 'POST', body: JSON.stringify(data) }),

  // Attendance
  getAttendance: (id, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/teachers/${id}/attendance${queryString ? `?${queryString}` : ''}`);
  },
  getAttendanceSummary: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/teachers/attendance/summary${queryString ? `?${queryString}` : ''}`);
  },
  markAttendance: (data) => apiRequest('/api/teachers/attendance/mark', { method: 'POST', body: JSON.stringify(data) }),

  // Qualifications
  getQualifications: (id) => apiRequest(`/api/teachers/${id}/qualifications`),
  addQualification: (id, data) => apiRequest(`/api/teachers/${id}/qualifications`, { method: 'POST', body: JSON.stringify(data) }),
  deleteQualification: (id, qualId) => apiRequest(`/api/teachers/${id}/qualifications/${qualId}`, { method: 'DELETE' }),

  // Experience
  getExperiences: (id) => apiRequest(`/api/teachers/${id}/experience`),
  addExperience: (id, data) => apiRequest(`/api/teachers/${id}/experience`, { method: 'POST', body: JSON.stringify(data) }),
  deleteExperience: (id, expId) => apiRequest(`/api/teachers/${id}/experience/${expId}`, { method: 'DELETE' }),

  // Documents
  getDocuments: (id) => apiRequest(`/api/teachers/${id}/documents`),
  addDocument: (id, data) => apiRequest(`/api/teachers/${id}/documents`, { method: 'POST', body: JSON.stringify(data) }),
  verifyDocument: (id, docId, data) => apiRequest(`/api/teachers/${id}/documents/${docId}/verify`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteDocument: (id, docId) => apiRequest(`/api/teachers/${id}/documents/${docId}`, { method: 'DELETE' }),

  // Login/Credentials
  createLogin: (id, data) => apiRequest(`/api/teachers/${id}/create-login`, { method: 'POST', body: JSON.stringify(data) }),
  resetPassword: (id, data) => apiRequest(`/api/teachers/${id}/reset-password`, { method: 'POST', body: JSON.stringify(data) }),
  toggleLoginAccess: (id, enable) => apiRequest(`/api/teachers/${id}/toggle-login`, { method: 'POST', body: JSON.stringify({ enable }) }),

  // Audit Logs
  getAuditLogs: (id) => apiRequest(`/api/teachers/${id}/audit-logs`),

  // Bulk Operations
  bulkImport: (data) => apiRequest('/api/teachers/import', { method: 'POST', body: JSON.stringify(data) }),
  export: (format = 'json') => apiRequest(`/api/teachers/export?format=${format}`),
};

// Subject Assignments APIs (comprehensive)
export const subjectAssignments = {
  // Views
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/subject-assignments${queryString ? `?${queryString}` : ''}`);
  },
  getByTeacher: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/subject-assignments/by-teacher${queryString ? `?${queryString}` : ''}`);
  },
  getBySubject: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/subject-assignments/by-subject${queryString ? `?${queryString}` : ''}`);
  },
  getByClass: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/subject-assignments/by-class${queryString ? `?${queryString}` : ''}`);
  },
  getVacant: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/subject-assignments/vacant${queryString ? `?${queryString}` : ''}`);
  },
  getWorkload: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/subject-assignments/workload${queryString ? `?${queryString}` : ''}`);
  },

  // Conflict checking
  checkConflicts: (data) => apiRequest('/api/subject-assignments/check-conflicts', { method: 'POST', body: JSON.stringify(data) }),

  // Assignment operations
  assign: (data) => apiRequest('/api/subject-assignments', { method: 'POST', body: JSON.stringify(data) }),
  bulkAssignToTeacher: (data) => apiRequest('/api/subject-assignments/bulk-to-teacher', { method: 'POST', body: JSON.stringify(data) }),
  bulkAssignToClasses: (data) => apiRequest('/api/subject-assignments/bulk-to-classes', { method: 'POST', body: JSON.stringify(data) }),
  transfer: (data) => apiRequest('/api/subject-assignments/transfer', { method: 'POST', body: JSON.stringify(data) }),
  copyToSession: (data) => apiRequest('/api/subject-assignments/copy-to-session', { method: 'POST', body: JSON.stringify(data) }),

  // Update/Delete
  update: (id, data) => apiRequest(`/api/subject-assignments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/api/subject-assignments/${id}`, { method: 'DELETE' }),
  bulkDelete: (data) => apiRequest('/api/subject-assignments/bulk-delete', { method: 'POST', body: JSON.stringify(data) }),
};

// Classes APIs
export const classes = {
  getAll: () => apiRequest('/api/classes'),
  
  getById: (id) => apiRequest(`/api/classes/${id}`),
  
  create: (classData) =>
    apiRequest('/api/classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    }),
  
  update: (id, classData) =>
    apiRequest(`/api/classes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(classData),
    }),
  
  delete: (id) =>
    apiRequest(`/api/classes/${id}`, {
      method: 'DELETE',
    }),
};

// Academic Sessions APIs
export const academicSessions = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/academic-sessions${queryString ? `?${queryString}` : ''}`);
  },
  
  getById: (id) => apiRequest(`/api/academic-sessions/${id}`),
  
  getCurrent: () => apiRequest('/api/academic-sessions/current'),
  
  create: (sessionData) =>
    apiRequest('/api/academic-sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    }),
  
  update: (id, sessionData) =>
    apiRequest(`/api/academic-sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sessionData),
    }),
  
  delete: (id) =>
    apiRequest(`/api/academic-sessions/${id}`, {
      method: 'DELETE',
    }),
  
  setCurrent: (id) =>
    apiRequest(`/api/academic-sessions/${id}/set-current`, {
      method: 'POST',
    }),
};

// Class Configuration APIs
export const classConfig = {
  // Class Grades
  getGrades: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/class-config/grades${queryString ? `?${queryString}` : ''}`);
  },
  
  createGrade: (data) =>
    apiRequest('/api/class-config/grades', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateGrade: (id, data) =>
    apiRequest(`/api/class-config/grades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  deleteGrade: (id) =>
    apiRequest(`/api/class-config/grades/${id}`, {
      method: 'DELETE',
    }),

  // Sections
  getSections: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/class-config/sections${queryString ? `?${queryString}` : ''}`);
  },
  
  createSection: (data) =>
    apiRequest('/api/class-config/sections', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateSection: (id, data) =>
    apiRequest(`/api/class-config/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  deleteSection: (id) =>
    apiRequest(`/api/class-config/sections/${id}`, {
      method: 'DELETE',
    }),

  // Class Sections (Grade + Section combinations)
  getClassSections: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/class-config/class-sections${queryString ? `?${queryString}` : ''}`);
  },
  
  createClassSection: (data) =>
    apiRequest('/api/class-config/class-sections', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  bulkCreateClassSections: (data) =>
    apiRequest('/api/class-config/class-sections/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateClassSection: (id, data) =>
    apiRequest(`/api/class-config/class-sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  deleteClassSection: (id) =>
    apiRequest(`/api/class-config/class-sections/${id}`, {
      method: 'DELETE',
    }),

  copyClassSections: (data) =>
    apiRequest('/api/class-config/class-sections/copy', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Subject & Curriculum Configuration
export const subjects = {
  // Subjects
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/subjects${queryString ? `?${queryString}` : ''}`);
  },

  create: (data) =>
    apiRequest('/api/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  bulkCreate: (subjectsList) =>
    apiRequest('/api/subjects/bulk', {
      method: 'POST',
      body: JSON.stringify({ subjects: subjectsList }),
    }),

  update: (id, data) =>
    apiRequest(`/api/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    apiRequest(`/api/subjects/${id}`, {
      method: 'DELETE',
    }),

  // Curriculum (Class-Subject assignments)
  getCurriculum: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/subjects/curriculum${queryString ? `?${queryString}` : ''}`);
  },

  assignToClass: (data) =>
    apiRequest('/api/subjects/curriculum', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  bulkAssign: (data) =>
    apiRequest('/api/subjects/curriculum/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  copyCurriculum: (data) =>
    apiRequest('/api/subjects/curriculum/copy', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateAssignment: (id, data) =>
    apiRequest(`/api/subjects/curriculum/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  removeFromClass: (id) =>
    apiRequest(`/api/subjects/curriculum/${id}`, {
      method: 'DELETE',
    }),
};

// Subject Masters (Categories & Types)
export const subjectMasters = {
  // Categories
  getCategories: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/subject-masters/categories${queryString ? `?${queryString}` : ''}`);
  },
  createCategory: (data) =>
    apiRequest('/api/subject-masters/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCategory: (id, data) =>
    apiRequest(`/api/subject-masters/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCategory: (id) =>
    apiRequest(`/api/subject-masters/categories/${id}`, {
      method: 'DELETE',
    }),

  // Types
  getTypes: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/subject-masters/types${queryString ? `?${queryString}` : ''}`);
  },
  createType: (data) =>
    apiRequest('/api/subject-masters/types', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateType: (id, data) =>
    apiRequest(`/api/subject-masters/types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteType: (id) =>
    apiRequest(`/api/subject-masters/types/${id}`, {
      method: 'DELETE',
    }),
};

// Streams/Courses Master
export const streams = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/streams${queryString ? `?${queryString}` : ''}`);
  },
  create: (data) =>
    apiRequest('/api/streams', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id, data) =>
    apiRequest(`/api/streams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id) =>
    apiRequest(`/api/streams/${id}`, {
      method: 'DELETE',
    }),
};

// Fee & Finance Configuration
export const fees = {
  // Fee Types
  getTypes: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/fees/types${queryString ? `?${queryString}` : ''}`);
  },

  createType: (data) =>
    apiRequest('/api/fees/types', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  bulkCreateTypes: (feeTypes) =>
    apiRequest('/api/fees/types/bulk', {
      method: 'POST',
      body: JSON.stringify({ feeTypes }),
    }),

  updateType: (id, data) =>
    apiRequest(`/api/fees/types/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteType: (id) =>
    apiRequest(`/api/fees/types/${id}`, {
      method: 'DELETE',
    }),

  // Fee Structures
  getStructures: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/fees/structures${queryString ? `?${queryString}` : ''}`);
  },

  createStructure: (data) =>
    apiRequest('/api/fees/structures', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  bulkCreateStructures: (data) =>
    apiRequest('/api/fees/structures/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStructure: (id, data) =>
    apiRequest(`/api/fees/structures/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteStructure: (id) =>
    apiRequest(`/api/fees/structures/${id}`, {
      method: 'DELETE',
    }),

  // Discount Types
  getDiscounts: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/fees/discounts${queryString ? `?${queryString}` : ''}`);
  },

  createDiscount: (data) =>
    apiRequest('/api/fees/discounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  bulkCreateDiscounts: (discounts) =>
    apiRequest('/api/fees/discounts/bulk', {
      method: 'POST',
      body: JSON.stringify({ discounts }),
    }),

  updateDiscount: (id, data) =>
    apiRequest(`/api/fees/discounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteDiscount: (id) =>
    apiRequest(`/api/fees/discounts/${id}`, {
      method: 'DELETE',
    }),

  // Student Dues
  getStudentDues: (studentId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/fees/dues/student/${studentId}${queryString ? `?${queryString}` : ''}`);
  },

  generateStudentDues: (data) =>
    apiRequest('/api/fees/dues/generate/student', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  generateClassDues: (data) =>
    apiRequest('/api/fees/dues/generate/class', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  calculateLateFees: (data) =>
    apiRequest('/api/fees/dues/calculate-late-fees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// People & User Configuration
export const people = {
  // Stats
  getStats: () => apiRequest('/api/people/stats'),

  // Staff Departments (Non-Teaching)
  getDepartments: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/people/departments${queryString ? `?${queryString}` : ''}`);
  },

  createDepartment: (data) =>
    apiRequest('/api/people/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateDepartment: (id, data) =>
    apiRequest(`/api/people/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteDepartment: (id) =>
    apiRequest(`/api/people/departments/${id}`, {
      method: 'DELETE',
    }),

  // User Roles with RBAC Permissions
  getRoles: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/people/roles${queryString ? `?${queryString}` : ''}`);
  },

  createRole: (data) =>
    apiRequest('/api/people/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRole: (id, data) =>
    apiRequest(`/api/people/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteRole: (id) =>
    apiRequest(`/api/people/roles/${id}`, {
      method: 'DELETE',
    }),

  // Role Permissions (RBAC)
  getRolePermissions: (roleId) =>
    apiRequest(`/api/people/roles/${roleId}/permissions`),

  updateRolePermissions: (roleId, permissions) =>
    apiRequest(`/api/people/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    }),

  // Staff Members
  getStaff: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/people/staff${queryString ? `?${queryString}` : ''}`);
  },

  createStaff: (data) =>
    apiRequest('/api/people/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStaff: (id, data) =>
    apiRequest(`/api/people/staff/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteStaff: (id) =>
    apiRequest(`/api/people/staff/${id}`, {
      method: 'DELETE',
    }),

  // Staff Access/Login Management
  updateStaffAccess: (staffId, accessData) =>
    apiRequest(`/api/people/staff/${staffId}/access`, {
      method: 'PUT',
      body: JSON.stringify(accessData),
    }),

  resetStaffPassword: (staffId, data) =>
    apiRequest(`/api/people/staff/${staffId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  toggleStaffLogin: (staffId, enable) =>
    apiRequest(`/api/people/staff/${staffId}/toggle-login`, {
      method: 'POST',
      body: JSON.stringify({ enable }),
    }),

  // Parents
  getParents: (params = {}) => {
    // Always include students for parent list
    const paramsWithStudents = { ...params, include_students: 'true' };
    const queryString = new URLSearchParams(paramsWithStudents).toString();
    return apiRequest(`/api/people/parents${queryString ? `?${queryString}` : ''}`);
  },

  createParent: (data) =>
    apiRequest('/api/people/parents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateParent: (id, data) =>
    apiRequest(`/api/people/parents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteParent: (id) =>
    apiRequest(`/api/people/parents/${id}`, {
      method: 'DELETE',
    }),

  // User Login Management
  createStudentLogin: (studentId, password) =>
    apiRequest('/api/user-auth/student/create-login', {
      method: 'POST',
      body: JSON.stringify({ studentId, password }),
    }),

  createParentLogin: (parentId, password) =>
    apiRequest('/api/user-auth/parent/create-login', {
      method: 'POST',
      body: JSON.stringify({ parentId, password }),
    }),
};

// Class Timing Configuration
export const classTimings = {
  // School Timing Settings (General/Default)
  getSettings: () => apiRequest('/api/class-timings/settings'),
  
  saveSettings: (data) =>
    apiRequest('/api/class-timings/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Day-wise Timing Configuration (Mon-Sat different hours)
  getDayWise: () => apiRequest('/api/class-timings/day-wise'),
  
  // Get all days with their template periods (for Timetable page)
  getDayWiseWithPeriods: () => apiRequest('/api/class-timings/day-wise/all-periods'),
  
  saveDayWise: (dayTimings) =>
    apiRequest('/api/class-timings/day-wise', {
      method: 'POST',
      body: JSON.stringify({ dayTimings }),
    }),

  // Get timing for specific date (combines exceptions, day-wise, defaults)
  getForDate: (date) => apiRequest(`/api/class-timings/date/${date}`),

  // Timing Templates
  getTemplates: () => apiRequest('/api/class-timings/templates'),
  
  getTemplateById: (id) => apiRequest(`/api/class-timings/templates/${id}`),
  
  createTemplate: (data) =>
    apiRequest('/api/class-timings/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  updateTemplate: (id, data) =>
    apiRequest(`/api/class-timings/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  deleteTemplate: (id) =>
    apiRequest(`/api/class-timings/templates/${id}`, {
      method: 'DELETE',
    }),

  // Periods and Breaks
  savePeriods: (templateId, periods) =>
    apiRequest(`/api/class-timings/templates/${templateId}/periods`, {
      method: 'POST',
      body: JSON.stringify({ periods }),
    }),
  
  saveBreaks: (templateId, breaks) =>
    apiRequest(`/api/class-timings/templates/${templateId}/breaks`, {
      method: 'POST',
      body: JSON.stringify({ breaks }),
    }),

  // Get Active Timing (for Timetable/Attendance)
  getActive: (date) => apiRequest(`/api/class-timings/active${date ? `?date=${date}` : ''}`),

  // Timing Exceptions (holidays, half-days, special events)
  getExceptions: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/class-timings/exceptions${queryString ? `?${queryString}` : ''}`);
  },
  
  createException: (data) =>
    apiRequest('/api/class-timings/exceptions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  deleteException: (id) =>
    apiRequest(`/api/class-timings/exceptions/${id}`, {
      method: 'DELETE',
    }),

  // Quick Setup
  generateDefault: (data) =>
    apiRequest('/api/class-timings/generate-default', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Departments Configuration
export const departments = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/departments${queryString ? `?${queryString}` : ''}`);
  },

  getById: (id) => apiRequest(`/api/departments/${id}`),

  create: (data) =>
    apiRequest('/api/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  bulkCreate: (departmentsList) =>
    apiRequest('/api/departments/bulk', {
      method: 'POST',
      body: JSON.stringify({ departments: departmentsList }),
    }),

  update: (id, data) =>
    apiRequest(`/api/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id) =>
    apiRequest(`/api/departments/${id}`, {
      method: 'DELETE',
    }),

  reorder: (orderedIds) =>
    apiRequest('/api/departments/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds }),
    }),
};

// Timetable APIs
export const timetable = {
  getTeacher: (teacherId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/timetable/teacher/${teacherId}${queryString ? `?${queryString}` : ''}`);
  },

  getClass: (classSectionId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/timetable/class/${classSectionId}${queryString ? `?${queryString}` : ''}`);
  },

  save: (data) =>
    apiRequest('/api/timetable', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  bulkSave: (entries, academicSessionId) =>
    apiRequest('/api/timetable/bulk', {
      method: 'POST',
      body: JSON.stringify({ entries, academicSessionId }),
    }),

  delete: (id) =>
    apiRequest(`/api/timetable/${id}`, {
      method: 'DELETE',
    }),

  remove: (data) =>
    apiRequest('/api/timetable/remove', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Daily timetable view
  getDaily: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/timetable/daily?${queryString}`);
  },

  // Date-specific substitutions
  getSubstitutions: (date) =>
    apiRequest(`/api/timetable/substitutions?date=${date}`),

  getAvailableTeachers: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/timetable/substitutions/available-teachers?${queryString}`);
  },

  createSubstitution: (data) =>
    apiRequest('/api/timetable/substitutions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removeSubstitution: (id) =>
    apiRequest(`/api/timetable/substitutions/${id}`, {
      method: 'DELETE',
    }),
};

// Number Generation Settings
export const numberSettings = {
  getAll: () => apiRequest('/api/number-settings'),
  
  update: (settingType, data) =>
    apiRequest(`/api/number-settings/${settingType}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  getNextAdmissionNumber: (classSectionId) => {
    const params = classSectionId ? `?classSectionId=${classSectionId}` : '';
    return apiRequest(`/api/number-settings/next-admission-number${params}`);
  },
  
  getNextRollNumber: (classSectionId, academicSessionId) => {
    const params = new URLSearchParams();
    if (classSectionId) params.append('classSectionId', classSectionId);
    if (academicSessionId) params.append('academicSessionId', academicSessionId);
    return apiRequest(`/api/number-settings/next-roll-number?${params.toString()}`);
  },
  
  increment: (settingType) =>
    apiRequest(`/api/number-settings/${settingType}/increment`, {
      method: 'POST',
    }),
  
  reset: (settingType, data) =>
    apiRequest(`/api/number-settings/${settingType}/reset`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  bulkGenerate: (data) =>
    apiRequest('/api/number-settings/bulk-generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Dashboard
export const dashboard = {
  getStats: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/dashboard/stats${queryString ? `?${queryString}` : ''}`);
  },
  getQuickCounts: () => apiRequest('/api/dashboard/quick-counts'),
};

// Fee Settings
export const feeSettings = {
  // Receipt Templates
  getTemplates: () => apiRequest('/api/fee-settings/templates'),
  getTemplate: (id) => apiRequest(`/api/fee-settings/templates/${id}`),
  getDefaultTemplate: () => apiRequest('/api/fee-settings/templates/default'),
  createTemplate: (data) =>
    apiRequest('/api/fee-settings/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTemplate: (id, data) =>
    apiRequest(`/api/fee-settings/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteTemplate: (id) =>
    apiRequest(`/api/fee-settings/templates/${id}`, { method: 'DELETE' }),
  setDefaultTemplate: (id) =>
    apiRequest(`/api/fee-settings/templates/${id}/set-default`, { method: 'POST' }),
  duplicateTemplate: (id, data) =>
    apiRequest(`/api/fee-settings/templates/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // School settings
  getSchoolSettings: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/fee-settings/school${queryString ? `?${queryString}` : ''}`);
  },
  saveSchoolSettings: (data) =>
    apiRequest('/api/fee-settings/school', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Class settings
  getClassSettings: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/fee-settings/class${queryString ? `?${queryString}` : ''}`);
  },
  saveClassSettings: (data) =>
    apiRequest('/api/fee-settings/class', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteClassSettings: (id) =>
    apiRequest(`/api/fee-settings/class/${id}`, { method: 'DELETE' }),
  
  // Installments
  getInstallments: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/fee-settings/installments${queryString ? `?${queryString}` : ''}`);
  },
  saveInstallments: (data) =>
    apiRequest('/api/fee-settings/installments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  
  // Calendar
  getCalendar: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/fee-settings/calendar${queryString ? `?${queryString}` : ''}`);
  },
  generateCalendar: (data) =>
    apiRequest('/api/fee-settings/calendar/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCalendar: (id, data) =>
    apiRequest(`/api/fee-settings/calendar/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  
  // Effective settings
  getEffectiveSettings: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/fee-settings/effective${queryString ? `?${queryString}` : ''}`);
  },
};

// Fee Management
export const feeManagement = {
  getOverview: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/fee-management/overview${queryString ? `?${queryString}` : ''}`);
  },
  searchStudents: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/fee-management/students/search${queryString ? `?${queryString}` : ''}`);
  },
  getStudentFeeDetails: (studentId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/fee-management/students/${studentId}${queryString ? `?${queryString}` : ''}`);
  },
  collectFee: (data) =>
    apiRequest('/api/fee-management/collect', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getReceipt: (paymentId) => apiRequest(`/api/fee-management/receipt/${paymentId}`),
  cancelPayment: (paymentId, data) =>
    apiRequest(`/api/fee-management/cancel/${paymentId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCollectionReport: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/fee-management/reports/collection${queryString ? `?${queryString}` : ''}`);
  },
  getPendingDuesReport: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/fee-management/reports/pending-dues${queryString ? `?${queryString}` : ''}`);
  },
  getClassWiseReport: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/fee-management/reports/class-wise${queryString ? `?${queryString}` : ''}`);
  },
  getFeeTypeWiseReport: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/api/fee-management/reports/fee-type-wise${queryString ? `?${queryString}` : ''}`);
  },
  generateDues: (data) =>
    apiRequest('/api/fee-management/generate-dues', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  generateStudentDues: (data) =>
    apiRequest('/api/fee-management/generate-student-dues', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export default {
  auth,
  students,
  teachers,
  classes,
  academicSessions,
  classConfig,
  subjects,
  fees,
  people,
  subjectAssignments,
  classTimings,
  departments,
  timetable,
  numberSettings,
  dashboard,
};

