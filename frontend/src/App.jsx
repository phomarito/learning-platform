import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ProtectedRoute, PublicRoute, AdminRoute, TeacherRoute } from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
import LoginPage from './pages/LoginPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import LessonPage from './pages/LessonPage';
import ProfilePage from './pages/ProfilePage';
import PortfolioPage from './pages/PortfolioPage'
import NoticePage from './pages/NoticePage'
import AdminUsersPage from './pages/AdminUsersPage'
import CourseCreatePage from './pages/CourseCreatePage'
import LessonCreatePage from './pages/LessonCreatePage'
import ChatsPage from './pages/ChatsPage'
import ChatPage from './pages/ChatPage';
import CourseStudentsPage from './pages/CourseStudentsPage';
import CourseAnalyticsPage from './pages/CourseAnalyticsPage';
import CourseEditPage from './pages/CourseEditPage';


import { lazy, Suspense } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />

              {/* Protected routes with dashboard layout */}
              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/courses" element={<CoursesPage />} />
                <Route path="/courses/:id" element={<CourseDetailPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/notice" element={<NoticePage />} />
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/chats" element={<ChatsPage />} />
                <Route path="chat/:chatId" element={<ChatPage />} />

                {/* Admin routes */}
                <Route
                  path="/admin/users"
                  element={
                    <AdminRoute>
                      <AdminUsersPage />
                    </AdminRoute>
                  }
                />
                <Route path="/courses/create" element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
                    <CourseCreatePage />
                  </ProtectedRoute>
                } />

                <Route path="courses/:id/students" element={
                  <ProtectedRoute requireTeacherOrAdmin>
                      <CourseStudentsPage />
                  </ProtectedRoute>
              } />
              <Route path="courses/:id/analytics" element={
                  <ProtectedRoute requireTeacherOrAdmin>
                      <CourseAnalyticsPage />
                  </ProtectedRoute>
              } />
              <Route path="courses/:id/edit" element={
                  <ProtectedRoute requireTeacherOrAdmin>
                      <CourseEditPage />
                  </ProtectedRoute>
              } />

              <Route path="courses/:id/edit" element={
                  <ProtectedRoute requireTeacherOrAdmin>
                      <LessonCreatePage />
                  </ProtectedRoute>
              } />

                <Route path="/courses/:courseId/lessons/create" element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
                    <LessonCreatePage />
                  </ProtectedRoute>
                } />

                {/* <Route path="/lessons/:id/edit" element={
                  <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
                    <LessonEditPage />
                  </ProtectedRoute>
                } /> */}

              </Route>

              {/* Lesson page - full screen without sidebar */}
              <Route
                path="/lessons/:id"
                element={
                  <ProtectedRoute>
                    <LessonPage />
                  </ProtectedRoute>
                }
              />

              {/* Redirects */}
              <Route path="/" element={<Navigate to="/courses" replace />} />
              <Route path="*" element={<Navigate to="/courses" replace />} />
            </Routes>
          </Suspense>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
