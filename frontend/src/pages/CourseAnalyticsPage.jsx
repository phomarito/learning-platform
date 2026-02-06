import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { coursesAPI } from '../api/client';
import { toast } from 'react-hot-toast';
import {
    BarChart3,
    Users,
    TrendingUp,
    Clock,
    BookOpen,
    Award,
    ArrowLeft,
    Download,
    Calendar,
    UserCheck,
    Activity,
    RefreshCw,
    AlertCircle
} from 'lucide-react';

export default function CourseAnalyticsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [analytics, setAnalytics] = useState(null);
    const [course, setCourse] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [usingDemoData, setUsingDemoData] = useState(false);
    const [timeRange, setTimeRange] = useState('month');

    const isTeacher = user?.role === 'TEACHER';
    const isAdmin = user?.role === 'ADMIN';
    const canViewAnalytics = isAdmin || isTeacher;

    useEffect(() => {
        if (!canViewAnalytics) {
            toast.error('Доступ запрещен');
            navigate('/courses');
            return;
        }
        
        if (id) {
            fetchAnalytics();
        }
    }, [id, timeRange]);

    const fetchAnalytics = async () => {
        try {
            setIsLoading(true);
            setError(null);
            setUsingDemoData(false);
            
            console.log('Fetching analytics for course:', id);
            console.log('User role:', user?.role, 'User ID:', user?.id);
            
            // Получаем информацию о курсе
            const courseResponse = await coursesAPI.getById(id);
            const courseData = courseResponse.data;
            console.log('Course data:', courseData);
            console.log('Course teacher ID:', courseData.teacher?.id, 'Type:', typeof courseData.teacher?.id);
            console.log('User ID:', user?.id, 'Type:', typeof user?.id);
            
            setCourse(courseData);
            
            // Проверяем права доступа для преподавателя
            if (isTeacher) {
                const teacherId = courseData.teacher?.id;
                const userId = user?.id;
                
                // Приводим ID к строке для сравнения
                const teacherIdStr = teacherId?.toString();
                const userIdStr = userId?.toString();
                
                console.log('Comparing IDs - Teacher:', teacherIdStr, 'User:', userIdStr);
                
                if (!teacherId) {
                    console.error('Course has no teacher assigned');
                    toast.error('Курс не имеет назначенного преподавателя');
                    navigate('/courses');
                    return;
                }
                
                if (teacherIdStr !== userIdStr) {
                    console.error('Teacher does not own this course');
                    toast.error('У вас нет доступа к аналитике этого курса');
                    navigate('/courses');
                    return;
                }
            }
            
            // Пробуем получить аналитику
            try {
                const params = timeRange !== 'all' ? { range: timeRange } : {};
                console.log('Fetching analytics with params:', params);
                
                const analyticsResponse = await coursesAPI.getAnalytics(id, params);
                console.log('Analytics response:', analyticsResponse);
                
                // Проверяем структуру ответа
                if (analyticsResponse.data && typeof analyticsResponse.data === 'object') {
                    setAnalytics(analyticsResponse.data);
                } else {
                    console.warn('Invalid analytics data structure:', analyticsResponse.data);
                    throw new Error('Некорректная структура данных аналитики');
                }
                
            } catch (analyticsError) {
                console.warn('Analytics API failed, using demo data:', analyticsError);
                setUsingDemoData(true);
                generateDemoAnalytics(courseData);
            }
            
        } catch (error) {
            console.error('Error in fetchAnalytics:', error);
            console.error('Error details:', error.response?.data || error.message);
            
            if (error.response?.status === 403 || error.response?.status === 401) {
                setError('У вас нет доступа к аналитике этого курса');
                toast.error('Доступ запрещен');
                setTimeout(() => navigate('/courses'), 2000);
                return;
            } else if (error.response?.status === 404) {
                setError('Курс не найден');
                toast.error('Курс не найден');
                setTimeout(() => navigate('/courses'), 2000);
                return;
            } else if (error.response?.status === 500) {
                setError('Временная проблема с сервером аналитики. Показываются демонстрационные данные.');
                setUsingDemoData(true);
                generateDemoAnalytics(course || { _count: { enrollments: 10 } });
                toast.error('Серверная ошибка. Используются демо-данные.');
            } else {
                setError('Не удалось загрузить аналитику. Проверьте подключение к интернету.');
                setUsingDemoData(true);
                generateDemoAnalytics(course || { _count: { enrollments: 10 } });
            }
            
        } finally {
            setIsLoading(false);
        }
    };

    const generateDemoAnalytics = (courseData) => {
        const totalStudents = courseData._count?.enrollments || 10;
        const activeRate = 0.7;
        const completedRate = 0.4;
        const avgProgress = 65;
        
        const demoAnalytics = {
            totalStudents,
            activeStudents: Math.floor(totalStudents * activeRate),
            completedStudents: Math.floor(totalStudents * completedRate),
            averageProgress: avgProgress,
            averageCompletionTime: '2 недели 3 дня',
            completionRate: Math.floor(completedRate * 100),
            
            popularLessons: [
                { id: 1, title: 'Введение в курс', views: totalStudents * 1.2, completions: Math.floor(totalStudents * 0.85) },
                { id: 2, title: 'Основные концепции', views: totalStudents * 0.95, completions: Math.floor(totalStudents * 0.7) },
                { id: 3, title: 'Практическое задание', views: totalStudents * 0.8, completions: Math.floor(totalStudents * 0.6) },
                { id: 4, title: 'Промежуточный тест', views: totalStudents * 0.9, completions: Math.floor(totalStudents * 0.75) },
                { id: 5, title: 'Итоговый проект', views: totalStudents * 0.7, completions: Math.floor(totalStudents * 0.5) },
            ],
            
            weeklyActivity: [
                { day: 'Пн', active: Math.floor(totalStudents * 0.45) },
                { day: 'Вт', active: Math.floor(totalStudents * 0.6) },
                { day: 'Ср', active: Math.floor(totalStudents * 0.75) },
                { day: 'Чт', active: Math.floor(totalStudents * 0.5) },
                { day: 'Пт', active: Math.floor(totalStudents * 0.85) },
                { day: 'Сб', active: Math.floor(totalStudents * 0.4) },
                { day: 'Вс', active: Math.floor(totalStudents * 0.3) },
            ],
            
            studentProgress: Array.from({ length: Math.min(totalStudents, 15) }, (_, i) => {
                const progress = Math.floor(Math.random() * 100);
                return {
                    id: i + 1,
                    name: `Студент ${i + 1}`,
                    email: `student${i + 1}@example.com`,
                    progress,
                    lastActivity: progress === 100 ? 'Завершено' : `${Math.floor(Math.random() * 7)} дней назад`,
                    enrolledDate: `2024-0${Math.floor(Math.random() * 9) + 1}-${Math.floor(Math.random() * 28) + 1}`
                };
            }).sort((a, b) => b.progress - a.progress),
            
            timeStats: {
                averageTimePerLesson: '45 минут',
                totalTimeSpent: `${Math.floor(totalStudents * 8)} часов`,
                peakActivityTime: '14:00 - 16:00'
            }
        };
        
        setAnalytics(demoAnalytics);
    };

    const handleExportData = () => {
        if (usingDemoData) {
            toast.error('Экспорт недоступен для демонстрационных данных');
            return;
        }
        
        toast.success('Экспорт данных начат');
    };

    const handleRefresh = () => {
        fetchAnalytics();
    };

    if (!canViewAnalytics) {
        return null;
    }

    if (isLoading) {
        return (
            <div className="space-y-6 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white rounded-xl border p-6">
                            <div className="h-6 bg-gray-200 rounded w-1/2 mb-4 animate-pulse" />
                            <div className="h-10 bg-gray-200 rounded w-3/4 animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Назад"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Аналитика курса
                            </h1>
                            {usingDemoData && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                    Демо-данные
                                </span>
                            )}
                        </div>
                        {course && (
                            <div className="mt-1">
                                <p className="text-gray-600">
                                    {course.title} • {course.category}
                                </p>
                                <p className="text-sm text-gray-500">
                                    Преподаватель: {course.teacher?.name || course.teacher?.email || 'Не назначен'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="input"
                        disabled={usingDemoData}
                    >
                        <option value="week">За неделю</option>
                        <option value="month">За месяц</option>
                        <option value="all">За все время</option>
                    </select>
                    
                    <button
                        onClick={handleRefresh}
                        className="btn btn-outline flex items-center gap-2"
                        disabled={isLoading}
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        {isLoading ? 'Загрузка...' : 'Обновить'}
                    </button>
                    
                    <button
                        onClick={handleExportData}
                        className="btn btn-primary flex items-center gap-2"
                        disabled={usingDemoData || isLoading}
                    >
                        <Download className="w-4 h-4" />
                        Экспорт
                    </button>
                </div>
            </div>

            {/* Debug Info (only in development) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="bg-gray-100 border border-gray-300 rounded-xl p-4">
                    <details>
                        <summary className="cursor-pointer font-medium text-gray-700">
                            Информация для отладки (только разработка)
                        </summary>
                        <div className="mt-2 text-sm space-y-1">
                            <div>Роль пользователя: <span className="font-medium">{user?.role}</span></div>
                            <div>ID пользователя: <span className="font-medium">{user?.id}</span></div>
                            <div>ID курса: <span className="font-medium">{id}</span></div>
                            {course && (
                                <>
                                    <div>ID преподавателя курса: <span className="font-medium">{course.teacher?.id}</span></div>
                                    <div>Преподаватель: <span className="font-medium">{course.teacher?.name || course.teacher?.email}</span></div>
                                    <div>Студентов: <span className="font-medium">{course._count?.enrollments || 0}</span></div>
                                </>
                            )}
                        </div>
                    </details>
                </div>
            )}

            {/* Demo Data Warning */}
            {usingDemoData && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-yellow-800 font-medium">Демонстрационные данные</p>
                            <p className="text-yellow-600 mt-1">
                                Сервер аналитики временно недоступен. Показаны демонстрационные данные на основе информации о курсе.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && !usingDemoData && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-red-800 font-medium">Ошибка</p>
                            <p className="text-red-600 mt-1">{error}</p>
                            <button
                                onClick={handleRefresh}
                                className="mt-2 text-sm text-red-700 hover:text-red-900 flex items-center gap-1"
                                disabled={isLoading}
                            >
                                <RefreshCw className="w-3 h-3" />
                                Попробовать снова
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Всего студентов"
                    value={analytics?.totalStudents || 0}
                    icon={<Users className="w-6 h-6" />}
                    color="blue"
                    description="Записалось на курс"
                />
                
                <StatCard
                    title="Активные"
                    value={analytics?.activeStudents || 0}
                    icon={<UserCheck className="w-6 h-6" />}
                    color="green"
                    description="За последние 7 дней"
                />
                
                <StatCard
                    title="Завершили"
                    value={analytics?.completedStudents || 0}
                    icon={<Award className="w-6 h-6" />}
                    color="purple"
                    description="Успешно завершили курс"
                />
                
                <StatCard
                    title="Средний прогресс"
                    value={`${analytics?.averageProgress || 0}%`}
                    icon={<TrendingUp className="w-6 h-6" />}
                    color="orange"
                    description="По всем студентам"
                />
            </div>

            {/* Main Content */}
            {analytics && (
                <>
                    {/* Charts & Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Activity Chart */}
                        <div className="bg-white rounded-xl border p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Активность по дням
                                </h2>
                                <Calendar className="w-5 h-5 text-gray-400" />
                            </div>
                            
                            <div className="flex items-end h-48 gap-1 mt-8">
                                {analytics.weeklyActivity.map((day, index) => {
                                    const maxActivity = Math.max(...analytics.weeklyActivity.map(d => d.active));
                                    const height = maxActivity > 0 ? (day.active / maxActivity) * 100 : 0;
                                    
                                    return (
                                        <div key={index} className="flex-1 flex flex-col items-center">
                                            <div 
                                                className="w-full bg-blue-500/20 hover:bg-blue-500/30 rounded-t transition-all"
                                                style={{ height: `${height}%` }}
                                                title={`${day.active} активных студентов`}
                                            />
                                            <span className="text-xs text-gray-500 mt-2">
                                                {day.day}
                                            </span>
                                            <span className="text-xs font-medium mt-1">
                                                {day.active}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Popular Lessons */}
                        <div className="bg-white rounded-xl border p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Популярные уроки
                                </h2>
                                <BookOpen className="w-5 h-5 text-gray-400" />
                            </div>
                            
                            <div className="space-y-4">
                                {analytics.popularLessons.slice(0, 5).map((lesson, index) => {
                                    const completionRate = lesson.views > 0 
                                        ? Math.round((lesson.completions / lesson.views) * 100)
                                        : 0;
                                    
                                    return (
                                        <div key={lesson.id || index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{lesson.title}</p>
                                                <p className="text-sm text-gray-500">
                                                    {lesson.completions} из {lesson.views} завершили
                                                </p>
                                            </div>
                                            <div className="text-right ml-4">
                                                <span className={`font-medium ${
                                                    completionRate >= 80 ? 'text-green-600' :
                                                    completionRate >= 50 ? 'text-yellow-600' :
                                                    'text-red-600'
                                                }`}>
                                                    {completionRate}%
                                                </span>
                                                <p className="text-sm text-gray-500">успешность</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Student Progress Table */}
                    <div className="bg-white rounded-xl border overflow-hidden">
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Прогресс студентов
                                    </h2>
                                    <p className="text-gray-600 mt-1">
                                        {analytics.studentProgress.length} студентов
                                    </p>
                                </div>
                                <span className="text-sm text-gray-500">
                                    Отсортировано по прогрессу
                                </span>
                            </div>
                        </div>
                        
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">
                                            Студент
                                        </th>
                                        <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">
                                            Email
                                        </th>
                                        <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">
                                            Прогресс
                                        </th>
                                        <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">
                                            Последняя активность
                                        </th>
                                        <th className="py-3 px-6 text-left text-sm font-medium text-gray-700">
                                            Статус
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {analytics.studentProgress.map((student) => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="py-4 px-6">
                                                <div className="font-medium text-gray-900">
                                                    {student.name}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="text-gray-600 text-sm">
                                                    {student.email}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-32 bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className={`h-2 rounded-full ${
                                                                student.progress === 100 ? 'bg-green-500' :
                                                                student.progress >= 70 ? 'bg-blue-500' :
                                                                student.progress >= 40 ? 'bg-yellow-500' :
                                                                'bg-red-500'
                                                            }`}
                                                            style={{ width: `${student.progress}%` }}
                                                        />
                                                    </div>
                                                    <span className="font-medium min-w-[40px]">
                                                        {student.progress}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-gray-600">
                                                {student.lastActivity}
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`
                                                    px-3 py-1 rounded-full text-xs font-medium
                                                    ${student.progress === 100 
                                                        ? 'bg-green-100 text-green-800'
                                                        : student.progress >= 70
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : student.progress >= 40
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }
                                                `}>
                                                    {student.progress === 100 ? 'Завершено' :
                                                     student.progress >= 70 ? 'Хорошо' :
                                                     student.progress >= 40 ? 'Средне' : 'Медленно'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// Компонент карточки статистики
function StatCard({ title, value, icon, color = 'blue', description }) {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        purple: 'bg-purple-100 text-purple-600',
        orange: 'bg-orange-100 text-orange-600',
        red: 'bg-red-100 text-red-600'
    };
    
    return (
        <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                    {icon}
                </div>
                <span className="text-sm text-gray-500">{title}</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">
                {value}
            </h3>
            {description && (
                <p className="text-gray-600 mt-1 text-sm">{description}</p>
            )}
        </div>
    );
}