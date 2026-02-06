import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Проверка аутентификации при монтировании
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');

            if (token && savedUser) {
                try {
                    // Проверяем валидность токена
                    const response = await authAPI.getMe();
                    
                    // Обновляем данные пользователя
                    const updatedUser = response.data.data;
                    setUser(updatedUser);
                    setIsAuthenticated(true);
                    
                    // Синхронизируем localStorage
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                } catch (error) {
                    // Токен невалидный, очищаем хранилище
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setUser(null);
                    setIsAuthenticated(false);
                }
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            setIsLoading(true);
            const response = await authAPI.login(email, password);
            const { token, user: userData } = response.data.data;

            // Сохраняем в localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));

            // Обновляем состояние
            setUser(userData);
            setIsAuthenticated(true);

            return { success: true, user: userData };
        } catch (error) {
            const errorMessage = error.response?.data?.message || 
                               error.message || 
                               'Ошибка авторизации';
            
            console.error('Login error:', error);
            
            return {
                success: false,
                message: errorMessage
            };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        // Очищаем localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Сбрасываем состояние
        setUser(null);
        setIsAuthenticated(false);
        
        // Можно добавить запрос на сервер для выхода
        // authAPI.logout();
    };

    const updateUser = (updatedData) => {
        const newUser = { ...user, ...updatedData };
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
    };

    const refreshUser = async () => {
        try {
            const response = await authAPI.getMe();
            const updatedUser = response.data.data;
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    };

    const value = {
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        updateUser,
        refreshUser,
        isAdmin: user?.role === 'ADMIN',
        isTeacher: user?.role === 'TEACHER' || user?.role === 'ADMIN',
        isStudent: user?.role === 'STUDENT',
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}