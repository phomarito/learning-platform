import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute, PublicRoute, AdminRoute, TeacherRoute } from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
import LoginPage from './pages/LoginPage';
import CoursesPage from './pages/CoursesPage';
import CourseDetailPage from './pages/CourseDetailPage';
import LessonPage from './pages/LessonPage';
import ProfilePage from './pages/ProfilePage';

// Lazy load less common pages
import { lazy, Suspense } from 'react';

// Placeholder pages
const PortfolioPage = () => (
  <div className="text-center py-16">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Портфолио</h1>
    <p className="text-gray-600">Страница портфолио с сертификатами - в разработке</p>
  </div>
);

const ChatPage = () => (
  <div className="text-center py-16">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">AI Чат</h1>
    <p className="text-gray-600">Страница чата с AI ассистентом - в разработке</p>
  </div>
);

const AdminUsersPage = () => (
  <div className="text-center py-16">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Управление пользователями</h1>
    <p className="text-gray-600">Админ-панель - в разработке</p>
  </div>
);

const TeacherCoursesPage = () => (
  <div className="text-center py-16">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Мои курсы</h1>
    <p className="text-gray-600">Панель преподавателя - в разработке</p>
  </div>
);

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
                <Route path="/portfolio" element={<PortfolioPage />} />
                <Route path="/chat" element={<ChatPage />} />

                {/* Admin routes */}
                <Route
                  path="/admin/users"
                  element={
                    <AdminRoute>
                      <AdminUsersPage />
                    </AdminRoute>
                  }
                />

                {/* Teacher routes */}
                <Route
                  path="/teacher/courses"
                  element={
                    <TeacherRoute>
                      <TeacherCoursesPage />
                    </TeacherRoute>
                  }
                />
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
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
