import { Menu, Bell, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header({ onMenuClick, title }) {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 md:px-8 bg-white border-b border-gray-200">
            {/* Left side */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="p-2 text-gray-500 hover:text-gray-700 lg:hidden"
                >
                    <Menu className="w-6 h-6" />
                </button>

                {title && (
                    <h1 className="text-xl font-bold text-gray-900 hidden sm:block">{title}</h1>
                )}
            </div>

            {/* Search */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Поиск курсов..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
                <button 
            onClick={() => navigate('/notice')}
            className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors hover:bg-gray-100 rounded-lg group"
        >
            <Bell className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            
        </button>

                <div 
            className="w-10 h-10 bg-gradient-to-br from-primary to-purple-700 rounded-full flex items-center justify-center text-white font-medium cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => navigate('/profile')}
            title="Профиль пользователя"
        >
            {user?.name?.charAt(0) || 'U'}
        </div>
            </div>
        </header>
    );
}
