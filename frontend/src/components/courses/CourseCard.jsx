// frontend/src/components/courses/CourseCard.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { coursesAPI } from '../../api/client';
import { toast } from 'react-hot-toast';
import EnrollUsersModal from '../EnrollUsersModal';
import {
    BookOpen,
    Users,
    Clock,
    Edit,
    Trash2,
    Eye,
    UserPlus,
    BarChart3
} from 'lucide-react';

export default function CourseCard({ 
    course, 
    onUpdate, 
    onDelete,
    hideEnrollButton = false,
    onEnrollSuccess
}) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [enrollModalOpen, setEnrollModalOpen] = useState(false);

    // Права доступа
    const isAdmin = user?.role === 'ADMIN';
    const isTeacher = user?.role === 'TEACHER';
    const isStudent = user?.role === 'STUDENT';
    const isCourseTeacher = course.teacher?.id === user?.id;
    
    const canEdit = isAdmin || (isTeacher && isCourseTeacher);
    const canDelete = canEdit;
    const canManageStudents = isAdmin || (isTeacher && isCourseTeacher);
    const canEnroll = !hideEnrollButton && isStudent && !course.isEnrolled;
    const canViewAnalytics = isAdmin || (isTeacher && isCourseTeacher);

    const handleEdit = (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/courses/${course.id}/edit`);
    };

    const handleDelete = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!window.confirm('Вы уверены, что хотите удалить этот курс? Это действие нельзя отменить.')) {
            return;
        }

        setIsDeleting(true);
        try {
            await coursesAPI.delete(course.id);
            
            if (onDelete) {
                onDelete(course.id);
            }
            
            toast.success('Курс успешно удален');
            
        } catch (error) {
            console.error('Error deleting course:', error);
            const errorMessage = error.response?.data?.message || 
                                error.response?.data?.error || 
                                error.message || 
                                'Неизвестная ошибка';
            toast.error(`Ошибка при удалении курса: ${errorMessage}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleManageStudents = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Открываем модальное окно для записи пользователей
        setEnrollModalOpen(true);
    };

    const handleViewAnalytics = (e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/courses/${course.id}/analytics`);
    };

    const handleEnroll = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!user || !isStudent) {
            toast.error('Только студенты могут записываться на курсы');
            return;
        }

        setIsEnrolling(true);
        try {
            await coursesAPI.enroll(course.id);
            toast.success('Вы успешно записались на курс!');
            
            // Обновляем состояние
            if (onEnrollSuccess) {
                onEnrollSuccess();
            }
            
            // Обновляем карточку
            course.isEnrolled = true;
            
        } catch (error) {
            console.error('Error enrolling:', error);
            const errorMessage = error.response?.data?.message || 
                                error.response?.data?.error || 
                                error.message || 
                                'Неизвестная ошибка';
            toast.error(`Ошибка записи на курс: ${errorMessage}`);
        } finally {
            setIsEnrolling(false);
        }
    };

    const handleCloseEnrollModal = () => {
        setEnrollModalOpen(false);
    };

    const handleEnrollSuccess = () => {
        if (onEnrollSuccess) {
            onEnrollSuccess();
        }
        setEnrollModalOpen(false);
        toast.success('Пользователи успешно записаны на курс!');
    };

    return (
        <>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Обложка курса */}
                <Link to={`/courses/${course.id}`} className="block">
                    <div className="h-40 bg-gradient-to-br from-primary/10 to-purple-100 relative">
                        {course.coverImage ? (
                            <img
                                src={course.coverImage}
                                alt={course.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="w-12 h-12 text-gray-400" />
                            </div>
                        )}
                        
                        {/* Статус публикации */}
                        {!course.isPublished && (
                            <div className="absolute top-3 right-3 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                Черновик
                            </div>
                        )}
                    </div>
                </Link>

                {/* Контент карточки */}
                <div className="p-5">
                    {/* Заголовок и иконка */}
                    <div className="flex items-start gap-3 mb-3">
                        <div className={`
                            w-12 h-12 rounded-lg flex items-center justify-center text-2xl
                            bg-gradient-to-br from-primary to-purple-600 text-white flex-shrink-0
                        `}>
                            {course.icon || '🎓'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <Link to={`/courses/${course.id}`} className="block">
                                <h3 className="font-bold text-lg text-gray-900 truncate hover:text-primary transition-colors">
                                    {course.title}
                                </h3>
                            </Link>
                            <p className="text-sm text-gray-500 mt-1">{course.category}</p>
                        </div>
                    </div>

                    {/* Описание */}
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                        {course.description}
                    </p>

                    {/* Статистика */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <BookOpen className="w-4 h-4" />
                                {course._count?.lessons || 0} уроков
                            </span>
                            <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {course._count?.enrollments || 0}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {course.duration || '0 ч'}
                            </span>
                        </div>
                    </div>

                    {/* Прогресс для студентов */}
                    {course.isEnrolled && course.progress !== undefined && (
                        <div className="mb-4">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Ваш прогресс</span>
                                <span>{course.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className="bg-primary h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${course.progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Кнопки действий */}
                    <div className="flex flex-wrap gap-2">
                        {/* Основная кнопка - Просмотр/Продолжить */}
                        <Link
                            to={`/courses/${course.id}`}
                            className={`btn flex-1 min-w-[120px] ${course.isEnrolled ? 'btn-primary' : 'btn-outline'}`}
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            {course.isEnrolled ? 'Продолжить' : 'Подробнее'}
                        </Link>

                        {/* Кнопка записи для студентов */}
                        {canEnroll && (
                            <button
                                onClick={handleEnroll}
                                disabled={isEnrolling}
                                className="btn btn-primary flex-1 min-w-[120px]"
                            >
                                {isEnrolling ? 'Записываемся...' : 'Записаться'}
                            </button>
                        )}

                        {/* Кнопки управления для админов/учителей */}
                        {canManageStudents && (
                            <button
                                onClick={handleManageStudents}
                                className="p-2 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                                title="Управление студентами"
                            >
                                <UserPlus className="w-4 h-4" />
                            </button>
                        )}
                        
                        {canEdit && (
                            <button
                                onClick={handleEdit}
                                className="p-2 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                                title="Редактировать"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                        )}
                        
                        {canViewAnalytics && (
                            <button
                                onClick={handleViewAnalytics}
                                className="p-2 border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                                title="Аналитика"
                            >
                                <BarChart3 className="w-4 h-4" />
                            </button>
                        )}
                        
                        {canDelete && (
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="p-2 border border-red-300 hover:bg-red-50 text-red-600 rounded-lg transition-colors disabled:opacity-50"
                                title="Удалить"
                            >
                                {isDeleting ? (
                                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                            </button>
                        )}
                    </div>

                    {/* Преподаватель */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs">
                                {course.teacher?.name?.[0] || course.teacher?.email?.[0] || 'П'}
                            </div>
                            <span className="text-sm text-gray-600">
                                {course.teacher?.name || course.teacher?.email || 'Преподаватель'}
                            </span>
                            {user?.id === course.teacher?.id && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                    Вы
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Модальное окно для записи пользователей */}
            {enrollModalOpen && (
                <EnrollUsersModal
                    courseId={course.id}
                    isOpen={enrollModalOpen}
                    onClose={handleCloseEnrollModal}
                    onSuccess={handleEnrollSuccess}
                />
            )}
        </>
    );
}