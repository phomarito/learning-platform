import { Link } from 'react-router-dom';
import { Clock, Users } from 'lucide-react';

const gradients = [
    'from-purple-500 to-indigo-600',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-pink-500 to-rose-500',
];

export default function CourseCard({ course }) {
    const gradient = gradients[course.id % gradients.length];

    return (
        <Link
            to={`/courses/${course.id}`}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col h-full card-hover group"
        >
            {/* Cover */}
            <div className={`h-40 relative bg-gradient-to-br ${gradient} p-6 flex items-center justify-center`}>
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-300" />

                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                    <span className="text-3xl">📚</span>
                </div>

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                    {!course.isEnrolled && !course.progress && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 shadow-sm border border-green-200">
                            NEW
                        </span>
                    )}
                    {course.progress > 0 && course.progress < 100 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 shadow-sm border border-blue-200">
                            В процессе
                        </span>
                    )}
                    {course.progress === 100 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 shadow-sm border border-green-200">
                            Завершён
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-primary bg-primary-50 px-2 py-1 rounded-md">
                        {course.category}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{course.duration}</span>
                    </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {course.title}
                </h3>

                <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1">
                    {course.description}
                </p>

                {/* Teacher */}
                {course.teacher && (
                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                            {course.teacher.name?.charAt(0)}
                        </div>
                        <span>{course.teacher.name}</span>
                    </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{course._count?.enrollments || 0} студентов</span>
                    </div>
                    <span>•</span>
                    <span>{course._count?.lessons || 0} уроков</span>
                </div>

                {/* Progress or Button */}
                <div className="mt-auto pt-4 border-t border-gray-50">
                    {course.progress > 0 ? (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium text-gray-700">Прогресс</span>
                                <span className="font-bold text-primary">{course.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-primary h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${course.progress}%` }}
                                />
                            </div>
                            <button className="w-full mt-3 btn btn-primary text-sm py-2">
                                Продолжить
                            </button>
                        </div>
                    ) : (
                        <button className="w-full btn btn-outline text-sm py-2 group-hover:border-primary group-hover:text-primary transition-colors">
                            {course.isEnrolled ? 'Открыть курс' : 'Начать курс'}
                        </button>
                    )}
                </div>
            </div>
        </Link>
    );
}
