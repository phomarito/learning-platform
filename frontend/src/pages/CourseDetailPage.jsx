import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { coursesAPI, usersAPI } from '../api/client';
import {
    ArrowLeft,
    Clock,
    Users,
    BookOpen,
    PlayCircle,
    FileText,
    HelpCircle,
    CheckCircle,
    Lock,
    UserPlus,
    Edit,
    BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import EnrollUsersModal from '../components/EnrollUsersModal';

const lessonIcons = {
    VIDEO: PlayCircle,
    TEXT: FileText,
    QUIZ: HelpCircle,
};

export default function CourseDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [course, setCourse] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [showEnrollModal, setShowEnrollModal] = useState(false);

    useEffect(() => {
        fetchCourse();
    }, [id]);

    const fetchCourse = async () => {
        try {
            setIsLoading(true);
            const response = await coursesAPI.getById(id);
            setCourse(response.data.data);
        } catch (error) {
            console.error('Error fetching course:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnroll = async () => {
        try {
            setIsEnrolling(true);
            await coursesAPI.enroll(id);
            await fetchCourse();
        } catch (error) {
            console.error('Error enrolling:', error);
        } finally {
            setIsEnrolling(false);
        }
    };

    const handleBatchEnroll = async (userIds) => {
        try {
            await coursesAPI.batchEnroll(id, { userIds });
            await fetchCourse();
            return true;
        } catch (error) {
            console.error('Error batch enrolling:', error);
            throw error;
        }
    };

    // Проверяем, является ли пользователь преподавателем этого курса
    const isCourseTeacher = user && course && (
        user.role === 'TEACHER' && user.id === course.teacherId
    );

    // Проверяем, имеет ли пользователь права на запись других
    const canEnrollOthers = user && (
        user.role === 'ADMIN' || isCourseTeacher
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="text-center py-16">
                <p className="text-gray-600">Курс не найден</p>
                <Link to="/courses" className="btn btn-primary mt-4">
                    Вернуться к курсам
                </Link>
            </div>
        );
    }

    const completedLessons = course.lessons?.filter(l => l.completed).length || 0;
    const totalLessons = course.lessons?.length || 0;

    return (
        <div className="space-y-6">
            {/* Back button */}
            <button
                onClick={() => navigate('/courses')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft className="w-5 h-5" />
                Назад к курсам
            </button>

            {/* Course Header */}
            <div className="bg-gradient-to-r from-primary to-purple-700 rounded-2xl p-8 text-white relative">
                <div className="max-w-3xl">
                    <div className="flex items-center justify-between mb-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20">
                            {course.category}
                        </span>
                        
                        {/* Кнопки действий для админа/преподавателя */}
                        {canEnrollOthers && (
                            <div className="flex items-center gap-2">
                                {user.role === 'ADMIN' && (
                                    <button
                                        onClick={() => navigate(`/courses/${id}/analytics`)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
                                    >
                                        <BarChart3 className="w-4 h-4" />
                                        Аналитика
                                    </button>
                                )}
                                {isCourseTeacher && (
                                    <button
                                        onClick={() => navigate(`/courses/${id}/edit`)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                        Редактировать
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <h1 className="text-3xl font-bold mb-4">{course.title}</h1>

                    <p className="text-white/80 text-lg mb-6">{course.description}</p>

                    <div className="flex flex-wrap items-center gap-6 text-white/80">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            <span>{course.duration}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            <span>{totalLessons} уроков</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            <span>{course._count?.enrollments || 0} студентов</span>
                        </div>
                    </div>

                    {course.teacher && (
                        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-white/20">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-medium">
                                {course.teacher.name?.charAt(0)}
                            </div>
                            <div>
                                <p className="font-medium">{course.teacher.name}</p>
                                <p className="text-sm text-white/60">Преподаватель</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Progress */}
            {course.isEnrolled && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-900">Ваш прогресс</h3>
                        <span className="text-primary font-bold">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                            className="bg-primary h-3 rounded-full transition-all duration-500"
                            style={{ width: `${course.progress}%` }}
                        />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                        Завершено {completedLessons} из {totalLessons} уроков
                    </p>
                </div>
            )}

            {/* Lessons */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">Содержание курса</h3>
                    {isCourseTeacher && (
                        <button
                            onClick={() => navigate(`/courses/${id}/lessons/create`)}
                            className="btn btn-primary btn-sm"
                        >
                            Добавить урок
                        </button>
                    )}
                </div>

                <div className="divide-y divide-gray-100">
                    {course.lessons?.map((lesson, index) => {
                        const Icon = lessonIcons[lesson.type] || FileText;
                        const isAccessible = course.isEnrolled || index === 0;

                        return (
                            <div
                                key={lesson.id}
                                className={`
                                    flex items-center gap-4 p-4 transition-colors
                                    ${isAccessible ? 'hover:bg-gray-50 cursor-pointer' : 'opacity-60'}
                                `}
                                onClick={() => isAccessible && navigate(`/lessons/${lesson.id}`)}
                            >
                                <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                                    ${lesson.completed
                                        ? 'bg-green-100 text-green-600'
                                        : 'bg-gray-100 text-gray-500'
                                    }
                                `}>
                                    {lesson.completed ? (
                                        <CheckCircle className="w-5 h-5" />
                                    ) : !isAccessible ? (
                                        <Lock className="w-5 h-5" />
                                    ) : (
                                        <Icon className="w-5 h-5" />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">
                                        {index + 1}. {lesson.title}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {lesson.type === 'VIDEO' && 'Видео'}
                                        {lesson.type === 'TEXT' && 'Текст'}
                                        {lesson.type === 'QUIZ' && 'Тест'}
                                    </p>
                                </div>

                                {lesson.completed && (
                                    <span className="text-sm text-green-600 font-medium">Завершено</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-4 bg-white rounded-xl border border-gray-200 p-4 shadow-lg">
                <div className="flex flex-col sm:flex-row gap-3">
                    {!course.isEnrolled ? (
                        <>
                            <button
                                onClick={handleEnroll}
                                disabled={isEnrolling}
                                className="btn btn-primary flex-1"
                            >
                                {isEnrolling ? 'Запись...' : 'Записаться на курс'}
                            </button>
                            
                            {canEnrollOthers && (
                                <button
                                    onClick={() => setShowEnrollModal(true)}
                                    className="btn btn-secondary"
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Записать пользователей
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="w-full text-center py-2">
                            <p className="text-green-600 font-medium">Вы уже записаны на этот курс</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Модальное окно для записи пользователей */}
            {showEnrollModal && (
                <EnrollUsersModal
                    courseId={id}
                    currentUser={user}
                    onClose={() => setShowEnrollModal(false)}
                    onEnroll={handleBatchEnroll}
                />
            )}
        </div>
    );
}