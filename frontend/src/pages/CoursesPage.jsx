import { useState, useEffect } from 'react';
import { coursesAPI } from '../api/client';
import CourseCard from '../components/courses/CourseCard';
import { Search, Filter, BookOpen } from 'lucide-react';

const categories = [
    'Все',
    'Менеджмент',
    'Продукт',
    'Soft Skills',
    'Технологии',
    'Маркетинг',
];

export default function CoursesPage() {
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Все');
    const [showEnrolledOnly, setShowEnrolledOnly] = useState(false);

    useEffect(() => {
        fetchCourses();
    }, [selectedCategory, showEnrolledOnly]);

    const fetchCourses = async () => {
        try {
            setIsLoading(true);
            const params = {};
            if (selectedCategory !== 'Все') {
                params.category = selectedCategory;
            }
            if (showEnrolledOnly) {
                params.enrolled = 'true';
            }

            const response = await coursesAPI.getAll(params);
            setCourses(response.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Ошибка загрузки курсов');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.description?.toLowerCase().includes(search.toLowerCase())
    );

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <div className="text-red-500 mb-4">⚠️</div>
                <p className="text-gray-600">{error}</p>
                <button onClick={fetchCourses} className="btn btn-primary mt-4">
                    Попробовать снова
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Курсы</h1>
                    <p className="text-gray-600 mt-1">Выберите курс для изучения</p>
                </div>

                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showEnrolledOnly}
                            onChange={(e) => setShowEnrolledOnly(e.target.checked)}
                            className="w-4 h-4 text-primary rounded focus:ring-primary"
                        />
                        Только мои курсы
                    </label>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Поиск курсов..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input pl-10"
                    />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                    {categories.map(category => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`
                px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
                ${selectedCategory === category
                                    ? 'bg-primary text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }
              `}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Courses Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
                            <div className="h-40 bg-gray-200" />
                            <div className="p-5 space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-1/4" />
                                <div className="h-6 bg-gray-200 rounded w-3/4" />
                                <div className="h-4 bg-gray-200 rounded w-full" />
                                <div className="h-10 bg-gray-200 rounded w-full mt-4" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filteredCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <BookOpen className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Курсы не найдены</h3>
                    <p className="text-gray-600 max-w-md">
                        {search || selectedCategory !== 'Все'
                            ? 'Попробуйте изменить параметры поиска'
                            : 'Пока нет доступных курсов'
                        }
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map(course => (
                        <CourseCard key={course.id} course={course} />
                    ))}
                </div>
            )}
        </div>
    );
}
