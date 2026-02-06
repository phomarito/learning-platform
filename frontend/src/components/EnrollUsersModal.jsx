// frontend/src/components/courses/EnrollUsersModal.jsx
import { useState, useEffect } from 'react';
import { usersAPI, coursesAPI } from '../api/client';
import { toast } from 'react-hot-toast';
import { X, Search, User, Check, Users, Mail, GraduationCap, Loader, RefreshCw } from 'lucide-react';

export default function EnrollUsersModal({ 
    courseId, 
    isOpen, 
    onClose,
    onSuccess 
}) {
    const [users, setUsers] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchUsers();
        } else {
            // Сбрасываем состояние при закрытии
            setUsers([]);
            setSelectedUsers([]);
            setSearch('');
            setError(null);
        }
    }, [isOpen, roleFilter]);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            setError(null);
            setSelectedUsers([]);
            
            console.log('Fetching users with role filter:', roleFilter);
            
            // Пробуем получить всех пользователей
            let allUsers = [];
            
            try {
                if (roleFilter === 'TEACHER') {
                    const response = await usersAPI.getTeachers();
                    console.log('Teachers response:', response);
                    allUsers = Array.isArray(response.data) ? response.data : [];
                } else if (roleFilter === 'STUDENT') {
                    const response = await usersAPI.getStudents();
                    console.log('Students response:', response);
                    allUsers = Array.isArray(response.data) ? response.data : [];
                } else {
                    const response = await usersAPI.getAll();
                    console.log('All users response:', response);
                    
                    // Проверяем разные возможные структуры ответа
                    if (Array.isArray(response.data)) {
                        allUsers = response.data;
                    } else if (response.data && Array.isArray(response.data.data)) {
                        allUsers = response.data.data;
                    } else if (response.data && Array.isArray(response.data.users)) {
                        allUsers = response.data.users;
                    } else {
                        allUsers = [];
                    }
                    
                    // Фильтруем админов
                    allUsers = allUsers.filter(user => 
                        user && user.role !== 'ADMIN'
                    );
                }
                
                console.log('Processed users:', allUsers);
                
                // Пробуем получить уже записанных пользователей
                try {
                    const enrolledResponse = await coursesAPI.getStudents(courseId);
                    console.log('Enrolled students response:', enrolledResponse);
                    
                    let enrolledUserIds = [];
                    if (enrolledResponse.data) {
                        // Проверяем разные структуры ответа
                        if (Array.isArray(enrolledResponse.data)) {
                            enrolledUserIds = enrolledResponse.data.map(user => user.id);
                        } else if (enrolledResponse.data.data && Array.isArray(enrolledResponse.data.data)) {
                            enrolledUserIds = enrolledResponse.data.data.map(user => user.id);
                        } else if (enrolledResponse.data.students && Array.isArray(enrolledResponse.data.students)) {
                            enrolledUserIds = enrolledResponse.data.students.map(user => user.id);
                        }
                    }
                    
                    console.log('Enrolled user IDs:', enrolledUserIds);
                    
                    // Фильтруем пользователей, которые уже записаны
                    const availableUsers = allUsers.filter(user => 
                        user && user.id && !enrolledUserIds.includes(user.id)
                    );
                    
                    setUsers(availableUsers);
                } catch (enrollError) {
                    console.warn('Cannot get enrolled students:', enrollError);
                    // Если не получается, показываем всех пользователей
                    setUsers(allUsers.filter(user => user && user.id));
                }
                
            } catch (apiError) {
                console.error('API error:', apiError);
                // Fallback - пустой массив
                setUsers([]);
                setError('Не удалось загрузить пользователей. Проверьте подключение к серверу.');
            }
            
        } catch (error) {
            console.error('Unexpected error in fetchUsers:', error);
            setError('Произошла непредвиденная ошибка');
            setUsers([]);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleUserSelection = (userId) => {
        setSelectedUsers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleEnroll = async () => {
        if (selectedUsers.length === 0) {
            toast.error('Выберите хотя бы одного пользователя');
            return;
        }

        setIsEnrolling(true);
        try {
            console.log('Enrolling users:', selectedUsers);
            
            // Сначала пробуем массовую запись
            try {
                const data = {
                    userIds: selectedUsers
                };
                
                console.log('Batch enroll data:', data);
                await coursesAPI.batchEnroll(courseId, data);
                toast.success(`Успешно записано: ${selectedUsers.length} пользователей`);
                
            } catch (batchError) {
                console.log('Batch enroll failed, trying individual:', batchError);
                
                // Индивидуальная запись
                const results = await Promise.allSettled(
                    selectedUsers.map(userId => 
                        coursesAPI.addStudent(courseId, { userId })
                            .catch(err => {
                                console.error(`Error enrolling user ${userId}:`, err);
                                throw err;
                            })
                    )
                );
                
                const successful = results.filter(r => r.status === 'fulfilled').length;
                const failed = results.filter(r => r.status === 'rejected').length;
                
                if (successful > 0) {
                    toast.success(`Успешно записано: ${successful} пользователей`);
                }
                if (failed > 0) {
                    toast.error(`Не удалось записать: ${failed} пользователей`);
                }
            }
            
            if (onSuccess) {
                onSuccess();
            }
            
            handleClose();
            
        } catch (error) {
            console.error('Error in handleEnroll:', error);
            const errorMessage = error.response?.data?.message || 
                                error.response?.data?.error || 
                                error.message || 
                                'Ошибка записи пользователей на курс';
            toast.error(errorMessage);
        } finally {
            setIsEnrolling(false);
        }
    };

    const handleClose = () => {
        setUsers([]);
        setSelectedUsers([]);
        setSearch('');
        setRoleFilter('ALL');
        setError(null);
        onClose();
    };

    // Безопасная фильтрация пользователей
    const filteredUsers = Array.isArray(users) 
        ? users.filter(user => {
            if (!user || typeof user !== 'object') return false;
            
            const nameMatch = user.name 
                ? user.name.toLowerCase().includes(search.toLowerCase())
                : false;
                
            const emailMatch = user.email
                ? user.email.toLowerCase().includes(search.toLowerCase())
                : false;
            
            return nameMatch || emailMatch;
        })
        : [];

    // Безопасное получение деталей выбранных пользователей
    const selectedUsersDetails = Array.isArray(users)
        ? users.filter(user => user && user.id && selectedUsers.includes(user.id))
        : [];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Запись пользователей на курс
                        </h2>
                        <p className="text-gray-600 mt-1">
                            Выберите пользователей для записи
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={isEnrolling}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <X className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-red-800 font-medium">Ошибка</p>
                                <p className="text-red-600 text-sm mt-1">{error}</p>
                                <button
                                    onClick={fetchUsers}
                                    className="mt-2 text-sm text-red-700 hover:text-red-900 flex items-center gap-1"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    Попробовать снова
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Selected Users Preview */}
                {selectedUsersDetails.length > 0 && (
                    <div className="px-6 pt-4 border-b">
                        <div className="mb-2 text-sm font-medium text-gray-700">
                            Выбрано пользователей: {selectedUsersDetails.length}
                        </div>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {selectedUsersDetails.map(user => (
                                <div 
                                    key={user.id}
                                    className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm"
                                >
                                    {user.role === 'TEACHER' ? (
                                        <GraduationCap className="w-3 h-3" />
                                    ) : (
                                        <User className="w-3 h-3" />
                                    )}
                                    <span>{user.name || user.email?.split('@')[0] || `User ${user.id}`}</span>
                                    <span className="text-xs px-1.5 py-0.5 bg-blue-100 rounded">
                                        {user.role === 'STUDENT' ? 'Студент' : 
                                         user.role === 'TEACHER' ? 'Учитель' : 
                                         'Пользователь'}
                                    </span>
                                    <button
                                        onClick={() => toggleUserSelection(user.id)}
                                        className="ml-1 text-blue-500 hover:text-blue-700"
                                        disabled={isEnrolling}
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="p-6 border-b space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Поиск по имени или email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="input pl-10 w-full"
                                disabled={isLoading || isEnrolling}
                            />
                        </div>
                        
                        <div className="flex gap-2">
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                className="input w-48"
                                disabled={isLoading || isEnrolling}
                            >
                                <option value="ALL">Все пользователи</option>
                                <option value="STUDENT">Только студенты</option>
                                <option value="TEACHER">Только учителя</option>
                            </select>
                            
                            <button
                                onClick={fetchUsers}
                                disabled={isLoading || isEnrolling}
                                className="btn btn-outline flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <Loader className="w-4 h-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-4 h-4" />
                                )}
                                Обновить
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                        <div className="text-gray-600">
                            {isLoading 
                                ? 'Загрузка пользователей...' 
                                : `Найдено: ${filteredUsers.length} пользователей`}
                        </div>
                        {selectedUsers.length > 0 && (
                            <button
                                onClick={() => setSelectedUsers([])}
                                className="text-red-600 hover:text-red-800 flex items-center gap-1 disabled:opacity-50"
                                disabled={isLoading || isEnrolling}
                            >
                                <X className="w-4 h-4" />
                                Очистить выбор
                            </button>
                        )}
                    </div>
                </div>

                {/* Users List */}
                <div className="flex-1 overflow-y-auto min-h-[300px]">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <Loader className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                                <p className="text-gray-600">Загрузка пользователей...</p>
                            </div>
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {search ? 'Пользователи не найдены' : 'Нет доступных пользователей'}
                            </h3>
                            <p className="text-gray-600 max-w-md mx-auto mb-4">
                                {search 
                                    ? 'Попробуйте изменить поисковый запрос' 
                                    : 'Возможно, все пользователи уже записаны на этот курс или нет доступных пользователей с выбранной ролью.'
                                }
                            </p>
                            <button
                                onClick={fetchUsers}
                                className="btn btn-outline"
                                disabled={isLoading || isEnrolling}
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Обновить список
                            </button>
                        </div>
                    ) : (
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filteredUsers.map(user => {
                                    if (!user || !user.id) return null;
                                    
                                    const isSelected = selectedUsers.includes(user.id);
                                    const isTeacher = user.role === 'TEACHER';
                                    const userName = user.name || user.email?.split('@')[0] || `User ${user.id}`;
                                    const userEmail = user.email || 'Нет email';
                                    
                                    return (
                                        <div
                                            key={user.id}
                                            className={`
                                                flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all
                                                border ${isSelected 
                                                    ? 'bg-primary/5 border-primary/300' 
                                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                                }
                                                ${isEnrolling ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'}
                                            `}
                                            onClick={() => !isEnrolling && toggleUserSelection(user.id)}
                                        >
                                            <div className="relative">
                                                <div className={`
                                                    w-12 h-12 rounded-full flex items-center justify-center
                                                    ${isSelected 
                                                        ? 'bg-primary/20' 
                                                        : isTeacher ? 'bg-blue-100' : 'bg-green-100'
                                                    }
                                                `}>
                                                    {isTeacher ? (
                                                        <GraduationCap className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-blue-600'}`} />
                                                    ) : (
                                                        <User className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-green-600'}`} />
                                                    )}
                                                </div>
                                                {isSelected && (
                                                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center shadow-sm">
                                                        <Check className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 truncate">
                                                    {userName}
                                                </div>
                                                <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                                    <Mail className="w-3 h-3 flex-shrink-0" />
                                                    <span className="truncate">{userEmail}</span>
                                                </div>
                                                <div className="mt-2">
                                                    <span className={`
                                                        text-xs font-medium px-2 py-1 rounded
                                                        ${isTeacher 
                                                            ? 'bg-blue-100 text-blue-800' 
                                                            : 'bg-green-100 text-green-800'
                                                        }
                                                    `}>
                                                        {isTeacher ? 'Преподаватель' : 'Студент'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-6 border-t">
                    <div className="text-sm text-gray-600">
                        {selectedUsers.length > 0 
                            ? `Выбрано пользователей: ${selectedUsers.length}` 
                            : 'Выберите пользователей для записи'}
                    </div>
                    
                    <div className="flex gap-3">
                        <button
                            onClick={handleClose}
                            className="btn btn-outline px-6"
                            disabled={isEnrolling}
                        >
                            Отмена
                        </button>
                        <button
                            onClick={handleEnroll}
                            disabled={selectedUsers.length === 0 || isEnrolling || isLoading}
                            className="btn btn-primary px-6 min-w-[140px]"
                        >
                            {isEnrolling ? (
                                <>
                                    <Loader className="w-4 h-4 animate-spin mr-2" />
                                    Записываем...
                                </>
                            ) : (
                                `Записать (${selectedUsers.length})`
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}