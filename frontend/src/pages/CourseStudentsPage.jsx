import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coursesAPI, usersAPI } from '../api/client'; // Проверьте этот путь!
import { useAuth } from '../contexts/AuthContext';
import {
    ArrowLeft,
    Users,
    UserPlus,
    Search,
    X,
    User,
    GraduationCap,
    Clock,
    Mail,
    Trash2,
    AlertCircle,
    Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CourseStudentsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [course, setCourse] = useState(null);
    const [students, setStudents] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            // Загружаем информацию о курсе
            const courseResponse = await coursesAPI.getById(id);
            setCourse(courseResponse.data.data);
            
            // Загружаем студентов курса
            const studentsResponse = await coursesAPI.getStudents(id);
            setStudents(studentsResponse.data.data || []);
            
            try {
                // Пробуем получить студентов через usersAPI
                const usersResponse = await usersAPI.getStudents();
                const allStudents = usersResponse.data.data || [];
                
                // Фильтруем тех, кто уже записан на курс
                const enrolledStudentIds = new Set(studentsResponse.data.data?.map(s => s.id) || []);
                const available = allStudents.filter(student => 
                    !enrolledStudentIds.has(student.id)
                );
                
                setAvailableUsers(available);
            } catch (usersError) {
                console.warn('Cannot fetch students via usersAPI:', usersError);
                // Если не работает usersAPI, используем coursesAPI.getEnrollableUsers
                const enrollableResponse = await coursesAPI.getEnrollableUsers(id, { role: 'students' });
                setAvailableUsers(enrollableResponse.data.data || []);
            }
            
        } catch (error) {
            console.error('Error loading data:', error);
            setError('Ошибка загрузки данных');
            toast.error('Ошибка загрузки данных');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddStudents = async () => {
        if (selectedUsers.length === 0) return;
        
        setIsAdding(true);
        try {
            const userIds = selectedUsers.map(userId => parseInt(userId));
            
            await coursesAPI.batchEnroll(id, { userIds });
            
            toast.success(`${selectedUsers.length} студент(ов) успешно добавлено на курс`);
            
            // Обновляем данные
            await loadData();
            setShowAddModal(false);
            setSelectedUsers([]);
            
        } catch (error) {
            console.error('Error adding students:', error);
            const errorMessage = error.response?.data?.message || 'Ошибка при добавлении студентов';
            toast.error(errorMessage);
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveStudent = async (userId) => {
        if (!window.confirm('Удалить студента из курса?')) return;
        
        try {
            await coursesAPI.removeStudent(id, userId);
            
            toast.success('Студент успешно удален из курса');
            
            // Обновляем локальное состояние
            setStudents(prev => prev.filter(s => s.id !== userId));
            
        } catch (error) {
            console.error('Error removing student:', error);
            const errorMessage = error.response?.data?.message || 'Ошибка при удалении студента';
            toast.error(errorMessage);
        }
    };

    const toggleSelectUser = (userId) => {
        setSelectedUsers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const selectAllUsers = () => {
        if (selectedUsers.length === availableUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(availableUsers.map(user => user.id));
        }
    };

    const filteredStudents = students.filter(student =>
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredAvailableUsers = availableUsers.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-gray-600">Загрузка данных...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-900 mb-2">Ошибка</h2>
                <p className="text-gray-600 mb-4 text-center">{error}</p>
                <div className="flex gap-3">
                    <button
                        onClick={loadData}
                        className="btn btn-primary"
                    >
                        Попробовать снова
                    </button>
                    <button
                        onClick={() => navigate(`/courses/${id}`)}
                        className="btn btn-outline"
                    >
                        Назад к курсу
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(`/courses/${id}`)}
                                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Назад к курсу
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Управление студентами
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    {course?.title} • {students.length} студентов
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(`/courses/${id}`)}
                                className="btn btn-outline"
                            >
                                К курсу
                            </button>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="btn btn-primary flex items-center gap-2"
                                disabled={availableUsers.length === 0}
                            >
                                <UserPlus className="w-5 h-5" />
                                Добавить студентов
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-6">
                {/* Search and Stats */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Поиск студентов по имени или email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>Всего: {students.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" />
                            <span>Средний прогресс: {
                                students.length > 0 
                                    ? Math.round(students.reduce((sum, s) => sum + (s.progress || 0), 0) / students.length)
                                    : 0
                            }%</span>
                        </div>
                    </div>
                </div>

                {/* Students List */}
                {filteredStudents.length === 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Users className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            На этом курсе пока нет студентов
                        </h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            Добавьте студентов, чтобы они могли начать обучение
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn btn-primary"
                            disabled={availableUsers.length === 0}
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Добавить студентов
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStudents.map(student => (
                            <div key={student.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {student.avatar ? (
                                            <img 
                                                src={student.avatar} 
                                                alt={student.name}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                {student.name?.[0] || 'С'}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-bold text-gray-900">{student.name || 'Без имени'}</h3>
                                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                <Mail className="w-3 h-3" />
                                                {student.email}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveStudent(student.id)}
                                        className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                                        title="Удалить из курса"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                                            <span>Прогресс</span>
                                            <span className="font-medium">{student.progress || 0}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${student.progress || 0}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <div className="flex items-center gap-2 text-gray-500 mb-1">
                                                <GraduationCap className="w-4 h-4" />
                                                <span>Уроков</span>
                                            </div>
                                            <div className="font-bold text-gray-900">
                                                {student.completedLessons || 0}/{student.totalLessons || 0}
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-lg">
                                            <div className="flex items-center gap-2 text-gray-500 mb-1">
                                                <Clock className="w-4 h-4" />
                                                <span>Записан</span>
                                            </div>
                                            <div className="font-bold text-gray-900 text-sm">
                                                {student.enrolledAt ? new Date(student.enrolledAt).toLocaleDateString('ru-RU') : '-'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-xs text-gray-500">
                                        ID: {student.id}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal для добавления студентов */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between p-6 border-b">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Добавить студентов</h2>
                                <p className="text-gray-600 mt-1">
                                    Выберите студентов для добавления на курс "{course?.title}"
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    setSelectedUsers([]);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {availableUsers.length === 0 ? (
                                <div className="text-center py-8">
                                    <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500 mb-2">Нет доступных студентов для добавления</p>
                                    <p className="text-sm text-gray-400">Все студенты уже записаны на этот курс</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-sm text-gray-600">
                                            {selectedUsers.length} из {availableUsers.length} выбрано
                                        </span>
                                        <button
                                            onClick={selectAllUsers}
                                            className="text-sm text-primary hover:text-primary/80 font-medium"
                                        >
                                            {selectedUsers.length === availableUsers.length ? 'Снять все' : 'Выбрать все'}
                                        </button>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {filteredAvailableUsers.map(user => (
                                            <div
                                                key={user.id}
                                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                                                    selectedUsers.includes(user.id) 
                                                        ? 'bg-primary/10 border border-primary/20' 
                                                        : 'hover:bg-gray-50'
                                                }`}
                                                onClick={() => toggleSelectUser(user.id)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUsers.includes(user.id)}
                                                    onChange={() => toggleSelectUser(user.id)}
                                                    className="w-4 h-4 text-primary rounded focus:ring-primary"
                                                />
                                                <div className="flex items-center gap-3 flex-1">
                                                    {user.avatar ? (
                                                        <img 
                                                            src={user.avatar} 
                                                            alt={user.name}
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                                            <User className="w-5 h-5 text-gray-600" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1">
                                                        <div className="font-medium text-gray-900">
                                                            {user.name || 'Без имени'}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {user.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="p-6 border-t bg-gray-50">
                            <div className="flex justify-between items-center">
                                <div className="text-sm text-gray-600">
                                    {selectedUsers.length} студент(ов) будет добавлено
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAddModal(false);
                                            setSelectedUsers([]);
                                        }}
                                        className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        Отмена
                                    </button>
                                    <button
                                        onClick={handleAddStudents}
                                        disabled={selectedUsers.length === 0 || isAdding}
                                        className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2"
                                    >
                                        {isAdding ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Добавление...
                                            </>
                                        ) : (
                                            'Добавить выбранных'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}