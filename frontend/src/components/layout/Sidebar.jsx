import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    Home,
    BookOpen,
    User,
    Settings,
    Users,
    Award,
    MessageCircle,
    X,
    LogOut,
    GraduationCap
} from 'lucide-react';

const navItems = [
    { path: '/courses', icon: BookOpen, label: 'Курсы', roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
    { path: '/profile', icon: User, label: 'Профиль', roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
    { path: '/portfolio', icon: Award, label: 'Портфолио', roles: ['STUDENT'] },
    { path: '/chat', icon: MessageCircle, label: 'AI Чат', roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
    { path: '/admin/users', icon: Users, label: 'Пользователи', roles: ['ADMIN'] },
    { path: '/teacher/courses', icon: GraduationCap, label: 'Мои курсы', roles: ['TEACHER'] },
];

export default function Sidebar({ isOpen, onClose }) {
    const { user, logout } = useAuth();
    const location = useLocation();

    const filteredNavItems = navItems.filter(item =>
        item.roles.includes(user?.role)
    );

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-20 bg-gray-900/50 lg:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed top-0 left-0 z-30 h-full w-[280px] bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                {/* Logo */}
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-700 rounded-lg flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg text-gray-900">MicroLearning</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 text-gray-500 hover:text-gray-700"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* User info */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-700 rounded-full flex items-center justify-center text-white font-medium">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{user?.name}</p>
                            <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <div className="mt-3">
                        <span className={`
              inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
              ${user?.role === 'ADMIN' ? 'bg-red-100 text-red-800' : ''}
              ${user?.role === 'TEACHER' ? 'bg-blue-100 text-blue-800' : ''}
              ${user?.role === 'STUDENT' ? 'bg-green-100 text-green-800' : ''}
            `}>
                            {user?.role === 'ADMIN' && 'Администратор'}
                            {user?.role === 'TEACHER' && 'Преподаватель'}
                            {user?.role === 'STUDENT' && 'Студент'}
                        </span>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {filteredNavItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors
                ${isActive
                                    ? 'bg-primary text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }
              `}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Logout */}
                <div className="p-4 border-t border-gray-100">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
                    >
                        <LogOut className="w-5 h-5" />
                        Выйти
                    </button>
                </div>
            </aside>
        </>
    );
}
