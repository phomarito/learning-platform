import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    login: (email, password) => api.post('/auth/login', { email, password }),
    getMe: () => api.get('/auth/me'),
    changePassword: (currentPassword, newPassword) =>
        api.put('/auth/password', { currentPassword, newPassword }),
};

// Users API (Admin)
export const usersAPI = {
    getAll: (params) => api.get('/users', { params }),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`),
};

// Courses API
export const coursesAPI = {
    getAll: (params) => api.get('/courses', { params }),
    getById: (id) => api.get(`/courses/${id}`),
    create: (data) => api.post('/courses', data),
    update: (id, data) => api.put(`/courses/${id}`, data),
    delete: (id) => api.delete(`/courses/${id}`),
    enroll: (id) => api.post(`/courses/${id}/enroll`),
    assignStudent: (courseId, userId) => api.post(`/courses/${courseId}/students`, { userId }),
};

// Lessons API
export const lessonsAPI = {
    getById: (id) => api.get(`/lessons/${id}`),
    create: (data) => api.post('/lessons', data),
    update: (id, data) => api.put(`/lessons/${id}`, data),
    delete: (id) => api.delete(`/lessons/${id}`),
    reorder: (lessonOrders) => api.put('/lessons/reorder', { lessonOrders }),
};

// Progress API
export const progressAPI = {
    getAll: () => api.get('/progress'),
    update: (lessonId, data) => api.put(`/progress/${lessonId}`, data),
    getPortfolio: () => api.get('/progress/portfolio'),
};

// Chat API
export const chatAPI = {
    getHistory: (limit = 50) => api.get('/chat/history', { params: { limit } }),
    sendMessage: (message, context) => api.post('/chat', { message, context }),
    getRecommendations: () => api.post('/chat/recommendations'),
    getResume: () => api.post('/chat/resume'),
    deleteMessage: (id) => api.delete(`/chat/${id}`),
};

export default api;
