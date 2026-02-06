// frontend/src/api/client.js
import axios from 'axios';

// Создаем экземпляр axios с базовыми настройками
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Для работы с cookies
});

// Request interceptor для добавления токена
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor для обработки ошибок
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Если 401 и это не запрос на обновление токена
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Здесь можно добавить логику обновления токена
      // Пока просто очищаем и редиректим
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// ==================== АВТОРИЗАЦИЯ ====================
export const authAPI = {
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),
    
  register: (data) => 
    apiClient.post('/auth/register', data),
    
  getMe: () => 
    apiClient.get('/auth/me'),
    
  changePassword: (data) =>
    apiClient.put('/auth/password', data),
    
  logout: () => 
    apiClient.post('/auth/logout'),
};

// ==================== ПОЛЬЗОВАТЕЛИ ====================
export const usersAPI = {
  getAll: (params) => 
    apiClient.get('/users', { params }),
    
  getAllForChat: () => 
    apiClient.get('/users/list'),
    
  getById: (id) => 
    apiClient.get(`/users/${id}`),
    
  update: (id, data) => 
    apiClient.put(`/users/${id}`, data),
    
  getAllAdmin: () => 
    apiClient.get('/admin/users'),
    
  create: (data) => 
    apiClient.post('/admin/users', data),
    
  updateRole: (id, data) => 
    apiClient.patch(`/admin/users/${id}/role`, data),
    
  delete: (id) => 
    apiClient.delete(`/admin/users/${id}`),
    
  getStudents: () => 
    apiClient.get('/users/students'),
    
  getTeachers: () => 
    apiClient.get('/users/teachers'),
};

// ==================== КУРСЫ ====================
export const coursesAPI = {
  // Основные методы
  getAll: (params) => 
    apiClient.get('/courses', { params }),
    
  getById: (id) => 
    apiClient.get(`/courses/${id}`),
    
  create: (data) => 
    apiClient.post('/courses', data),
    
  update: (id, data) => 
    apiClient.put(`/courses/${id}`, data),
    
  delete: (id) => 
    apiClient.delete(`/courses/${id}`),
    
  // Запись на курсы
  enroll: (courseId) => 
    apiClient.post(`/courses/${courseId}/enroll`),
    
  batchEnroll: (courseId, data) => 
    apiClient.post(`/courses/${courseId}/enrollments/batch`, data),
    
  // Студенты курса
  getStudents: (courseId) => 
    apiClient.get(`/courses/${courseId}/students`),
    
  addStudent: (courseId, data) => 
    apiClient.post(`/courses/${courseId}/students`, data),
    
  removeStudent: (courseId, userId) => 
    apiClient.delete(`/courses/${courseId}/students/${userId}`),
    
  // Поиск пользователей для записи
  getEnrollableUsers: (courseId, params) => 
    apiClient.get(`/courses/${courseId}/enrollable-users`, { params }),
    
  // Получение курсов по учителю
  getByTeacher: (teacherId, params) => 
    apiClient.get(`/courses/teacher/${teacherId}`, { params }),
    
  // Аналитика
  getAnalytics: (courseId, params) => 
    apiClient.get(`/courses/${courseId}/analytics`, { params }),
};

// ==================== УРОКИ ====================
export const lessonsAPI = {
  getById: (id) => 
    apiClient.get(`/lessons/${id}`),
    
  create: (data) => 
    apiClient.post('/lessons', data),
    
  createInCourse: (courseId, data) => 
    apiClient.post(`/courses/${courseId}/lessons`, data),
    
  update: (id, data) => 
    apiClient.put(`/lessons/${id}`, data),
    
  delete: (id) => 
    apiClient.delete(`/lessons/${id}`),
    
  complete: (id) => 
    apiClient.post(`/lessons/${id}/complete`),
    
  getByCourse: (courseId) => 
    apiClient.get(`/lessons/course/${courseId}`),
};

// ==================== ПРОГРЕСС ====================
export const progressAPI = {
  getAll: () => 
    apiClient.get('/progress'),
    
  update: (lessonId, data) => 
    apiClient.post(`/lessons/${lessonId}/progress`, data),
    
  updateLessonProgress: (lessonId, data) => 
    apiClient.put(`/progress/lessons/${lessonId}`, data),
    
  getByCourse: (courseId) => 
    apiClient.get(`/courses/${courseId}/progress`),
    
  getByCourseAlt: (courseId) => 
    apiClient.get(`/progress/course/${courseId}`),
    
  getStats: () => 
    apiClient.get('/progress/stats'),
};

// ==================== ЧАТЫ ====================
export const chatAPI = {
  // AI Chats
  getSessions: () => apiClient.get('/chat/sessions'),
  createSession: (data) => apiClient.post('/chat/sessions', data),
  
  // User Chats
  getUserChats: () => apiClient.get('/chat/user'),
  createChat: (data) => apiClient.post('/chat', data),
  
  // Universal chat endpoints
  getChat: (chatId) => {
    // Try both endpoints
    return apiClient.get(`/chat/${chatId}`).catch(() => 
      apiClient.get(`/chat/chat/${chatId}`)
    );
  },
  
  getMessages: (chatId, params = {}) => 
    apiClient.get(`/chat/${chatId}/messages`, { params }),
  
  sendMessage: (chatId, data) => 
    apiClient.post(`/chat/${chatId}/messages`, data),
  
  deleteMessage: (messageId) => 
    apiClient.delete(`/chat/messages/${messageId}`),
  
  // AI Features
  generateQuiz: (data) => 
    apiClient.post('/chat/generate-quiz', data),
  simulateConversation: (data) => 
    apiClient.post('/chat/simulate-conversation', data)
};

// ==================== ПОРТФОЛИО ====================
export const portfolioAPI = {
  get: () => 
    apiClient.get('/portfolio'),
    
  update: (data) => 
    apiClient.put('/portfolio', data),
    
  updateBio: (bio) => 
    apiClient.patch('/portfolio/bio', { bio }),
    
  addSkill: (skill) => 
    apiClient.post('/portfolio/skills', skill),
    
  deleteSkill: (id) => 
    apiClient.delete(`/portfolio/skills/${id}`),
    
  addGoal: (goal) => 
    apiClient.post('/portfolio/goals', goal),
    
  updateGoal: (id, data) => 
    apiClient.put(`/portfolio/goals/${id}`, data),
    
  deleteGoal: (id) => 
    apiClient.delete(`/portfolio/goals/${id}`),
    
  generateLink: () => 
    apiClient.post('/portfolio/generate-link'),
};

// ==================== УВЕДОМЛЕНИЯ ====================
export const noticeAPI = {
  getAll: () => 
    apiClient.get('/notices'),
    
  getUnread: () => 
    apiClient.get('/notices/unread'),
    
  markAsRead: (id) => 
    apiClient.patch(`/notices/${id}/read`),
    
  markAllAsRead: () => 
    apiClient.patch('/notices/read-all'),
    
  delete: (id) => 
    apiClient.delete(`/notices/${id}`),
};

// ==================== СЕРТИФИКАТЫ ====================
export const certificatesAPI = {
  getAll: () => 
    apiClient.get('/certificates'),
    
  getById: (id) => 
    apiClient.get(`/certificates/${id}`),
    
  generate: (courseId) => 
    apiClient.post(`/certificates/courses/${courseId}`),
    
  verify: (code) => 
    apiClient.post('/certificates/verify', { code }),
};

// ==================== АНАЛИТИКА ====================
export const analyticsAPI = {
  getUserStats: () => 
    apiClient.get('/analytics/user'),
    
  getCourseStats: (courseId) => 
    apiClient.get(`/analytics/courses/${courseId}`),
    
  getAdminStats: () => 
    apiClient.get('/analytics/admin'),
};

// ==================== ЗАГРУЗКА ФАЙЛОВ ====================
export const uploadAPI = {
  uploadAvatar: (formData) => 
    apiClient.post('/upload/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    
  uploadCourseImage: (formData) => 
    apiClient.post('/upload/course-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    
  uploadLessonFile: (formData) => 
    apiClient.post('/upload/lesson-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

export default apiClient;