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
  getAll: () => apiRequest('/api/students'),
  
  getById: (id) => apiRequest(`/api/students/${id}`),
  
  create: (studentData) =>
    apiRequest('/api/students', {
      method: 'POST',
      body: JSON.stringify(studentData),
    }),
  
  update: (id, studentData) =>
    apiRequest(`/api/students/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(studentData),
    }),
  
  delete: (id) =>
    apiRequest(`/api/students/${id}`, {
      method: 'DELETE',
    }),
};

// Teachers APIs
export const teachers = {
  getAll: () => apiRequest('/api/teachers'),
  
  getById: (id) => apiRequest(`/api/teachers/${id}`),
  
  create: (teacherData) =>
    apiRequest('/api/teachers', {
      method: 'POST',
      body: JSON.stringify(teacherData),
    }),
  
  update: (id, teacherData) =>
    apiRequest(`/api/teachers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(teacherData),
    }),
  
  delete: (id) =>
    apiRequest(`/api/teachers/${id}`, {
      method: 'DELETE',
    }),
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
};

