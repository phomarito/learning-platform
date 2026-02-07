import { useState, useEffect } from 'react';
import { coursesAPI } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import CourseCard from '../components/courses/CourseCard';
import { Search, BookOpen, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactPaginate from 'react-paginate';

const categories = [
    'Все',
    'Менеджмент',
    'Продукт',
    'Soft Skills',
    'Технологии',
    'Маркетинг',
];

export default function CoursesPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [allCourses, setAllCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Все');
    const [showEnrolledOnly, setShowEnrolledOnly] = useState(false);
    
    // Состояние для пагинации
    const [currentPage, setCurrentPage] = useState(0);
    const coursesPerPage = 6; // Курсов на странице

    const isStudent = user?.role === 'STUDENT';
    const isTeacher = user?.role === 'TEACHER';
    const isAdmin = user?.role === 'ADMIN';
    
    // Для студентов всегда показываем только их курсы
    // Учителям и админам показываем фильтр "Только мои курсы"
    const showEnrolledFilter = !isStudent && (isTeacher || isAdmin);
    const canCreateCourse = isTeacher || isAdmin;

    useEffect(() => {
        fetchCourses();
        // Сбрасываем на первую страницу при изменении фильтров
        setCurrentPage(0);
    }, [selectedCategory, showEnrolledOnly, user?.role]);

    const fetchCourses = async () => {
        try {
            setIsLoading(true);
            const params = {};
            
            if (selectedCategory !== 'Все') {
                params.category = selectedCategory;
            }
            
            // Для учителя - показываем только его курсы
            if (isTeacher) {
                params.teacher = user.id;
            }
            
            const response = await coursesAPI.getAll(params);
            let courses = response.data.data || [];
            
            // Обработка для разных ролей
            if (isStudent) {
                // Для студентов: показываем только курсы, на которые записаны
                // Проверяем разные возможные поля
                courses = courses.filter(course => {
                    // Проверяем разные возможные названия полей
                    return course.isEnrolled === true || 
                           course.enrolled === true ||
                           course.isStudentEnrolled === true ||
                           (course.enrollments && course.enrollments.length > 0) ||
                           (course.students && course.students.some(s => s.id === user.id));
                });
            } else if (showEnrolledOnly && (isTeacher || isAdmin)) {
                // Для учителей и админов: фильтр "Только мои курсы"
                // Для учителя это будут курсы, которые он создал
                // Для админа можно показывать все или тоже фильтровать по каким-то критериям
                if (isTeacher) {
                    // Учитель уже видит только свои курсы (params.teacher = user.id)
                    // Если нужно показать курсы, на которые учитель записан как студент
                    // Нужно добавить дополнительную логику
                }
            }
            
            setAllCourses(courses);
            
        } catch (err) {
            console.error('Error fetching courses:', err);
            
            // Более информативное сообщение об ошибке
            if (err.response) {
                setError(`Ошибка сервера: ${err.response.status} - ${err.response.data?.message || 'Неизвестная ошибка'}`);
            } else if (err.request) {
                setError('Нет ответа от сервера. Проверьте подключение.');
            } else {
                setError(`Ошибка: ${err.message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Фильтрация курсов по поиску
    const filteredCourses = allCourses.filter(course => {
        if (!course) return false;
        
        const titleMatch = course.title?.toLowerCase().includes(search.toLowerCase()) || false;
        const descMatch = course.description?.toLowerCase().includes(search.toLowerCase()) || false;
        
        return titleMatch || descMatch;
    });

    // Логика для отображения только нужной страницы
    const offset = currentPage * coursesPerPage;
    const currentCourses = filteredCourses.slice(offset, offset + coursesPerPage);
    const pageCount = Math.ceil(filteredCourses.length / coursesPerPage);

    const handlePageClick = ({ selected }) => {
        setCurrentPage(selected);
        // Прокручиваем вверх при смене страницы
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <div className="text-red-500 mb-4 text-4xl">⚠️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ошибка загрузки</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button onClick={fetchCourses} className="btn btn-primary">
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
                    <p className="text-gray-600 mt-1">
                        {isStudent ? 'Ваши курсы для изучения' : 
                         isTeacher ? 'Управление вашими курсами' :
                         'Управление всеми курсами'}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Фильтр "Только мои курсы" для учителей и админов */}
                    {showEnrolledFilter && (
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showEnrolledOnly}
                                onChange={(e) => setShowEnrolledOnly(e.target.checked)}
                                className="w-4 h-4 text-primary rounded focus:ring-primary"
                            />
                            {isTeacher ? 'Только мои курсы' : 'Только созданные мной'}
                        </label>
                    )}

                    {canCreateCourse && (
                        <button 
                            onClick={() => navigate('/courses/create')}
                            className="btn btn-primary flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Создать курс
                        </button>
                    )}
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
                    {[1, 2, 3].map(i => (
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
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {isStudent ? 'У вас пока нет курсов' : 'Курсы не найдены'}
                    </h3>
                    <p className="text-gray-600 max-w-md">
                        {isStudent 
                            ? 'Обратитесь к учителю или администратору для записи на курс'
                            : search || selectedCategory !== 'Все'
                                ? 'Попробуйте изменить параметры поиска'
                                : 'Пока нет доступных курсов. Создайте первый курс!'
                        }
                    </p>
                    {!isStudent && canCreateCourse && (
                        <button 
                            onClick={() => navigate('/courses/create')}
                            className="btn btn-primary mt-4"
                        >
                            Создать курс
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <div className="text-sm text-gray-600">
                        Найдено курсов: {filteredCourses.length} • Страница {currentPage + 1} из {pageCount}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {currentCourses.map(course => (
                            <CourseCard 
                                key={course.id} 
                                course={course}
                                // Для студентов скрываем кнопку записи
                                hideEnrollButton={isStudent}
                                onEnrollSuccess={fetchCourses} // Обновляем список после записи
                            />
                        ))}
                    </div>
                    
                    {/* Пагинация */}
                    {pageCount > 1 && (
                        <div className="flex justify-center mt-8">
                            <ReactPaginate
                                previousLabel="←"
                                nextLabel="→"
                                breakLabel="..."
                                pageCount={pageCount}
                                marginPagesDisplayed={2}
                                pageRangeDisplayed={3}
                                onPageChange={handlePageClick}
                                containerClassName="flex items-center gap-1"
                                pageClassName="block"
                                pageLinkClassName="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                previousClassName="block"
                                previousLinkClassName="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                nextClassName="block"
                                nextLinkClassName="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                                breakClassName="px-3 py-2 text-gray-500"
                                activeClassName="bg-primary text-white"
                                activeLinkClassName="bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary/90"
                                disabledClassName="opacity-50 cursor-not-allowed"
                                disabledLinkClassName="opacity-50 cursor-not-allowed"
                                forcePage={currentPage}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}