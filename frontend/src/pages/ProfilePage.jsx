import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { progressAPI } from '../api/client';
import {
    User,
    BookOpen,
    Clock,
    Award,
    TrendingUp,
    Settings
} from 'lucide-react';

export default function ProfilePage() {
    const { user } = useAuth();
    const [progress, setProgress] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchProgress();
    }, []);

    const fetchProgress = async () => {
        try {
            setIsLoading(true);
            const response = await progressAPI.getAll();
            setProgress(response.data.data);
        } catch (error) {
            console.error('Error fetching progress:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours} ч ${minutes} мин`;
        }
        return `${minutes} мин`;
    };

    return (
        <div className="space-y-6">
            {/* Profile Header */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-700 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {user?.name?.charAt(0) || 'U'}
                    </div>

                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
                        <p className="text-gray-600">{user?.email}</p>
                        <div className="mt-2">
                            <span className={`
                inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
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

                    <button className="btn btn-outline">
                        <Settings className="w-5 h-5 mr-2" />
                        Настройки
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            {progress && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                        icon={BookOpen}
                        label="Курсов пройдено"
                        value={progress.stats.completedCourses}
                        color="purple"
                    />
                    <StatCard
                        icon={TrendingUp}
                        label="В процессе"
                        value={progress.stats.inProgressCourses}
                        color="blue"
                    />
                    <StatCard
                        icon={Clock}
                        label="Время обучения"
                        value={formatTime(progress.stats.totalTimeSpent)}
                        color="green"
                    />
                    <StatCard
                        icon={Award}
                        label="Средний прогресс"
                        value={`${progress.stats.averageProgress}%`}
                        color="orange"
                    />
                </div>
            )}

            {/* Course Progress */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Мои курсы</h2>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                ) : progress?.courses?.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Вы пока не записаны ни на один курс</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {progress?.courses?.map(course => (
                            <div key={course.courseId} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-medium text-gray-900">{course.courseTitle}</h3>
                                    <span className={`
                    text-sm font-medium px-2 py-1 rounded-full
                    ${course.isCompleted ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}
                  `}>
                                        {course.isCompleted ? 'Завершён' : `${course.progress}%`}
                                    </span>
                                </div>

                                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-2 rounded-full transition-all ${course.isCompleted ? 'bg-green-500' : 'bg-primary'}`}
                                        style={{ width: `${course.progress}%` }}
                                    />
                                </div>

                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                    <span>{course.completedLessons} / {course.totalLessons} уроков</span>
                                    <span>•</span>
                                    <span>{formatTime(course.timeSpent)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }) {
    const colors = {
        purple: 'bg-purple-50 text-purple-600',
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        orange: 'bg-orange-50 text-orange-600',
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colors[color]}`}>
                <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
        </div>
    );
}
