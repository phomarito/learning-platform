import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Loading spinner component
function LoadingSpinner() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-600">Загрузка...</p>
            </div>
        </div>
    );
}

// Main ProtectedRoute component
export function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Если загружаемся - показываем лоадер
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Если не авторизован - редирект на логин
  if (!isAuthenticated) {
    // Сохраняем путь для возврата после логина
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Если требуется админ, но пользователь не админ
  if (requireAdmin && user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Admin only route
export function AdminRoute({ children }) {
    const { isAuthenticated, isAdmin, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
}

// Teacher or Admin route
export function TeacherRoute({ children }) {
    const { isAuthenticated, isTeacher, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!isTeacher) {
        return <Navigate to="/" replace />;
    }

    return children;
}

// Public route - redirect to dashboard if authenticated
export function PublicRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (isAuthenticated) {
        return <Navigate to="/courses" replace />;
    }

    return children;
}

// Экспорт по умолчанию (для совместимости)
export default ProtectedRoute;