import { useState, useEffect } from 'react';
import { X, Search, User, Users, Check } from 'lucide-react';
import { usersAPI } from '../api/client';

export default function EnrollUsersModal({ courseId, currentUser, onClose, onEnroll }) {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userTypeFilter, setUserTypeFilter] = useState(currentUser.role === 'ADMIN' ? 'all' : 'students');

    useEffect(() => {
        fetchUsers();
    }, [userTypeFilter]);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredUsers(users);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredUsers(users.filter(user => 
                user.name.toLowerCase().includes(query) || 
                user.email.toLowerCase().includes(query)
            ));
        }
    }, [searchQuery, users]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            let response;
            
            if (currentUser.role === 'ADMIN') {
                // Админ получает всех пользователей
                if (userTypeFilter === 'all') {
                    response = await usersAPI.getAll();
                } else if (userTypeFilter === 'teachers') {
                    response = await usersAPI.getTeachers();
                } else if (userTypeFilter === 'students') {
                    response = await usersAPI.getStudents();
                }
            } else if (currentUser.role === 'TEACHER') {
                // Преподаватель получает только студентов
                response = await usersAPI.getStudents();
            }
            
            setUsers(response.data.data || []);
            setFilteredUsers(response.data.data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleUser = (userId) => {
        setSelectedUserIds(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSelectAll = () => {
        if (selectedUserIds.length === filteredUsers.length) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(filteredUsers.map(user => user.id));
        }
    };

    const handleSubmit = async () => {
        if (selectedUserIds.length === 0) {
            alert('Выберите хотя бы одного пользователя');
            return;
        }

        setIsSubmitting(true);
        try {
            await onEnroll(selectedUserIds);
            onClose();
        } catch (error) {
            console.error('Error enrolling users:', error);
            alert('Ошибка при записи пользователей');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getRoleLabel = (role) => {
        switch(role) {
            case 'ADMIN': return 'Администратор';
            case 'TEACHER': return 'Преподаватель';
            case 'STUDENT': return 'Студент';
            default: return role;
        }
    };

    const getRoleColor = (role) => {
        switch(role) {
            case 'ADMIN': return 'bg-red-100 text-red-800';
            case 'TEACHER': return 'bg-blue-100 text-blue-800';
            case 'STUDENT': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Записать пользователей на курс</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Выберите пользователей для записи на курс
                            </p>
                        </div>
                        <button 
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="p-6 border-b border-gray-200 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="input pl-10 w-full"
                                    placeholder="Поиск по имени или email"
                                />
                            </div>
                        </div>
                        
                        {currentUser.role === 'ADMIN' && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setUserTypeFilter('all')}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        userTypeFilter === 'all' 
                                            ? 'bg-primary text-white' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <Users className="w-4 h-4 inline mr-2" />
                                    Все
                                </button>
                                <button
                                    onClick={() => setUserTypeFilter('teachers')}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        userTypeFilter === 'teachers' 
                                            ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Преподаватели
                                </button>
                                <button
                                    onClick={() => setUserTypeFilter('students')}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        userTypeFilter === 'students' 
                                            ? 'bg-green-100 text-green-700 border border-green-300' 
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    Студенты
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                        <button
                            onClick={handleSelectAll}
                            className="text-primary hover:text-primary/80 font-medium"
                        >
                            {selectedUserIds.length === filteredUsers.length 
                                ? 'Снять все' 
                                : 'Выбрать все'
                            }
                        </button>
                        <span className="text-gray-600">
                            Выбрано: <span className="font-medium">{selectedUserIds.length}</span> пользователей
                        </span>
                    </div>
                </div>

                {/* Users List */}
                <div className="p-6 overflow-y-auto max-h-[400px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-12">
                            <User className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-600">Пользователи не найдены</p>
                            <p className="text-sm text-gray-500 mt-1">
                                {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Нет доступных пользователей для записи'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredUsers.map(user => (
                                <div 
                                    key={user.id}
                                    className={`
                                        flex items-center gap-3 p-4 rounded-lg border transition-all cursor-pointer
                                        ${selectedUserIds.includes(user.id) 
                                            ? 'border-primary bg-primary/5' 
                                            : 'border-gray-200 hover:bg-gray-50'
                                        }
                                    `}
                                    onClick={() => handleToggleUser(user.id)}
                                >
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                                        ${selectedUserIds.includes(user.id) 
                                            ? 'bg-primary text-white' 
                                            : 'bg-gray-100 text-gray-600'
                                        }
                                    `}>
                                        {selectedUserIds.includes(user.id) ? (
                                            <Check className="w-5 h-5" />
                                        ) : (
                                            <span className="font-medium">{user.name?.charAt(0)}</span>
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-medium text-gray-900 truncate">
                                                {user.name}
                                            </p>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                                {getRoleLabel(user.role)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 truncate">{user.email}</p>
                                    </div>
                                    
                                    <div className="text-sm text-gray-500">
                                        {user.coursesCount !== undefined && (
                                            <span>Курсов: {user.coursesCount}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            {selectedUserIds.length > 0 && (
                                <p>Будут записаны {selectedUserIds.length} пользователей</p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={onClose}
                                className="btn btn-outline"
                            >
                                Отмена
                            </button>
                            <button 
                                onClick={handleSubmit}
                                disabled={isSubmitting || selectedUserIds.length === 0}
                                className="btn btn-primary"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        Запись...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Записать выбранных
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}