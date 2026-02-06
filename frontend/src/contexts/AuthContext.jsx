// frontend/src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/client';
import Cookies from 'js-cookie';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [serverStatus, setServerStatus] = useState('checking');

    // Функция для проверки доступности сервера
    const checkServer = useCallback(async () => {
        try {
            console.log('🩺 Checking server health...');
            const response = await fetch('http://localhost:3000/health', {
                method: 'GET',
                credentials: 'include',
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Server is healthy:', data);
                setServerStatus('healthy');
                return true;
            } else {
                console.error('❌ Server health check failed:', response.status);
                setServerStatus('unhealthy');
                return false;
            }
        } catch (error) {
            console.error('❌ Cannot connect to server:', error.message);
            setServerStatus('offline');
            return false;
        }
    }, []);

    const checkAuth = useCallback(async () => {
        try {
            // Сначала проверяем сервер
            const serverOk = await checkServer();
            if (!serverOk) {
                console.error('Server is not available');
                throw new Error('Server is not available');
            }
            
            console.log('🔐 Checking auth...');
            const response = await authAPI.getMe();
            const userData = response.data.data;
            console.log('✅ Auth success:', userData);
            
            setUser(userData);
            setIsAuthenticated(true);
            
            Cookies.set('user', JSON.stringify({
                id: userData.id,
                email: userData.email,
                name: userData.name,
                role: userData.role,
            }), { 
                expires: 7,
                sameSite: 'lax',
                secure: false,
            });
            
            return { success: true, user: userData };
        } catch (error) {
            console.error('❌ Auth check failed:', error.message);
            
            // Очищаем только при реальной ошибке 401
            if (error.response?.status === 401) {
                Cookies.remove('user');
                setUser(null);
                setIsAuthenticated(false);
            }
            
            return { success: false, error };
        }
    }, [checkServer]);

    useEffect(() => {
        const initAuth = async () => {
            console.log('🚀 Initializing auth...');
            await checkAuth();
            setIsLoading(false);
        };

        initAuth();
    }, [checkAuth]);

    const login = async (email, password) => {
        try {
            setIsLoading(true);
            console.log('🔐 Login attempt for:', email);
            
            // Проверяем сервер перед логином
            const serverOk = await checkServer();
            if (!serverOk) {
                throw new Error('Сервер недоступен. Проверьте запущен ли бэкенд.');
            }
            
            console.log('📤 Sending login request...');
            const response = await authAPI.login(email, password);
            console.log('✅ Login response:', response.data);
            
            const userData = response.data.data.user;

            const safeUserData = {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                role: userData.role,
            };
            
            // Устанавливаем куку
            Cookies.set('user', JSON.stringify(safeUserData), { 
                expires: 7,
                sameSite: 'lax',
                secure: false,
            });

            // Проверяем авторизацию после логина
            const authResult = await checkAuth();
            
            if (authResult.success) {
                return { success: true, user: safeUserData };
            } else {
                throw new Error('Auth check failed after login');
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            
            let errorMessage;
            
            if (error.message.includes('Network Error') || error.message.includes('Сервер недоступен')) {
                errorMessage = 'Сервер недоступен. Проверьте: 1) Запущен ли бэкенд 2) Откройте http://localhost:3000/health';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            } else {
                errorMessage = 'Ошибка авторизации';
            }
            
            return {
                success: false,
                message: errorMessage
            };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            setIsLoading(true);
            await authAPI.logout();
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            Cookies.remove('user');
            setUser(null);
            setIsAuthenticated(false);
            setIsLoading(false);
        }
    };

    const value = {
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        checkAuth,
        serverStatus,
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