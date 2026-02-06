import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coursesAPI } from '../api/client';
import { 
    Save, 
    X, 
    Upload, 
    BookOpen, 
    Clock,
    Trash2,
    Plus,
    AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function CourseEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState({
        title: '',
        description: '',
        category: '',
        duration: '',
        coverImage: '',
        icon: 'book',
        isPublished: false,
        lessons: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [newLesson, setNewLesson] = useState({
        title: '',
        type: 'TEXT',
        content: '',
        videoUrl: '',
        order: 1
    });
    const [showLessonForm, setShowLessonForm] = useState(false);

    const lessonTypes = [
        { value: 'VIDEO', label: 'Видео урок', icon: 'play-circle' },
        { value: 'TEXT', label: 'Текстовый урок', icon: 'file-text' },
        { value: 'QUIZ', label: 'Тест', icon: 'help-circle' }
    ];

    useEffect(() => {
        fetchCourse();
    }, [id]);

    const fetchCourse = async () => {
        try {
            setIsLoading(true);
            const response = await coursesAPI.getById(id);
            setCourse({
                ...response.data.data,
                lessons: response.data.data.lessons || []
            });
        } catch (error) {
            console.error('Error fetching course:', error);
            toast.error('Ошибка загрузки курса');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCourse(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await coursesAPI.update(id, course);
            toast.success('Курс успешно обновлен');
            navigate(`/courses/${id}`);
        } catch (error) {
            console.error('Error updating course:', error);
            toast.error('Ошибка сохранения курса');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddLesson = () => {
        if (!newLesson.title.trim()) {
            toast.error('Введите название урока');
            return;
        }

        const lesson = {
            ...newLesson,
            id: Date.now(), // временный ID
            order: course.lessons.length + 1,
            createdAt: new Date().toISOString()
        };

        setCourse(prev => ({
            ...prev,
            lessons: [...prev.lessons, lesson]
        }));

        setNewLesson({
            title: '',
            type: 'TEXT',
            content: '',
            videoUrl: '',
            order: course.lessons.length + 2
        });
        setShowLessonForm(false);
        toast.success('Урок добавлен');
    };

    const handleDeleteLesson = (lessonId) => {
        setCourse(prev => ({
            ...prev,
            lessons: prev.lessons.filter(lesson => lesson.id !== lessonId)
        }));
        toast.success('Урок удален');
    };

    const handleLessonOrderChange = (index, direction) => {
        const newLessons = [...course.lessons];
        if (direction === 'up' && index > 0) {
            [newLessons[index], newLessons[index - 1]] = [newLessons[index - 1], newLessons[index]];
            newLessons[index].order = index;
            newLessons[index - 1].order = index - 1;
        } else if (direction === 'down' && index < newLessons.length - 1) {
            [newLessons[index], newLessons[index + 1]] = [newLessons[index + 1], newLessons[index]];
            newLessons[index].order = index;
            newLessons[index + 1].order = index + 1;
        }
        setCourse(prev => ({ ...prev, lessons: newLessons }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Редактирование курса</h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`/courses/${id}`)}
                        className="btn btn-outline"
                    >
                        <X className="w-4 h-4 mr-2" />
                        Отмена
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="btn btn-primary"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? 'Сохранение...' : 'Сохранить'}
                    </button>
                </div>
            </div>

            {/* Main Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Course Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info Card */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Основная информация</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Название курса *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={course.title}
                                    onChange={handleInputChange}
                                    className="input"
                                    placeholder="Введите название курса"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Описание курса
                                </label>
                                <textarea
                                    name="description"
                                    value={course.description}
                                    onChange={handleInputChange}
                                    rows="4"
                                    className="input"
                                    placeholder="Опишите содержание курса"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Категория *
                                    </label>
                                    <select
                                        name="category"
                                        value={course.category}
                                        onChange={handleInputChange}
                                        className="input"
                                        required
                                    >
                                        <option value="">Выберите категорию</option>
                                        <option value="Программирование">Программирование</option>
                                        <option value="Нефтяная отрасль">Нефтяная отрасль</option>
                                        <option value="Дизайн">Дизайн</option>
                                        <option value="Маркетинг">Маркетинг</option>
                                        <option value="Менеджмент">Менеджмент</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Продолжительность *
                                    </label>
                                    <input
                                        type="text"
                                        name="duration"
                                        value={course.duration}
                                        onChange={handleInputChange}
                                        className="input"
                                        placeholder="Например: 12 часов"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Обложка курса (URL)
                                </label>
                                <input
                                    type="text"
                                    name="coverImage"
                                    value={course.coverImage}
                                    onChange={handleInputChange}
                                    className="input"
                                    placeholder="https://example.com/image.jpg"
                                />
                                {course.coverImage && (
                                    <div className="mt-2">
                                        <img 
                                            src={course.coverImage} 
                                            alt="Preview" 
                                            className="w-32 h-32 object-cover rounded-lg"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Lessons Card */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900">Уроки курса</h2>
                            <button
                                onClick={() => navigate(`/courses/${id}/lessons/create`)}
                                className="btn btn-primary"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Добавить урок
                            </button>
                        </div>

                        {/* Add Lesson Form */}
                        {showLessonForm && (
                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-medium text-gray-900">Новый урок</h3>
                                    <button
                                        onClick={() => setShowLessonForm(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={newLesson.title}
                                        onChange={(e) => setNewLesson(prev => ({ ...prev, title: e.target.value }))}
                                        className="input"
                                        placeholder="Название урока"
                                    />

                                    <select
                                        value={newLesson.type}
                                        onChange={(e) => setNewLesson(prev => ({ ...prev, type: e.target.value }))}
                                        className="input"
                                    >
                                        {lessonTypes.map(type => (
                                            <option key={type.value} value={type.value}>
                                                {type.label}
                                            </option>
                                        ))}
                                    </select>

                                    {newLesson.type === 'VIDEO' && (
                                        <input
                                            type="text"
                                            value={newLesson.videoUrl}
                                            onChange={(e) => setNewLesson(prev => ({ ...prev, videoUrl: e.target.value }))}
                                            className="input"
                                            placeholder="URL видео (YouTube, Vimeo, etc.)"
                                        />
                                    )}

                                    {(newLesson.type === 'TEXT' || newLesson.type === 'QUIZ') && (
                                        <textarea
                                            value={newLesson.content}
                                            onChange={(e) => setNewLesson(prev => ({ ...prev, content: e.target.value }))}
                                            className="input"
                                            rows="4"
                                            placeholder={newLesson.type === 'QUIZ' ? 'Вопросы для теста (JSON)' : 'Текст урока'}
                                        />
                                    )}

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleAddLesson}
                                            className="btn btn-primary"
                                        >
                                            Добавить
                                        </button>
                                        <button
                                            onClick={() => setShowLessonForm(false)}
                                            className="btn btn-outline"
                                        >
                                            Отмена
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Lessons List */}
                        <div className="space-y-3">
                            {course.lessons.map((lesson, index) => (
                                <div 
                                    key={lesson.id} 
                                    className="flex items-center gap-3 bg-gray-50 rounded-lg p-4"
                                >
                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => handleLessonOrderChange(index, 'up')}
                                            disabled={index === 0}
                                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                        >
                                            ↑
                                        </button>
                                        <button
                                            onClick={() => handleLessonOrderChange(index, 'down')}
                                            disabled={index === course.lessons.length - 1}
                                            className="text-gray-400 hover:text-gray-600 disabled:opacity-30"
                                        >
                                            ↓
                                        </button>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-sm font-medium">
                                                {index + 1}
                                            </span>
                                            <span className="font-medium text-gray-900">{lesson.title}</span>
                                            <span className="text-xs px-2 py-1 bg-gray-200 rounded-full">
                                                {lesson.type === 'VIDEO' && 'Видео'}
                                                {lesson.type === 'TEXT' && 'Текст'}
                                                {lesson.type === 'QUIZ' && 'Тест'}
                                            </span>
                                        </div>
                                        {lesson.type === 'VIDEO' && lesson.videoUrl && (
                                            <p className="text-sm text-gray-600 truncate">{lesson.videoUrl}</p>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleDeleteLesson(lesson.id)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            {course.lessons.length === 0 && (
                                <div className="text-center py-8 text-gray-500">
                                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p>Пока нет уроков</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Settings & Actions */}
                <div className="space-y-6">
                    {/* Status Card */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Статус курса</h2>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-700">Опубликован</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="isPublished"
                                        checked={course.isPublished}
                                        onChange={handleInputChange}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>

                            {!course.isPublished && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-yellow-800">
                                                Курс находится в черновике. Студенты не видят его.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-sm text-gray-600 mb-2">Статистика:</p>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Уроков:</span>
                                        <span className="font-medium">{course.lessons.length}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Создан:</span>
                                        <span className="font-medium">
                                            {new Date(course.createdAt).toLocaleDateString('ru-RU')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-white rounded-xl border border-red-200 p-6">
                        <h2 className="text-lg font-bold text-red-700 mb-4">Опасная зона</h2>
                        
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    if (window.confirm('Вы уверены, что хотите удалить этот курс? Это действие нельзя отменить.')) {
                                        // handle delete
                                    }
                                }}
                                className="btn btn-danger w-full"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Удалить курс
                            </button>

                            <p className="text-sm text-gray-600">
                                Удаление курса приведет к удалению всех уроков, прогресса студентов и сертификатов.
                            </p>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">Быстрая статистика</h2>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-blue-50 rounded-lg p-3">
                                <div className="text-2xl font-bold text-primary mb-1">
                                    {course._count?.enrollments || 0}
                                </div>
                                <div className="text-sm text-gray-600">Студентов</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-3">
                                <div className="text-2xl font-bold text-green-600 mb-1">
                                    {course._count?.certificates || 0}
                                </div>
                                <div className="text-sm text-gray-600">Сертификатов</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}